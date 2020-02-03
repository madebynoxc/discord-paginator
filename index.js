
const main = require('./lib')
const { rct, trigger } = require('./lib/rct')

const defaults = {
    rct, trigger,
    bot: { },
    colors: require('./lib/colors'),
    expires: 600,
    confirmExpires: 60,
    check: 5,
    pgnEmbed: { title: 'Pagination Dialog' },
    cfmEmbed: { title: 'Confirmation Dialog' },
    pgnButtons: ['back', 'forward', 'close'],
    chars: {
        first: '⏪',
        back: '⬅',
        forward: '➡',
        last: '⏩',
        close: '🚫',
        confirm: '✅',
        decline: '❌'
    }
}

module.exports.create = (options) => {
    const op = Object.assign({}, defaults, options)
    //console.log(op)
    return main.create(op)
}
