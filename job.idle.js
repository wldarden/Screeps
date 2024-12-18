const {creepPlanInfo} = require('./utils.creep')
const {serializePos, deserializePos} = require('./utils.memory')
const {addJobToBase, hireCreep, completeJob} = require('./operation.job')
const {calculateJobROI} = require('./utils.jobs')

function createPickUpJob (base, creep, pile) {
  const spawnId = base.structures[STRUCTURE_SPAWN][0]
  const spawn = Game.getObjectById(spawnId)
  const pilePos = deserializePos(pile.pos)
  const path = spawn.pos.findPathTo(pilePos)
  const dist = path.length
  const ROI = calculateJobROI(creep.body, dist, 'pickup', 1)
  return {
    cat: 'transport',
    id: `pile-${pile.pos}`,
    threat: 0,
    dist: ROI.dist,
    steps: [
      {id: pile.pos, type: 'pos', action: ['pickup']},
      {id: base.name, type: 'base', action: ['transfer', 'upgrade']}
    ],
    max: ROI.max,
    creeps: [],
    cost: ROI.cost,
    value: ROI.value
  }
}

const jobCreators = {
  pile: createPickUpJob
}

module.exports.run = function (creep) {
  try {
    console.log('Idling', creep.name)
    let base = Memory.bases[creep.memory.base]
    let room = Game.rooms[base.name]

     if (!creep.memory.target) {
       let piles
       const checkExistingPiles = base.structures?.piles?.length
       if (checkExistingPiles) {
         piles = base.structures.piles
       } else {
         piles = room.find(FIND_DROPPED_RESOURCES)
       }
       console.log('piles.length', piles.length, piles.length && piles[0].energy > 0, JSON.stringify(piles[0]))
       if (piles.length) {
         piles.some(p => {
           if (p.energy > 0) {
             const pileId = `pile-${p.pos}`
             let creepJob
             if (checkExistingPiles && base.jobs[pileId]) {
               creepJob = base.jobs[p.pos]
             } else {
               creepJob = createPickUpJob(base, creep, p)
               addJobToBase(base, creepJob, false)
             }
             hireCreep(base, creep.name, creepJob.id)
           } else {
             if (checkExistingPiles) {
               completeJob(base, pos)
             }
           }
         })
       }
     }
     // const tmp = {
     //   "room":{
     //     "name":"sim",
     //     "energyAvailable":125,
     //     "energyCapacityAvailable":300,
     //     "survivalInfo":{"mode":"survival",
     //     "status":"active",
     //     "user":"5a36af6766a5f468481beb41",
     //     "score":0,
     //     "timeToWave":200,
     //     "wave":1,
     //     "survivalEnabled":true,
     //     "invaders":{"bodies":[]}
     //   },
     //   "visual":{"roomName":"sim"}},
     //   "pos":{
     //     "x":26,
     //     "y":24,
     //     "roomName":"sim"
     //   },
     //   "id":"b46cb0c99abb90f12becdabf",
     //   "energy":762,
     //   "amount":762,
     //   "resourceType":"energy"
     // }

    // if (step.type === 'obj') {
    //   target = Game.getObjectById(step.id)
    // }
    //
    // let actionRes = creep.withdraw(target, RESOURCE_ENERGY)
    // switch (actionRes) {
    //   case ERR_NOT_IN_RANGE:
    //     creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}})
    //     break
    //   case ERR_TIRED:
    //     console.log('creep says they are tired: ', creep.name)
    //     break
    //   case ERR_NOT_ENOUGH_RESOURCES:
    //     // hybernate a bit maybe?
    //     console.log('not enough res', creep.name)
    //     nextStep(creep)
    //     break
    //   case ERR_FULL:
    //     nextStep(creep)
    //     break
    //   case OK:
    //     if (creep.store.getFreeCapacity() === 0) {
    //       nextStep(creep)
    //     }
    //     break
    //   default:
    //     console.log('Error: Action Response not handled: ', actionRes)
    //     break
    // }
    //
    //
    // if (job.steps.length < creep.memory.step + 1) {
    //   creep.memory.step = 0
    // }
  } catch (e) {
    console.log('Error: couldnt run idle job', e.stack)
  }
}
