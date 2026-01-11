/**
 * Supplier Authentication Utilities
 * Helper functions for supplier-specific authentication and authorization
 */

import { getSupabaseClient } from '@/lib/supabase-server';

/**
 * Get the supplier ID for the currently authenticated user
 * This assumes suppliers are authenticated users with a supplier role
 */
export async function getSupplierId(): Promise<string | null> {
  try {
    const supabase = getSupabaseClient();

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return null;
    }

    // Check if user has supplier role and get supplier ID
    const { data: supplier, error } = await supabase
      .from('suppliers')
      .select('id')
      .eq('email', user.email)
      .single();

    if (error || !supplier) {
      return null;
    }

    return supplier.id;
  } catch (error) {
    console.error('Error getting supplier ID:', error);
    return null;
  }
}

/**
 * Check if the current user is a supplier
 */
export async function isSupplier(): Promise<boolean> {
  const supplierId = await getSupplierId();
  return supplierId !== null;
}

/**
 * Get supplier profile data
 */
export async function getSupplierProfile() {
  try {
    const supabase = getSupabaseClient();
    const supplierId = await getSupplierId();

    if (!supplierId) {
      return null;
    }

    const { data: supplier, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', supplierId)
      .single();

    if (error) {
      console.error('Error fetching supplier profile:', error);
      return null;
    }

    return supplier;
  } catch (error) {
    console.error('Error getting supplier profile:', error);
    return null;
  }
}