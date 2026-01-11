/**
 * Standardized API Response Utilities
 * Provides consistent response formats across all API endpoints
 */

export interface ApiError {
  error: string;
  code?: string;
  details?: any;
}

export interface ApiSuccess<T = any> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiListResponse<T = any> {
  success: true;
  data: T[];
  total: number;
  page?: number;
  limit?: number;
}

/**
 * Standard error responses
 */
export const API_ERRORS = {
  UNAUTHORIZED: { error: 'Authentication required', code: 'UNAUTHORIZED' },
  FORBIDDEN: { error: 'Access denied', code: 'FORBIDDEN' },
  NOT_FOUND: { error: 'Resource not found', code: 'NOT_FOUND' },
  BAD_REQUEST: { error: 'Invalid request data', code: 'BAD_REQUEST' },
  INTERNAL_ERROR: { error: 'Internal server error', code: 'INTERNAL_ERROR' },
  VALIDATION_ERROR: { error: 'Validation failed', code: 'VALIDATION_ERROR' },
  RATE_LIMITED: { error: 'Too many requests', code: 'RATE_LIMITED' },
} as const;

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  error: string,
  status: number = 500,
  code?: string,
  details?: any
): Response {
  const errorResponse: ApiError = {
    error,
    ...(code && { code }),
    ...(details && { details })
  };

  return new Response(JSON.stringify(errorResponse), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T = any>(
  data: T,
  message?: string,
  status: number = 200
): Response {
  const response: ApiSuccess<T> = {
    success: true,
    data,
    ...(message && { message })
  };

  return new Response(JSON.stringify(response), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Create a standardized list response
 */
export function createListResponse<T = any>(
  data: T[],
  total: number,
  page?: number,
  limit?: number,
  status: number = 200
): Response {
  const response: ApiListResponse<T> = {
    success: true,
    data,
    total,
    ...(page !== undefined && { page }),
    ...(limit !== undefined && { limit })
  };

  return new Response(JSON.stringify(response), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Handle Supabase errors consistently
 */
export function handleSupabaseError(error: any, operation: string): Response {
  console.error(`Error in ${operation}:`, error);

  if (error?.code === 'PGRST116') {
    return createErrorResponse('Resource not found', 404, 'NOT_FOUND');
  }

  if (error?.code === '23505') {
    return createErrorResponse('Resource already exists', 409, 'CONFLICT');
  }

  if (error?.code === '23503') {
    return createErrorResponse('Referenced resource does not exist', 400, 'BAD_REQUEST');
  }

  return createErrorResponse(
    `Failed to ${operation}`,
    500,
    'INTERNAL_ERROR',
    process.env.NODE_ENV === 'development' ? error : undefined
  );
}

/**
 * Validate required fields in request body
 */
export function validateRequiredFields(data: any, requiredFields: string[]): string | null {
  for (const field of requiredFields) {
    if (!data[field] && data[field] !== 0 && data[field] !== false) {
      return `Missing required field: ${field}`;
    }
  }
  return null;
}

/**
 * Parse JSON request body with error handling
 */
export async function parseJsonRequest(request: Request): Promise<{ data: any; error: Response | null }> {
  try {
    const data = await request.json();
    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: createErrorResponse('Invalid JSON in request body', 400, 'BAD_REQUEST')
    };
  }
}