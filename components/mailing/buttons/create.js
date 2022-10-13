const { Telegraf, Markup, session } = require('telegraf')
require('dotenv').config()
const { Mailing } = require('../../../db/models')
const constmailing = require('./general')

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.use(session())


async function mailingCreate(ctx) {
    ctx.session ??= { mailingCreateStep: 0 }
    ctx.session.mailingCreateStep = 1
    await ctx.editMessageText('Напишите текст для рассылки и/или приложите файл\n\nНастройки редактирования текста:\n📌 Чтобы сделать жирный текст, необходимо обернуть его в конструкцию <b>...</b>\n📌 Чтобы сделать текст курсивом, необходимо обернуть его в конструкцию <i>...</i>\n📌 Чтобы сделать текст ссылкой, необходимо обернуть его в конструкцию <a href="ссылка">...</a>', Markup.inlineKeyboard(
        [
            [Markup.button.callback('↩️Вернуться к настройкам', 'mailing_exit')]
        ]))
}

async function mailingTime(ctx) {
    ctx.session ??= { mailingCreateStep: 0 }
    ctx.session.mailingCreateStep = 2
    // await ctx.answerCbQuery()
    await ctx.editMessageText('Укажите категорию пользователей, которым необходимо отправить рассылку:\n\n- <code>masterclass1</code>\n- <code>masterclass2</code>\n- <code>masterclass2.1</code>\n- <code>user</code>\n- <code>guest</code>', { parse_mode: "HTML" })
}

async function mailingExit(ctx) {
    try {
        ctx.session ??= { mailingCreateStep: 0 }
        ctx.session.mailingCreateStep = 0
        await ctx.answerCbQuery()
        await ctx.editMessageText(constmailing.mailingFirstText, Markup.inlineKeyboard(
            constmailing.mailingFirstKeyboard))
    } catch (e) {
        console.log(e)
    }
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

exports.mailingTime = mailingTime
exports.mailingCancel = mailingCancel
exports.mailingCreate = mailingCreate
exports.mailingExit = mailingExit