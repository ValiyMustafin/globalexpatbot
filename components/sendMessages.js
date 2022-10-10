const { Telegraf, session, Markup } = require('telegraf')
const { User } = require('../db/models')
require('dotenv').config()
const constvalue = require('./const')
const { sendNotification, adminMessages } = require('./admin')
const keywords = require('../keywords/keywords')
const { setQuestion, findKeyword } = require('../keywords/keywords')
const { updateUsername } = require('./start')
const bot = new Telegraf(process.env.BOT_TOKEN)
bot.use(session())

async function Messages(ctx, type) {
    ctx.session ??= { dialog: 0, messageid: 0, question: 0, scene: 0, mailingCreateStep: 0, addadmin: 0, newadmin: 0, warning: 0, adminname: 0 }
    checkDB(ctx)
    try {
        //Антиспам
        if (!ctx.session.msg_count) {
            ctx.session.msg_count = 1
        } else {
            ctx.session.msg_count++
        }
        if (ctx.session.msg_count < 5) {
            await setTimeout(async () => {
                ctx.session.msg_count--
                ctx.session.warning = 0
            }, 3000)

            //Уточнение имени и телефона
            if (ctx.session.scene) {
                getUserInfo(ctx, type)
            } else {
                //Сообщение пришло в чате поддержки
                if (ctx.chat.id == process.env.CHAT_ID) {
                    chatMessage(ctx, type)
                }
                else {
                    //ОБНОВЛЕНИЕ ЮЗЕРНЕЙМА
                    updateUsername(ctx)
                    //АДМИН
                    const user = await User.findOne({ where: { chatId: String(ctx.chat.id) } })
                    if (user.role == 'admin') {
                        adminMessages(ctx, type)
                    } else {
                        //Начало диалога
                        //Ключевые слова
                        if (type === 'text') {
                            findKeyword(ctx.message.text.toLowerCase())
                            if (isKeyword == true) {
                                keywordFunc(ctx, type)
                                // Вопрос не ясен
                            } else {
                                dontGetQuestion(ctx, type)
                            }
                        } else {
                            //Повторное сообщение в диалоге
                            typeRepeatedMsg(ctx, type, user)
                        }

                    }
                }
            }
        } else {
            antispam(ctx)
        }
    } catch (e) {
        console.log(e)
    }
}

async function checkDB(ctx) {
    try {
        await User.create({ chatId: String(ctx.chat.id), username: '@' + ctx.message.from.username })
    } catch (e) {
    }
}

async function antispam(ctx) {
    await setTimeout(async () => {
        ctx.session.msg_count--
    }, 4000)
    if (ctx.session.warning == 0) {
        ctx.session.warning = 1
        ctx.replyWithHTML(constvalue.spamMsg + ctx.message.text + '\"')
    }
}

async function getUserInfo(ctx, type) {
    if (type === 'text') {
        const user = await User.findOne({ where: { chatId: String(ctx.chat.id) } })
        if (ctx.session.scene == 2) {
            ctx.session ??= { question: 0, question_photo: 0, question_video: 0, question_document: 0, question_voice: 0, scene: 0 }
            if (ctx.message.text.length < 11) {
                await ctx.reply('Укажите, пожалуйста, ваш реальный номер телефона')
            } else {
                ctx.session.scene = 0
                user.phone = ctx.message.text
                user.role = 'user'
                await user.save()
                await ctx.reply('Ваш вопрос был передан в службу поддержки' + constvalue.worktimetext)
                if (ctx.session.question_photo != 0 && ctx.session.question_photo != undefined) {
                    await ctx.telegram.sendPhoto(process.env.CHANNEL_ID, ctx.session.question_photo, { caption: '🔷Диалог с ' + user.name + ' | @' + ctx.chat.username + ' | телефон: ' + user.phone + ' | id: ' + ctx.chat.id + '\n\n💬' + ctx.session.question + constvalue.finishtext })
                    ctx.session.question_photo = 0
                } else {
                    if (ctx.session.question_video != 0 && ctx.session.question_video != undefined) {
                        await ctx.telegram.sendVideo(process.env.CHANNEL_ID, ctx.session.question_video, { caption: '🔷Диалог с ' + user.name + ' | @' + ctx.chat.username + ' | телефон: ' + user.phone + ' | id: ' + ctx.chat.id + '\n\n💬' + ctx.session.question + constvalue.finishtext })
                        ctx.session.question_video = 0
                    } else {
                        if (ctx.session.question_document != 0 && ctx.session.question_document != undefined) {
                            await ctx.telegram.sendDocument(process.env.CHANNEL_ID, ctx.session.question_document, { caption: '🔷Диалог с ' + user.name + ' | @' + ctx.chat.username + ' | телефон: ' + user.phone + ' | id: ' + ctx.chat.id + '\n\n💬' + ctx.session.question + constvalue.finishtext })
                            ctx.session.question_document = 0
                        } else {
                            if (ctx.session.question_voice != 0 && ctx.session.question_voice != undefined) {
                                await ctx.telegram.sendVoice(process.env.CHANNEL_ID, ctx.session.question_voice, { caption: '🔷Диалог с ' + user.name + ' | @' + ctx.chat.username + ' | телефон: ' + user.phone + ' | id: ' + ctx.chat.id + '\n\n💬' + ctx.session.question + constvalue.finishtext })
                                ctx.session.question_voice = 0
                            } else {
                                await ctx.telegram.sendMessage(process.env.CHANNEL_ID, '🔷Диалог с ' + user.name + ' | @' + ctx.chat.username + ' | телефон: ' + user.phone + ' | id: ' + ctx.chat.id + '\n\n💬' + ctx.session.question + constvalue.finishtext)
                            }
                        }
                    }
                }
            }
        }
        if (ctx.session.scene == 1) {
            if (ctx.message.text.length < 2) {
                await ctx.reply('Укажите, пожалуйста, ваше реальное имя')
            } else {
                await ctx.reply('Уточните, пожалуйста, ваш номер телефона')
                user.name = ctx.message.text
                await user.save()
                ctx.session.scene++
            }
        }
    } else {
        if (ctx.session.scene === 1) {
            await ctx.reply('Укажите, пожалуйста, ваше имя простым текстом')
        }
        if (ctx.session.scene === 2) {
            await ctx.reply('Укажите, пожалуйста, ваш номер телефона простым текстом')
        }
    }
}

async function chatMessage(ctx, type) {
    if (type === 'text') {
        if (ctx.message.text.includes('🔷Диалог с')) {
            var s = ctx.message.text;
            var res = s.split('id: ').pop();
            var res2 = res.split('💬').pop();
            var res3 = res.slice(0, -1 * res2.length - 4);
            const user = await User.findOne({ where: { chatId: res3 } })
            user.dialog_msgId = ctx.message.message_id
            user.channel_msgId = ctx.message.forward_from_message_id
            await user.save()
        } else {
            if (ctx.message.reply_to_message.text) {
                if (ctx.message.reply_to_message.text.includes('🔷Диалог с')) {
                    var s = ctx.message.reply_to_message.text;
                    var res = s.split('id: ').pop();
                    var res2 = res.split('💬').pop();
                    var res3 = res.slice(0, -1 * res2.length - 4);
                    await ctx.telegram.sendMessage(res3, '👤 ' + ctx.message.text)
                }
            }
            if (ctx.message.reply_to_message.caption) {
                if (ctx.message.reply_to_message.caption.includes('🔷Диалог с')) {
                    var s = ctx.message.reply_to_message.caption;
                    var res = s.split('id: ').pop();
                    var res2 = res.split('💬').pop();
                    var res3 = res.slice(0, -1 * res2.length - 4);
                    await ctx.telegram.sendMessage(res3, '👤 ' + ctx.message.text)
                }
            }
        }
    } else {
        if (ctx.message.caption != undefined) {
            if (ctx.message.caption.includes('🔷Диалог с')) {
                var s = ctx.message.caption;
                var res = s.split('id: ').pop();
                var res2 = res.split('💬').pop();
                var res3 = res.slice(0, -1 * res2.length - 4);
                const user = await User.findOne({ where: { chatId: res3 } })
                user.dialog_msgId = ctx.message.message_id
                user.channel_msgId = ctx.message.forward_from_message_id
                await user.save()
            } else {
                if (ctx.message.reply_to_message.text) {

                    if (ctx.message.reply_to_message.text.includes('🔷Диалог с')) {
                        var s = ctx.message.reply_to_message.text;
                        var res = s.split('id: ').pop();
                        var res2 = res.split('💬').pop();
                        var res3 = res.slice(0, -1 * res2.length - 4);
                        if (ctx.message.caption != null || ctx.message.caption != undefined) {
                            caption_text = ctx.message.caption
                        } else {
                            caption_text = ''
                        }
                        sendFileToUser(ctx, type, caption_text, res3)
                    }
                }

                if (ctx.message.reply_to_message.caption) {

                    if (ctx.message.reply_to_message.caption.includes('🔷Диалог с')) {
                        var s = ctx.message.reply_to_message.caption;
                        var res = s.split('id: ').pop();
                        var res2 = res.split('💬').pop();
                        var res3 = res.slice(0, -1 * res2.length - 4);
                        if (ctx.message.caption != null || ctx.message.caption != undefined) {
                            caption_text = ctx.message.caption
                        } else {
                            caption_text = ''
                        }
                        sendFileToUser(ctx, type, caption_text, res3)
                    }

                }
            }
        } else {
            if (ctx.message.reply_to_message.text) {

                if (ctx.message.reply_to_message.text.includes('🔷Диалог с')) {
                    var s = ctx.message.reply_to_message.text;
                    var res = s.split('id: ').pop();
                    var res2 = res.split('💬').pop();
                    var res3 = res.slice(0, -1 * res2.length - 4);
                    if (ctx.message.caption != null || ctx.message.caption != undefined) {
                        caption_text = ctx.message.caption
                    } else {
                        caption_text = ''
                    }
                    sendFileToUser(ctx, type, caption_text, res3)
                }
            }

            if (ctx.message.reply_to_message.caption) {

                if (ctx.message.reply_to_message.caption.includes('🔷Диалог с')) {
                    var s = ctx.message.reply_to_message.caption;
                    var res = s.split('id: ').pop();
                    var res2 = res.split('💬').pop();
                    var res3 = res.slice(0, -1 * res2.length - 4);
                    if (ctx.message.caption != null || ctx.message.caption != undefined) {
                        caption_text = ctx.message.caption
                    } else {
                        caption_text = ''
                    }
                    sendFileToUser(ctx, type, caption_text, res3)
                }

            }
        }
    }
}

async function sendFileToUser(ctx, type, caption_text, user_id) {
    if (type === 'photo') {
        await ctx.telegram.sendPhoto(user_id, ctx.message.photo[1].file_id, { caption: '👤 ' + caption_text })
    }
    if (type === 'animation') {
        await ctx.telegram.sendAnimation(user_id, ctx.message.animation.file_id, { caption: '👤 ' + caption_text })
    }
    if (type === 'video') {
        await ctx.telegram.sendVideo(user_id, ctx.message.video.file_id, { caption: '👤 ' + caption_text })
    }
    if (type === 'document') {
        await ctx.telegram.sendDocument(user_id, ctx.message.document.file_id, { caption: '👤 ' + caption_text })
    }
    if (type === 'voice') {
        await ctx.telegram.sendVoice(user_id, ctx.message.voice.file_id, { caption: '👤 ' + caption_text })
    }
}

async function setSessionQuestions(ctx, type) {
    if (type === 'text') {
        ctx.session.question = ctx.message.text
    } else {
        if (ctx.message.caption) {
            ctx.session.question = ctx.message.caption
        } else {
            ctx.session.question = '(сообщение отсутствует)'
        }
        if (type === 'photo') {
            ctx.session.question_photo = ctx.message.photo[1].file_id
        }
        if (type === 'animation') {
            ctx.session.question_gif = ctx.message.animation.file_id
        }
        if (type === 'video') {
            ctx.session.question_video = ctx.message.video.file_id
        }
        if (type === 'document') {
            ctx.session.question_document = ctx.message.document.file_id
        }
        if (type === 'voice') {
            ctx.session.question_voice = ctx.message.voice.file_id
        }
    }
}

async function dontGetQuestion(ctx, type) {
    const user = await User.findOne({ where: { chatId: String(ctx.chat.id) } })
    if (!user.dialog_msgId) {
        setTimeout(() => {
            ctx.session.dialog = 0
        }, constvalue.timeout)
        if (user.name == 'неизвестно') {
            await ctx.reply('Чтобы отправить запрос в службу поддержки, уточните, пожалуйста, ваше имя')
            ctx.session.scene = 1
            setSessionQuestions(ctx, type)
        } else {
            if (user.phone == 'неизвестен') {
                await ctx.reply('Чтобы отправить запрос в службу поддержки, уточните, пожалуйста, ваш номер телефона')
                ctx.session.scene = 2
                setSessionQuestions(ctx, type)
            } else {
                sendToSupportChat(ctx, type)
                await ctx.reply(constvalue.icannothelptext + constvalue.worktimetext)
            }
        }
    } else {
        //Повторное сообщение в диалоге
        typeRepeatedMsg(ctx, type, user)
    }
}

async function typeRepeatedMsg(ctx, type, user) {
    if (type === 'text') {
        repeatedMsg(ctx, type, user, ctx.message.text, null)
    }
    if (type === 'photo') {
        repeatedMsg(ctx, type, user, ctx.message.caption, ctx.message.photo[1].file_id)
    }
    if (type === 'animation') {
        repeatedMsg(ctx, type, user, ctx.message.caption, ctx.message.animation.file_id)
    }
    if (type === 'video') {
        repeatedMsg(ctx, type, user, ctx.message.caption, ctx.message.video.file_id)
    }
    if (type === 'document') {
        repeatedMsg(ctx, type, user, ctx.message.caption, ctx.message.document.file_id)
    }
    if (type === 'voice') {
        repeatedMsg(ctx, type, user, ctx.message.caption, ctx.message.voice.file_id)
    }
}

async function sendToSupportChat(ctx, type) {
    const user = await User.findOne({ where: { chatId: String(ctx.chat.id) } })
    if (type === 'text') {
        await ctx.telegram.sendMessage(process.env.CHANNEL_ID, '🔷Диалог с ' + user.name + ' | @' + ctx.message.from.username + ' | телефон: ' + user.phone + ' | id: ' + ctx.message.from.id + '\n\n💬' + ctx.message.text + constvalue.finishtext)
    } else {
        if (ctx.message.caption) {
            msg_caption = ctx.message.caption
        } else {
            msg_caption = '(сообщение отсутствует)'
        }
        if (type === 'photo') {
            await ctx.telegram.sendPhoto(process.env.CHANNEL_ID, ctx.message.photo[1].file_id, { caption: '🔷Диалог с ' + user.name + ' | @' + ctx.chat.username + ' | телефон: ' + user.phone + ' | id: ' + ctx.chat.id + '\n\n💬' + msg_caption + constvalue.finishtext })
        }
        if (type === 'animation') {
            await ctx.telegram.sendAnimation(process.env.CHANNEL_ID, ctx.message.animation.file_id, { caption: '🔷Диалог с ' + user.name + ' | @' + ctx.chat.username + ' | телефон: ' + user.phone + ' | id: ' + ctx.chat.id + '\n\n💬' + msg_caption + constvalue.finishtext })
        }
        if (type === 'video') {
            await ctx.telegram.sendVideo(process.env.CHANNEL_ID, ctx.message.video.file_id, { caption: '🔷Диалог с ' + user.name + ' | @' + ctx.chat.username + ' | телефон: ' + user.phone + ' | id: ' + ctx.chat.id + '\n\n💬' + msg_caption + constvalue.finishtext })
        }
        if (type === 'document') {
            await ctx.telegram.sendDocument(process.env.CHANNEL_ID, ctx.message.document.file_id, { caption: '🔷Диалог с ' + user.name + ' | @' + ctx.chat.username + ' | телефон: ' + user.phone + ' | id: ' + ctx.chat.id + '\n\n💬' + msg_caption + constvalue.finishtext })
        }
        if (type === 'voice') {
            await ctx.telegram.sendVoice(process.env.CHANNEL_ID, ctx.message.voice.file_id, { caption: '🔷Диалог с ' + user.name + ' | @' + ctx.chat.username + ' | телефон: ' + user.phone + ' | id: ' + ctx.chat.id + '\n\n💬' + msg_caption + constvalue.finishtext })
        }
    }
}

async function repeatedMsg(ctx, type, user, text, file) {
    if ((constvalue.timeout - user.dialog_msgId * 5) < 1) {
        abcTimeout = 1
    } else {
        abcTimeout = constvalue.timeout - user.dialog_msgId * 5
    }
    await setTimeout(async () => {
        if (user.dialog_msgId == 0) {
            abcTimeout = abcTimeout + 3500
        }
    }, abcTimeout - 1000)

    await setTimeout(async () => {
        if (type == 'text') {
            await ctx.telegram.sendMessage(process.env.CHAT_ID, '💬' + user.name + ' | ' + user.username + ' | id: ' + user.chatId + '\n\n' + text + constvalue.finishtext, { reply_to_message_id: user.dialog_msgId })
            sendNotification(ctx, text, user)
        } else {
            if (text) {
                msg_caption = text
            } else {
                msg_caption = '(текст отсутствует)'
            }
            if (type == 'photo') {
                await ctx.telegram.sendPhoto(process.env.CHAT_ID, file, { reply_to_message_id: user.dialog_msgId, caption: '💬' + user.name + ' | ' + user.username + ' | id: ' + user.chatId + '\n\n' + msg_caption + constvalue.finishtext })
                sendNotification(ctx, msg_caption + '\n🖼К сообщению приложен скрин', user)
            }
            if (type == 'animation') {
                await ctx.telegram.sendAnimation(process.env.CHAT_ID, file, { reply_to_message_id: user.dialog_msgId, caption: '💬' + user.name + ' | ' + user.username + ' | id: ' + user.chatId + '\n\n' + msg_caption + constvalue.finishtext })
                sendNotification(ctx, msg_caption + '\n🖼К сообщению приложена гифка', user)
            }
            if (type == 'video') {
                await ctx.telegram.sendVideo(process.env.CHAT_ID, file, { reply_to_message_id: user.dialog_msgId, caption: '💬' + user.name + ' | ' + user.username + ' | id: ' + user.chatId + '\n\n' + msg_caption + constvalue.finishtext })
                sendNotification(ctx, msg_caption + '\n📹К сообщению приложено видео', user)
            }
            if (type == 'document') {
                await ctx.telegram.sendDocument(process.env.CHAT_ID, file, { reply_to_message_id: user.dialog_msgId, caption: '💬' + user.name + ' | ' + user.username + ' | id: ' + user.chatId + '\n\n' + msg_caption + constvalue.finishtext })
                sendNotification(ctx, msg_caption + '\n📄К сообщению приложен документ', user)
            }
            if (type == 'voice') {
                await ctx.telegram.sendVoice(process.env.CHAT_ID, file, { reply_to_message_id: user.dialog_msgId, caption: '💬' + user.name + ' | ' + user.username + ' | id: ' + user.chatId + '\n\n' + msg_caption + constvalue.finishtext })
                sendNotification(ctx, msg_caption + '\n🎤К сообщению приложено аудио', user)
            }
        }
    }, abcTimeout)
}

async function keywordFunc(ctx, type) {
    setTimeout(() => {
        ctx.session.dialog = 0
    }, constvalue.timeoutkw)
    setQuestion(ctx.message.text.toLowerCase())
    setSessionQuestions(ctx, type)
    await ctx.replyWithHTML(constvalue.icanhelptext, Markup.inlineKeyboard(
        keywords.themelist)
    )
}

exports.repeatedMsg = repeatedMsg
exports.Messages = Messages