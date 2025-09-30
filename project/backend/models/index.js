const { sequelize } = require('../config/database');
const Admin = require('./Admin');
const Property = require('./Property');
const Tenant = require('./Tenant');

// Define associations
Admin.hasMany(Property, {
  foreignKey: 'admin_id',
  as: 'properties',
  onDelete: 'CASCADE'
});

Property.belongsTo(Admin, {
  foreignKey: 'admin_id',
  as: 'admin'
});

Admin.hasMany(Tenant, {
  foreignKey: 'admin_id',
  as: 'tenants',
  onDelete: 'CASCADE'
});

Tenant.belongsTo(Admin, {
  foreignKey: 'admin_id',
  as: 'admin'
});

Property.hasMany(Tenant, {
  foreignKey: 'property_id',
  as: 'tenants',
  onDelete: 'CASCADE'
});

Tenant.belongsTo(Property, {
  foreignKey: 'property_id',
  as: 'property'
});

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    process.exit(1);
  }
};

// Sync database (create tables if they don't exist)
const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force });
    console.log('✅ Database synchronized successfully.');
  } catch (error) {
    console.error('❌ Error synchronizing database:', error);
    process.exit(1);
  }
};

module.exports = {
  sequelize,
  Admin,
  Property,
  Tenant,
  testConnection,
  syncDatabase
};
