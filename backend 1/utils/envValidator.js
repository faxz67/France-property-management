/**
 * Environment Variables Validator
 * 
 * Validates all required environment variables at startup
 * Prevents server from starting with missing critical configuration
 */

const requiredEnvVars = [
  // Database
  'DB_HOST',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  
  // Security
  'JWT_SECRET',
  'SESSION_SECRET',
  
  // Server
  'PORT',
  'NODE_ENV',
  'FRONTEND_URL',
  
  // Email (optional but recommended)
  // 'SMTP_HOST',
  // 'SMTP_PORT',
  // 'EMAIL_USER',
  // 'EMAIL_PASS'
];

const optionalEnvVars = [
  'SMTP_HOST',
  'SMTP_PORT',
  'EMAIL_USER',
  'EMAIL_PASS',
  'LOG_LEVEL',
  'ENABLE_FILE_LOGGING'
];

function validateEnvironment() {
  const missing = [];
  const warnings = [];

  // Check required variables
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  // Check optional but recommended variables
  for (const varName of optionalEnvVars) {
    if (!process.env[varName]) {
      warnings.push(varName);
    }
  }

  // Validate JWT_SECRET strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    warnings.push('JWT_SECRET is too short (should be at least 32 characters)');
  }

  // Validate SESSION_SECRET strength
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 32) {
    warnings.push('SESSION_SECRET is too short (should be at least 32 characters)');
  }

  // Validate NODE_ENV
  const validEnvs = ['development', 'production', 'test'];
  if (process.env.NODE_ENV && !validEnvs.includes(process.env.NODE_ENV)) {
    warnings.push(`NODE_ENV should be one of: ${validEnvs.join(', ')}`);
  }

  // Report results
  if (missing.length > 0) {
    console.error('❌ CRITICAL: Missing required environment variables:');
    missing.forEach(v => console.error(`   - ${v}`));
    console.error('\nServer cannot start. Please check your .env file.');
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.warn('⚠️  WARNING: Environment configuration issues:');
    warnings.forEach(w => console.warn(`   - ${w}`));
    console.warn('');
  }

  console.log('✅ Environment variables validated successfully');
}

module.exports = {
  validateEnvironment,
  requiredEnvVars,
  optionalEnvVars
};

