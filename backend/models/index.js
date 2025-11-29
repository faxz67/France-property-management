const { sequelize } = require('../config/database');

// Import models after sequelize is initialized
const Admin = require('./Admin');
const Property = require('./Property');
const Tenant = require('./Tenant');
const Bill = require('./Bill');
const Receipt = require('./Receipt');
const Budget = require('./Budget');
const Expense = require('./Expense');
const Profit = require('./Profit');
const PropertyPhoto = require('./PropertyPhoto');
const TenantDocument = require('./TenantDocument');
const Session = require('./Session');

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

// Bill associations
Admin.hasMany(Bill, {
  foreignKey: 'admin_id',
  as: 'bills',
  onDelete: 'CASCADE'
});

Bill.belongsTo(Admin, {
  foreignKey: 'admin_id',
  as: 'admin'
});

Tenant.hasMany(Bill, {
  foreignKey: 'tenant_id',
  as: 'bills',
  onDelete: 'CASCADE'
});

Bill.belongsTo(Tenant, {
  foreignKey: 'tenant_id',
  as: 'tenant'
});

Property.hasMany(Bill, {
  foreignKey: 'property_id',
  as: 'bills',
  onDelete: 'CASCADE'
});

Bill.belongsTo(Property, {
  foreignKey: 'property_id',
  as: 'property'
});

// Receipt associations
Admin.hasMany(Receipt, {
  foreignKey: 'admin_id',
  as: 'receipts',
  onDelete: 'CASCADE'
});

Receipt.belongsTo(Admin, {
  foreignKey: 'admin_id',
  as: 'admin'
});

Tenant.hasMany(Receipt, {
  foreignKey: 'tenant_id',
  as: 'receipts',
  onDelete: 'CASCADE'
});

Receipt.belongsTo(Tenant, {
  foreignKey: 'tenant_id',
  as: 'tenant'
});

Bill.hasMany(Receipt, {
  foreignKey: 'bill_id',
  as: 'receipts',
  onDelete: 'CASCADE'
});

Receipt.belongsTo(Bill, {
  foreignKey: 'bill_id',
  as: 'bill'
});

// Budget associations
Property.hasMany(Budget, {
  foreignKey: 'property_id',
  as: 'budgets',
  onDelete: 'CASCADE'
});

Budget.belongsTo(Property, {
  foreignKey: 'property_id',
  as: 'property'
});

// Expense associations
Admin.hasMany(Expense, {
  foreignKey: 'admin_id',
  as: 'expenses',
  onDelete: 'CASCADE'
});

Expense.belongsTo(Admin, {
  foreignKey: 'admin_id',
  as: 'admin'
});

Property.hasMany(Expense, {
  foreignKey: 'property_id',
  as: 'expenses',
  onDelete: 'CASCADE'
});

Expense.belongsTo(Property, {
  foreignKey: 'property_id',
  as: 'property'
});

// Profit associations
Admin.hasOne(Profit, {
  foreignKey: 'admin_id',
  as: 'profit',
  onDelete: 'CASCADE'
});

Profit.belongsTo(Admin, {
  foreignKey: 'admin_id',
  as: 'admin'
});

// PropertyPhoto associations
Admin.hasMany(PropertyPhoto, {
  foreignKey: 'admin_id',
  as: 'property_photos',
  onDelete: 'CASCADE'
});

PropertyPhoto.belongsTo(Admin, {
  foreignKey: 'admin_id',
  as: 'admin'
});

Property.hasMany(PropertyPhoto, {
  foreignKey: 'property_id',
  as: 'photos',
  onDelete: 'CASCADE'
});

PropertyPhoto.belongsTo(Property, {
  foreignKey: 'property_id',
  as: 'property'
});

// TenantDocument associations
Admin.hasMany(TenantDocument, {
  foreignKey: 'admin_id',
  as: 'tenant_documents',
  onDelete: 'CASCADE'
});

TenantDocument.belongsTo(Admin, {
  foreignKey: 'admin_id',
  as: 'admin'
});

Tenant.hasMany(TenantDocument, {
  foreignKey: 'tenant_id',
  as: 'documents',
  onDelete: 'CASCADE'
});

TenantDocument.belongsTo(Tenant, {
  foreignKey: 'tenant_id',
  as: 'tenant'
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
    // For MariaDB, disable foreign key checks during sync
    if (sequelize.getDialect() === 'mariadb') {
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
    }
    
    // Use alter: false to prevent automatic schema modifications
    // This avoids the "Cannot delete property 'meta'" error with MariaDB
    await sequelize.sync({ force, alter: false });
    
    // Re-enable foreign key checks
    if (sequelize.getDialect() === 'mariadb') {
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
    }
    
    console.log('✅ Database synchronized successfully.');
  } catch (error) {
    console.error('❌ Error synchronizing database:', error);
    // Don't exit on sync errors, just log them
    console.log('⚠️  Continuing with existing database structure...');
    
    // Try to re-enable foreign key checks even if sync failed
    try {
      if (sequelize.getDialect() === 'mariadb') {
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
      }
    } catch (fkError) {
      console.log('⚠️  Could not re-enable foreign key checks, but continuing...');
    }
  }
};

module.exports = {
  sequelize,
  Admin,
  Property,
  Tenant,
  Bill,
  Receipt,
  Budget,
  Expense,
  Profit,
  PropertyPhoto,
  TenantDocument,
  Session,
  testConnection,
  syncDatabase
};
