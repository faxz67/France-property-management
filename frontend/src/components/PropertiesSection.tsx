import React, { useEffect, useState } from 'react';
import api from '../api';
import { Building2, MapPin, Home, Edit, Trash2, X, Image, Camera } from 'lucide-react';
import PropertyPhotos from './PropertyPhotos';
import { normalizePhotoUrl } from '../utils/imageUtils';
import '../styles/navigation-animations.css';
import '../styles/payments-animations.css';

interface PropertyPhoto {
  id: number;
  file_url: string;
  display_url?: string;
  original_filename: string;
  file_size: number;
  is_primary: boolean;
  created_at: string;
}

interface PropertyItem {
  id: number;
  title: string;
  address: string;
  city: string;
  postal_code?: string;
  country?: string;
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
  // Enhanced fields from dataService
  display_title: string;
  display_address: string;
  rent_formatted: string;
  photo_count: number;
  has_photos: boolean;
  primary_photo?: PropertyPhoto;
  photos?: PropertyPhoto[];
  // Optional property fields
  number_of_halls?: number;
  number_of_kitchens?: number;
  number_of_bathrooms?: number;
  number_of_parking_spaces?: number;
  number_of_rooms?: number;
  number_of_gardens?: number;
}

const PropertiesSection: React.FC = () => {
  const [items, setItems] = useState<PropertyItem[]>([]);
  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [propertyType, setPropertyType] = useState('APARTMENT');
  const [rent, setRent] = useState('');
  const [description, setDescription] = useState('');
  
  // Optional property fields
  const [numberOfHalls, setNumberOfHalls] = useState('');
  const [numberOfKitchens, setNumberOfKitchens] = useState('');
  const [numberOfBathrooms, setNumberOfBathrooms] = useState('');
  const [numberOfParkingSpaces, setNumberOfParkingSpaces] = useState('');
  const [numberOfRooms, setNumberOfRooms] = useState('');
  const [numberOfGardens, setNumberOfGardens] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [photosModalPropertyId, setPhotosModalPropertyId] = useState<number | null>(null);
  const [postalCodeLoading, setPostalCodeLoading] = useState(false);

  // Removed excessive console logging to prevent re-render issues

  // Auto-detect postal code from address and city
  useEffect(() => {
    let isMounted = true; // Track if component is still mounted
    
    const detectPostalCode = async () => {
      // Only auto-detect if postal code is empty and we have both address and city
      if (postalCode.trim() || !address.trim() || !city.trim()) {
        return;
      }

      // Don't auto-detect in edit mode to avoid overwriting existing data
      if (editMode) {
        return;
      }

      if (!isMounted) return; // Check if component is still mounted
      
      setPostalCodeLoading(true);
      try {
        // Use API Gouv française for postal code lookup
        const query = `${address}, ${city}, France`;
        const response = await fetch(
          `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=1`,
          { signal: AbortSignal.timeout(5000) } // 5 second timeout
        );
        
        if (!isMounted) return; // Check again after async operation
        
        if (response.ok) {
          const data = await response.json();
          if (data?.features && Array.isArray(data.features) && data.features.length > 0) {
            const postalCodeFound = data.features[0]?.properties?.postcode;
            if (postalCodeFound && isMounted) {
              setPostalCode(postalCodeFound);
            }
          }
        }
      } catch (error: any) {
        // Silently fail - user can still enter postal code manually
        if (error.name !== 'AbortError' && isMounted) {
          console.log('Postal code auto-detection failed:', error?.message || error);
        }
      } finally {
        if (isMounted) {
          setPostalCodeLoading(false);
        }
      }
    };

    // Debounce the API call
    const timeoutId = setTimeout(() => {
      detectPostalCode();
    }, 1000);

    return () => {
      isMounted = false; // Mark as unmounted
      clearTimeout(timeoutId);
    };
  }, [address, city, postalCode, editMode]);

  const fetchItems = async () => {
    try {
      // Check if token exists before making API calls
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, skipping properties API call');
        setItems([]);
        return;
      }

      setLoading(true);
      setError('');
      console.log('🏠 Fetching properties with photos...');
      
      // Call API directly instead of using dataService to avoid cache issues
      const response = await (api as any).listProperties();
      console.log('📡 API Response:', response.data);
      
      if (response.data?.success && response.data?.data?.properties) {
        const rawProperties = response.data.data.properties;
        
        // Ensure rawProperties is an array
        if (!Array.isArray(rawProperties)) {
          console.error('❌ Properties data is not an array:', rawProperties);
          setItems([]);
          return;
        }
        
        console.log('📋 Raw properties from API:', rawProperties.length);
        
        // Fetch photos for each property
        const propertiesWithPhotos = await Promise.all(
          rawProperties.map(async (property: any) => {
            // Ensure property has required fields
            if (!property || !property.id) {
              console.warn('⚠️ Invalid property data:', property);
              return null;
            }
            let photos: any[] = [];
            try {
              const photosResponse = await (api as any).getPropertyPhotos(property.id);
              if (photosResponse?.data?.success && photosResponse?.data?.data?.photos) {
                const photosArray = photosResponse.data.data.photos;
                // Ensure photos is an array
                if (Array.isArray(photosArray)) {
                  photos = photosArray.map((photo: any) => {
                    // Validate photo object
                    if (!photo || !photo.file_url) {
                      console.warn('⚠️ Invalid photo data:', photo);
                      return null;
                    }
                    return {
                      ...photo,
                      display_url: normalizePhotoUrl(photo.file_url || ''),
                      created_at_fr: photo.created_at ? new Date(photo.created_at).toLocaleDateString('fr-FR') : '',
                      updated_at_fr: photo.updated_at ? new Date(photo.updated_at).toLocaleDateString('fr-FR') : null
                    };
                  }).filter((p: any) => p !== null); // Remove invalid photos
                  console.log(`✅ Loaded ${photos.length} photo(s) for property ${property.id}`);
                } else {
                  console.warn(`⚠️ Photos data is not an array for property ${property.id}:`, photosArray);
                }
              } else {
                console.log(`ℹ️ No photos found for property ${property.id}`);
              }
            } catch (photoError: any) {
              console.warn(`⚠️ Could not fetch photos for property ${property.id}:`, photoError?.message || photoError);
              // Also check if property has a photo field as fallback
              if (property.photo) {
                console.log(`ℹ️ Using fallback photo field for property ${property.id}`);
              }
            }

            // Find primary photo (prioritize is_primary === true) or use first photo
            const primaryPhoto = photos.find((photo: any) => photo.is_primary === true) || 
                                 photos.find((photo: any) => photo.is_primary === 1) ||
                                 photos[0] || 
                                 null;
            
            return {
              ...property,
              photos: photos,
              primary_photo: primaryPhoto,
              display_title: property.title || property.name || 'Propriété sans nom',
              display_address: `${property.address || ''}, ${property.city || ''}${property.postal_code ? ' ' + property.postal_code : ''}`.trim(),
              rent_formatted: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(property.monthly_rent || property.rent || 0),
              photo_count: photos.length,
              has_photos: photos.length > 0,
              // Debug info
              _debug: {
                hasPhotos: photos.length > 0,
                primaryPhotoExists: !!primaryPhoto,
                primaryPhotoUrl: primaryPhoto?.file_url || primaryPhoto?.display_url || null
              }
            };
          })
        );
        
        // Filter out null values (invalid properties)
        const validProperties = propertiesWithPhotos.filter((p: any) => p !== null);
        
        console.log('✅ Properties fetched with photos:', validProperties.length, 'properties');
        setItems(validProperties);
      } else {
        console.log('❌ Invalid response structure:', response.data);
        setItems([]);
      }
      
    } catch (e) {
      console.error('❌ Failed to fetch properties:', e);
      setError('Erreur lors du chargement des propriétés');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchItems(); 
  }, []);

  const validateForm = () => {
    // Required fields validation
    if (!title.trim()) return 'Title is required';
    if (title.trim().length < 3) return 'Le titre doit contenir au moins 3 caractères';
    if (title.trim().length > 255) return 'Le titre doit contenir moins de 255 caractères';
    
    if (!address.trim()) return 'L\'adresse est requise';
    if (address.trim().length < 5) return 'L\'adresse doit contenir au moins 5 caractères';
    
    if (!city.trim()) return 'La ville est requise';
    if (city.trim().length < 2) return 'La ville doit contenir au moins 2 caractères';
    
    if (!postalCode.trim()) return 'Le code postal est requis';
    if (postalCode.trim().length < 3) return 'Le code postal doit contenir au moins 3 caractères';
    if (postalCode.trim().length > 20) return 'Le code postal doit contenir moins de 20 caractères';
    
    if (!propertyType.trim()) return 'Le type de propriété est requis';
    
    // Optional fields validation
    const rentValue = parseFloat(rent);
    if (rent && (isNaN(rentValue) || rentValue <= 0)) {
      return 'Le montant du loyer doit être un nombre positif';
    }
    if (rentValue > 1000000) {
      return 'Le montant du loyer semble anormalement élevé. Veuillez vérifier.';
    }
    
    // Description length validation if provided
    const trimmedDescription = description.trim();
    if (trimmedDescription && trimmedDescription.length > 2000) {
      return 'La description doit contenir moins de 2000 caractères';
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
    
    // Double-check required fields before submission
    if (!postalCode.trim()) {
      setError('Le code postal est requis. Veuillez attendre la détection automatique ou l\'entrer manuellement.');
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
      formData.append('postal_code', postalCode.trim());
      formData.append('property_type', propertyType);
      
      // Debug: log form data in development
      if (import.meta.env.DEV) {
        console.log('📤 Submitting property form:', {
          title: title.trim(),
          address: address.trim(),
          city: city.trim(),
          postal_code: postalCode.trim(),
          property_type: propertyType,
          hasPhoto: !!photoFile
        });
      }
      
      // Optional fields - only append if they have valid values
      const rentValue = parseFloat(rent);
      if (!isNaN(rentValue) && rentValue > 0) {
        formData.append('monthly_rent', rentValue.toString());
      }
      
      const trimmedDescription = description.trim();
      if (trimmedDescription) {
        formData.append('description', trimmedDescription);
      }

      if (photoFile) {
        formData.append('photo', photoFile);
        console.log('📤 Appending photo to formData:', {
          fileName: photoFile.name,
          fileSize: photoFile.size,
          fileType: photoFile.type
        });
      } else {
        console.log('ℹ️ No photo file to append');
      }

      // Optional property fields - only append if they have valid values
      const hallsValue = parseInt(numberOfHalls);
      formData.append('number_of_halls', (!isNaN(hallsValue) && hallsValue >= 0 ? hallsValue : 0).toString());

      const kitchensValue = parseInt(numberOfKitchens);
      formData.append('number_of_kitchens', (!isNaN(kitchensValue) && kitchensValue >= 0 ? kitchensValue : 0).toString());

      const bathroomsValue = parseInt(numberOfBathrooms);
      formData.append('number_of_bathrooms', (!isNaN(bathroomsValue) && bathroomsValue >= 0 ? bathroomsValue : 0).toString());

      const parkingValue = parseInt(numberOfParkingSpaces);
      formData.append('number_of_parking_spaces', (!isNaN(parkingValue) && parkingValue >= 0 ? parkingValue : 0).toString());

      const roomsValue = parseInt(numberOfRooms);
      formData.append('number_of_rooms', (!isNaN(roomsValue) && roomsValue >= 0 ? roomsValue : 0).toString());

      const gardensValue = parseInt(numberOfGardens);
      formData.append('number_of_gardens', (!isNaN(gardensValue) && gardensValue >= 0 ? gardensValue : 0).toString());

      let response;
      if (editMode && editId) {
        response = await (api as any).updateProperty(editId, formData);
      } else {
        response = await (api as any).createProperty(formData);
      }

      // Confirm successful API response
      if (!response?.data?.success) {
        throw new Error(response?.data?.error || 'Échec de l\'enregistrement de la propriété');
      }
      
      // Check for warnings (e.g., photo upload issues)
      if (response?.data?.warning) {
        console.warn('⚠️ Property saved with warning:', response.data.warning);
        setError(response.data.warning);
        // Still show success but with warning
      }
      
      // Show success message
      const successMessage = editMode ? 'Propriété mise à jour avec succès !' : 'Propriété créée avec succès !';
      if (!response?.data?.warning) {
        setError('');
      }
      setSuccess(successMessage);
      
      // Reset form
      setTitle('');
      setAddress(''); 
      setCity(''); 
      setPostalCode(''); 
      setPropertyType('APARTMENT');
      setRent(''); 
      setDescription(''); 
      setNumberOfHalls('');
      setNumberOfKitchens('');
      setNumberOfBathrooms('');
      setNumberOfParkingSpaces('');
      setNumberOfRooms('');
      setNumberOfGardens('');
      setPhotoFile(null);
      setPhotoPreview(null);
      setEditMode(false); 
      setEditId(null); 
      setIsModalOpen(false);
      
      // Get the created property ID before clearing state
      const createdPropertyId = response?.data?.data?.property?.id;
      const hadPhoto = !!photoFile;
      
      // Immediate refresh to show the new property
      console.log('🔄 Immediate refresh to show new property...');
      await fetchItems();
      
      // If a photo was uploaded, verify it was created as primary
      if (createdPropertyId && hadPhoto) {
        console.log('📸 Photo was uploaded, verifying primary photo creation...');
        console.log('   Created property ID:', createdPropertyId);
        console.log('   Response data:', response?.data?.data);
        
        // Check if photos are already in the response
        const propertyData = response?.data?.data?.property;
        if (propertyData?.photos && propertyData.photos.length > 0) {
          console.log('✅ Photos found in response:', propertyData.photos.length);
          const primaryPhoto = propertyData.photos.find((p: any) => p.is_primary === true) || propertyData.photos[0];
          if (primaryPhoto) {
            console.log('✅ Primary photo in response:', {
              photoId: primaryPhoto.id,
              fileUrl: primaryPhoto.file_url,
              filePath: primaryPhoto.file_path
            });
          }
        }
        
        // Wait a bit for backend to process the photo
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Retry up to 3 times to get the primary photo
        let retries = 0;
        let primaryPhotoFound = false;
        
        while (retries < 3 && !primaryPhotoFound) {
          try {
            const photosResponse = await (api as any).getPropertyPhotos(createdPropertyId);
            console.log(`📸 Photo check attempt ${retries + 1}:`, photosResponse?.data);
            
            if (photosResponse?.data?.success && photosResponse?.data?.data?.photos) {
              const photos = photosResponse.data.data.photos;
              const primaryPhoto = photos.find((p: any) => p.is_primary === true || p.is_primary === 1) || photos[0];
              
              if (primaryPhoto) {
                console.log(`✅ Primary photo found for property ${createdPropertyId}:`, {
                  photoId: primaryPhoto.id,
                  isPrimary: primaryPhoto.is_primary,
                  fileUrl: primaryPhoto.file_url,
                  filePath: primaryPhoto.file_path,
                  displayUrl: normalizePhotoUrl(primaryPhoto.file_url || '')
                });
                primaryPhotoFound = true;
              } else {
                retries++;
                if (retries < 3) {
                  console.log(`⏳ Retry ${retries}/3: Waiting for primary photo...`);
                  await new Promise(resolve => setTimeout(resolve, 1000));
                }
              }
            } else {
              retries++;
              if (retries < 3) {
                console.log(`⏳ Retry ${retries}/3: No photos yet, waiting...`);
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }
          } catch (photoCheckError: any) {
            retries++;
            console.warn(`⚠️ Error checking photos (attempt ${retries}/3):`, photoCheckError?.message || photoCheckError);
            if (retries < 3) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }
        
        // Always refresh to show the property (with or without photo)
        await fetchItems();
        
        if (primaryPhotoFound) {
          console.log('✅ Primary photo verified and displayed');
        } else {
          console.warn(`⚠️ Primary photo not found after ${retries} attempts`);
          console.warn('   This could indicate:');
          console.warn('   - Photo upload failed silently');
          console.warn('   - PropertyPhoto record was not created');
          console.warn('   - Database transaction issue');
        }
      } else {
        // No photo uploaded, just refresh once
        console.log('✅ Property created without photo, list refreshed');
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (e: any) {
      console.error('Property submission error:', e);
      
      // Extract detailed error message
      let errorMessage = 'Échec de l\'enregistrement de la propriété';
      
      if (e?.response?.data) {
        const errorData = e.response.data;
        
        // Check for validation details
        if (errorData.details && Array.isArray(errorData.details)) {
          const validationMessages = errorData.details.map((detail: any) => detail.msg || detail.message).join(', ');
          errorMessage = `Erreurs de validation : ${validationMessages}`;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } else if (e?.userMessage) {
        errorMessage = e.userMessage;
      } else if (e?.message) {
        errorMessage = e.message;
      }
      
      setError(errorMessage);
      setSuccess(''); // Clear success message on error
      
      // Log more details in development
      if (import.meta.env.DEV) {
        console.debug('Property submission debug:', {
          error: e.response?.data || e,
          formData: {
            title,
            address,
            city,
            postalCode,
            propertyType
          }
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
    setPostalCode(property.postal_code || '');
    setPropertyType(property.property_type);
    setRent(property.monthly_rent?.toString() || '');
    setDescription(property.description || '');
    setNumberOfHalls(property.number_of_halls?.toString() || '');
    setNumberOfKitchens(property.number_of_kitchens?.toString() || '');
    setNumberOfBathrooms(property.number_of_bathrooms?.toString() || '');
    setNumberOfParkingSpaces(property.number_of_parking_spaces?.toString() || '');
    setNumberOfRooms(property.number_of_rooms?.toString() || '');
    setNumberOfGardens(property.number_of_gardens?.toString() || '');
    setEditMode(true);
    setEditId(property.id.toString());
    setIsModalOpen(true);
  };
  
  const cancelEdit = () => {
    setTitle(''); 
    setAddress(''); 
    setCity(''); 
    setPostalCode(''); 
    setPropertyType('APARTMENT');
    setRent(''); 
    setDescription('');
    setNumberOfHalls('');
    setNumberOfKitchens('');
    setNumberOfBathrooms('');
    setNumberOfParkingSpaces('');
    setNumberOfRooms('');
    setNumberOfGardens('');
    setPhotoFile(null);
    setPhotoPreview(null);
    setEditMode(false); 
    setEditId(null); 
    setIsModalOpen(false);
    setError('');
    setSuccess('');
  };

  const onDelete = async (id: number) => {
    if (!confirm('Delete this property?')) return;
    try {
      await (api as any).deleteProperty(id.toString());
      await fetchItems();
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Failed to delete');
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 md:mb-6 fade-in-soft">
        <div className="slide-in-left">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Propriétés</h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">Gérer vos propriétés et leurs photos</p>
        </div>
        <div className="slide-in-right w-full sm:w-auto">
          <button 
            onClick={() => {
              setError('');
              setSuccess('');
              setIsModalOpen(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-blue-700 smooth-transition hover-lift-strong glow-effect w-full sm:w-auto text-sm md:text-base"
          >
            <Home className="w-4 h-4 smooth-transition" />
            <span>Ajouter Propriété</span>
          </button>
        </div>
      </div>
      
      {/* Property Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 fade-in">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto modal-enter">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">{editMode ? 'Modifier la Propriété' : 'Ajouter une Nouvelle Propriété'}</h2>
              <button
                onClick={cancelEdit}
                className="text-gray-400 hover:text-gray-600 p-1"
                title="Fermer le modal"
                aria-label="Fermer le modal"
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>
            
            {/* Modal Content */}
            <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-3 md:space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="slide-in-left">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Titre *</label>
                  <input 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 smooth-transition hover-lift" 
                    placeholder="Titre de la Propriété" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    required 
                  />
                </div>
                <div className="slide-in-right">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Adresse *</label>
                  <input 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 smooth-transition hover-lift" 
                    placeholder="Adresse de la Propriété" 
                    value={address} 
                    onChange={e => setAddress(e.target.value)} 
                    required 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ville *</label>
                  <input 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="Ville" 
                    value={city} 
                    onChange={e => setCity(e.target.value)} 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Code Postal *
                    {postalCodeLoading && (
                      <span className="ml-2 text-xs text-gray-500">(Recherche...)</span>
                    )}
                  </label>
                  <div className="relative">
                    <input 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      placeholder="Code Postal (détection automatique)" 
                      value={postalCode} 
                      onChange={e => setPostalCode(e.target.value)} 
                      required 
                    />
                    {postalCodeLoading && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                  </div>
                  {address && city && !postalCode && !postalCodeLoading && (
                    <p className="mt-1 text-xs text-gray-500">
                      Le code postal sera détecté automatiquement
                    </p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type de Propriété *</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    value={propertyType} 
                    onChange={e => setPropertyType(e.target.value)} 
                    required
                    aria-label="Type de Propriété"
                    id="property-type"
                  >
                    <option value="APARTMENT">Appartement</option>
                    <option value="HOUSE">Maison</option>
                    <option value="STUDIO">Studio</option>
                    <option value="OTHER">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Loyer Mensuel</label>
                  <input 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="Loyer Mensuel" 
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
                  placeholder="Description de la Propriété" 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  rows={3}
                />
              </div>
              
              {/* Optional Property Details */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Détails de la Propriété (Optionnel)</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-2 h-10 flex items-center">Nombre de Halls</label>
                    <input 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-10" 
                      placeholder="0" 
                      type="number" 
                      min="0"
                      value={numberOfHalls} 
                      onChange={e => setNumberOfHalls(e.target.value)} 
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-2 h-10 flex items-center">Nombre de Cuisines</label>
                    <input 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-10" 
                      placeholder="0" 
                      type="number" 
                      min="0"
                      value={numberOfKitchens} 
                      onChange={e => setNumberOfKitchens(e.target.value)} 
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-2 h-10 flex items-center">Nombre de Salles de Bain</label>
                    <input 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-10" 
                      placeholder="0" 
                      type="number" 
                      min="0"
                      value={numberOfBathrooms} 
                      onChange={e => setNumberOfBathrooms(e.target.value)} 
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-2 h-10 flex items-center">Nombre de Places de Parking</label>
                    <input 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-10" 
                      placeholder="0" 
                      type="number" 
                      min="0"
                      value={numberOfParkingSpaces} 
                      onChange={e => setNumberOfParkingSpaces(e.target.value)} 
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-2 h-10 flex items-center">Nombre de Chambres</label>
                    <input 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-10" 
                      placeholder="0" 
                      type="number" 
                      min="0"
                      value={numberOfRooms} 
                      onChange={e => setNumberOfRooms(e.target.value)} 
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-2 h-10 flex items-center">Nombre de Jardins</label>
                    <input 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-10" 
                      placeholder="0" 
                      type="number" 
                      min="0"
                      value={numberOfGardens} 
                      onChange={e => setNumberOfGardens(e.target.value)} 
                    />
                  </div>
                </div>
              </div>
              
              {/* Photo upload */}
              <div className="border-t border-gray-200 pt-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Image de la Propriété</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Camera className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600 text-center px-2">
                          {photoFile ? 'Changer' : 'Ajouter'} une image
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e)=>{
                          const f = e.target.files?.[0] || null;
                          setPhotoFile(f || null);
                          if (f) {
                            const url = URL.createObjectURL(f);
                            setPhotoPreview(url);
                          } else {
                            setPhotoPreview(null);
                          }
                        }}
                      />
                    </label>
                    {photoPreview && (
                      <div className="relative">
                        <img 
                          src={photoPreview} 
                          alt="Aperçu" 
                          className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200 shadow-sm" 
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoFile(null);
                            setPhotoPreview(null);
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                          title="Supprimer l'image"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  {!photoPreview && (
                    <p className="text-sm text-gray-500">
                      Format accepté : JPG, PNG, GIF. Taille recommandée : 800x600px
                    </p>
                  )}
                </div>
              </div>
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  <p className="font-semibold">Erreur</p>
                  <p className="text-sm">{error}</p>
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                  <p className="font-semibold">Succès</p>
                  <p className="text-sm">{success}</p>
                </div>
              )}
              
              {/* Modal Footer */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-4 border-t border-gray-200 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors text-sm md:text-base"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                >
                  {loading ? 'Enregistrement...' : editMode ? 'Mettre à Jour la Propriété' : 'Ajouter Propriété'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {items && Array.isArray(items) && items.length > 0 ? (
          items.map((p, index) => (
          <div key={p.id} className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden nav-hover-lift nav-item-enter-delay-${Math.min(index + 1, 7)}`}>
            <div className="h-48 bg-gray-100 flex items-center justify-center relative group">
              {/* Display primary photo, first photo, or fallback to property.photo field */}
              {p.primary_photo ? (
                <img 
                  src={p.primary_photo.display_url || normalizePhotoUrl(p.primary_photo.file_url || '')} 
                  alt={p.display_title}
                  crossOrigin="anonymous"
                  loading="lazy"
                  className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105" 
                  onError={(e) => {
                    const currentSrc = e.currentTarget.src;
                    console.warn(`❌ Failed to load primary image for property ${p.id}:`, {
                      propertyId: p.id,
                      primaryPhoto: p.primary_photo,
                      original_url: p.primary_photo?.file_url,
                      display_url: p.primary_photo?.display_url,
                      current_src: currentSrc,
                      normalized_url: normalizePhotoUrl(p.primary_photo?.file_url || ''),
                      hasPhotos: (p.photos?.length || 0) > 0,
                      photoCount: p.photo_count
                    });
                    // Try fallback to first photo in photos array
                    if (p.photos && p.photos.length > 0 && p.photos[0]?.file_url) {
                      const fallbackUrl = normalizePhotoUrl(p.photos[0].file_url);
                      if (currentSrc !== fallbackUrl) {
                        e.currentTarget.src = fallbackUrl;
                        return;
                      }
                    }
                    // Try fallback to property.photo field
                    if (p.photo && currentSrc !== normalizePhotoUrl(p.photo)) {
                      e.currentTarget.src = normalizePhotoUrl(p.photo);
                      return;
                    }
                    // Show placeholder if all fails
                    const imgElement = e.currentTarget;
                    imgElement.style.display = 'none';
                    const parent = imgElement.parentElement;
                    if (parent && !parent.querySelector('.placeholder-shown')) {
                      const placeholder = document.createElement('div');
                      placeholder.className = 'placeholder-shown flex flex-col items-center justify-center h-full w-full bg-gradient-to-br from-blue-50 to-indigo-100';
                      placeholder.innerHTML = `
                        <div class="w-20 h-20 bg-white/80 rounded-2xl flex items-center justify-center mb-3 shadow-lg">
                          <svg class="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                          </svg>
                        </div>
                        <p class="text-xs text-blue-600 font-medium">Aucune photo</p>
                      `;
                      parent.appendChild(placeholder);
                    }
                  }}
                  onLoad={(e) => {
                    console.log(`✅ Primary image loaded successfully for property ${p.id}:`, {
                      url: e.currentTarget.src,
                      propertyId: p.id
                    });
                  }}
                />
              ) : p.photos && p.photos.length > 0 ? (
                <img 
                  src={p.photos[0]?.display_url || normalizePhotoUrl(p.photos[0]?.file_url || '')} 
                  alt={p.display_title}
                  crossOrigin="anonymous"
                  loading="lazy"
                  className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105" 
                  onError={(e) => {
                    console.warn(`❌ Failed to load first image for property ${p.id}:`, {
                      original_url: p.photos?.[0]?.file_url,
                      display_url: p.photos?.[0]?.display_url,
                      current_src: e.currentTarget.src,
                      error: 'Image failed to load - check CORS/CSP headers'
                    });
                    // Try fallback to property.photo field
                    if (p.photo && e.currentTarget.src !== normalizePhotoUrl(p.photo)) {
                      e.currentTarget.src = normalizePhotoUrl(p.photo);
                      return;
                    }
                    // Show placeholder if all fails
                    const imgElement = e.currentTarget;
                    imgElement.style.display = 'none';
                    const parent = imgElement.parentElement;
                    if (parent && !parent.querySelector('.placeholder-shown')) {
                      const placeholder = document.createElement('div');
                      placeholder.className = 'placeholder-shown flex flex-col items-center justify-center h-full w-full bg-gradient-to-br from-blue-50 to-indigo-100';
                      placeholder.innerHTML = `
                        <div class="w-20 h-20 bg-white/80 rounded-2xl flex items-center justify-center mb-3 shadow-lg">
                          <svg class="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                          </svg>
                        </div>
                        <p class="text-xs text-blue-600 font-medium">Aucune photo</p>
                      `;
                      parent.appendChild(placeholder);
                    }
                  }}
                  onLoad={() => {
                    console.log(`✅ First image loaded successfully for property ${p.id}`);
                  }}
                />
              ) : p.photo ? (
                <img 
                  src={normalizePhotoUrl(p.photo)} 
                  alt={p.display_title}
                  crossOrigin="anonymous"
                  loading="lazy"
                  className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105" 
                  onError={(e) => {
                    console.warn(`❌ Failed to load property photo for property ${p.id}:`, {
                      photo_url: p.photo,
                      current_src: e.currentTarget.src,
                      error: 'Image failed to load'
                    });
                    // Show placeholder
                    const imgElement = e.currentTarget;
                    imgElement.style.display = 'none';
                    const parent = imgElement.parentElement;
                    if (parent && !parent.querySelector('.placeholder-shown')) {
                      const placeholder = document.createElement('div');
                      placeholder.className = 'placeholder-shown flex items-center justify-center h-full w-full bg-gray-200';
                      placeholder.innerHTML = '<svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>';
                      parent.appendChild(placeholder);
                    }
                  }}
                  onLoad={() => {
                    console.log(`✅ Property photo loaded successfully for property ${p.id}`);
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full w-full bg-gray-200">
                  <Building2 className="w-12 h-12 text-gray-400" />
                </div>
              )}
              
              {/* Photo count badge */}
              {p.photo_count > 0 && (
                <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                  <Camera className="w-3 h-3" />
                  {p.photo_count}
                </div>
              )}
              
              {/* Rent badge */}
              {p.rent_formatted && (
                <div className="absolute top-2 right-2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  {p.rent_formatted}/mois
                </div>
              )}
              
              {/* Photo management button */}
              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                  onClick={() => setPhotosModalPropertyId(p.id)}
                  className="bg-white bg-opacity-90 text-gray-700 p-2 rounded-full hover:bg-opacity-100 transition-all duration-200 nav-transition nav-hover-scale"
                  title="Gérer les photos"
                >
                  <Image className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{p.display_title}</h3>
              <div className="flex items-center text-gray-600 mb-2">
                <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                <span className="text-sm">{p.display_address}</span>
              </div>
              {/* Property numeric details */}
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
                <div>Halls: <span className="font-medium">{p.number_of_halls ?? 0}</span></div>
                <div>Cuisines: <span className="font-medium">{p.number_of_kitchens ?? 0}</span></div>
                <div>Salles de bain: <span className="font-medium">{p.number_of_bathrooms ?? 0}</span></div>
                <div>Parking: <span className="font-medium">{p.number_of_parking_spaces ?? 0}</span></div>
                <div>Chambres: <span className="font-medium">{p.number_of_rooms ?? 0}</span></div>
                <div>Jardins: <span className="font-medium">{p.number_of_gardens ?? 0}</span></div>
              </div>
              <div className="flex items-center text-gray-500 text-sm mb-3">
                <span>{p.city}{p.postal_code ? ' ' + p.postal_code : ''}</span>
                <span className="mx-2">•</span>
                <span className="capitalize">{p.property_type.toLowerCase()}</span>
              </div>
              
              {/* Optional property details */}
              {(p.number_of_rooms || p.number_of_bathrooms || p.number_of_kitchens || p.number_of_halls || p.number_of_parking_spaces || p.number_of_gardens) && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {p.number_of_rooms && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {p.number_of_rooms} chambre{p.number_of_rooms !== 1 ? 's' : ''}
                    </span>
                  )}
                  {p.number_of_bathrooms && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {p.number_of_bathrooms} salle{p.number_of_bathrooms !== 1 ? 's' : ''} de bain
                    </span>
                  )}
                  {p.number_of_kitchens && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      {p.number_of_kitchens} cuisine{p.number_of_kitchens !== 1 ? 's' : ''}
                    </span>
                  )}
                  {p.number_of_halls && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {p.number_of_halls} hall{p.number_of_halls !== 1 ? 's' : ''}
                    </span>
                  )}
                  {p.number_of_parking_spaces && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {p.number_of_parking_spaces} place{p.number_of_parking_spaces !== 1 ? 's' : ''} de parking
                    </span>
                  )}
                  {p.number_of_gardens && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                      {p.number_of_gardens} jardin{p.number_of_gardens !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              )}
              
              {p.description && (
                <p className="text-gray-700 text-sm mb-4 line-clamp-2">{p.description}</p>
              )}
              <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                <button 
                  onClick={() => setPhotosModalPropertyId(p.id)} 
                  className="flex items-center text-green-600 hover:text-green-800 text-sm font-medium nav-transition nav-hover-scale"
                >
                  <Image className="w-4 h-4 mr-1" />
                  Photos ({p.photo_count || 0})
                </button>
                <button 
                  onClick={() => startEdit(p)} 
                  className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium nav-transition nav-hover-scale"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Modifier
                </button>
                <button 
                  onClick={() => onDelete(p.id)} 
                  className="flex items-center text-red-600 hover:text-red-800 text-sm font-medium nav-transition nav-hover-scale"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Supprimer
                </button>
              </div>
            </div>
          </div>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500">
            <Building2 className="w-16 h-16 mb-4 text-gray-400" />
            <p className="text-lg font-medium">Aucune propriété trouvée</p>
            <p className="text-sm mt-2">Commencez par ajouter votre première propriété</p>
          </div>
        )}
      </div>

      {/* Property Photos Modal */}
      {photosModalPropertyId && (
        <PropertyPhotos
          propertyId={photosModalPropertyId}
          onClose={() => setPhotosModalPropertyId(null)}
        />
      )}
    </div>
  );
};

export default PropertiesSection;
