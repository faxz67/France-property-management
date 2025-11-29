/**
 * Migration: Add signature_photo column to admins table
 * Run with: node migrations/add-signature-photo-column.js
 */

const { sequelize } = require('../config/database');

async function addSignaturePhotoColumn() {
  console.log('🔄 Adding signature_photo column to admins table...\n');

  try {
    const queryInterface = sequelize.getQueryInterface();
    
    // Check if column already exists
    const tableDescription = await queryInterface.describeTable('admins');
    
    if (tableDescription.signature_photo) {
      console.log('✅ Column signature_photo already exists!');
      console.log(`   Type: ${tableDescription.signature_photo.type}`);
      console.log(`   AllowNull: ${tableDescription.signature_photo.allowNull}`);
      return;
    }

    // Add the column
    await queryInterface.addColumn('admins', 'signature_photo', {
      type: sequelize.Sequelize.STRING(512),
      allowNull: true,
      comment: 'Path to admin signature image for PDF bills'
    });

    console.log('✅ Column signature_photo added successfully!');
    console.log('   Type: VARCHAR(512)');
    console.log('   Nullable: true');
    console.log('\n✨ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Error adding column:', error.message);
    console.error('\nYou can also run this SQL manually:');
    console.error('ALTER TABLE admins ADD COLUMN signature_photo VARCHAR(512) NULL;');
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

addSignaturePhotoColumn();

