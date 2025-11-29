/**
 * Migration: Make postal_code field required (NOT NULL) in properties table
 * 
 * This migration alters the properties table to require values
 * for the postal_code field. Existing NULL values will need to be updated
 * before running this migration.
 */

const { sequelize } = require('../config/database');

async function makePostalCodeRequired() {
  const queryInterface = sequelize.getQueryInterface();
  
  try {
    console.log('🔄 Starting postal_code field migration (making it required)...');
    
    // Check current table structure
    const tableDescription = await queryInterface.describeTable('properties');
    
    if (tableDescription.postal_code) {
      // Check if it's already required
      if (tableDescription.postal_code.allowNull === true) {
        console.log('📝 Checking for NULL postal_code values...');
        
        // Check if there are any NULL values
        const Property = require('../models/Property');
        const nullCount = await Property.count({
          where: {
            postal_code: null
          }
        });
        
        if (nullCount > 0) {
          console.log(`⚠️  Found ${nullCount} properties with NULL postal_code`);
          console.log('📝 Setting default postal code "00000" for NULL values...');
          
          // Update NULL postal codes with a default value
          await Property.update(
            { postal_code: '00000' },
            { where: { postal_code: null } }
          );
          
          console.log(`✅ Updated ${nullCount} properties with default postal code`);
        }
        
        console.log('✅ No NULL postal_code values found');
        console.log('📝 Altering postal_code column to require NOT NULL...');
        
        // Alter the column to require NOT NULL
        await queryInterface.changeColumn('properties', 'postal_code', {
          type: sequelize.Sequelize.STRING(20),
          allowNull: false
        });
        
        console.log('✅ Postal_code column is now required (NOT NULL)');
      } else {
        console.log('ℹ️  Postal_code column is already required (NOT NULL)');
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
      
      await makePostalCodeRequired();
      await sequelize.close();
      process.exit(0);
    } catch (error) {
      console.error('Migration error:', error);
      await sequelize.close();
      process.exit(1);
    }
  })();
}

module.exports = { makePostalCodeRequired };

