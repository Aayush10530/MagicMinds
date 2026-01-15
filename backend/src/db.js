const { sequelize } = require('./config/database');

// Lazy Loading Models (to avoid circular deps before init)
let User, UserProgress, ChatSession, ChatMessage;

const initModels = () => {
    User = require('./models/User');
    UserProgress = require('./models/UserProgress');
    ChatSession = require('./models/ChatSession');
    ChatMessage = require('./models/ChatMessage');

    // Define Associations
    User.hasOne(UserProgress, { foreignKey: 'user_id', as: 'progress' });
    // 1. Synchronous Model Loading (Prevents "undefined" in routes)
    const User = require('./models/User');
    const ChatSession = require('./models/ChatSession');
    const ChatMessage = require('./models/ChatMessage');
    const UserProgress = require('./models/UserProgress');

    // Define Associations
    User.hasOne(UserProgress, { foreignKey: 'user_id', as: 'progress' });
    UserProgress.belongsTo(User, { foreignKey: 'user_id' });

    User.hasMany(ChatSession, { foreignKey: 'user_id', as: 'sessions' });
    ChatSession.belongsTo(User, { foreignKey: 'user_id' });

    ChatSession.hasMany(ChatMessage, { foreignKey: 'session_id', as: 'messages' });
    ChatMessage.belongsTo(ChatSession, { foreignKey: 'session_id' });

    let isConnected = false;

    const connectDB = async () => {
        try {
            console.log('🔄 Attempting Database Connection...');

            // 2. Authenticate (Check connection)
            await sequelize.authenticate();
            console.log('✅ Database Connected (Supabase)');
            isConnected = true;

            // 3. Sync Schema (DEVELOPMENT ONLY)
            // DANGER: Never run 'alter: true' in production while handling traffic.
            // It causes race conditions, locks, and 502s.
            if (process.env.NODE_ENV !== 'production') {
                try {
                    await sequelize.sync({ alter: true });
                    console.log('✅ Database Synced (Dev Mode)');
                } catch (syncError) {
                    // Keep Self-Repair logic ONLY for Dev
                    if (syncError.message && syncError.message.includes('cannot be cast automatically')) {
                        console.warn('⚠️ Schema Type Mismatch (Dev). Repairing...');
                        await ChatMessage.sync({ force: true }).catch(e => console.error(e));
                        await sequelize.sync({ alter: true });
                    }
                }
            } else {
                console.log('✅ Production Mode: Skipping Auto-Sync (Schema must be stable)');
            }

        } catch (error) {
            console.error('⚠️ Database Connection Failed (Server will continue in degraded mode):', error.message);
            isConnected = false;
        }
    };

    const getDBStatus = () => isConnected;

    module.exports = {
        sequelize,
        connectDB,
        getDBStatus,
        User,
        ChatSession,
        ChatMessage,
        UserProgress
    };
