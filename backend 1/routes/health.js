/**
 * Health Check Routes
 * 
 * Endpoints pour monitoring:
 * - /api/health - Full health check
 * - /api/health/ready - Readiness probe (Kubernetes)
 * - /api/health/live - Liveness probe (Kubernetes)
 */

const express = require('express');
const router = express.Router();
const { performHealthCheck, checkDatabase } = require('../utils/healthCheck');
const logger = require('../utils/logger');

/**
 * GET /api/health
 * Health check complet avec détails
 */
router.get('/health', async (req, res) => {
  try {
    const health = await performHealthCheck();
    const statusCode = health.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Health check endpoint error', { error: error.message });
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

/**
 * GET /api/health/ready
 * Readiness probe - vérifie si l'app est prête à recevoir du trafic
 * Utilisé par Kubernetes/Docker pour savoir quand router le trafic
 */
router.get('/health/ready', async (req, res) => {
  try {
    const dbCheck = await checkDatabase();
    
    if (dbCheck.status === 'healthy') {
      res.status(200).send('OK');
    } else {
      res.status(503).send('NOT READY');
    }
  } catch (error) {
    logger.error('Readiness probe failed', { error: error.message });
    res.status(503).send('NOT READY');
  }
});

/**
 * GET /api/health/live
 * Liveness probe - vérifie si l'app tourne
 * Utilisé par Kubernetes/Docker pour restart si nécessaire
 */
router.get('/health/live', (req, res) => {
  // Simple check: si on répond, on est vivant
  res.status(200).send('OK');
});

/**
 * GET /api/health/metrics
 * Métriques basiques pour monitoring
 */
router.get('/health/metrics', async (req, res) => {
  try {
    const health = await performHealthCheck();
    
    // Format Prometheus-like (simple)
    const metrics = `
# HELP app_health Application health status (1 = healthy, 0 = unhealthy)
# TYPE app_health gauge
app_health ${health.status === 'healthy' ? 1 : 0}

# HELP app_uptime Application uptime in seconds
# TYPE app_uptime counter
app_uptime ${health.checks.uptime.uptimeSeconds}

# HELP app_memory_usage Memory usage percentage
# TYPE app_memory_usage gauge
app_memory_usage ${parseFloat(health.checks.memory.percentage)}
    `.trim();
    
    res.set('Content-Type', 'text/plain');
    res.send(metrics);
  } catch (error) {
    logger.error('Metrics endpoint error', { error: error.message });
    res.status(500).send('# Error generating metrics');
  }
});

module.exports = router;

