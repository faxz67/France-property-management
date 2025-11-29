const Sequelize = require('sequelize');
require('dotenv').config();

const config = {
  development: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'toor',
    database: process.env.DB_NAME || 'property_rental',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mariadb',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 20, // Increased for multi-user support
      min: 5,  // Keep minimum connections alive
      acquire: 60000, // Increased timeout for connection acquisition
      idle: 30000,    // Increased idle timeout
      evict: 1000,    // Check for idle connections every second
      handleDisconnects: true
    }
  },
  test: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'toor',
    database: process.env.DB_NAME_TEST || 'property_rental',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mariadb',
    logging: false
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mariadb',
    dialectOptions: {
      timezone: 'local'
    },
    logging: false,
    pool: {
      max: 50, // Increased for production multi-user support
      min: 10, // Keep more minimum connections alive
      acquire: 60000, // Increased timeout for connection acquisition
      idle: 30000,    // Increased idle timeout
      evict: 1000,    // Check for idle connections every second
      handleDisconnects: true
    }
  }
};

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database || 'property_rental',
  dbConfig.username || 'root',
  dbConfig.password || '',
  {
    host: dbConfig.host || 'localhost',
    port: dbConfig.port || 3306,
    dialect: dbConfig.dialect,
    dialectOptions: dbConfig.dialectOptions,
    logging: dbConfig.logging,
    pool: dbConfig.pool,
    storage: dbConfig.storage
  }
);

module.exports = { sequelize, config, DataTypes: Sequelize.DataTypes };
