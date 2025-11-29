const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TenantDocument = sequelize.define('TenantDocument', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  admin_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'admins',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tenants',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  file_path: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: 'Relative path from uploads root, e.g., /1/tenants/3/document.pdf'
  },
  file_url: {
    type: DataTypes.STRING(1000),
    allowNull: false,
    comment: 'Full URL to access the document'
  },
  original_filename: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Original filename from upload'
  },
  file_size: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'File size in bytes'
  },
  mime_type: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'MIME type of the file'
  },
  document_type: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Type of document (e.g., ID, Lease, Contract)'
  }
}, {
  tableName: 'tenant_documents',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['admin_id']
    },
    {
      fields: ['tenant_id']
    },
    {
      fields: ['document_type']
    }
  ]
});

// Class methods
TenantDocument.findByTenantId = function(tenantId, options = {}) {
  return this.findAll({
    where: { tenant_id: tenantId },
    order: [['created_at', 'DESC']],
    ...options
  });
};

TenantDocument.findByAdminId = function(adminId, options = {}) {
  return this.findAll({
    where: { admin_id: adminId },
    ...options
  });
};

module.exports = TenantDocument;

