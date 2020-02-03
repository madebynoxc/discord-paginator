
const main = require('./lib')
const { rct, trigger } = require('./lib/rct')

const defaults = {
    rct, trigger,
    bot: { },
    colors: require('./lib/colors'),
    expires: 600,
    check: 5,
    chars: {
        first: '⏪',
        back: '⬅',
        forward: '➡',
        last: '⏩',
        close: '🚫',
        accept: '✅',
        reject: '❌'
    }
}

module.exports.create = (options) => {
    const op = Object.assign({}, defaults, options)
    //console.log(op)
    return main.create(op)
}
