/**
 * Migration: Add charges_amount field to tenants table
 * 
 * This migration adds:
 * 1. charges_amount field to store optional charges for tenants
 */

const { sequelize } = require('../config/database');

async function addTenantChargesAmount() {
  const queryInterface = sequelize.getQueryInterface();
  
  try {
    console.log('🔄 Starting tenant charges_amount migration...');
    
    // Check if charges_amount column already exists
    const tableDescription = await queryInterface.describeTable('tenants');
    
    if (!tableDescription.charges_amount) {
      // Add charges_amount column
      await queryInterface.addColumn('tenants', 'charges_amount', {
        type: sequelize.Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Optional charges amount for the tenant'
      });
      
      console.log('✅ Added charges_amount column to tenants table');
    } else {
      console.log('ℹ️  charges_amount column already exists');
    }
    
    console.log('✅ Tenant charges_amount migration completed successfully');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if executed directly
if (require.main === module) {
  addTenantChargesAmount()
    .then(() => {
      console.log('✅ Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = addTenantChargesAmount;

