

module.exports.printBase = function (baseName) {
    if (!Memory.bases[baseName]) {
        console.log('Tried to print base', baseName, ' but no base found')
    } else {
        console.log('Base: ', baseName)
        console.log('Base: ', JSON.stringify(base))
        p
    }
}
