
const tree = { }

const rct = (...args) => {
    const callback = args.pop()
    const cursor = tree

    args.map(alias => {
        if (!cursor.hasOwnProperty(alias))
            cursor[alias] = {}

        cursor[alias]._callback = callback
    })
}

const trigger = async (userID, msg, reaction) => {
    let cursor = tree

    while (cursor.hasOwnProperty(reaction)) {
        cursor = cursor[reaction]
    }

    if (cursor.hasOwnProperty('_callback')) 
        await cursor._callback.apply({}, [userID, msg])
}

module.exports = { rct, trigger }
