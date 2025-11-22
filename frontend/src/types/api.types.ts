/**
 * API Type Definitions
 * Comprehensive TypeScript types for all API responses and requests
 * @author Senior Developer
 * @version 1.0.0
 */

// ==================== Common Types ====================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ==================== Authentication ====================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  admin: Admin;
}

export interface Admin {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
  status?: 'ACTIVE' | 'INACTIVE';
  is_active?: boolean;
  created_at: string;
  updated_at?: string;
}

// ==================== Tenants ====================

export interface Tenant {
  id: number;
  name?: string;
  fullName?: string;
  full_name?: string;
  email: string;
  phone: string;
  property_id: number;
  admin_id: number;
  status: 'ACTIVE' | 'INACTIVE';
  rent_amount?: number;
  move_in_date?: string;
  move_out_date?: string;
  created_at: string;
  updated_at?: string;
  property?: Property;
  admin?: Admin;
}

export interface CreateTenantPayload {
  name?: string;
  fullName?: string;
  email: string;
  phone: string;
  property_id: number;
  rent_amount?: number;
  move_in_date?: string;
  move_out_date?: string;
}

export interface UpdateTenantPayload extends Partial<CreateTenantPayload> {
  status?: 'ACTIVE' | 'INACTIVE';
}

// ==================== Properties ====================

export interface Property {
  id: number;
  title?: string;
  name?: string;
  address: string;
  city: string;
  postal_code?: string;
  country?: string;
  property_type?: 'APARTMENT' | 'HOUSE' | 'STUDIO' | 'OTHER';
  rent?: number;
  monthly_rent?: number;
  description?: string;
  number_of_halls?: number;
  number_of_kitchens?: number;
  number_of_bathrooms?: number;
  number_of_parking_spaces?: number;
  number_of_rooms?: number;
  number_of_gardens?: number;
  photo?: string;
  status: 'ACTIVE' | 'INACTIVE';
  admin_id: number;
  created_at: string;
  updated_at?: string;
  photos?: PropertyPhoto[];
}

export interface PropertyPhoto {
  id: number;
  property_id: number;
  file_url: string;
  file_path: string;
  is_primary: boolean;
  created_at: string;
  updated_at?: string;
}

export interface CreatePropertyPayload {
  title: string;
  address: string;
  city: string;
  postal_code: string;
  country?: string;
  property_type: string;
  rent: number;
  description?: string;
  number_of_halls?: number;
  number_of_kitchens?: number;
  number_of_bathrooms?: number;
  number_of_parking_spaces?: number;
  number_of_rooms?: number;
  number_of_gardens?: number;
}

export interface UpdatePropertyPayload extends Partial<CreatePropertyPayload> {
  status?: 'ACTIVE' | 'INACTIVE';
}

// ==================== Bills ====================

export interface Bill {
  id: number;
  tenant_id: number;
  property_id: number;
  admin_id: number;
  amount: number;
  rent_amount?: number;
  charges?: number;
  total_amount: number;
  month: string;
  bill_date?: string;
  due_date?: string;
  payment_date?: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'RECEIPT_SENT';
  description?: string;
  created_at: string;
  updated_at?: string;
  tenant?: Tenant;
  property?: Property;
  admin?: Admin;
}

export interface BillsStats {
  total: number;
  total_amount: number;
  pending: number;
  pending_amount: number;
  paid: number;
  paid_amount: number;
  overdue: number;
  overdue_amount: number;
  statusBreakdown?: Array<{
    status: string;
    count: number;
    total_amount: number;
  }>;
}

export interface CreateBillPayload {
  tenant_id: number;
  property_id: number;
  amount: number;
  rent_amount?: number;
  charges?: number;
  month: string;
  due_date?: string;
  payment_date?: string;
  description?: string;
}

export interface UpdateBillPayload extends Partial<CreateBillPayload> {
  status?: 'PENDING' | 'PAID' | 'OVERDUE' | 'RECEIPT_SENT';
  payment_date?: string;
}

export interface BillsListParams extends PaginationParams {
  status?: string;
  search?: string;
  tenant_id?: number;
  property_id?: number;
  month?: string;
}

// ==================== Expenses ====================

export interface Expense {
  id: number;
  property_id?: number;
  admin_id: number;
  amount: number;
  type: string;
  description?: string;
  date: string;
  created_at: string;
  updated_at?: string;
  property?: Property;
  admin?: Admin;
}

export interface CreateExpensePayload {
  property_id?: number;
  amount: number;
  type: string;
  description?: string;
  date: string;
}

// ==================== Documents ====================

export interface TenantDocument {
  id: number;
  tenant_id: number;
  file_url: string;
  file_path: string;
  file_name: string;
  document_type: string;
  created_at: string;
  updated_at?: string;
}

// ==================== Analytics ====================

export interface AnalyticsOverview {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  occupancyRate: number;
  averageRent: number;
  totalProperties: number;
  activeTenants: number;
  pendingBills: number;
}

// ==================== API Method Types ====================

export interface ApiMethods {
  // Auth
  login: (credentials: LoginCredentials) => Promise<ApiResponse<LoginResponse>>;
  me: () => Promise<ApiResponse<{ admin: Admin }>>;
  
  // Admins
  listAdmins: () => Promise<ApiResponse<{ admins: Admin[] }>>;
  createAdmin: (payload: Partial<Admin>) => Promise<ApiResponse<{ admin: Admin }>>;
  updateAdmin: (id: number, payload: Partial<Admin>) => Promise<ApiResponse<{ admin: Admin }>>;
  deleteAdmin: (id: number) => Promise<ApiResponse<void>>;
  
  // Tenants
  listTenants: () => Promise<ApiResponse<Tenant[]>>;
  createTenant: (payload: CreateTenantPayload) => Promise<ApiResponse<{ tenant: Tenant }>>;
  updateTenant: (id: number, payload: UpdateTenantPayload) => Promise<ApiResponse<{ tenant: Tenant }>>;
  deleteTenantApi: (id: number) => Promise<ApiResponse<void>>;
  
  // Properties
  listProperties: () => Promise<ApiResponse<{ properties: Property[] }>>;
  createProperty: (payload: FormData) => Promise<ApiResponse<{ property: Property }>>;
  updateProperty: (id: number, payload: FormData) => Promise<ApiResponse<{ property: Property }>>;
  deleteProperty: (id: number) => Promise<ApiResponse<void>>;
  
  // Bills
  listBills: (params?: BillsListParams) => Promise<ApiResponse<{ bills: Bill[] }>>;
  getBillsStats: () => Promise<ApiResponse<BillsStats>>;
  createBill: (payload: CreateBillPayload) => Promise<ApiResponse<{ bill: Bill }>>;
  updateBill: (id: number, payload: UpdateBillPayload) => Promise<ApiResponse<{ bill: Bill }>>;
  deleteBill: (id: number) => Promise<ApiResponse<void>>;
  markBillAsPaid: (id: string) => Promise<ApiResponse<{ bill: Bill }>>;
  undoPayment: (id: string) => Promise<ApiResponse<{ bill: Bill }>>;
  
  // Expenses
  listExpenses: () => Promise<ApiResponse<Expense[]>>;
  createExpense: (payload: CreateExpensePayload) => Promise<ApiResponse<{ expense: Expense }>>;
  deleteExpense: (id: number) => Promise<ApiResponse<void>>;
}

