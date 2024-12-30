// const {getNodeRunner} = require('./utils.nodes')
//
//
// module.exports.run = function (node, lineage = []) {
//     if (!node || !node.children) {
//         return
//     }
//
//     if (node.creeps) {
//         Object.keys(node.creeps).forEach(role => {
//             if (node.creeps[role]) {
//                 node.creeps[role] = node.creeps[role].filter(id => !!Game.creeps[id])
//             }
//         })
//     }
//
//     let childLineage = [...lineage, node.id]
//     for (let nodeType in node.children) {
//         let nodeRunnerDef = getNodeRunner(nodeType)
//         node.children[nodeType].forEach(nodeId => {
//             nodeRunnerDef.runner.run(Memory.nodes[nodeId], childLineage, baseManifest)
//         })
//     }
// }


// function runChildren (node, lineage, baseManifest) {
//     if (!node || !node.children) {
//         return
//     }
//
//     if (node.creeps) {
//         Object.keys(node.creeps).forEach(role => {
//             if (node.creeps[role]) {
//                 node.creeps[role] = node.creeps[role].filter(id => !!Game.creeps[id])
//             }
//         })
//     }
//
//     let childLineage = [...lineage, node.id]
//     for (let nodeType in node.children) {
//         let nodeRunnerDef = getNodeRunner(nodeType)
//         node.children[nodeType].forEach(nodeId => {
//             nodeRunnerDef.runner.run(Memory.nodes[nodeId], childLineage, baseManifest)
//         })
//     }
//
// }
// module.exports.runChildren = runChildren
