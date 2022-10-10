const { Telegraf, Markup } = require('telegraf')
const fs = require('fs');
const keywordObj = require('./keywords_obj.json');
const bot = new Telegraf(process.env.BOT_TOKEN)

const sendtoservice = [Markup.button.callback('👤Отправить службе поддержки', 'btn_n')]

function setQuestion(search_string) {
    themelist = [sendtoservice]
    for (const id of Object.getOwnPropertyNames(keywordObj)) {
        const { keyword, question, btn_id } = keywordObj[id];
        if (keyword != undefined) {
            for (var j = 0; j < keyword.length; j++) {
                if (search_string.includes(keyword[j].toLowerCase())) {
                    themelist.unshift([Markup.button.callback(question, btn_id)])
                    break
                }
            }
        }
    }
    module.exports.themelist = themelist
}

function readymadeAnswers(search_string) {
    answerlist = '🤖Список готовых ответов:\n\n'
    for (const id of Object.getOwnPropertyNames(keywordObj)) {
        const { keyword, answer, btn_id } = keywordObj[id];
        if (keyword != undefined) {
            for (var j = 0; j < keyword.length; j++) {
                if (search_string.includes(keyword[j].toLowerCase())) {
                    answerlist = answerlist.concat('📌 /' + btn_id + ' - ' + answer + '\n------------------------------------------------------------\n')
                    break
                }
            }
        }
    }
    module.exports.answerlist = answerlist
}

function findKeyword(search_string) {
    isKeyword = false
    for (const id of Object.getOwnPropertyNames(keywordObj)) {
        const { keyword } = keywordObj[id];
        if (keyword != undefined) {
            for (var j = 0; j < keyword.length; j++) {
                if (search_string.includes(keyword[j].toLowerCase())) {
                    isKeyword = true

                }
            }
        }
    }
    module.exports.isKeyword = isKeyword

}

function click_version(btnId) {
    for (const id of Object.getOwnPropertyNames(keywordObj)) {
        const { btn_id, answer } = keywordObj[id];
        if (btn_id != undefined) {
            if (btnId == btn_id) {
                module.exports.answer = answer
                break
            }
        }
    }

}

function countVersion() {
    countVer = Object.getOwnPropertyNames(keywordObj).length
    module.exports.countVer = countVer
}

exports.countVersion = countVersion
exports.setQuestion = setQuestion
exports.findKeyword = findKeyword
exports.click_version = click_version
exports.readymadeAnswers = readymadeAnswers
module.exports.sendtoservice = sendtoservice