import React, { useEffect, useState } from 'react';
// @ts-ignore
import api from '../api.js';
import { Building2, MapPin, Home, Edit, Trash2, X } from 'lucide-react';

interface PropertyItem {
  id: number;
  title: string;
  address: string;
  city: string;
  country: string;
  property_type: string;
  monthly_rent?: number;
  description?: string;
  photo?: string;
  images?: Array<{
    id: number;
    image_url: string;
    image_alt?: string;
    is_primary: boolean;
  }>;
}

const PropertiesSection: React.FC = () => {
  const [items, setItems] = useState<PropertyItem[]>([]);
  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [propertyType, setPropertyType] = useState('APARTMENT');
  const [rent, setRent] = useState('');
  const [description, setDescription] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  console.log('PropertiesSection rendered - items:', items, 'loading:', loading);

  const fetchItems = async () => {
    try {
      const response = await api.listProperties();
      console.log('Properties API response:', response.data);
      setItems(response.data?.data?.properties || []);
    } catch (e) {
      console.error('Error fetching properties:', e);
      setItems([]);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const validateForm = () => {
    // Required fields validation
    if (!title.trim()) return 'Title is required';
    if (title.trim().length < 3) return 'Title must be at least 3 characters';
    if (title.trim().length > 255) return 'Title must be less than 255 characters';
    
    if (!address.trim()) return 'Address is required';
    if (address.trim().length < 5) return 'Address must be at least 5 characters';
    
    if (!city.trim()) return 'City is required';
    if (city.trim().length < 2) return 'City must be at least 2 characters';
    
    if (!country.trim()) return 'Country is required';
    if (country.trim().length < 2) return 'Country must be at least 2 characters';
    
    if (!propertyType.trim()) return 'Property type is required';
    
    // Optional fields validation
    const rentValue = parseFloat(rent);
    if (rent && (isNaN(rentValue) || rentValue <= 0)) {
      return 'Rent amount must be a positive number';
    }
    if (rentValue > 1000000) {
      return 'Rent amount seems unusually high. Please verify.';
    }
    
    // Description length validation if provided
    const trimmedDescription = description.trim();
    if (trimmedDescription && trimmedDescription.length > 2000) {
      return 'Description must be less than 2000 characters';
    }
    
    return null; // Validation passed
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true); 
    setError('');
    
    try {
      // Create FormData object for multipart/form-data
      const formData = new FormData();
      
      // Required fields
      formData.append('title', title.trim());
      formData.append('address', address.trim());
      formData.append('city', city.trim());
      formData.append('country', country.trim());
      formData.append('property_type', propertyType);
      
      // Optional fields - only append if they have valid values
      const rentValue = parseFloat(rent);
      if (!isNaN(rentValue) && rentValue > 0) {
        formData.append('monthly_rent', rentValue.toString());
      }
      
      const trimmedDescription = description.trim();
      if (trimmedDescription) {
        formData.append('description', trimmedDescription);
      }

      let response;
      if (editMode && editId) {
        response = await api.updateProperty(editId, formData);
      } else {
        response = await api.createProperty(formData);
      }

      // Confirm successful API response
      if (!response?.data?.success) {
        throw new Error(response?.data?.error || 'Failed to save property');
      }
      
      // Reset form
      setAddress(''); 
      setCity(''); 
      setCountry(''); 
      setPropertyType('APARTMENT');
      setRent(''); 
      setDescription(''); 
      setEditMode(false); 
      setEditId(null); 
      setIsModalOpen(false);
      
      await fetchItems();
    } catch (e: any) {
      console.error('Property submission error:', e);
      // Use the enhanced error message from our API interceptor
      setError(e.userMessage || e?.response?.data?.error || 'Failed to save property');
      
      // Log more details in development
      if (import.meta.env.DEV) {
        console.debug('Property submission debug:', {
          error: e.response?.data || e
        });
      }
    } finally {
      setLoading(false);
    }
  };
  
  const startEdit = (property: PropertyItem) => {
    setTitle(property.title);
    setAddress(property.address);
    setCity(property.city);
    setCountry(property.country);
    setPropertyType(property.property_type);
    setRent(property.monthly_rent?.toString() || '');
    setDescription(property.description || '');
    setEditMode(true);
    setEditId(property.id);
    setIsModalOpen(true);
  };
  
  const cancelEdit = () => {
    setTitle(''); 
    setAddress(''); 
    setCity(''); 
    setCountry(''); 
    setPropertyType('APARTMENT');
    setRent(''); 
    setDescription('');
    setEditMode(false); 
    setEditId(null); 
    setIsModalOpen(false);
  };

  const onDelete = async (id: string) => {
    if (!confirm('Delete this property?')) return;
    try {
      await api.deleteProperty(id);
      await fetchItems();
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Failed to delete');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
        >
          <Home className="w-4 h-4" />
          <span>Add Property</span>
        </button>
      </div>
      
      {/* Property Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">{editMode ? 'Edit Property' : 'Add New Property'}</h2>
              <button
                onClick={cancelEdit}
                className="text-gray-400 hover:text-gray-600"
                title="Close modal"
                aria-label="Close modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Modal Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                  <input 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="Property Title" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
                  <input 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="Property Address" 
                    value={address} 
                    onChange={e => setAddress(e.target.value)} 
                    required 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                  <input 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="City" 
                    value={city} 
                    onChange={e => setCity(e.target.value)} 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country *</label>
                  <input 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="Country" 
                    value={country} 
                    onChange={e => setCountry(e.target.value)} 
                    required 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Property Type *</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    value={propertyType} 
                    onChange={e => setPropertyType(e.target.value)} 
                    required
                    aria-label="Property Type"
                    id="property-type"
                  >
                    <option value="APARTMENT">Apartment</option>
                    <option value="HOUSE">House</option>
                    <option value="CONDO">Condo</option>
                    <option value="STUDIO">Studio</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Rent</label>
                  <input 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="Monthly Rent" 
                    type="number" 
                    step="0.01"
                    value={rent} 
                    onChange={e => setRent(e.target.value)} 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="Property Description" 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  rows={3}
                />
              </div>
              
              {/* Photo upload removed per request */}
              
              {error && <div className="text-red-600">{error}</div>}
              
              {/* Modal Footer */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {loading ? 'Saving...' : editMode ? 'Update Property' : 'Add Property'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((p) => (
          <div key={p.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300">
            <div className="h-48 bg-gray-100 flex items-center justify-center relative">
              {(p.images && p.images.length > 0) ? (
                <img 
                  src={p.images.find(img => img.is_primary)?.image_url || p.images[0].image_url} 
                  alt={p.title} 
                  className="w-full h-48 object-cover" 
                />
              ) : p.photo ? (
                <img 
                  src={p.photo} 
                  alt={p.title} 
                  className="w-full h-48 object-cover" 
                />
              ) : (
                <div className="flex items-center justify-center h-full w-full bg-gray-200">
                  <Building2 className="w-12 h-12 text-gray-400" />
                </div>
              )}
              {p.monthly_rent && (
                <div className="absolute top-0 right-0 bg-blue-600 text-white px-3 py-1 m-2 rounded-full text-sm font-semibold">
                  €{p.monthly_rent}/mo
                </div>
              )}
            </div>
            <div className="p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{p.title}</h3>
              <div className="flex items-center text-gray-600 mb-2">
                <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                <span className="text-sm">{p.address}</span>
              </div>
              <div className="flex items-center text-gray-500 text-sm mb-3">
                <span>{p.city}, {p.country}</span>
                <span className="mx-2">•</span>
                <span className="capitalize">{p.property_type.toLowerCase()}</span>
              </div>
              {p.description && (
                <p className="text-gray-700 text-sm mb-4 line-clamp-2">{p.description}</p>
              )}
              <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                <button 
                  onClick={() => startEdit(p)} 
                  className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </button>
                <button 
                  onClick={() => onDelete(p.id)} 
                  className="flex items-center text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Building2 className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No properties yet</h3>
            <p className="text-gray-600">Add your first property to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertiesSection;
