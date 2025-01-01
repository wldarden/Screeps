const {deserializePos} = require('./utils.memory')
const {registerReq, getReqById} = require('./utils.manifest')

function moveNodeSites (baseManifest, reqIds) {
    let res
    reqIds.forEach(reqId => {
        let req = getReqById(baseManifest.build.new, reqId)
        console.log('new req logggg', req?.id)
        if (req.status === 'new') {
            createSiteFromRequest(baseManifest, req)
        } else {
            let pendingReq = getReqById(baseManifest.build.pending, reqId)
            if (pendingReq?.opts?.siteId) {
                let site = Game.getObjectById(pendingReq.opts.siteId)
                if (!site) {
                    const lookRes = deserializePos(pendingReq.opts.pos).lookFor(LOOK_STRUCTURES)
                    let found = lookRes.find(item => item.structureType === pendingReq.opts.structureType)
                    if (found) {
                         res = found
                        baseManifest.build.pending = baseManifest.build.pending.filter(r => r.id !== pendingReq.id)
                        // baseManifest.build.new = baseManifest.build.new.filter(r => r.id !== pendingReq.id)
                        baseManifest.build.done = baseManifest.build.done.filter(r => r.id !== pendingReq.id)
                    }
                }
            }
        }
    })
    return res
}
module.exports.moveNodeSites = moveNodeSites
function createSiteFromRequest (manifest, request, position) {
    let pos = position || deserializePos(request.opts.pos)
    const res = Game.rooms[pos.roomName].createConstructionSite(pos.x, pos.y, request.opts.structureType)
    if (!manifest.build) {
        manifest.build = {}
    }
    if (res === 0) {
        return registerReq(manifest.build, request)
    } else {
        request.type = 'new'
        return registerReq(manifest.build, request)
    }
}
module.exports.createSiteFromRequest = createSiteFromRequest

function findSiteAtPos (pos, structureType) {
    const EXAMPLE_LOOK_RES = {
        "room":{
            "name":"sim",
            "energyAvailable":222,
            "energyCapacityAvailable":300,
            "survivalInfo":{
                "mode":"survival",
                "status":"active",
                "user":"5a36af6766a5f468481beb41",
                "score":0,
                "timeToWave":200,
                "wave":1,
                "survivalEnabled":true,
                "invaders":{"bodies":[]}
            },
            "visual":{"roomName":"sim"}
        },
        "pos":{"x":32, "y":30, "roomName":"sim"},
        "id":"e8cf2aa7a6acf120cfafae8b",
        "progress":0,
        "progressTotal":5000,
        "structureType":"container",
        "owner":{"username":"clearc2"},
        "my":true
    }

    const lookRes = deserializePos(pos).lookFor(LOOK_CONSTRUCTION_SITES)
    if (lookRes?.length) {
        return lookRes.find(item => {
            return item.structureType === structureType
        })?.id
    }
}
module.exports.findSiteAtPos = findSiteAtPos
function findStrAtPos (pos, structureType) {
    const lookRes = deserializePos(pos).lookFor(LOOK_STRUCTURES)
    if (lookRes?.length) {
        return lookRes.find(item => {
            console.log('itemlookRes2:', JSON.stringify(item))
            return item.structureType === structureType
        })?.id
    }
}
module.exports.findStrAtPos = findStrAtPos
// const {calculateJobROI} = require('./utils.jobs')
//
// function findContainerSiteForSrc (destId, srcId) {
//     let src = Memory.sources[srcId]
//     let source = Game.getObjectById(srcId)
//     let path = source.pos.findPathTo(Game.getObjectById(destId), {ignoreCreeps: true})
//     let pos
//     if (path[0].dx !== 0) {
//         pos = {x: path[0].x + path[0].dx, y: path[0].y, roomName: source.pos.roomName }
//     } else {
//         pos = {x: path[0].x, y: path[0].y + path[0].dy, roomName: source.pos.roomName }
//     }
//     const res = room.createConstructionSite(pos.x, pos.y, STRUCTURE_CONTAINER)
//     if (res === 0) {
//         let containerPos = serializePos(pos)
//         if (!Memory.sources[srcId].container) {
//             console.log('Good: Init container site for srcId', srcId, 'site:', containerPos)
//             Memory.sources[srcId].container = {
//                 structureType: STRUCTURE_CONTAINER,
//                 type: 'site',
//                 id: containerPos
//             }
//         } else {
//             console.log('Error: tried to build a container on a src that already had one!',
//               'Old Container: ',
//               JSON.stringify(Memory.sources[srcId].container),
//               'New Site: ',
//               containerPos
//             )
//             Memory.sources[srcId].container = {
//                 structureType: STRUCTURE_CONTAINER,
//                 type: 'site',
//                 id: containerPos
//             }
//         }
//
//         return containerPos
//     }
// }
// module.exports.findContainerSiteForSrc = findContainerSiteForSrc
//
// function findContainerSite (base, structure) {
//     const room = Game.rooms[base.name]
//     let baseSrcIndex = base.sources.findIndex(srcId => {
//         let src = Memory.sources[srcId].container
//         return !src?.container
//     })
//     let src = base.sources[baseSrcIndex]
//     if (!src) {
//         return null
//     }
//     let source = Game.getObjectById(src.id)
//     let path = source.pos.findPathTo(Game.getObjectById(base.structures[STRUCTURE_SPAWN][0]), {ignoreCreeps: true})
//     let pos
//     if (path[0].dx !== 0) {
//         pos = {x: path[0].x + path[0].dx, y: path[0].y, roomName: source.pos.roomName }
//     } else {
//         pos = {x: path[0].x, y: path[0].y + path[0].dy, roomName: source.pos.roomName }
//     }
//     const res = room.createConstructionSite(pos.x, pos.y, STRUCTURE_CONTAINER)
//     if (res === 0) {
//         let container = serializePos(pos)
//         base.sources[baseSrcIndex].container = container
//         return container
//     } else {
//         return null
//     }
//     /**
//      * Places we want containers:
//      * 1. somewhere along natural path between source and spawn
//      *      a. Next to source, so immobile miners are possible
//      *          - get nearest source
//      *          - find slots
//      *          - pick space adjacent to most slots and along path to base
//      *          - try buildSite
//      *          - if success, build job, set src to source
//      *      b. Midway between spawn and source at some optimum dist for miners vs builder/transport/things?
//      * 2. somewhere near the actual spawn as overflow
//      *
//      */
//     // let bestContainerSource
//     // base.sources.forEach(baseSource => {
//     //     if (baseSource.jobs.length === 1) {
//     //         // let srcJobs = baseSource.jobs.map(jId => base.jobs[jId]) // for sources with multiple jobs
//     //         let srcJob = base.jobs[baseSource.jobs[0]]
//     //         if (
//     //           !srcJob.threat &&
//     //           isBetterContainerSrc(bestContainerSource, {src: baseSource, job: srcJob})
//     //         ) {
//     //             bestContainerSource = {
//     //                 src: baseSource,
//     //                 job: srcJob
//     //             }
//     //         }
//     //         // we have the target
//     //     }
//     //
//     //
//     // })
//     // const distanceToContainer = 4
//     //
//     // const room = Game.rooms[position.roomName]
//     //
//     // let res = room.createConstructionSite(position.x - distanceToContainer, position.y, STRUCTURE_CONTAINER)
//     // if (res === 0) {
//     //     return serializePos({x: position.x - distanceToContainer, y: position.y, roomName: position.roomName})
//     // }
//     // res = room.createConstructionSite(position.x + distanceToContainer, position.y, STRUCTURE_CONTAINER)
//     // if (res === 0) {
//     //     return serializePos({x: position.x + distanceToContainer, y: position.y, roomName: position.roomName})
//     // }
//     // res = room.createConstructionSite(position.x, position.y - distanceToContainer, STRUCTURE_CONTAINER)
//     // if (res === 0) {
//     //     return serializePos({x: position.x, y: position.y - distanceToContainer, roomName: position.roomName})
//     // }
//     // res = room.createConstructionSite(position.x, position.y + distanceToContainer, STRUCTURE_CONTAINER)
//     // if (res === 0) {
//     //     return serializePos({x: position.x, y: position.y + 1, roomName: position.roomName})
//     // }
// }
// module.exports.findContainerSite = findContainerSite
// function getBuildSiteInfo (base, structure, pos) {
//     if (pos) {
//         let trgPos = buildNear(pos, structure)
//         return trgPos ? {
//             src: {id: base.name, type: 'base', pos: pos},
//             trg: {id: trgPos, type: 'pos', pos: trgPos}
//         } : null
//     }
//     let spawn
//     let trgPos
//     switch (structure) {
//         case STRUCTURE_EXTENSION:
//           spawn = Game.getObjectById(base.structures[STRUCTURE_SPAWN][0])
//           trgPos = buildNear(spawn.pos, structure)
//             return (trgPos ? {
//                 src: {id: base.name, type: 'base', pos: spawn.pos},
//                 trg: {id: trgPos, type: 'pos', pos: trgPos}
//             } : null)
//
//         case STRUCTURE_CONTAINER:
//             spawn = Game.getObjectById(base.structures[STRUCTURE_SPAWN][0])
//             trgPos = findContainerSite(base, structure)
//             return trgPos ? {
//                 src: {id: base.name, type: 'base', pos: spawn.pos},
//                 trg: {id: trgPos, type: 'pos', pos: trgPos}
//             } : null
//     }
// }
// module.exports.getBuildSiteInfo = getBuildSiteInfo
//
// function createUpgradeJob (base, params = {}) {
//     if (!base) {
//         console.log('Error: cant create upgrade job with no base: ', JSON.stringify(base))
//         console.log('Error: cant create upgrade job with no base: ', JSON.stringify(params))
//     }
//     const {
//         addToBase = true, // whether to add job to the passed base
//         overrides = {} // fields will be put into job.
//     } = params
//     const contId = base.structures[STRUCTURE_CONTROLLER][0]
//     let upgradeJob = base.jobs[contId]
//
//     if (!upgradeJob) {
//         let controller = Game.getObjectById(contId)
//         let spawn = Game.getObjectById(base.structures[STRUCTURE_SPAWN][0])
//         let path = controller.pos.findPathTo(spawn.pos)
//         const dist = path.length
//         const plan = [WORK, CARRY, CARRY, MOVE, MOVE] // TODO - replace with calculation
//         const upgradeSteps = [
//             {id: base.name, type: 'base', action: ['withdraw']},
//             {id: contId, type: 'obj', action: ['upgrade']}
//         ]
//         const ROI = calculateJobROI(plan, dist, upgradeSteps)
//         console.log('ROI', JSON.stringify(ROI))
//
//         const newJob = {
//             cat: 'upgrade',
//             id: contId,
//             steps: upgradeSteps,
//             max: 2,
//             cost: ROI.cost,
//             creeps: [],
//             value: ROI.valuePerCreep,
//             plan: plan,
//             reqs: { parts: [WORK, CARRY, MOVE] },
//             ...overrides
//         }
//         if (addToBase) {
//         }
//     }
// }
// module.exports.createUpgradeJob = createUpgradeJob
//
// function createBuildJob (base, structure, params = {}) {
//     if (!base) {
//         console.log('Error: cant create build job with no base: ', JSON.stringify(base))
//         console.log('Error: cant create build job with no base: ', JSON.stringify(structure))
//         console.log('Error: cant create build job with no base: ', JSON.stringify(params))
//     }
//     if (!structure) {
//         console.log('Error: cant create build job with no structure: ', JSON.stringify(base))
//         console.log('Error: cant create build job with no structure: ', JSON.stringify(structure))
//         console.log('Error: cant create build job with no structure: ', JSON.stringify(params))
//     }
//     const {
//         pos, // pass a specific pos to build somewhere other than near base default
//         addToBase = true, // whether to add job to the passed base
//         overrides = {} // fields will be put into job.
//     } = params
//
//     let site = getBuildSiteInfo(base, structure, pos) // returns {src: {id,type,pos} trg: {id,type,pos}}
//     if (site) {
//         console.log('got site')
//         let path = deserializePos(site.trg.pos).findPathTo(site.src.pos, {ignoreCreeps: true})
//         const dist = path.length
//         const plan = [WORK, CARRY, MOVE] // TODO - replace with calculation
//         const buildSteps = [
//             {id: site.src.id, type: 'base', action: ['withdraw']},
//             {id: site.trg.pos, type: 'pos', action: ['build']}
//         ]
//         const ROI = calculateJobROI(plan, dist, buildSteps)
//         const job = {
//             cat: 'build',
//             id: site.trg.id,
//             steps: buildSteps,
//             structureType: structure,
//             max: ROI.max,
//             cost: ROI.cost,
//             value: ROI.valuePerCreep,
//             creeps: [],
//             plan: plan,
//             ...overrides
//         }
//         if (addToBase) {
//         }
//         return job
//     }
// }
// module.exports.createBuildJob = createBuildJob
// function getSites (room) {
//     return room.find(FIND_CONSTRUCTION_SITES)
// }
// module.exports.getSites = getSites
// function buildNear (position, structure = STRUCTURE_EXTENSION) {
//     const room = Game.rooms[position.roomName]
//     var searching = true
//     const btmLeftX = position.x - 2
//     const btmLeftY = position.y - 2
//     var i = 0
//     let resX
//     let resY
//     let siteId
//     while (searching && i < 20) {
//         // [7, 8, 9]
//         // [3, 4, 5]
//         // [1, 2, 3]
//         const x = btmLeftX + ((i % 3) * 2)
//         const y = btmLeftY + (Math.floor(i / 3) * 2)
//         var res = room.createConstructionSite(x, y, structure);
//
//         // OK	                  0 The operation has been scheduled successfully.
//         // ERR_NOT_OWNER	     -1 The room is claimed or reserved by a hostile player.
//         // ERR_INVALID_TARGET	 -7 The structure cannot be placed at the specified location.
//         // ERR_FULL	           -8 You have too many construction sites. The maximum number of construction sites per player is 100.
//         // ERR_INVALID_ARGS	  -10 The location is incorrect.
//         // ERR_RCL_NOT_ENOUGH	-14 Room Controller Level insufficient. Learn more
//         // console.log(res, x,y,'res loggg', JSON.stringify(room.getPositionAt(x,y).lookFor(LOOK_CONSTRUCTION_SITES)[0]))
//         if (res === 0) {
//             searching = false
//             // siteId = room.getPositionAt(x,y).lookFor(LOOK_CONSTRUCTION_SITES)[0].id
//             resX = x
//             resY = y
//         } else {
//             i++
//         }
//     }
//     return searching ? false : {x: resX, y: resY, roomName: position.roomName} // (false if couldnt, pos if building)
// }
//
// module.exports.buildNear = buildNear
