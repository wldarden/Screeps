const {log} = require('./utils.debug')
const {getBodyCost} = require('./utils.memory')

function getEnergy(type, manifest, creep, amount = null, filter, dryRun = false) {
  if (amount === null) {
    switch (type) {
      case 'dest':
        amount = creep.store.getUsedCapacity()
        break
      case 'src':
        amount = creep.store.getFreeCapacity()
        break
    }
  }
  const canBuild = creep.getActiveBodyparts(WORK) > 0
  let usedReq = manifest.energy[type].find((req, i) => {
    const activeCreeps = Object.keys(req.creeps).length
    const maxCreeps = req.max || 4
    if (filter) {
      return filter(req)
    } else if (req.amount > amount && activeCreeps < maxCreeps && (canBuild || req.action !== 'build')) {
      return true
    }
  })
  if (!usedReq && manifest.energy[type].length) {
    usedReq = {...manifest.energy[type][0], i: 0}
  }
  if (!dryRun && creep && usedReq) {
    usedReq.type = type
    useEnergyReq(manifest, creep, usedReq, amount)
  }
  return usedReq
}
module.exports.getEnergy = getEnergy

function freeEnergy(type, manifest, creepName, reqId) {
  let index
  let req = manifest.energy[type].find((req, i) => {
    if (req.id === reqId) {
      index = i
      return true
    }
  })
  if (req) {
    if (req?.creeps) {
      delete req.creeps[creepName]
    } else {
      log({reqThrowingError: req})
    }
    registerEnergy(manifest, req, req.type)
  } else {
  }

}
module.exports.freeEnergy = freeEnergy
module.exports.energy = {
  get: (type, manifest, creep, amount = null, dryRun = false) => getEnergy(type, manifest, creep, amount, undefined, dryRun),
  getSrc: (manifest, creep, amount = null, dryRun = false) => getEnergy('src', manifest, creep, amount, undefined, dryRun),
  getDest: (manifest, creep, amount = null, filter, dryRun = false) => getEnergy('dest', manifest, creep, amount, filter, dryRun),
  free: (type, manifest, creepName, reqId) => freeEnergy(type, manifest, creepName, reqId),
  freeSrc: (manifest, creepName, reqId) => freeEnergy('src', manifest, creepName, reqId),
  freeDest: (manifest, creepName, reqId) => freeEnergy('dest', manifest, creepName, reqId)

}
function useEnergyReq (manifest, creep, req, amount = null) {
  if (manifest.energy && manifest.energy[req.type]) {
    if (amount === null) {
      switch (req.type) {
        case 'dest':
          amount = creep.store.getUsedCapacity()
          break
        case 'src':
          amount = creep.store.getFreeCapacity()
          break
      }
    }
    // deregisterEnergy(manifest, req.id, req.type)
    req.creeps[creep.name] = amount
    registerEnergy(manifest, req, req.type)
  }
}
module.exports.useEnergyReq = useEnergyReq

function deregisterEnergy(manifest, reqId, type = 'dest') {
    if (!manifest.energy || !manifest.energy[type]) { return }
    manifest.energy[type] = manifest.energy[type].filter(oldReq => oldReq.id !== reqId)
}
module.exports.deregisterEnergy = deregisterEnergy
function registerEnergy (manifest, req, type = 'dest', perCreepPriCost = .2) {
  if (!manifest.energy) { manifest.energy = {} }
  if (!manifest.energy[type]) { manifest.energy[type] = [] }
  let prevIndex = manifest.energy[type].findIndex(oldReq => oldReq.id === req.id)
  if (prevIndex !== -1) {
    req = {...manifest.energy[type][prevIndex], ...req}
    manifest.energy[type].splice(prevIndex, 1)
  }
  req.creeps = req?.creeps || {}
  req.cpc = req?.cpc || perCreepPriCost
  req.origPri = req?.origPri  || req?.pri


  req.reserved = 0
  let creepIds = Object.keys(req.creeps)
  creepIds.forEach(c => {
      req.reserved = req.reserved + req.creeps[c]
  })
  req.pri = Math.max(req.origPri - (req.cpc * creepIds.length), 0)
  let priIndex = manifest.energy[type].findIndex(oldReq => oldReq.pri < req.pri)
  if (priIndex === -1) {
      manifest.energy[type].push(req)
  } else {
      manifest.energy[type].splice(priIndex, 0, req)
  }
}
module.exports.registerEnergy = registerEnergy


function registerReq (manifestSection, req) {
    if (!req || !manifestSection) { log({manifestSection, req}); return } // error log
    if (!req.id) {
        req.id = req.requestor
    }
    if (!manifestSection) { manifestSection = {} }
    if (!manifestSection[req.type]) { manifestSection[req.type] = [] }

    manifestSection[req.type] = manifestSection[req.type].filter(req => req.id !== req.id) // remove any duplicates
    let priIndex = manifestSection[req.type].findIndex(oldReq => oldReq.pri < req.pri)
    if (priIndex === -1) {
        manifestSection[req.type].push(req)
    } else {
        manifestSection[req.type].splice(priIndex, 0, req)
    }
    return req
}
module.exports.registerReq = registerReq

function getReqById (manifestSection, id) {
    if (!manifestSection) {
        manifestSection = []
    }
    return manifestSection.find(req => req.id === id)
}
module.exports.getReqById = getReqById
function moveReq (manifestSection, oldType, reqId, newType) {
    let prevIndex = manifestSection[oldType].findIndex(oldReq => oldReq.id === reqId)
    let req
    if (prevIndex !== -1) {
        req = manifestSection[oldType][prevIndex]
        req.type = newType
        manifestSection[oldType].splice(prevIndex, 1)
        manifestSection[newType] = manifestSection[newType].filter(req => req.id !== req.id)
    }
}
module.exports.moveReq = moveReq


// module.exports.registerEnergy = registerEnergy
// function requestCreep (requestor, role, plan) {
//     const newRequest = {
//         pri: 1,
//         requestor: requestor,
//         assignee: [],
//         status: 'new',
//         role: role,
//         plan: plan || 'C2W1M2'
//     }
//
// }

function hasBuildRequest (manifest, nodeId, params = {}) {
    return manifest.req.build.some(r => {
        return r.node === nodeId && Object.keys(params).every(key => (r[key] && r[key] === params[key])) // params key is in req base and matches
    })
}
module.exports.hasBuildRequest = hasBuildRequest


function hasSpawnRequest (manifest, nodeId, params = {}) {
    return manifest.req.spawn.some(r => {
        return r.mem.node === nodeId && Object.keys(params).every(key => (
          (
            r.mem[key] && r.mem[key] === params[key]) || // params key is in req mem and matches
            r[key] && r[key] === params[key] // params key is in req base and matches
          )
        )
    })
}
module.exports.hasSpawnRequest = hasSpawnRequest

function addRequest (manifest, request, status = 'new') {
    // const EXAMPLE_SPAWN_REQUEST = {
    //     pri: 1,
    //     requestor: srcId,
    //     assignee: null,
    //     status: 'new',
    //     type: 'spawn',
    //     role: 'miner',
    //     plan: 'C2W1M2'
    // }

    if (!request.id) {
        let i = 0
        while(manifest.requests[`${request.type}-${request.requestor}-${i}`]) {
            i++
        }
        request.id = `${request.type}-${request.requestor}-${i}`
    }


    manifest.requests[request.id] = request
    // manifest.requests[`${type}-${request.requestor}`] = request
    if (!manifest[status]) {
        manifest[status] = {}
    }
    if (!manifest[status][request.type]) {
        manifest[status][request.type] = []
    }
    // manifest.new[request.type] = manifest.new[request.type].filter(id => id !== request.id)
    // manifest.pending[request.type] = manifest.pending[request.type].filter(id => id !== request.id)
    manifest[status][request.type] = manifest[status][request.type].filter(id => id !== request.id)
    let priIndex = manifest[status][request.type].findIndex(oldReqId => {
        return manifest.requests[oldReqId].pri < request.pri
    })
    if (priIndex === -1) {
        manifest[status][request.type].push(request.id)
    } else {
        manifest[status][request.type].splice(priIndex, 0, request.id)
    }
    // let requestorNode = Memory.nodes[request.requestor]
    // if (!requestorNode.reqs) { requestorNode.reqs = [] }
    // if (!requestorNode.some(reqId => reqId === request.id)) {
    //     requestorNode.reqs.push(request.id)
    // }
    return request.id
}
module.exports.addRequest = addRequest

function getReqCost (req) {
    switch (req.type) {
        case 'spawn':
            let res = req.cost
            if (!res) {
                req.cost = getBodyCost(req.opts.plan)
            }
            return res
        default:
            log({request: req}, ['ERROR'])
            return 1
    }
}
module.exports.getReqCost = getReqCost



function requestBuilder (manifest, baseName, nodeId, planObj, memory, priority) {
    const plan = planObj || {W: 2, C: 1, M: 1}
    const mem = memory || {
        base: baseName,
        node: nodeId,
        role: 'build'
    }
    const pri = priority || 1 // this should be some function of build length, income balance, and saturations
    addSpawnRequest(manifest, {plan, mem, pri})
}
module.exports.requestBuilder = requestBuilder

const DEFAULT_BODY_PLAN = {W: 1, C: 2, M: 2}
function addSpawnRequest (manifest, request) {
    // const newRequest = {
    //     pri: 1,
    //     requestor: srcId,
    //     assignee: null,
    //     status: 'new',
    //     role: 'miner',
    //     plan: 'C2W1M2'
    // }
    return addRequest(manifest, request)
}
module.exports.addSpawnRequest = addSpawnRequest

function deleteReq (manifest, requestId) {
    let request = manifest.requests[requestId]
    if (manifest && manifest[request.status] && manifest[request.status][request.type]) {
        manifest[request.status][request.type] = manifest[request.status][request.type].filter(id => id !== request.id)
    }
    switch (request.type) {
        case 'build':
        case 'spawn':
            if (Memory.nodes[request.requestor] && Memory.nodes[request.requestor].reqs) {
                Memory.nodes[request.requestor].reqs = Memory.nodes[request.requestor].reqs.filter(id => id !== request.id)
            }

    }
    if (manifest.requests[request.id]) {
        delete manifest.requests[request.id]
    }
}
module.exports.deleteReq = deleteReq

function addBuildRequest (manifest, request) {
    // request = {
    //     node: '',
    //     structureType: STRUCTURE_CONTAINER,
    //     pri: 1
    // }
    return addRequest(manifest, request)
}
module.exports.addBuildRequest = addBuildRequest

function assignReq (manifest, reqId, nodeId) {
    // if (reqIndex < 0 || !type || !nodeId || !manifest) {
    //     console.log('Error: assigning req', reqIndex, type, nodeId)
    //     log(manifest, ['ERROR_REQUEST'])
    // }
    let req = manifest.requests[reqId] // get req
    // if (req.assignee) {
    //     console.log('Error: already assigned!', reqId, nodeId)
    //     return false
    // }
    manifest.new[req.type] = manifest.new[req.type].filter(id => id !== reqId) // remove from new queue if it exists
    if (req.assignee) {
        req.assignee.push(nodeId)
    } else {
        req.assignee = [nodeId]
    }
    req.status = 'pending'
    return addRequest(manifest, req, 'pending')
}
module.exports.assignReq = assignReq

function completeReq (manifest, reqId, deleteReq = false) {
    // if (reqIndex < 0 || !type || !nodeId || !manifest) {
    //     console.log('Error: assigning req', reqIndex, type, nodeId)
    //     log(manifest, ['ERROR_REQUEST'])
    // }
    let req = manifest.requests[reqId] // get req
    manifest.pending[req.type] = manifest.pending[req.type].filter(id => id !== reqId) // remove from new queue if it exists
    manifest.new[req.type] = manifest.new[req.type].filter(id => id !== reqId)
    switch (req.type) {
        case 'build':
        case 'spawn':
            if (Memory.nodes[req.requestor] && Memory.nodes[req.requestor].reqs) {
                Memory.nodes[req.requestor].reqs = Memory.nodes[req.requestor].reqs.filter(id => id !== req.id)
            }
            break
    }
    // let req = manifest.new[type].splice(reqIndex, 1)
    req.status = 'done'
    if (deleteReq) {
        return true
    } else {
        return addRequest(manifest, req, 'done')
    }
}
module.exports.completeReq = completeReq

// function getMyAssingedRequests (manifest, nodeId, type = 'all') {
//     let res = []
//     Object.keys(manifest.pending).forEach(t => {
//         res = res.concat(manifest.pending[t].filter(req => req.assignee === nodeId))
//     })
//     return res
// }
// module.exports.getMyAssingedRequests = getMyAssingedRequests
