const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ChatSession = sequelize.define('ChatSession', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('chat', 'roleplay'),
        defaultValue: 'chat'
    },
    scenario_id: {
        type: DataTypes.STRING,
        allowNull: true // Only for roleplay
    },
    title: {
        type: DataTypes.STRING,
        defaultValue: 'New Conversation'
    },
    summary: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    timestamps: true,
    tableName: 'chat_sessions'
});

module.exports = ChatSession;
