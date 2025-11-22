// API Types for TypeScript support

// Declare module for api.js to support named exports
declare module '../api' {
  export const login: (email: string, password: string) => Promise<any>;
  export const me: () => Promise<any>;
  export const updateProfile: (payload: any) => Promise<any>;
  export const registerAdmin: (payload: any) => Promise<any>;
  export const listAdmins: () => Promise<any>;
  export const createAdmin: (payload: any) => Promise<any>;
  export const updateAdmin: (id: string | number, payload: any) => Promise<any>;
  export const deleteAdmin: (id: string | number) => Promise<any>;
  export const listProperties: () => Promise<any>;
  export const createProperty: (data: FormData) => Promise<any>;
  export const updateProperty: (id: string | number, data: FormData) => Promise<any>;
  export const deleteProperty: (id: string | number) => Promise<any>;
  export const getPropertyPhotos: (propertyId: number) => Promise<any>;
  export const uploadPropertyPhotos: (propertyId: number, formData: FormData) => Promise<any>;
  export const deletePropertyPhoto: (propertyId: number, photoId: number) => Promise<any>;
  export const setPrimaryPropertyPhoto: (propertyId: number, photoId: number) => Promise<any>;
  export const listTenants: () => Promise<any>;
  export const createTenant: (data: any) => Promise<any>;
  export const updateTenant: (id: string | number, data: any) => Promise<any>;
  export const deleteTenant: (id: string | number) => Promise<any>;
  export const listBills: (params?: any) => Promise<any>;
  export const createBill: (data: any) => Promise<any>;
  export const updateBill: (id: string | number, data: any) => Promise<any>;
  export const deleteBill: (id: string | number) => Promise<any>;
  export const getBillsStats: () => Promise<any>;
  export const getBillById: (id: string | number) => Promise<any>;
  export const markBillAsPaid: (id: string | number) => Promise<any>;
  export const undoPayment: (id: string | number) => Promise<any>;
  export const getReceiptHistory: (id: string | number) => Promise<any>;
  export const getTotalProfit: () => Promise<any>;
  export const listExpenses: () => Promise<any>;
  export const createExpense: (data: any) => Promise<any>;
  export const deleteExpense: (id: string | number) => Promise<any>;
  export const getAnalyticsOverview: (params?: any) => Promise<any>;
  export const uploadTenantDocuments: (tenantId: number, formData: FormData) => Promise<any>;
  export const getTenantDocuments: (tenantId: number) => Promise<any>;
  export const deleteTenantDocument: (tenantId: number, documentId: number) => Promise<any>;
  export const clearCache: () => void;
  const api: any;
  export default api;
}

export interface ApiClient {
  // Properties
  listProperties: () => Promise<any>;
  createProperty: (data: FormData) => Promise<any>;
  updateProperty: (id: string | number, data: FormData) => Promise<any>;
  deleteProperty: (id: string | number) => Promise<any>;
  
  // Property Photos
  getPropertyPhotos: (propertyId: number) => Promise<any>;
  uploadPropertyPhotos: (propertyId: number, formData: FormData) => Promise<any>;
  deletePropertyPhoto: (propertyId: number, photoId: number) => Promise<any>;
  setPrimaryPropertyPhoto: (propertyId: number, photoId: number) => Promise<any>;
  
  // Tenants
  listTenants: () => Promise<any>;
  createTenant: (data: any) => Promise<any>;
  updateTenant: (id: string | number, data: any) => Promise<any>;
  deleteTenant: (id: string | number) => Promise<any>;
  
  // Bills
  listBills: (params?: any) => Promise<any>;
  createBill: (data: any) => Promise<any>;
  updateBill: (id: string | number, data: any) => Promise<any>;
  deleteBill: (id: string | number) => Promise<any>;
  getBillsStats: () => Promise<any>;
  getBillById: (id: string | number) => Promise<any>;
  markBillAsPaid: (id: string | number) => Promise<any>;
  undoPayment: (id: string | number) => Promise<any>;
  getReceiptHistory: (id: string | number) => Promise<any>;
  getTotalProfit: () => Promise<any>;
  
  // Expenses
  listExpenses: () => Promise<any>;
  createExpense: (data: any) => Promise<any>;
  updateExpense: (id: string | number, data: any) => Promise<any>;
  deleteExpense: (id: string | number) => Promise<any>;
  
  // Analytics
  getAnalyticsOverview: (params?: any) => Promise<any>;
  
  // Tenant Documents
  uploadTenantDocuments: (tenantId: number, formData: FormData) => Promise<any>;
  getTenantDocuments: (tenantId: number) => Promise<any>;
  deleteTenantDocument: (tenantId: number, documentId: number) => Promise<any>;
  
  // Admins
  listAdmins: () => Promise<any>;
  createAdmin: (data: any) => Promise<any>;
  updateAdmin: (id: string | number, data: any) => Promise<any>;
  deleteAdmin: (id: string | number) => Promise<any>;
  getAdmins: () => Promise<any>;
  addAdmin: (data: any) => Promise<any>;
  
  // Auth
  login: (credentials: any) => Promise<any>;
  logout: () => Promise<any>;
  getCurrentUser: () => Promise<any>;
  me: () => Promise<any>;
  updateProfile: (data: any) => Promise<any>;
  registerAdmin: (data: any) => Promise<any>;
  
  // Generic methods
  get: (url: string, config?: any) => Promise<any>;
  post: (url: string, data?: any, config?: any) => Promise<any>;
  put: (url: string, data?: any, config?: any) => Promise<any>;
  delete: (url: string, config?: any) => Promise<any>;
}

// Declare the default export from api.js
declare const apiClient: ApiClient;
export default apiClient;

// Declare named exports from api.js
export declare const login: (email: string, password: string) => Promise<any>;
export declare const me: () => Promise<any>;
export declare const updateProfile: (payload: any) => Promise<any>;
export declare const registerAdmin: (payload: any) => Promise<any>;
export declare const listAdmins: () => Promise<any>;
export declare const createAdmin: (payload: any) => Promise<any>;
export declare const updateAdmin: (id: string | number, payload: any) => Promise<any>;
export declare const deleteAdmin: (id: string | number) => Promise<any>;
export declare const listProperties: () => Promise<any>;
export declare const createProperty: (data: FormData) => Promise<any>;
export declare const updateProperty: (id: string | number, data: FormData) => Promise<any>;
export declare const deleteProperty: (id: string | number) => Promise<any>;
export declare const getPropertyPhotos: (propertyId: number) => Promise<any>;
export declare const uploadPropertyPhotos: (propertyId: number, formData: FormData) => Promise<any>;
export declare const deletePropertyPhoto: (propertyId: number, photoId: number) => Promise<any>;
export declare const setPrimaryPropertyPhoto: (propertyId: number, photoId: number) => Promise<any>;
export declare const listTenants: () => Promise<any>;
export declare const createTenant: (data: any) => Promise<any>;
export declare const updateTenant: (id: string | number, data: any) => Promise<any>;
export declare const deleteTenant: (id: string | number) => Promise<any>;
export declare const listBills: (params?: any) => Promise<any>;
export declare const createBill: (data: any) => Promise<any>;
export declare const updateBill: (id: string | number, data: any) => Promise<any>;
export declare const deleteBill: (id: string | number) => Promise<any>;
export declare const getBillsStats: () => Promise<any>;
export declare const getBillById: (id: string | number) => Promise<any>;
export declare const markBillAsPaid: (id: string | number) => Promise<any>;
export declare const undoPayment: (id: string | number) => Promise<any>;
export declare const getReceiptHistory: (id: string | number) => Promise<any>;
export declare const getTotalProfit: () => Promise<any>;
export declare const listExpenses: () => Promise<any>;
export declare const createExpense: (data: any) => Promise<any>;
export declare const deleteExpense: (id: string | number) => Promise<any>;
export declare const getAnalyticsOverview: (params?: any) => Promise<any>;
export declare const uploadTenantDocuments: (tenantId: number, formData: FormData) => Promise<any>;
export declare const getTenantDocuments: (tenantId: number) => Promise<any>;
export declare const deleteTenantDocument: (tenantId: number, documentId: number) => Promise<any>;
export declare const clearCache: () => void;