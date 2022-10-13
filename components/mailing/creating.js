const { Telegraf, session } = require('telegraf')
const { Mailing } = require('../../db/models')
const { sendTime, timeConverter } = require('../mailing/functions')
const dates = require('../mailing/functions')
const constvalue = require('../const')
require('dotenv').config()

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.use(session())

async function CreatingMiling(ctx, type) {
    if (ctx.session.mailingCreateStep == 3) {
        try {
            const mailing = await Mailing.findOne({ where: { sent: String(ctx.chat.id) } })
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
            const mailing = await Mailing.findOne({ where: { sent: String(ctx.chat.id) } })
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
            const mailing = await Mailing.create({ text: String(ctx.message.text), type: 'text', sent: String(ctx.chat.id), create_by: '@' + ctx.message.from.username })
            ctx.replyWithHTML('Вы уверены, что хотите отправить рассылку\n❗️<b>Данное сообщение придет всем пользователям</b>\n\nТекст рассылки:\n\n' + mailing.text, constvalue.mailingQuest)
        } else {
            if (type === 'photo') {
                const mailing = await Mailing.create({ text: String(ctx.message.caption), fileId: String(ctx.message.photo[1].file_id), type: 'photo', sent: String(ctx.chat.id), create_by: '@' + ctx.message.from.username })
                await ctx.replyWithPhoto(mailing.fileId, { caption: mailing.text, parse_mode: "HTML" })
                await ctx.replyWithHTML(constvalue.mailingWarning, constvalue.mailingQuest)
            }
            if (type === 'animation') {
                const mailing = await Mailing.create({ text: String(ctx.message.caption), fileId: String(ctx.message.animation.file_id), type: 'animation', sent: String(ctx.chat.id), create_by: '@' + ctx.message.from.username })
                await ctx.replyWithAnimation(mailing.fileId, { caption: mailing.text, parse_mode: "HTML" })
                await ctx.replyWithHTML(constvalue.mailingWarning, constvalue.mailingQuest)
            }
            if (type === 'video') {
                const mailing = await Mailing.create({ text: String(ctx.message.caption), fileId: String(ctx.message.video.file_id), type: 'video', sent: String(ctx.chat.id), create_by: '@' + ctx.message.from.username })
                await ctx.replyWithVideo(mailing.fileId, { caption: mailing.text, parse_mode: "HTML" })
                await ctx.replyWithHTML(constvalue.mailingWarning, constvalue.mailingQuest)
            }
        }
    }
}

exports.CreatingMiling = CreatingMiling
