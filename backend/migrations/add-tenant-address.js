/**
 * Migration: Add address field to tenants table
 * 
 * This migration adds an address field to the tenants table
 * to store tenant addresses.
 */

const { sequelize } = require('../config/database');

async function addTenantAddress() {
  const queryInterface = sequelize.getQueryInterface();
  
  try {
    console.log('🔄 Starting tenant address field migration...');
    
    // Check current table structure
    const tableDescription = await queryInterface.describeTable('tenants');
    
    if (!tableDescription.address) {
      console.log('📝 Adding address column to tenants table...');
      
      // Add address column
      await queryInterface.addColumn('tenants', 'address', {
        type: sequelize.Sequelize.STRING(500),
        allowNull: true,
        comment: 'Tenant address'
      });
      
      console.log('✅ Added address column to tenants table');
    } else {
      console.log('ℹ️  address column already exists in tenants table');
    }
    
    console.log('✅ Tenant address field migration completed successfully');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if executed directly
if (require.main === module) {
  addTenantAddress()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = addTenantAddress;

