const {creepPlanInfo, ticksPerSpace} = require('./utils.creep')



// MOVE: "move",
//   WORK: "work",
//   CARRY: "carry",
//   ATTACK: "attack",
//   RANGED_ATTACK: "ranged_attack",
//   TOUGH: "tough",
//   HEAL: "heal",
//   CLAIM: "claim",
//
//   BODYPART_COST: {
//     "move": 50,
//       "work": 100,
//       "attack": 80,
//       "carry": 50,
//       "heal": 250,
//       "ranged_attack": 150,
//       "tough": 10,
//       "claim": 600
// },

// // WORLD_WIDTH and WORLD_HEIGHT constants are deprecated, please use Game.map.getWorldSize() instead
// WORLD_WIDTH: 202,
//   WORLD_HEIGHT: 202,
//
//   CREEP_LIFE_TIME: 1500,
//   CREEP_CLAIM_LIFE_TIME: 600,
//   CREEP_CORPSE_RATE: 0.2,
//   CREEP_PART_MAX_ENERGY: 125,
//
//   CARRY_CAPACITY: 50,
//   HARVEST_POWER: 2,
//   HARVEST_MINERAL_POWER: 1,
//   HARVEST_DEPOSIT_POWER: 1,
//   REPAIR_POWER: 100,
//   DISMANTLE_POWER: 50,
//   BUILD_POWER: 5,
//   ATTACK_POWER: 30,
//   UPGRADE_CONTROLLER_POWER: 1,
//   RANGED_ATTACK_POWER: 10,
//   HEAL_POWER: 12,
//   RANGED_HEAL_POWER: 4,
//   REPAIR_COST: 0.01,
//   DISMANTLE_COST: 0.005,
const ACTION_SPEED = {
    build: BUILD_POWER,
    harvest: HARVEST_POWER,
    upgrade: UPGRADE_CONTROLLER_POWER,
}
const RANGED_ACTIONS = ['build']

function creepActionBalance (action, roi) {
    const {load} = roi
    let energyBalance
    switch (action) { // from perspective of base energy. so pick up or harvest is actually zero
        case 'harvest': // positive * 2? or is it zero... its zero isnt it
        case 'drop': // base did not recieve any energy.
        case 'pickup': // base did not receive any energy.
            return 0
        case 'transfer': // positive
            return load
            // case 'upgrade': return (-.85 * load)
        case 'upgrade': // negative
        case 'withdraw': // negative
        case 'build': // negative
            return -load
        default:
            console.log('Error: Unhandled creep action revenue: ', action)
            return energyBalance = -.1
    }

}
function creepValuePerTick (steps, roi) {
    const {loadTicks, cost, load} = roi
    const creepCostPerTick = (cost / CREEP_LIFE_TIME)
    let grossRevenue = 0
    steps.forEach(s => {
        grossRevenue = grossRevenue + creepActionBalance(s.action[0], roi)
    })
    const tickRevenue = grossRevenue / loadTicks
    return tickRevenue - creepCostPerTick
}

function actionWorkTicks (steps, workParts, load) {
    let workTicks = 0
    steps.forEach(s => {
        switch (s.action[0]) {
            case 'upgrade':
            case 'build':
            case 'harvest':
                workTicks = workTicks + (load / (workParts * ACTION_SPEED[s.action[0]]))
                break
            case 'drop':
            case 'transfer':
            case 'withdraw':
            case 'pickup':
                workTicks = workTicks + 1
                break
            default:
                console.log('Error: Unhandled Work Tick Action: ', s.action[0], JSON.stringify(s))
                workTicks = workTicks + 1
                break
        }
    })
    return workTicks

}



function calculateJobROI (plan, dist, steps = [], slots) {
    let creepInfo = creepPlanInfo(plan)
    let funcDist = steps.some(step => RANGED_ACTIONS.includes(step.action[0])) ? Math.max(dist - 3, 0) : dist
    const speed = ticksPerSpace(plan, creepInfo.partCounts)
    const load = CARRY_CAPACITY * creepInfo.partCounts[CARRY]
    let roi = {
        dist: funcDist,
        cost: creepInfo.cost,
        load: load,
        speed: speed,
        travelTicks: (speed.to + speed.from) * funcDist,
        workTicks: actionWorkTicks(steps, creepInfo.partCounts[WORK], load)
    }
    roi.loadTicks = roi.workTicks + roi.travelTicks
    roi.creepsPerSlot = Math.max(roi.loadTicks / Math.max(roi.workTicks, 1), 1)
    roi.max = slots ? Math.floor(slots * roi.creepsPerSlot) : 5
    roi.valuePerCreep = creepValuePerTick(steps, roi)
    roi.value = roi.valuePerCreep
    roi.capacity = (load / roi.loadTicks)
    return roi
}
module.exports.calculateJobROI = calculateJobROI

//   CONSTRUCTION_COST: {
//   "spawn": 15000,
//     "extension": 3000,
//     "road": 300,
//     "constructedWall": 1,
//     "rampart": 1,
//     "link": 5000,
//     "storage": 30000,
//     "tower": 5000,
//     "observer": 8000,
//     "powerSpawn": 100000,
//     "extractor": 5000,
//     "lab": 50000,
//     "terminal": 100000,
//     "container": 5000,
//     "nuker": 100000,
//     "factory": 100000
// },
function calculateStageROI (stage) {
    let grossRevenue = 0
    let netRevenue = 0
    let ticks = 0
    stage.jobs.forEach(j => {
        switch (j.cat) {
            case 'build':
                netRevenue = netRevenue - CONSTRUCTION_COST[j.structureType]
                ticks = Math.max(ticks, CONSTRUCTION_COST[j.structureType] / j.roi.loadTicks)
                break
            case 'mine':
            case 'transfer':
                netRevenue = netRevenue + (j.value * j.creeps.length)
                break
        }
    })
    if (ticks === 0) {
        ticks = -1
    }
    return {
        cost: 0,
        ticks: ticks
    }
}

// const operation = {
//     name: 'mine',
//     stageIndex: 0,
//     cost: 0,
//     plan: 'M&C',
//     stages: [
//         {
//             stage: 1,
//
//             roi: {
//                 cost: 0,
//             },
//             jobs: [
//                 { // the container build site job
//                     group: source.id,
//                     cat: 'build',
//                     id: site.trg.id, // TODO - Container Position here
//                     threat: 0,
//                     dist: path.length,
//                     steps: [
//                         {id: site.src.id, type: 'base', action: ['withdraw']},
//                         {id: site.trg.pos, type: 'pos', action: ['build']}
//                     ],
//                     structureType: STRUCTURE_CONTAINER,
//                     max: -1,
//                     creeps: [],
//                     cost: 300,
//                     value: 0,
//                     plan: [WORK, CARRY, CARRY, MOVE, MOVE],
//                     reqs: {parts: [WORK, CARRY, MOVE]}
//                 }
//             ]
//         }, {
//             stage: 2,
//             roi: {},
//             jobs: [
//                 { // the miner that mines the src and brings energy to the container  (mines, deposits)
//                     group: source.id,
//                     cat: 'mine',
//                     threat: 0,
//                     dist: path.length,
//                     steps: minerSteps,
//                     max: minerROI.max,
//                     creeps: [],
//                     cost: 300,
//                     value: minerROI.value,
//                     plan: [WORK, WORK, CARRY, MOVE],
//                     reqs: {parts: [WORK, CARRY, MOVE], dep: [0]},
//                     roi: minerROI
//                 },
//                 { // takes from container to base
//                     group: source.id,
//                     cat: 'carry',
//                     threat: 0,
//                     dist: path.length,
//                     steps: transferSteps,
//                     max: (minerROI.max * minerROI.value) / transferROI.throughput,
//                     creeps: [],
//                     cost: transferROI.cost,
//                     value: transferROI.throughput,
//                     plan: [WORK, CARRY, CARRY, MOVE, MOVE],
//                     reqs: {
//                         parts: [WORK, CARRY, MOVE],
//                         dep: [0, 1]
//                     },
//                     roi: transferROI
//                 }
//             ]
//         }
//     ]
// }
