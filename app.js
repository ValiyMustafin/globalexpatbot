const { Telegraf, Markup, session } = require('telegraf')
require('dotenv').config()
const constvalue = require('./components/const')
const keywords = require('./keywords/keywords')
const buttons = require('./components/buttons')
const dates = require('./components/mailing')
const {restartMailing} = require('./components/mailing')
const { countVersion, click_version } = require('./keywords/keywords')
const { Messages } = require('./components/sendMessages')
const { Start } = require('./components/start')
const { Finish, Answers, sendAnswers } = require('./components/commands')
const { sendQuestion, adminListFunc, mailingTime, mailingCancel, mailingCreate, mailingList, Actions } = require('./components/buttons')
const sequelize = require('./db/db')
const { User, Mailing } = require('./db/models')

const start_db = async () => {
  try {
    await sequelize.authenticate()
    await sequelize.sync()
  } catch (e) {
    console.log(e)
  }
}

start_db()

const bot = new Telegraf(process.env.BOT_TOKEN)
if (process.env.BOT_TOKEN === undefined) {
  throw new Error('BOT_TOKEN must be provided!')
}

bot.use(session())


bot.command('restart', ctx => {
  if (ctx.chat.id == 408178231) {
    restartMailing(ctx)
  }
})

bot.command('start', async (ctx) => {
  try {
    Start(ctx)
  } catch (e) {
    console.log(e)
  }
})

bot.catch((err) => {
  console.log('Ooops', err)
})

bot.command('test', async (ctx) => {
  bot.catch((err) => {
    console.log('Ooops', err)
  })
  try {
    bot.catch((err) => {
      console.log('Ooops', err)
    })
    await ctx.telegram.sendMessage('408178231', 'тест', { parse_mode: "HTML" })
  } catch (e) {
    console.log(e)
  }
})

bot.hears('👥 Служба поддержки', async (ctx) => {
  const user = await User.findOne({ where: { chatId: String(ctx.chat.id) } })
  if (user.role == 'admin') {
    await ctx.reply('Чтобы получить доступ к ссылкам на сообщения, необходимо присоединиться к группе: https://t.me/+QHfYDVPWSgY1Yjli', Markup.inlineKeyboard(
      [
        [Markup.button.callback('Найти диалог', 'findDialog')]
      ]))
  }
})

bot.hears('✉️ Рассылка', async (ctx) => {
  const user = await User.findOne({ where: { chatId: String(ctx.chat.id) } })
  if (user.role == 'admin') {
    await ctx.reply('Управление рассылками', Markup.inlineKeyboard(
      [
        [Markup.button.callback('Создать рассылку', 'mailing_create')]
      ]))
  }
})

bot.hears('⚙️ Настройки', async (ctx) => {
  const user = await User.findOne({ where: { chatId: String(ctx.chat.id) } })
  if (user.role == 'admin') {
    await ctx.reply('Настройки бота', Markup.inlineKeyboard(
      [
        [Markup.button.callback('Вывести список администраторов', 'adminList')]
      ]))
  }
})

bot.action('adminList', async (ctx) => {
  try {
    adminListFunc(ctx)
  } catch (e) {
    console.log(e)
  }
})

bot.action('adminAdd', async (ctx) => {
  try {
    ctx.session ??= { addadmin: 0 }
    await ctx.answerCbQuery()
    ctx.editMessageText('Отправьте, пожалуйста, логин (например, @login) пользователя, которого вы планируете сделать администратором', Markup.inlineKeyboard(
      [
        [Markup.button.callback('⬅️Отменить добавление администратора', 'adminList')]
      ]))
    ctx.session.addadmin = 1
  } catch (e) {
    console.log(e)
  }
})

bot.action('adminSource', async (ctx) => {
  try {
    ctx.session ??= { addadmin: 0 }
    await ctx.answerCbQuery()
    ctx.replyWithHTML('Ссылка для приглашения администаторов\n\n<code>https://t.me/globalexpat_bot?start=LnLH7DmMtH57uS4W</code>')
    ctx.session.addadmin = 1
  } catch (e) {
    console.log(e)
  }
})

bot.action('adminSetting', async (ctx) => {
  try {
    await ctx.answerCbQuery()
    await ctx.editMessageText('Настройки бота', Markup.inlineKeyboard(
      [
        [Markup.button.callback('Вывести список администраторов', 'adminList')]
      ]))
  } catch (e) {
    console.log(e)
  }
})

bot.action('adminDelete', async (ctx) => {
  try {
    adminList = 'Список администраторов:\n\nДля того, чтобы удалить администратора, пропишите команду рядом с администратором, которого вы удаляете\n\n'
    await ctx.answerCbQuery()
    const users = await User.findAll({ where: { role: 'admin' } });
    usersList = JSON.stringify(users, null, 2)
    const usersObj = JSON.parse(usersList);
    const count = await User.count({ where: { role: 'admin' } })
    for (var i = 0; i < count; i++) {
      if (usersObj[i].username != '@' + ctx.from.username) {
        adminList = adminList.concat('- /del' + usersObj[i].id + ' ' + usersObj[i].name + ' | ' + usersObj[i].username + '\n')
      }
    }
    ctx.editMessageText(adminList, Markup.inlineKeyboard(
      [
        [Markup.button.callback('⬅️Отменить удаление администратора', 'adminList')]
      ]))
  } catch (e) {
    console.log(e)
  }
})

allAdmins()
function allAdmins() {
  for (i = 0; i < 150; i++) {
    deleteAdmin('del' + i)
  }
}

function deleteAdmin(comm) {
  bot.command(comm, async (ctx) => {
    try {
      const user = await User.findOne({ where: { chatId: String(ctx.chat.id) } })
      if (user.role == 'admin') {
        del_id = comm.split('del').pop()
        console.log(del_id)
        const deladmin = await User.findOne({ where: { id: del_id } })
        deladmin.role = 'user'
        await deladmin.save()
        ctx.reply('✅Пользователю ' + deladmin.username + ' успешно закрыта роль администратора')
        await ctx.telegram.sendMessage(deladmin.chatId, 'Пользователь @' + ctx.message.from.username + ' закрыл вам роль администратора', {
          reply_markup: { remove_keyboard: true },
        })
      }
    } catch (e) {
      console.log(e)
    }
  })
}


//ЗАВЕРШЕНИЕ ОБСУЖДЕНИЯ
bot.command('finish', async (ctx) => {
  try {
    Finish(ctx)
  } catch (e) {
    console.log(e)
  }
})

//ГОТОВЫЕ ОТВЕТЫ
bot.command('answers', async (ctx) => {
  try {
    Answers(ctx)
  } catch (e) {
    console.log(e)
  }
})

allAnswers()

function allAnswers() {
  countVersion()
  for (i = 0; i < keywords.countVer; i++) {
    sendReadyAnswer('btn_q' + i)
  }
}

function sendReadyAnswer(comm) {
  bot.command(comm, async (ctx) => {
    try {
      sendAnswers(ctx, comm)
    } catch (e) {
      console.log(e)
    }
  })
}

//ТЕКСТОВЫЕ СООБЩЕНИЯ
bot.on('text', async (ctx) => {
  try {
    Messages(ctx, 'text')
  } catch (e) {
    console.log(e)
  }
})

//СКРИНЫ
bot.on('photo', async (ctx) => {
  try {
    Messages(ctx, 'photo')
  } catch (e) {
    console.log(e)
  }
})

//ГИФКИ
bot.on('animation', async (ctx) => {
  try {
    Messages(ctx, 'animation')
  } catch (e) {
    console.log(e)
  }
})

//ВИДЕО
bot.on('video', async (ctx) => {
  try {
    Messages(ctx, 'video')
  } catch (e) {
    console.log(e)
  }
})

//ФАЙЛ
bot.on('document', async (ctx) => {
  try {
    Messages(ctx, 'document')
  } catch (e) {
    console.log(e)
  }
})

//ГОЛОСОВУХИ
bot.on('voice', async (ctx) => {
  try {
    Messages(ctx, 'voice')
  } catch (e) {
    console.log(e)
  }
})

//ПЕРЕДАТЬ ВОПРОС СЛУЖБЕ ПОДДЕРЖКИ
bot.action('btn_n', async (ctx) => {
  try {
    sendQuestion(ctx)
  } catch (e) {
    console.log(e)
  }
})

bot.action('mailing_t', async (ctx) => {
  try {
    mailingTime(ctx)
  } catch (e) {
    console.log(e)
  }
})

bot.action('mailing_n', async (ctx) => {
  try {
    mailingCancel(ctx)
  } catch (e) {
    console.log(e)
  }
})

bot.action('mailing_create', async (ctx) => {
  try {
    mailingCreate(ctx)
  } catch (e) {
    console.log(e)
  }
})


bot.action('mailing_list', (ctx) => {
  try {
    mailingList(ctx)
  } catch (e) {
    console.log(e)
  }
})

allTriggers()

function allTriggers() {
  for (trigger of buttons.triggers) {
    clickTrigger(trigger)
  }
}

function clickTrigger(trigger) {
  bot.action(trigger, async (ctx) => {
    try {
      Actions(ctx, trigger)
    } catch (e) {
      console.log(e)
    }
  })
}


bot.action('findDialog', async (ctx) => {
  try {
    ctx.reply('Пропишите юзернейм пользователя (в формате @login)')
  } catch (e) {
    console.log(e)
  }
})
//ОТВЕТЫ НА ПРЕДЛОЖЕННЫЕ ВАРИАНТЫ

allActions()

function answerAction(btnId) {
  try {
    bot.action(btnId, async (ctx) => {
      click_version(btnId)
      await ctx.answerCbQuery()
      await ctx.editMessageText(keywords.answer, { parse_mode: "HTML" })
      await ctx.replyWithHTML(constvalue.ifcannothelptext, Markup.inlineKeyboard(
        [keywords.sendtoservice]))
    })
  } catch (e) {
    console.log(e)
  }
}

function allActions() {
  countVersion()
  for (i = 0; i < keywords.countVer; i++) {
    answerAction('btn_q' + i)
  }
}


bot.start()

bot.launch()
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))