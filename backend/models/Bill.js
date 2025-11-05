const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Bill = sequelize.define('Bill', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
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
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0,
      max: 1000000
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
  charges: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 1000000
    }
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 1000000
    }
  },
  month: {
    type: DataTypes.STRING(7), // Format: YYYY-MM
    allowNull: false,
    validate: {
      is: /^\d{4}-\d{2}$/
    }
  },
  due_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      isDate: true
    }
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'PAID', 'OVERDUE', 'RECEIPT_SENT'),
    allowNull: false,
    defaultValue: 'PENDING',
    validate: {
      isIn: [['PENDING', 'PAID', 'OVERDUE', 'RECEIPT_SENT']]
    }
  },
  payment_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    validate: {
      isDate: true
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: 'Monthly rent payment'
  },
  bill_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      isDate: true
    }
  },
  language: {
    type: DataTypes.ENUM('en', 'fr'),
    allowNull: false,
    defaultValue: 'fr',
    validate: {
      isIn: [['en', 'fr']]
    }
  },
  pdf_path: {
    type: DataTypes.STRING(500),
    allowNull: true
  }
}, {
  tableName: 'bills',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['tenant_id']
    },
    {
      fields: ['property_id']
    },
    {
      fields: ['admin_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['due_date']
    },
    {
      fields: ['month']
    },
    {
      unique: true,
      fields: ['tenant_id', 'month']
    }
  ]
});

// Class methods
Bill.findByAdminId = function(adminId, options = {}) {
  return this.findAll({
    where: { admin_id: adminId },
    ...options
  });
};

Bill.findByTenantId = function(tenantId, options = {}) {
  return this.findAll({
    where: { tenant_id: tenantId },
    ...options
  });
};

Bill.findByPropertyId = function(propertyId, options = {}) {
  return this.findAll({
    where: { property_id: propertyId },
    ...options
  });
};

Bill.findPendingBills = function(adminId, options = {}) {
  return this.findAll({
    where: { 
      admin_id: adminId,
      status: 'PENDING'
    },
    ...options
  });
};

Bill.findOverdueBills = function(adminId, options = {}) {
  const today = new Date().toISOString().split('T')[0];
  return this.findAll({
    where: { 
      admin_id: adminId,
      status: 'OVERDUE',
      due_date: {
        [sequelize.Sequelize.Op.lt]: today
      }
    },
    ...options
  });
};

// Instance methods
Bill.prototype.markAsReceiptSent = function() {
  this.status = 'RECEIPT_SENT';
  return this.save();
};

Bill.prototype.markAsPaid = function() {
  this.status = 'PAID';
  return this.save();
};

Bill.prototype.markAsOverdue = function() {
  this.status = 'OVERDUE';
  return this.save();
};

module.exports = Bill;
