
const asdate    = require('add-subtract-date')
const colors    = require('./colors')
const Emitter   = require('events')

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
    const emitter = new Emitter()
    let paginations = [], confirmations = []

    const defaultpgn = {
        switchPage: data => data.embed.description = data.pages[data.pagenum],
        pages: ['Start page'],
        buttons: options.pgnButtons
    }

    /* Pagination method */
    const addPagination = async (userID, channelID, params) => {
        const oldpagination = paginations.filter(x => x.userID === userID)[0]
        try {
            if(oldpagination && oldpagination.channel && oldpagination.msg)
                await bot.removeMessageReactions(oldpagination.channel, oldpagination.msg)
        } catch(e) {}

        paginations = paginations.filter(x => x.userID != userID)

        const pagenum = 0
        const pages = params.pages || defaultpgn.pages
        const obj = Object.assign({
            pagenum, userID,
            perms: [userID],
            embed: Object.assign({}, options.pgnEmbed),
            expires: asdate.add(new Date(), options.expires, 'seconds'),
        }, defaultpgn, params)

        obj.embed.color = obj.embed.color || colors.pagination
        obj.embed.footer = obj.embed.footer || { text: `Page 1/${pages.length}` }

        obj.switchPage(obj)
        paginations.push(obj)

        const msg = await bot.createMessage(channelID, { embed: obj.embed })
        obj.msg = msg.id
        obj.channel = msg.channel.id
        obj.channelType = msg.channel.type

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

    /* Confirmation method */
    const addConfirmation = async (userID, channelID, params) => {
        const old = confirmations.filter(x => x.userID === userID)[0]
        try {
            if(old && old.channel && old.msg)
                await bot.removeMessageReactions(old.channel, old.msg)
        } catch(e) {}

        confirmations = confirmations.filter(x => x.userID != userID)

        const obj = Object.assign({
            userID,
            embed: Object.assign({}, options.cfmEmbed),
            perms: { confirm: [userID], decline: [userID] },
            onConfirm: () => sendConfirm(channelID),
            onDecline: () => sendDecline(channelID),
            onError: () => { },
            expires: asdate.add(new Date(), options.confirmExpires, 'seconds'),
        }, params)

        if(obj.check && await obj.check())
            return await obj.onError(userID)

        if(params.force) {
            await obj.onConfirm(userID)
            emitter.emit('resolve', true, obj)
            return
        }

        obj.embed.color = obj.embed.color || colors.question
        obj.embed.description = obj.embed.description || params.question

        confirmations.push(obj)

        const msg = await bot.createMessage(channelID, { embed: obj.embed })
        obj.msg = msg.id
        obj.channel = msg.channel.id
        obj.channelType = msg.channel.type

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
        paginations.filter(x => x.expires < now).map(async x => {
            try {
                await bot.removeMessageReactions(x.channel, x.msg)
            } catch(e) { }
        })

        paginations = paginations.filter(x => x.expires >= now)

        confirmations.filter(x => x.expires < now).map(async x => {
            try {
                await bot.removeMessageReactions(x.channel, x.msg)
                await bot.editMessage(x.channel, x.msg, { embed: {
                    description: 'This confirmation dialog has expired',
                    color: colors.red
                }})
            } catch(e) { }
        })

        confirmations = confirmations.filter(x => x.expires >= now)
    }

    setInterval(tick.bind(this), options.check * 1000)

    /* Catching message reactions for pagination */
    const doSwitch = async (member, msg, reaction, newpage) => {
        const userID = member.id
        const data = paginations.filter(x => x.msg === msg.id && x.perms.includes(userID))[0]
        if(!data) return

        const max = data.pages.length - 1
        data.pagenum = newpage(data.pagenum)

        if(data.pagenum === Infinity || (options.wrap && data.pagenum < 0)) data.pagenum = max
        else if(options.wrap && data.pagenum > max) data.pagenum = 0
        else if(!options.wrap) data.pagenum = Math.min(Math.max(data.pagenum, 0), max)
        
        emitter.emit('switch', data)
        data.switchPage(data)

        if(data.embed.footer.text.startsWith('Page'))
            data.embed.footer.text = `Page ${data.pagenum + 1}/${data.pages.length}`
        await bot.editMessage(msg.channel.id, msg.id, { embed: data.embed })

        // If no guild we cannot remove reactions, skip
        if(member.guild) {
            try {
                bot.removeMessageReaction(msg.channel.id, msg.id, reaction, userID)
            } catch(e) { }
        }
    }

    /* Catching message reactions for confirmation */
    const doResolve = async (member, msg, reaction) => {
        let data
        const userID = member.id
        if(reaction === chars.confirm) 
            data = confirmations.filter(x => x.msg === msg.id 
                && x.perms.confirm.includes(userID))[0]

        if(reaction === chars.decline)
            data = confirmations.filter(x => x.msg === msg.id 
                && x.perms.decline.includes(userID))[0]

        if(!data) return

        confirmations = confirmations.filter(x => x.msg != msg.id)
        try {await bot.deleteMessage(msg.channel.id, msg.id)}
        catch(e) {}

        if(reaction === chars.decline)
            await data.onDecline(userID)

        if(data.check && await data.check())
            return await data.onError(userID)

        if(reaction === chars.confirm) 
            await data.onConfirm(userID)

        emitter.emit('resolve', reaction === chars.confirm, data)
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

    try {
        /* Go to the first page */
        options.rct(chars.first, (member, msg) => doSwitch(member, msg, chars.first, cur => 0))
        /* Go to the previous page */
        options.rct(chars.back, (member, msg) => doSwitch(member, msg, chars.back, cur => cur - 1))
        /* Go to the next page */
        options.rct(chars.forward, (member, msg) => doSwitch(member, msg, chars.forward, cur => cur + 1))
        /* Go to the last page */
        options.rct(chars.last, (member, msg) => doSwitch(member, msg, chars.last, cur => Infinity))
        /* Close the dialog */
        options.rct(chars.close, remove)
        /* Confirm */
        options.rct(chars.confirm, (member, msg) => doResolve(member, msg, chars.confirm))
        /* Decline */
        options.rct(chars.decline, (member, msg) => doResolve(member, msg, chars.decline))

    } catch(e) { emitter.emit('error', e) }

    return { 
        addPagination, 
        addConfirmation, 
        getPages,
        sendConfirm,
        sendDecline,
        emitter,
        trigger: options.trigger 
    }
}
