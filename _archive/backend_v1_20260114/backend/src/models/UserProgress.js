const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserProgress = sequelize.define('UserProgress', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true
    },
    chat_sessions_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    roleplay_completed_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    streak_days: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    last_active_date: {
        type: DataTypes.DATE
    },
    badges: {
        type: DataTypes.JSONB,
        defaultValue: []
    },
    vocabulary_growth: {
        type: DataTypes.JSONB,
        defaultValue: { count: 0, words: [] }
    },
    emotional_trends: {
        type: DataTypes.JSONB,
        defaultValue: []
    }
}, {
    timestamps: true,
    tableName: 'user_progress'
});

module.exports = UserProgress;
