/*
 * A simple example for very basic pagination
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

    /* Type '/pages' in chat that bot has access to */
    bot.on('messageCreate', async (msg) => {
        if(msg.content.startsWith('/pages')) {
            const pages = []
            for(let i=0; i<5; i++)
                pages.push(`page ${i + 1}`)

            const embed = { title: 'Simple Example' }
            pgn.addPagination(msg.author.id, msg.channel.id, { pages, embed })
        }
    })

    bot.on('messageReactionAdd', async (msg, emoji, userID) => {
        pgn.trigger(userID, msg, emoji.name)
    })

    bot.connect()
}

main()
