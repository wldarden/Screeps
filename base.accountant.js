

module.exports.run = function (base, manifest) {
    if (!manifest.income) {
        manifest.income = {}
    }
    let totalIncome = 0
    let totalCost = 0
    Object.keys(manifest.income).forEach(nodeId => {
        if (nodeId !== 'total') {
            totalIncome = totalIncome + manifest.income[nodeId].rev
            totalCost = totalCost + manifest.income[nodeId].cost
        }
    })
    let buildCosts = 0
    if (base.creeps.build.length) {
        buildCosts = base.creeps.build.length * 5
    }
    manifest.income.total = {
        rev: totalIncome,
        cost: totalCost,
        bal: totalIncome - totalCost - buildCosts
    }
    if (Game.time % 20 === 0) {
        console.log('Total Rev:', totalIncome, 'Total Cost:', totalCost, 'Balance:', manifest.income.total.bal)

    }
}
