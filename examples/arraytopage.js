/*
 * An example showing how to paginate a big array of data
 * Eris is used as discord library in this example
 * Please put bot token into ./token file
 * to make examples work
*/

const Eris = require('eris')
const LoremIpsum = require('lorem-ipsum').LoremIpsum
const paginator = require('../') /* use require('discord-paginator') in your bot */
const token = require('./token')

const main = () => {
    const bot = new Eris(token)
    const pgn = paginator.create({ bot })
    const lorem = new LoremIpsum({
        sentencesPerParagraph: {
            max: 8,
            min: 4
        },
        wordsPerSentence: {
            max: 8,
            min: 4
        }
    })

    // This is just to generate an array.
    // Values are split by '.'
    const array = lorem.generateSentences(52).split('.').map((x, i) => `${i + 1}. ${x.trim()}`)

    bot.on('ready', event => {
        console.log('Bot ready')
    })

    /* Type '/pages' in chat that bot has access to */
    bot.on('messageCreate', async (msg) => {
        if(msg.content.startsWith('/pages')) {

            // We will use utility to turn array into pages
            // Data array with 12 values per page
            // You can also specify character limit which is 1024 by default (Discord limitation)
            const pages = pgn.getPages(array, 12, 512) 

            pgn.addPagination(msg.author.id, msg.channel.id, { 
                pages, 
                embed: { author: {name: 'Big Array Example'}, color: 1420012 },
            })
        }
    })

    bot.on('messageReactionAdd', async (msg, emoji, userID) => {
        pgn.trigger(userID, msg, emoji.name)
    })

    bot.connect()
}

main()
