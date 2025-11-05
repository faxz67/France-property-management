/**
 * Health Check Utility
 * 
 * Endpoints pour monitoring de l'état du serveur
 */

const { sequelize } = require('../models');
const logger = require('./logger');

/**
 * Vérifier la santé de la base de données
 */
async function checkDatabase() {
  try {
    await sequelize.authenticate();
    return {
      status: 'healthy',
      responseTime: Date.now()
    };
  } catch (error) {
    logger.error('Database health check failed', { error: error.message });
    return {
      status: 'unhealthy',
      error: error.message,
      responseTime: Date.now()
    };
  }
}

/**
 * Vérifier l'utilisation mémoire
 */
function checkMemory() {
  const usage = process.memoryUsage();
  const totalMem = usage.heapTotal / 1024 / 1024;
  const usedMem = usage.heapUsed / 1024 / 1024;
  const percentage = (usedMem / totalMem) * 100;

  return {
    status: percentage < 90 ? 'healthy' : 'warning',
    heapUsed: `${usedMem.toFixed(2)} MB`,
    heapTotal: `${totalMem.toFixed(2)} MB`,
    percentage: `${percentage.toFixed(2)}%`
  };
}

/**
 * Vérifier l'uptime
 */
function checkUptime() {
  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);

  return {
    status: 'healthy',
    uptime: `${hours}h ${minutes}m ${seconds}s`,
    uptimeSeconds: uptime
  };
}

/**
 * Health check complet
 */
async function performHealthCheck() {
  const startTime = Date.now();

  try {
    const [database, memory, uptime] = await Promise.all([
      checkDatabase(),
      Promise.resolve(checkMemory()),
      Promise.resolve(checkUptime())
    ]);

    const responseTime = Date.now() - startTime;
    const isHealthy = database.status === 'healthy';

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: {
        database,
        memory,
        uptime
      },
      responseTime: `${responseTime}ms`
    };
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    return {
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }
}

module.exports = {
  performHealthCheck,
  checkDatabase,
  checkMemory,
  checkUptime
};

