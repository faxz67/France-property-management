import { useEffect, useState, useCallback, Suspense, lazy, memo } from 'react';
import { Bell, Heart, X, Star, MapPin, Users, Bed, Bath, Wifi, Car, Coffee, Tv, LayoutDashboard, Building2, CreditCard, BarChart3, Settings as SettingsIcon, Shield, DollarSign, TrendingUp, Download, HelpCircle, Database, Globe } from 'lucide-react';
import '../styles/navigation-animations.css';
import '../styles/professional-animations.css';
import dataService from '../services/dataService';
import LoadingSpinner from '../components/LoadingSpinner';
import ProfessionalCard from '../components/ProfessionalCard';
import NotificationsCenter from '../components/NotificationsCenter';
import api from '../api';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useLanguage } from '../contexts/LanguageContext';

// Lazy load heavy components for better performance
const TunnetSectionFixed = lazy(() => import('../components/TunnetSectionFixed'));
const PaymentsManagement = lazy(() => import('../components/PaymentsManagement'));
const PropertiesSection = lazy(() => import('../components/PropertiesSection'));
const AdminManagement = lazy(() => import('./AdminManagement'));
const ExpenseAnalytics = lazy(() => import('./ExpenseAnalytics'));
const ExpenseAnalysis = lazy(() => import('./ExpenseAnalysis'));
const ApiDiagnostics = lazy(() => import('../components/ApiDiagnostics'));

const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

// Types
interface DashboardProperty {
  id: number;
  title?: string;
  name?: string;
  rent?: number;
  monthly_rent?: number;
  [key: string]: any;
}


interface Activity {
  id: string;
  type: string;
  message: string;
  detail: string;
  time: string;
  color: string;
}

// Export functions
const exportToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    alert('Aucune donnée à exporter');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const exportDashboardData = async () => {
  try {
    const [propertiesRes, tenantsRes, billsRes, expensesRes, billsStatsRes] = await Promise.all([
      api.listProperties(),
      api.listTenants(),
      api.listBills({ limit: 1000 }),
      api.listExpenses(),
      api.getBillsStats()
    ]);

    const properties = propertiesRes.data?.data || [];
    const tenants = tenantsRes.data?.data || [];
    const bills = billsRes.data?.data?.bills || [];
    const expenses = expensesRes.data?.data || [];
    const stats = billsStatsRes.data?.data || {};

    // Export Properties
    if (properties.length > 0) {
      const propertiesData = properties.map((prop: any) => ({
        'ID': prop.id,
        'Titre': prop.title || prop.name || '',
        'Adresse': prop.address || '',
        'Ville': prop.city || '',
        'Code Postal': prop.postal_code || '',
        'Loyer Mensuel': prop.rent || prop.monthly_rent || 0,
        'Type': prop.type || '',
        'Statut': prop.status || 'ACTIVE',
        'Date de Création': new Date(prop.created_at).toLocaleDateString('fr-FR')
      }));
      exportToCSV(propertiesData, 'proprietes');
    }

    // Export Tenants
    if (tenants.length > 0) {
      const tenantsData = tenants.map((tenant: any) => ({
        'ID': tenant.id,
        'Nom Complet': tenant.fullName || tenant.full_name || '',
        'Email': tenant.email || '',
        'Téléphone': tenant.phone || '',
        'Propriété': tenant.propertyName || tenant.property_name || '',
        'Statut': tenant.status || tenant.is_active ? 'ACTIF' : 'INACTIF',
        'Date d\'Entrée': tenant.move_in_date ? new Date(tenant.move_in_date).toLocaleDateString('fr-FR') : '',
        'Date de Création': new Date(tenant.created_at).toLocaleDateString('fr-FR')
      }));
      exportToCSV(tenantsData, 'locataires');
    }

    // Export Bills
    if (bills.length > 0) {
      const billsData = bills.map((bill: any) => ({
        'ID': bill.id,
        'Locataire': bill.tenantName || bill.tenant_name || '',
        'Propriété': bill.propertyName || bill.property_name || '',
        'Mois': bill.month || '',
        'Loyer': bill.rent_amount || bill.amount || 0,
        'Charges': bill.charges || 0,
        'Total': bill.total_amount || bill.amount || 0,
        'Statut': bill.status === 'PAID' ? 'PAYÉ' : 'EN ATTENTE',
        'Date de Paiement': bill.payment_date ? new Date(bill.payment_date).toLocaleDateString('fr-FR') : '',
        'Date de Création': new Date(bill.created_at).toLocaleDateString('fr-FR')
      }));
      exportToCSV(billsData, 'factures');
    }

    // Export Expenses
    if (expenses.length > 0) {
      const expensesData = expenses.map((expense: any) => ({
        'ID': expense.id,
        'Description': expense.description || '',
        'Type': expense.type || '',
        'Montant': expense.amount || 0,
        'Propriété': expense.propertyName || expense.property_name || '',
        'Date': expense.date ? new Date(expense.date).toLocaleDateString('fr-FR') : '',
        'Date de Création': new Date(expense.created_at).toLocaleDateString('fr-FR')
      }));
      exportToCSV(expensesData, 'depenses');
    }

    // Export Summary Statistics
    const summaryData = [{
      'Total Propriétés': properties.length,
      'Locataires Actifs': tenants.filter((t: any) => t.status === 'ACTIVE' || t.is_active).length,
      'Factures Total': bills.length,
      'Factures Payées': bills.filter((b: any) => b.status === 'PAID').length,
      'Factures En Attente': bills.filter((b: any) => b.status !== 'PAID').length,
      'Revenus Mensuels': (stats as any).totalAmount || 0,
      'Total Dépenses': expenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0),
      'Date d\'Export': new Date().toLocaleDateString('fr-FR')
    }];
    exportToCSV(summaryData, 'resume_dashboard');

    alert('Exportation terminée ! Tous les fichiers CSV ont été téléchargés.');
  } catch (error) {
    console.error('Erreur lors de l\'exportation:', error);
    alert('Erreur lors de l\'exportation des données. Veuillez réessayer.');
  }
};

// Real Statistics Component - Memoized for performance
const RealStatistics = memo(({ onError }: { onError?: (hasError: boolean) => void }) => {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    totalProperties: 0,
    activeTenants: 0,
    monthlyRevenue: 0,
    pendingBills: 0,
    loading: true,
    error: null as string | null,
    lastUpdated: null as string | null
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Check if token exists before making API calls
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('No token found, skipping API calls');
          setStats(prev => ({ ...prev, loading: false, error: 'No authentication token' }));
          onError?.(true);
          return;
        }

        setStats(prev => ({ ...prev, loading: true, error: null }));
        
        // Use the enhanced data service with French dates
        const summary = await dataService.getDashboardSummary();

        setStats({
          totalProperties: summary.properties.total,
          activeTenants: summary.tenants.active,
          monthlyRevenue: summary.stats.totalAmount || 0,
          pendingBills: summary.stats.pendingBills || 0,
          loading: false,
          error: null,
          lastUpdated: summary.last_updated
        });
        onError?.(false);
      } catch (error) {
        console.error('Error fetching statistics:', error);
        
        // Provide more specific error messages
        let errorMessage = 'Failed to load statistics';
        const errorMsg = (error as any)?.message || '';
        if (errorMsg.includes('Network error')) {
          errorMessage = 'Network connection error. Please check your internet connection.';
        } else if (errorMsg.includes('timeout')) {
          errorMessage = 'Request timeout. Please try again.';
        } else if (errorMsg.includes('401')) {
          errorMessage = 'Authentication error. Please login again.';
        } else if (errorMsg.includes('500')) {
          errorMessage = 'Server error. Please try again later.';
        }
        
        // Set fallback data so the dashboard doesn't break completely
        setStats({
          totalProperties: 0,
          activeTenants: 0,
          monthlyRevenue: 0,
          pendingBills: 0,
          loading: false,
          error: errorMessage,
          lastUpdated: null
        });
        onError?.(true);
      }
    };

    fetchStats();
    
    // Start auto-refresh for statistics
    dataService.startAutoRefresh(2 * 60 * 1000); // Refresh every 2 minutes
    
    // Cleanup on unmount
    return () => {
      dataService.stopAutoRefresh();
    };
  }, [onError]);

  if (stats.loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
                <div className="h-3 bg-gray-200 rounded w-20 mt-2"></div>
              </div>
              <div className="p-3 bg-gray-200 rounded-full w-12 h-12"></div>
            </div>
          </div>
        ))}
        <div className="col-span-full text-center py-4">
          <div className="inline-flex items-center text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Chargement des statistiques du tableau de bord...
          </div>
        </div>
      </div>
    );
  }

  if (stats.error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-red-600 font-medium">{stats.error}</p>
            <p className="text-red-500 text-sm mt-1">Veuillez rafraîchir la page ou vérifier votre connexion.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Export Button */}
      <div className="flex justify-end">
        <button
          onClick={exportDashboardData}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          title={t('dashboard.exportAllData')}
        >
          <Database className="w-4 h-4 mr-2" />
          <span className="text-sm font-medium">{t('dashboard.exportData')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('dashboard.totalProperties')}</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProperties}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">{t('dashboard.fromDatabase')}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('dashboard.activeTenants')}</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeTenants}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">{t('dashboard.currentlyActive')}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('dashboard.monthlyRevenue')}</p>
              <p className="text-2xl font-bold text-gray-900">€{stats.monthlyRevenue.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">{t('dashboard.thisMonth')}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-red-500 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('dashboard.pendingBills')}</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingBills}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <CreditCard className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">{t('dashboard.awaitingPayment')}</p>
        </div>
      </div>
      
      {/* Last Updated Info */}
      {stats.lastUpdated && (
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Dernière mise à jour : {stats.lastUpdated}
          </p>
        </div>
      )}
    </div>
  );
});

RealStatistics.displayName = 'RealStatistics';

// Real Property Performance Component - Memoized for performance
const RealPropertyPerformance = memo(() => {
  const [properties, setProperties] = useState<DashboardProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        // Check if token exists before making API calls
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('No token found, skipping property API calls');
          setLoading(false);
          setError('No authentication token');
          return;
        }

        setLoading(true);
        const response = await api.listProperties();

        // Support multiple backend response shapes
        const raw = response?.data || {};
        const dataLayer = raw.data ?? raw;
        const list: DashboardProperty[] = (
          dataLayer?.properties || // { success, data: { properties: [...] } }
          dataLayer?.items ||      // alternate naming
          dataLayer ||             // { data: [...] } or flat array
          []
        ) as DashboardProperty[];

        const safeArray = Array.isArray(list) ? list : [];

        // Sort by rent amount (highest first) and take top 3
        const sortedProperties = safeArray
          .sort((a: DashboardProperty, b: DashboardProperty) => (b.rent || b.monthly_rent || 0) - (a.rent || a.monthly_rent || 0))
          .slice(0, 3);

        setProperties(sortedProperties);
        setError(null);
      } catch (error: any) {
        console.error('Error fetching properties:', error);
        setError(error?.userMessage || error?.response?.data?.error || 'Failed to load property data');
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg animate-pulse">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-200 rounded-full mr-3"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 text-center py-4">{error}</div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mb-4">
          <Building2 className="w-12 h-12 text-blue-600" />
        </div>
        <p className="text-gray-600 font-medium mb-2">Aucune propriété trouvée</p>
        <p className="text-sm text-gray-500">Commencez par ajouter votre première propriété</p>
      </div>
    );
  }

  const colors = ['bg-green-500', 'bg-blue-500', 'bg-yellow-500'];

  return (
    <div className="space-y-4">
      {properties.map((property, index) => (
        <div key={property.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <div className={`w-3 h-3 ${colors[index]} rounded-full mr-3`}></div>
            <span className="font-medium">{property.title || property.name || `Property ${property.id}`}</span>
          </div>
          <span className="text-green-600 font-semibold">€{property.rent || property.monthly_rent || 0}/mo</span>
        </div>
      ))}
    </div>
  );
});

RealPropertyPerformance.displayName = 'RealPropertyPerformance';

// Real Recent Activity Component
const RealRecentActivity = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        setLoading(true);
        
        // Fetch recent data from multiple sources
        const [tenantsRes, billsRes] = await Promise.all([
          api.listTenants(),
          api.listBills({ limit: 5, sort: 'created_at', order: 'DESC' })
        ]);

        // Normalize tenants response
        const tenantsRaw = tenantsRes?.data || {};
        const tenantsLayer = tenantsRaw.data ?? tenantsRaw;
        const tenants = (tenantsLayer?.tenants || tenantsLayer?.items || tenantsLayer || []) as any[];
        const safeTenants = Array.isArray(tenants) ? tenants : [];

        // Normalize bills response
        const billsRaw = billsRes?.data || {};
        const billsLayer = billsRaw.data ?? billsRaw;
        const bills = (billsLayer?.bills || billsLayer?.items || billsLayer || []) as any[];
        const safeBills = Array.isArray(bills) ? bills : [];
        
        // Create activity items from recent data
        const activities: Activity[] = [];
        
        // Add recent tenants
        safeTenants.slice(0, 2).forEach((tenant: any) => {
          activities.push({
            id: `tenant-${tenant.id ?? Math.random().toString(36).slice(2)}`,
            type: 'tenant',
            message: 'New tenant registered',
            detail: `${tenant.fullName || tenant.full_name || 'Tenant'} moved into ${tenant.propertyName || tenant.property_name || 'property'}`,
            time: tenant.created_at || tenant.createdAt || new Date().toISOString(),
            color: 'blue'
          });
        });
        
        // Add recent bills
        safeBills.slice(0, 2).forEach((bill: any) => {
          const amount = bill.total_amount ?? bill.amount ?? 0;
          activities.push({
            id: `bill-${bill.id ?? Math.random().toString(36).slice(2)}`,
            type: 'payment',
            message: bill.status === 'PAID' ? 'Payment received' : 'Bill generated',
            detail: bill.status === 'PAID' 
              ? `€${amount} from ${bill.tenantName || bill.tenant_name || 'tenant'}`
              : `€${amount} bill for ${bill.tenantName || bill.tenant_name || 'tenant'}`,
            time: bill.created_at || bill.createdAt || new Date().toISOString(),
            color: bill.status === 'PAID' ? 'green' : 'yellow'
          });
        });
        
        // Sort by time and take most recent
        activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
        setActivities(activities.slice(0, 3));
        setError(null);
        
      } catch (error: any) {
        console.error('Error fetching recent activity:', error);
        setError(error?.userMessage || error?.response?.data?.error || 'Failed to load recent activity');
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentActivity();
  }, []);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center p-3 bg-gray-50 rounded-lg animate-pulse">
            <div className="w-2 h-2 bg-gray-200 rounded-full mr-3"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-48"></div>
            </div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 text-center py-4">{error}</div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-gray-500 text-center py-4">Aucune activité récente</div>
    );
  }

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-50';
      case 'green': return 'bg-green-50';
      case 'yellow': return 'bg-yellow-50';
      default: return 'bg-gray-50';
    }
  };

  const getDotColor = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-500';
      case 'green': return 'bg-green-500';
      case 'yellow': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div key={activity.id} className={`flex items-center p-3 ${getColorClasses(activity.color)} rounded-lg`}>
          <div className={`w-2 h-2 ${getDotColor(activity.color)} rounded-full mr-3`}></div>
          <div className="flex-1">
            <p className="text-sm font-medium">{activity.message}</p>
            <p className="text-xs text-gray-600">{activity.detail}</p>
          </div>
          <span className="text-xs text-gray-500">{formatTimeAgo(activity.time)}</span>
        </div>
      ))}
    </div>
  );
};

const OverviewPies = () => {
  const [loading, setLoading] = useState(true);
  const [byProperty, setByProperty] = useState<any[]>([]);
  const [byMonth, setByMonth] = useState<any[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        
        console.log('📊 Fetching revenue data (paid bills)...');
        // Fetch only PAID bills (revenues) - isolated by admin_id in backend
        const response = await api.listBills({ 
          status: 'PAID',
          limit: 1000, // Get all paid bills for accurate revenue calculation
          sortBy: 'created_at',
          sortOrder: 'DESC'
        });
        
        const billsData = response?.data?.data || {};
        const bills = billsData?.bills || billsData?.items || billsData || [];
        console.log('💰 Revenue (paid bills) response:', bills);

        if (!bills || bills.length === 0) {
          console.log('ℹ️ No paid bills found (no revenue yet)');
          setByProperty([]);
          setByMonth([]);
          setTotalRevenue(0);
          setLoading(false);
          return;
        }

        const propertyMap: Record<string, { name: string; value: number }> = {};
        const monthMap: Record<string, number> = {};
        let total = 0;

        for (const bill of bills) {
          // Only count PAID or RECEIPT_SENT bills as revenue
          if (bill.status !== 'PAID' && bill.status !== 'RECEIPT_SENT') {
            continue;
          }

          const amount = parseFloat(bill.total_amount || bill.amount || 0);
          total += amount;

          // Group by property
          const propertyId = bill.property_id || 'unknown';
          const propertyName = bill.property?.title || 
                              bill.property?.name || 
                              `Propriété #${propertyId}`;
          
          if (!propertyMap[propertyId]) {
            propertyMap[propertyId] = { name: propertyName, value: 0 };
          }
          propertyMap[propertyId].value += amount;

          // Group by month
          const month = bill.month || (() => {
            const d = new Date(bill.paid_at || bill.updated_at || bill.created_at || new Date());
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            return `${d.getFullYear()}-${mm}`;
          })();
          monthMap[month] = (monthMap[month] || 0) + amount;
        }

        // Convert property map to array and sort by value
        const propertyArray = Object.values(propertyMap)
          .map(p => ({ name: p.name, value: Number(p.value.toFixed(2)) }))
          .sort((a, b) => b.value - a.value);
        
        // Get last 6 months and sort
        const last6Months = Object.keys(monthMap)
          .sort()
          .slice(-6)
          .map(month => ({ 
            name: month, 
            value: Number(monthMap[month].toFixed(2)) 
          }));

        setByProperty(propertyArray);
        setByMonth(last6Months);
        setTotalRevenue(Number(total.toFixed(2)));
        
        console.log('✅ Revenue data processed successfully:', {
          totalRevenue: total,
          properties: propertyArray.length,
          months: last6Months.length
        });
      } catch (e: any) {
        console.error('❌ Error loading revenue data:', e);
        setByProperty([]);
        setByMonth([]);
        setTotalRevenue(0);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  return (
    <div className="space-y-4">
      {/* Total Revenue Summary */}
      {totalRevenue > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenus Totaux</p>
              <p className="text-2xl font-bold text-green-700">€{totalRevenue.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Basé sur les factures payées uniquement</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-base font-semibold mb-3">Revenus par Propriété</h3>
          {loading ? (
            <div className="text-gray-500 py-10 text-center">Chargement des revenus…</div>
          ) : byProperty.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie 
                  data={byProperty} 
                  dataKey="value" 
                  nameKey="name" 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={80} 
                  label={({ name, percent }: any) => {
                    const shortName = name.length > 15 ? name.substring(0, 15) + '...' : name;
                    return `${shortName} ${((percent as number) * 100).toFixed(0)}%`;
                  }}
                >
                  {byProperty.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any, name: any) => [`€${Number(value).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, name]} 
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-gray-500 py-10 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-3">
                <BarChart3 className="w-8 h-8 text-gray-400" />
              </div>
              <p className="font-medium">Aucun revenu disponible</p>
              <p className="text-xs mt-2">Les revenus apparaîtront ici une fois les factures payées</p>
            </div>
          )}
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-base font-semibold mb-3">Revenus Mensuels (6 derniers mois)</h3>
          {loading ? (
            <div className="text-gray-500 py-10 text-center">Chargement des revenus mensuels…</div>
          ) : byMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie 
                  data={byMonth} 
                  dataKey="value" 
                  nameKey="name" 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={80} 
                  label={({ name, percent }: any) => `${name} ${((percent as number) * 100).toFixed(0)}%`}
                >
                  {byMonth.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any, name: any) => [`€${Number(value).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, name]} 
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-gray-500 py-10 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-3">
                <TrendingUp className="w-8 h-8 text-gray-400" />
              </div>
              <p className="font-medium">Aucun revenu mensuel</p>
              <p className="text-xs mt-2">Les revenus mensuels apparaîtront ici au fil du temps</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface Property {
  id: number;
  title: string;
  location: string;
  price: number;
  image: string;
  tag: string;
  tagColor: string;
  description: string;
  bedrooms: number;
  bathrooms: number;
  guests: number;
  rating: number;
  reviews: number;
  amenities: string[];
  images: string[];
  host: {
    name: string;
    avatar: string;
    joinDate: string;
  };
  propertyDetails: {
    propertyType: string;
    size: string;
    checkIn: string;
    checkOut: string;
  };
}

const Dashboard = () => {
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState('overview');
  // const navigate = useNavigate();
  const user = (() => { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } })();
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const [hasApiErrors, setHasApiErrors] = useState(false);

  // Gestionnaire pour la navigation depuis les notifications
  const handleNavigateToSection = useCallback((event: CustomEvent) => {
    const { section, billId, tenantId, propertyId } = event.detail;
    setActiveSection(section);
    
    // Si on a des IDs spécifiques, on peut les stocker pour utilisation ultérieure
    if (billId) {
      localStorage.setItem('selectedBillId', billId.toString());
    }
    if (tenantId) {
      localStorage.setItem('selectedTenantId', tenantId.toString());
    }
    if (propertyId) {
      localStorage.setItem('selectedPropertyId', propertyId.toString());
    }
  }, []);

  const handleOpenReceipt = useCallback((event: CustomEvent) => {
    const { billId } = event.detail;
    // Ouvrir le modal de reçu pour la facture spécifique
    localStorage.setItem('openReceiptForBill', billId.toString());
    setActiveSection('payments');
  }, []);

  useEffect(() => {
    window.addEventListener('navigate-to-section', handleNavigateToSection as EventListener);
    window.addEventListener('open-receipt', handleOpenReceipt as EventListener);

    return () => {
      window.removeEventListener('navigate-to-section', handleNavigateToSection as EventListener);
      window.removeEventListener('open-receipt', handleOpenReceipt as EventListener);
    };
  }, [handleNavigateToSection, handleOpenReceipt]);

  const closePropertyDetails = () => {
    setSelectedProperty(null);
    setIsPropertyModalOpen(false);
  };

  const renderPropertiesContent = () => (
    <Suspense fallback={<LoadingSpinner />}>
      <PropertiesSection />
    </Suspense>
  );

  const renderTunnetContent = () => {
    console.log('renderTunnetContent called, rendering TunnetSectionFixed');
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <TunnetSectionFixed />
      </Suspense>
    );
  };

  const renderOverviewContent = () => (
    <div className="space-y-6">
      {/* Real Statistics Cards */}
      <RealStatistics onError={setHasApiErrors} />
      
      {/* API Diagnostics - Show when there are errors */}
      {hasApiErrors && (
        <ApiDiagnostics />
      )}


      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 lg:p-8 min-h-[300px] md:min-h-[420px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg md:text-xl font-semibold flex items-center">
              <BarChart3 className="w-4 h-4 md:w-5 md:h-5 mr-2 text-blue-600 flex-shrink-0" />
              {t('dashboard.revenueOverview')}
            </h3>
          </div>
          <OverviewPies />
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <h3 className="text-base md:text-lg font-semibold mb-4 flex items-center">
            <TrendingUp className="w-4 h-4 md:w-5 md:h-5 mr-2 text-green-600 flex-shrink-0" />
            {t('dashboard.propertyPerformance')}
          </h3>
          <RealPropertyPerformance />
        </div>
      </div>

      {/* Real Recent Activity */}
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        <h3 className="text-base md:text-lg font-semibold mb-4 flex items-center">
          <Bell className="w-4 h-4 md:w-5 md:h-5 mr-2 text-purple-600 flex-shrink-0" />
          {t('dashboard.recentActivity')}
        </h3>
        <RealRecentActivity />
      </div>

      {/* Professional Quick Actions */}
        <div className="bg-white rounded-lg md:rounded-xl shadow-xl border border-gray-100 p-4 md:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center">
            <Star className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3 text-orange-500 flex-shrink-0" />
            {t('dashboard.quickActions')}
          </h3>
          <div className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
            Gestion Immobilière
          </div>
        </div>
        
        {/* Main Action Cards - responsive 1 / 2 / 4 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8 items-stretch">
          <ProfessionalCard
            icon={Building2}
            title="Ajouter Propriété"
            description="Créer une nouvelle propriété dans le système"
            onClick={() => setActiveSection('properties')}
            color="blue"
            delay={100}
            className="card-stagger-1"
          />
          <ProfessionalCard
            icon={Users}
            title="Ajouter Locataire"
            description="Enregistrer un nouveau locataire"
            onClick={() => setActiveSection('tunnet')}
            color="green"
            delay={200}
            className="card-stagger-2"
          />
          <ProfessionalCard
            icon={CreditCard}
            title="Générer Facture"
            description="Créer et envoyer des factures de loyer"
            onClick={() => setActiveSection('payments')}
            color="purple"
            delay={300}
            className="card-stagger-3"
          />
          <ProfessionalCard
            icon={BarChart3}
            title="Voir Rapports"
            description="Analyser les données et performances"
            onClick={() => setActiveSection('expense-analytics')}
            color="orange"
            delay={400}
            className="card-stagger-4"
          />
        </div>
        
        {/* Secondary Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <ProfessionalCard
            icon={SettingsIcon}
            title="Paramètres"
            description="Configurer les préférences du système"
            onClick={() => setActiveSection('settings')}
            color="indigo"
            delay={500}
            className="card-stagger-1"
          />
          <ProfessionalCard
            icon={Download}
            title="Exporter Données"
            description="Télécharger les données en CSV"
            onClick={exportDashboardData}
            color="teal"
            delay={600}
            className="card-stagger-2"
          />
          <ProfessionalCard
            icon={HelpCircle}
            title="Aide & Support"
            description="Obtenir de l'aide et des informations"
            onClick={() => {
              alert('Aide Tableau de Bord:\n\n• Utilisez les Actions Rapides pour naviguer entre les sections\n• Les Statistiques affichent les données en temps réel de votre base de données\n• L\'Activité Récente affiche les dernières mises à jour des locataires et factures\n• Les Graphiques montrent les répartitions et tendances des dépenses');
            }}
            color="pink"
            delay={700}
            className="card-stagger-3"
          />
        </div>
      </div>
    </div>
  );

  const renderPaymentsContent = () => (
    <Suspense fallback={<LoadingSpinner />}>
      <PaymentsManagement />
    </Suspense>
  );

  



  const renderExpenseAnalyticsContent = () => (
    <Suspense fallback={<LoadingSpinner />}>
      <ExpenseAnalytics />
    </Suspense>
  );

  const renderExpenseAnalysisContent = () => (
    <Suspense fallback={<LoadingSpinner />}>
      <ExpenseAnalysis />
    </Suspense>
  );

  // Settings component as a separate component to properly use hooks
  const SettingsContent = () => {
    const { language, setLanguage, t } = useLanguage();
    const currentUser = (() => { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } })();
    const [name, setName] = useState(currentUser?.name || '');
    const [email, setEmail] = useState(currentUser?.email || '');
    const [signatureUrl, setSignatureUrl] = useState<string | null>(() => {
      const raw = currentUser?.signature_photo;
      if (!raw) return null;
      // If already an absolute URL, return as is
      if (typeof raw === 'string' && /^https?:\/\//i.test(raw)) {
        return raw;
      }
      // Normalize relative path to work with backend origin
      const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4002/api';
      const origin = base.replace(/\/api\/?$/, '');
      let pathPart = raw.replace(/\\/g, '/');
      pathPart = pathPart.replace(/^public[\\/]/, '');
      if (!pathPart.startsWith('uploads/')) {
        if (pathPart.includes('uploads/')) {
          pathPart = pathPart.split('uploads/')[1];
          pathPart = `uploads/${pathPart}`;
        } else {
          pathPart = `uploads/${pathPart}`;
        }
      }
      return `${origin}/${pathPart}`;
    });
    const [uploadingSignature, setUploadingSignature] = useState(false);
    const [signatureMsg, setSignatureMsg] = useState('');
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');

    // Password change state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);
    const [passwordMsg, setPasswordMsg] = useState('');
    const [showPasswordFields, setShowPasswordFields] = useState(false);

    const handleSave = async () => {
      try {
        setSaving(true);
        setMsg('');
        const payload: any = {};
        if (name && name !== currentUser?.name) payload.name = name;
        if (email && email !== currentUser?.email) payload.email = email;
        const api = await import('../api');
        await (api.default as any).updateProfile(payload);
        const fresh = await (api.default as any).me();
        const admin = fresh?.data?.data?.admin;
        if (admin) {
          localStorage.setItem('user', JSON.stringify(admin));
        }
        setMsg(t('settings.saved'));
        setTimeout(() => setMsg(''), 3000);
      } catch (e: any) {
        setMsg(e?.response?.data?.error || e?.userMessage || e?.message || t('settings.save') + ' failed');
      } finally {
        setSaving(false);
      }
    };

    const handleSignatureUpload = async (event: any) => {
      try {
        const file = event.target.files?.[0];
        if (!file) return;
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          setSignatureMsg('❌ Please select an image file (PNG, JPG, etc.)');
          return;
        }
        
        setUploadingSignature(true);
        setSignatureMsg('');

        const apiModule = await import('../api');
        const response = await (apiModule as any).uploadSignature(file);
        
        if (!response?.data?.success) {
          const errorMsg = response?.data?.error || 'Failed to upload signature';
          setSignatureMsg(`❌ ${errorMsg}`);
          console.error('Signature upload failed:', response?.data);
          return;
        }
        
        const admin = response?.data?.data?.admin;

        if (admin) {
          localStorage.setItem('user', JSON.stringify(admin));
          const raw = admin.signature_photo;
          if (raw) {
            // Rebuild URL as above
            if (/^https?:\/\//i.test(raw)) {
              setSignatureUrl(raw);
            } else {
              const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4002/api';
              const origin = base.replace(/\/api\/?$/, '');
              let pathPart = raw.replace(/\\/g, '/');
              pathPart = pathPart.replace(/^public[\\/]/, '');
              if (!pathPart.startsWith('uploads/')) {
                if (pathPart.includes('uploads/')) {
                  pathPart = pathPart.split('uploads/')[1];
                  pathPart = `uploads/${pathPart}`;
                } else {
                  pathPart = `uploads/${pathPart}`;
                }
              }
              setSignatureUrl(`${origin}/${pathPart}`);
            }
            setSignatureMsg(t('settings.saved'));
            setTimeout(() => setSignatureMsg(''), 3000);
          } else {
            setSignatureMsg('⚠️ Signature uploaded but path not returned');
          }
        } else {
          setSignatureMsg('❌ Invalid response from server');
        }
      } catch (e: any) {
        console.error('Signature upload error:', e);
        const errorMsg = e?.response?.data?.error || e?.message || 'Failed to upload signature';
        setSignatureMsg(`❌ ${errorMsg}`);
        setTimeout(() => setSignatureMsg(''), 5000);
      } finally {
        setUploadingSignature(false);
        // Reset input value so same file can be re-selected if needed
        if (event.target) {
          event.target.value = '';
        }
      }
    };

    const handleChangePassword = async () => {
      try {
        setChangingPassword(true);
        setPasswordMsg('');

        // Validation
        if (!currentPassword) {
          setPasswordMsg(t('settings.password.current.required'));
          return;
        }

        if (!newPassword) {
          setPasswordMsg(t('settings.password.new.required'));
          return;
        }

        if (newPassword.length < 6) {
          setPasswordMsg(t('settings.password.new.min'));
          return;
        }

        if (newPassword !== confirmPassword) {
          setPasswordMsg(t('settings.password.mismatch'));
          return;
        }

        // Call the changePassword API function
        console.log('🔄 Appel de l\'API changePassword...');
        const apiModule = await import('../api');
        const response = await (apiModule.default as any).changePassword({
          currentPassword,
          newPassword
        });

        console.log('📥 Réponse de l\'API changePassword:', response?.data);

        // Check if the response indicates success
        if (response?.data?.success || response?.data?.message) {
          console.log('✅ Changement de mot de passe réussi');
          setPasswordMsg(t('settings.password.success'));
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setShowPasswordFields(false);

          setTimeout(() => {
            setPasswordMsg('');
          }, 7000);
        } else {
          console.error('❌ Réponse invalide du serveur:', response);
          throw new Error('Réponse invalide du serveur');
        }
      } catch (e: any) {
        console.error('Error changing password:', e);
        const errorMsg = e?.response?.data?.error || e?.response?.data?.message || e?.userMessage || e?.message || t('settings.password.failed');
        setPasswordMsg(`❌ ${errorMsg}`);
        setTimeout(() => {
          setPasswordMsg('');
        }, 5000);
      } finally {
        setChangingPassword(false);
      }
    };

    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t('settings.title')}</h1>
        </div>

        {/* Language Selection Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">{t('settings.language.title')}</h3>
          </div>
          <p className="text-gray-600 mb-4">{t('settings.language.description')}</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('settings.language.label')}
              </label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="radio"
                    name="language"
                    value="fr"
                    checked={language === 'fr'}
                    onChange={(e) => setLanguage(e.target.value as 'fr' | 'en')}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="ml-2 text-gray-700 group-hover:text-gray-900">
                    {t('settings.language.french')}
                  </span>
                </label>
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="radio"
                    name="language"
                    value="en"
                    checked={language === 'en'}
                    onChange={(e) => setLanguage(e.target.value as 'fr' | 'en')}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="ml-2 text-gray-700 group-hover:text-gray-900">
                    {t('settings.language.english')}
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('settings.account.title')}</h3>
          <p className="text-gray-600 mb-4">{t('settings.account.description')}</p>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.profile.name')}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('settings.profile.name.placeholder')}
                title={t('settings.profile.name')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.profile.email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('settings.profile.email.placeholder')}
                title={t('settings.profile.email')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {/* Signature upload section */}
            <div className="border-t border-gray-200 pt-4 mt-2">
              <h4 className="text-md font-semibold text-gray-900 mb-2">{t('settings.signature.title')}</h4>
              <p className="text-sm text-gray-600 mb-3">{t('settings.signature.description')}</p>
              {signatureUrl ? (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1">{t('settings.signature.current')}</p>
                  <div className="inline-block border rounded-lg p-2 bg-gray-50">
                    <img
                      src={signatureUrl}
                      alt="Signature"
                      className="max-h-20 object-contain"
                    />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500 mb-3">{t('settings.signature.none')}</p>
              )}
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-800 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors text-sm">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleSignatureUpload}
                    disabled={uploadingSignature}
                  />
                  {signatureUrl ? t('settings.signature.change') : t('settings.signature.upload')}
                </label>
                {signatureMsg && (
                  <span className={`text-xs ${signatureMsg === t('settings.saved') ? 'text-green-600' : 'text-red-600'}`}>
                    {signatureMsg}
                  </span>
                )}
              </div>
            </div>
            <button onClick={handleSave} disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors">
              {saving ? t('settings.saving') : t('settings.save')}
            </button>
            {msg && <div className={`text-sm ${msg === 'Saved' || msg === t('settings.saved') ? 'text-green-600' : 'text-red-600'}`}>{msg}</div>}
          </div>
        </div>

        {/* Change Password Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('settings.password.title')}</h3>
          <p className="text-gray-600 mb-4">{t('settings.password.description')}</p>
          
          {!showPasswordFields ? (
              <button
              onClick={() => setShowPasswordFields(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
              {t('settings.password.change')}
              </button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.password.current')}</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={t('settings.password.current.placeholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={changingPassword}
                />
            </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.password.new')}</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t('settings.password.new.placeholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={changingPassword}
                />
          </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.password.confirm')}</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('settings.password.confirm.placeholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={changingPassword}
                />
              </div>
              {passwordMsg && (
                <div className={`text-sm p-3 rounded-lg ${
                  passwordMsg.includes('succès') || passwordMsg.includes('success') 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {passwordMsg}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={handleChangePassword}
                  disabled={changingPassword}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {changingPassword ? t('settings.password.changing') : t('settings.password.change')}
                </button>
                <button
                  onClick={() => {
                    setShowPasswordFields(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setPasswordMsg('');
                  }}
                  disabled={changingPassword}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {t('settings.cancel')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Logout Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('settings.logout.title')}</h3>
          <p className="text-gray-600 mb-4">{t('settings.logout.description')}</p>
          <button
            onClick={() => { 
              localStorage.removeItem('token'); 
              localStorage.removeItem('user'); 
              window.location.href = '/'; 
            }}
            className="w-full md:w-auto bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            {t('settings.logout.button')}
          </button>
        </div>
      </div>
    );
  };

  const renderSettingsContent = () => {
    return <SettingsContent />;
  };

  const renderAdminManagementContent = () => {
    // Removed console.log to prevent excessive re-renders
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <AdminManagement />
      </Suspense>
    );
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        // Removed console.log to prevent excessive re-renders
        return renderOverviewContent();
      case 'properties':
        // Removed console.log to prevent excessive re-renders
        return renderPropertiesContent();
      case 'tunnet':
        // Removed console.log to prevent excessive re-renders
        return renderTunnetContent();
      case 'payments':
        // Removed console.log to prevent excessive re-renders
        return renderPaymentsContent();
      case 'expense-analytics':
        // Removed console.log to prevent excessive re-renders
        return renderExpenseAnalyticsContent();
      case 'expense-analysis':
        // Removed console.log to prevent excessive re-renders
        return renderExpenseAnalysisContent();
      case 'settings':
        // Removed console.log to prevent excessive re-renders
        return renderSettingsContent();
      case 'admin-management':
        // Removed console.log to prevent excessive re-renders
        return renderAdminManagementContent();
      default:
        // Removed console.log to prevent excessive re-renders
        return renderOverviewContent();
    }
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-gray-200"
        aria-label="Toggle menu"
      >
        <LayoutDashboard className="w-6 h-6 text-gray-700" />
      </button>

      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:static inset-y-0 left-0 z-40 w-80 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out md:transition-none`}>
        <div className="p-4 md:p-6 border-b border-gray-200 flex items-center justify-between">
          <h1 className="text-lg md:text-xl font-semibold text-gray-900">{t('nav.dashboard')}</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1 text-gray-500 hover:text-gray-700"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="mt-4 px-2 md:px-4 overflow-y-auto h-[calc(100vh-80px)]">
          <div className="space-y-1">
            {/* Vue d'ensemble */}
            <button 
              onClick={() => setActiveSection('overview')}
              className={`w-full flex items-center px-3 md:px-4 py-2.5 md:py-3 rounded text-sm md:text-base ${
                activeSection === 'overview' 
                  ? 'bg-gray-100 text-gray-900' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <LayoutDashboard className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" />
              <span className="ml-2 md:ml-3">{t('nav.overview')}</span>
            </button>
            
            {/* Propriétés */}
            <button 
              onClick={() => setActiveSection('properties')}
              className={`w-full flex items-center px-3 md:px-4 py-2.5 md:py-3 rounded text-sm md:text-base ${
                activeSection === 'properties' 
                  ? 'bg-gray-100 text-gray-900' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Building2 className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" />
              <span className="ml-2 md:ml-3">{t('nav.properties')}</span>
            </button>
            
            {/* Locataires */}
            <button 
              onClick={() => setActiveSection('tunnet')}
              className={`w-full flex items-center px-3 md:px-4 py-2.5 md:py-3 rounded text-sm md:text-base ${
                activeSection === 'tunnet' 
                  ? 'bg-gray-100 text-gray-900' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Users className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" />
              <span className="ml-2 md:ml-3">{t('nav.tenants')}</span>
            </button>
            
            {/* Paiements */}
            <button 
              onClick={() => setActiveSection('payments')}
              className={`w-full flex items-center px-3 md:px-4 py-2.5 md:py-3 rounded text-sm md:text-base ${
                activeSection === 'payments' 
                  ? 'bg-gray-100 text-gray-900' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <CreditCard className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" />
              <span className="ml-2 md:ml-3">{t('nav.payments')}</span>
            </button>
            
            {/* Analyse des Dépenses */}
            <button 
              onClick={() => setActiveSection('expense-analytics')}
              className={`w-full flex items-center px-3 md:px-4 py-2.5 md:py-3 rounded text-sm md:text-base ${
                activeSection === 'expense-analytics' 
                  ? 'bg-gray-100 text-gray-900' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <DollarSign className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" />
              <span className="ml-2 md:ml-3">{t('nav.expenses')}</span>
            </button>
            
            {/* Analyse */}
            <button 
              onClick={() => setActiveSection('expense-analysis')}
              className={`w-full flex items-center px-3 md:px-4 py-2.5 md:py-3 rounded text-sm md:text-base ${
                activeSection === 'expense-analysis' 
                  ? 'bg-gray-100 text-gray-900' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <BarChart3 className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" />
              <span className="ml-2 md:ml-3">{t('nav.expenseAnalysis')}</span>
            </button>
            
            {/* Paramètres */}
            <button 
              onClick={() => setActiveSection('settings')}
              className={`w-full flex items-center px-3 md:px-4 py-2.5 md:py-3 rounded text-sm md:text-base ${
                activeSection === 'settings' 
                  ? 'bg-gray-100 text-gray-900' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <SettingsIcon className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" />
              <span className="ml-2 md:ml-3">{t('nav.settings')}</span>
            </button>

            {/* Gestion Administrateurs */}
            {user?.role === 'SUPER_ADMIN' && (
              <button 
                onClick={() => setActiveSection('admin-management')}
                className={`w-full flex items-center px-3 md:px-4 py-2.5 md:py-3 rounded text-sm md:text-base ${
                  activeSection === 'admin-management' 
                    ? 'bg-gray-100 text-gray-900' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                title={t('nav.admin')}
              >
                <Shield className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" />
                <span className="ml-2 md:ml-3">{t('nav.admin')}</span>
              </button>
            )}
          </div>
        </nav>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 w-full min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-3 md:px-6 py-3 md:py-4 sticky top-0 z-20">
          <div className="flex items-center justify-end gap-2 md:gap-4">
            <div className="flex items-center space-x-2 md:space-x-4">
              {/* Notifications Center */}
              <NotificationsCenter />
              
              {/* User Profile */}
              <div
                className="flex items-center space-x-2 md:space-x-3 hover:bg-gray-50 p-1.5 md:p-2 rounded-lg transition-colors cursor-pointer"
                aria-label="Aller aux Paramètres"
                onClick={() => {
                  setActiveSection('settings');
                  setSidebarOpen(false);
                }}
              >
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs md:text-sm flex-shrink-0">
                  {(user?.name || user?.fullName || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="hidden md:block">
                  <div className="text-sm font-medium text-gray-900">{user?.name || user?.fullName || 'Utilisateur'}</div>
                  <div className="text-xs text-gray-500">{user?.role || 'Administrateur'}</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-3 md:p-4 lg:p-6 w-full max-w-full overflow-x-hidden">
        {renderContent()}
        </div>
      </div>

      {/* Property Details Modal */}
      {isPropertyModalOpen && selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] md:max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 md:p-6 flex items-center justify-between z-10">
              <div className="flex-1 min-w-0 pr-4">
                <h2 className="text-lg md:text-heading-large truncate">{selectedProperty.title}</h2>
                <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-2">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="ml-1 text-label-large">{selectedProperty.rating}</span>
                    <span className="ml-1 card-subtitle">({selectedProperty.reviews} reviews)</span>
                  </div>
                  <div className="flex items-center card-subtitle">
                    <MapPin className="w-4 h-4 mr-1" />
                    {selectedProperty.location}
                  </div>
                </div>
              </div>
                <button
                onClick={closePropertyDetails}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close property details"
              >
                <X className="w-6 h-6" />
                </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 md:p-6">
              {/* Image Gallery */}
              <div className="mb-6 md:mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="md:col-span-1">
                    <img
                      src={selectedProperty.images[0]}
                      alt={selectedProperty.title}
                      className="w-full h-48 md:h-80 object-cover rounded-lg"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 md:gap-4">
                    {selectedProperty.images.slice(1, 5).map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`${selectedProperty.title} ${index + 2}`}
                        className="w-full h-24 md:h-36 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {/* Left Column - Main Details */}
                <div className="lg:col-span-2 space-y-6 md:space-y-8">
                  {/* Property Overview */}
                  <div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
                      <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                        {selectedProperty.propertyDetails.propertyType} hosted by {selectedProperty.host.name}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedProperty.tagColor === 'orange' 
                          ? 'bg-orange-100 text-orange-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {selectedProperty.tag}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 md:gap-6 text-gray-600 mb-4 text-sm md:text-base">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        <span>{selectedProperty.guests} guests</span>
                      </div>
                      <div className="flex items-center">
                        <Bed className="w-4 h-4 mr-1" />
                        <span>{selectedProperty.bedrooms} bedrooms</span>
                      </div>
                      <div className="flex items-center">
                        <Bath className="w-4 h-4 mr-1" />
                        <span>{selectedProperty.bathrooms} bathrooms</span>
                      </div>
                    </div>

                    <p className="text-gray-700 leading-relaxed">{selectedProperty.description}</p>
                  </div>

                  {/* Amenities */}
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">What this place offers</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                      {selectedProperty.amenities.map((amenity, index) => {
                        const getAmenityIcon = (amenity: string) => {
                          switch (amenity.toLowerCase()) {
                            case 'wifi': return <Wifi className="w-5 h-5" />;
                            case 'tv': return <Tv className="w-5 h-5" />;
                            case 'parking': return <Car className="w-5 h-5" />;
                            case 'coffee maker': return <Coffee className="w-5 h-5" />;
                            default: return <div className="w-5 h-5 bg-gray-300 rounded"></div>;
                          }
                        };

                        return (
                          <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                            {getAmenityIcon(amenity)}
                            <span className="text-gray-700">{amenity}</span>
                          </div>
              );
            })}
                    </div>
                  </div>

                  {/* Property Details */}
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Property Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Property Type</h4>
                        <p className="text-gray-700">{selectedProperty.propertyDetails.propertyType}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Size</h4>
                        <p className="text-gray-700">{selectedProperty.propertyDetails.size}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Check-in</h4>
                        <p className="text-gray-700">{selectedProperty.propertyDetails.checkIn}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Check-out</h4>
                        <p className="text-gray-700">{selectedProperty.propertyDetails.checkOut}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Booking Card */}
                <div className="lg:col-span-1">
                  <div className="lg:sticky lg:top-6">
                    {/* Host Info */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 mb-4 md:mb-6">
                      <div className="flex items-center space-x-4 mb-4">
                        <img
                          src={selectedProperty.host.avatar}
                          alt={selectedProperty.host.name}
                          className="w-12 h-12 rounded-full"
                        />
                        <div>
                          <h4 className="font-semibold text-gray-900">Hosted by {selectedProperty.host.name}</h4>
                          <p className="text-sm text-gray-600">{selectedProperty.host.joinDate}</p>
                        </div>
                      </div>
                    </div>

                    {/* Booking Card */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
                        <div>
                          <span className="price-large">{selectedProperty.price}€</span>
                          <span className="text-body-small text-gray-500 ml-1">mois</span>
                        </div>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="ml-1 text-label-large">{selectedProperty.rating}</span>
                        </div>
          </div>

                      {/* Booking Form */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="form-label mb-1">Check-in Date</label>
                            <input
                              type="date"
                              placeholder="Select check-in date"
                              title="Check-in date"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 form-input"
                            />
                          </div>
                          <div>
                            <label className="form-label mb-1">Lease Duration</label>
                            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 form-input" title="Lease duration">
                              <option>3 months</option>
                              <option>6 months</option>
                              <option>12 months</option>
                              <option>Month by month</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="form-label mb-1">Room Type</label>
                          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 form-input" title="Room type">
                            <option>Private room</option>
                            <option>Shared room</option>
                            <option>Master room</option>
                          </select>
                        </div>
                        <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors btn-text">
                          Apply Now
                        </button>
                        <div className="flex items-center justify-center">
                          <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Add to favorites">
                            <Heart className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-600 text-center">Application review required</p>
                      </div>
                    </div>
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

export default Dashboard;