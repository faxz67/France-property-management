import React, { useState, useEffect } from 'react';
import api from '../api';
import { Upload, X, Download, Trash2, FileText, Edit2, Check } from 'lucide-react';

interface TenantDocument {
  id: number;
  file_url: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  document_type: string;
  created_at: string;
}

interface TenantDocumentsProps {
  tenantId: number;
  tenantName: string;
  onClose: () => void;
}

const TenantDocuments: React.FC<TenantDocumentsProps> = ({ tenantId, tenantName, onClose }) => {
  const [documents, setDocuments] = useState<TenantDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [documentType, setDocumentType] = useState('General');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingType, setEditingType] = useState('');

  const documentTypes = [
    'General',
    'ID Document',
    'Passport',
    'Lease Agreement',
    'Proof of Income',
    'Bank Statement',
    'Reference Letter',
    'Other'
  ];

  useEffect(() => {
    fetchDocuments();
  }, [tenantId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await api.getTenantDocuments(tenantId);
      setDocuments(response.data?.data?.documents || []);
    } catch (err: any) {
      console.error('Error fetching documents:', err);
      setError(err.userMessage || 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFiles(files);
    }
  };

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      setError('Please select at least one document');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      for (let i = 0; i < selectedFiles.length; i++) {
        formData.append('documents', selectedFiles[i]);
      }
      formData.append('document_type', documentType);

      await api.uploadTenantDocuments(tenantId, formData);
      
      // Clear selection
      setSelectedFiles(null);
      setDocumentType('General');
      
      // Refresh documents list
      await fetchDocuments();
      
      // Reset file input
      const fileInput = document.getElementById('document-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err: any) {
      console.error('Error uploading documents:', err);
      setError(err.userMessage || 'Failed to upload documents');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (documentId: number) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      await api.deleteTenantDocument(tenantId, documentId);
      await fetchDocuments();
    } catch (err: any) {
      console.error('Error deleting document:', err);
      setError(err.userMessage || 'Failed to delete document');
    }
  };

  const startEditType = (doc: TenantDocument) => {
    setEditingId(doc.id);
    setEditingType(doc.document_type);
  };

  const saveDocumentType = async (documentId: number) => {
    try {
      await api.updateTenantDocumentType(tenantId, documentId, editingType);
      setEditingId(null);
      setEditingType('');
      await fetchDocuments();
    } catch (err: any) {
      console.error('Error updating document type:', err);
      setError(err.userMessage || 'Failed to update document type');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingType('');
  };

  const clearSelection = () => {
    setSelectedFiles(null);
    const fileInput = document.getElementById('document-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return '🖼️';
    } else if (mimeType === 'application/pdf') {
      return '📄';
    } else if (mimeType.includes('word')) {
      return '📝';
    } else if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
      return '📊';
    } else {
      return '📎';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Tenant Documents</h2>
            <p className="text-sm text-gray-600 mt-1">{tenantName}</p>
          </div>
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
            <h3 className="text-lg font-medium text-gray-900 mb-4">Upload New Documents</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="document-upload"
                    className="flex items-center justify-center w-full px-4 py-3 border border-gray-300 rounded-lg cursor-pointer bg-white hover:bg-gray-100 transition-colors"
                  >
                    <Upload className="w-5 h-5 mr-2 text-gray-600" />
                    <span className="text-gray-700">Choose Files</span>
                    <input
                      id="document-upload"
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                    />
                  </label>
                </div>

                <div>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {documentTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Selected files list */}
              {selectedFiles && selectedFiles.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      {selectedFiles.length} file(s) selected
                    </p>
                    <button
                      onClick={clearSelection}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Clear Selection
                    </button>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-3 max-h-32 overflow-y-auto">
                    {Array.from(selectedFiles).map((file, index) => (
                      <div key={index} className="flex items-center justify-between py-1 text-sm">
                        <span className="text-gray-700 truncate flex-1">{file.name}</span>
                        <span className="text-gray-500 ml-2">{formatFileSize(file.size)}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {uploading ? 'Uploading...' : 'Upload Documents'}
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

          {/* Documents List */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Uploaded Documents ({documents.length})
            </h3>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading documents...</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <FileText className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600">No documents uploaded yet</p>
                <p className="text-sm text-gray-500 mt-1">Upload your first document above</p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="text-3xl mr-3">{getFileIcon(doc.mime_type)}</div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate" title={doc.original_filename}>
                          {doc.original_filename}
                        </p>
                        
                        <div className="flex items-center gap-3 mt-1">
                          {editingId === doc.id ? (
                            <div className="flex items-center gap-2">
                              <select
                                value={editingType}
                                onChange={(e) => setEditingType(e.target.value)}
                                className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                {documentTypes.map((type) => (
                                  <option key={type} value={type}>
                                    {type}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => saveDocumentType(doc.id)}
                                className="text-green-600 hover:text-green-800"
                                title="Save"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="text-gray-600 hover:text-gray-800"
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                {doc.document_type}
                              </span>
                              <button
                                onClick={() => startEditType(doc)}
                                className="text-gray-400 hover:text-gray-600"
                                title="Edit type"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </>
                          )}
                          <span className="text-xs text-gray-500">
                            {formatFileSize(doc.file_size)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="flex items-center justify-center px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="flex items-center justify-center px-3 py-2 text-sm bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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

export default TenantDocuments;

