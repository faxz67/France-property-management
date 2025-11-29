/**
 * Migration: Make country field nullable in properties table
 * 
 * This migration alters the properties table to allow NULL values
 * for the country field, making it optional.
 */

const { sequelize } = require('../config/database');

async function makeCountryNullable() {
  const queryInterface = sequelize.getQueryInterface();
  
  try {
    console.log('🔄 Starting country field migration...');
    
    // Check current table structure
    const tableDescription = await queryInterface.describeTable('properties');
    
    if (tableDescription.country) {
      // Check if it's already nullable
      if (tableDescription.country.allowNull === false) {
        console.log('📝 Altering country column to allow NULL...');
        
        // Alter the column to allow NULL
        await queryInterface.changeColumn('properties', 'country', {
          type: sequelize.Sequelize.STRING(100),
          allowNull: true,
          validate: {
            len: [2, 100]
          }
        });
        
        console.log('✅ Country column is now nullable');
      } else {
        console.log('ℹ️  Country column is already nullable');
      }
    } else {
      console.log('⚠️  Country column does not exist in properties table');
    }
    
    console.log('✅ Country field migration completed successfully');
    
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
      
      await makeCountryNullable();
      await sequelize.close();
      process.exit(0);
    } catch (error) {
      console.error('Migration error:', error);
      await sequelize.close();
      process.exit(1);
    }
  })();
}

module.exports = { makeCountryNullable };

