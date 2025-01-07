const {maintainRoleCreepsForNode} = require('./utils.creep')

module.exports.run = function (node, lineage = [], baseManifest) {
    try {
        maintainRoleCreepsForNode(baseManifest, node, 'explorer', 1)
    } catch(e) {
        console.log('Error: failed to run Nav Node', e.stack, node.id, e)
    }
}


