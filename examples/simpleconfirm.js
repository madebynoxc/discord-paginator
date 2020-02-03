/*
 * A simple example for very basic confirmation
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

    bot.on('ready', event => {
        console.log('Bot ready')
    })

    /* Type '/question' in chat that bot has access to */
    bot.on('messageCreate', async (msg) => {
        if(msg.content.startsWith('/question')) {
            const embed = { title: 'Simple Example' }

            pgn.addConfirmation(msg.author.id, msg.channel.id, { 
                question: "Would you like to confirm this?", 
                embed,
                onConfirm: () => {
                    pgn.sendConfirm(msg.channel.id, 'Yaay!')
                    console.log('Dialog has been confirmed')
                }
            })
        }
    })

    bot.on('messageReactionAdd', async (msg, emoji, userID) => {
        pgn.trigger(userID, msg, emoji.name)
    })

    bot.connect()
}

main()
