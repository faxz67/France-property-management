// Data Service for Automatic Data Fetching with French Dates

import api from '../api';
import { 
  formatFrenchDate, 
  getCurrentFrenchDateTime,
  isOverdue,
  getDaysUntilDue,
  formatFrenchCurrency
} from '../utils/dateUtils';
import { normalizePhotoUrl, getBackendBaseUrl } from '../utils/imageUtils';

/**
 * Enhanced data service with automatic fetching and French formatting
 */
class DataService {
  private cache: Map<string, { data: any; timestamp: number }>;
  private cacheTimeout: number;
  private refreshInterval: number | null;
  private isRefreshing: boolean;

  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
    this.refreshInterval = null;
    this.isRefreshing = false;
  }

  /**
   * Check if data is cached and still valid
   * @param {string} key - Cache key
   * @returns {boolean} True if data is cached and valid
   */
  isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    return Date.now() - cached.timestamp < this.cacheTimeout;
  }

  /**
   * Get cached data
   * @param {string} key - Cache key
   * @returns {any} Cached data or null
   */
  getCachedData(key: string): any {
    const cached = this.cache.get(key);
    return cached ? cached.data : null;
  }

  /**
   * Set cached data
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   */
  setCachedData(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Start automatic data refresh
   * @param {number} interval - Refresh interval in milliseconds (default: 2 minutes)
   */
  startAutoRefresh(interval = 2 * 60 * 1000) {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    
    this.refreshInterval = setInterval(() => {
      this.refreshAllData();
    }, interval);
    
    console.log('🔄 Auto-refresh started with interval:', interval / 1000, 'seconds');
  }

  /**
   * Stop automatic data refresh
   */
  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
      console.log('⏹️ Auto-refresh stopped');
    }
  }

  /**
   * Refresh all data
   */
  async refreshAllData() {
    if (this.isRefreshing) return;
    
    this.isRefreshing = true;
    console.log('🔄 Refreshing all data...');
    
    try {
      // Use Promise.allSettled to refresh all data even if some fail
      const results = await Promise.allSettled([
        this.fetchProperties(),
        this.fetchTenants(),
        this.fetchBills(),
        this.fetchBillsStats(),
        this.fetchExpenses()
      ]);
      
      // Log any failures
      const apiNames = ['Properties', 'Tenants', 'Bills', 'Stats', 'Expenses'];
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.warn(`⚠️  ${apiNames[index]} refresh failed:`, result.reason);
        }
      });
      
      console.log('✅ Data refresh completed');
    } catch (error) {
      console.error('❌ Error refreshing data:', error);
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Fetch properties with French formatting and photos
   */
  async fetchProperties() {
    const cacheKey = 'properties';
    
    if (this.isCacheValid(cacheKey)) {
      return this.getCachedData(cacheKey);
    }

    try {
      console.log('🏠 Fetching properties with photos...');
      const response = await (api as any).listProperties();
      
      if (response.data?.success && response.data?.data?.properties) {
        const properties = await Promise.all(
          response.data.data.properties.map(async (property: any) => {
            // Fetch photos for each property
            let photos = [];
            try {
              const photosResponse = await (api as any).getPropertyPhotos(property.id);
              if (photosResponse.data?.success && photosResponse.data?.data?.photos) {
                photos = photosResponse.data.data.photos.map((photo: any) => ({
                  ...photo,
                  // Normalize photo URL for display
                  display_url: normalizePhotoUrl(photo.file_url),
                  // Add French formatted dates
                  created_at_fr: formatFrenchDate(photo.created_at),
                  updated_at_fr: photo.updated_at ? formatFrenchDate(photo.updated_at) : null
                }));
              }
            } catch (photoError) {
              console.warn(`⚠️ Could not fetch photos for property ${property.id}:`, photoError);
            }

            return {
              ...property,
              // Add photos
              photos: photos,
              primary_photo: photos.find((photo: any) => photo.is_primary) || photos[0] || null,
              // Add French formatted dates
              created_at_fr: formatFrenchDate(property.created_at),
              updated_at_fr: (property as any).updated_at ? formatFrenchDate((property as any).updated_at) : null,
              // Format currency
              rent_formatted: formatFrenchCurrency((property as any).rent || property.monthly_rent || 0),
              // Add status indicators
              is_active: (property as any).status === 'ACTIVE',
              status_fr: (property as any).status === 'ACTIVE' ? 'Actif' : 'Inactif',
              // Add display information
              display_title: property.title || (property as any).name || 'Propriété sans nom',
              display_address: this.formatAddress(property),
              // Add photo count
              photo_count: photos.length,
              has_photos: photos.length > 0
            };
          })
        );
        
        this.setCachedData(cacheKey, properties);
        console.log('✅ Properties fetched with photos:', properties.length);
        return properties;
      }
      
      throw new Error('Invalid response structure');
    } catch (error) {
      console.error('❌ Error fetching properties:', error);
      throw error;
    }
  }

  /**
   * Fetch tenants with French formatting
   */
  async fetchTenants() {
    const cacheKey = 'tenants';
    
    if (this.isCacheValid(cacheKey)) {
      return this.getCachedData(cacheKey);
    }

    try {
      console.log('👥 Fetching tenants...');
      const response = await (api as any).listTenants();
      
      if (response.data?.success && response.data?.data?.tenants) {
        const tenants = response.data.data.tenants.map((tenant: any) => ({
          ...tenant,
          // Add French formatted dates
          created_at_fr: formatFrenchDate(tenant.created_at),
          updated_at_fr: (tenant as any).updated_at ? formatFrenchDate((tenant as any).updated_at) : null,
          move_in_date_fr: (tenant as any).move_in_date ? formatFrenchDate((tenant as any).move_in_date) : null,
          move_out_date_fr: (tenant as any).move_out_date ? formatFrenchDate((tenant as any).move_out_date) : null,
          // Format currency
          rent_amount_formatted: (tenant as any).rent_amount ? formatFrenchCurrency((tenant as any).rent_amount) : null,
          // Add status indicators
          is_active: (tenant as any).status === 'ACTIVE' || (tenant as any).is_active === true,
          status_fr: (tenant as any).status === 'ACTIVE' || (tenant as any).is_active === true ? 'Actif' : 'Inactif',
          // Add display name
          display_name: (tenant as any).fullName || (tenant as any).full_name || tenant.name || 'Locataire'
        }));
        
        this.setCachedData(cacheKey, tenants);
        console.log('✅ Tenants fetched:', tenants.length);
        return tenants;
      }
      
      throw new Error('Invalid response structure');
    } catch (error) {
      console.error('❌ Error fetching tenants:', error);
      throw error;
    }
  }

  /**
   * Fetch bills with French formatting and status analysis
   */
  async fetchBills(filters = {}) {
    const cacheKey = `bills_${JSON.stringify(filters)}`;
    
    if (this.isCacheValid(cacheKey)) {
      return this.getCachedData(cacheKey);
    }

    try {
      console.log('💳 Fetching bills...');
      const response = await (api as any).listBills(filters);
      
      if (response.data?.success && response.data?.data?.bills) {
        const bills = response.data.data.bills.map((bill: any) => {
          const paymentDate = (bill as any).payment_date ? new Date((bill as any).payment_date) : null;
          const isOverdueBill = isOverdue((bill as any).due_date);
          const daysUntilDue = getDaysUntilDue((bill as any).due_date);
          
          return {
            ...bill,
            // Add French formatted dates
            created_at_fr: formatFrenchDate(bill.created_at),
            due_date_fr: formatFrenchDate((bill as any).due_date),
            payment_date_fr: paymentDate ? formatFrenchDate(paymentDate) : null,
            // Format currency
            amount_formatted: formatFrenchCurrency(bill.amount || (bill as any).total_amount || 0),
            rent_amount_formatted: (bill as any).rent_amount ? formatFrenchCurrency((bill as any).rent_amount) : null,
            charges_formatted: (bill as any).charges ? formatFrenchCurrency((bill as any).charges) : null,
            total_amount_formatted: formatFrenchCurrency((bill as any).total_amount || bill.amount || 0),
            // Add status analysis
            is_overdue: isOverdueBill,
            days_until_due: daysUntilDue,
            status_fr: this.getBillStatusFrench((bill as any).status),
            priority: this.getBillPriority((bill as any).status, isOverdueBill, daysUntilDue),
            // Add display information
            tenant_display_name: (bill as any).tenant?.name || (bill as any).tenant?.fullName || 'Locataire',
            property_display_name: (bill as any).property?.title || (bill as any).property?.name || 'Propriété'
          };
        });
        
        this.setCachedData(cacheKey, bills);
        console.log('✅ Bills fetched:', bills.length);
        return bills;
      }
      
      throw new Error('Invalid response structure');
    } catch (error) {
      console.error('❌ Error fetching bills:', error);
      throw error;
    }
  }

  /**
   * Fetch bills statistics with French formatting
   */
  async fetchBillsStats() {
    const cacheKey = 'bills_stats';
    
    if (this.isCacheValid(cacheKey)) {
      return this.getCachedData(cacheKey);
    }

    try {
      console.log('📊 Fetching bills statistics...');
      const response = await (api as any).getBillsStats();
      
      if (response.data?.success && response.data?.data) {
        const stats = response.data.data;
        const enhancedStats = {
          ...stats,
          // Format currency
          totalAmount_formatted: formatFrenchCurrency((stats as any).totalAmount || 0),
          paidAmount_formatted: formatFrenchCurrency((stats as any).paidAmount || 0),
          pendingAmount_formatted: formatFrenchCurrency((stats as any).pendingAmount || 0),
          overdueAmount_formatted: formatFrenchCurrency((stats as any).overdueAmount || 0),
          // Add French labels
          totalBills_fr: `${(stats as any).totalBills || 0} facture${((stats as any).totalBills || 0) > 1 ? 's' : ''}`,
          paidBills_fr: `${(stats as any).paidBills || 0} facture${((stats as any).paidBills || 0) > 1 ? 's' : ''} payée${((stats as any).paidBills || 0) > 1 ? 's' : ''}`,
          pendingBills_fr: `${(stats as any).pendingBills || 0} facture${((stats as any).pendingBills || 0) > 1 ? 's' : ''} en attente`,
          overdueBills_fr: `${(stats as any).overdueBills || 0} facture${((stats as any).overdueBills || 0) > 1 ? 's' : ''} en retard`,
          // Add current date info
          last_updated: getCurrentFrenchDateTime(),
          last_updated_timestamp: new Date().toISOString()
        };
        
        this.setCachedData(cacheKey, enhancedStats);
        console.log('✅ Bills statistics fetched');
        return enhancedStats;
      }
      
      throw new Error('Invalid response structure');
    } catch (error) {
      console.error('❌ Error fetching bills statistics:', error);
      throw error;
    }
  }

  /**
   * Fetch expenses with French formatting
   */
  async fetchExpenses() {
    const cacheKey = 'expenses';
    
    if (this.isCacheValid(cacheKey)) {
      return this.getCachedData(cacheKey);
    }

    try {
      console.log('💰 Fetching expenses...');
      const response = await (api as any).listExpenses();
      
      if (response.data?.success && response.data?.data?.expenses) {
        const expenses = response.data.data.expenses.map((expense: any) => ({
          ...expense,
          // Add French formatted dates
          created_at_fr: formatFrenchDate(expense.created_at),
          date_fr: expense.date ? formatFrenchDate(expense.date) : null,
          // Format currency
          amount_formatted: formatFrenchCurrency(expense.amount || 0),
          // Add display information
          category_fr: this.getExpenseCategoryFrench((expense as any).category),
          status_fr: (expense as any).status === 'APPROVED' ? 'Approuvé' : 'En attente'
        }));
        
        this.setCachedData(cacheKey, expenses);
        console.log('✅ Expenses fetched:', expenses.length);
        return expenses;
      }
      
      throw new Error('Invalid response structure');
    } catch (error) {
      console.error('❌ Error fetching expenses:', error);
      throw error;
    }
  }

  /**
   * Get bill status in French
   * @param {string} status - Bill status
   * @returns {string} French status
   */
  getBillStatusFrench(status: any): string {
    const statusMap: { [key: string]: string } = {
      'PENDING': 'En attente',
      'PAID': 'Payé',
      'OVERDUE': 'En retard',
      'RECEIPT_SENT': 'Reçu envoyé',
      'CANCELLED': 'Annulé'
    };
    return statusMap[status] || status;
  }

  /**
   * Get bill priority based on status and due date
   * @param {string} status - Bill status
   * @param {boolean} isOverdue - Is bill overdue
   * @param {number} daysUntilDue - Days until due date
   * @returns {string} Priority level
   */
  getBillPriority(status: any, isOverdue: any, daysUntilDue: any): string {
    if (status === 'PAID') return 'low';
    if (isOverdue) return 'critical';
    if (daysUntilDue <= 3) return 'high';
    if (daysUntilDue <= 7) return 'medium';
    return 'low';
  }

  /**
   * Get expense category in French
   * @param {string} category - Expense category
   * @returns {string} French category
   */
  getExpenseCategoryFrench(category: any): string {
    const categoryMap: { [key: string]: string } = {
      'MAINTENANCE': 'Maintenance',
      'REPAIRS': 'Réparations',
      'UTILITIES': 'Services publics',
      'INSURANCE': 'Assurance',
      'TAXES': 'Taxes',
      'ADMINISTRATIVE': 'Administratif',
      'OTHER': 'Autre'
    };
    return categoryMap[category] || category;
  }

  /**
   * Get dashboard summary with all data
   */
  async getDashboardSummary() {
    try {
      console.log('📊 Fetching dashboard summary...');
      
      // Use Promise.allSettled to handle individual API failures gracefully
      const results = await Promise.allSettled([
        this.fetchProperties(),
        this.fetchTenants(),
        this.fetchBills({ limit: 10 }),
        this.fetchBillsStats(),
        this.fetchExpenses()
      ]);

      // Extract data from settled promises with fallbacks
      const properties = results[0].status === 'fulfilled' ? results[0].value : [];
      const tenants = results[1].status === 'fulfilled' ? results[1].value : [];
      const bills = results[2].status === 'fulfilled' ? results[2].value : [];
      const stats = results[3].status === 'fulfilled' ? results[3].value : {
        totalBills: 0,
        totalAmount: 0,
        pendingBills: 0,
        overdueBills: 0,
        statusBreakdown: []
      };
      const expenses = results[4].status === 'fulfilled' ? results[4].value : [];

      // Log any failures for debugging
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const apiNames = ['Properties', 'Tenants', 'Bills', 'Stats', 'Expenses'];
          console.warn(`⚠️  ${apiNames[index]} API failed:`, result.reason);
        }
      });

      const summary = {
        properties: {
          total: properties.length,
          active: properties.filter((p: any) => p.is_active).length,
          data: properties
        },
        tenants: {
          total: tenants.length,
          active: tenants.filter((t: any) => t.is_active || t.status === 'ACTIVE').length,
          data: tenants
        },
        bills: {
          total: bills.length,
          pending: bills.filter((b: any) => b.status === 'PENDING').length,
          overdue: bills.filter((b: any) => b.is_overdue || b.status === 'OVERDUE').length,
          paid: bills.filter((b: any) => b.status === 'PAID').length,
          data: bills
        },
        stats: stats,
        expenses: {
          total: expenses.length,
          data: expenses
        },
        last_updated: getCurrentFrenchDateTime(),
        last_updated_timestamp: new Date().toISOString()
      };

      console.log('✅ Dashboard summary fetched');
      return summary;
    } catch (error) {
      console.error('❌ Error fetching dashboard summary:', error);
      throw error;
    }
  }

  /**
   * Create a new bill with current date defaults
   */
  getNewBillDefaults() {
    return {
      tenant_id: 0,
      property_id: 0,
      amount: 0,
      month: new Date().toISOString().slice(0, 7), // YYYY-MM format
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      description: 'Paiement de loyer mensuel',
      status: 'PENDING'
    };
  }

  /**
   * Get backend base URL
   * @returns {string} Backend base URL
   */
  getBackendBaseUrl() {
    return getBackendBaseUrl();
  }

  /**
   * Format property address
   * @param {Object} property - Property object
   * @returns {string} Formatted address
   */
  formatAddress(property: any): string {
    const parts = [];
    
    if (property.address) parts.push(property.address);
    if (property.city) parts.push(property.city);
    if (property.postal_code) parts.push(property.postal_code);
    
    return parts.join(', ') || 'Adresse non spécifiée';
  }

  /**
   * Get current system status
   */
  getSystemStatus(): any {
    return {
      cache_size: this.cache.size,
      is_auto_refresh_active: !!this.refreshInterval,
      is_refreshing: this.isRefreshing,
      current_time: getCurrentFrenchDateTime(),
      timezone: 'Europe/Paris',
      backend_base_url: this.getBackendBaseUrl()
    };
  }
}

// Create singleton instance
const dataService = new DataService();

export default dataService;
