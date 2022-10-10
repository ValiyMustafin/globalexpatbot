const { Telegraf, session } = require('telegraf')
const { User, Mailing } = require('../db/models')
const { sendTime, timeConverter } = require('./mailing')
const dates = require('./mailing')
const constvalue = require('./const')
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
    if (!ctx.session.mailingCreateStep & !ctx.session.addadmin & !ctx.session.adminname) {
        if (type === 'text') {
            if (ctx.message.text[0] == '@') {
                findDialog(ctx, ctx.message.text)
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
        if (ctx.session.mailingCreateStep == 3) {
            try {
                const mailing = await Mailing.findOne({where: {sent: String(ctx.chat.id)}})
                mailing.date = ctx.message.text
                await mailing.save()
                dateNow = new Date(Date.now())
                timeConverter(ctx.message.text)
                timer = (dates.newDate - dateNow) / 1000
                sendTime(timer, ctx, mailing.text, mailing.fileId, mailing.date, mailing.roles, mailing.type)
            } catch (e) {
                console.log(e)
                ctx.reply('❗️Указан неправильный формат даты! Повторите попытку')
                ctx.session.mailingCreateStep = 3
            }
        }
        if (ctx.session.mailingCreateStep == 2) {
            try {
                const mailing = await Mailing.findOne({where: {sent: String(ctx.chat.id)}})
                mailing.roles = ctx.message.text
                console.log(ctx.chat.id)
                console.log(mailing.sent)
                await mailing.save()
                ctx.session.mailingCreateStep = 3
                dateNow = new Date(Date.now())
                ctx.replyWithHTML('Необходимо указать дату и время (по мск) в формате:\n\n<code>' + dateNow.toLocaleString('ru-ru').slice(0, -3) + '</code>')
            } catch {
                ctx.reply('❗️Указана неправильная категория пользователя! Повторите попытку')
                ctx.session.mailingCreateStep = 2
            }
        }
        if (ctx.session.mailingCreateStep == 1) {
            if (type === 'text') {
                const mailing = await Mailing.create({ text: String(ctx.message.text), type: 'text', sent: String(ctx.chat.id), create_by: '@' + ctx.message.from.username})
                ctx.replyWithHTML('Вы уверены, что хотите отправить рассылку\n❗️<b>Данное сообщение придет всем пользователям</b>\n\nТекст рассылки:\n\n' + mailing.text, constvalue.mailingQuest)
            } else {
                if (type === 'photo') {
                    const mailing = await Mailing.create({ text: String(ctx.message.caption), fileId: String(ctx.message.photo[1].file_id), type: 'photo', sent: String(ctx.chat.id), create_by: '@' + ctx.message.from.username})
                    await ctx.replyWithPhoto(mailing.fileId, { caption: mailing.text, parse_mode: "HTML" })
                    await ctx.replyWithHTML(constvalue.mailingWarning, constvalue.mailingQuest)
                }
                if (type === 'animation') {
                    const mailing = await Mailing.create({ text: String(ctx.message.caption), fileId: String(ctx.message.animation.file_id), type: 'animation', sent: String(ctx.chat.id), create_by: '@' + ctx.message.from.username})
                    await ctx.replyWithAnimation(mailing.fileId, { caption: mailing.text, parse_mode: "HTML" })
                    await ctx.replyWithHTML(constvalue.mailingWarning, constvalue.mailingQuest)
                }
                if (type === 'video') {
                    const mailing = await Mailing.create({ text: String(ctx.message.caption), fileId: String(ctx.message.video.file_id), type: 'video', sent: String(ctx.chat.id), create_by: '@' + ctx.message.from.username})
                    await ctx.replyWithVideo(mailing.fileId, { caption: mailing.text, parse_mode: "HTML" })
                    await ctx.replyWithHTML(constvalue.mailingWarning, constvalue.mailingQuest)
                }
            }
        }

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