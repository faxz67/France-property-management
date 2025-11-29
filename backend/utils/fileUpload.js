const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Ensure directory exists, create if it doesn't
 * @param {string} dirPath - Directory path to ensure exists
 */
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

/**
 * Get upload directory path for property photos
 * @param {number} adminId - Admin ID
 * @param {number} propertyId - Property ID
 * @returns {string} Upload directory path
 */
const getPropertyPhotoPath = (adminId, propertyId) => {
  return path.join('public', 'uploads', adminId.toString(), 'properties', propertyId.toString());
};

/**
 * Get upload directory path for tenant documents
 * @param {number} adminId - Admin ID
 * @param {number} tenantId - Tenant ID
 * @returns {string} Upload directory path
 */
const getTenantDocumentPath = (adminId, tenantId) => {
  return path.join('public', 'uploads', adminId.toString(), 'tenants', tenantId.toString());
};

/**
 * Get upload directory path for admin signature image
 * @param {number} adminId - Admin ID
 * @returns {string} Upload directory path
 */
const getAdminSignaturePath = (adminId) => {
  return path.join('public', 'uploads', adminId.toString(), 'signature');
};

/**
 * Configure multer storage for property photos
 */
const propertyPhotoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const adminId = req.admin.id;
    const propertyId = req.params.propertyId;
    
    if (!propertyId) {
      return cb(new Error('Property ID is required'));
    }
    
    const uploadPath = getPropertyPhotoPath(adminId, propertyId);
    const fullPath = path.join(__dirname, '..', uploadPath);
    
    try {
      ensureDirectoryExists(fullPath);
      cb(null, fullPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const sanitizedName = file.originalname
      .replace(ext, '')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 50);
    cb(null, `${sanitizedName}-${uniqueSuffix}${ext}`);
  }
});

/**
 * Configure multer storage for tenant documents
 */
const tenantDocumentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const adminId = req.admin.id;
    const tenantId = req.params.tenantId;
    
    if (!tenantId) {
      return cb(new Error('Tenant ID is required'));
    }
    
    const uploadPath = getTenantDocumentPath(adminId, tenantId);
    const fullPath = path.join(__dirname, '..', uploadPath);
    
    try {
      ensureDirectoryExists(fullPath);
      cb(null, fullPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const sanitizedName = file.originalname
      .replace(ext, '')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 50);
    cb(null, `${sanitizedName}-${uniqueSuffix}${ext}`);
  }
});

/**
 * Configure multer storage for admin signature
 */
const adminSignatureStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      // Verify req.admin is available (set by verifyToken middleware)
      if (!req.admin || !req.admin.id) {
        return cb(new Error('Admin authentication required. Please ensure verifyToken middleware runs before multer.'));
      }

      const adminId = req.admin.id;
      const uploadPath = getAdminSignaturePath(adminId);
      const fullPath = path.join(__dirname, '..', uploadPath);

      ensureDirectoryExists(fullPath);
      cb(null, fullPath);
    } catch (error) {
      console.error('Error in adminSignatureStorage destination:', error);
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const sanitizedName = file.originalname
      .replace(ext, '')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 50);
    cb(null, `${sanitizedName}-${uniqueSuffix}${ext}`);
  }
});

/**
 * File filter for images only
 */
const imageFileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'), false);
  }
};

/**
 * File filter for documents (images + PDFs + common document types)
 */
const documentFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg', 
    'image/jpg', 
    'image/png', 
    'image/gif', 
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed. Allowed types: images, PDF, Word, Excel, text files'), false);
  }
};

/**
 * Multer upload middleware for property photos
 */
const uploadPropertyPhotos = multer({
  storage: propertyPhotoStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 10 // Maximum 10 files at once
  }
});

/**
 * Multer upload middleware for tenant documents
 */
const uploadTenantDocuments = multer({
  storage: tenantDocumentStorage,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB per file
    files: 10 // Maximum 10 files at once
  }
});

/**
 * Multer upload middleware for admin signature images
 */
const uploadAdminSignature = multer({
  storage: adminSignatureStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
    files: 1
  }
});

/**
 * Delete a file from the filesystem
 * @param {string} filePath - Relative file path from backend root
 * @returns {boolean} Success status
 */
const deleteFile = (filePath) => {
  try {
    const fullPath = path.join(__dirname, '..', filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

/**
 * Get file URL from file path
 * @param {string} filePath - Relative file path
 * @param {object} req - Express request object
 * @returns {string} Full file URL
 */
const getFileUrl = (filePath, req) => {
  // Get origin from request or environment variable
  const origin = process.env.BACKEND_ORIGIN || 
                 (req ? `${req.protocol}://${req.get('host')}` : 'http://localhost:4002');
  
  // Normalize path separators to forward slashes
  let urlPath = filePath.replace(/\\/g, '/');
  
  // Remove 'public/' prefix if present, as Express serves from public directory
  urlPath = urlPath.replace(/^public[\\/]/, '');
  
  // Remove any leading slashes
  urlPath = urlPath.replace(/^\/+/, '');
  
  // If the path already starts with 'uploads/', use it as is
  // Otherwise, add 'uploads/' prefix
  if (!urlPath.startsWith('uploads/')) {
    // Extract just the filename if path contains 'uploads'
    if (urlPath.includes('uploads/')) {
      urlPath = urlPath.split('uploads/')[1];
    }
    // Ensure we have the uploads prefix
    urlPath = `uploads/${urlPath}`;
  }
  
  // Construct final URL
  const finalUrl = `${origin}/${urlPath}`;
  
  console.log(`🔧 getFileUrl: "${filePath}" => "${finalUrl}"`);
  
  return finalUrl;
};

module.exports = {
  ensureDirectoryExists,
  getPropertyPhotoPath,
  getTenantDocumentPath,
  getAdminSignaturePath,
  uploadPropertyPhotos,
  uploadTenantDocuments,
  uploadAdminSignature,
  deleteFile,
  getFileUrl
};

