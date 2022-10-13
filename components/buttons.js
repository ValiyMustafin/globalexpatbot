const { Telegraf, Markup, session } = require('telegraf')
require('dotenv').config()
const constvalue = require('./const')
const { repeatedMsg } = require('./sendMessages')
const { User } = require('../db/models')
const { addAdmin } = require('./admin/buttons')
const { mailingTime, mailingCancel, mailingCreate, mailingExit } = require('./mailing/buttons/create')
const { mailingList, mailingWaiting, nextMailingList } = require('./mailing/buttons/list')

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.use(session())


async function Actions(ctx, trigger) {
    try {
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
        if (trigger === 'mailing_next') {
            nextMailingList(ctx)
        }
        if (trigger === 'mailing_list') {
            mailingList(ctx)
        }
        if (trigger === 'mailing_waiting') {
            mailingWaiting(ctx)
        }
        if (trigger === 'adminList') {
            adminListFunc(ctx)
        }
        if (trigger === 'adminAdd') {
            addAdmin(ctx)
        }
        if (trigger === 'mailing_t') {
            mailingTime(ctx)
        }
        if (trigger === 'mailing_n') {
            mailingCancel(ctx)
        }
    } catch (e) {
        console.log(e)
    }
}

const triggers = [
    'mailing_list',
    'mailing_setting',
    'mailing_delete',
    'mailing_create',
    'mailing_exit',
    'mailing_next',
    'mailing_waiting',
    'mailing_sent',
    'mailing_canceled',
    'adminList',
    'adminAdd',
    'mailing_t',
    'mailing_n'
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
                await ctx.editMessageText('Ваш вопрос был передан в службу поддержки' + constvalue.worktimetext)
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
            }
        }
    } else {
        await ctx.editMessageText('Ваш вопрос был передан в службу поддержки' + constvalue.worktimetext)
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
            [Markup.button.callback('↩️Назад', 'adminSetting')]
        ]))
    ctx.session.addadmin = 0
}



exports.sendQuestion = sendQuestion
exports.Actions = Actions