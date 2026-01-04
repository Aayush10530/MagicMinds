const { Sequelize } = require('sequelize');
const pgvector = require('pgvector/sequelize');
pgvector.registerType(Sequelize);
const path = require('path');

// Load environment variables
require('dotenv').config();

// Default to development if not specified
const env = process.env.NODE_ENV || 'development';

const config = {
    development: {
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'magic_password',
        database: process.env.DB_NAME || 'magic_minds',
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5433,
        dialect: 'postgres',
        logging: false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    },
    production: {
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        dialect: 'postgres',
        ssl: true,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    }
};

const dbConfig = config[env];

const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
        host: dbConfig.host,
        port: dbConfig.port,
        dialect: dbConfig.dialect,
        logging: dbConfig.logging,
        pool: dbConfig.pool
    }
);

module.exports = { sequelize };
