/**
 * Custom API Error Classes
 * Professional error handling with specific error types
 * @author Senior Developer
 * @version 1.0.0
 */

/**
 * Base API Error class
 */
export class ApiError extends Error {
  public readonly status?: number;
  public readonly code?: string;
  public readonly details?: any;
  public readonly timestamp: Date;

  constructor(message: string, status?: number, code?: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.timestamp = new Date();
    
    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp.toISOString(),
    };
  }
}

/**
 * Network Error - Connection issues
 */
export class NetworkError extends ApiError {
  constructor(message: string = 'Erreur de connexion réseau', details?: any) {
    super(message, undefined, 'NETWORK_ERROR', details);
    this.name = 'NetworkError';
  }
}

/**
 * Authentication Error - 401
 */
export class AuthenticationError extends ApiError {
  constructor(message: string = 'Session expirée. Veuillez vous reconnecter.', details?: any) {
    super(message, 401, 'AUTHENTICATION_ERROR', details);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization Error - 403
 */
export class AuthorizationError extends ApiError {
  constructor(message: string = 'Accès refusé. Permissions insuffisantes.', details?: any) {
    super(message, 403, 'AUTHORIZATION_ERROR', details);
    this.name = 'AuthorizationError';
  }
}

/**
 * Not Found Error - 404
 */
export class NotFoundError extends ApiError {
  constructor(message: string = 'Ressource non trouvée.', details?: any) {
    super(message, 404, 'NOT_FOUND_ERROR', details);
    this.name = 'NotFoundError';
  }
}

/**
 * Validation Error - 422
 */
export class ValidationError extends ApiError {
  constructor(message: string = 'Erreur de validation des données.', details?: any) {
    super(message, 422, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

/**
 * Conflict Error - 409
 */
export class ConflictError extends ApiError {
  constructor(message: string = 'Conflit. La ressource existe déjà.', details?: any) {
    super(message, 409, 'CONFLICT_ERROR', details);
    this.name = 'ConflictError';
  }
}

/**
 * Rate Limit Error - 429
 */
export class RateLimitError extends ApiError {
  public readonly retryAfter?: number;

  constructor(message: string = 'Trop de requêtes. Veuillez réessayer plus tard.', retryAfter?: number, details?: any) {
    super(message, 429, 'RATE_LIMIT_ERROR', details);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Server Error - 500
 */
export class ServerError extends ApiError {
  constructor(message: string = 'Erreur serveur. Veuillez réessayer plus tard.', details?: any) {
    super(message, 500, 'SERVER_ERROR', details);
    this.name = 'ServerError';
  }
}

/**
 * Timeout Error
 */
export class TimeoutError extends ApiError {
  constructor(message: string = 'Délai d\'attente dépassé. Veuillez réessayer.', details?: any) {
    super(message, 408, 'TIMEOUT_ERROR', details);
    this.name = 'TimeoutError';
  }
}

/**
 * Parse Error Response and create appropriate error instance
 */
export function parseApiError(error: any): ApiError {
  // Network error (no response)
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return new TimeoutError('Requête expirée. Vérifiez votre connexion.');
    }
    if (error.code === 'ERR_NETWORK') {
      return new NetworkError('Erreur réseau. Vérifiez votre connexion internet.');
    }
    return new NetworkError('Impossible de joindre le serveur.');
  }

  const { status, data } = error.response;
  const message = data?.error || data?.message || error.message;
  const details = data?.details;

  // Map status codes to specific errors
  switch (status) {
    case 401:
      return new AuthenticationError(message, details);
    case 403:
      return new AuthorizationError(message, details);
    case 404:
      return new NotFoundError(message, details);
    case 409:
      return new ConflictError(message, details);
    case 422:
      return new ValidationError(message, details);
    case 429:
      {
        const retryAfter = parseInt(error.response.headers['retry-after'] || '60');
        return new RateLimitError(message, retryAfter, details);
      }
    case 500:
    case 502:
    case 503:
    case 504:
      return new ServerError(message, details);
    default:
      return new ApiError(message, status, 'UNKNOWN_ERROR', details);
  }
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: ApiError): boolean {
  const retryableStatuses = [408, 429, 500, 502, 503, 504];
  return error.status ? retryableStatuses.includes(error.status) : false;
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: ApiError): string {
  if (error instanceof ValidationError && error.details) {
    const fieldErrors = Object.entries(error.details)
      .map(([field, message]) => `${field}: ${message}`)
      .join('\n');
    return `${error.message}\n\n${fieldErrors}`;
  }

  return error.message;
}

