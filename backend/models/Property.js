const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Property = sequelize.define('Property', {
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
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [3, 255]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 2000]
    }
  },
  address: {
    type: DataTypes.STRING(500),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [5, 500]
    }
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  state: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      len: [2, 100]
    }
  },
  postal_code: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      len: [3, 20]
    }
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  property_type: {
    type: DataTypes.ENUM('APARTMENT', 'HOUSE', 'CONDO', 'STUDIO', 'OTHER'),
    allowNull: false,
    defaultValue: 'APARTMENT',
    validate: {
      isIn: [['APARTMENT', 'HOUSE', 'CONDO', 'STUDIO', 'OTHER']]
    }
  },
  monthly_rent: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 1000000
    }
  },
  photo: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  number_of_halls: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { min: 0 }
  },
  number_of_kitchens: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { min: 0 }
  },
  number_of_bathrooms: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { min: 0 }
  },
  number_of_parking_spaces: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { min: 0 }
  },
  number_of_rooms: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { min: 0 }
  },
  number_of_gardens: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { min: 0 }
  }
}, {
  tableName: 'properties',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['admin_id']
    },
    {
      fields: ['property_type']
    },
    {
      fields: ['city', 'country']
    }
  ]
});

// Class methods
Property.findByAdminId = function(adminId, options = {}) {
  return this.findAll({
    where: { admin_id: adminId },
    ...options
  });
};

Property.findByIdAndAdminId = function(id, adminId, options = {}) {
  return this.findOne({
    where: { 
      id, 
      admin_id: adminId 
    },
    ...options
  });
};

module.exports = Property;
