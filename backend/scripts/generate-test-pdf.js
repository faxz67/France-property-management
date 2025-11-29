/**
 * Generate a test PDF bill and show the file path
 */

const { Bill, Tenant, Property, Admin } = require('../models');
const PDFService = require('../services/pdfService');
const fs = require('fs');
const path = require('path');

async function generateTestPDF() {
  try {
    console.log('📄 Generating Test PDF Bill...\n');
    console.log('='.repeat(60));

    // Find a bill with all associations
    const bill = await Bill.findOne({
      include: [
        {
          model: Tenant,
          as: 'tenant',
          attributes: ['id', 'name', 'email', 'phone', 'address'],
          required: false
        },
        {
          model: Property,
          as: 'property',
          attributes: ['id', 'title', 'address', 'city', 'country', 'postal_code'],
          required: false
        },
        {
          model: Admin,
          as: 'admin',
          attributes: ['id', 'name', 'email', 'signature_photo'],
          required: false
        }
      ],
      order: [['id', 'DESC']],
      limit: 1
    });

    if (!bill) {
      console.log('❌ No bills found in database');
      console.log('💡 Please create a bill first.');
      process.exit(1);
    }

    console.log(`✅ Found bill ID: ${bill.id}`);
    console.log(`   Month: ${bill.month}`);
    console.log(`   Status: ${bill.status}\n`);

    if (bill.property) {
      console.log('🏠 Property Details:');
      console.log(`   Title: ${bill.property.title || 'N/A'}`);
      console.log(`   Address: ${bill.property.address || 'N/A'}`);
      console.log(`   City: ${bill.property.city || 'N/A'}`);
      console.log(`   Postal Code: ${bill.property.postal_code || 'N/A'}\n`);
    }

    if (bill.tenant) {
      console.log('👤 Tenant Details:');
      console.log(`   Name: ${bill.tenant.name || 'N/A'}`);
      console.log(`   Email: ${bill.tenant.email || 'N/A'}`);
      console.log(`   Phone: ${bill.tenant.phone || 'N/A'}\n`);
    }

    if (bill.admin) {
      console.log('👨‍💼 Admin Details:');
      console.log(`   Name: ${bill.admin.name || 'N/A'}`);
      console.log(`   Email: ${bill.admin.email || 'N/A'}\n`);
    }

    // Generate PDF
    console.log('📄 Generating PDF...\n');
    const pdfPath = await PDFService.generateBillPDF(bill);
    
    if (!fs.existsSync(pdfPath)) {
      console.log('❌ PDF file was not created');
      process.exit(1);
    }

    const stats = fs.statSync(pdfPath);
    const absolutePath = path.resolve(pdfPath);
    
    console.log('='.repeat(60));
    console.log('✅ PDF GENERATED SUCCESSFULLY!\n');
    console.log('📁 File Information:');
    console.log(`   Path: ${pdfPath}`);
    console.log(`   Absolute Path: ${absolutePath}`);
    console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log(`   Created: ${stats.birthtime.toLocaleString()}\n`);
    console.log('='.repeat(60));
    console.log('\n💡 To open the PDF:');
    console.log(`   1. Copy this path: ${absolutePath}`);
    console.log(`   2. Open File Explorer and paste the path in the address bar`);
    console.log(`   3. Or use: start "" "${absolutePath}" (Windows)`);
    console.log(`\n📋 Or access via API:`);
    console.log(`   GET http://localhost:5000/api/bills/${bill.id}/download`);
    console.log(`   GET http://localhost:5000/api/test/download-pdf/${bill.id}?adminId=${bill.admin_id}\n`);

    // Try to open the PDF automatically on Windows
    try {
      const { exec } = require('child_process');
      exec(`start "" "${absolutePath}"`, (error) => {
        if (error) {
          console.log('⚠️  Could not open PDF automatically. Please open it manually.');
        } else {
          console.log('✅ PDF opened in default viewer!\n');
        }
      });
    } catch (e) {
      console.log('⚠️  Could not open PDF automatically. Please open it manually.\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

generateTestPDF();

