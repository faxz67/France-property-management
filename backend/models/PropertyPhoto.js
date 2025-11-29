const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PropertyPhoto = sequelize.define('PropertyPhoto', {
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
  property_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'properties',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  file_path: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: 'Relative path from uploads root, e.g., /1/properties/5/photo.jpg'
  },
  file_url: {
    type: DataTypes.STRING(1000),
    allowNull: false,
    comment: 'Full URL to access the photo'
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
  is_primary: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Whether this is the primary photo for the property'
  }
}, {
  tableName: 'property_photos',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['admin_id']
    },
    {
      fields: ['property_id']
    },
    {
      fields: ['is_primary']
    }
  ]
});

// Class methods
PropertyPhoto.findByPropertyId = function(propertyId, options = {}) {
  return this.findAll({
    where: { property_id: propertyId },
    order: [['is_primary', 'DESC'], ['created_at', 'DESC']],
    ...options
  });
};

PropertyPhoto.findByAdminId = function(adminId, options = {}) {
  return this.findAll({
    where: { admin_id: adminId },
    ...options
  });
};

module.exports = PropertyPhoto;

