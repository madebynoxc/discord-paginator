
discord-paginator
====
[![NPM](https://img.shields.io/npm/v/discord-paginator)](https://www.npmjs.com/package/discord-paginator)   [![Discord Server](https://img.shields.io/discord/351871492536926210)](https://discord.gg/xQAxThF)

Creates paginated content for your Discord bot. Highly customizable, easy to use. Works best with [Eris](https://github.com/abalabahaha/eris)

Installing
----------

You will need NodeJS 8 or higher. 
```
npm i discord-paginator
```

Using
---------
```js
const Eris = require('eris')
const paginator = require('discord-paginator')

const bot = new Eris('BOT_TOKEN')
const pgn = paginator.create({ bot }) // create options go here

/* fired when bot is connected and ready to read the messages*/
bot.on('ready', event => {
    console.log('Bot ready')
})

/* fired when message is created */
bot.on('messageCreate', async (msg) => {
    if(msg.content.startsWith('/pages')) {
        const pages = []
        for(let i=0; i<5; i++)
            pages.push(`page ${i + 1}`) // generate some pages
            
        const embed = { title: 'Simple Example' } // our embed object (optional)
        pgn.addPagination(msg.author.id, msg.channel.id, { pages, embed }) 
    }
})

/* fired when reaction is added to the message */
bot.on('messageReactionAdd', async (msg, emoji, userID) => {
    pgn.trigger(userID, msg, emoji.name) // we catch reaction and call 'trigger' on pagination
})

bot.connect() // connect bot to discord
```
You can use any JS Discord library if you wrap your bot object and call appropriate methods. Make sure that your bot object implements the following methods:

* `addMessageReaction(channelID, messageID, reaction_char)`
* `removeMessageReactions(channelID, messageID)`
* `editMessage(channelID, messageID, content)`
* `createMessage(channelID, content)`

More examples can be found in [the examples folder](https://github.com/NoxCaos/discord-paginator/tree/master/examples).

Using Confirmation
---------
This package also contains confirmator module that can create confirm/decline dialog for discord. It works in a really similar way to pagination.
```js
const Eris = require('eris')
const paginator = require('discord-paginator')

const bot = new Eris('BOT_TOKEN')
const pgn = paginator.create({ bot }) // create options go here

/* fired when bot is connected and ready to read the messages*/
bot.on('ready', event => {
    console.log('Bot ready')
})

/* fired when message is created */
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

/* fired when reaction is added to the message */
bot.on('messageReactionAdd', async (msg, emoji, userID) => {
    pgn.trigger(userID, msg, emoji.name) // we catch reaction and call 'trigger' on pagination
})

bot.connect() // connect bot to discord
```
More examples can be found in [the examples folder](https://github.com/NoxCaos/discord-paginator/tree/master/examples).

Running Examples
---------
You can clone this repository and run the examples
```
git clone git@github.com:NoxCaos/discord-paginator.git
npm install
cp examples/token.dest.js examples/token.js
```
Then open `examples/token.js` and put on your Discord bot token. You can obtain it [here](https://discordapp.com/developers/applications). Then:
```
node examples/simplepagination
```
Go to the server where you invited your bot and type `/pages` to run the sample

Parameters
---------
Customize pagination by passing appropriate options when initializing and creating pagination.
### Create Options
```
{
    bot,          // [Object] (required) bot object for creating methods/reactions
    expires: 600, // [Integer] (optional) how long till pagination expires (in seconds)
    confirmExpires: 60 // [Integer] (optional) how long till confirmation dialog expires (in seconds)
    check: 5,     // [Integer] (optional) how often should expiration tick run (in seconds)
    
    /* 
    * These options are defaults for all dialogs. 
    * You can override them for each dialog exclusively 
    */
    pgnEmbed: { title: 'Pagination Dialog' },   // [Object] (optional) default pagination embed
    cfmEmbed: { title: 'Confirmation Dialog' }, // [Object] (optional) default confirmation embed
    pgnButtons: ['back', 'forward', 'close'],   // [Object] (optional) default pagination buttons
    
    /* [Object] (optional) object with default integer colors for embeds */
    colors: { 
        question, 
        accept, 
        reject, 
        pagination
    },

    /* [Object] (optional) object with emojis used for pagination and confirm dialog */
    chars: {
        first: '⏪',
        back: '⬅',
        forward: '➡',
        last: '⏩',
        close: '🚫',
        confirm: '✅',
        decline: '❌'
    },
    
    rct,    // [Function] (optional) custom reaction subscription function (see below)
    trigger,    // [Function] (optional) custom reaction trigger function (see below)
}
```
You can specify custom functions for reactions and trigger. They both should be sharing the same reaction tree.
Implement your own `rct` and `trigger` functions if you are planning to intercept more reactions for further use. See more about implementation [here](https://github.com/NoxCaos/discord-paginator/blob/master/lib/rct.js).

Subscribe to any reaction with `rct(reaction_char, (userID, msg) => callback())`

### Pagination Options
```
{
    pages, // [Array] (required) array of pages
    embed, // [Object] (optional) embed that will be paginated
    
    /* [Array] (optional) Buttons to include */
    buttons: ['first', 'last', 'back', 'forward', 'close'],
    
    /* [Array] (optional) IDs of users that are allowed to react */
    /* if not specified, it will use message author ID */
    perms: ['235401616214982656'],
    
    switchPage,  // [Function] (optional) custom function that is called 
            when page changes (see below)
}
```
You can specify custom function that will be called when page has changed. By default it will swap the `embed.description` to appropriate value from `pages`. 
See [this example](https://github.com/NoxCaos/discord-paginator/blob/master/examples/customswitch.js) for details
### Confirmation Options
```
{
    question // [String] question to ask. 
             // If not specified, embed's description field will be used
             
    embed, // [Object] (optional) embed that show the question
    
    /* 
    * [Object] (optional) IDs of users that are allowed to react
    * if not specified, it will use message author ID
    * can have separate permissions to confirm and decline message
    */
    perms: { confirm: [], decline: [] },
    
    onConfirm,  // [Function] called when dialog was confirmed
    onDecline,  // [Function] (optional) called when dialog was declined
}
```

Extra methods
---------
### getPages(array, [split = 10])
Will turn long array into pages. 

`split` indicates how many items will be on one page (default 10)
See more in [this example](https://github.com/NoxCaos/discord-paginator/blob/master/examples/arraytopage.js)
### sendConfirm(channelID, [msg= 'Operation was confirmed!'])
Will send a confirm-formatted message to the channel.
### sendDecline(channelID, [msg= 'Operation was declined'])
Will send a decline-formatted message to the channel.
See more in [this example](https://github.com/NoxCaos/discord-paginator/blob/master/examples/confirmparams.js)

License
-------

Please refer to the [LICENSE](LICENSE) file.
