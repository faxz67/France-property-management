const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Tenant = sequelize.define('Tenant', {
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
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 255]
    }
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING(50),
    allowNull: true,
    validate: {
      len: [10, 50]
    }
  },
  lease_start: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    validate: {
      isDate: true
    }
  },
  lease_end: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    validate: {
      isDate: true,
      isAfterStartDate(value) {
        if (this.lease_start && value && new Date(value) <= new Date(this.lease_start)) {
          throw new Error('Lease end date must be after lease start date');
        }
      }
    }
  },
  rent_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 1000000
    }
  },
  join_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    validate: {
      isDate: true
    }
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'EXPIRED'),
    allowNull: false,
    defaultValue: 'ACTIVE',
    validate: {
      isIn: [['ACTIVE', 'INACTIVE', 'EXPIRED']]
    }
  }
}, {
  tableName: 'tenants',
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
      fields: ['status']
    },
    {
      fields: ['lease_start', 'lease_end']
    }
  ]
});

// Class methods
Tenant.findByAdminId = function(adminId, options = {}) {
  return this.findAll({
    where: { admin_id: adminId },
    ...options
  });
};

Tenant.findByIdAndAdminId = function(id, adminId, options = {}) {
  return this.findOne({
    where: { 
      id, 
      admin_id: adminId 
    },
    ...options
  });
};

Tenant.findByPropertyId = function(propertyId, options = {}) {
  return this.findAll({
    where: { property_id: propertyId },
    ...options
  });
};

module.exports = Tenant;
