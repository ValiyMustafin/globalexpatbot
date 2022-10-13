const { Telegraf, session } = require('telegraf')
const { User } = require('../db/models')
const constvalue = require('./const')
require('dotenv').config()
const keywords = require('../keywords/keywords')
const { findKeyword, readymadeAnswers, click_version } = require('../keywords/keywords')

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.use(session())

async function Finish(ctx) {
    if (ctx.chat.id == process.env.CHAT_ID) {
        if (ctx.message.reply_to_message.text != undefined) {
            if (ctx.message.reply_to_message.text.includes('🔷Диалог с')) {
                var s = ctx.message.reply_to_message.text;
                var res = s.split('id: ').pop();
                var res2 = res.split('💬').pop();
                var res3 = res.slice(0, -1 * res2.length - 4);
                const user = await User.findOne({ where: { chatId: res3 } })
                user.dialog_msgId = 0
                await user.save()
                var res4 = s.split('🔷').pop();
                var res5 = '❌' + res4
                var res6 = res5.split('📖').pop();
                var res7 = res5.slice(0, -1 * res6.length - 4);
                var res8 = res7 + constvalue.wasfinish
                await ctx.telegram.editMessageText(process.env.CHANNEL_ID, ctx.message.reply_to_message.forward_from_message_id, ctx.message.reply_to_message.forward_from_message_id, res8)
            }
        } else if (ctx.message.reply_to_message.caption != undefined) {
            if (ctx.message.reply_to_message.caption.includes('🔷Диалог с')) {
                var s = ctx.message.reply_to_message.caption;
                var res = s.split('id: ').pop();
                var res2 = res.split('💬').pop();
                var res3 = res.slice(0, -1 * res2.length - 4);
                const user = await User.findOne({ where: { chatId: res3 } })
                user.dialog_msgId = 0
                await user.save()
                var res4 = s.split('🔷').pop();
                var res5 = '❌' + res4
                var res6 = res5.split('📖').pop();
                var res7 = res5.slice(0, -1 * res6.length - 4);
                var res8 = res7 + constvalue.wasfinish
                await ctx.telegram.editMessageCaption(process.env.CHANNEL_ID, ctx.message.reply_to_message.forward_from_message_id, ctx.message.reply_to_message.forward_from_message_id, res8)
            }
        }
    }
}


async function Answers(ctx) {
    if (ctx.chat.id == process.env.CHAT_ID) {
        if (ctx.message.reply_to_message.text != undefined) {
            findKeyword(ctx.message.reply_to_message.text.toLowerCase())
            if (isKeyword == true) {
                readymadeAnswers(ctx.message.reply_to_message.text.toLowerCase())
                await ctx.telegram.sendMessage(process.env.CHAT_ID, keywords.answerlist, { reply_to_message_id: ctx.message.message_id, disable_web_page_preview: 'True', parse_mode: "HTML" })
            } else {
                await ctx.telegram.sendMessage(process.env.CHAT_ID, '🤖Готовые ответы не найдены', { reply_to_message_id: ctx.message.message_id })
            }
        } else if (ctx.message.reply_to_message.caption != undefined) {
            findKeyword(ctx.message.reply_to_message.caption.toLowerCase())
            if (isKeyword == true) {
                readymadeAnswers(ctx.message.reply_to_message.caption.toLowerCase())
                await ctx.telegram.sendMessage(process.env.CHAT_ID, keywords.answerlist, { reply_to_message_id: ctx.message.message_id, disable_web_page_preview: 'True', parse_mode: "HTML" })
            } else {
                await ctx.telegram.sendMessage(process.env.CHAT_ID, '🤖Готовые ответы не найдены', { reply_to_message_id: ctx.message.message_id })
            }
        }
    }
}

async function sendAnswers(ctx, comm) {
    if (ctx.chat.id == process.env.CHAT_ID) {
        if (ctx.message.reply_to_message.text != undefined) {
            if (ctx.message.reply_to_message.text.includes('🔷Диалог с')) {
                click_version(comm)
                var s = ctx.message.reply_to_message.text;
                var res = s.split('id: ').pop();
                var res2 = res.split('💬').pop();
                var res3 = res.slice(0, -1 * res2.length - 4);
                await ctx.telegram.sendMessage(res3, '👤 ' + keywords.answer, { parse_mode: "HTML", disable_web_page_preview: 'True' })
                await ctx.telegram.sendMessage(process.env.CHAT_ID, '🤖Ответ был передан клиенту', { reply_to_message_id: ctx.message.message_id })
            }
        } else if (ctx.message.reply_to_message.caption != undefined) {
            if (ctx.message.reply_to_message.caption.includes('🔷Диалог с')) {
                click_version(comm)
                var s = ctx.message.reply_to_message.caption;
                var res = s.split('id: ').pop();
                var res2 = res.split('💬').pop();
                var res3 = res.slice(0, -1 * res2.length - 4);
                await ctx.telegram.sendMessage(res3, '👤 ' + keywords.answer, { parse_mode: "HTML", disable_web_page_preview: 'True' })
                await ctx.telegram.sendMessage(process.env.CHAT_ID, '🤖Ответ был передан клиенту', { reply_to_message_id: ctx.message.message_id })
            }
        }
    }
}
exports.Finish = Finish
exports.Answers = Answers
exports.sendAnswers = sendAnswers