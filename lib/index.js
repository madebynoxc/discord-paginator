
const asdate = require('add-subtract-date')
const colors = require('./colors')

/*
* Bot has to implement:
* 'addMessageReaction'
* 'removeMessageReactions'
* 'editMessage'
* 'createMessage'
*/

module.exports.create = (options) => {
    const bot = options.bot
    const chars = options.chars
    let paginations = [], confirmations = []

    const defaultpgn = {
        switchPage: data => data.embed.description = data.pages[data.pagenum],
        embed: options.pgnEmbed,
        pages: ['Start page'],
        buttons: options.pgnButtons
    }

    /* Pagination method */
    const addPagination = async (userID, channelID, params) => {
        const oldpagination = paginations.filter(x => x.userID === userID)[0]
        if(oldpagination && oldpagination.channel && oldpagination.msg)
            await bot.removeMessageReactions(oldpagination.channel, oldpagination.msg)

        paginations = paginations.filter(x => x.userID != userID)

        const pagenum = 0
        const pages = params.pages || defaultpgn.pages
        const obj = Object.assign({
            pagenum, userID,
            perms: [userID],
            footer: { text: `Page 1/${pages.length}` },
            expires: asdate.add(new Date(), options.expires, 'seconds'),
        }, defaultpgn, params)

         if(!obj.color)
            obj.color = colors.pagination

        obj.switchPage(obj)
        paginations.push(obj)

        const msg = await bot.createMessage(channelID, { embed: obj.embed })
        obj.msg = msg.id
        obj.channel = msg.channel.id

        /* 
         * This will throw errors when message was deleted before
         * bot added all reactions.
         * So we just silence them >:D
        */
        try {
            if(obj.pages.length > 1) {
                if(obj.buttons.includes('first')) await bot.addMessageReaction(msg.channel.id, msg.id, chars.first)
                if(obj.buttons.includes('back')) await bot.addMessageReaction(msg.channel.id, msg.id, chars.back)
                if(obj.buttons.includes('forward')) await bot.addMessageReaction(msg.channel.id, msg.id, chars.forward)
                if(obj.buttons.includes('last')) await bot.addMessageReaction(msg.channel.id, msg.id, chars.last)
                if(obj.buttons.includes('close')) await bot.addMessageReaction(msg.channel.id, msg.id, chars.close)
            }
        } catch(e) { 
            paginations = paginations.filter(x => x.userID != userID)
        }
    }

    const defaultcfm = {
        embed: options.cfmEmbed
    }

    /* Confirmation method */
    const addConfirmation = async (userID, channelID, params) => {
        const old = confirmations.filter(x => x.userID === userID)[0]
        if(old && old.channel && old.msg)
            await bot.removeMessageReactions(old.channel, old.msg)

        confirmations = confirmations.filter(x => x.userID != userID)

        const obj = Object.assign({
            userID,
            perms: { confirm: [userID], decline: [userID] },
            onConfirm: () => sendConfirm(channelID),
            onDecline: () => sendDecline(channelID),
            expires: asdate.add(new Date(), options.confirmExpires, 'seconds'),
        }, defaultcfm, params)

        if(!obj.embed.color)
            obj.embed.color = colors.question

        if(!obj.embed.description)
            obj.embed.description = obj.question

        confirmations.push(obj)

        const msg = await bot.createMessage(channelID, { embed: obj.embed })
        obj.msg = msg.id
        obj.channel = msg.channel.id

        /* 
         * This will throw errors when message was deleted before
         * bot added all reactions.
        */
        try {
            await bot.addMessageReaction(msg.channel.id, msg.id, chars.confirm)
            await bot.addMessageReaction(msg.channel.id, msg.id, chars.decline)
        } catch(e) { 
            confirmations = confirmations.filter(x => x.userID != userID)
        }
    }

    const tick = () => {
        if(!bot) return;

        const now = new Date()
        paginations.filter(x => x.expires < now).map(x => bot.removeMessageReactions(x.channel, x.msg))
        paginations = paginations.filter(x => x.expires >= now)

        confirmations.filter(x => x.expires < now).map(async x => {
            await bot.removeMessageReactions(x.channel, x.msg)
            await bot.editMessage(x.channel, x.msg, { embed: {
                description: 'This confirmation dialog has expired',
                color: colors.red
            }})
        })

        confirmations = confirmations.filter(x => x.expires >= now)
    }

    setInterval(tick.bind(this), options.check * 1000)

    /* Catching message reactions for pagination */
    const doSwitch = async (userID, msg, reaction, newpage) => {
        const data = paginations.filter(x => x.msg === msg.id && x.perms.includes(userID))[0]
        if(!data) return

        const oldpage = data.pagenum
        data.pagenum = Math.min(Math.max(newpage(data.pagenum), 0), data.pages.length - 1)
        if(data.pagenum != oldpage) {
            data.switchPage(data)

            if(data.embed.footer.text.startsWith('Page'))
                data.embed.footer.text = `Page ${data.pagenum + 1}/${data.pages.length}`
            await bot.editMessage(msg.channel.id, msg.id, { embed: data.embed })
        }

        await bot.removeMessageReaction(msg.channel.id, msg.id, reaction, userID)
    }

    /* Catching message reactions for confirmation */
    const doResolve = async (userID, msg, reaction) => {
        let data
        if(reaction === chars.confirm) 
            data = confirmations.filter(x => x.msg === msg.id 
                && x.perms.confirm.includes(userID))[0]

        if(reaction === chars.decline)
            data = confirmations.filter(x => x.msg === msg.id 
                && x.perms.decline.includes(userID))[0]

        if(!data) return

        confirmations = confirmations.filter(x => x.msg != msg.id)
        await bot.deleteMessage(msg.channel.id, msg.id)

        if(reaction === chars.confirm) await data.onConfirm()
        if(reaction === chars.decline) await data.onDecline()
    }

    const remove = async (userID, msg) => {
        const data = paginations.filter(x => x.msg === msg.id && x.perms.includes(userID))[0]
        if(!data) return

        paginations = paginations.filter(x => x.msg != msg.id)
        await bot.deleteMessage(msg.channel.id, msg.id, 'Removing pagination')
    }

    const getPages = (array, split = 10) => {
        const pages = []
        array.map((x, i) => {
            if (i % split == 0) pages.push("")
            pages[Math.floor(i/split)] += `${array[i]}\n`
        })

        return pages
    }

    const sendConfirm = (channelID, msg = 'Operation was confirmed!') => 
        bot.createMessage(channelID, { 
            embed: { description: msg, color: colors.confirm }
        })

    const sendDecline = (channelID, msg = 'Operation was declined') => 
        bot.createMessage(channelID, { 
            embed: { description: msg, color: colors.decline }
        })

    /* Go to the first page */
    options.rct(chars.first, (userID, msg) => doSwitch(userID, msg, chars.first, cur => 0))
    /* Go to the previous page */
    options.rct(chars.back, (userID, msg) => doSwitch(userID, msg, chars.back, cur => cur - 1))
    /* Go to the next page */
    options.rct(chars.forward, (userID, msg) => doSwitch(userID, msg, chars.forward, cur => cur + 1))
    /* Go to the last page */
    options.rct(chars.last, (userID, msg) => doSwitch(userID, msg, chars.last, cur => Infinity))
    /* Close the dialog */
    options.rct(chars.close, remove)
    /* Confirm */
    options.rct(chars.confirm, (userID, msg) => doResolve(userID, msg, chars.confirm))
    /* Decline */
    options.rct(chars.decline, (userID, msg) => doResolve(userID, msg, chars.decline))

    return { 
        addPagination, 
        addConfirmation, 
        getPages,
        sendConfirm,
        sendDecline,
        trigger: options.trigger 
    }
}
