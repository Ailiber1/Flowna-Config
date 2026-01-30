import DOMPurify from 'dompurify';

/**
 * Security utilities for Flowna Config
 * Provides XSS prevention, input validation, and sanitization
 */

// Sanitize HTML content to prevent XSS
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br', 'p', 'span'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
  });
}

// Sanitize plain text (remove all HTML)
export function sanitizeText(dirty: string): string {
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}

// Validate URL format
export function isValidUrl(url: string): boolean {
  if (!url || url.trim() === '') return true; // Empty is valid (optional field)
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Sanitize file name
export function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\-.\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '_');
}

// Validate node title (no script injection)
export function validateNodeTitle(title: string): { valid: boolean; sanitized: string; error?: string } {
  if (!title || title.trim() === '') {
    return { valid: false, sanitized: '', error: 'Title is required' };
  }
  if (title.length > 100) {
    return { valid: false, sanitized: title.slice(0, 100), error: 'Title too long (max 100 characters)' };
  }
  const sanitized = sanitizeText(title);
  return { valid: true, sanitized };
}

// Validate description
export function validateDescription(description: string): { valid: boolean; sanitized: string; error?: string } {
  if (description.length > 1000) {
    return { valid: false, sanitized: description.slice(0, 1000), error: 'Description too long (max 1000 characters)' };
  }
  const sanitized = sanitizeText(description);
  return { valid: true, sanitized };
}

// Validate API key format (basic check)
export function validateApiKey(key: string): boolean {
  // Basic validation - should be alphanumeric with some special chars, reasonable length
  if (!key || key.length < 10 || key.length > 500) return false;
  // Should not contain obvious injection patterns
  const dangerousPatterns = [/<script/i, /javascript:/i, /on\w+=/i];
  return !dangerousPatterns.some(pattern => pattern.test(key));
}

// Sanitize object for storage (deep sanitize all string values)
export function sanitizeObjectForStorage<T extends Record<string, unknown>>(obj: T): T {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeText(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item =>
        typeof item === 'string'
          ? sanitizeText(item)
          : typeof item === 'object' && item !== null
          ? sanitizeObjectForStorage(item as Record<string, unknown>)
          : item
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObjectForStorage(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized as T;
}

// Rate limiting helper (for API calls)
class RateLimiter {
  private timestamps: number[] = [];
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  canMakeRequest(): boolean {
    const now = Date.now();
    // Remove timestamps outside the window
    this.timestamps = this.timestamps.filter(t => now - t < this.windowMs);
    if (this.timestamps.length < this.maxRequests) {
      this.timestamps.push(now);
      return true;
    }
    return false;
  }

  getTimeUntilNextRequest(): number {
    if (this.timestamps.length < this.maxRequests) return 0;
    const oldestTimestamp = this.timestamps[0];
    return Math.max(0, this.windowMs - (Date.now() - oldestTimestamp));
  }
}

// Rate limiters for different services
export const firebaseRateLimiter = new RateLimiter(100, 60000); // 100 requests per minute
export const apiRateLimiter = new RateLimiter(30, 60000); // 30 requests per minute

// Validate Firebase config
export function validateFirebaseConfig(config: {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.apiKey || config.apiKey.trim() === '') {
    errors.push('API Key is required');
  } else if (!validateApiKey(config.apiKey)) {
    errors.push('Invalid API Key format');
  }

  if (!config.projectId || config.projectId.trim() === '') {
    errors.push('Project ID is required');
  }

  if (!config.authDomain || config.authDomain.trim() === '') {
    errors.push('Auth Domain is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// CSRF token generation and validation
export function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

let csrfToken: string | null = null;

export function getCsrfToken(): string {
  if (!csrfToken) {
    csrfToken = generateCsrfToken();
    sessionStorage.setItem('flowna_csrf', csrfToken);
  }
  return csrfToken;
}

export function validateCsrfToken(token: string): boolean {
  const stored = sessionStorage.getItem('flowna_csrf');
  return stored === token;
}

// Secure storage wrapper
export const secureStorage = {
  setItem(key: string, value: string): void {
    // Prefix with app name to avoid collisions
    const prefixedKey = `flowna_secure_${key}`;
    // In production, you might want to encrypt this
    localStorage.setItem(prefixedKey, value);
  },

  getItem(key: string): string | null {
    const prefixedKey = `flowna_secure_${key}`;
    return localStorage.getItem(prefixedKey);
  },

  removeItem(key: string): void {
    const prefixedKey = `flowna_secure_${key}`;
    localStorage.removeItem(prefixedKey);
  },

  // Clear all secure storage
  clear(): void {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('flowna_secure_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  },
};
