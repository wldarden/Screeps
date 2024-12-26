const {getUniqueName} = require('./utils.spawner')
const {hireCreep} = require('./operation.job')
const {ACTIONS} = require('./actions')
const {containerized} = require('./utils.source')
const {hasSpawnRequest, addSpawnRequest, hasBuildRequest, addBuildRequest} = require('./utils.manifest')
const {buildNear} = require('./utils.build')
const {serializePos} = require('./utils.memory')
// Body
// part	Build cost	Effect per one body part
// MOVE	50	Decreases fatigue by 2 points per tick.
//   WORK	100
//   Harvests 2 energy units from a source per tick.
//   Harvests 1 resource unit from a mineral or a deposit per tick.
//   Builds a structure for 5 energy units per tick.
//   Repairs a structure for 100 hits per tick consuming 1 energy unit per tick.
//   Dismantles a structure for 50 hits per tick returning 0.25 energy unit per tick.
//   Upgrades a controller for 1 energy unit per tick.
//
//   CARRY	50	Can contain up to 50 resource units.
//
//   ATTACK	80	Attacks another creep/structure with 30 hits per tick in a short-ranged attack.
//
//   RANGED_ATTACK	150
// Attacks another single creep/structure with 10 hits per tick in a long-range attack up to 3 squares long.
//
//   Attacks all hostile creeps/structures within 3 squares range with 1-4-10 hits (depending on the range).
//
// HEAL	250	Heals self or another creep restoring 12 hits per tick in short range or 4 hits per tick at a distance.
//   CLAIM	600
// Claims a neutral room controller.
//
//   Reserves a neutral room controller for 1 tick per body part.
//
//   Attacks a hostile room controller downgrading its timer by 300 ticks per body parts.
//
//   Attacks a neutral room controller reservation timer by 1 tick per body parts.
//
//   A creep with this body part will have a reduced life time of 600 ticks and cannot be renewed.
//
//   TOUGH	10	No effect, just additional hit points to the creep's body. Can be boosted to resist damage.


function getCatPriority (revenue) {
  if (revenue <= 2) {
    return ['mine']
  } else {
    return ['build', 'upgrade', 'mine']
  }
}

function isSafe (job) {
  return !job.threat
}

function isPossible (job, room) {
  return job.cost <= room.energyAvailable
}

function isCostEffective (job, revenue) {
  if (job.value > 0) { // job is already positive, so do sure
    return true
  } else if (job.cat === 'build') {
    const newRevenue = revenue + job.value
    return newRevenue >= -5
  } else {
    const newRevenue = revenue + job.value
    return newRevenue >= 2
  }
}

const BODY_MAP = {
  W: WORK,
  w: WORK,
  M: MOVE,
  m: MOVE,
  C: CARRY,
  c: CARRY
}

function addPart (body, part, n) {
  for (let i = 0; i < n; i++) {
    body.push(part)
  }
  return body
}
function makePlan (plan) {
  let body = []
  Object.keys(plan).forEach(p => {
    body = addPart(body, BODY_MAP[p], plan[p])
  })
  return body
}
function creepPlanInfo (plan) {
  let partCounts = {}
  let creepCost = 0
  plan.forEach(part => {
    if (!partCounts[part]) {
      partCounts[part] = 1
    } else {
      partCounts[part] += 1 // add part counts to role counts
    }
    creepCost += BODYPART_COST[part]
  })
  return creepCost//{cost: creepCost, partCounts: partCounts}
}

function shouldBuildExtension (manifest, base, spawnId) {
  let room = Game.rooms[base.name]
  return (
    room.controller.level >= 2 &&
    base.structures[STRUCTURE_EXTENSION].length < 6 &&
    Object.keys(Game.creeps).length >= 5 &&
    !hasBuildRequest(manifest, spawnId, {structureType: STRUCTURE_EXTENSION})
  )
}

function requestSpawnExtension (manifest, base, spawnId) {
  spawnId = spawnId || base.structures[STRUCTURE_SPAWN][0]
  const spawn = Game.getObjectById(spawnId)
  let room = Game.rooms[base.name]

  const structure = STRUCTURE_EXTENSION
  const pos = buildNear(spawn.pos, structure)
  // return (trgPos ? {
  //   src: {id: base.name, type: 'base', pos: spawn.pos},
  //   trg: {id: trgPos, type: 'pos', pos: trgPos}
  // } : null)
  if (!pos) {
    return
  }
  const priorityReq = {
    node: spawnId,
    structureType: structure,
    pos: serializePos(pos),
  }
  const res = room.createConstructionSite(pos.x, pos.y, structure)
  if (res === 0) {
    priorityReq.placed = Game.time
    priorityReq.pri = .5
    if (!base.sites) {
      base.sites = {}
    }
    if (!base.sites.structures) {
      base.sites.structures = [priorityReq.pos]
    } else {
      base.sites.structures.push(priorityReq.pos)
    }
    addBuildRequest(manifest, priorityReq)
  }
}

module.exports.run = function (base, manifest) {
  let room = Game.rooms[base.name]
  let spawnId = base.structures[STRUCTURE_SPAWN][0]
  if (spawnId) {
    let spawn = Game.getObjectById(spawnId)

    // MAKE COURIERS FOR BASE?
    if (room.energyAvailable < room.energyCapacityAvailable) { // should we make a courier
      let courierIds = base.creeps?.courier
      let containerizedSources = base.sources.filter(sourceId => containerized(sourceId))
      let maxCouriers = 0
      containerizedSources.forEach(srcId => {
        const loadTime = 3 * Memory.nodes[srcId].dist
        const EPT = Memory.nodes[srcId].creeps.length * 4
        const EGenPerLoad = EPT * loadTime
        const couriersNeededToHandleEPL = EGenPerLoad / 150
        maxCouriers = maxCouriers + couriersNeededToHandleEPL
      })
      maxCouriers = Math.max(Math.floor(maxCouriers), 1)
      if (
        containerizedSources?.length &&
        (!courierIds?.length || containerizedSources?.length * 2 > courierIds?.length) &&
        !hasSpawnRequest(manifest, spawnId, {role: 'courier'})
      ) {
        addSpawnRequest(manifest, {
          pri: .5,
          mem: {
            base: base.name,
            node: spawnId,
            role: 'courier'
          },
          plan: {C: 3, M: 3}
        })
      }
    }
    // END COURIERS
    // SPAWN?
    if (manifest?.req?.spawn?.length) {
      let priorityReq = manifest.req?.spawn[0]
      let cost = priorityReq.cost
      let plan
      if (!cost) {
        plan = makePlan(priorityReq.plan)
        manifest.req.spawn[0].cost = creepPlanInfo(plan)
      }
      if (priorityReq.cost <= room.energyAvailable) {
        const role = priorityReq.mem.role
        let i = 0
        let name = `${role}-${i}`
        while(Game.creeps[name]) {
          i++
          name = `${role}-${i}`
        }
        let res = spawn.spawnCreep(
          makePlan(priorityReq.plan),
          name, {
            memory: {
              base: base.name,
              actions: [],
              node: base.name,
              ...priorityReq.mem
            }
          })
        if (res === OK) {
          if (priorityReq.replace && Game.creeps[priorityReq.replace]) { // request was supposed to replace a creep. recycle them
            ACTIONS.recycle.start(Game.creeps[priorityReq.replace], spawn.id) // make the creep kill itself
          }
          if (!base.creeps[role]) {
            base.creeps[role] = [name]
          } else {
            base.creeps[role].push(name)
          }
          console.log('Creep spawned. adding to node:', (Memory.nodes[priorityReq.mem.node] && Memory.nodes[priorityReq.mem.node].type) || 'base', 'nodeId:', priorityReq.mem.node)
          if (Memory.nodes[priorityReq.mem.node]) {
            if (!Memory.nodes[priorityReq.mem.node].creeps) {
              Memory.nodes[priorityReq.mem.node].creeps = []
            }
            Memory.nodes[priorityReq.mem.node].creeps.push(name)
          } else if (Memory.bases[priorityReq.mem.node]) {
            console.log('Error: Creep node is a base', name)
          }
          manifest.req.spawn.shift()
          return true
        }
      }
    }
    // END SPAWN
    // BUILD EXTENSION?
    if (shouldBuildExtension(manifest, base, spawnId)) {
      requestSpawnExtension(manifest, base, spawnId)
    }
    // END EXTENSION
  }

}
