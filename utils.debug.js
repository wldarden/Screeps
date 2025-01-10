const {ACTIVE_DEBUG_LOG_TYPES} = require('./config')

function log (obj = {}, types = ['DEFAULT'], nest = ['LOG']) {
    try {
        if (nest.length > 1 || types.some(type => ACTIVE_DEBUG_LOG_TYPES.includes(type))) {
            switch (getObjType(obj)) {
                case 'string':
                case 'number':
                case 'null':
                case 'boolean':
                    return logSimple(obj, types, nest)
                case 'array':
                    return logArray(obj, types, nest)
                case 'object':
                    return logObj(obj, types, nest)
                default:
                    console.log('WARN: Unhandled Obj Type in DEBUG Log: ', typeof obj, JSON.stringify(obj))
                    return
            }
        }
    } catch (e) {
        console.log('Error: Could not log Obj [1/2] JSON.stringify(obj): ', JSON.stringify(obj))
        console.log('Error: Could not log Obj [2/2] e.stack: ', e.stack)
    }

}
module.exports.log = log

function getObjType (obj) {
    const type = typeof obj
    switch (type) {
        case 'string':
        case 'number':
        case 'boolean':
            return type
        case 'object':
            if (obj === null || obj === undefined) {
                return 'null'
            } else if (Array.isArray(obj)) {
                return 'array'
            } else {
                return 'object'
            }
        default:
            console.log('WARN: Unhandled Obj Type in DEBUG Log: ', typeof obj, JSON.stringify(obj))
            return
    }
}
function getNestLabel (obj, types, nest) {
    switch (nest.length) {
        case 0:
            return ''
        case 1:
            let objNodeType
            if (obj.type) {
                objNodeType = obj.type
            } else {
                const activeTypes = types.filter(t => ACTIVE_DEBUG_LOG_TYPES.includes(t))
                objNodeType = activeTypes.join('.')
            }
            const objName =  nest[0] === 'LOG' ? obj.name || obj.id || '(No Name/Id)' : nest[0]
            const parent = obj.parent ? ` (Parent: ${obj.parent} [${Memory.nodes[obj.parent].type}])` : ''
            // const activeTypes = types.filter(t => ACTIVE_DEBUG_LOG_TYPES.includes(t))
            // return `${activeTypes.join('.')}.${objName}${parent}`
            return `ID: ${objName} [${objNodeType}]${parent} Tick: ${Game.time}`
        default:
            return nest[nest.length - 1]
    }
}

function getNestParams (obj, types, nest) {
    const nestLevel = nest.length
    let nestLabel = getNestLabel(obj, types, nest)
    const nestComma = nestLevel > 1 ? ',' : ''
    const nestSpaces = nest.map(n => '').join('  ')
    return {nestLevel, nestLabel, nestComma, nestSpaces}
}
function logObj (obj, types, nest) {
    const {nestLabel, nestComma, nestSpaces} = getNestParams(obj, types, nest)
    const keys = Object.keys(obj)
    if (keys.length) {
        console.log(`${nestSpaces}${nestLabel}: {`)
        keys.forEach((key, i) => { log(obj[key], types, [...nest, key]) })
        return console.log(`${nestSpaces}}${nestComma}`)
    } else {
        return console.log(`${nestSpaces}${nestLabel}: {}${nestComma}`)
    }
}

function logArray (obj, types, nest) {
    const {nestLabel, nestComma, nestSpaces} = getNestParams(obj, types, nest)
    if (obj.length) {
        console.log(`${nestSpaces}${nestLabel}: [`)
        obj.forEach((item, i) => { log(item, types, [...nest, i]) })
        return console.log(`${nestSpaces}]${nestComma}`)
    } else {
        return console.log(`${nestSpaces}${nestLabel}: []${nestComma}`)
    }
}

function logSimple (obj, types, nest) {
    const {nestLabel, nestComma, nestSpaces} = getNestParams(obj, types, nest)
    switch (typeof obj) {
        case 'string':
            return console.log(`${nestSpaces}${nestLabel}: '${obj}'${nestComma}`)
        case 'number':
        case 'object': // for null/undefined valuess
        case 'boolean':
            return console.log(`${nestSpaces}${nestLabel}: ${obj}${nestComma}`)
        default:
            console.log('WARN: Unhandled Obj Type in DEBUG Log: ', typeof obj, JSON.stringify(obj))
            return
    }
}
