import React, { useEffect, useState } from 'react';
import { Search, Plus, X, Edit, Trash2, FileText } from 'lucide-react';
import api from '../api';
import TenantDocuments from './TenantDocuments';
import '../styles/navigation-animations.css';
import '../styles/payments-animations.css';

// Type assertion to help TypeScript understand the api object structure
const apiClient = api as any;

interface Tenant {
  id: number | string;
  admin_id?: number;
  property_id?: number | string;
  name?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  propertyName?: string;
  propertyId?: string;
  checkInDate?: string;
  checkOutDate?: string;
  stayDuration?: number;
  status?: 'active' | 'inactive' | 'expired' | 'upcoming' | 'completed' | string;
  avatar?: string;
  document_path?: string;
  rent_amount?: number;
  charges_amount?: number;
  property_monthly_rent?: number;
  tenants_count?: number;
  divided_rent?: number;
}

interface NewTenantForm {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  propertyId: string;
  checkInDate: string;
  checkOutDate: string;
  documents: File[];
  rent?: string;
  charges?: string;
  status?: string;
}

const TunnetSectionFixed: React.FC = () => {
  // Helper function to normalize status for display
  const normalizeStatus = (status: string | undefined): 'active' | 'inactive' | 'expired' => {
    if (!status) return 'active';
    const upperStatus = status.toUpperCase();
    if (upperStatus === 'ACTIVE') return 'active';
    if (upperStatus === 'INACTIVE') return 'inactive';
    if (upperStatus === 'EXPIRED') return 'expired';
    return 'active';
  };

  // Helper function to get status display value
  const getStatusDisplayValue = (status: string | undefined): string => {
    const normalized = normalizeStatus(status);
    if (normalized === 'active') return 'Actif';
    if (normalized === 'inactive') return 'Inactif';
    if (normalized === 'expired') return 'Expiré';
    return 'N/A';
  };

  // Helper function to get status badge class
  const getStatusBadgeClass = (status: string | undefined): string => {
    const normalized = normalizeStatus(status);
    if (normalized === 'active') return 'bg-green-100 text-green-800';
    if (normalized === 'inactive') return 'bg-yellow-100 text-yellow-800';
    if (normalized === 'expired') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  // Helper function to get select value (kept for potential future use)
  // const getSelectValue = (status: string | undefined): 'ACTIVE' | 'INACTIVE' | 'EXPIRED' => {
  //   const normalized = normalizeStatus(status);
  //   if (normalized === 'active') return 'ACTIVE';
  //   if (normalized === 'inactive') return 'INACTIVE';
  //   if (normalized === 'expired') return 'EXPIRED';
  //   return 'ACTIVE';
  // };
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTenant, setNewTenant] = useState<NewTenantForm>({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    propertyId: '',
    checkInDate: '',
    checkOutDate: '',
    documents: [],
    rent: '',
    charges: '',
    status: 'ACTIVE'
  });
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<{ id: number; title: string; monthly_rent?: number }[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(false);
  const [propertiesError, setPropertiesError] = useState<string | null>(null);
  const [isLoadingTenants, setIsLoadingTenants] = useState(false);
  const [tenantsError, setTenantsError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [editForm, setEditForm] = useState<NewTenantForm>({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    propertyId: '',
    checkInDate: '',
    checkOutDate: '',
    documents: [],
    rent: '',
    charges: '',
    status: 'ACTIVE'
  });
  const [documentsModalTenant, setDocumentsModalTenant] = useState<Tenant | null>(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ isOpen: boolean; tenantId: string | null; tenantName: string }>({
    isOpen: false,
    tenantId: null,
    tenantName: ''
  });
  const [isDeleting, setIsDeleting] = useState(false);
  // Track tenants whose status is being updated to prevent race conditions
  // Note: _setIsUpdatingStatus is prepared for future use when implementing optimistic status updates
  const [isUpdatingStatus, _setIsUpdatingStatus] = useState<Set<string | number>>(new Set());

  // Fetch properties from API
  const fetchProperties = async () => {
    setIsLoadingProperties(true);
    setPropertiesError(null);
    
    try {
      // Check if token exists before making API calls
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, skipping properties API call');
        setProperties([]);
        setIsLoadingProperties(false);
        return;
      }

      const response = await api.listProperties();
      console.log('📊 Properties API response:', response.data);
      
      if (response.data?.success && response.data?.data?.properties) {
        const propertiesData = response.data.data.properties.map((property: any) => ({
          id: property.id,
          title: property.title,
          monthly_rent: property.monthly_rent || 0
        }));
        setProperties(propertiesData);
      } else {
        setPropertiesError('Failed to load properties');
        setProperties([]);
        console.log('❌ Failed to load properties - invalid response structure');
      }
    } catch (error: any) {
      console.error('❌ Error fetching properties:', error);
      setPropertiesError(error.response?.data?.error || 'Failed to load properties');
      setProperties([]);
    } finally {
      setIsLoadingProperties(false);
    }
  };

  // Fetch tenants from API
  const fetchTenants = async (skipIfUpdating = true, reason = 'unknown') => {
    // Prevent refetch if we're currently updating a status (unless explicitly requested)
    if (skipIfUpdating && isUpdatingStatus.size > 0) {
      console.log(`⏸️ Skipping fetchTenants (reason: ${reason}) - status update in progress for:`, Array.from(isUpdatingStatus));
      return;
    }
    
    console.log(`🔄 fetchTenants called (reason: ${reason}), isUpdatingStatus.size: ${isUpdatingStatus.size}`);
    
    setIsLoadingTenants(true);
    setTenantsError(null);
    
    try {
      // Check if token exists before making API calls
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, skipping tenants API call');
        setTenants([]);
        setIsLoadingTenants(false);
        return;
      }

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      console.log('👤 Current user:', user);
      console.log('🆔 User admin_id:', user.id);
      console.log('👤 User role:', user.role);
      
      const response = await api.listTenants();
      console.log('📊 Tenant API response:', response.data);
      console.log('📊 Response success:', response.data?.success);
      console.log('📊 Response data structure:', response.data?.data);
      console.log('📊 Tenants array:', response.data?.data?.tenants);
      console.log('📊 Tenants count:', response.data?.data?.tenants?.length);
      
      const tData = response.data?.data?.tenants || [];
      console.log('📋 Raw tenant data:', tData);
      console.log('📋 Raw tenant data length:', tData.length);
      console.log('📋 Raw tenant statuses:', tData.map((t: any) => ({ id: t.id, name: t.name, status: t.status })));
      console.log('📋 Raw tenant phones:', tData.map((t: any) => ({ id: t.id, name: t.name, phone: t.phone, phone_number: t.phone_number })));
      
      // Count tenants per property (only active tenants)
      const tenantsByProperty: { [key: number]: number } = {};
      tData.forEach((t: any) => {
        const tenantStatus = t.status?.toUpperCase() || 'ACTIVE';
        if (t.property_id && tenantStatus === 'ACTIVE') {
          tenantsByProperty[t.property_id] = (tenantsByProperty[t.property_id] || 0) + 1;
        }
      });
      
      const mapped = tData.map((t: any) => {
        // Use property data from API response first, fallback to properties array
        const propertyFromApi = t.property;
        const propertyFromArray = properties.find((p: any) => p.id === t.property_id);
        
        // Get property name from multiple possible sources
        const propertyName = propertyFromApi?.title || 
                            (propertyFromApi as any)?.name || 
                            propertyFromArray?.title || 
                            (t.property_id ? `Propriété #${t.property_id}` : 'Aucune propriété');
        
        const propertyMonthlyRent = propertyFromApi?.monthly_rent || 
                                   (propertyFromApi as any)?.rent || 
                                   propertyFromArray?.monthly_rent || 
                                   0;
        const tenantsCount = tenantsByProperty[t.property_id] || 1;
        const dividedRent = tenantsCount > 0 ? propertyMonthlyRent / tenantsCount : propertyMonthlyRent;
        
        // Map status from DB (uppercase) to React state (lowercase)
        const dbStatus = t.status?.toUpperCase() || 'ACTIVE';
        const reactStatus = dbStatus === 'ACTIVE' ? 'active' : 
                           dbStatus === 'INACTIVE' ? 'inactive' : 
                           dbStatus === 'EXPIRED' ? 'expired' : 'active';
        
        return {
          id: String(t.id),
          fullName: t.name,
          email: t.email || '',
          phone: t.phone || t.phone_number || (t as any).phoneNumber || '',
          propertyName: propertyName,
          propertyId: t.property_id ? String(t.property_id) : '',
          checkInDate: t.lease_start || '',
          checkOutDate: t.lease_end || '',
          stayDuration: 0,
          status: reactStatus as any,
          avatar: '',
          documents: [],
          rent_amount: t.rent_amount || null,
          charges_amount: t.charges_amount || null,
          property_monthly_rent: propertyMonthlyRent,
          tenants_count: tenantsCount,
          divided_rent: dividedRent,
          document_path: t.documents
        };
      });
      
      console.log(`✅ Setting tenants state (reason: ${reason}), mapped statuses:`, mapped.map((t: any) => ({ id: t.id, name: t.fullName, status: t.status })));
      setTenants(mapped);
    } catch (e: any) {
      console.error('❌ Error loading tenants:', e);
      setTenantsError(e.response?.data?.error || e.message || 'Failed to load tenants');
      setTenants([]);
    } finally {
      setIsLoadingTenants(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      await fetchProperties();
      await fetchTenants(true, 'component-mount');
    };
    loadData();
  }, []);

  // Re-fetch tenants when properties change (but only if we don't have tenants yet)
  // AND only if we're not currently updating a status (to prevent race conditions)
  useEffect(() => {
    if (properties.length > 0 && tenants.length === 0 && isUpdatingStatus.size === 0) {
      fetchTenants(true, 'properties-changed');
    }
    
    // Cleanup function to prevent memory leaks
    return () => {
      setIsLoadingTenants(false);
      setTenantsError(null);
    };
  }, [properties, isUpdatingStatus.size]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📝 Tenant form submitted');
    
    // Client-side validation
    if (!newTenant.fullName.trim()) {
      console.log('❌ Validation failed: Name is required');
      alert('Please enter tenant name');
      return;
    }
    if (!newTenant.email.trim()) {
      console.log('❌ Validation failed: Email is required');
      alert('Please enter tenant email');
      return;
    }
    if (!newTenant.propertyId) {
      console.log('❌ Validation failed: Property is required');
      alert('Please select a property');
      return;
    }
    
    const propertyId = parseInt(newTenant.propertyId);
    if (isNaN(propertyId)) {
      console.log('❌ Validation failed: Invalid property ID');
      alert('Invalid property selected');
      return;
    }
    
    const tenantData: any = {
      name: newTenant.fullName.trim(),
      email: newTenant.email.trim(),
      property_id: propertyId
    };
    
    // Always include status (default to ACTIVE if not set)
    tenantData.status = (newTenant.status && newTenant.status.trim()) || 'ACTIVE';
    
    // Only add optional fields if they have values
    if (newTenant.phone?.trim()) {
      tenantData.phone = newTenant.phone.trim();
    }
    if (newTenant.address?.trim()) {
      tenantData.address = newTenant.address.trim();
    }
    if (newTenant.rent) {
      tenantData.rent_amount = parseFloat(newTenant.rent);
    }
    if (newTenant.charges) {
      tenantData.charges_amount = parseFloat(newTenant.charges);
    }
    
    // Add lease dates if provided
    if (newTenant.checkInDate) {
      tenantData.lease_start = newTenant.checkInDate;
    }
    if (newTenant.checkOutDate) {
      tenantData.lease_end = newTenant.checkOutDate;
    }
    
    // Ensure status is uppercase
    if (tenantData.status) {
      tenantData.status = tenantData.status.toUpperCase().trim();
    }
    
    console.log('📤 Sending tenant data:', JSON.stringify(tenantData, null, 2));
    
    try {
      const response = await apiClient.createTenant(tenantData);
      console.log('✅ Tenant created successfully:', response.data);
      
      setIsModalOpen(false);
      setNewTenant({ fullName: '', email: '', phone: '', address: '', propertyId: '', checkInDate: '', checkOutDate: '', documents: [], rent: '', charges: '', status: 'ACTIVE' });
      
      // Refresh tenant list
      console.log('🔄 Refreshing tenant list after creation...');
      await fetchTenants(true, 'after-tenant-creation');
    } catch (err: any) {
      console.error('❌ Create tenant error:', err);
      let errorMsg = err?.response?.data?.error || err?.message || 'Failed to add tenant. Please try again.';
      
      // Handle rate limiting error
      if (errorMsg.includes('Too many requests')) {
        errorMsg = 'Rate limit exceeded. Please wait a moment before trying again.';
      }
      
      const details = err?.response?.data?.details;
      if (details) {
        console.error('📋 Validation details:', details);
        alert(`${errorMsg}\n\nDetails: ${JSON.stringify(details, null, 2)}`);
      } else {
        alert(errorMsg);
      }
    }
  };

  // Handle edit tenant
  const handleEditTenant = (tenant: Tenant) => {
    console.log('✏️ Editing tenant:', tenant);
    setEditingTenant(tenant);
    setEditForm({
      fullName: tenant.fullName || '',
      email: tenant.email || '',
      phone: tenant.phone || '',
      address: (tenant as any).address || '',
      propertyId: tenant.propertyId || '',
      checkInDate: tenant.checkInDate || '',
      checkOutDate: tenant.checkOutDate || '',
      documents: [],
      rent: tenant.rent_amount ? String(tenant.rent_amount) : '',
      charges: tenant.charges_amount ? String(tenant.charges_amount) : '',
      status: (tenant.status?.toUpperCase() as 'ACTIVE' | 'INACTIVE' | 'EXPIRED') || 'ACTIVE'
    });
    setIsEditModalOpen(true);
  };

  // Handle delete tenant - open confirmation modal
  const handleDeleteClick = (tenant: Tenant) => {
    setDeleteConfirmModal({
      isOpen: true,
      tenantId: String(tenant.id),
      tenantName: tenant.fullName || tenant.name || 'this tenant'
    });
  };

  // Confirm and execute delete
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmModal.tenantId) return;

    setIsDeleting(true);
    try {
      await apiClient.deleteTenantApi(deleteConfirmModal.tenantId);
      console.log('✅ Tenant deleted successfully');
      
      // Close modal and refresh list
      setDeleteConfirmModal({ isOpen: false, tenantId: null, tenantName: '' });
      await fetchTenants(true, 'after-tenant-deletion');
    } catch (error: any) {
      console.error('❌ Error deleting tenant:', error);
      let errorMsg = error?.response?.data?.error || error?.message || 'Failed to delete tenant. Please try again.';
      
      // Handle rate limiting error
      if (errorMsg.includes('Too many requests')) {
        errorMsg = 'Rate limit exceeded. Please wait a moment before trying again.';
      }
      
      alert(errorMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Cancel delete
  const handleDeleteCancel = () => {
    setDeleteConfirmModal({ isOpen: false, tenantId: null, tenantName: '' });
  };

  // Handle edit form submission
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant) return;

    console.log('📝 Edit tenant form submitted');
    
    // Client-side validation
    if (!editForm.fullName.trim()) {
      alert('Please enter tenant name');
      return;
    }
    if (!editForm.email.trim()) {
      alert('Please enter tenant email');
      return;
    }
    if (!editForm.propertyId) {
      alert('Please select a property');
      return;
    }
    
    const propertyId = parseInt(editForm.propertyId);
    if (isNaN(propertyId)) {
      alert('Invalid property selected');
      return;
    }
    
    const tenantData: any = {
      name: editForm.fullName.trim(),
      email: editForm.email.trim(),
      property_id: propertyId
    };
    
    // Only add optional fields if they have values
    if (editForm.phone?.trim()) {
      tenantData.phone = editForm.phone.trim();
    }
    if (editForm.address?.trim()) {
      tenantData.address = editForm.address.trim();
    }
    if (editForm.rent) {
      tenantData.rent_amount = parseFloat(editForm.rent);
    }
    if (editForm.charges) {
      tenantData.charges_amount = parseFloat(editForm.charges);
    }
    if (editForm.status) {
      tenantData.status = editForm.status;
    }
    
    console.log('📤 Updating tenant data:', tenantData);
    
    try {
      const response = await apiClient.updateTenant(editingTenant.id, tenantData);
      console.log('✅ Tenant updated successfully:', response.data);
      
      setIsEditModalOpen(false);
      setEditingTenant(null);
      setEditForm({
        fullName: '',
        email: '',
        phone: '',
        address: '',
        propertyId: '',
        checkInDate: '',
        checkOutDate: '',
        documents: [],
        rent: '',
        charges: '',
        status: 'ACTIVE'
      });
      
      // Refresh tenant list
      console.log('🔄 Refreshing tenant list after update...');
      await fetchTenants(true, 'after-tenant-edit');
    } catch (err: any) {
      console.error('❌ Update tenant error:', err);
      let errorMsg = err?.response?.data?.error || err?.message || 'Failed to update tenant. Please try again.';
      
      // Handle rate limiting error
      if (errorMsg.includes('Too many requests')) {
        errorMsg = 'Rate limit exceeded. Please wait a moment before trying again.';
      }
      
      const details = err?.response?.data?.details;
      if (details) {
        console.error('📋 Validation details:', details);
        alert(`${errorMsg}\n\nDetails: ${JSON.stringify(details, null, 2)}`);
      } else {
        alert(errorMsg);
      }
    }
  };

  const filteredTenants = tenants.filter(tenant =>
    tenant.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.propertyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.propertyId?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 fade-in-soft">Tenant Management</h1>
      

      {/* Status Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-3 bg-blue-50 rounded smooth-transition hover-lift fade-in" style={{ animationDelay: '0.1s' }}>
          <h3 className="font-semibold">Properties Status:</h3>
          {isLoadingProperties ? (
            <p className="shimmer">Loading properties...</p>
          ) : propertiesError ? (
            <p className="text-red-600">Error: {propertiesError}</p>
          ) : (
            <p className="text-green-600">✓ Found {properties.length} properties</p>
          )}
        </div>
        
        <div className="p-3 bg-green-50 rounded smooth-transition hover-lift fade-in" style={{ animationDelay: '0.2s' }}>
          <h3 className="font-semibold">Tenants Status:</h3>
          {isLoadingTenants ? (
            <p className="shimmer">Loading tenants...</p>
          ) : tenantsError ? (
            <p className="text-red-600">Error: {tenantsError}</p>
          ) : (
            <p className="text-green-600">✓ Found {tenants.length} tenants</p>
          )}
        </div>
      </div>

      {/* Search and Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 md:gap-4 mb-4 md:mb-6">
        <div className="flex-1 w-full sm:max-w-md slide-in-left">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 smooth-transition" />
            <input
              type="text"
              placeholder="Rechercher des locataires..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 smooth-transition hover-lift text-sm md:text-base"
            />
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 smooth-transition hover-lift-strong glow-effect slide-in-right w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 smooth-transition" />
          <span className="text-sm md:text-base">Ajouter un locataire</span>
        </button>
      </div>

      {/* Tenants Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {filteredTenants.map((tenant, index) => (
          <div 
            key={`tenant-${tenant.id}-${normalizeStatus(tenant.status)}-${index}`} 
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden smooth-transition hover-lift fade-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">
                      {tenant.fullName?.charAt(0) || 'T'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{tenant.fullName}</h3>
                    <p className="text-sm text-gray-500">{tenant.email}</p>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setDocumentsModalTenant(tenant)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg nav-transition nav-hover-scale"
                    title="Gérer les documents"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEditTenant(tenant)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg nav-transition nav-hover-scale"
                    title="Modifier le locataire"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(tenant)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg nav-transition nav-hover-scale hover:text-red-700"
                    title="Supprimer le locataire"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-1.5 text-sm text-gray-600">
                <p><strong>Propriété:</strong> {tenant.propertyName || 'N/A'}</p>
                <p><strong>Téléphone:</strong> {tenant.phone && tenant.phone.trim() ? tenant.phone : 'N/A'}</p>
                <p><strong>Loyer:</strong> 
                  {tenant.rent_amount !== undefined && tenant.rent_amount !== null && Number(tenant.rent_amount) > 0 ? (
                    <span className="font-semibold text-blue-600">€{Number(tenant.rent_amount).toFixed(2)}</span>
                  ) : tenant.divided_rent !== undefined && tenant.divided_rent !== null && Number(tenant.divided_rent) > 0 ? (
                    <span>
                      <span className="font-semibold text-blue-600">€{Number(tenant.divided_rent).toFixed(2)}</span>
                      {tenant.tenants_count && tenant.tenants_count > 1 && (
                        <span className="text-xs text-gray-500 ml-1">
                          (partagé sur {tenant.tenants_count} locataires)
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-gray-400">N/A</span>
                  )}
                </p>
                <p><strong>Charges:</strong> 
                  {tenant.charges_amount !== undefined && tenant.charges_amount !== null && Number(tenant.charges_amount) > 0 ? (
                    <span className="font-semibold text-green-600">€{Number(tenant.charges_amount).toFixed(2)}</span>
                  ) : (
                    <span className="text-gray-400">N/A</span>
                  )}
                </p>
                <div className="flex items-center">
                  <p><strong>Statut:</strong> 
                    <span 
                      key={`status-badge-${tenant.id}-${normalizeStatus(tenant.status)}`}
                      className={`ml-1 px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(tenant.status)}`}
                    >
                      {getStatusDisplayValue(tenant.status)}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No Results */}
      {filteredTenants.length === 0 && !isLoadingTenants && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-2">
            <Search className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Aucun locataire trouvé</h3>
          <p className="text-gray-600">Essayez d'ajuster vos termes de recherche ou ajoutez un nouveau locataire.</p>
        </div>
      )}

      {/* Loading State */}
      {isLoadingTenants && (
        <div className="text-center py-12">
          <div className="text-blue-400 mb-2">
            <div className="w-12 h-12 mx-auto border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Chargement des locataires...</h3>
          <p className="text-gray-600">Veuillez patienter pendant que nous récupérons les données des locataires.</p>
        </div>
      )}

      {/* Add New Tenant Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pb-2 border-b border-gray-200">
              <h2 className="text-lg md:text-xl font-semibold">Ajouter un nouveau locataire</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
                aria-label="Fermer"
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom complet *
                </label>
                <input
                  type="text"
                  required
                  value={newTenant.fullName}
                  onChange={(e) => setNewTenant(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={newTenant.email}
                  onChange={(e) => setNewTenant(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={newTenant.phone}
                  onChange={(e) => setNewTenant(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse
                </label>
                <input
                  type="text"
                  value={newTenant.address}
                  onChange={(e) => setNewTenant(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Entrez l'adresse du locataire"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Propriété *
                </label>
                <select
                  required
                  value={newTenant.propertyId}
                  onChange={(e) => setNewTenant(prev => ({ ...prev, propertyId: e.target.value }))}
                  disabled={isLoadingProperties}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isLoadingProperties ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                >
                  <option value="">
                    {isLoadingProperties ? 'Chargement des propriétés...' : 'Sélectionnez une propriété'}
                  </option>
                  {properties.map((property) => (
                    <option key={property.id} value={String(property.id)}>
                      {property.title}
                    </option>
                  ))}
                </select>
                {propertiesError && (
                  <p className="text-sm text-red-600 mt-1">{propertiesError}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Montant du loyer
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newTenant.rent}
                  onChange={(e) => setNewTenant(prev => ({ ...prev, rent: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Montant des charges
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newTenant.charges}
                  onChange={(e) => setNewTenant(prev => ({ ...prev, charges: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optionnel"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statut *
                </label>
                <select
                  required
                  value={newTenant.status || 'ACTIVE'}
                  onChange={(e) => setNewTenant(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ACTIVE">Actif</option>
                  <option value="INACTIVE">Inactif</option>
                  <option value="EXPIRED">Expiré</option>
                </select>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm md:text-base"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm md:text-base"
                >
                  Ajouter le locataire
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tenant Documents Modal */}
      {documentsModalTenant && (
        <TenantDocuments
          tenantId={Number(documentsModalTenant.id)}
          tenantName={documentsModalTenant.fullName || documentsModalTenant.name || 'Inconnu'}
          onClose={() => setDocumentsModalTenant(null)}
        />
      )}

      {/* Edit Tenant Modal */}
      {isEditModalOpen && editingTenant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pb-2 border-b border-gray-200">
              <h2 className="text-lg md:text-xl font-semibold">Modifier le locataire</h2>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingTenant(null);
                  setEditForm({
                    fullName: '',
                    email: '',
                    phone: '',
                    address: '',
                    propertyId: '',
                    checkInDate: '',
                    checkOutDate: '',
                    documents: [],
                    rent: '',
                    charges: '',
                    status: 'ACTIVE'
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom complet *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.fullName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse
                </label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Entrez l'adresse du locataire"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Propriété *
                </label>
                <select
                  required
                  value={editForm.propertyId}
                  onChange={(e) => setEditForm(prev => ({ ...prev, propertyId: e.target.value }))}
                  disabled={isLoadingProperties}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isLoadingProperties ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                >
                  <option value="">
                    {isLoadingProperties ? 'Chargement des propriétés...' : 'Sélectionnez une propriété'}
                  </option>
                  {properties.map((property) => (
                    <option key={property.id} value={String(property.id)}>
                      {property.title}
                    </option>
                  ))}
                </select>
                {propertiesError && (
                  <p className="text-sm text-red-600 mt-1">{propertiesError}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Montant du loyer
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.rent}
                  onChange={(e) => setEditForm(prev => ({ ...prev, rent: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Montant des charges
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.charges}
                  onChange={(e) => setEditForm(prev => ({ ...prev, charges: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optionnel"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statut *
                </label>
                <select
                  required
                  value={editForm.status || 'ACTIVE'}
                  onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ACTIVE">Actif</option>
                  <option value="INACTIVE">Inactif</option>
                  <option value="EXPIRED">Expiré</option>
                </select>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingTenant(null);
                    setEditForm({
                      fullName: '',
                      email: '',
                      phone: '',
                      address: '',
                      propertyId: '',
                      checkInDate: '',
                      checkOutDate: '',
                      documents: [],
                      rent: '',
                      charges: '',
                      status: 'ACTIVE'
                    });
                  }}
                  className="w-full sm:w-auto px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm md:text-base"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm md:text-base"
                >
                  Mettre à jour le locataire
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
              Supprimer le locataire
            </h2>
            <p className="text-gray-600 text-center mb-6">
              Êtes-vous sûr de vouloir supprimer <strong>{deleteConfirmModal.tenantName}</strong> ? 
              Cette action est irréversible et toutes les données associées seront supprimées.
            </p>
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
              <button
                onClick={handleDeleteCancel}
                disabled={isDeleting}
                className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm md:text-base"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Suppression...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Supprimer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TunnetSectionFixed;
