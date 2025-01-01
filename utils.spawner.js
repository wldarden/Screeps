//   MOVE: "move",
//   WORK: "work",
//   CARRY: "carry",
//   ATTACK: "attack",
//   RANGED_ATTACK: "ranged_attack",
//   TOUGH: "tough",
//   HEAL: "heal",
//   CLAIM: "claim",
//
//   BODYPART_COST: {
//        "move": 50,
//       "work": 100,
//       "attack": 80,
//       "carry": 50,
//       "heal": 250,
//       "ranged_attack": 150,
//       "tough": 10,
//       "claim": 600
// },
function getPartCost (parts) {
  let cost = 0
  parts.forEach(part => {
    cost += BODYPART_COST[part]
  })
  return cost
}
module.exports.getPartCost = getPartCost

  function getUniqueName (role) {
  let i = 0
  while(Game.creeps[`${role}-${i}`]) {
    i++
  }
  return `${role}-${i}`
}
module.exports.getUniqueName = getUniqueName


function buildRoleCreep (node, role, maxCost = 300) {
  let body = []
  let addOns = []
  let addOnCount = 0
  let baseCost = 0
  let addOnCost = 0
  switch (role) {
    case 'miner':
      if (node.type === 'src' && node.stage >= 3) {
        body = [WORK,WORK,CARRY,MOVE]
        addOns = [CARRY, MOVE]
        baseCost = 300
        addOnCost = 100
        addOnCount = Math.floor((maxCost - baseCost) / addOnCost)
      } else {
        body = [CARRY, WORK, MOVE, CARRY, MOVE]
        addOns = [CARRY, MOVE]
        baseCost = 300
        addOnCost = 100
        addOnCount = Math.floor((maxCost - baseCost) / addOnCost)
      }
      break
    case 'maint':
      body = [CARRY, WORK, MOVE]
      addOns = [CARRY, MOVE, WORK]
      baseCost = 200
      addOnCost = 200
      addOnCount = Math.floor((maxCost - baseCost) / addOnCost)
      break
    case 'supplier':
      body = [CARRY, CARRY, CARRY, MOVE, MOVE, MOVE]
      addOns = [CARRY, MOVE]
      baseCost = 300
      addOnCost = 100
      addOnCount = Math.floor((maxCost - baseCost) / addOnCost)
      break
    case 'builder':
      body = [WORK, WORK, CARRY, MOVE]
      addOns = [CARRY, MOVE]
      baseCost = 300
      addOnCost = 100
      addOnCount = Math.floor((maxCost - baseCost) / addOnCost)
      break
    case 'upgrader':
      body = [CARRY, WORK, MOVE]
      addOns = [CARRY, WORK, MOVE]
      baseCost = 200
      addOnCost = 200
      addOnCount = Math.floor((maxCost - baseCost) / addOnCost)
      break
    default:
      body = [CARRY, WORK, MOVE, CARRY, MOVE]
      addOns = [CARRY, MOVE]
      baseCost = 300
      addOnCost = 100
      addOnCount = Math.floor((maxCost - baseCost) / 100)
      break
  }
  if (maxCost > 300) {
    for (let i = 0; i < addOnCount; i++) {
      body = body.concat(addOns)
    }
  }
  const cost = baseCost + (addOnCount * addOnCost)
  return {body, cost}
}
module.exports.buildRoleCreep = buildRoleCreep


function spawnForSrc (node, maxCost = 300) {
  let role = 'miner'
  let body = [CARRY, WORK, MOVE, CARRY, MOVE]
  let addOns = [CARRY, MOVE]
  let maxAddOns = -1
  switch (node.stage) {
    case 3:
      body = [WORK, WORK, CARRY, MOVE]
      addOns = [WORK]
      maxAddOns = Math.ceil(5 / Object.keys(node.slots)) + 1
      break
    case 0:
    case 1:
    case 2:
    default:
      break
  }
  let baseCost = getPartCost(body)
  let addOnCost = 0
  let count = 0
  if (addOns.length) {
    addOnCost = getPartCost(addOns)
    count = Math.floor((maxCost - baseCost) / addOnCost)
    //console.log('addOnCost', addOnCost, 'base', baseCost, 'count', Math.floor((maxCost - baseCost) / addOnCost))
    count = maxAddOns === -1 ? count : Math.min(count, maxAddOns)
    for (let i = 0; i < count; i++) {
      body = body.concat(addOns)
    }
  }
  return {
    name: getUniqueName(role),
    memory: {role: role, nodeId: node.id},
    body: body,
    cost: baseCost + (addOnCost * count)
  }
}
function spawnForNode (id, maxCost = 300) {
  let node = Memory.nodes[id]
  let role
  switch (node.type) {
    case 'src':
      return spawnForSrc(node)
    case 'build':
      role = 'builder'
      break
    case 'log':
      role = 'supplier'
      break
    case STRUCTURE_CONTROLLER:
      role = 'upgrader'
      break
    case 'maint':
      role = 'maint'
      break
  }
  if (node && role) {
    let bodyInfo = buildRoleCreep(node, role, maxCost)
    return {
      name: getUniqueName(role),
      memory: {
        role: role,
        nodeId: node.id
      },
      body: bodyInfo.body,
      cost: bodyInfo.cost
    }
  } else {
    console.log('Error: unhandled spawn for node type: ', node?.type, id, node?.id, maxCost)
  }

}
module.exports.spawnForNode = spawnForNode
