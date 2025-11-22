/**
 * API Configuration
 * Centralized configuration for API endpoints and settings
 * @author Senior Developer
 * @version 1.0.0
 */

export const API_CONFIG = {
  // Base URLs
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://192.168.1.109:4002/api',
  
  // Timeouts (in milliseconds)
  TIMEOUT: {
    DEFAULT: 15000,
    UPLOAD: 30000,
    DOWNLOAD: 30000,
  },
  
  // Retry configuration
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY: 1000,
    BACKOFF_MULTIPLIER: 2,
    RETRYABLE_STATUS_CODES: [408, 429, 500, 502, 503, 504],
  },
  
  // Cache configuration
  CACHE: {
    TTL: 5 * 60 * 1000, // 5 minutes
    MAX_ENTRIES: 100,
  },
  
  // Headers
  HEADERS: {
    ACCEPT: 'application/json',
    CONTENT_TYPE: 'application/json',
  },
  
  // Status codes
  STATUS: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
  },
} as const;

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    REFRESH: '/auth/refresh',
  },
  
  // Admins
  ADMINS: {
    LIST: '/admins',
    CREATE: '/admins',
    UPDATE: (id: number | string) => `/admins/${id}`,
    DELETE: (id: number | string) => `/admins/${id}`,
  },
  
  // Tenants
  TENANTS: {
    LIST: '/tenants',
    CREATE: '/tenants',
    UPDATE: (id: number | string) => `/tenants/${id}`,
    DELETE: (id: number | string) => `/tenants/${id}`,
    DOCUMENTS: (id: number | string) => `/tenants/${id}/documents`,
  },
  
  // Properties
  PROPERTIES: {
    LIST: '/properties',
    CREATE: '/properties',
    UPDATE: (id: number | string) => `/properties/${id}`,
    DELETE: (id: number | string) => `/properties/${id}`,
    PHOTOS: (id: number | string) => `/properties/${id}/photos`,
    PHOTO: (propertyId: number | string, photoId: number | string) => `/properties/${propertyId}/photos/${photoId}`,
  },
  
  // Bills
  BILLS: {
    LIST: '/bills',
    CREATE: '/bills',
    GET: (id: number | string) => `/bills/${id}`,
    UPDATE: (id: number | string) => `/bills/${id}`,
    DELETE: (id: number | string) => `/bills/${id}`,
    PAY: (id: number | string) => `/bills/${id}/pay`,
    UNDO: (id: number | string) => `/bills/${id}/undo`,
    STATS: '/bills/stats',
    RECEIPTS: (id: number | string) => `/bills/${id}/receipts`,
    PROFIT: '/bills/profits/total',
  },
  
  // Expenses
  EXPENSES: {
    LIST: '/expenses',
    CREATE: '/expenses',
    DELETE: (id: number | string) => `/expenses/${id}`,
  },
  
  // Analytics
  ANALYTICS: {
    OVERVIEW: '/analytics/overview',
  },
} as const;

/**
 * Get API base URL with fallback
 */
export const getApiBaseUrl = (): string => {
  return API_CONFIG.BASE_URL;
};

/**
 * Check if status code is retryable
 */
export const isRetryableStatus = (status: number): boolean => {
  return (API_CONFIG.RETRY.RETRYABLE_STATUS_CODES as readonly number[]).includes(status);
};

/**
 * Calculate retry delay with exponential backoff
 */
export const getRetryDelay = (attemptNumber: number): number => {
  return API_CONFIG.RETRY.DELAY * Math.pow(API_CONFIG.RETRY.BACKOFF_MULTIPLIER, attemptNumber - 1);
};

