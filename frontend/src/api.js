import axios from 'axios';
import { API_CONFIG, API_ENDPOINTS } from './config/api.config';
import { logger } from './utils/logger';
import { parseApiError } from './utils/apiErrors';
import { createRetryInterceptor } from './utils/apiRetry';

// API Configuration
const apiBaseURL = API_CONFIG.BASE_URL;
logger.info('API initialized', { baseURL: apiBaseURL });

const api = axios.create({
    baseURL: apiBaseURL,
    withCredentials: true,
    timeout: API_CONFIG.TIMEOUT.DEFAULT,
    headers: {
        'Accept': API_CONFIG.HEADERS.ACCEPT,
        'Content-Type': API_CONFIG.HEADERS.CONTENT_TYPE
    },
    decompress: true,
    maxRedirects: 3,
    validateStatus: (status) => status < 500
});

// Add retry interceptor for automatic retry on failures
createRetryInterceptor(api);

// Request interceptor with performance optimizations
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');

        // Add request timestamp for performance monitoring
        config.metadata = { startTime: Date.now() };

        // Log request details
        logger.apiRequest(config.method || 'GET', config.url || '', {
            hasToken: !!token,
            contentType: config.headers?.['Content-Type']
        });

        // Don't set Content-Type for FormData (browser sets it with boundary)
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }

        // Add auth token if available
        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Add request ID for tracing
        config.headers['X-Request-ID'] = `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

        return config;
    },
    (error) => {
        logger.error('Request interceptor error', error);
        return Promise.reject(parseApiError(error));
    }
);

// Response interceptor with performance monitoring and error handling
api.interceptors.response.use(
    (response) => {
        // Log performance metrics
        if (response.config.metadata) {
            const duration = Date.now() - response.config.metadata.startTime;
            logger.apiResponse(
                response.config.method || 'GET',
                response.config.url || '',
                duration,
                response.status
            );
            
            // Warn on slow requests
            if (duration > 3000) {
                logger.warn('Slow API response detected', {
                    url: response.config.url,
                    duration: `${duration}ms`
                });
            }
        }
        return response;
    },
    (error) => {
        // Log error with performance metrics
        if (error.config?.metadata) {
            const duration = Date.now() - error.config.metadata.startTime;
            logger.apiError(
                error.config.method || 'GET',
                error.config.url || '',
                error,
                { duration: `${duration}ms`, status: error.response?.status }
            );
        }

        // Parse error into our custom error classes
        const apiError = parseApiError(error);

        // Handle authentication errors (redirect to login)
        // But don't redirect if we're already on the login page or making a login request
        if (apiError.status === 401) {
            const isLoginRequest = error.config?.url?.includes('/auth/login');
            const isLoginPage = window.location.pathname === '/' || window.location.pathname === '/login';
            
            // Only redirect if it's not a login request and not already on login page
            if (!isLoginRequest && !isLoginPage) {
                logger.warn('Authentication expired, redirecting to login');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/';
            }
        }

        // Attach user-friendly message to error for components
        error.userMessage = apiError.message;
        error.apiError = apiError;

        return Promise.reject(error);
    }
);

// Simple cache implementation for API responses
const cache = new Map();
const CACHE_DURATION = 0; // Disable caching for now

const getCachedData = (key) => {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }
    cache.delete(key);
    return null;
};

const setCachedData = (key, data) => {
    cache.set(key, {
        data,
        timestamp: Date.now()
    });
};

// Clear cache when user logs out
export const clearCache = () => {
    cache.clear();
    console.log('API cache cleared');
};

// Auth
export const login = (email, password) => api.post('/auth/login', { email, password });
// Backend exposes profile at /auth/profile
export const me = () => {
    return api.get('/auth/profile');
};
export const updateProfile = (payload) => {
    // Clear profile cache when updating
    cache.delete('user_profile');
    return api.put('/auth/profile', payload);
};
export const changePassword = (payload) => {
    // Clear profile cache when changing password
    cache.delete('user_profile');
    return api.post('/auth/change-password', payload);
};
export const registerAdmin = (payload) => api.post('/auth/register', payload);

// Admins (super admin)
export const listAdmins = () => {
    return api.get('/admins');
};
export const createAdmin = (payload) => {
    cache.delete('admins_list'); // Clear cache when creating
    return api.post('/admins', payload);
};
export const deleteAdmin = (id) => {
    cache.delete('admins_list'); // Clear cache when deleting
    return api.delete(`/admins/${id}`);
};
export const updateAdmin = (id, payload) => {
    cache.delete('admins_list'); // Clear cache when updating
    return api.put(`/admins/${id}`, payload);
};

// Aliases matching requested names
export const getAdmins = () => listAdmins();
export const addAdmin = (payload) => createAdmin(payload);

// Tenants (admin/super)
export const listTenants = () => {
    console.log('🔧 API: listTenants called');
    console.log('🔧 Token present:', !!localStorage.getItem('token'));
    return api.get('/tenants');
};
export const createTenant = (payload) => {
    cache.delete('tenants_list');
    return api.post('/tenants', payload);
};
export const updateTenant = (id, payload) => {
    cache.delete('tenants_list');
    return api.put(`/tenants/${id}`, payload);
};
export const deleteTenantApi = (id) => {
    cache.delete('tenants_list');
    return api.delete(`/tenants/${id}`);
};

// Tenant Documents
export const uploadTenantDocuments = (tenantId, formData) => {
    return api.post(`/tenants/${tenantId}/documents`, formData);
};
export const getTenantDocuments = (tenantId) => {
    return api.get(`/tenants/${tenantId}/documents`);
};
export const deleteTenantDocument = (tenantId, documentId) => {
    return api.delete(`/tenants/${tenantId}/documents/${documentId}`);
};
export const updateTenantDocumentType = (tenantId, documentId, documentType) => {
    return api.put(`/tenants/${tenantId}/documents/${documentId}`, { document_type: documentType });
};

// Properties (admin)
export const listProperties = () => {
    console.log('🔧 API: listProperties called');
    console.log('🔧 Token present:', !!localStorage.getItem('token'));
    return api.get('/properties');
};
// Let axios/browser set the Content-Type (including the multipart boundary) when sending FormData
export const createProperty = (payload) => {
    cache.delete('properties_list');
    return api.post('/properties', payload);
};
export const updateProperty = (id, payload) => {
    cache.delete('properties_list');
    return api.put(`/properties/${id}`, payload);
};
export const deleteProperty = (id) => {
    cache.delete('properties_list');
    return api.delete(`/properties/${id}`);
};

// Property Photos
export const uploadPropertyPhotos = (propertyId, formData) => {
    return api.post(`/properties/${propertyId}/photos`, formData);
};
export const getPropertyPhotos = (propertyId) => {
    return api.get(`/properties/${propertyId}/photos`);
};
export const deletePropertyPhoto = (propertyId, photoId) => {
    return api.delete(`/properties/${propertyId}/photos/${photoId}`);
};
export const setPrimaryPropertyPhoto = (propertyId, photoId) => {
    return api.put(`/properties/${propertyId}/photos/${photoId}/primary`);
};

// Bills (admin)
export const listBills = (params = {}) => {
    return api.get('/bills', { params });
};
export const getBillsStats = () => {
    return api.get('/bills/stats');
};
export const getBillById = (id) => {
    return api.get(`/bills/${id}`);
};
export const createBill = (payload) => {
    // Clear all bill-related caches
    cache.delete('bills_stats');
    Array.from(cache.keys()).forEach(key => {
        if (key.startsWith('bills_list_')) cache.delete(key);
    });
    return api.post('/bills', payload);
};
export const updateBill = (id, payload) => {
    cache.delete(`bill_${id}`);
    cache.delete('bills_stats');
    Array.from(cache.keys()).forEach(key => {
        if (key.startsWith('bills_list_')) cache.delete(key);
    });
    return api.put(`/bills/${id}`, payload);
};
export const generateBillsForCurrentAdmin = (month) => {
    // Clear all bill-related caches
    cache.delete('bills_stats');
    Array.from(cache.keys()).forEach(key => {
        if (key.startsWith('bills_list_')) cache.delete(key);
    });
    return api.post('/bills/generate-admin', { month });
};
export const deleteBill = (id) => {
    cache.delete(`bill_${id}`);
    cache.delete('bills_stats');
    Array.from(cache.keys()).forEach(key => {
        if (key.startsWith('bills_list_')) cache.delete(key);
    });
    return api.delete(`/bills/${id}`);
};
export const getReceiptHistory = (id) => api.get(`/bills/${id}/receipts`);
export const markBillAsPaid = (id) => {
    cache.delete(`bill_${id}`);
    cache.delete('bills_stats');
    cache.delete('profits_total');
    Array.from(cache.keys()).forEach(key => {
        if (key.startsWith('bills_list_')) cache.delete(key);
    });
    return api.put(`/bills/${id}/pay`);
};

export const undoPayment = (id) => {
    cache.delete(`bill_${id}`);
    cache.delete('bills_stats');
    cache.delete('profits_total');
    Array.from(cache.keys()).forEach(key => {
        if (key.startsWith('bills_list_')) cache.delete(key);
    });
    return api.put(`/bills/${id}/undo`);
};

export const getTotalProfit = () => api.get('/bills/profits/total');

// Analytics
export const getAnalyticsOverview = (params = {}) => {
    return api.get('/analytics/overview', { params });
};

// Expenses
export const createExpense = (payload) => {
    cache.delete('expenses_list');
    return api.post('/expenses', payload);
};
export const listExpenses = () => {
    return api.get('/expenses');
};
export const deleteExpense = (id) => {
    cache.delete('expenses_list');
    return api.delete(`/expenses/${id}`);
};

// Aggregate the exported helper functions into a default API object so
// components that import the default `api` can call `api.listProperties()` etc.
const apiClient = {
    // Auth
    login,
    me,
    updateProfile,
    changePassword,
    registerAdmin,

    // Admins
    listAdmins,
    createAdmin,
    deleteAdmin,
    updateAdmin,
    getAdmins,
    addAdmin,

    // Tenants
    listTenants,
    createTenant,
    updateTenant,
    deleteTenantApi,

    // Properties
    listProperties,
    createProperty,
    updateProperty,
    deleteProperty,

    // Property Photos
    uploadPropertyPhotos,
    getPropertyPhotos,
    deletePropertyPhoto,
    setPrimaryPropertyPhoto,

    // Tenant Documents
    uploadTenantDocuments,
    getTenantDocuments,
    deleteTenantDocument,
    updateTenantDocumentType,

    // Bills
    listBills,
    getBillsStats,
    getBillById,
    createBill,
    updateBill,
    deleteBill,
    getReceiptHistory,
    markBillAsPaid,
    undoPayment,
    getTotalProfit,
    generateBillsForCurrentAdmin,

    // Analytics
    getAnalyticsOverview,

    // Expenses
    createExpense,
    listExpenses,
    deleteExpense,

    // Raw axios instance for advanced use
    raw: api,
};

export default apiClient;
