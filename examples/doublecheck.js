/*
 * This example shows how to work with confirm
 * Use double check to make sure that your data was not modified
 * after question was asked but before it was confirmed
 * Eris is used as discord library in this example
 * Please put bot token into ./token file
 * to make examples work
*/

const Eris = require('eris')
const paginator = require('../') /* use require('discord-paginator') in your bot */
const token = require('./token')

const main = () => {
    const bot = new Eris(token)
    const pgn = paginator.create({ bot })
    let test = true

    bot.on('ready', event => {
        console.log('Bot ready')
    })

    /* 
     * Type '/question' in chat that bot has access to
     * Type '/toggle' to toggle confirm
     * Try typing /question and /toggle before you confirm it
    */
    bot.on('messageCreate', async (msg) => {
        if(msg.content.startsWith('/question')) {
            const embed = { title: 'Double Confirm Example' }

            /* 
             * This function will be ran twice
             * It is recommended that you include database requests infor your check
             * to make sure you are fetching the latest data
            */
            const check = () => test? false : pgn.sendDecline(msg.channel.id, 'Seems like test is false')

            pgn.addConfirmation(msg.author.id, msg.channel.id, { 
                question: "Would you like to confirm this?", 
                embed,
                check,
                onConfirm: () => {
                    pgn.sendConfirm(msg.channel.id, 'Yaay!')
                    console.log('Dialog has been confirmed')
                },
                // called when data has changed before confirmation
                onError: () => {
                    pgn.sendDecline(msg.channel.id, 'Data was changed before confirmation')
                }
            })
        } else if(msg.content.startsWith('/toggle')) {
            test = !test
            pgn.sendConfirm(msg.channel.id, `Test is now **${test}**`)
        }
    })

    bot.on('messageReactionAdd', async (msg, emoji, userID) => {
        pgn.trigger(userID, msg, emoji.name)
    })

    bot.connect()
}

main()
