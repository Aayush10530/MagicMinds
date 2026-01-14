const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ChatMessage = sequelize.define('ChatMessage', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    session_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    sender: {
        type: DataTypes.ENUM('user', 'ai'),
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    // Vector embedding for the message content (for AI Memory)
    embedding: {
        type: DataTypes.VECTOR(384), // Dimension for sentence-transformers/all-MiniLM-L6-v2
        allowNull: true
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: true,
    tableName: 'chat_messages'
});

module.exports = ChatMessage;
