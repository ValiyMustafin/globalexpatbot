const { Telegraf, session, Markup } = require('telegraf')
const { User } = require('../db/models')
require('dotenv').config()
const constvalue = require('./const')
const bot = new Telegraf(process.env.BOT_TOKEN)
bot.use(session())

async function Start(ctx) {
    param = ctx.update.message.text.split(' ')
    console.log(param[1])
    try {
        await User.create({ chatId: String(ctx.chat.id), username: '@' + ctx.message.from.username })
    } catch
    {
    }
    const user = await User.findOne({ where: { chatId: String(ctx.chat.id) } })
    //ОБНОВЛЕНИЕ ЮЗЕРНЕЙМА
    updateUsername(ctx)
    //Первое сообщение
    //Старт админов
    if (user.role == 'admin') {
        await ctx.replyWithHTML('<b>Вам доступна панель для аднимистратора</b>',
            Markup.keyboard(constvalue.adminmenu)
                .resize(),
            { disable_web_page_preview: 'True' })
    }
    //Старт блока
    if (user.role == 'block') {
        if (user.name === 'неизвестно' || user.phone === 'неизвестен') {
            user.role = 'guest'
            await user.save()
        } else {
            user.role = 'user'
            await user.save()
        }
    }
    //Приглашение админов
    if (param[1] == 'LnLH7DmMtH57uS4W') {
        const users = await User.findAll({ where: { role: 'admin' } });
        usersList = JSON.stringify(users, null, 2)
        const usersObj = JSON.parse(usersList);
        const count = await User.count({ where: { role: 'admin' } })
        user.role = 'admin'
        await user.save()
        await ctx.replyWithHTML('<b>Вам доступна панель для аднимистратора</b>',
            Markup.keyboard(constvalue.adminmenu)
                .resize(),
            { disable_web_page_preview: 'True' })
        if (user.name = 'неизвестно') {
            ctx.reply('Укажите, пожалуйста, ваше имя')
            ctx.session ??= { adminname: 0 }
            ctx.session.adminname = 1
        } else {
            for (var i = 0; i < count; i++) {
                await ctx.telegram.sendMessage(usersObj[i].chatId, 'Пользователь ' + user.username + ' стал администратором')
            }
        }
    }
    //обычный старт
    if (!param[1]) {
        await ctx.replyWithHTML(constvalue.firstmsgText, { disable_web_page_preview: 'True' })
    }
}

async function updateUsername(ctx) {
    const user = await User.findOne({ where: { chatId: String(ctx.chat.id) } })
    if (ctx.message.from.username) {
        if (user.username != '@' + ctx.message.from.username) {
            user.username = '@' + ctx.message.from.username
            await user.save()
        }
    } else {
        console.log('У пользователя id: ' + user.chatId + ' отсутствует username')
    }
}

exports.updateUsername = updateUsername
exports.Start = Start