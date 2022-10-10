const { Telegraf, Markup, session } = require('telegraf')
require('dotenv').config()
const constvalue = require('./const')
const { repeatedMsg } = require('./sendMessages')
const { User, Mailing } = require('../db/models')

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.use(session())


async function Actions(ctx, trigger) {
    await ctx.answerCbQuery()
    if (trigger === 'mailing_setting') {
    }
    if (trigger === 'mailing_delete') {
    }
    if (trigger === 'mailing_create') {
        mailingCreate(ctx)
    }
    if (trigger === 'mailing_exit') {
        mailingExit(ctx)
    }
}

const triggers = [
    'mailing_setting',
    'mailing_delete',
    'mailing_create',
    'mailing_exit'
]
module.exports.triggers = triggers

async function sendQuestion(ctx) {
    await ctx.answerCbQuery()
    ctx.session ??= { question: 0, question_photo: 0, question_video: 0, question_document: 0, scene: 0 }
    const user = await User.findOne({ where: { chatId: String(ctx.chat.id) } })
    if (!user.dialog_msgId) {
        setTimeout(() => {
            ctx.session.dialog = 0
        }, constvalue.timeout)
        if (user.name == 'неизвестно') {
            await ctx.editMessageText('Чтобы отправить запрос в службу поддержки, уточните, пожалуйста, ваше имя')
            ctx.session.scene = 1
        } else {
            if (user.name == 'неизвестно') {
                await ctx.reply('Чтобы отправить запрос в службу поддержки, уточните, пожалуйста, ваше имя')
                ctx.session.scene = 1
            } else {
                if (ctx.session.question_photo) {
                    await ctx.telegram.sendPhoto(process.env.CHANNEL_ID, ctx.session.question_photo, { caption: '🔷Диалог с ' + user.name + ' | @' + ctx.chat.username + ' | телефон: ' + user.phone + ' | id: ' + ctx.chat.id + '\n\n💬' + ctx.session.question + constvalue.finishtext })
                    ctx.session.question_photo = 0
                } else {
                    if (ctx.session.question_video) {
                        await ctx.telegram.sendVideo(process.env.CHANNEL_ID, ctx.session.question_video, { caption: '🔷Диалог с ' + user.name + ' | @' + ctx.chat.username + ' | телефон: ' + user.phone + ' | id: ' + ctx.chat.id + '\n\n💬' + ctx.session.question + constvalue.finishtext })
                        ctx.session.question_video = 0
                    } else {
                        if (ctx.session.question_document) {
                            await ctx.telegram.sendDocument(process.env.CHANNEL_ID, ctx.session.question_document, { caption: '🔷Диалог с ' + user.name + ' | @' + ctx.chat.username + ' | телефон: ' + user.phone + ' | id: ' + ctx.chat.id + '\n\n💬' + ctx.session.question + constvalue.finishtext })
                            ctx.session.question_document = 0
                        } else {
                            await ctx.telegram.sendMessage(process.env.CHANNEL_ID, '🔷Диалог с ' + user.name + ' | @' + ctx.chat.username + ' | телефон: ' + user.phone + ' | id: ' + ctx.chat.id + '\n\n💬' + ctx.session.question + constvalue.finishtext)
                        }
                    }
                }
                await ctx.editMessageText('Ваш вопрос был передан в службу поддержки' + constvalue.worktimetext)
            }
        }
    } else {
        //Повторное сообщение в диалоге
        if (ctx.session.question_photo) {
            repeatedMsg(ctx, 'photo', user, ctx.session.question, ctx.session.question_photo)
            ctx.session.question_photo = 0
        } else {
            if (ctx.session.question_video) {
                repeatedMsg(ctx, 'video', user, ctx.session.question, ctx.session.question_video)
                ctx.session.question_video = 0
            } else {
                if (ctx.session.question_document) {
                    repeatedMsg(ctx, 'document', user, ctx.session.question, ctx.session.question_document)
                    ctx.session.question_document = 0
                } else {
                    repeatedMsg(ctx, 'text', user, ctx.session.question, null)
                }
            }
        }
    }
}

async function adminListFunc(ctx) {
    ctx.session ??= { addadmin: 0 }
    await ctx.answerCbQuery()
    adminList = 'Список администраторов:\n\n'
    const users = await User.findAll({ where: { role: 'admin' } });
    usersList = JSON.stringify(users, null, 2)
    const usersObj = JSON.parse(usersList);
    const count = await User.count({ where: { role: 'admin' } })
    for (var i = 0; i < count; i++) {
        adminList = adminList.concat('- ' + usersObj[i].name + ' | ' + usersObj[i].username + '\n')
    }
    ctx.editMessageText(adminList, Markup.inlineKeyboard(
        [
            [Markup.button.callback('Добавить администратора', 'adminAdd')],
            [Markup.button.callback('Удалить администратора', 'adminDelete')],
            [Markup.button.callback('Ссылка для приглашения администраторов', 'adminSource')],
            [Markup.button.callback('⬅️Назад', 'adminSetting')]
        ]))
    ctx.session.addadmin = 0
}

async function mailingTime(ctx) {
    ctx.session ??= { mailingCreateStep: 0 }
    ctx.session.mailingCreateStep = 2
    await ctx.answerCbQuery()
    await ctx.editMessageText('Укажите категорию пользователей, которым необходимо отправить рассылку:\n\n- <code>user</code>\n- <code>guest</code>', { parse_mode: "HTML" })
}

async function mailingExit(ctx) {
    ctx.session ??= { mailingCreateStep: 0 }
    ctx.session.mailingCreateStep = 0
    await ctx.answerCbQuery()
    await ctx.editMessageText('Управление рассылками', Markup.inlineKeyboard(
        [
            [Markup.button.callback('Создать рассылку', 'mailing_create')]
        ]))
}


async function mailingCancel(ctx) {
    ctx.session ??= { mailingCreateStep: 0 }
    try {
        const mailing = await Mailing.findOne({ where: { sent: String(ctx.chat.id) } })
        mailing.sent = -1
        await mailing.save()
    } catch {
        s = ctx.update.callback_query.message.text
        var mailing_id = s.split('id: ').pop();
        const mailing = await Mailing.findOne({ where: { id: mailing_id } })
        mailing.sent = -1
        await mailing.save()
    }
    await ctx.answerCbQuery()
    await ctx.editMessageText('❌Рассылка отменена')
    ctx.session.mailingCreateStep = 0
}

async function mailingCreate(ctx) {
    ctx.session ??= { mailingCreateStep: 0 }
    ctx.session.mailingCreateStep = 1
    await ctx.editMessageText('Напишите текст для рассылки и/или приложите файл\n\nНастройки редактирования текста:\n📌 Чтобы сделать жирный текст, необходимо обернуть его в конструкцию <b>...</b>\n📌 Чтобы сделать текст курсивом, необходимо обернуть его в конструкцию <i>...</i>\n📌 Чтобы сделать текст ссылкой, необходимо обернуть его в конструкцию <a href="ссылка">...</a>', Markup.inlineKeyboard(
        [
            [Markup.button.callback('↩️Вернуться к настройкам', 'mailing_exit')]
        ]))
}

async function mailingList(ctx) {
    await ctx.answerCbQuery()
    try {
        const mailing = await Mailing.findAll()
        mailingsList = JSON.stringify(mailing, null, 2)
        const mailingsObj = await JSON.parse(mailingsList);
        const count = await Mailing.count()
        console.log()
        if (count != 0) {
            ctx.editMessageText(mailing.id + '/' + count + ' | Дата:  ' + mailing.date, {
                "reply_markup": {
                    "inline_keyboard": [
                        [{ "text": "Следующая➡️", "callback_data": "mailing_next", "hide": false }],
                        [{ "text": "Редактировать", "callback_data": "mailing_setting", "hide": false }],
                        [{ "text": "Отменить", "callback_data": "mailing_delete", "hide": false }],
                        [{ "text": "↩️Вернуться к настройкам", "callback_data": "mailing_exit", "hide": false }]
                    ]
                },
                caption: 'cute kitty'
            })
        } else {
            ctx.editMessageText('Здесь будут показаны рассылки', {
                "reply_markup": {
                    "inline_keyboard": [
                        [{ "text": "↩️Вернуться к настройкам", "callback_data": "mailing_exit", "hide": false }]
                    ]
                },
                caption: 'cute kitty'
            })
        }
    } catch (e) {
        console.log(e)
        ctx.editMessageText('Здесь будут показаны рассылки', {
            "reply_markup": {
                "inline_keyboard": [
                    [{ "text": "↩️Вернуться к настройкам", "callback_data": "mailing_exit", "hide": false }]
                ]
            },
            caption: 'cute kitty'
        })
    }

}

exports.sendQuestion = sendQuestion
exports.adminListFunc = adminListFunc
exports.mailingTime = mailingTime
exports.mailingCancel = mailingCancel
exports.mailingCreate = mailingCreate
exports.mailingList = mailingList
exports.Actions = Actions