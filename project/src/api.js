import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api',
    withCredentials: true,
    timeout: 30000, // Increase timeout for development
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');

        // Log request details in development
        if (import.meta.env.DEV) {
            console.log('API Request:', {
                url: config.url,
                hasToken: !!token,
                method: config.method,
                headers: config.headers
            });
        }

        // Don't set Content-Type for FormData
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }

        // Add auth token if available
        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Network error
        if (!error.response) {
            console.error('Network error:', error);
            return Promise.reject(new Error('Network error. Please check your connection.'));
        }

        // API error with response
        const errorMessage = error.response.data?.error || 'An unexpected error occurred';
        if (import.meta.env.DEV) {
            console.error('API error:', {
                status: error.response.status,
                message: errorMessage,
                url: error.config?.url,
                method: error.config?.method
            });
        }

        // Handle 401 Unauthorized
        if (error.response.status === 401) {
            console.log('Authentication expired, redirecting to login');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/';
        }

        // Enhance error object with friendly message
        error.userMessage = errorMessage;
        return Promise.reject(error);
    }
);

// Auth
export const login = (email, password) => api.post('/auth/login', { email, password });
export const me = () => api.get('/auth/me');
export const registerAdmin = (payload) => api.post('/auth/register', payload);

// Admins (super admin)
export const listAdmins = () => api.get('/admins');
export const createAdmin = (payload) => api.post('/admins', payload);
export const deleteAdmin = (id) => api.delete(`/admins/${id}`);
export const updateAdmin = (id, payload) => api.put(`/admins/${id}`, payload);

// Aliases matching requested names
export const getAdmins = () => listAdmins();
export const addAdmin = (payload) => createAdmin(payload);

// Tenants (admin/super)
export const listTenants = () => api.get('/tenants');
export const createTenant = (payload) => api.post('/tenants', payload);
export const updateTenant = (id, payload) => api.put(`/tenants/${id}`, payload);
export const deleteTenantApi = (id) => api.delete(`/tenants/${id}`);

// Properties (admin)
export const listProperties = () => api.get('/properties');
// Let axios/browser set the Content-Type (including the multipart boundary) when sending FormData
export const createProperty = (payload) => api.post('/properties', payload);
export const updateProperty = (id, payload) => api.put(`/properties/${id}`, payload);
export const deleteProperty = (id) => api.delete(`/properties/${id}`);

// Aggregate the exported helper functions into a default API object so
// components that import the default `api` can call `api.listProperties()` etc.
const apiClient = {
    // Auth
    login,
    me,
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

    // Raw axios instance for advanced use
    raw: api,
};

export default apiClient;
