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
function registerEnergy (manifest, req, type = 'dest', perCreepPriCost = .2, priOverRide) {
  //if (req.id === 'caca270ca817c261221c3b9f') {
  //  console.log('req for spawn', req.pri, req.origPri, priOverRide)
  //}
  if (!manifest.energy) { manifest.energy = {} }
  if (!manifest.energy[type]) { manifest.energy[type] = [] }
  let prevIndex = manifest.energy[type].findIndex(oldReq => oldReq.id === req.id)
  if (prevIndex !== -1) {
    req = {...manifest.energy[type][prevIndex], ...req}
    manifest.energy[type].splice(prevIndex, 1)
  }
  req.creeps = req?.creeps || {}
  req.cpc = req?.cpc || perCreepPriCost
  req.origPri = priOverRide || req?.origPri  || req?.pri


  req.reserved = 0
  let creepIds = Object.keys(req.creeps)
  creepIds.forEach(c => {
      req.reserved = req.reserved + req.creeps[c]
  })
  req.pri = Math.max(req.origPri - (req.cpc * creepIds.length), 0)
  //if (req.id === 'caca270ca817c261221c3b9f') {
  //  console.log('req for spawn', req.pri, 'orig', req.origPri, 'res', req.reserved, 'over',priOverRide,'cpc', req.cpc, 'crepids',creepIds.length, Math.max(req.origPri - (req.cpc * creepIds.length), 0))
  //}
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

function deleteNodeReqs (manifest, nodeId, type = 'spawn') {
  if (manifest[type]) {
    manifest[type] = manifest[type].filter(nId => nId !== nodeId)
    Memory.nodes[nodeId].spawnReqCount = 0
  }
}
module.exports.deleteNodeReqs = deleteNodeReqs

function completeSpawnReq (baseManifest, nodeId) {
  let node = Memory.nodes[nodeId]
  if (node) {
    node.spawnReqCount = node.spawnReqCount ? node.spawnReqCount - 1 : 0 // decrement the spawnReqCount of the requester node
  }
  baseManifest.spawn.shift()
}
module.exports.completeSpawnReq = completeSpawnReq

