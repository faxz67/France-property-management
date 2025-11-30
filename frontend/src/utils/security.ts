/**
 * Security Utilities
 * Professional security functions for input sanitization, validation, and protection
 * @author Senior Developer
 * @version 1.0.0
 */

/**
 * Sanitize HTML to prevent XSS attacks
 */
export function sanitizeHtml(input: string): string {
  if (!input) return '';
  
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  const reg = /[&<>"'/]/ig;
  return input.replace(reg, (match) => map[match]);
}

/**
 * Sanitize input to prevent injection attacks
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  // Remove any potential script tags or event handlers
  let sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:text\/html/gi, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  return sanitized;
}

/**
 * Validate email format with comprehensive regex
 */
export function validateEmail(email: string): boolean {
  if (!email) return false;
  
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  return emailRegex.test(email) && email.length <= 320; // RFC 5321
}

/**
 * Validate phone number (international format support)
 */
export function validatePhone(phone: string): boolean {
  if (!phone) return false;
  
  // Remove spaces, dashes, parentheses
  const cleanPhone = phone.replace(/[()\s-]/g, '');
  
  // Accept international format with + and 7-15 digits
  const phoneRegex = /^\+?[1-9]\d{6,14}$/;
  
  return phoneRegex.test(cleanPhone);
}

/**
 * Validate password strength
 */
export interface PasswordStrength {
  isValid: boolean;
  score: number; // 0-4
  feedback: string[];
}

export function validatePasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;
  
  if (!password) {
    return {
      isValid: false,
      score: 0,
      feedback: ['Le mot de passe est requis']
    };
  }
  
  // Minimum length
  if (password.length < 8) {
    feedback.push('Le mot de passe doit contenir au moins 8 caractères');
  } else {
    score++;
  }
  
  // Contains lowercase
  if (/[a-z]/.test(password)) {
    score++;
  } else {
    feedback.push('Ajoutez des lettres minuscules');
  }
  
  // Contains uppercase
  if (/[A-Z]/.test(password)) {
    score++;
  } else {
    feedback.push('Ajoutez des lettres majuscules');
  }
  
  // Contains numbers
  if (/\d/.test(password)) {
    score++;
  } else {
    feedback.push('Ajoutez des chiffres');
  }
  
  // Contains special characters (any non-alphanumeric)
  if (/[^A-Za-z0-9]/.test(password)) {
    score++;
  } else {
    feedback.push('Ajoutez des caractères spéciaux (!@#$%^&*)');
  }
  
  const isValid = password.length >= 8 && score >= 3;
  
  if (feedback.length === 0) {
    feedback.push('Mot de passe fort!');
  }
  
  return {
    isValid,
    score: Math.min(score, 4),
    feedback
  };
}

/**
 * Validate amount/price (must be positive number)
 */
export function validateAmount(amount: any): boolean {
  if (amount === null || amount === undefined || amount === '') return false;
  
  const numAmount = Number(amount);
  return !isNaN(numAmount) && numAmount > 0 && numAmount < 1000000000;
}

/**
 * Validate date format and ensure it's not in the future (for certain fields)
 */
export function validateDate(dateString: string, allowFuture = false): boolean {
  if (!dateString) return false;
  
  const date = new Date(dateString);
  const now = new Date();
  
  // Check if valid date
  if (isNaN(date.getTime())) return false;
  
  // Check if not in the future (if required)
  if (!allowFuture && date > now) return false;
  
  // Check reasonable date range (not before 1900 or after 2100)
  const year = date.getFullYear();
  if (year < 1900 || year > 2100) return false;
  
  return true;
}

/**
 * Rate Limiting - Client-side protection
 */
class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private readonly maxAttempts: number;
  private readonly timeWindow: number; // in milliseconds
  
  constructor(maxAttempts = 5, timeWindow = 60000) {
    this.maxAttempts = maxAttempts;
    this.timeWindow = timeWindow;
  }
  
  /**
   * Check if action is allowed
   */
  isAllowed(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside time window
    const recentAttempts = attempts.filter(time => now - time < this.timeWindow);
    
    // Check if under limit
    if (recentAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    // Record new attempt
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    
    return true;
  }
  
  /**
   * Get remaining attempts
   */
  getRemainingAttempts(key: string): number {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    const recentAttempts = attempts.filter(time => now - time < this.timeWindow);
    
    return Math.max(0, this.maxAttempts - recentAttempts.length);
  }
  
  /**
   * Get time until next attempt allowed (in seconds)
   */
  getTimeUntilReset(key: string): number {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    if (attempts.length === 0) return 0;
    
    const oldestAttempt = Math.min(...attempts);
    const resetTime = oldestAttempt + this.timeWindow;
    
    return Math.max(0, Math.ceil((resetTime - now) / 1000));
  }
  
  /**
   * Reset attempts for a key
   */
  reset(key: string): void {
    this.attempts.delete(key);
  }
  
  /**
   * Clear all attempts (cleanup)
   */
  clearAll(): void {
    this.attempts.clear();
  }
}

// Export singleton instances for common use cases
export const loginRateLimiter = new RateLimiter(5, 300000); // 5 attempts per 5 minutes
export const apiRateLimiter = new RateLimiter(30, 60000); // 30 requests per minute

/**
 * Generate secure random string (for CSRF tokens, etc.)
 */
export function generateSecureToken(length = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Simple encryption for sensitive data in localStorage (not for critical data)
 */
export function encryptData(data: string, key: string): string {
  // Simple XOR encryption (for demo - use proper encryption in production)
  let encrypted = '';
  for (let i = 0; i < data.length; i++) {
    encrypted += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(encrypted);
}

/**
 * Decrypt encrypted data
 */
export function decryptData(encrypted: string, key: string): string {
  try {
    const data = atob(encrypted);
    let decrypted = '';
    for (let i = 0; i < data.length; i++) {
      decrypted += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return decrypted;
  } catch {
    return '';
  }
}

/**
 * Secure storage wrapper for sensitive data
 */
export const secureStorage = {
  setItem(key: string, value: string): void {
    try {
      const encryptionKey = 'property-management-secure-key-2025'; // In production, use env variable
      const encrypted = encryptData(value, encryptionKey);
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('Failed to store secure item:', error);
    }
  },
  
  getItem(key: string): string | null {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;
      
      const encryptionKey = 'property-management-secure-key-2025';
      return decryptData(encrypted, encryptionKey);
    } catch (error) {
      console.error('Failed to retrieve secure item:', error);
      return null;
    }
  },
  
  removeItem(key: string): void {
    localStorage.removeItem(key);
  },
  
  clear(): void {
    localStorage.clear();
  }
};

/**
 * Content Security Policy (CSP) violation reporter
 */
export function reportCSPViolation(violation: any): void {
  console.error('CSP Violation:', violation);
  
  // In production, send to security monitoring service
  // fetch('/api/security/csp-report', {
  //   method: 'POST',
  //   body: JSON.stringify(violation)
  // });
}

/**
 * Detect and prevent common attack patterns
 */
export function detectAttackPattern(input: string): boolean {
  const attackPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /eval\(/i,
    /expression\(/i,
    /vbscript:/i,
    /data:text\/html/i,
  ];
  
  return attackPatterns.some(pattern => pattern.test(input));
}

/**
 * Sanitize file name to prevent directory traversal
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName) return '';
  
  // Remove path components
  fileName = fileName.replace(/^.*[\\/]/, '');
  
  // Remove potentially dangerous characters
  fileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  // Limit length
  if (fileName.length > 255) {
    const ext = fileName.substring(fileName.lastIndexOf('.'));
    fileName = fileName.substring(0, 250) + ext;
  }
  
  return fileName;
}

/**
 * Validate file type (whitelist approach)
 */
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  if (!file || !allowedTypes || allowedTypes.length === 0) return false;
  
  // Check MIME type
  if (!allowedTypes.includes(file.type)) return false;
  
  // Check file extension
  const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
  const allowedExtensions = allowedTypes.map(type => {
    const parts = type.split('/');
    return '.' + parts[parts.length - 1];
  });
  
  return allowedExtensions.some(ext => extension === ext);
}

/**
 * Validate file size
 */
export function validateFileSize(file: File, maxSizeMB = 10): boolean {
  if (!file) return false;
  
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  timestamp: string;
  userId: string | number;
  action: string;
  resource: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create audit log entry
 */
export function createAuditLog(
  userId: string | number,
  action: string,
  resource: string,
  details?: any
): AuditLogEntry {
  return {
    timestamp: new Date().toISOString(),
    userId,
    action,
    resource,
    details,
    userAgent: navigator.userAgent,
  };
}

/**
 * Store audit log (in production, send to backend)
 */
export function logAudit(entry: AuditLogEntry): void {
  console.log('[AUDIT]', entry);
  
  // In production, send to backend
  // fetch('/api/audit/log', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(entry)
  // });
}

