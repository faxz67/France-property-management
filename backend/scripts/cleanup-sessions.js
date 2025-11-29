#!/usr/bin/env node

/**
 * Cleanup script for expired sessions
 * Run this script periodically to clean up expired sessions from the database
 */

const { sequelize, Session } = require('../models');

async function cleanupExpiredSessions() {
  try {
    console.log('🧹 Starting expired sessions cleanup...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Delete expired sessions
    const result = await Session.destroy({
      where: {
        expire: {
          [require('sequelize').Op.lt]: new Date()
        }
      }
    });
    
    console.log(`🗑️  Cleaned up ${result} expired sessions`);
    
    // Show current session count
    const sessionCount = await Session.count();
    console.log(`📊 Current active sessions: ${sessionCount}`);
    
    console.log('✅ Sessions cleanup completed successfully');
    
  } catch (error) {
    console.error('❌ Error during sessions cleanup:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
}

// Run cleanup if this script is executed directly
if (require.main === module) {
  cleanupExpiredSessions();
}

module.exports = cleanupExpiredSessions;
