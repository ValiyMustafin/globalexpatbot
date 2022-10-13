
const { Telegraf, session } = require('telegraf')
require('dotenv').config()

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.use(session())

async function addAdmin(ctx) {
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
}

exports.addAdmin = addAdmin