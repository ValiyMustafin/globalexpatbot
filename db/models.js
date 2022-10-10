const sequelize = require('./db')
const { DataTypes } = require('sequelize')
const { STRING } = require('sequelize')
const { INTEGER } = require('sequelize')

const User = sequelize.define('users', {
    id: { type: DataTypes.INTEGER, primaryKey: true, unique: true, autoIncrement: true },
    chatId: { type: DataTypes.STRING, unique: true },
    username: { type: STRING, unique: true },
    name: { type: STRING, defaultValue: 'неизвестно' },
    phone: { type: DataTypes.STRING, defaultValue: 'неизвестен' },
    role: { type: DataTypes.STRING, defaultValue: 'guest' },
    dialog_msgId: { type: DataTypes.INTEGER, defaultValue: 0 },
    channel_msgId: { type: DataTypes.INTEGER, defaultValue: 0 },
})

const Mailing = sequelize.define('mailing', {
    id: { type: DataTypes.INTEGER, primaryKey: true, unique: true, autoIncrement: true },
    text: { type: DataTypes.STRING },
    fileId: { type: DataTypes.STRING },
    date: { type: DataTypes.STRING },
    type: { type: DataTypes.STRING },
    sent: { type: DataTypes.STRING },
    all_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    count_success: { type: DataTypes.INTEGER, defaultValue: 0 },
    count_unsuccess: { type: DataTypes.INTEGER, defaultValue: 0 },
    roles: { type: DataTypes.STRING },
    create_by: { type: DataTypes.STRING },
})

module.exports =
{
    User,
    Mailing
}