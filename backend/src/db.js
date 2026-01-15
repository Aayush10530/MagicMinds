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
    UserProgress.belongsTo(User, { foreignKey: 'user_id' });

    User.hasMany(ChatSession, { foreignKey: 'user_id', as: 'sessions' });
    ChatSession.belongsTo(User, { foreignKey: 'user_id' });

    ChatSession.hasMany(ChatMessage, { foreignKey: 'session_id', as: 'messages' });
    ChatMessage.belongsTo(ChatSession, { foreignKey: 'session_id' });
};

// State Tracking
let isConnected = false;

const connectDB = async () => {
    try {
        console.log('🔄 Attempting Database Connection...');

        // 1. Authenticate
        await sequelize.authenticate();
        console.log('✅ Database Connected (Supabase)');
        isConnected = true;

        // 2. Initialize Models (Always needed for queries)
        initModels();

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
        console.error('⚠️ Database Connection Failed (Server running in Degraded Mode):');
        console.error(error.message);
        isConnected = false;
        // We do NOT process.exit(). The server stays UP.
    }
};

const getDBStatus = () => isConnected;

module.exports = {
    sequelize,
    connectDB,
    getDBStatus,
    // Export models lazily getters to prevent crash if accessed before init
    get User() { return User; },
    get UserProgress() { return UserProgress; },
    get ChatSession() { return ChatSession; },
    get ChatMessage() { return ChatMessage; }
};
