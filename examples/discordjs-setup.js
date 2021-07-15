/*
 * An example showing usage of discord.js and discord-paginator
 * Discord.js is used as the discord library in this example
 * This will NOT work in this examples file.
 * And I (Mj11jM) do NOT guarantee that this code will function in the future or is proper for discord.js
 * It does however work
*/

const Discord = require('discord.js');
const paginator = require('discord-paginator')
const token = require('./token')

// Note we create the client here
const bot = new Discord.Client();

//And immediately start adding functions to the base of it.
bot.createMessage = async (channelID, content) => {
    const channel = bot.channels.cache.get(channelID)
    return await channel.send(content)
}

bot.editMessage = async (channelID, messageID, content) => {
    const channel = bot.channels.cache.get(channelID)
    const message = await channel.messages.fetch(messageID)
    return await message.edit(content)
}

bot.deleteMessage = async (channelID, messageID, reason = '') => {
    const channel = bot.channels.cache.get(channelID)
    const message = await channel.messages.fetch(messageID)
    await message.delete({reason: reason})
}

bot.removeMessageReaction = async (channelID, messageID, reaction, userID) => {
    const channel = bot.channels.cache.get(channelID)
    const message = await channel.messages.fetch(messageID)
    const reactions = message.reactions.cache.filter(reaction => reaction.users.cache.has(userID))
    await reactions.map(async x => {await x.users.remove(userID)})
}

bot.removeMessageReactions = async (channelID, messageID) => {
    const channel = bot.channels.cache.get(channelID)
    const message = await channel.messages.fetch(messageID)
    await message.reactions.removeAll()
}

bot.addMessageReaction = async (channelID, messageID, reaction_char) => {
    const channel = bot.channels.cache.get(channelID)
    const message = await channel.messages.fetch(messageID)
    await message.react(reaction_char)
}
//If you have named your bot variable something besides bot, replace the {bot} with {bot: bot_variable_here}
const pgn = paginator.create({ bot, pgnButtons: ['first', 'last', 'back', 'forward']  })


bot.once('ready', () => {
    console.log('Ready!');
});

bot.on('messageReactionAdd', async (reaction, user) => {
    const member = reaction.message.guild.member(user.id)
    await pgn.trigger(member, reaction.message, reaction.emoji.name)
})

bot.on('message', async (message) => {
    const embed = { title: 'Simple Example' }

    await pgn.addConfirmation(message.author.id, message.channel.id, {
        question: "Would you like to confirm this?",
        embed,
        onConfirm: () => {
            pgn.sendConfirm(message.channel.id, 'Yaay!')
            console.log('Dialog has been confirmed')
        }

    })
    const pages = []
    for(let i=0; i<5; i++)
        pages.push(`page ${i + 1}`) // generate some pages

    await pgn.addPagination(message.author.id, message.channel.id, { pages, embed })
})

bot.login(token);