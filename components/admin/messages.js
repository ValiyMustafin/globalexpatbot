const { Telegraf, session } = require('telegraf')
const { User } = require('../../db/models')
const dates = require('../mailing/functions')
const constvalue = require('../const')
const { CreatingMiling } = require('../mailing/creating')
require('dotenv').config()

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.use(session())

async function sendNotification(ctx, text, user) {
    channelId = process.env.CHAT_ID.substring(4)
    const admins = await User.findAll({ where: { role: 'admin' } });
    adminsList = JSON.stringify(admins, null, 2)
    const adminsObj = JSON.parse(adminsList);
    insideDialog = user.dialog_msgId + 1
    const count = await User.count({ where: { role: 'admin' } })
    const f = i => {
        if (i >= count) {
            return;
        }
        setTimeout(() => {
            try {
                ctx.telegram.sendMessage(adminsObj[i].chatId, 'Пришло сообщение от ' + user.name + ' | ' + user.username + '\n\n💬' + text + '\n\nСсылка на диалог: ' + 'https://t.me/c/' + channelId + '/' + insideDialog + '?thread=' + user.dialog_msgId, { parse_mode: "HTML" })
            }
            catch (e) {
                console.log(e)
            }
            f(i + 1);
        }, i * 100);
    };
    f(0)
}

async function findDialog(ctx, username) {
    try {
        chatId = process.env.CHAT_ID.substring(4)
        channelId = process.env.CHANNEL_ID.substring(4)
        const user = await User.findOne({ where: { username: username } });
        try {
            insideDialog = user.dialog_msgId + 1
            url = chatId + '/' + insideDialog + '?thread=' + user.dialog_msgId
        } catch {
            url = chatId + '/' + channelId + '/' + user.channel_msgId
        }
        ctx.reply('🔎Наден пользователь: ' + user.name + '\nСсылка на диалог: ' + 'https://t.me/c/' + url)
    } catch (e) {
        console.log(e)
        ctx.reply('❗️Пользователь не найден')
    }
}

async function adminMessages(ctx, type) {
    ctx.session ??= { mailingCreateStep: 0 }
    if (!ctx.session.mailingCreateStep & !ctx.session.addadmin & !ctx.session.adminname) {
        if (type === 'text') {
            if (ctx.message.text[0] == '@') {
                findDialog(ctx, ctx.message.text)
            } else {
                ctx.reply('Админ не может отправить вопрос в службу поддержки')
            }
        } else {
            ctx.reply('Админ не может отправить вопрос в службу поддержки')
        }
    }
    if (ctx.session.adminname) {
        if (type === 'text') {
            ctx.session.adminname = 0
            const newadmin = await User.findOne({ where: { chatId: String(ctx.chat.id) } })
            const users = await User.findAll({ where: { role: 'admin' } });
            usersList = JSON.stringify(users, null, 2)
            const usersObj = JSON.parse(usersList);
            const count = await User.count({ where: { role: 'admin' } })
            for (var i = 0; i < count; i++) {
                await ctx.telegram.sendMessage(usersObj[i].chatId, 'Пользователь ' + newadmin.username + ' стал администратором')
            }
            newadmin.name = ctx.message.text
            await newadmin.save()
            ctx.reply('Имя успешно сохранено!')
        } else {
            ctx.reply('Необходимо прописать имя текстом')
        }
    }
    if (ctx.session.mailingCreateStep) {

        CreatingMiling(ctx, type)
    }
    if (ctx.session.addadmin) {
        try {
            if (ctx.session.addadmin == 2) {
                const newadmin = await User.findOne({ where: { username: String(ctx.session.newadmin) } })
                const users = await User.findAll({ where: { role: 'admin' } });
                usersList = JSON.stringify(users, null, 2)
                const usersObj = JSON.parse(usersList);
                const count = await User.count({ where: { role: 'admin' } })
                for (var i = 0; i < count; i++) {
                    await ctx.telegram.sendMessage(usersObj[i].chatId, 'Пользователь ' + newadmin.username + ' стал администратором')
                }
                newadmin.name = ctx.message.text
                await newadmin.save()
                ctx.reply('✅Пользователю ' + newadmin.username + ' успешно присвоена роль администратора')
                await ctx.telegram.sendMessage(newadmin.chatId, 'Пользователь @' + ctx.message.from.username + ' присвоил вам роль администратора\n\nВам доступна панель для аднимистратора',
                    Markup.keyboard(constvalue.adminmenu)
                        .resize())
                ctx.session.addadmin = 0
            }
            if (ctx.session.addadmin == 1) {
                const newadmin = await User.findOne({ where: { username: String(ctx.message.text) } })
                if (newadmin.name == 'неизвестно') {
                    ctx.session.addadmin = 2
                    ctx.session.newadmin = ctx.message.text
                    ctx.reply('Необходимо указать имя пользователя')
                } else {
                    const users = await User.findAll({ where: { role: 'admin' } });
                    usersList = JSON.stringify(users, null, 2)
                    const usersObj = JSON.parse(usersList);
                    const count = await User.count({ where: { role: 'admin' } })
                    for (var i = 0; i < count; i++) {
                        await ctx.telegram.sendMessage(usersObj[i].chatId, 'Пользователь ' + newadmin.username + ' стал администратором')
                    }
                    newadmin.role = 'admin'
                    await newadmin.save()
                    ctx.reply('✅Пользователю ' + ctx.message.text + ' успешно присвоена роль администратора')
                    await ctx.telegram.sendMessage(newadmin.chatId, 'Пользователь @' + ctx.message.from.username + ' присвоил вам роль администратора\n\nВам доступна панель для аднимистратора',
                        Markup.keyboard(constvalue.adminmenu)
                            .resize())
                    ctx.session.addadmin = 0
                }
            }
        }
        catch {
            ctx.reply('Пользователь не найден, убедитесь, что вы правильно указали логин пользователя, возможно, он недавно менял свой логин, либо никогда не запускал бота ранее\n\nПопросите сотрудника, которого вы назначаете администратором, прописать команду \"/start\" в бота', Markup.inlineKeyboard(
                [
                    [Markup.button.callback('⬅️Отменить добавление администратора', 'adminList')]
                ]))
        }
    }
}


exports.sendNotification = sendNotification
exports.findDialog = findDialog
exports.adminMessages = adminMessages