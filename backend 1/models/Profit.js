const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Profit = sequelize.define('Profit', {
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
  total_profit: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  last_updated: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'profits',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['admin_id']
    },
    {
      unique: true,
      fields: ['admin_id']
    }
  ]
});

// Class methods
Profit.findByAdminId = function(adminId) {
  return this.findOne({
    where: { admin_id: adminId }
  });
};

Profit.incrementProfit = async function(adminId, amount) {
  const profit = await this.findByAdminId(adminId);
  
  if (profit) {
    profit.total_profit = parseFloat(profit.total_profit) + parseFloat(amount);
    profit.last_updated = new Date();
    await profit.save();
    return profit;
  } else {
    return await this.create({
      admin_id: adminId,
      total_profit: parseFloat(amount),
      last_updated: new Date()
    });
  }
};

Profit.getTotalProfit = async function(adminId) {
  const profit = await this.findByAdminId(adminId);
  return profit ? parseFloat(profit.total_profit) : 0;
};

module.exports = Profit;

