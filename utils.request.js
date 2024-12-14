
module.exports.createRequest = function () {
  return {
    id: '',
    type: '',
    base: '',
    role: ''
  }
}
const VALID_REQUEST_TYPES = ['creep', 'build']
module.exports.addRequest = function (request, manifest) {
  const id = `${r.type}_${r.base}_${r.role}`
  if (!manifest.creeps[id]) {
    manifest.creeps[id] = {type: 'creep', role: 'peon', base: base.name}
  }
}


function trgPriorityMultiplier (trg) {
  switch (trg.structureType) {
    case STRUCTURE_EXTENSION:
      return .5
    case STRUCTURE_SPAWN:
      return .8
    case STRUCTURE_CONTROLLER:
      return .5
    default:
      return 1
  }
}

function trgPriority (trg) {
  switch (trg.structureType) {
    case STRUCTURE_EXTENSION:
    case STRUCTURE_SPAWN:
      return trgPriorityMultiplier(trg) * (trg.store.getFreeCapacity(RESOURCE_ENERGY) / trg.store.getCapacity(RESOURCE_ENERGY))
    case STRUCTURE_CONTROLLER:
      return trgPriorityMultiplier(trg)
    default:
      console.log('Unhandled Priority for ', JSON.stringify(trg))
      return 1
  }
}
function trgEnergyReq (trg) {
  switch (trg.structureType) {
    case STRUCTURE_EXTENSION:
    case STRUCTURE_SPAWN:
      return trg.store.getFreeCapacity(RESOURCE_ENERGY)
    case STRUCTURE_CONTROLLER:
      return trg.progressTotal
    default:
      console.log('Unhandled Energy Req for ', JSON.stringify(trg))
      return 1
  }
}


module.exports.addEnergyRequest = function (base, trg, priorityOverride) {
  const req = {
    id: trg.id,
    energy: trgEnergyReq(trg),
    structureType: trg.structureType,
    priority: priorityOverride ?? trgPriority(trg)
  }
  let index = Memory.bases[base.name].targets[RESOURCE_ENERGY].findIndex(r => r.id === req.id)
  if (index !== -1) {
    Memory.bases[base.name].targets[RESOURCE_ENERGY][index] = req
  } else {
    Memory.bases[base.name].targets[RESOURCE_ENERGY].push(req)
  }
}

module.exports.sortEnergyRequests = function (energyRequests = []) {
  return energyRequests.sort((a,b) => {
    // return a.priority - b.priority
    return b.priority - a.priority
  })
}
