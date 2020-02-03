/*
 * This example shows how to setup custom 'switch page' function
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
            // using array of image links this time
            const pages = [
                'https://amusementclub.nyc3.cdn.digitaloceanspaces.com/cards/blends/3_rub_my_head.gif',
                'https://amusementclub.nyc3.cdn.digitaloceanspaces.com/cards/blends/3_spin_me_round.gif',
                'https://amusementclub.nyc3.cdn.digitaloceanspaces.com/cards/blends/2_dog_owner.gif',
                'https://amusementclub.nyc3.cdn.digitaloceanspaces.com/cards/blends/2_fiery_mafuyu.gif'
            ]

            const embed = { 
                title: 'Custom Switch Page', 
                description: 'This description is not paginated',
                footer: { text: 'This custom footer wont show current page' },
                image: { url: '' } // paginator will automatically set the first page
            }

            // we will switch images of the embed instead of description
            pgn.addPagination(msg.author.id, msg.channel.id, { 
                pages, 
                embed,
                switchPage: (data) => data.embed.image.url = data.pages[data.pagenum],
            })
        }
    })

    bot.on('messageReactionAdd', async (msg, emoji, userID) => {
        pgn.trigger(userID, msg, emoji.name)
    })

    bot.connect()
}

main()
