import React, { useState, useEffect } from 'react';
import api from '../api';
import { Upload, X, Star, Download, Trash2, Image as ImageIcon } from 'lucide-react';
import { normalizePhotoUrl } from '../utils/imageUtils';

interface PropertyPhoto {
  id: number;
  file_url: string;
  original_filename: string;
  file_size: number;
  is_primary: boolean;
  created_at: string;
}

interface PropertyPhotosProps {
  propertyId: number;
  onClose: () => void;
}

const PropertyPhotos: React.FC<PropertyPhotosProps> = ({ propertyId, onClose }) => {
  const [photos, setPhotos] = useState<PropertyPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    fetchPhotos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]); // fetchPhotos is stable, no need to include in deps

  // Separate effect for cleanup of preview URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      // Clean up preview URLs when component unmounts or previewUrls changes
      previewUrls.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [previewUrls]);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const response = await (api as any).getPropertyPhotos(propertyId);
      const photos = response.data?.data?.photos || [];
      
      // Normalize photo URLs to ensure they display correctly
      const normalizedPhotos = photos.map((photo: any) => ({
        ...photo,
        file_url: normalizePhotoUrl(photo.file_url)
      }));
      
      setPhotos(normalizedPhotos);
    } catch (err: any) {
      console.error('Error fetching photos:', err);
      setError(err.userMessage || 'Failed to fetch photos');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFiles(files);
      
      // Create preview URLs
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        urls.push(URL.createObjectURL(files[i]));
      }
      setPreviewUrls(urls);
    }
  };

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      setError('Please select at least one photo');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      for (let i = 0; i < selectedFiles.length; i++) {
        formData.append('photos', selectedFiles[i]);
      }

      console.log('Uploading photos for property:', propertyId);
      console.log('Files to upload:', selectedFiles.length);
      
      const response = await (api as any).uploadPropertyPhotos(propertyId, formData);
      console.log('Upload response:', response);
      
      // Clear selection and previews
      setSelectedFiles(null);
      setPreviewUrls([]);
      
      // Refresh photos list
      await fetchPhotos();
      
      // Reset file input
      const fileInput = document.getElementById('photo-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      // Show success message
      setError(''); // Clear any previous errors
    } catch (err: any) {
      console.error('Error uploading photos:', err);
      console.error('Error details:', err.response?.data);
      setError(err.userMessage || err.message || 'Failed to upload photos');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photoId: number) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;

    try {
      await (api as any).deletePropertyPhoto(propertyId, photoId);
      await fetchPhotos();
    } catch (err: any) {
      console.error('Error deleting photo:', err);
      setError(err.userMessage || 'Failed to delete photo');
    }
  };

  const handleSetPrimary = async (photoId: number) => {
    try {
      await (api as any).setPrimaryPropertyPhoto(propertyId, photoId);
      await fetchPhotos();
    } catch (err: any) {
      console.error('Error setting primary photo:', err);
      setError(err.userMessage || 'Failed to set primary photo');
    }
  };

  const clearPreviews = () => {
    setSelectedFiles(null);
    setPreviewUrls([]);
    const fileInput = document.getElementById('photo-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-semibold text-gray-900">Property Photos</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Upload Section */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Upload New Photos</h3>
            
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="photo-upload"
                  className="flex items-center justify-center w-full px-4 py-3 border border-gray-300 rounded-lg cursor-pointer bg-white hover:bg-gray-100 transition-colors"
                >
                  <Upload className="w-5 h-5 mr-2 text-gray-600" />
                  <span className="text-gray-700">Choose Photos (Max 10 files, 10MB each)</span>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Preview selected files */}
              {selectedFiles && selectedFiles.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      {selectedFiles.length} file(s) selected
                    </p>
                    <button
                      onClick={clearPreviews}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Clear Selection
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative">
                        <img
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded border border-gray-300"
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {uploading ? 'Uploading...' : 'Upload Photos'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Photos Grid */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Uploaded Photos ({photos.length})
            </h3>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading photos...</p>
              </div>
            ) : photos.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600">No photos uploaded yet</p>
                <p className="text-sm text-gray-500 mt-1">Upload your first photo above</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Primary Badge */}
                    {photo.is_primary && (
                      <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center z-10">
                        <Star className="w-3 h-3 mr-1 fill-current" />
                        Primary
                      </div>
                    )}

                    {/* Image */}
                    <div className="h-48 bg-gray-100">
                      <img
                        src={normalizePhotoUrl(photo.file_url)}
                        alt={photo.original_filename}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('Image load error for:', photo.file_url);
                          e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiBmaWxsPSIjYWFhIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2UgRXJyb3I8L3RleHQ+PC9zdmc+';
                        }}
                        onLoad={() => {
                          console.log('Image loaded successfully:', photo.file_url);
                        }}
                      />
                    </div>

                    {/* Photo Info & Actions */}
                    <div className="p-3">
                      <p className="text-sm text-gray-900 truncate mb-1" title={photo.original_filename}>
                        {photo.original_filename}
                      </p>
                      <p className="text-xs text-gray-500 mb-3">
                        {formatFileSize(photo.file_size)}
                      </p>

                      <div className="flex items-center gap-2">
                        {!photo.is_primary && (
                          <button
                            onClick={() => handleSetPrimary(photo.id)}
                            className="flex-1 flex items-center justify-center px-2 py-1.5 text-xs bg-yellow-50 text-yellow-700 rounded hover:bg-yellow-100 transition-colors"
                            title="Set as primary photo"
                          >
                            <Star className="w-3 h-3 mr-1" />
                            Set Primary
                          </button>
                        )}
                        
                        <a
                          href={normalizePhotoUrl(photo.file_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="flex items-center justify-center px-2 py-1.5 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                          title="Download photo"
                        >
                          <Download className="w-3 h-3" />
                        </a>
                        
                        <button
                          onClick={() => handleDelete(photo.id)}
                          className="flex items-center justify-center px-2 py-1.5 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors"
                          title="Delete photo"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertyPhotos;

