const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Session = sequelize.define('Session', {
  sid: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  sess: {
    type: DataTypes.JSON,
    allowNull: false
  },
  expire: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'sessions',
  timestamps: false,
  indexes: [
    {
      fields: ['expire']
    }
  ]
});

module.exports = Session;
