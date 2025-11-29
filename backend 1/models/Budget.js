const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Budget = sequelize.define('Budget', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  property_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'properties', key: 'id' },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  month: {
    type: DataTypes.STRING(7), // YYYY-MM
    allowNull: false,
    validate: { is: /^\d{4}-\d{2}$/ }
  },
  budgeted_income: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0
  },
  budgeted_expenses: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'budgets',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['property_id'] },
    { fields: ['month'] },
    { unique: true, fields: ['property_id', 'month'] }
  ]
});

module.exports = Budget;


