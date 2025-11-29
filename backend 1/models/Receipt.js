const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Receipt = sequelize.define('Receipt', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  bill_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'bills',
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
  sent_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  sent_to_tenant: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  sent_to_admin: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  sent_to_owner: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  tenant_email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  admin_email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  owner_email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  pdf_path: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('SENT', 'FAILED', 'PENDING'),
    allowNull: false,
    defaultValue: 'PENDING',
    validate: {
      isIn: [['SENT', 'FAILED', 'PENDING']]
    }
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'receipts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['bill_id']
    },
    {
      fields: ['tenant_id']
    },
    {
      fields: ['admin_id']
    },
    {
      fields: ['sent_date']
    },
    {
      fields: ['status']
    }
  ]
});

// Class methods
Receipt.findByAdminId = function(adminId, options = {}) {
  return this.findAll({
    where: { admin_id: adminId },
    ...options
  });
};

Receipt.findByTenantId = function(tenantId, options = {}) {
  return this.findAll({
    where: { tenant_id: tenantId },
    ...options
  });
};

Receipt.findByBillId = function(billId, options = {}) {
  return this.findAll({
    where: { bill_id: billId },
    ...options
  });
};

Receipt.findSentReceipts = function(adminId, options = {}) {
  return this.findAll({
    where: { 
      admin_id: adminId,
      status: 'SENT'
    },
    ...options
  });
};

Receipt.findFailedReceipts = function(adminId, options = {}) {
  return this.findAll({
    where: { 
      admin_id: adminId,
      status: 'FAILED'
    },
    ...options
  });
};

// Instance methods
Receipt.prototype.markAsSent = function() {
  this.status = 'SENT';
  return this.save();
};

Receipt.prototype.markAsFailed = function(errorMessage) {
  this.status = 'FAILED';
  this.error_message = errorMessage;
  return this.save();
};

module.exports = Receipt;
