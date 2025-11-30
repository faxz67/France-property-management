import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Eye, 
  Plus, 
  Filter, 
  Download, 
  User,
  Home,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  Trash2,
  Zap,
  FileText
} from 'lucide-react';
import api from '../api';
import '../styles/navigation-animations.css';
import '../styles/payments-animations.css';
import dataService from '../services/dataService';
import { useLanguage } from '../contexts/LanguageContext';

// Format date to French format (DD/MM/YYYY) - matches backend format
const formatFrenchDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
};

interface Bill {
  id: number;
  tenant: {
    id: number;
    name: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    email: string;
    phone: string;
  } | null;
  property: {
    id: number;
    title: string;
    name?: string;
    propertyName?: string;
    address: string;
    city: string;
    postal_code?: string;
    country?: string;
  } | null;
  admin?: {
    id: number;
    name: string;
  } | null;
  amount: number;
  rent_amount?: number;
  charges?: number;
  total_amount?: number;
  payment_date?: string;
  month: string;
  due_date?: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'RECEIPT_SENT';
  description: string;
  created_at: string;
  tenant_display_name?: string;
  property_display_name?: string;
}

interface BillsStats {
  totalBills: number;
  totalAmount: number;
  pendingBills: number;
  overdueBills: number;
  statusBreakdown: Array<{
    status: string;
    count: number;
    total_amount: number;
  }>;
}

interface CreateBillForm {
  tenant_id: number;
  property_id: number;
  amount: number;
  charges?: number;
  month: string;
  payment_date?: string;
  description: string;
}

const PaymentsManagement: React.FC = () => {
  const { t, language } = useLanguage();
  const [bills, setBills] = useState<Bill[]>([]);
  const [stats, setStats] = useState<BillsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [payingBill, setPayingBill] = useState<number | null>(null);
  const [downloadingBill, setDownloadingBill] = useState<number | null>(null);
  const [deletingBill, setDeletingBill] = useState<number | null>(null);
  const [selectedBillsForDownload, setSelectedBillsForDownload] = useState<number[]>([]);
  const [generatingBills, setGeneratingBills] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    page: 1,
    limit: 10
  });
  // Pagination state (not currently used, reserved for future backend pagination)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [pagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });

  // Form state with French defaults
  const [createForm, setCreateForm] = useState<CreateBillForm>(() => {
    const defaults = dataService.getNewBillDefaults();
    return {
      tenant_id: 0,
      property_id: 0,
      amount: 0,
      charges: 0,
      month: defaults.month,
      payment_date: '',
      description: defaults.description
    };
  });

  // Additional state for form
  const [tenants, setTenants] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  
  // Animation states
  const [isFormAnimating, setIsFormAnimating] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [showErrorAnimation, setShowErrorAnimation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, [filters]);

  // Recalculate stats whenever bills change
  useEffect(() => {
    if (bills.length > 0) {
      console.log('🔄 Recalculating stats from bills...');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let totalAmount = 0;
      let pendingCount = 0;
      let overdueCount = 0;
      let paidAmount = 0;
      let pendingAmount = 0;
      let overdueAmount = 0;
      let paidCount = 0;
      
      bills.forEach((bill: Bill) => {
        const billAmount = bill.total_amount || bill.amount || 0;
        totalAmount += billAmount;
        
        // Check if overdue
        const dueDate = bill.due_date ? new Date(bill.due_date) : null;
        let isOverdue = false;
        if (dueDate) {
          dueDate.setHours(0, 0, 0, 0);
          isOverdue = dueDate < today && bill.status !== 'PAID';
        }
        
        if (bill.status === 'PAID') {
          paidCount++;
          paidAmount += billAmount;
        } else if (bill.status === 'PENDING') {
          pendingCount++;
          pendingAmount += billAmount;
          if (isOverdue) {
            overdueCount++;
            overdueAmount += billAmount;
          }
        } else if (bill.status === 'OVERDUE' || isOverdue) {
          overdueCount++;
          overdueAmount += billAmount;
          pendingCount++;
          pendingAmount += billAmount;
        }
      });
      
      const calculatedStats: BillsStats = {
        totalBills: bills.length,
        totalAmount,
        pendingBills: pendingCount,
        overdueBills: overdueCount,
        statusBreakdown: [
          { status: 'PAID', count: paidCount, total_amount: paidAmount },
          { status: 'PENDING', count: pendingCount, total_amount: pendingAmount },
          { status: 'OVERDUE', count: overdueCount, total_amount: overdueAmount }
        ]
      };
      
      setStats(calculatedStats);
      console.log('✅ Stats updated:', calculatedStats);
    }
  }, [bills]);

  // Load initial data with server connectivity check
  const loadInitialData = async () => {
    console.log('🚀 Loading initial data...');
    
    try {
      // Test server connectivity first
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('❌ No token, using mock data');
        loadMockData();
        return;
      }

      const apiBaseURL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.1.109:4002/api';
      
      // Test connectivity with a simple request
      const connectivityTest = await fetch(`${apiBaseURL}/bills`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (connectivityTest.ok) {
        console.log('✅ Server is available, loading real data');
        // Server is available, load real data
        await fetchBills();
        await fetchStats();
        await fetchTenants();
        await fetchProperties();
      } else {
        console.log('❌ Server not available, using mock data');
        loadMockData();
      }
    } catch (error) {
      console.log('❌ Server connectivity test failed, using mock data');
      loadMockData();
    }
  };

  // Load mock data when server is not available
  const loadMockData = () => {
    console.log('🔄 Loading mock data...');
    
    // Load mock bills
    const mockBills = [
      {
        id: 1,
        tenant_id: 1,
        property_id: 1,
        admin_id: 3,
        amount: 1000.00,
        rent_amount: 1000.00,
        charges: 0.00,
        total_amount: 1000.00,
        month: '2025-01',
        bill_date: '2025-01-01',
        due_date: '2025-01-15',
        payment_date: undefined,
        status: 'PENDING' as const,
        description: 'Paiement de loyer mensuel',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        tenant: {
          id: 1,
          name: 'Mohamed FaisalPortfolio Faisal',
          email: 'faisal786mf7@gmail.com',
          phone: '+1234567890'
        },
        property: {
          id: 1,
          title: 'Test Property 1',
          address: '123 Test Street',
          city: 'Paris'
        },
        // French formatting
        created_at_fr: '01/01/2025',
        due_date_fr: '15/01/2025',
        payment_date_fr: undefined,
        amount_formatted: '1 000,00 €',
        rent_amount_formatted: '1 000,00 €',
        charges_formatted: '0,00 €',
        total_amount_formatted: '1 000,00 €',
        is_overdue: false,
        days_until_due: 14,
        status_fr: 'En attente',
        priority: 'low',
        tenant_display_name: 'Mohamed FaisalPortfolio Faisal',
        property_display_name: 'Test Property 1'
      },
      {
        id: 2,
        tenant_id: 2,
        property_id: 2,
        admin_id: 4,
        amount: 1200.00,
        rent_amount: 1200.00,
        charges: 0.00,
        total_amount: 1200.00,
        month: '2025-01',
        bill_date: '2025-01-01',
        due_date: '2025-01-10',
        payment_date: '2025-01-05',
        status: 'PAID' as const,
        description: 'Paiement de loyer mensuel',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-05T00:00:00Z',
        tenant: {
          id: 2,
          name: 'Mohamed Faisal',
          email: 'faisal786mf7@gmail.com',
          phone: '+1234567890'
        },
        property: {
          id: 2,
          title: 'Test Property 2',
          address: '456 Test Avenue',
          city: 'Lyon'
        },
        // French formatting
        created_at_fr: '01/01/2025',
        due_date_fr: '10/01/2025',
        payment_date_fr: '05/01/2025',
        amount_formatted: '1 200,00 €',
        rent_amount_formatted: '1 200,00 €',
        charges_formatted: '0,00 €',
        total_amount_formatted: '1 200,00 €',
        is_overdue: false,
        days_until_due: -5,
        status_fr: 'Payé',
        priority: 'low',
        tenant_display_name: 'Mohamed Faisal',
        property_display_name: 'Test Property 2'
      },
      {
        id: 3,
        tenant_id: 3,
        property_id: 3,
        admin_id: 1,
        amount: 800.00,
        rent_amount: 800.00,
        charges: 0.00,
        total_amount: 800.00,
        month: '2024-12',
        bill_date: '2024-12-01',
        due_date: '2024-12-15',
        payment_date: undefined,
        status: 'OVERDUE' as const,
        description: 'Paiement de loyer mensuel',
        created_at: '2024-12-01T00:00:00Z',
        updated_at: '2024-12-01T00:00:00Z',
        tenant: {
          id: 3,
          name: 'Locataire Admin 1',
          email: 'locataire.admin1@test.com',
          phone: '+1234567890'
        },
        property: {
          id: 3,
          title: 'Test Property 3',
          address: '789 Test Boulevard',
          city: 'Marseille'
        },
        // French formatting
        created_at_fr: '01/12/2024',
        due_date_fr: '15/12/2024',
        payment_date_fr: undefined,
        amount_formatted: '800,00 €',
        rent_amount_formatted: '800,00 €',
        charges_formatted: '0,00 €',
        total_amount_formatted: '800,00 €',
        is_overdue: true,
        days_until_due: -17,
        status_fr: 'En retard',
        priority: 'critical',
        tenant_display_name: 'Locataire Admin 1',
        property_display_name: 'Test Property 3'
      }
    ];

    // Load mock stats
    const mockStats: BillsStats = {
      totalBills: 3,
      totalAmount: 3000.00,
      pendingBills: 1,
      overdueBills: 1,
      statusBreakdown: [
        { status: 'PAID', count: 1, total_amount: 1200.00 },
        { status: 'PENDING', count: 1, total_amount: 1000.00 },
        { status: 'OVERDUE', count: 1, total_amount: 800.00 }
      ]
    };

    // Load mock tenants
    const mockTenants = [
      {
        id: 1,
        name: 'Mohamed FaisalPortfolio Faisal',
        email: 'faisal786mf7@gmail.com',
        phone: '+1234567890',
        admin_id: 3,
        property_id: 1,
        status: 'ACTIVE',
        rent_amount: 1000.00,
        display_name: 'Mohamed FaisalPortfolio Faisal (faisal786mf7@gmail.com)',
        property: {
          id: 1,
          title: 'Test Property 1',
          address: '123 Test Street',
          monthly_rent: 1000.00
        },
        admin: {
          id: 3,
          name: 'Mohamed Faisal',
          email: 'faisal@property.com'
        }
      },
      {
        id: 2,
        name: 'Mohamed Faisal',
        email: 'faisal786mf7@gmail.com',
        phone: '+1234567890',
        admin_id: 4,
        property_id: 2,
        status: 'ACTIVE',
        rent_amount: 1200.00,
        display_name: 'Mohamed Faisal (faisal786mf7@gmail.com)',
        property: {
          id: 2,
          title: 'Test Property 2',
          address: '456 Test Avenue',
          monthly_rent: 1200.00
        },
        admin: {
          id: 4,
          name: 'Mohamed Rahim',
          email: 'rahim@property.com'
        }
      },
      {
        id: 3,
        name: 'Locataire Admin 1',
        email: 'locataire.admin1@test.com',
        phone: '+1234567890',
        admin_id: 1,
        property_id: 3,
        status: 'ACTIVE',
        rent_amount: 800.00,
        display_name: 'Locataire Admin 1 (locataire.admin1@test.com)',
        property: {
          id: 3,
          title: 'Test Property 3',
          address: '789 Test Boulevard',
          monthly_rent: 800.00
        },
        admin: {
          id: 1,
          name: 'Default Admin',
          email: 'admin@example.com'
        }
      }
    ];

    // Load mock properties
    const mockProperties = [
      {
        id: 1,
        title: 'Test Property 1',
        address: '123 Test Street',
        monthly_rent: 1000.00,
        admin_id: 3,
        display_name: 'Test Property 1 - 123 Test Street'
      },
      {
        id: 2,
        title: 'Test Property 2',
        address: '456 Test Avenue',
        monthly_rent: 1200.00,
        admin_id: 4,
        display_name: 'Test Property 2 - 456 Test Avenue'
      },
      {
        id: 3,
        title: 'Test Property 3',
        address: '789 Test Boulevard',
        monthly_rent: 800.00,
        admin_id: 1,
        display_name: 'Test Property 3 - 789 Test Boulevard'
      }
    ];

    // Set all mock data
    setBills(mockBills);
    setStats(mockStats);
    setTenants(mockTenants);
    setProperties(mockProperties);
    setLoading(false);
    setError('');
    
    console.log('📊 Mock data loaded successfully:', {
      bills: mockBills.length,
      stats: mockStats,
      tenants: mockTenants.length,
      properties: mockProperties.length
    });
  };

  const fetchBills = async (skipLoading = false) => {
    try {
      if (!skipLoading) {
        setLoading(true);
      }
      setError('');
      console.log('🔍 Fetching bills with filters:', filters);
      
      // Clear any cached data
      dataService.clearCache();
      
      // Check authentication token
      const token = localStorage.getItem('token');
      console.log('🔑 Token exists:', !!token);
      
      if (!token) {
        console.error('❌ No authentication token found');
        setError('Token d\'authentification manquant');
        setBills([]);
        return;
      }
      
      // Call API directly instead of using dataService to avoid cache issues
      const response = await api.listBills(filters);
      console.log('📡 Bills API Response:', response.data);
      
      if (response.data?.success && response.data?.data?.bills) {
        const rawBills = response.data.data.bills;
        console.log('📋 Raw bills from API:', rawBills.length, 'bills');
        
        // Log first bill structure for debugging
        if (rawBills.length > 0) {
          console.log('🔍 Sample bill structure:', {
            id: rawBills[0].id,
            tenant: rawBills[0].tenant,
            property: rawBills[0].property,
            tenant_keys: rawBills[0].tenant ? Object.keys(rawBills[0].tenant) : 'null'
          });
        }
        
        // Process bills with French formatting
        const processedBills = rawBills.map((bill: any) => {
          try {
            const paymentDate = bill.payment_date ? new Date(bill.payment_date) : null;
            const dueDate = bill.due_date ? new Date(bill.due_date) : null;
            const createdDate = bill.created_at ? new Date(bill.created_at) : null;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            let isOverdueBill = false;
            let daysUntilDue: number | null = null;
            if (dueDate && !isNaN(dueDate.getTime())) {
              dueDate.setHours(0, 0, 0, 0);
              isOverdueBill = dueDate < today;
              daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            }
            
            // Extract tenant name with multiple fallbacks
            let tenantDisplayName = t('payments.tenant');
            if (bill.tenant) {
              tenantDisplayName = bill.tenant.name || 
                                  bill.tenant.fullName || 
                                  (bill.tenant.firstName && bill.tenant.lastName ? `${bill.tenant.firstName} ${bill.tenant.lastName}` : null) ||
                                  `${t('payments.tenant')} ${bill.tenant.id}` ||
                                  t('payments.tenant');
            } else {
              console.warn(`⚠️ Bill ${bill.id} has no tenant data`);
            }
            
            // Extract property name with multiple fallbacks
            let propertyDisplayName = t('payments.property');
            if (bill.property) {
              propertyDisplayName = bill.property.title || 
                                   bill.property.name || 
                                   bill.property.propertyName ||
                                   `${t('payments.property')} ${bill.property.id}` ||
                                   t('payments.property');
            } else {
              console.warn(`⚠️ Bill ${bill.id} has no property data`);
            }
            
            return {
              ...bill,
              // Add formatted dates with locale support
              created_at_fr: createdDate && !isNaN(createdDate.getTime()) 
                ? createdDate.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US') 
                : t('payments.nA'),
              due_date_fr: dueDate && !isNaN(dueDate.getTime()) 
                ? dueDate.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US') 
                : null,
              payment_date_fr: paymentDate && !isNaN(paymentDate.getTime()) 
                ? paymentDate.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US') 
                : null,
              // Format currency with locale support
              amount_formatted: new Intl.NumberFormat(language === 'fr' ? 'fr-FR' : 'en-US', { style: 'currency', currency: 'EUR' }).format(bill.amount || bill.total_amount || 0),
              rent_amount_formatted: bill.rent_amount ? new Intl.NumberFormat(language === 'fr' ? 'fr-FR' : 'en-US', { style: 'currency', currency: 'EUR' }).format(bill.rent_amount) : null,
              charges_formatted: bill.charges ? new Intl.NumberFormat(language === 'fr' ? 'fr-FR' : 'en-US', { style: 'currency', currency: 'EUR' }).format(bill.charges) : null,
              total_amount_formatted: new Intl.NumberFormat(language === 'fr' ? 'fr-FR' : 'en-US', { style: 'currency', currency: 'EUR' }).format(bill.total_amount || bill.amount || 0),
              // Add status analysis with translations
              is_overdue: isOverdueBill,
              days_until_due: daysUntilDue || 0,
              status_fr: bill.status === 'PENDING' ? t('payments.status.pending') : 
                        bill.status === 'PAID' ? t('payments.status.paid') : 
                        bill.status === 'OVERDUE' ? t('payments.status.overdue') : 
                        bill.status === 'RECEIPT_SENT' ? t('payments.status.receipt_sent') : bill.status || t('common.error'),
              priority: bill.status === 'PAID' ? 'low' : 
                       isOverdueBill ? 'critical' : 
                       (daysUntilDue !== null && daysUntilDue <= 3) ? 'high' : 
                       (daysUntilDue !== null && daysUntilDue <= 7) ? 'medium' : 'low',
              // Add display information with improved fallbacks
              tenant_display_name: tenantDisplayName,
              property_display_name: propertyDisplayName
            };
          } catch (err) {
            console.error('❌ Error processing bill:', bill.id, err);
            // Return bill with minimal processing if error occurs
            return {
              ...bill,
              created_at_fr: 'N/A',
              due_date_fr: null,
              payment_date_fr: null,
              amount_formatted: '€0.00',
              rent_amount_formatted: null,
              charges_formatted: null,
              total_amount_formatted: '€0.00',
              is_overdue: false,
              days_until_due: 0,
              status_fr: bill.status || 'Inconnu',
              priority: 'low',
              tenant_display_name: bill.tenant?.name || 
                                  bill.tenant?.fullName || 
                                  (bill.tenant?.firstName && bill.tenant?.lastName ? `${bill.tenant.firstName} ${bill.tenant.lastName}` : null) ||
                                  (bill.tenant ? `Locataire ${bill.tenant.id}` : 'Locataire') ||
                                  'Locataire',
              property_display_name: bill.property?.title || 
                                    bill.property?.name || 
                                    bill.property?.propertyName ||
                                    (bill.property ? `Propriété ${bill.property.id}` : 'Propriété') ||
                                    'Propriété'
            };
          }
        });
        
        console.log('✅ Bills processed with French formatting:', processedBills.length, 'bills');
        setBills(processedBills);
        return processedBills;
      } else {
        console.log('❌ Invalid bills response structure:', response.data);
        setBills([]);
        return [];
      }
      
    } catch (err: any) {
      console.error('❌ Error fetching bills:', err);
      console.error('❌ Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        stack: err.stack
      });
      
      // Set error message for user
      const errorMessage = err.response?.data?.message || err.message || 'Erreur lors de la récupération des factures';
      setError(errorMessage);
      setBills([]);
      setLoading(false);
      
      // Don't use mock bills - show error instead
      console.log('❌ Bills fetch failed. Showing error to user.');
      return [];
    } finally {
      if (!skipLoading) {
        setLoading(false);
      }
    }
  };

  const handleDeleteBill = async (id: number) => {
    try {
      const confirmed = window.confirm('Supprimer cette facture ? Cette action est irréversible.');
      if (!confirmed) return;

      setDeletingBill(id);
      setError('');

      // Appel API suppression
      const response = await api.deleteBill(id);
      if (response?.data?.success) {
        // Mise à jour locale et rafraîchissement stats
        setBills(prev => prev.filter(b => b.id !== id));
        await fetchStats();
      } else {
        setError(response?.data?.message || 'Échec de la suppression de la facture');
      }
    } catch (err: any) {
      setError(err?.userMessage || err?.message || 'Erreur lors de la suppression');
    } finally {
      setDeletingBill(null);
    }
  };

  const fetchStats = async () => {
    try {
      // Clear cache first to force fresh data
      dataService.clearCache();
      
      // Call API directly instead of using dataService
      const response = await api.getBillsStats();
      if (response.data?.success && response.data?.data) {
        const rawStats = response.data.data;
        
        console.log('📊 Raw stats from API:', rawStats);
        
        // Process stats with French formatting - Fixed field mapping
        const processedStats: BillsStats = {
          totalBills: rawStats.totalBills || rawStats.total || 0,
          totalAmount: rawStats.totalAmount || rawStats.total_amount || 0,
          pendingBills: rawStats.pendingBills || rawStats.pending || 0,
          overdueBills: rawStats.overdueBills || rawStats.overdue || 0,
          statusBreakdown: [
            { status: 'PAID', count: rawStats.paid || 0, total_amount: rawStats.paid_amount || 0 },
            { status: 'PENDING', count: rawStats.pendingBills || rawStats.pending || 0, total_amount: rawStats.pending_amount || 0 },
            { status: 'OVERDUE', count: rawStats.overdueBills || rawStats.overdue || 0, total_amount: rawStats.overdue_amount || 0 }
          ]
        };
        
        setStats(processedStats);
        console.log('✅ Stats loaded from API:', processedStats);
      }
    } catch (err: any) {
      console.error('❌ Failed to fetch stats from API:', err);
      console.log('🔄 Calculating stats from loaded bills...');
      
      // Calculate stats from the bills we have loaded
      let currentBills = bills.length > 0 ? bills : [];
      if (currentBills.length === 0) {
        // Try to fetch bills
        const fetchedBills = await fetchBills();
        currentBills = Array.isArray(fetchedBills) ? fetchedBills : [];
      }
      let calculatedStats: BillsStats;
      
      if (currentBills.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let totalAmount = 0;
        let pendingCount = 0;
        let overdueCount = 0;
        let paidAmount = 0;
        let pendingAmount = 0;
        let overdueAmount = 0;
        
        currentBills.forEach((bill: Bill) => {
          const billAmount = bill.total_amount || bill.amount || 0;
          totalAmount += billAmount;
          
          // Check if overdue
          const dueDate = bill.due_date ? new Date(bill.due_date) : null;
          let isOverdue = false;
          if (dueDate) {
            dueDate.setHours(0, 0, 0, 0);
            isOverdue = dueDate < today && bill.status !== 'PAID';
          }
          
          if (bill.status === 'PAID') {
            paidAmount += billAmount;
          } else if (bill.status === 'PENDING') {
            pendingCount++;
            pendingAmount += billAmount;
            if (isOverdue) {
              overdueCount++;
              overdueAmount += billAmount;
            }
          } else if (bill.status === 'OVERDUE' || isOverdue) {
            overdueCount++;
            overdueAmount += billAmount;
            pendingCount++;
            pendingAmount += billAmount;
          }
        });
        
        calculatedStats = {
          totalBills: currentBills.length,
          totalAmount,
          pendingBills: pendingCount,
          overdueBills: overdueCount,
          statusBreakdown: [
            { status: 'PAID', count: currentBills.filter(b => b.status === 'PAID').length, total_amount: paidAmount },
            { status: 'PENDING', count: pendingCount, total_amount: pendingAmount },
            { status: 'OVERDUE', count: overdueCount, total_amount: overdueAmount }
          ]
        };
      } else {
        // Use mock stats as final fallback
        calculatedStats = {
          totalBills: 3,
          totalAmount: 3000.00,
          pendingBills: 2,
          overdueBills: 1,
          statusBreakdown: [
            { status: 'PAID', count: 0, total_amount: 0 },
            { status: 'PENDING', count: 2, total_amount: 2000.00 },
            { status: 'OVERDUE', count: 1, total_amount: 1000.00 }
          ]
        };
      }
      
      setStats(calculatedStats);
      console.log('📊 Stats calculated from bills:', calculatedStats);
    }
  };

  const fetchTenants = async () => {
    try {
      // Clear cache to force fresh data
      dataService.clearCache();
      
      // Check authentication token first
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ No authentication token found for tenants fetch');
        setTenants([]);
        return;
      }

      console.log('🔍 Fetching tenants from database...');
      const response = await api.listTenants();
      console.log('🔍 Tenants API Response:', response);
      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response data:', response.data);
      
      // Handle different possible response structures
      let rawTenants = [];
      
      if (response.data?.success && response.data?.data) {
        // Structure: { success: true, data: [...] }
        rawTenants = response.data.data;
        console.log('📋 Using response.data.data structure');
      } else if (response.data && Array.isArray(response.data)) {
        // Structure: [...] (direct array)
        rawTenants = response.data;
        console.log('📋 Using direct array structure');
      } else if (response.data?.tenants) {
        // Structure: { tenants: [...] }
        rawTenants = response.data.tenants;
        console.log('📋 Using response.data.tenants structure');
      } else if (response.data?.results) {
        // Structure: { results: [...] }
        rawTenants = response.data.results;
        console.log('📋 Using response.data.results structure');
      } else {
        console.log('❌ Unknown response structure:', response.data);
        console.log('❌ Available keys:', Object.keys(response.data || {}));
        setTenants([]);
        return;
      }
      
      if (Array.isArray(rawTenants) && rawTenants.length > 0) {
        console.log('📋 Raw tenants from API:', rawTenants.length, 'tenants');
        console.log('📋 Raw tenants structure:', rawTenants);
        
        // Process tenants with French formatting
        const processedTenants = rawTenants.map((tenant: any) => {
          console.log('🔄 Processing tenant:', tenant);
          return {
            ...tenant,
            // Add French formatted dates
            created_at_fr: tenant.created_at ? new Date(tenant.created_at).toLocaleDateString('fr-FR') : 'N/A',
            // Add display information - try multiple possible name fields
            display_name: tenant.name || tenant.fullName || (tenant.firstName && tenant.lastName ? `${tenant.firstName} ${tenant.lastName}` : null) || `Locataire ${tenant.id}`,
            // Add property information
            property_display_name: tenant.property?.title || tenant.property?.name || 'Propriété'
          };
        });
        
        setTenants(processedTenants);
        console.log('✅ Tenants processed with French formatting:', processedTenants.length, 'tenants');
        console.log('📝 Tenant names for dropdown:', processedTenants.map(t => ({ 
          id: t.id, 
          name: t.name, 
          fullName: t.fullName,
          firstName: t.firstName,
          lastName: t.lastName,
          display_name: t.display_name
        })));
      } else {
        console.log('❌ No tenants found or invalid data structure');
        console.log('❌ Raw tenants:', rawTenants);
        setTenants([]);
      }
    } catch (err: any) {
      console.error('❌ Failed to fetch tenants:', err);
      console.error('❌ Error details:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data
      });
      setTenants([]);
    }
  };

  const fetchProperties = async () => {
    try {
      // Clear cache to force fresh data
      dataService.clearCache();
      
      // Check authentication token first
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ No authentication token found for properties fetch');
        setProperties([]);
        return;
      }

      console.log('🔍 Fetching properties from database...');
      const response = await api.listProperties();
      console.log('🔍 Properties API Response:', response);
      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response data:', response.data);
      
      // Handle different possible response structures
      let rawProperties = [];
      
      if (response.data?.success && response.data?.data) {
        // Structure: { success: true, data: [...] }
        rawProperties = response.data.data;
        console.log('📋 Using response.data.data structure');
      } else if (response.data && Array.isArray(response.data)) {
        // Structure: [...] (direct array)
        rawProperties = response.data;
        console.log('📋 Using direct array structure');
      } else if (response.data?.properties) {
        // Structure: { properties: [...] }
        rawProperties = response.data.properties;
        console.log('📋 Using response.data.properties structure');
      } else if (response.data?.results) {
        // Structure: { results: [...] }
        rawProperties = response.data.results;
        console.log('📋 Using response.data.results structure');
      } else {
        console.log('❌ Unknown response structure:', response.data);
        console.log('❌ Available keys:', Object.keys(response.data || {}));
        setProperties([]);
        return;
      }
      
      if (Array.isArray(rawProperties) && rawProperties.length > 0) {
        console.log('📋 Raw properties from API:', rawProperties.length, 'properties');
        console.log('📋 Raw properties structure:', rawProperties);
        
        // Process properties with French formatting
        const processedProperties = rawProperties.map((property: any) => {
          console.log('🔄 Processing property:', property);
          return {
            ...property,
            // Add French formatted dates
            created_at_fr: property.created_at ? new Date(property.created_at).toLocaleDateString('fr-FR') : 'N/A',
            // Add display information - try multiple possible title fields
            display_name: property.title || property.name || property.propertyName || `Propriété ${property.id}`,
            // Add formatted rent
            rent_formatted: property.rent ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(property.rent) : null
          };
        });
        
        setProperties(processedProperties);
        console.log('✅ Properties processed with French formatting:', processedProperties.length, 'properties');
        console.log('📝 Property titles for dropdown:', processedProperties.map(p => ({ 
          id: p.id, 
          title: p.title, 
          name: p.name,
          propertyName: p.propertyName,
          display_name: p.display_name
        })));
      } else {
        console.log('❌ No properties found or invalid data structure');
        console.log('❌ Raw properties:', rawProperties);
        setProperties([]);
      }
    } catch (err: any) {
      console.error('❌ Failed to fetch properties:', err);
      console.error('❌ Error details:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data
      });
      setProperties([]);
    }
  };

  // Advanced diagnostic and data fetching for create bill
  const loadDataForCreateBill = async () => {
    try {
      console.log('🚀 [SENIOR DEV] Loading data for create bill with advanced diagnostics...');
      
      // Check authentication
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ [SENIOR DEV] No authentication token');
        alert('❌ Vous devez être connecté pour créer une facture');
        return { tenants: [], properties: [] };
      }

      // Decode token to get admin info
      try {
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        console.log('🔐 [SENIOR DEV] Token payload:', tokenPayload);
        console.log('👤 [SENIOR DEV] Admin ID:', tokenPayload.id);
        console.log('👤 [SENIOR DEV] Admin Role:', tokenPayload.role);
      } catch (e) {
        console.warn('⚠️ [SENIOR DEV] Could not decode token payload');
      }

      // Get API base URL
      const apiBaseURL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.1.109:4002/api';
      console.log('🌐 [SENIOR DEV] API Base URL:', apiBaseURL);

      // Test API connectivity first
      console.log('🧪 [SENIOR DEV] Testing API connectivity...');
      const connectivityTest = await fetch(`${apiBaseURL}/tenants`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🧪 [SENIOR DEV] Connectivity test status:', connectivityTest.status);
      console.log('🧪 [SENIOR DEV] Connectivity test headers:', Object.fromEntries(connectivityTest.headers.entries()));

      if (!connectivityTest.ok) {
        const errorText = await connectivityTest.text();
        console.error('❌ [SENIOR DEV] API connectivity failed:', connectivityTest.status, errorText);
        
        // If server is not available, use mock data for SUPER_ADMIN
        console.log('🔄 [SENIOR DEV] Server not available, using mock data...');
        
        const mockTenants = [
          {
            id: 1,
            name: 'Mohamed FaisalPortfolio Faisal',
            email: 'faisal786mf7@gmail.com',
            phone: '+1234567890',
            admin_id: 3,
            property_id: 1,
            status: 'ACTIVE',
            rent_amount: 1000.00,
            display_name: 'Mohamed FaisalPortfolio Faisal (faisal786mf7@gmail.com)',
            property: {
              id: 1,
              title: 'Test Property 1',
              address: '123 Test Street',
              monthly_rent: 1000.00
            },
            admin: {
              id: 3,
              name: 'Mohamed Faisal',
              email: 'faisal@property.com'
            }
          },
          {
            id: 2,
            name: 'Mohamed Faisal',
            email: 'faisal786mf7@gmail.com',
            phone: '+1234567890',
            admin_id: 4,
            property_id: 2,
            status: 'ACTIVE',
            rent_amount: 1200.00,
            display_name: 'Mohamed Faisal (faisal786mf7@gmail.com)',
            property: {
              id: 2,
              title: 'Test Property 2',
              address: '456 Test Avenue',
              monthly_rent: 1200.00
            },
            admin: {
              id: 4,
              name: 'Mohamed Rahim',
              email: 'rahim@property.com'
            }
          },
          {
            id: 3,
            name: 'Locataire Admin 1',
            email: 'locataire.admin1@test.com',
            phone: '+1234567890',
            admin_id: 1,
            property_id: 3,
            status: 'ACTIVE',
            rent_amount: 800.00,
            display_name: 'Locataire Admin 1 (locataire.admin1@test.com)',
            property: {
              id: 3,
              title: 'Test Property 3',
              address: '789 Test Boulevard',
              monthly_rent: 800.00
            },
            admin: {
              id: 1,
              name: 'Default Admin',
              email: 'admin@example.com'
            }
          }
        ];
        
        const mockProperties = [
          {
            id: 1,
            title: 'Test Property 1',
            address: '123 Test Street',
            monthly_rent: 1000.00,
            admin_id: 3,
            display_name: 'Test Property 1 - 123 Test Street'
          },
          {
            id: 2,
            title: 'Test Property 2',
            address: '456 Test Avenue',
            monthly_rent: 1200.00,
            admin_id: 4,
            display_name: 'Test Property 2 - 456 Test Avenue'
          },
          {
            id: 3,
            title: 'Test Property 3',
            address: '789 Test Boulevard',
            monthly_rent: 800.00,
            admin_id: 1,
            display_name: 'Test Property 3 - 789 Test Boulevard'
          }
        ];
        
        console.log('📊 [SENIOR DEV] Mock data loaded:', {
          tenants: mockTenants.length,
          properties: mockProperties.length
        });
        
        return { tenants: mockTenants, properties: mockProperties };
      }

      // Fetch tenants with detailed logging - Use specialized bill creation endpoint
      console.log('👥 [SENIOR DEV] Fetching tenants with detailed diagnostics...');
      
      let tenantsResponse;
      let tenantsEndpoint = `${apiBaseURL}/bills/create-data/tenants`;
      
      // Use specialized endpoint for bill creation
      try {
        tenantsResponse = await fetch(tenantsEndpoint, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('👥 [SENIOR DEV] Bill creation tenants endpoint status:', tenantsResponse.status);
        
        // If still 403, try fallback to regular endpoint
        if (tenantsResponse.status === 403) {
          console.log('👥 [SENIOR DEV] 403 error, trying fallback endpoint...');
          
          tenantsEndpoint = `${apiBaseURL}/tenants`;
          tenantsResponse = await fetch(tenantsEndpoint, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          console.log('👥 [SENIOR DEV] Fallback tenants endpoint status:', tenantsResponse.status);
        }
      } catch (error) {
        console.error('👥 [SENIOR DEV] Error fetching tenants:', error);
        tenantsResponse = { ok: false, status: 500 };
      }

      console.log('👥 [SENIOR DEV] Tenants response status:', tenantsResponse.status);
      console.log('👥 [SENIOR DEV] Tenants response headers:', tenantsResponse.headers ? Object.fromEntries(tenantsResponse.headers.entries()) : 'No headers');

      let tenants = [];
      if (tenantsResponse.ok && 'json' in tenantsResponse) {
        const tenantsData = await tenantsResponse.json();
        console.log('👥 [SENIOR DEV] Raw tenants response:', tenantsData);
        console.log('👥 [SENIOR DEV] Tenants data type:', typeof tenantsData);
        console.log('👥 [SENIOR DEV] Tenants data keys:', Object.keys(tenantsData || {}));
        
        // Multiple extraction strategies
        if (tenantsData.success && Array.isArray(tenantsData.data)) {
          tenants = tenantsData.data;
          console.log('👥 [SENIOR DEV] Using tenantsData.data structure');
        } else if (Array.isArray(tenantsData)) {
          tenants = tenantsData;
          console.log('👥 [SENIOR DEV] Using direct array structure');
        } else if (tenantsData.tenants && Array.isArray(tenantsData.tenants)) {
          tenants = tenantsData.tenants;
          console.log('👥 [SENIOR DEV] Using tenantsData.tenants structure');
        } else if (tenantsData.results && Array.isArray(tenantsData.results)) {
          tenants = tenantsData.results;
          console.log('👥 [SENIOR DEV] Using tenantsData.results structure');
        } else {
          console.log('👥 [SENIOR DEV] Unknown structure, searching for arrays...');
          // Search for any array in the response
          for (const [key, value] of Object.entries(tenantsData)) {
            if (Array.isArray(value)) {
              console.log(`👥 [SENIOR DEV] Found array in key '${key}' with ${value.length} items`);
              tenants = value;
              break;
            }
          }
        }
        
        console.log('👥 [SENIOR DEV] Extracted tenants count:', tenants.length);
        if (tenants.length > 0) {
          console.log('👥 [SENIOR DEV] Sample tenant:', tenants[0]);
        }
      } else {
        const errorText = 'text' in tenantsResponse ? await tenantsResponse.text() : 'Unknown error';
        console.error('❌ [SENIOR DEV] Failed to fetch tenants:', tenantsResponse.status, errorText);
        console.log('🔄 [SENIOR DEV] Using mock tenants as fallback...');
        
        // Use mock tenants as fallback
        tenants = [
          {
            id: 1,
            name: 'Mohamed FaisalPortfolio Faisal',
            email: 'faisal786mf7@gmail.com',
            phone: '+1234567890',
            admin_id: 3,
            property_id: 1,
            status: 'ACTIVE',
            rent_amount: 1000.00,
            display_name: 'Mohamed FaisalPortfolio Faisal (faisal786mf7@gmail.com)',
            property: {
              id: 1,
              title: 'Test Property 1',
              address: '123 Test Street',
              monthly_rent: 1000.00
            },
            admin: {
              id: 3,
              name: 'Mohamed Faisal',
              email: 'faisal@property.com'
            }
          },
          {
            id: 2,
            name: 'Mohamed Faisal',
            email: 'faisal786mf7@gmail.com',
            phone: '+1234567890',
            admin_id: 4,
            property_id: 2,
            status: 'ACTIVE',
            rent_amount: 1200.00,
            display_name: 'Mohamed Faisal (faisal786mf7@gmail.com)',
            property: {
              id: 2,
              title: 'Test Property 2',
              address: '456 Test Avenue',
              monthly_rent: 1200.00
            },
            admin: {
              id: 4,
              name: 'Mohamed Rahim',
              email: 'rahim@property.com'
            }
          },
          {
            id: 3,
            name: 'Locataire Admin 1',
            email: 'locataire.admin1@test.com',
            phone: '+1234567890',
            admin_id: 1,
            property_id: 3,
            status: 'ACTIVE',
            rent_amount: 800.00,
            display_name: 'Locataire Admin 1 (locataire.admin1@test.com)',
            property: {
              id: 3,
              title: 'Test Property 3',
              address: '789 Test Boulevard',
              monthly_rent: 800.00
            },
            admin: {
              id: 1,
              name: 'Default Admin',
              email: 'admin@example.com'
            }
          }
        ];
      }

      // Fetch properties with detailed logging - Use specialized bill creation endpoint
      console.log('🏠 [SENIOR DEV] Fetching properties with detailed diagnostics...');
      
      let propertiesResponse;
      let propertiesEndpoint = `${apiBaseURL}/bills/create-data/properties`;
      
      // Use specialized endpoint for bill creation
      try {
        propertiesResponse = await fetch(propertiesEndpoint, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('🏠 [SENIOR DEV] Bill creation properties endpoint status:', propertiesResponse.status);
        
        // If still 403, try fallback to regular endpoint
        if (propertiesResponse.status === 403) {
          console.log('🏠 [SENIOR DEV] 403 error, trying fallback endpoint...');
          
          propertiesEndpoint = `${apiBaseURL}/properties`;
          propertiesResponse = await fetch(propertiesEndpoint, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          console.log('🏠 [SENIOR DEV] Fallback properties endpoint status:', propertiesResponse.status);
        }
      } catch (error) {
        console.error('🏠 [SENIOR DEV] Error fetching properties:', error);
        propertiesResponse = { ok: false, status: 500 };
      }

      console.log('🏠 [SENIOR DEV] Properties response status:', propertiesResponse.status);
      console.log('🏠 [SENIOR DEV] Properties response headers:', propertiesResponse.headers ? Object.fromEntries(propertiesResponse.headers.entries()) : 'No headers');

      let properties = [];
      if (propertiesResponse.ok && 'json' in propertiesResponse) {
        const propertiesData = await propertiesResponse.json();
        console.log('🏠 [SENIOR DEV] Raw properties response:', propertiesData);
        console.log('🏠 [SENIOR DEV] Properties data type:', typeof propertiesData);
        console.log('🏠 [SENIOR DEV] Properties data keys:', Object.keys(propertiesData || {}));
        
        // Multiple extraction strategies
        if (propertiesData.success && Array.isArray(propertiesData.data)) {
          properties = propertiesData.data;
          console.log('🏠 [SENIOR DEV] Using propertiesData.data structure');
        } else if (Array.isArray(propertiesData)) {
          properties = propertiesData;
          console.log('🏠 [SENIOR DEV] Using direct array structure');
        } else if (propertiesData.properties && Array.isArray(propertiesData.properties)) {
          properties = propertiesData.properties;
          console.log('🏠 [SENIOR DEV] Using propertiesData.properties structure');
        } else if (propertiesData.results && Array.isArray(propertiesData.results)) {
          properties = propertiesData.results;
          console.log('🏠 [SENIOR DEV] Using propertiesData.results structure');
        } else {
          console.log('🏠 [SENIOR DEV] Unknown structure, searching for arrays...');
          // Search for any array in the response
          for (const [key, value] of Object.entries(propertiesData)) {
            if (Array.isArray(value)) {
              console.log(`🏠 [SENIOR DEV] Found array in key '${key}' with ${value.length} items`);
              properties = value;
              break;
            }
          }
        }
        
        console.log('🏠 [SENIOR DEV] Extracted properties count:', properties.length);
        if (properties.length > 0) {
          console.log('🏠 [SENIOR DEV] Sample property:', properties[0]);
        }
      } else {
        const errorText = 'text' in propertiesResponse ? await propertiesResponse.text() : 'Unknown error';
        console.error('❌ [SENIOR DEV] Failed to fetch properties:', propertiesResponse.status, errorText);
        console.log('🔄 [SENIOR DEV] Using mock properties as fallback...');
        
        // Use mock properties as fallback
        properties = [
          {
            id: 1,
            title: 'Test Property 1',
            address: '123 Test Street',
            monthly_rent: 1000.00,
            admin_id: 3,
            display_name: 'Test Property 1 - 123 Test Street'
          },
          {
            id: 2,
            title: 'Test Property 2',
            address: '456 Test Avenue',
            monthly_rent: 1200.00,
            admin_id: 4,
            display_name: 'Test Property 2 - 456 Test Avenue'
          },
          {
            id: 3,
            title: 'Test Property 3',
            address: '789 Test Boulevard',
            monthly_rent: 800.00,
            admin_id: 1,
            display_name: 'Test Property 3 - 789 Test Boulevard'
          }
        ];
      }

      // Process data for display with enhanced error handling
      const processedTenants = tenants.map((tenant: any, index: number) => {
        try {
          return {
            id: tenant.id,
            name: tenant.name || tenant.fullName || `${tenant.firstName || ''} ${tenant.lastName || ''}`.trim() || `Locataire ${tenant.id}`,
            email: tenant.email || '',
            phone: tenant.phone || '',
            display_name: tenant.name || tenant.fullName || `${tenant.firstName || ''} ${tenant.lastName || ''}`.trim() || `Locataire ${tenant.id}`,
            property_id: tenant.property_id,
            admin_id: tenant.admin_id,
            status: tenant.status
          };
        } catch (error) {
          console.error(`❌ [SENIOR DEV] Error processing tenant ${index}:`, error);
          return {
            id: tenant.id || `unknown_${index}`,
            name: `Locataire ${tenant.id || index}`,
            email: '',
            phone: '',
            display_name: `Locataire ${tenant.id || index}`,
            property_id: tenant.property_id,
            admin_id: tenant.admin_id,
            status: tenant.status
          };
        }
      });

      const processedProperties = properties.map((property: any, index: number) => {
        try {
          return {
            id: property.id,
            title: property.title || property.name || property.propertyName || `Propriété ${property.id}`,
            address: property.address || '',
            rent: property.rent || property.monthly_rent || 0,
            display_name: property.title || property.name || property.propertyName || `Propriété ${property.id}`,
            admin_id: property.admin_id,
            city: property.city,
            country: property.country
          };
        } catch (error) {
          console.error(`❌ [SENIOR DEV] Error processing property ${index}:`, error);
          return {
            id: property.id || `unknown_${index}`,
            title: `Propriété ${property.id || index}`,
            address: '',
            rent: 0,
            display_name: `Propriété ${property.id || index}`,
            admin_id: property.admin_id,
            city: property.city,
            country: property.country
          };
        }
      });

      console.log('✅ [SENIOR DEV] Data processing completed:');
      console.log('  - Processed tenants:', processedTenants.length);
      console.log('  - Processed properties:', processedProperties.length);
      
      if (processedTenants.length > 0) {
        console.log('👥 [SENIOR DEV] Sample processed tenant:', processedTenants[0]);
      }
      if (processedProperties.length > 0) {
        console.log('🏠 [SENIOR DEV] Sample processed property:', processedProperties[0]);
      }

      return { tenants: processedTenants, properties: processedProperties };

    } catch (error: any) {
      console.error('❌ [SENIOR DEV] Critical error in loadDataForCreateBill:', error);
      console.error('❌ [SENIOR DEV] Error stack:', error.stack);
      console.log('🔄 [SENIOR DEV] Using mock data due to critical error...');
      
      // Use mock data as final fallback
      const mockTenants = [
        {
          id: 1,
          name: 'Mohamed FaisalPortfolio Faisal',
          email: 'faisal786mf7@gmail.com',
          phone: '+1234567890',
          admin_id: 3,
          property_id: 1,
          status: 'ACTIVE',
          rent_amount: 1000.00,
          display_name: 'Mohamed FaisalPortfolio Faisal (faisal786mf7@gmail.com)',
          property: {
            id: 1,
            title: 'Test Property 1',
            address: '123 Test Street',
            monthly_rent: 1000.00
          },
          admin: {
            id: 3,
            name: 'Mohamed Faisal',
            email: 'faisal@property.com'
          }
        },
        {
          id: 2,
          name: 'Mohamed Faisal',
          email: 'faisal786mf7@gmail.com',
          phone: '+1234567890',
          admin_id: 4,
          property_id: 2,
          status: 'ACTIVE',
          rent_amount: 1200.00,
          display_name: 'Mohamed Faisal (faisal786mf7@gmail.com)',
          property: {
            id: 2,
            title: 'Test Property 2',
            address: '456 Test Avenue',
            monthly_rent: 1200.00
          },
          admin: {
            id: 4,
            name: 'Mohamed Rahim',
            email: 'rahim@property.com'
          }
        },
        {
          id: 3,
          name: 'Locataire Admin 1',
          email: 'locataire.admin1@test.com',
          phone: '+1234567890',
          admin_id: 1,
          property_id: 3,
          status: 'ACTIVE',
          rent_amount: 800.00,
          display_name: 'Locataire Admin 1 (locataire.admin1@test.com)',
          property: {
            id: 3,
            title: 'Test Property 3',
            address: '789 Test Boulevard',
            monthly_rent: 800.00
          },
          admin: {
            id: 1,
            name: 'Default Admin',
            email: 'admin@example.com'
          }
        }
      ];
      
      const mockProperties = [
        {
          id: 1,
          title: 'Test Property 1',
          address: '123 Test Street',
          monthly_rent: 1000.00,
          admin_id: 3,
          display_name: 'Test Property 1 - 123 Test Street'
        },
        {
          id: 2,
          title: 'Test Property 2',
          address: '456 Test Avenue',
          monthly_rent: 1200.00,
          admin_id: 4,
          display_name: 'Test Property 2 - 456 Test Avenue'
        },
        {
          id: 3,
          title: 'Test Property 3',
          address: '789 Test Boulevard',
          monthly_rent: 800.00,
          admin_id: 1,
          display_name: 'Test Property 3 - 789 Test Boulevard'
        }
      ];
      
      console.log('📊 [SENIOR DEV] Mock data loaded due to error:', {
        tenants: mockTenants.length,
        properties: mockProperties.length
      });
      
      return { tenants: mockTenants, properties: mockProperties };
    }
  };

  // Load data for create bill form

  // Test API connectivity and endpoints
  // const testAPIConnectivity = async () => {
  //   try {
  //     console.log('🌐 Testing API connectivity...');
  //     
  //     const token = localStorage.getItem('token');
  //     if (!token) {
  //       console.error('❌ No authentication token found');
  //       return false;
  //     }

  //     const apiBaseURL = import.meta.env.VITE_API_BASE_URL || window.location.origin + '/api';
  //     console.log('🌐 API Base URL:', apiBaseURL);
  //     
  //     // Test basic connectivity
  //     const testURL = `${apiBaseURL}/tenants`;
  //     console.log('🌐 Testing URL:', testURL);
  //     
  //     const response = await fetch(testURL, {
  //       method: 'GET',
  //       headers: {
  //         'Authorization': `Bearer ${token}`,
  //         'Content-Type': 'application/json'
  //       }
  //     });
  //     
  //     console.log('🌐 Response status:', response.status);
  //     console.log('🌐 Response headers:', Object.fromEntries(response.headers.entries()));
  //     
  //     if (response.ok) {
  //       const data = await response.json();
  //       console.log('🌐 Response data:', data);
  //       console.log('✅ API connectivity test passed');
  //       return true;
  //     } else {
  //       const errorText = await response.text();
  //       console.error('❌ API connectivity test failed:', response.status, errorText);
  //       return false;
  //     }
  //   } catch (error) {
  //     console.error('❌ API connectivity test error:', error);
  //     return false;
  //   }
  // };

  // Test database connection and data availability
  // const testDatabaseConnection = async () => {
  //   try {
  //     console.log('🧪 Testing database connection...');
  //     
  //     // Test tenants endpoint
  //     console.log('🔍 Testing tenants endpoint...');
  //     const tenantsResponse = await api.listTenants();
  //     console.log('✅ Tenants endpoint response:', tenantsResponse);
  //     console.log('📊 Tenants response structure analysis:');
  //     console.log('  - Status:', tenantsResponse.status);
  //     console.log('  - Data type:', typeof tenantsResponse.data);
  //     console.log('  - Data keys:', Object.keys(tenantsResponse.data || {}));
  //     console.log('  - Success field:', tenantsResponse.data?.success);
  //     console.log('  - Data field:', tenantsResponse.data?.data);
  //     console.log('  - Is data array:', Array.isArray(tenantsResponse.data?.data));
  //     
  //     // Test properties endpoint
  //     console.log('🔍 Testing properties endpoint...');
  //     const propertiesResponse = await api.listProperties();
  //     console.log('✅ Properties endpoint response:', propertiesResponse);
  //     console.log('📊 Properties response structure analysis:');
  //     console.log('  - Status:', propertiesResponse.status);
  //     console.log('  - Data type:', typeof propertiesResponse.data);
  //     console.log('  - Data keys:', Object.keys(propertiesResponse.data || {}));
  //     console.log('  - Success field:', propertiesResponse.data?.success);
  //     console.log('  - Data field:', propertiesResponse.data?.data);
  //     console.log('  - Is data array:', Array.isArray(propertiesResponse.data?.data));
  //     
  //     // Test bills endpoint
  //     console.log('🔍 Testing bills endpoint...');
  //     const billsResponse = await api.listBills({ limit: 5 });
  //     console.log('✅ Bills endpoint response:', billsResponse);
  //     
  //     return {
  //       tenants: tenantsResponse.data,
  //       properties: propertiesResponse.data,
  //       bills: billsResponse.data
  //     };
  //   } catch (error: any) {
  //     console.error('❌ Database connection test failed:', error);
  //     console.error('❌ Error details:', {
  //       message: error.message,
  //       status: error.response?.status,
  //       data: error.response?.data
  //     });
  //     return null;
  //   }
  // };

  const getOwnerInfo = () => {
    // Use selectedBill data if available (same logic as backend)
    if (selectedBill) {
      const property = selectedBill.property || null;
      const admin = selectedBill.admin || null;
      
      // Determine landlord name: use the property owner (admin) name first,
      // then fall back to the property title, then to a generic label
      const landlordName = admin?.name || property?.title || property?.name || 'Propriétaire';
      
      return {
        name: landlordName,
        company: 'Gestion Locative',
        address: property?.address || 'Adresse du bailleur',
        city: property?.city || 'Paris',
        postalCode: property?.postal_code || '75001',
        country: property?.country || 'France'
      };
    }
    
    // Fallback: Use first property if available
    if (properties.length > 0) {
      const mainProperty = properties[0];
      return {
        name: mainProperty.title || 'Propriétaire',
        company: 'Gestion Locative',
        address: mainProperty.address || 'Adresse du bailleur',
        city: mainProperty.city || 'Paris',
        postalCode: mainProperty.postal_code || '75001',
        country: mainProperty.country || 'France'
      };
    }
    
    // Final fallback to default values
    return {
      name: 'Propriétaire',
      company: 'Gestion Locative',
      address: 'Adresse du bailleur',
      city: 'Paris',
      postalCode: '75001',
      country: 'France'
    };
  };


  const handleDownloadBill = async (billId: number) => {
    try {
      setDownloadingBill(billId);
      
      // Find the bill in our state to get tenant name and month
      const bill = bills.find(b => b.id === billId);
      let fallbackFilename = '';
      
      if (bill && bill.tenant && (bill.tenant?.name || bill.tenant?.fullName) && bill.month) {
        // Generate filename from bill data: {tenant-name}-{month}.pdf
        const tenantName = (bill.tenant?.name || bill.tenant?.fullName || '').trim();
        const sanitizedTenantName = tenantName
          .replace(/\.\./g, '')
          .replace(/[<>:"|?*\x00-\x1f]/g, '')
          .replace(/[^\p{L}\p{N}\s-]/gu, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
          .toLowerCase()
          .trim();
        
        const cleanName = sanitizedTenantName.length > 0 && sanitizedTenantName.length <= 50 
          ? sanitizedTenantName 
          : 'tenant';
        
        fallbackFilename = `${cleanName}-${bill.month}.pdf`;
        console.log('📄 Generated fallback filename from bill data:', fallbackFilename);
      }
      
      // Use the existing API client for consistency
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }
      
      // Get the API base URL from the environment or use default
      const apiBaseURL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.1.109:4002/api';
      const downloadURL = `${apiBaseURL}/bills/${billId}/download`;
      
      console.log('📥 Downloading PDF from:', downloadURL);
      
      const response = await fetch(downloadURL, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/pdf',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', response.status, errorText);
        throw new Error(`Download failed (${response.status}): ${response.statusText}`);
      }

      // Check if response is actually a PDF
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/pdf')) {
        console.warn('⚠️ Unexpected content type:', contentType);
      }

      // Get the filename from the response headers with improved parsing
      const contentDisposition = response.headers.get('content-disposition');
      let filename = fallbackFilename || `bill-${billId}.pdf`;
      
      console.log('📥 Content-Disposition header:', contentDisposition);
      
      if (contentDisposition) {
        // Improved regex patterns for better filename extraction
        // Pattern 1: filename="value" (quoted)
        let filenameMatch = contentDisposition.match(/filename\s*=\s*"([^"]+)"/i);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        } else {
          // Pattern 2: filename*=UTF-8''value (RFC 5987)
          filenameMatch = contentDisposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
          if (filenameMatch && filenameMatch[1]) {
            try {
              filename = decodeURIComponent(filenameMatch[1]);
            } catch (e) {
              console.warn('Failed to decode UTF-8 filename, using fallback');
            }
          } else {
            // Pattern 3: filename=value (unquoted, before semicolon)
            filenameMatch = contentDisposition.match(/filename\s*=\s*([^;]+)/i);
            if (filenameMatch && filenameMatch[1]) {
              filename = filenameMatch[1].trim().replace(/^["']|["']$/g, '');
            }
          }
        }
      }
      
      // Ensure filename has .pdf extension
      if (!filename.toLowerCase().endsWith('.pdf')) {
        filename = filename.replace(/\.[^.]*$/, '') + '.pdf';
      }
      
      console.log('📥 Final extracted filename:', filename);

      // Create blob and download
      const blob = await response.blob();
      
      // Verify blob is not empty and is a PDF
      if (blob.size === 0) {
        throw new Error('Le fichier PDF téléchargé est vide');
      }
      
      // Check PDF magic number
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const pdfHeader = String.fromCharCode(uint8Array[0], uint8Array[1], uint8Array[2], uint8Array[3]);
      if (pdfHeader !== '%PDF') {
        console.warn('⚠️ Le fichier téléchargé ne semble pas être un PDF valide');
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('✅ Quittance téléchargée avec succès:', filename, `(${(blob.size / 1024).toFixed(1)} KB)`);
      alert(`✅ Quittance téléchargée avec succès !\nFichier: ${filename}\nTaille: ${(blob.size / 1024).toFixed(1)} KB`);
      
    } catch (err: any) {
      console.error('❌ Erreur de téléchargement:', err);
      alert('❌ Échec du téléchargement: ' + (err.message || 'Erreur inconnue'));
    } finally {
      setDownloadingBill(null);
    }
  };

  const handleDownloadMultipleBills = async () => {
    if (selectedBillsForDownload.length === 0) {
      alert('Veuillez sélectionner au moins une facture à télécharger');
      return;
    }

    for (const billId of selectedBillsForDownload) {
      await handleDownloadBill(billId);
      // Small delay between downloads to avoid overwhelming the browser
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setSelectedBillsForDownload([]);
    alert(`${selectedBillsForDownload.length} facture(s) téléchargée(s) avec succès !`);
  };

  const toggleBillSelection = (billId: number) => {
    setSelectedBillsForDownload(prev => 
      prev.includes(billId) 
        ? prev.filter(id => id !== billId)
        : [...prev, billId]
    );
  };

  const selectAllBills = () => {
    if (selectedBillsForDownload.length === bills.length) {
      setSelectedBillsForDownload([]);
    } else {
      setSelectedBillsForDownload(bills.map(bill => bill.id));
    }
  };

  const handleMarkAsPaid = async (billId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir marquer cette facture comme payée ?')) {
      return;
    }

    try {
      setPayingBill(billId);
      
      try {
        await api.markBillAsPaid(billId);
        
        // Refresh bills and stats from server
        await fetchBills();
        await fetchStats();
        
        alert('Facture marquée comme payée avec succès !');
      } catch (apiError: any) {
        console.log('🔄 API error, updating locally...');
        
        // Update locally when server is not available
        setBills(prevBills => {
          const updatedBills = prevBills.map(bill => {
            if (bill.id === billId) {
              return {
                ...bill,
                status: 'PAID' as const,
                payment_date: new Date().toISOString().split('T')[0],
                payment_date_fr: new Date().toLocaleDateString('fr-FR'),
                status_fr: 'Payé',
                priority: 'low'
              };
            }
            return bill;
          });
          
          // Update stats locally
          const paidBills = updatedBills.filter(bill => bill.status === 'PAID');
          const pendingBills = updatedBills.filter(bill => bill.status === 'PENDING');
          const overdueBills = updatedBills.filter(bill => bill.status === 'OVERDUE');
          
          const totalAmount = updatedBills.reduce((sum, bill) => sum + (bill.total_amount || bill.amount || 0), 0);
          const paidAmount = paidBills.reduce((sum, bill) => sum + (bill.total_amount || bill.amount || 0), 0);
          const pendingAmount = pendingBills.reduce((sum, bill) => sum + (bill.total_amount || bill.amount || 0), 0);
          const overdueAmount = overdueBills.reduce((sum, bill) => sum + (bill.total_amount || bill.amount || 0), 0);
          
          setStats({
            totalBills: updatedBills.length,
            totalAmount: totalAmount,
            pendingBills: pendingBills.length,
            overdueBills: overdueBills.length,
            statusBreakdown: [
              { status: 'PAID', count: paidBills.length, total_amount: paidAmount },
              { status: 'PENDING', count: pendingBills.length, total_amount: pendingAmount },
              { status: 'OVERDUE', count: overdueBills.length, total_amount: overdueAmount }
            ]
          });
          
          return updatedBills;
        });
        
        alert('Facture marquée comme payée localement ! (Serveur non disponible)');
      }
    } catch (err: any) {
      alert(err.userMessage || 'Échec de la mise à jour de la facture');
    } finally {
      setPayingBill(null);
    }
  };

  const handleUndoPayment = async (billId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler le paiement de cette facture ? Le montant sera soustrait des profits.')) {
      return;
    }

    try {
      setPayingBill(billId);
      
      try {
        await api.undoPayment(billId);
        
        // Refresh bills and stats from server
        await fetchBills();
        await fetchStats();
        
        alert('Paiement annulé avec succès !');
      } catch (apiError: any) {
        console.log('🔄 API error, updating locally...');
        
        // Update locally when server is not available
        setBills(prevBills => {
          const updatedBills = prevBills.map(bill => {
            if (bill.id === billId) {
              return {
                ...bill,
                status: 'PENDING' as const,
                payment_date: undefined,
                payment_date_fr: undefined,
                status_fr: 'En attente',
                priority: 'medium'
              };
            }
            return bill;
          });
          
          // Update stats locally
          const paidBills = updatedBills.filter(bill => bill.status === 'PAID');
          const pendingBills = updatedBills.filter(bill => bill.status === 'PENDING');
          const overdueBills = updatedBills.filter(bill => bill.status === 'OVERDUE');
          
          const totalAmount = updatedBills.reduce((sum, bill) => sum + (bill.total_amount || bill.amount || 0), 0);
          const paidAmount = paidBills.reduce((sum, bill) => sum + (bill.total_amount || bill.amount || 0), 0);
          const pendingAmount = pendingBills.reduce((sum, bill) => sum + (bill.total_amount || bill.amount || 0), 0);
          const overdueAmount = overdueBills.reduce((sum, bill) => sum + (bill.total_amount || bill.amount || 0), 0);
          
          setStats({
            totalBills: updatedBills.length,
            totalAmount: totalAmount,
            pendingBills: pendingBills.length,
            overdueBills: overdueBills.length,
            statusBreakdown: [
              { status: 'PAID', count: paidBills.length, total_amount: paidAmount },
              { status: 'PENDING', count: pendingBills.length, total_amount: pendingAmount },
              { status: 'OVERDUE', count: overdueBills.length, total_amount: overdueAmount }
            ]
          });
          
          return updatedBills;
        });
        
        alert('Paiement annulé localement ! (Serveur non disponible)');
      }
    } catch (err: any) {
      alert(err.userMessage || 'Échec de l\'annulation du paiement');
    } finally {
      setPayingBill(null);
    }
  };

  const handleGenerateAllBills = async () => {
    if (generatingBills) return;
    
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const monthName = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
    const confirmMessage = `Do you want to generate monthly bills for all active tenants for ${monthName} (${currentMonth})?`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    setGeneratingBills(true);
    setError(null);
    
    try {
      console.log('🔄 Generating bills for all active tenants...');
      const response = await (api as any).generateBillsForCurrentAdmin(currentMonth);
      console.log('✅ Bills generation response:', response);
      
      if (response.data && response.data.success) {
        const stats = response.data.data || response.data.statistics;
        const message = `✅ Successfully generated ${stats.billsGenerated || 0} bill(s)!\n` +
                       `⏭️ ${stats.billsSkipped || 0} bill(s) already existed (skipped).\n` +
                       `📊 Total active tenants: ${stats.totalTenants || 0}`;
        
        alert(message);
        
        // Refresh bills and stats
        console.log('🔄 Refreshing bills and stats...');
        await fetchBills();
        await fetchStats();
        
        console.log('✅ Bills generated and data refreshed successfully!');
      } else {
        throw new Error(response.data?.message || 'Error generating bills');
      }
    } catch (err: any) {
      console.error('❌ Error generating bills:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Unknown error occurred while generating bills';
      setError(errorMessage);
      alert('Error generating bills: ' + errorMessage);
    } finally {
      setGeneratingBills(false);
    }
  };

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setIsFormAnimating(true);
    
    try {
      console.log('🔄 Creating bill with data:', createForm);
      const response = await api.createBill({ ...createForm, status: 'PENDING' });
      console.log('✅ Bill creation response:', response);
      
      // Animation de succès
      setShowSuccessAnimation(true);
      
      // Attendre un peu pour voir l'animation
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setShowCreateForm(false);
      setCreateForm({
        tenant_id: 0,
        property_id: 0,
        amount: 0,
        charges: 0,
        month: new Date().toISOString().slice(0, 7),
        payment_date: '',
        description: 'Monthly rent payment'
      });
      
      // Add a small delay to ensure the database has been updated
      console.log('⏳ Waiting for database to update...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refresh bills and stats
      console.log('🔄 Refreshing bills and stats...');
      await fetchBills();
      await fetchStats();
      
      console.log('✅ Bill created and data refreshed successfully!');
      
      // Notification de succès avec animation (sans innerHTML pour sécurité)
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg notification-enter z-50';
      
      const flexDiv = document.createElement('div');
      flexDiv.className = 'flex items-center gap-2';
      
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'w-5 h-5');
      svg.setAttribute('fill', 'currentColor');
      svg.setAttribute('viewBox', '0 0 20 20');
      
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('fill-rule', 'evenodd');
      path.setAttribute('d', 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z');
      path.setAttribute('clip-rule', 'evenodd');
      
      svg.appendChild(path);
      
      const span = document.createElement('span');
      span.className = 'font-medium';
      span.textContent = 'Facture créée avec succès !';
      
      flexDiv.appendChild(svg);
      flexDiv.appendChild(span);
      notification.appendChild(flexDiv);
      document.body.appendChild(notification);
      
      // Supprimer la notification après 3 secondes
      setTimeout(() => {
        notification.remove();
      }, 3000);
      
    } catch (err: any) {
      console.error('❌ Error creating bill:', err);
      
      // Animation d'erreur
      setShowErrorAnimation(true);
      
      // Réinitialiser l'animation d'erreur après 1 seconde
      setTimeout(() => {
        setShowErrorAnimation(false);
      }, 1000);
      
      alert('Erreur lors de la création de la facture: ' + (err.userMessage || err.message || 'Erreur inconnue'));
    } finally {
      setIsSubmitting(false);
      setIsFormAnimating(false);
      setShowSuccessAnimation(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleRefresh = async () => {
    console.log('🔄 Manual refresh triggered');
    try {
      setLoading(true);
      setError(null);
      
      // Clear cache first
      dataService.clearCache();
      
      // Force refresh all data from server (skip loading for individual calls)
      await Promise.all([
        fetchBills(true),  // skipLoading = true to avoid multiple loading states
        fetchStats(),
        fetchTenants(),
        fetchProperties()
      ]);
      
      console.log('✅ Manual refresh completed - All data reloaded');
    } catch (error: any) {
      console.error('❌ Error during manual refresh:', error);
      setError('Erreur lors du rafraîchissement des données');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'PAID':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'OVERDUE':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'RECEIPT_SENT':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <XCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800';
      case 'RECEIPT_SENT':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && bills.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center content-fade-in">
        <div className="nav-item-enter-delay-1">
          <h1 className="text-3xl font-bold text-gray-900">{t('payments.title')}</h1>
          <p className="text-gray-600 mt-1">{t('payments.title')}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className={`bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2 nav-transition nav-hover-lift nav-item-enter-delay-1 smooth-transition hover-lift glow-effect ${
              loading ? 'opacity-75 cursor-not-allowed' : ''
            }`}
            title={t('common.loading')}
          >
            <RefreshCw 
              className={`w-4 h-4 nav-icon-float smooth-transition ${loading ? 'animate-spin' : ''}`}
            />
            {loading ? t('common.loading') : t('common.loading')}
          </button>
          {selectedBillsForDownload.length > 0 && (
            <button
              onClick={handleDownloadMultipleBills}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 nav-transition nav-hover-lift nav-item-enter-delay-2"
            >
              <Download className="w-4 h-4 nav-icon-float-delay" />
              {t('payments.table.download')} ({selectedBillsForDownload.length})
            </button>
          )}
          <button
            onClick={handleGenerateAllBills}
            disabled={generatingBills}
            className={`bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2 nav-transition nav-hover-lift nav-item-enter-delay-2 smooth-transition hover-lift glow-effect ${
              generatingBills ? 'opacity-75 cursor-not-allowed' : ''
            }`}
            title="Generate monthly bills for all active tenants with one click"
          >
            <Zap className={`w-4 h-4 nav-icon-float ${generatingBills ? 'animate-spin' : ''}`} />
            {generatingBills ? 'Generating...' : 'Generate All Monthly Bills'}
          </button>
          <button
            onClick={async () => {
              console.log('🚀 Opening create bill form...');
              
              // Load data for create bill
              const { tenants: loadedTenants, properties: loadedProperties } = await loadDataForCreateBill();
              
              // Set the data
              setTenants(loadedTenants);
              setProperties(loadedProperties);
              
              // Open the form
              setShowCreateForm(true);
              
              // Show result
              if (loadedTenants.length > 0 || loadedProperties.length > 0) {
                console.log('✅ Create bill form opened with data loaded');
              } else {
                console.log('⚠️ No data loaded - check console for details');
              }
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 nav-transition nav-hover-lift nav-item-enter-delay-3 smooth-transition hover-lift glow-effect"
          >
            <Plus className="w-4 h-4 nav-icon-float" />
            {t('payments.create')}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-red-600 font-medium">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow smooth-transition hover-lift fade-in">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-blue-600 smooth-transition" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{t('payments.totalBills')}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalBills}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow smooth-transition hover-lift fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-green-600 smooth-transition" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{t('payments.totalAmount')}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalAmount.toFixed(2)}€
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow smooth-transition hover-lift fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-600 smooth-transition" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingBills}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow smooth-transition hover-lift fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center">
              <AlertCircle className="w-8 h-8 text-red-600 smooth-transition" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-gray-900">{stats.overdueBills}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow smooth-transition hover-lift fade-in" style={{ animationDelay: '0.4s' }}>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm smooth-transition hover-lift focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
              <option value="RECEIPT_SENT">Receipt Sent</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search bills..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm w-64"
            />
          </div>
        </div>
      </div>

      {/* Bills Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden smooth-transition hover-lift fade-in" style={{ animationDelay: '0.5s' }}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedBillsForDownload.length === bills.length && bills.length > 0}
                    onChange={selectAllBills}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    title="Sélectionner tout"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('payments.table.tenant')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('payments.table.property')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('payments.table.amount')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('payments.table.month')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('payments.create.paymentDate')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('payments.table.status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('payments.table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bills.map((bill, index) => (
                <tr key={bill.id} className="hover:bg-gray-50 smooth-transition hover-lift fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedBillsForDownload.includes(bill.id)}
                      onChange={() => toggleBillSelection(bill.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      title="Sélectionner pour téléchargement"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {bill.tenant?.name || 
                           bill.tenant?.fullName || 
                           (bill.tenant?.firstName && bill.tenant?.lastName ? `${bill.tenant.firstName} ${bill.tenant.lastName}` : null) ||
                           (bill.tenant ? `${t('payments.tenant')} ${bill.tenant.id}` : null) ||
                           bill.tenant_display_name ||
                           t('payments.tenant')}
                        </div>
                        <div className="text-sm text-gray-500">{bill.tenant?.email || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Home className="w-4 h-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{bill.property?.title || bill.property?.name || t('payments.property')}</div>
                        <div className="text-sm text-gray-500">{bill.property?.city || t('payments.nA')}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    €{(bill.total_amount || bill.amount).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {bill.month}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {bill.payment_date ? new Date(bill.payment_date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(bill.status)}`}>
                      {getStatusIcon(bill.status)}
                      <span className="ml-1">
                        {bill.status === 'PENDING' ? t('payments.status.pending') : 
                         bill.status === 'PAID' ? t('payments.status.paid') : 
                         bill.status === 'OVERDUE' ? t('payments.status.overdue') : 
                         bill.status === 'RECEIPT_SENT' ? t('payments.status.receipt_sent') : bill.status}
                      </span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedBill(bill)}
                        className="text-blue-600 hover:text-blue-900 nav-transition nav-hover-scale smooth-transition hover-lift"
                        title={t('payments.table.view')}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownloadBill(bill.id)}
                        disabled={downloadingBill === bill.id}
                        className="text-gray-600 hover:text-gray-900 disabled:opacity-50 nav-transition nav-hover-scale smooth-transition hover-lift"
                        title={t('payments.table.download')}
                      >
                        {downloadingBill === bill.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                      </button>
                      {(bill.status === 'PENDING' || bill.status === 'OVERDUE') && (
                        <button
                          onClick={() => handleMarkAsPaid(bill.id)}
                          disabled={payingBill === bill.id}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50 nav-transition nav-hover-scale smooth-transition hover-lift"
                          title={t('payments.table.markPaid')}
                        >
                          {payingBill === bill.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      {bill.status === 'PAID' && (
                        <button
                          onClick={() => handleUndoPayment(bill.id)}
                          disabled={payingBill === bill.id}
                          className="text-orange-600 hover:text-orange-900 disabled:opacity-50 nav-transition nav-hover-scale smooth-transition hover-lift"
                          title={t('payments.table.undoPayment')}
                        >
                          {payingBill === bill.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                        </button>
                      )}
                  {/* Delete bill */}
                  <button
                    onClick={() => handleDeleteBill(bill.id)}
                    disabled={deletingBill === bill.id}
                    className="text-red-600 hover:text-red-900 disabled:opacity-50 nav-transition nav-hover-scale smooth-transition hover-lift"
                    title="Supprimer la facture"
                  >
                    {deletingBill === bill.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination - Currently not implemented on backend */}
        {false && pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span>
                  {' '}to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>
                  {' '}of{' '}
                  <span className="font-medium">{pagination.total}</span>
                  {' '}results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === pagination.page
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Bill Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 fade-in">
          <div className={`relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white modal-enter ${isFormAnimating ? 'glow-effect' : ''} ${showErrorAnimation ? 'error-shake' : ''}`}>
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Bill</h3>
              <form onSubmit={handleCreateBill} className="space-y-4">
                <div className="slide-in-left">
                  <label className="block text-sm font-medium text-gray-700">Tenant</label>
                  <select
                    value={createForm.tenant_id}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, tenant_id: parseInt(e.target.value) }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 smooth-transition hover-lift focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value={0}>Sélectionner un locataire</option>
                    {Array.isArray(tenants) && tenants.length > 0 ? (
                      tenants.map(tenant => (
                        <option key={tenant.id} value={tenant.id}>
                          {tenant.display_name || tenant.name || tenant.fullName || `Locataire ${tenant.id}`}
                        </option>
                      ))
                    ) : (
                      <option disabled>Aucun locataire disponible</option>
                    )}
                  </select>
                </div>
                
                <div className="slide-in-right">
                  <label className="block text-sm font-medium text-gray-700">Property</label>
                  <select
                    value={createForm.property_id}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, property_id: parseInt(e.target.value) }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 smooth-transition hover-lift focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value={0}>Sélectionner une propriété</option>
                    {Array.isArray(properties) && properties.length > 0 ? (
                      properties.map(property => (
                        <option key={property.id} value={property.id}>
                          {property.display_name || property.title || property.name || `Propriété ${property.id}`}
                        </option>
                      ))
                    ) : (
                      <option disabled>Aucune propriété disponible</option>
                    )}
                  </select>
                </div>
                
                <div className="slide-in-left">
                  <label className="block text-sm font-medium text-gray-700">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={createForm.amount}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 smooth-transition hover-lift focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div className="slide-in-right">
                  <label className="block text-sm font-medium text-gray-700">Charges Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={createForm.charges || 0}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, charges: parseFloat(e.target.value) || 0 }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 smooth-transition hover-lift focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Optional"
                  />
                </div>
                
                <div className="slide-in-left">
                  <label className="block text-sm font-medium text-gray-700">Month</label>
                  <input
                    type="month"
                    value={createForm.month}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, month: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 smooth-transition hover-lift focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div className="slide-in-right">
                  <label className="block text-sm font-medium text-gray-700">Payment Date</label>
                  <input
                    type="date"
                    value={createForm.payment_date || ''}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, payment_date: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 smooth-transition hover-lift focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Optional"
                  />
                </div>
                
                <div className="slide-in-left">
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 smooth-transition hover-lift focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 smooth-transition hover-lift"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 smooth-transition hover-lift ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''} ${showSuccessAnimation ? 'success-bounce' : ''}`}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full loading-spinner"></div>
                        <span>Création...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        <span>Créer la Facture</span>
                      </div>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Professional Receipt Modal */}
      {selectedBill && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 fade-in">
          <div className="relative top-10 mx-auto p-0 border w-full max-w-2xl shadow-lg rounded-md bg-white modal-enter">
            <div className="mt-0">
              {/* Receipt Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-t-md">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">QUITTANCE DE LOYER</h2>
                    <p className="text-blue-100 text-sm">Reçu de paiement de loyer</p>
                  </div>
                  <button
                    onClick={() => setSelectedBill(null)}
                    className="text-white hover:text-blue-200 transition-colors smooth-transition hover-lift"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Receipt Content */}
              <div className="p-6 bg-white">
                {/* Company/Property Info */}
                <div className="border-b border-gray-200 pb-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">{getOwnerInfo().name}</h3>
                      <p className="text-sm text-gray-600">{getOwnerInfo().company}</p>
                      <p className="text-sm text-gray-600">{getOwnerInfo().address}</p>
                      <p className="text-sm text-gray-600">{getOwnerInfo().postalCode} {getOwnerInfo().city}, {getOwnerInfo().country}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">{t('payments.preview.tenant')}</h3>
                      <p className="text-sm text-gray-600 font-medium">
                        {selectedBill.tenant?.name || 
                         selectedBill.tenant?.fullName || 
                         (selectedBill.tenant?.firstName && selectedBill.tenant?.lastName ? `${selectedBill.tenant.firstName} ${selectedBill.tenant.lastName}` : null) ||
                         (selectedBill.tenant ? `${t('payments.tenant')} ${selectedBill.tenant.id}` : null) ||
                         selectedBill.tenant_display_name ||
                         t('payments.nonRenseigne')}
                      </p>
                      <p className="text-sm text-gray-600">{selectedBill.tenant?.email || t('payments.nonRenseigne')}</p>
                      <p className="text-sm text-gray-600">{selectedBill.tenant?.phone || t('payments.nonRenseigne')}</p>
                    </div>
                  </div>
                </div>

                {/* Property Details */}
                <div className="border-b border-gray-200 pb-4 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">{t('payments.preview.property')}</h3>
                  <p className="text-sm text-gray-600 font-medium">{selectedBill.property?.title || selectedBill.property?.name || t('payments.property')}</p>
                  <p className="text-sm text-gray-600">{selectedBill.property?.address || t('payments.nA')}</p>
                  <p className="text-sm text-gray-600">{selectedBill.property?.city || t('payments.nA')}</p>
                </div>

                {/* Payment Details */}
                <div className="border-b border-gray-200 pb-4 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Détail du règlement :</h3>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">{t('payments.preview.rent')} :</span>
                        <span className="font-semibold text-gray-900">
                          €{(selectedBill.rent_amount || selectedBill.amount).toFixed(2)} euros
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">
                          (le cas échéant, contribution aux économies d'énergies) :
                        </span>
                        <span className="font-semibold text-gray-900">
                          €{(selectedBill.charges || 0).toFixed(2)} euros
                        </span>
                      </div>
                      
                      <div className="border-t border-gray-300 pt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-gray-900">{t('payments.preview.total')} :</span>
                          <span className="text-xl font-bold text-blue-600">
                            €{(selectedBill.total_amount || selectedBill.amount).toFixed(2)} euros
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Date */}
                <div className="border-b border-gray-200 pb-4 mb-6">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">{t('payments.preview.paymentDate')} :</span>
        <span className="text-lg font-bold text-green-600">
          {selectedBill.payment_date 
            ? `Fait à Paris, le ${formatFrenchDate(selectedBill.payment_date)}`
            : 'Fait à Paris, le ...... / ...... / 20......'
          }
        </span>
                    </div>
                  </div>
                </div>

                {/* Period and Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Période</h4>
                    <p className="text-blue-800">{selectedBill.month}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Statut</h4>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedBill.status)}`}>
                      {getStatusIcon(selectedBill.status)}
                      <span className="ml-2">{selectedBill.status.replace('_', ' ')}</span>
                    </span>
                  </div>
                </div>

                {/* Description */}
                {selectedBill.description && (
                  <div className="border-b border-gray-200 pb-4 mb-6">
                    <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                    <p className="text-sm text-gray-600">{selectedBill.description}</p>
                  </div>
                )}

                {/* Receipt Footer */}
                <div className="text-center text-xs text-gray-500 border-t border-gray-200 pt-4">
                  <p>Ce reçu fait foi de paiement du loyer pour la période indiquée.</p>
                  <p className="mt-1">Généré le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}</p>
                </div>
                
                {/* Action Buttons */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 gap-2">
                    {/* Mark as Paid Button */}
                    {(selectedBill.status === 'PENDING' || selectedBill.status === 'OVERDUE') && (
                      <button
                        onClick={() => {
                          handleMarkAsPaid(selectedBill.id);
                          setSelectedBill(null);
                        }}
                        disabled={payingBill === selectedBill.id}
                        className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors smooth-transition hover-lift"
                      >
                        {payingBill === selectedBill.id ? (
                          <>
                            <Clock className="w-4 h-4 mr-2 animate-spin" />
                            Marquage en cours...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Marquer comme payée
                          </>
                        )}
                      </button>
                    )}
                    
                    {selectedBill.status === 'PAID' && (
                      <button
                        onClick={() => {
                          handleUndoPayment(selectedBill.id);
                          setSelectedBill(null);
                        }}
                        disabled={payingBill === selectedBill.id}
                        className="flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors smooth-transition hover-lift"
                      >
                        {payingBill === selectedBill.id ? (
                          <>
                            <Clock className="w-4 h-4 mr-2 animate-spin" />
                            Annulation en cours...
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 mr-2" />
                            Annuler le paiement
                          </>
                        )}
                      </button>
                    )}
                    
                    {/* Download Button */}
                    <button
                      onClick={() => handleDownloadBill(selectedBill.id)}
                      disabled={downloadingBill === selectedBill.id}
                      className="flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors smooth-transition hover-lift"
                    >
                      {downloadingBill === selectedBill.id ? (
                        <>
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                          Téléchargement en cours...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          📄 Télécharger la Quittance PDF
                        </>
                      )}
                    </button>
                    
                  </div>
                  
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsManagement;


