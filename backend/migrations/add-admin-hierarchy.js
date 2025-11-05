/**
 * Migration: Add Admin Hierarchy and Isolation
 * 
 * This migration adds:
 * 1. created_by field to track who created each admin
 * 2. Proper isolation so each super admin only sees their own created admins
 */

const { sequelize } = require('../config/database');

async function addAdminHierarchy() {
  const queryInterface = sequelize.getQueryInterface();
  
  try {
    console.log('🔄 Starting admin hierarchy migration...');
    
    // Check if created_by column already exists
    const tableDescription = await queryInterface.describeTable('admins');
    
    if (!tableDescription.created_by) {
      // Add created_by column
      await queryInterface.addColumn('admins', 'created_by', {
        type: sequelize.Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'admins',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'ID of the admin who created this admin (NULL for bootstrap/system admins)'
      });
      
      console.log('✅ Added created_by column to admins table');
    } else {
      console.log('ℹ️  created_by column already exists');
    }
    
    // Add index for better query performance
    try {
      await queryInterface.addIndex('admins', ['created_by'], {
        name: 'idx_admins_created_by'
      });
      console.log('✅ Added index on created_by column');
    } catch (indexError) {
      if (indexError.message.includes('already exists')) {
        console.log('ℹ️  Index already exists');
      } else {
        throw indexError;
      }
    }
    
    console.log('✅ Admin hierarchy migration completed successfully');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if executed directly
if (require.main === module) {
  addAdminHierarchy()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = addAdminHierarchy;

