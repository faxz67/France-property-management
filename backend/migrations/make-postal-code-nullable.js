/**
 * Migration: Make postal_code field nullable in properties table
 * 
 * This migration alters the properties table to allow NULL values
 * for the postal_code field, making it optional.
 */

const { sequelize } = require('../config/database');

async function makePostalCodeNullable() {
  const queryInterface = sequelize.getQueryInterface();
  
  try {
    console.log('🔄 Starting postal_code field migration...');
    
    // Check current table structure
    const tableDescription = await queryInterface.describeTable('properties');
    
    if (tableDescription.postal_code) {
      // Check if it's already nullable
      if (tableDescription.postal_code.allowNull === false) {
        console.log('📝 Altering postal_code column to allow NULL...');
        
        // Alter the column to allow NULL
        await queryInterface.changeColumn('properties', 'postal_code', {
          type: sequelize.Sequelize.STRING(20),
          allowNull: true
        });
        
        console.log('✅ Postal_code column is now nullable');
      } else {
        console.log('ℹ️  Postal_code column is already nullable');
      }
    } else {
      console.log('⚠️  Postal_code column does not exist in properties table');
    }
    
    console.log('✅ Postal_code field migration completed successfully');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if executed directly
if (require.main === module) {
  (async () => {
    try {
      // Test connection
      await sequelize.authenticate();
      console.log('✅ Database connection successful');
      
      await makePostalCodeNullable();
      await sequelize.close();
      process.exit(0);
    } catch (error) {
      console.error('Migration error:', error);
      await sequelize.close();
      process.exit(1);
    }
  })();
}

module.exports = { makePostalCodeNullable };

