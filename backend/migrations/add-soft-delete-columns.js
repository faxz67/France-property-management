/**
 * Migration script to add deleted_at columns for soft delete functionality
 * Run this script to enable soft delete on existing tables
 */

const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

async function addSoftDeleteColumns() {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('🔄 Adding deleted_at columns to tables...');
    
    // Add deleted_at to tenants table
    await sequelize.query(`
      ALTER TABLE tenants 
      ADD COLUMN IF NOT EXISTS deleted_at DATETIME NULL DEFAULT NULL
    `, { type: QueryTypes.RAW, transaction });
    console.log('✅ Added deleted_at to tenants table');
    
    // Add deleted_at to properties table
    await sequelize.query(`
      ALTER TABLE properties 
      ADD COLUMN IF NOT EXISTS deleted_at DATETIME NULL DEFAULT NULL
    `, { type: QueryTypes.RAW, transaction });
    console.log('✅ Added deleted_at to properties table');
    
    // Add deleted_at to bills table
    await sequelize.query(`
      ALTER TABLE bills 
      ADD COLUMN IF NOT EXISTS deleted_at DATETIME NULL DEFAULT NULL
    `, { type: QueryTypes.RAW, transaction });
    console.log('✅ Added deleted_at to bills table');
    
    // Add deleted_at to expenses table
    await sequelize.query(`
      ALTER TABLE expenses 
      ADD COLUMN IF NOT EXISTS deleted_at DATETIME NULL DEFAULT NULL
    `, { type: QueryTypes.RAW, transaction });
    console.log('✅ Added deleted_at to expenses table');
    
    // Add deleted_at to property_photos table
    await sequelize.query(`
      ALTER TABLE property_photos 
      ADD COLUMN IF NOT EXISTS deleted_at DATETIME NULL DEFAULT NULL
    `, { type: QueryTypes.RAW, transaction });
    console.log('✅ Added deleted_at to property_photos table');
    
    // Add deleted_at to tenant_documents table
    await sequelize.query(`
      ALTER TABLE tenant_documents 
      ADD COLUMN IF NOT EXISTS deleted_at DATETIME NULL DEFAULT NULL
    `, { type: QueryTypes.RAW, transaction });
    console.log('✅ Added deleted_at to tenant_documents table');
    
    // Create indexes for better performance
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_tenants_deleted_at ON tenants(deleted_at)
    `, { type: QueryTypes.RAW, transaction });
    
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_properties_deleted_at ON properties(deleted_at)
    `, { type: QueryTypes.RAW, transaction });
    
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_bills_deleted_at ON bills(deleted_at)
    `, { type: QueryTypes.RAW, transaction });
    
    console.log('✅ Created indexes for deleted_at columns');
    
    await transaction.commit();
    console.log('✅ Migration completed successfully!');
    
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  addSoftDeleteColumns()
    .then(() => {
      console.log('✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = addSoftDeleteColumns;

