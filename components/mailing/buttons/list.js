const { Telegraf, Markup, session } = require('telegraf')
require('dotenv').config()
const { Mailing } = require('../../../db/models')

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.use(session())

function clearMilingButtons() {
    if (mailing_buttons.length > 3) {
        first_buttons = mailing_buttons.length - 3
        for (i = 0; i < first_buttons; i++) {
            mailing_buttons.splice(0, 1)
        }
    }
}

async function mailingList(ctx) {
    await ctx.answerCbQuery()
    try {
        clearMilingButtons()
        await ctx.editMessageText('Выберите статус рассылок', Markup.inlineKeyboard(
            [
                [Markup.button.callback('⏳Ожидают отправки', 'mailing_waiting')],
                [Markup.button.callback('✅Отправленные', 'mailing_sent')],
                [Markup.button.callback('❌Отмененные', 'mailing_canceled')],
                [Markup.button.callback('↩️Назад', 'mailing_exit')]
            ]))

    } catch (e) {
        console.log(e)
    }

}

const mailing_buttons = [[{ "text": "Редактировать", "callback_data": "mailing_setting", "hide": false }],
[{ "text": "Отменить", "callback_data": "mailing_delete", "hide": false }],
[{ "text": "↩️Назад", "callback_data": "mailing_list", "hide": false }]]

async function mailingWaiting(ctx) {
    await ctx.answerCbQuery()
    try {
        const count = await Mailing.count({ where: { sent: '0' } })
        if (count === 0) {
            ctx.editMessageText('❗️Список пуст', Markup.inlineKeyboard(
                [
                    [Markup.button.callback('↩️Назад', 'mailing_list')]
                ]))
        } else {
            const mailing = await Mailing.findAll({ where: { sent: '0' } })
            mailingsList = JSON.stringify(mailing, null, 2)
            const mailingsObj = await JSON.parse(mailingsList)
            text = '⏳Ожидает отправки' + '\n\n' + mailingsObj[0].index + '/' + count + ' Дата и время отправки: ' + mailingsObj[0].date + '\nКому:  ' + mailingsObj[0].roles + ' | Создал: ' + mailingsObj[0].create_by + '\nТекст рассылки:\n\n' + mailingsObj[0].text
            if (count === 1) {
                ctx.editMessageText(text, {
                    "reply_markup": {
                        "inline_keyboard":
                            mailing_buttons
                    }
                })
            } else {
                mailing_buttons.unshift([Markup.button.callback('Следующая➡️', 'mailing_next')])
                ctx.editMessageText(text, {
                    "reply_markup": {
                        "inline_keyboard":
                            mailing_buttons
                    }
                })
            }
        }
    } catch (e) {
        console.log(e)
    }
}

async function nextMailingList(ctx) {
    await ctx.answerCbQuery()
    try {
        var s = ctx.update.callback_query.message.text
        console.log(s[0])
        if (s[0] === '⏳') {
            sent_status = '0'
            mailingStatus = '⏳Ожидает отправки'
            prMailing_index = s[21]
        }
        if (s[0] === '✅') {
            sent_status = '1'
            mailingStatus = '✅Отправлена'
        }
        if (s[0] === '❌') {
            sent_status = '-1'
            mailingStatus = '❌Отменена'
        }
        var prMailing_id = s.split('/');
        
        mailing_id = parseInt(prMailing_id[0]) + 1
        console.log(mailing_id)
        const mailing = await Mailing.findAll({ where: { sent: sent_status } })
        mailingsList = JSON.stringify(mailing, null, 2)
        const mailingsObj = await JSON.parse(mailingsList);
        const count = await Mailing.count({ where: { sent: sent_status } })
        // if (count != 0) {
        //     id = mailingsObj[0].id + 1
        //     text = mailingStatus + '\n\n' + id + '/' + count + ' Дата и время отправки: ' + mailingsObj[0].date + '\nКому:  ' + mailingsObj[0].roles + ' | Создал: ' + mailingsObj[0].create_by + '\nТекст рассылки:\n\n' + mailingsObj[0].text
        //     if (count === id) {
        //         ctx.editMessageText(text, {
        //             "reply_markup": {
        //                 "inline_keyboard": mailing_buttons
        //             },
        //             caption: text
        //         })
        //         ctx.editMessageText(text, {
        //             "reply_markup": {
        //                 "inline_keyboard": [
        //                     [{ "text": "⬅️Предыдущая", "callback_data": "mailing_next", "hide": false }, { "text": "Следующая➡️", "callback_data": "mailing_next", "hide": false }],
        //                     [{ "text": "Редактировать", "callback_data": "mailing_setting", "hide": false }],
        //                     [{ "text": "Отменить", "callback_data": "mailing_delete", "hide": false }],
        //                     [{ "text": "↩️Вернуться к настройкам", "callback_data": "mailing_exit", "hide": false }]
        //                 ]
        //             },
        //             caption: text
        //         })
        //     }
        // }
    } catch (e) {
        console.log(e)
    }
}

exports.mailingList = mailingList
exports.mailingWaiting = mailingWaiting
exports.nextMailingList = nextMailingList