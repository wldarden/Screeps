const {getChildren, runChildren, buildNode} = require('./utils.nodes')
const {deserializePos} = require('./utils.memory')



const maxExtForContLevel = {
  0: 0,
  1: 0,
  2: 5,
  3: 10
}
const EXT_POS = {
  west: [
    {x: 0, y: 1},
    {x: 0, y: 2},
    {x: 1, y: 2},
    {x: 2, y: 2},
    {x: 2, y: 1},

    {x: 0, y: -1},
    {x: 0, y: -2},
    {x: 1, y: -2},
    {x: 2, y: -2},
    {x: 2, y: -1},
  ],
  east: [
    {x: 0, y: 1},
    {x: 0, y: 2},
    {x: -1, y: 2},
    {x: -2, y: 2},
    {x: -2, y: 1},

    {x: 0, y: -1},
    {x: 0, y: -2},
    {x: -1, y: -2},
    {x: -2, y: -2},
    {x: -2, y: -1},
  ]
}

module.exports.run = function (node, lineage = [], baseManifest) {
  try {
    switch (node.stage) {
      default:
      case 0: //find clear pos and set up container
        if (node.pos) { // ensure we have at least 1 built container
          let containers = getChildren(node, [STRUCTURE_CONTAINER], undefined, false, 1)
          if (containers.length === 0) { // if no container nodes...
            let buildNodes = getChildren(node, ['build'], undefined, false, 1)
            if (buildNodes.length === 0) { // and no container nodes being built...
              buildNode(node.id, STRUCTURE_CONTAINER, node.pos, {subType: 'dist'}) // build one
            }
          } else if (containers[0].stage === 1) { // if we do have some containers, and they are stage 1 aka built,
            node.dist = containers[0]
            node.stage = 1 // ext cluster container is complete. move to stage 1
          }
        }
        break
      case 1: // now have a container, we want to make it a distributor node?
        let room = lineage?.length ? Game.rooms[lineage[0]] : false
        if (room?.controller?.level >= 2) {
          const maxExtensions = room ? maxExtForContLevel[room.controller.level] :  0 // here
          let extensions = getChildren(node, [STRUCTURE_EXTENSION], undefined, false, 1)
          if (extensions.length < maxExtensions) { // if no container nodes...
            let buildNodes = getChildren(node,
              ['build'],
              (child) => child.onDoneType === STRUCTURE_EXTENSION,
              false,
              1)
            if (buildNodes.length === 0) { // and no container nodes being built...
              let offset = EXT_POS.east[extensions.length]
              console.log(EXT_POS.east[extensions.length], offset)
              let contPos = deserializePos(node.pos)
              buildNode(node.id, STRUCTURE_EXTENSION, {x: contPos.x + offset.x, y: contPos.y + offset.y, roomName: contPos.roomName}) // build one
            }
          } else if (extensions.length >= 10) { // if we do have max built extensions, move to next stage
            node.stage = 2
          }
        }

        break
      case 2:
        break
    }
    runChildren(node, lineage, baseManifest)
  } catch (e) {
    console.log('Error: failed to run Extension Cluster Node', node.id, e.stack)
  }


}
