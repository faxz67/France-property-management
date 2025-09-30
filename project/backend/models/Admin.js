const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const Admin = sequelize.define('Admin', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
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
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [6, 255]
    }
  },
  role: {
    type: DataTypes.ENUM('ADMIN', 'SUPER_ADMIN'),
    allowNull: false,
    defaultValue: 'ADMIN',
    validate: {
      isIn: [['ADMIN', 'SUPER_ADMIN']]
    }
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
    allowNull: false,
    defaultValue: 'ACTIVE',
    validate: {
      isIn: [['ACTIVE', 'INACTIVE']]
    }
  }
}, {
  tableName: 'admins',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeCreate: async (admin) => {
      if (admin.password) {
        admin.password = await bcrypt.hash(admin.password, 12);
      }
    },
    beforeUpdate: async (admin) => {
      if (admin.changed('password')) {
        admin.password = await bcrypt.hash(admin.password, 12);
      }
    }
  }
});

// Instance methods
Admin.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

Admin.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.password;
  return values;
};

// Class methods
Admin.findByEmail = function(email) {
  return this.findOne({ where: { email } });
};

Admin.findActiveByEmail = function(email) {
  return this.findOne({ 
    where: { 
      email, 
      status: 'ACTIVE' 
    } 
  });
};

module.exports = Admin;
