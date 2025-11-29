const { TenantDocument, Tenant } = require('../models');
const { deleteFile, getFileUrl } = require('../utils/fileUpload');
const path = require('path');

/**
 * Upload tenant documents
 * POST /api/tenants/:tenantId/documents
 */
const uploadTenantDocuments = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const adminId = req.admin.id;
    const { document_type } = req.body;

    // Verify tenant exists and belongs to admin
    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }

    // Check ownership
    if (tenant.admin_id !== adminId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only upload documents for your own tenants.'
      });
    }

    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }

    // Create document records for each uploaded file
    const documentRecords = await Promise.all(
      req.files.map(async (file) => {
        const relativePath = path.relative(
          path.join(__dirname, '..'),
          file.path
        );

        return await TenantDocument.create({
          admin_id: adminId,
          tenant_id: tenantId,
          file_path: relativePath,
          file_url: getFileUrl(relativePath, req),
          original_filename: file.originalname,
          file_size: file.size,
          mime_type: file.mimetype,
          document_type: document_type || 'General'
        });
      })
    );

    res.status(201).json({
      success: true,
      message: `${documentRecords.length} document(s) uploaded successfully`,
      data: {
        documents: documentRecords
      }
    });
  } catch (error) {
    console.error('Upload tenant documents error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload documents'
    });
  }
};

/**
 * Get all documents for a tenant
 * GET /api/tenants/:tenantId/documents
 */
const getTenantDocuments = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const adminId = req.admin.id;

    // Verify tenant exists and belongs to admin
    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }

    // Check ownership
    if (tenant.admin_id !== adminId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only view documents of your own tenants.'
      });
    }

    // Fetch documents
    const documents = await TenantDocument.findAll({
      where: { tenant_id: tenantId },
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        documents
      }
    });
  } catch (error) {
    console.error('Get tenant documents error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch documents'
    });
  }
};

/**
 * Delete a tenant document
 * DELETE /api/tenants/:tenantId/documents/:documentId
 */
const deleteTenantDocument = async (req, res) => {
  try {
    const { tenantId, documentId } = req.params;
    const adminId = req.admin.id;

    // Find the document
    const document = await TenantDocument.findByPk(documentId, {
      include: [{
        model: Tenant,
        as: 'tenant'
      }]
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // Check ownership
    if (document.admin_id !== adminId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only delete your own documents.'
      });
    }

    // Verify the document belongs to the specified tenant
    if (document.tenant_id !== parseInt(tenantId)) {
      return res.status(400).json({
        success: false,
        error: 'Document does not belong to this tenant'
      });
    }

    // Delete the file from filesystem
    deleteFile(document.file_path);

    // Delete the database record
    await document.destroy();

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Delete tenant document error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete document'
    });
  }
};

/**
 * Update document type
 * PUT /api/tenants/:tenantId/documents/:documentId
 */
const updateDocumentType = async (req, res) => {
  try {
    const { tenantId, documentId } = req.params;
    const { document_type } = req.body;
    const adminId = req.admin.id;

    if (!document_type) {
      return res.status(400).json({
        success: false,
        error: 'Document type is required'
      });
    }

    // Find the document
    const document = await TenantDocument.findByPk(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // Check ownership
    if (document.admin_id !== adminId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Verify the document belongs to the specified tenant
    if (document.tenant_id !== parseInt(tenantId)) {
      return res.status(400).json({
        success: false,
        error: 'Document does not belong to this tenant'
      });
    }

    // Update document type
    await document.update({ document_type });

    res.json({
      success: true,
      message: 'Document type updated successfully',
      data: { document }
    });
  } catch (error) {
    console.error('Update document type error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update document type'
    });
  }
};

module.exports = {
  uploadTenantDocuments,
  getTenantDocuments,
  deleteTenantDocument,
  updateDocumentType
};

