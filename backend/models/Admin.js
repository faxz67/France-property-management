const Sequelize = require('sequelize');
const { sequelize } = require('../config/database');
const { DataTypes } = Sequelize;
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
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'admins',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    comment: 'ID of the admin who created this admin (NULL for bootstrap/system admins)'
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
  if (!this.password) return false;

  // First try bcrypt compare (expected path)
  try {
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    if (isMatch) return true;
  } catch (_) {
    // ignore and attempt fallback below
  }

  // Fallback: if legacy records stored plaintext passwords, accept once and rehash
  if (candidatePassword === this.password) {
    this.password = await bcrypt.hash(candidatePassword, 12);
    await this.save();
    return true;
  }

  return false;
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
  // Case-insensitive email lookup to avoid casing mismatches
  // Using Sequelize.where with LOWER for MariaDB compatibility
  return this.findOne({ 
    where: { 
      email: Sequelize.where(
        Sequelize.fn('LOWER', Sequelize.col('email')),
        email.toLowerCase()
      ),
      status: 'ACTIVE'
    },
    raw: false // Ensure we get a model instance (not raw data) for methods to work
  });
};

// Class method to find admins created by a specific admin (with isolation)
Admin.findByCreator = function(creatorId, options = {}) {
  return this.findAll({
    where: {
      created_by: creatorId,
      ...options.where
    },
    attributes: { exclude: ['password'] },
    ...options
  });
};

// Class method to check if admin can access another admin
Admin.canAccess = async function(currentAdminId, targetAdminId) {
  const currentAdmin = await this.findByPk(currentAdminId);
  
  if (!currentAdmin) {
    return false;
  }
  
  // If trying to access self, always allowed
  if (currentAdminId === targetAdminId) {
    return true;
  }
  
  const targetAdmin = await this.findByPk(targetAdminId);
  
  if (!targetAdmin) {
    return false;
  }
  
  // Super admins can only access admins they created (complete isolation)
  // Each SUPER_ADMIN is completely isolated and cannot see other SUPER_ADMIN's admins
  if (currentAdmin.role === 'SUPER_ADMIN') {
    return targetAdmin.created_by === currentAdminId;
  }
  
  // Regular admins cannot access other admins
  return false;
};

module.exports = Admin;
