const { sequelize } = require('./config/database');
const User = require('./models/User');
const UserProgress = require('./models/UserProgress');
const ChatSession = require('./models/ChatSession');
const ChatMessage = require('./models/ChatMessage');

// Define Associations
User.hasOne(UserProgress, { foreignKey: 'user_id', as: 'progress' });
UserProgress.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(ChatSession, { foreignKey: 'user_id', as: 'sessions' });
ChatSession.belongsTo(User, { foreignKey: 'user_id' });

ChatSession.hasMany(ChatMessage, { foreignKey: 'session_id', as: 'messages' });
ChatMessage.belongsTo(ChatSession, { foreignKey: 'session_id' });

// Function to sync database
const syncDatabase = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connection established successfully.');

        // Enable pgvector extension
        await sequelize.query('CREATE EXTENSION IF NOT EXISTS vector;');

        // Check registered models
        console.log('Registered Models:', Object.keys(sequelize.models));

        // Sync models (Force true to recreate tables since we are having issues)
        await sequelize.sync({ force: true });
        console.log('Database synchronized successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        // Don't exit process, just log error so server can still start (maybe in degraded mode)
    }
};

module.exports = { syncDatabase, User, UserProgress, ChatSession, ChatMessage };
