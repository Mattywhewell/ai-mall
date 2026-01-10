import DOMPurify from 'isomorphic-dompurify';

export interface ValidationResult {
  isValid: boolean;
  sanitizedValue?: string;
  errors: string[];
}

export interface ValidationOptions {
  maxLength?: number;
  minLength?: number;
  pattern?: RegExp;
  allowedChars?: string;
  sanitize?: boolean;
  allowHtml?: boolean;
  customValidators?: ((value: string) => string | null)[];
}

export class InputValidator {
  static validateText(input: string, options: ValidationOptions = {}): ValidationResult {
    const errors: string[] = [];
    let sanitizedValue = input;

    // Basic sanitization
    if (options.sanitize) {
      sanitizedValue = options.allowHtml
        ? DOMPurify.sanitize(input, { ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u'] })
        : input.trim();
    }

    // Length validation
    if (options.maxLength && sanitizedValue.length > options.maxLength) {
      errors.push(`Input exceeds maximum length of ${options.maxLength} characters`);
    }

    if (options.minLength && sanitizedValue.length < options.minLength) {
      errors.push(`Input must be at least ${options.minLength} characters long`);
    }

    // Pattern validation
    if (options.pattern && !options.pattern.test(sanitizedValue)) {
      errors.push('Input format is invalid');
    }

    // Character validation
    if (options.allowedChars) {
      const allowedRegex = new RegExp(`^[${options.allowedChars}]+$`);
      if (!allowedRegex.test(sanitizedValue)) {
        errors.push(`Input contains invalid characters. Only ${options.allowedChars} are allowed`);
      }
    }

    // Custom validators
    if (options.customValidators) {
      for (const validator of options.customValidators) {
        const error = validator(sanitizedValue);
        if (error) {
          errors.push(error);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      sanitizedValue,
      errors
    };
  }

  static validateEmail(email: string): ValidationResult {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return this.validateText(email, {
      maxLength: 254,
      pattern: emailRegex,
      sanitize: true,
      customValidators: [
        (value) => {
          // Additional email validation
          if (value.includes('..') || value.startsWith('.') || value.endsWith('.')) {
            return 'Invalid email format';
          }
          return null;
        }
      ]
    });
  }

  static validateURL(url: string): ValidationResult {
    try {
      const urlObj = new URL(url);
      // Only allow http and https
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return { isValid: false, errors: ['Only HTTP and HTTPS URLs are allowed'] };
      }
      return { isValid: true, sanitizedValue: url, errors: [] };
    } catch {
      return { isValid: false, errors: ['Invalid URL format'] };
    }
  }

  static validateUsername(username: string): ValidationResult {
    return this.validateText(username, {
      minLength: 3,
      maxLength: 30,
      allowedChars: 'a-zA-Z0-9_-',
      sanitize: true,
      customValidators: [
        (value) => {
          if (value.startsWith('-') || value.endsWith('-') || value.startsWith('_') || value.endsWith('_')) {
            return 'Username cannot start or end with hyphens or underscores';
          }
          if (/[-_]{2,}/.test(value)) {
            return 'Username cannot contain consecutive hyphens or underscores';
          }
          return null;
        }
      ]
    });
  }

  static validatePassword(password: string): ValidationResult {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Check for common weak passwords
    const weakPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
    if (weakPasswords.includes(password.toLowerCase())) {
      errors.push('This password is too common and easily guessable');
    }

    return {
      isValid: errors.length === 0,
      sanitizedValue: password,
      errors
    };
  }

  static validateProductDescription(description: string): ValidationResult {
    return this.validateText(description, {
      maxLength: 5000,
      allowHtml: true,
      sanitize: true,
      customValidators: [
        (value) => {
          // Check for suspicious patterns
          if (/javascript:/i.test(value) || /on\w+\s*=/i.test(value)) {
            return 'Description contains potentially malicious content';
          }
          return null;
        }
      ]
    });
  }

  static validateFileName(fileName: string): ValidationResult {
    return this.validateText(fileName, {
      maxLength: 255,
      allowedChars: 'a-zA-Z0-9._-',
      sanitize: true,
      customValidators: [
        (value) => {
          // Prevent directory traversal
          if (value.includes('..') || value.includes('/') || value.includes('\\')) {
            return 'Invalid file name';
          }
          // Check file extension safety
          const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com'];
          const extension = value.toLowerCase().substring(value.lastIndexOf('.'));
          if (dangerousExtensions.includes(extension)) {
            return 'File type not allowed';
          }
          return null;
        }
      ]
    });
  }
}