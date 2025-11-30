// TypeScript declarations for dataService.js

export interface DataService {
  cache: Map<string, any>;
  cacheTimeout: number;
  refreshInterval: NodeJS.Timeout | null;
  isRefreshing: boolean;

  isCacheValid(key: string): boolean;
  getCachedData(key: string): any;
  setCachedData(key: string, data: any): void;
  clearCache(): void;
  startAutoRefresh(interval?: number): void;
  stopAutoRefresh(): void;
  refreshAllData(): Promise<void>;
  fetchProperties(): Promise<any[]>;
  fetchTenants(): Promise<any[]>;
  fetchBills(filters?: any): Promise<any[]>;
  fetchBillsStats(): Promise<any>;
  fetchExpenses(): Promise<any[]>;
  getBillStatusFrench(status: string): string;
  getBillPriority(status: string, isOverdue: boolean, daysUntilDue: number): string;
  getExpenseCategoryFrench(category: string): string;
  getDashboardSummary(): Promise<any>;
  getNewBillDefaults(): any;
  normalizePhotoUrl(photoUrl: string): string | null;
  getBackendBaseUrl(): string;
  formatAddress(property: any): string;
  getSystemStatus(): any;
}

declare const dataService: DataService;
export default dataService;
