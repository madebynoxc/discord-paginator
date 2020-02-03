/*
 * A simple example exploring confirmation parameters
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

    /* Type '/question otheruserid' in chat that bot has access to */
    bot.on('messageCreate', async (msg) => {
        if(msg.content.startsWith('/question')) {

            const friendID = msg.content.split(' ').map(x => x.trim())[1] || msg.author.id
            pgn.addConfirmation(msg.author.id, msg.channel.id, { 
                question: "Would you like to confirm this?", 
                embed: { title: 'Confirm Example' },

                /* Define your own events */
                onConfirm: () => {
                    pgn.sendConfirm(msg.channel.id, 'Yaay!')
                    console.log('Dialog has been confirmed')
                },
                onDecline: () => {
                    pgn.sendDecline(msg.channel.id, 'Oh No!')
                    console.log('Dialog has been declined')
                },

                perms: {
                    confirm: [friendID], // allow confirm only for other user
                    decline: [friendID, msg.author.id] // allow decline for me and other user
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
