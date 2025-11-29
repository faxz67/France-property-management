/**
 * File Upload Security Utility
 * 
 * Prevents upload of malicious files
 * Validates file types, sizes, and content
 */

const path = require('path');
const fs = require('fs');

// Allowed MIME types
const ALLOWED_MIME_TYPES = {
  images: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
};

// Allowed file extensions
const ALLOWED_EXTENSIONS = {
  images: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  documents: ['.pdf', '.doc', '.docx', '.xls', '.xlsx']
};

// Maximum file sizes (in bytes)
const MAX_FILE_SIZES = {
  image: 10 * 1024 * 1024, // 10MB
  document: 20 * 1024 * 1024 // 20MB
};

/**
 * Validate file upload
 */
function validateFileUpload(file, type = 'image') {
  const errors = [];

  // Check if file exists
  if (!file) {
    errors.push('No file provided');
    return { valid: false, errors };
  }

  // Validate file size
  const maxSize = type === 'image' ? MAX_FILE_SIZES.image : MAX_FILE_SIZES.document;
  if (file.size > maxSize) {
    errors.push(`File size exceeds maximum allowed (${maxSize / 1024 / 1024}MB)`);
  }

  // Validate MIME type
  const allowedMimes = type === 'image' ? ALLOWED_MIME_TYPES.images : ALLOWED_MIME_TYPES.documents;
  if (!allowedMimes.includes(file.mimetype)) {
    errors.push(`Invalid file type. Allowed types: ${allowedMimes.join(', ')}`);
  }

  // Validate file extension
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = type === 'image' ? ALLOWED_EXTENSIONS.images : ALLOWED_EXTENSIONS.documents;
  if (!allowedExts.includes(ext)) {
    errors.push(`Invalid file extension. Allowed extensions: ${allowedExts.join(', ')}`);
  }

  // Validate filename (prevent directory traversal)
  const filename = path.basename(file.originalname);
  if (filename !== file.originalname || filename.includes('..')) {
    errors.push('Invalid filename');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Secure multer file filter
 */
function createSecureFileFilter(type = 'image') {
  return (req, file, cb) => {
    const validation = validateFileUpload(file, type);
    
    if (!validation.valid) {
      cb(new Error(validation.errors.join(', ')), false);
      return;
    }
    
    cb(null, true);
  };
}

/**
 * Generate secure filename
 */
function generateSecureFilename(originalFilename) {
  const ext = path.extname(originalFilename).toLowerCase();
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomString}${ext}`;
}

/**
 * Scan file for malicious content (basic check)
 */
async function scanFileContent(filePath) {
  try {
    // Read first 512 bytes to check for executable signatures
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(512);
    fs.readSync(fd, buffer, 0, 512, 0);
    fs.closeSync(fd);

    // Check for common executable signatures
    const signatures = [
      Buffer.from([0x4D, 0x5A]), // EXE
      Buffer.from([0x7F, 0x45, 0x4C, 0x46]), // ELF
      Buffer.from([0xCA, 0xFE, 0xBA, 0xBE]), // Mach-O
      Buffer.from([0x25, 0x50, 0x44, 0x46]) // PDF (needs further validation)
    ];

    for (const sig of signatures) {
      if (buffer.slice(0, sig.length).equals(sig)) {
        // For PDF, allow it (it's in our whitelist)
        if (sig[0] === 0x25 && sig[1] === 0x50) {
          continue;
        }
        return { safe: false, reason: 'Executable file detected' };
      }
    }

    return { safe: true };
  } catch (error) {
    return { safe: false, reason: 'Unable to scan file' };
  }
}

module.exports = {
  validateFileUpload,
  createSecureFileFilter,
  generateSecureFilename,
  scanFileContent,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZES
};

