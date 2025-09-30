declare module '../api.js' {
  interface ApiClient {
    login: (email: string, password: string) => Promise<any>;
    me: () => Promise<any>;
    registerAdmin: (payload: any) => Promise<any>;
    listAdmins: () => Promise<any>;
    createAdmin: (payload: any) => Promise<any>;
    deleteAdmin: (id: number | string) => Promise<any>;
    updateAdmin: (id: number | string, payload: any) => Promise<any>;
    getAdmins: () => Promise<any>;
    addAdmin: (payload: any) => Promise<any>;
    listTenants: () => Promise<any>;
    createTenant: (payload: any) => Promise<any>;
    updateTenant: (id: number | string, payload: any) => Promise<any>;
    deleteTenantApi: (id: number | string) => Promise<any>;
    listProperties: () => Promise<any>;
    createProperty: (payload: any) => Promise<any>;
    updateProperty: (id: number | string, payload: any) => Promise<any>;
    deleteProperty: (id: number | string) => Promise<any>;
    raw: any;
  }
  
  const api: ApiClient;
  export default api;
  
  export const login: (email: string, password: string) => Promise<any>;
  export const me: () => Promise<any>;
  export const registerAdmin: (payload: any) => Promise<any>;
  export const listAdmins: () => Promise<any>;
  export const createAdmin: (payload: any) => Promise<any>;
  export const deleteAdmin: (id: number | string) => Promise<any>;
  export const updateAdmin: (id: number | string, payload: any) => Promise<any>;
  export const getAdmins: () => Promise<any>;
  export const addAdmin: (payload: any) => Promise<any>;
  export const listTenants: () => Promise<any>;
  export const createTenant: (payload: any) => Promise<any>;
  export const updateTenant: (id: number | string, payload: any) => Promise<any>;
  export const deleteTenantApi: (id: number | string) => Promise<any>;
  export const listProperties: () => Promise<any>;
  export const createProperty: (payload: any) => Promise<any>;
  export const updateProperty: (id: number | string, payload: any) => Promise<any>;
  export const deleteProperty: (id: number | string) => Promise<any>;
}
