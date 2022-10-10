const { Markup } = require('telegraf')

//Текст
const worktimetext = '\n\nОбращаем внимание, что служба поддержки работает с понедельника по пятницу с 8:00 до 17:00 по мск'
const finishtext = '\n\n📖Чтобы вывести список готовых ответов, пропишите ответным сообщением команду /answers'
const wasfinish = '\n\n🗑Данный диалог закрыт (все отправленные вами сообщения не дойдут до клиента)'
const icanhelptext = 'Я могу помочь вам, уточните к какой тематике относится ваш вопрос\n\nЕсли предложенные варианты вам не подходят, нажмите на последнюю кнопку и ваш вопрос будет передан в службу поддержки'
const icannothelptext = 'К сожалению, я не понял вопроса, передаю его службе поддержки'
const ifcannothelptext = '\n\nЕсли я не смог ответить на ваш вопрос, нажмите на последнюю кнопку, и ваш вопрос будет передан в службу поддержки'
const firstmsgText = 'Приветствуем!\n\nНа связи сообщество русскоязычных экспатов. Здесь вы можете получить ответы на основные вопросы, которые возникают у каждого человека, который уезжает из своей родной страны в новое место. \nДанный бот поможет разобраться с частыми вопросами.\nЕсли у вас более комплексный вопрос, в таком случае подключатся админы этого бота и помогут разобраться.\n\n\n\nНапишите ваш вопрос, а по ключевым словам, мы вам предложим возможные варианты ответов.'
const spamMsg = '❗️Вы отправили слишком много сообщений, попробуйте, пожалуйста, повторить позже\n\n<b>До службы поддержки не дойдет сообщение: </b>\n\n\"'
const mailingWarning = 'Вы уверены, что хотите отправить рассылку\n❗️<b>Данное сообщение придет всем пользователям, категорию которых вы выберете</b>\n\nТекст рассылки⬆️'
module.exports.worktimetext = worktimetext
module.exports.finishtext = finishtext
module.exports.wasfinish = wasfinish
module.exports.icanhelptext = icanhelptext
module.exports.icannothelptext = icannothelptext
module.exports.ifcannothelptext = ifcannothelptext
module.exports.firstmsgText = firstmsgText
module.exports.spamMsg = spamMsg
module.exports.mailingWarning = mailingWarning

//Меню
const adminmenu = [
  ['✉️ Рассылка'],
  ['⚙️ Настройки', '👥 Служба поддержки']
]

const mailingQuest = Markup.inlineKeyboard(
  [
    [Markup.button.callback('Да, продолжить', 'mailing_t')],
    [Markup.button.callback('Отменить рассылку', 'mailing_n')]
  ])

module.exports.adminmenu = adminmenu
module.exports.mailingQuest = mailingQuest

//разное
const timeout = 3500 //время отправки второго сообщения в чат поддержки
const timeoutkw = 500 //время отправки второго сообщения в чат поддержки если слово ключевое

module.exports.timeout = timeout
module.exports.timeoutkw = timeoutkw



