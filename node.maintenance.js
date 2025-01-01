
const {runChildren, registerEnergyState} = require('./utils.nodes')
const {log} = require('./utils.debug')
const {deserializePos, addNodeToParent} = require('./utils.memory')
const { registerEnergy} = require('./utils.manifest')
const {findSiteAtPos, findStrAtPos} = require('./utils.build')
const {PRIORITY} = require('./config')
const {maintainRoleCreepsForNode} = require('./utils.creep')

module.exports.run = function (node, lineage = [], baseManifest) {
    try {
        //switch (node.stage) {
        //    default:
        //    case 0: // finding pos and building
        //        console.log('Error: container nodes should never be stage 0 right?', node.id, node.parent, node.type)
        //        break
        //    case 1: // adding site id to start registering build reqs
        //        switch (node.subType) {
        //            default:
        //            case 'log':
        //                break
        //            case 'src':
        //                break
        //        }
        //        break
        //    case 2:
        //        break
        //    case 3:
        //        break
        //
        //}
        if (baseManifest.spawnCapacity >= 400) {
            maintainRoleCreepsForNode(baseManifest, node, 'maint', 1, 0,0)
        }
        runChildren(node, lineage, baseManifest)
    } catch(e) {
        log(Memory.nodes[node.id], ['ERROR', 'MAINT_NODE'])
        console.log('Error: failed to run Maintenance Node', e.stack, node.id)
    }
}

