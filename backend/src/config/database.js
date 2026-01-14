const { Sequelize } = require('sequelize');
require('dotenv').config();

// 1. Validate Critical Variables
if (!process.env.DB_HOST || !process.env.DB_PASSWORD) {
    console.warn('⚠️ WARNING: DB_HOST or DB_PASSWORD missing. Database features will be disabled.');
}

// 2. Configure for Supabase Session Pooler
// Pooler requires: Port 5432 (or 6543), SSL, and explicit IPv4 binding where possible.
const sequelize = new Sequelize(
    process.env.DB_NAME || 'postgres',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: (msg) => {
            // Only log query errors or specific startup msgs
            if (msg.includes('Error') || msg.includes('Executing')) {
                // console.log(msg); // Too verbose for prod, uncomment for debug
            }
        },
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false // Required for Supabase in many environments
            },
        },
        // Pool settings for stability
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

module.exports = { sequelize };
