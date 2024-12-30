

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
module.exports.getPartCost = function (parts) {
  let cost = 0
  parts.forEach(part => {
    cost += BODYPART_COST[part]
  })
  return Math.min(cost, 1)
}

function getUniqueName (role) {
  let i = 0
  while(Game.creeps[`${role}-${i}`]) {
    i++
  }
  return `${role}-${i}`
}
module.exports.getUniqueName = getUniqueName
