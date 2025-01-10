const {getChildren, runChildren, buildNode, registerDestToParent} = require('./utils.nodes')
const {deserializePos, serializePos} = require('./utils.memory')



const maxExtForContLevel = {
  0: 0,
  1: 0,
  2: 5,
  3: 10,
  4: 20,
  5: 30,
  6: 40,
  7: 50,
  8: 60
}
const EXT_POS = {
  west: {
    container: {x: -3, y: 0},
    extensions: [
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
    hangSpot: {x: -1, y:0}
  },
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
const DIR = 'west'

module.exports.run = function (node, lineage = [], baseManifest) {
  try {
    let room = lineage.length ? Game.rooms[lineage[0]] : false


    switch (node.stage) {
      default:
      case 0: //find clear pos and set up container
        if (node.pos) { // ensure we have at least 1 built container
          let containers = getChildren(node, [STRUCTURE_CONTAINER], undefined, false, 1)
          if (containers.length === 0) { // if no container nodes...
            let buildNodes = getChildren(node, ['build'], undefined, false, 1)
            if (buildNodes.length === 0) { // and no container nodes being built...
              let offset = EXT_POS[DIR].container
              let nodePos = deserializePos(node.pos)
              let newPos = {x: nodePos.x + offset.x, y: nodePos.y + offset.y, roomName: nodePos.roomName}
              //console.log('offset', offset, offset.x, offset.y)
              //console.log('nodePos', nodePos, nodePos.x, nodePos.y, nodePos.roomName)
              //newPos.x = nodePos.x + offset.x
              //newPos.y = nodePos.y + offset.y
              //newPos.roomName = nodePos.roomName
              node.pos = serializePos(newPos)
              buildNode(node.id,
                STRUCTURE_CONTAINER,
                newPos,
                {subType: 'dist'}
              ) // build one
            }
          } else if (containers[0].stage === 1) { // if we do have some containers, and they are stage 1 aka built,

            node.stage = 1 // ext cluster container is complete. move to stage 1
            //if (containers.length) { // we completed our container node. swap places and move to stage 3
            //  //cleanPrimaryDests(node)
            //  let cont = containers[0]
            //  //cont.subType = 'src'
            //  const contId = cont.id
            //  //node.stage = 3
            //  addNodeToParent(cont, node.parent) // move container to parent
            //  //node.containerId = contId
            //  delete node.parent
            //  addNodeToParent(node, contId) // move this src to container
            //  //node.primaryDest.unshift(contId)
            //}
          }
        }
        break
      case 1: // now have a container, we want to make it a distributor node?
        //if (room.controller.level >= 2) {
        //  node.stage++
        //}
        break
      case 2:

        break
    }

    if (node.stage >= 1 && room.controller.level >= 2) {
      let maxExtensions = room ? maxExtForContLevel[room.controller.level] :  0 // here
      let extensions = getChildren(node, [STRUCTURE_EXTENSION], undefined, false, 1)
      if (extensions.length < maxExtensions && extensions.length < 10) { // if no container nodes...
        let buildNodes = getChildren(node,
          ['build'],
          (child) => child.onDoneType === STRUCTURE_EXTENSION,
          false,
          1)
        if (buildNodes.length === 0) { // and no container nodes being built...
          let offset = EXT_POS[DIR].extensions[extensions.length]
          let contPos = deserializePos(node.pos)
          //console.log('building another ext', contPos.x + offset.x, contPos.y + offset.y, contPos.roomName)

          buildNode(
            node.id, STRUCTURE_EXTENSION,
            {x: contPos.x + offset.x, y: contPos.y + offset.y, roomName: contPos.roomName}
          ) // build one
        }
      }
      //if (extensions.length >= maxExtForContLevel[node.stage]) { // if we do have max built extensions, move to next stage
      //  node.stage++
      //}
    }
    //if (node.children.extensions.length && node.children.container.length) {
    //  maintainRoleCreepsForNode(baseManifest, node, 'supplier', 1)
    //}
    registerDestToParent(node, baseManifest)
    runChildren(node, lineage, baseManifest)
  } catch (e) {
    console.log('Error: failed to run Extension Cluster Node', node.id, e.stack)
  }


}
