


module.exports.containerized = function (srcId) {
    if (!srcId) {
        return false
    }
    let src = Memory.nodes[srcId]
    if (!src) {
        return false
    }
    // const hasContainer = (src.sites && src.sites[STRUCTURE_CONTAINER] && src.sites[STRUCTURE_CONTAINER].length) || (
    //   src.structures && src.structures[STRUCTURE_CONTAINER] && src.structures[STRUCTURE_CONTAINER].length
    // )
    if (src.structures && src.structures[STRUCTURE_CONTAINER] && src.structures[STRUCTURE_CONTAINER].length) {
        return src.structures[STRUCTURE_CONTAINER][0]
    } else {
        return false
    }

}
