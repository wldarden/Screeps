const {getUniqueName} = require('./utils.spawner')
const {creepRunners} = require('./runners')
const {addEnergyRequest} = require('./utils.request')
const {fetchParentJobs, fetchTypeJobs} = require('./operation.job')

function addCreep (name, role, plan, base) {
  // base.creeps.push(name)
  plan.forEach(part => {
    base.roles[role].parts[part] += 1 // add part counts to role counts
  })
  Memory.bases[base.name].roles[role].creeps.push(name)
}
function doSpawn (role, base) {
  try {
    let spawns = base.structures[STRUCTURE_SPAWN]
    return spawns.some(s => {
      let spawn = Game.getObjectById(s)
      if (!spawn.spawning) {
        let plan = creepRunners[role].buildCreep(250)
        const name = getUniqueName(role)
        const newMemory = {
          role: role,
          action: 'idle',
          base: base.name,
          plan: plan
        }
        let res = spawn.spawnCreep(plan, name, {memory: newMemory})
        if (!res) {
          addCreep(name, role, plan, base)
          return true
        } else {
          return false
        }
      }
    })
  } catch (e) {

  }
}

function addResourceRequests (base) {
  /**
   * Add spawn Resource Requests
   */
  base.structures[STRUCTURE_SPAWN].forEach(sId => {
    let spawn = Game.getObjectById(sId)
    if (spawn.store.getFreeCapacity(RESOURCE_ENERGY) > 30) {
      addEnergyRequest(base, spawn)
    }
  })
}
module.exports.run = function (base, manifest) {
  let room = Game.rooms[base.name]
  let controller = room.controller
  let level = controller.level

  addResourceRequests(base)


  let openHarvestJobs = 0

  let typeJobs = fetchTypeJobs(base.name, 'harvest')
  for (let jobParent in typeJobs) {
    if (typeJobs[jobParent]) {
      typeJobs[jobParent].forEach(job => {
        if (!job.reserved) {
          openHarvestJobs++
        }
      })
    }
  }


  if (room.energyAvailable > 250 && openHarvestJobs) {
    doSpawn('peon', base)
  }



  // if (level < 2) {
  //   // spawn some peons
  //   if (room.energyAvailable > 250 && base.roles['peon'].creeps.length < 3) {
  //     doSpawn('peon', base)
  //   } else if (base.roles['upgrader'].creeps.length < base.roles['peon'].creeps.length / 3) {
  //     doSpawn('upgrader', base)
  //   }
  //
  // }


  // if (creeps.length < 5) { // && !spawnRequests.some(r => r.base === base.name && r.type === 'creep' && r.role === 'peon')) {
  //   // want to spawn a peon
  //   let resolved = false
  //   if (room.energyAvailable > 200) {
  //     resolved = doSpawn('peon', base)
  //   }
  //   // if (!resolved && !manifest.creeps[`${r.type}_${r.base}_${r.role}`]) {
  //   //   manifest.creeps[`${r.type}_${r.base}_${r.role}`] = {type: 'creep', role: 'peon', base: base.name}
  //   // }
  //
  //
  //   // if (!resolved && !spawnRequests.some(r => r.base === base.name && r.type === 'creep' && r.role === 'peon')) {
  //   //   spawnRequests.push({type: 'creep', role: 'peon', base: base.name})
  //   // }
  // }

}
