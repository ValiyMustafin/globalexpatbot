const schedule = require('node-schedule');
const { Telegraf, session, Markup } = require('telegraf')
const { User, Mailing } = require('../db/models')
const constvalue = require('./const')

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.use(session())



async function sendTime(time, ctx, text, file_id, date, mrole, type) {
    if (time < 0) {
        ctx.reply('❗️Дата рассылки не может быть раньше текущей даты')
    } else {
        const mailing = await Mailing.findOne({ where: { sent: String(ctx.chat.id) } })
        mailing.sent = 0
        await mailing.save()
        ctx.session ??= { mailingCreateStep: 0 }
        ctx.session.mailingCreateStep = 0
        ctx.reply('📣Рассылка будет отправлена в ' + date + ' id: ' + mailing.id, Markup.inlineKeyboard(
            [
                [Markup.button.callback('Отменить рассылку', 'mailing_n')]
            ]))
        new schedule.scheduleJob({ start: new Date(Date.now() + Number(time) * 1000), end: new Date(new Date(Date.now() + Number(time) * 1000 + 1000)), rule: '*/1 * * * * *' }, async function () {
            if (mailing.sent === 0) {
                console.log(file_id)
                mroleArr = mrole.split(', ')
                mroleСount = mroleArr.length - 1
                const fr = async r => {
                    if (r > mroleСount) {
                        mailing.sent = 1
                        await mailing.save()
                        finishtext = '✅Рассылка (id: ' + mailing.id + ') отправлена <b>' + mailing.count_success + '</b> пользователям из ' + '<b>' + mailing.all_count + '</b> (заблокировали бота: <b>' + mailing.count_unsuccess + '</b>) с ролью: <b>' + mrole + '</b>'
                        ctx.replyWithHTML(finishtext)
                        return;
                    }
                    const users = await User.findAll({ where: { role: mroleArr[r] } })
                    usersList = JSON.stringify(users, null, 2)
                    const usersObj = await JSON.parse(usersList);
                    const count = await User.count({ where: { role: mroleArr[r] } })
                    mailing.all_count = mailing.all_count + count
                    await mailing.save()
                    const f = async i => {
                        if (i >= count) {
                            fr(r + 1)
                        } else {
                            try {
                                setTimeout(async () => {
                                    try {
                                        irep = i + 1
                                        if (type === 'photo') {
                                            try {
                                                await ctx.telegram.sendPhoto(usersObj[i].chatId, file_id, { caption: text, parse_mode: "HTML" })
                                                mailing.count_success = mailing.count_success + 1
                                                await mailing.save()
                                            } catch (e) {
                                                mailing.count_unsuccess = mailing.count_unsuccess + 1
                                                await mailing.save()
                                                Unsuccess(usersObj[i].chatId)
                                            }
                                        }
                                        if (type === 'animation') {
                                            try {
                                                await ctx.telegram.sendAnimation(usersObj[i].chatId, file_id, { caption: text, parse_mode: "HTML" })
                                                mailing.count_success = mailing.count_success + 1
                                                await mailing.save()
                                            } catch (e) {
                                                mailing.count_unsuccess = mailing.count_unsuccess + 1
                                                await mailing.save()
                                                Unsuccess(usersObj[i].chatId)
                                            }
                                        }
                                        if (type === 'video') {
                                            try {
                                                await ctx.telegram.sendVideo(usersObj[i].chatId, file_id, { caption: text, parse_mode: "HTML" })
                                                mailing.count_success = mailing.count_success + 1
                                                await mailing.save()
                                            } catch (e) {
                                                mailing.count_unsuccess = mailing.count_unsuccess + 1
                                                await mailing.save()
                                                Unsuccess(usersObj[i].chatId)
                                            }
                                        }
                                        if (type === 'text') {
                                            try {
                                                await ctx.telegram.sendMessage(usersObj[i].chatId, text, { parse_mode: "HTML" })
                                                mailing.count_success = mailing.count_success + 1
                                                await mailing.save()
                                            } catch (e) {
                                                mailing.count_unsuccess = mailing.count_unsuccess + 1
                                                await mailing.save()
                                                Unsuccess(usersObj[i].chatId)
                                            }
                                        }
                                    }
                                    catch (e) {
                                        console.log(e)
                                    }
                                    await f(i + 1);
                                }, i * 100);
                            }
                            catch (e) {
                                console.log(e)
                            }
                        }
                    };
                    f(0)
                }
                fr(0)
            }
        });
    }
}

async function Unsuccess(chat_id) {
    const user = await User.findOne({ where: { chatId: chat_id } })
    user.role = 'block'
    await user.save()
}

function timeConverter(date) {
    dmArr = date.split('.')
    yaerStr = dmArr[2].split(', ')
    timreStr = yaerStr[1].split(':')
    var newDate = new Date(yaerStr[0], dmArr[1] - 1, dmArr[0], timreStr[0], timreStr[1]);
    module.exports.newDate = newDate
    return newDate;
}


async function restartMailing(ctx) {
    try {
        const mailings = await Mailing.findAll({ where: { sent: '0' } })
        mailingsList = JSON.stringify(mailings, null, 2)
        const mailingsObj = await JSON.parse(mailingsList);
          dateNow = new Date(Date.now())
          timeConverter(mailings.date)
          timer = (dates.newDate - dateNow) / 1000
        const count = await Mailing.count({ where: { sent: '0' } })
        for (var i = 0; i < count; i++) {
            console.log(mailingsObj[i].date)
            sendTime(timer, ctx, mailingsObj[i].text, mailingsObj[i].fileId, mailingsObj[i].date, mailingsObj[i].roles, mailingsObj[i].type)
        }
    } catch (e) {
        console.log(e)
    }
}

exports.timeConverter = timeConverter
exports.sendTime = sendTime
exports.restartMailing = restartMailing