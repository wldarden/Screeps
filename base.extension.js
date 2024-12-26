//
//
//
// const {createBuildJob, buildNear} = require('./utils.build')
// const {serializePos} = require('./utils.memory')
// const {addBuildRequest, hasBuildRequest} = require('./utils.manifest')
//
// function shouldBuildExtension (manifest, base, spawnId) {
//     let room = Game.rooms[base.name]
//     return (
//       room.controller.level >= 2 &&
//       base.structures[STRUCTURE_EXTENSION].length < 6 &&
//       Object.keys(Game.creeps).length >= 5 &&
//       !hasBuildRequest(manifest, spawnId, {structurType: STRUCTURE_EXTENSION})
//     )
// }
//
// function requestSpawnExtension (manifest, base) {
//   const spawnId = base.structures[STRUCTURE_SPAWN][0]
//   const spawn = Game.getObjectById(spawnId)
//   let room = Game.rooms[base.name]
//
//   const structure = STRUCTURE_EXTENSION
//   const pos = buildNear(spawn.pos, structure)
//   // return (trgPos ? {
//   //   src: {id: base.name, type: 'base', pos: spawn.pos},
//   //   trg: {id: trgPos, type: 'pos', pos: trgPos}
//   // } : null)
//   const priorityReq = {
//     node: spawnId,
//     structureType: structure,
//     pos: serializePos(pos),
//   }
//   const res = room.createConstructionSite(pos.x, pos.y, structure)
//   if (res === 0) {
//     priorityReq.placed = Game.time
//     priorityReq.pri = .5
//     // if (!src.sites) {
//     //   src.sites = {}
//     // }
//     // if (!src.sites[priorityReq.structureType]) {
//     //   src.sites[priorityReq.structureType] = [priorityReq.pos]
//     // } else {
//     //   src.sites[priorityReq.structureType].push(priorityReq.pos)
//     // }
//     if (!base.sites) {
//       base.sites = {}
//     }
//     if (!base.sites.structures) {
//       base.sites.structures = [priorityReq.pos]
//     } else {
//       base.sites.structures.push(priorityReq.pos)
//     }
//     addBuildRequest(manifest, priorityReq)
//   }
//
//   // const path = source.pos.findPathTo(spawn , {ignoreCreeps: true})
//   // let pos
//   // if (path[0].dx !== 0) {
//   //   pos = {x: path[0].x + path[0].dx, y: path[0].y, roomName: source.pos.roomName }
//   // } else {
//   //   pos = {x: path[0].x, y: path[0].y + path[0].dy, roomName: source.pos.roomName }
//   // }
//   // const priorityReq = {
//   //   node: srcId,
//   //   structureType: STRUCTURE_CONTAINER,
//   //   pos: serializePos(pos),
//   // }
//   // const res = room.createConstructionSite(pos.x, pos.y, priorityReq.structureType)
//   // if (res === 0) {
//   //   priorityReq.placed = Game.time
//   //   priorityReq.pri = 1/ src.dist
//   //   if (!src.sites) {
//   //     src.sites = {}
//   //   }
//   //   if (!src.sites[priorityReq.structureType]) {
//   //     src.sites[priorityReq.structureType] = [priorityReq.pos]
//   //   } else {
//   //     src.sites[priorityReq.structureType].push(priorityReq.pos)
//   //   }
//   //   if (!base.sites) {
//   //     base.sites = {}
//   //   }
//   //   if (!base.sites.structures) {
//   //     base.sites.structures = [priorityReq.pos]
//   //   } else {
//   //     base.sites.structures.push(priorityReq.pos)
//   //   }
//   //   addBuildRequest(manifest, priorityReq)
//   // }
//
// }
// module.exports.run = function (base, manifest) {
//     let room = Game.rooms[base.name]
//     // addEnergyRequest(base, base.structures[STRUCTURE_EXTENSION])
//     // addResourceRequests(base)
//     if (shouldBuildExtension(manifest, base)) {
//       console.log('tried to build extension')
//       requestSpawnExtension(manifest, base)
//     }
// }
// //   CONSTRUCTION_COST: {
// //   "spawn": 15000,
// //     "extension": 3000,
// //     "road": 300,
// //     "constructedWall": 1,
// //     "rampart": 1,
// //     "link": 5000,
// //     "storage": 30000,
// //     "tower": 5000,
// //     "observer": 8000,
// //     "powerSpawn": 100000,
// //     "extractor": 5000,
// //     "lab": 50000,
// //     "terminal": 100000,
// //     "container": 5000,
// //     "nuker": 100000,
// //     "factory": 100000
// // },
