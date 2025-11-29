#!/usr/bin/env node

/**
 * Admin Isolation Migration Runner
 * 
 * This script runs the admin hierarchy migration to add isolation features.
 * It can be run safely multiple times (idempotent).
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { testConnection } = require('../models');
const addAdminHierarchy = require('../migrations/add-admin-hierarchy');

console.log('╔════════════════════════════════════════════╗');
console.log('║  Admin Isolation System - Migration       ║');
console.log('╚════════════════════════════════════════════╝');
console.log('');

async function runMigration() {
  try {
    // Test database connection
    console.log('🔌 Testing database connection...');
    await testConnection();
    console.log('✅ Database connection successful\n');

    // Run migration
    console.log('🚀 Running admin hierarchy migration...\n');
    await addAdminHierarchy();
    
    console.log('');
    console.log('╔════════════════════════════════════════════╗');
    console.log('║  ✅ Migration Completed Successfully!     ║');
    console.log('╚════════════════════════════════════════════╝');
    console.log('');
    console.log('Next steps:');
    console.log('1. Restart your server: pm2 restart property-backend');
    console.log('2. Test the isolation by creating admins');
    console.log('3. Read ADMIN_ISOLATION_SETUP.md for details');
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('╔════════════════════════════════════════════╗');
    console.error('║  ❌ Migration Failed                      ║');
    console.error('╚════════════════════════════════════════════╝');
    console.error('');
    console.error('Error details:', error.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Check database connection settings in .env');
    console.error('2. Ensure database server is running');
    console.error('3. Verify database user has ALTER TABLE privileges');
    console.error('');
    process.exit(1);
  }
}

// Run migration
runMigration();

