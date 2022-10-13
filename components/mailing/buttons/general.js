const { Telegraf, Markup } = require('telegraf')
require('dotenv').config()
const { User } = require('../../../db/models')

const bot = new Telegraf(process.env.BOT_TOKEN)

mailingFirstText = 'Управление рассылками'
mailingFirstKeyboard = [
    [Markup.button.callback('Создать рассылку', 'mailing_create')]
    // [Markup.button.callback('Список рассылок', 'mailing_list')]
]

async function StartMiling(ctx) {
    const user = await User.findOne({ where: { chatId: String(ctx.chat.id) } })
    if (user.role == 'admin') {
        await ctx.reply(mailingFirstText, Markup.inlineKeyboard(
            mailingFirstKeyboard
        ))
    }
}

module.exports.mailingFirstText = mailingFirstText
module.exports.mailingFirstKeyboard = mailingFirstKeyboard
exports.StartMiling = StartMiling