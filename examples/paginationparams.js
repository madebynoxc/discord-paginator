/*
 * An example showing usage of parameters
 * Eris is used as discord library in this example
 * Please put bot token into ./token file
 * to make examples work
*/

const Eris = require('eris')
const paginator = require('../') /* use require('discord-paginator') in your bot */
const token = require('./token')

const main = () => {
    const bot = new Eris(token)
    const pgn = paginator.create({ 
        bot,
        expires: 60, // will make dialog expire in 1 minute
        check: 10, // setting dialog expiration check to 10 seconds
        wrap: false, // should pagination wrap when hitting the ends
        chars: { //replacing reaction characters
            first: '⏮️',
            back: '◀️',
            forward: '▶️',
            last: '⏭️',
            close: '🚫',
            accept: '✅',
            reject: '❌'
        }
    })

    bot.on('ready', event => {
        console.log('Bot ready')
    })

    /* Type '/pages otheruserid' in chat that bot has access to */
    bot.on('messageCreate', async (msg) => {
        if(msg.content.startsWith('/pages')) {
            const pages = []
            for(let i=0; i<5; i++)
                pages.push(`brand new page #${i + 1}`)

            const friendID = msg.content.split(' ').map(x => x.trim())[1]
            pgn.addPagination(msg.author.id, msg.channel.id, { 
                pages, 
                embed: { title: 'Param Example', color: 1420012 }, // any embed object is accepted
                buttons: ['first', 'last', 'back', 'forward', 'close'], // including all buttons this time
                perms: [msg.author.id, friendID] // allows me and my friend to switch pages
            })
        }
    })

    bot.on('messageReactionAdd', async (msg, emoji, userID) => {
        pgn.trigger(userID, msg, emoji.name)
    })

    bot.connect()
}

main()
