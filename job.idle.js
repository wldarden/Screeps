const {addJobToBase, hireCreep, completeJob, jobCreators, fireCreep, getJobForCreep} = require('./operation.job')


module.exports.run = function (creep) {
  try {
    // console.log('Idling', creep.name, JSON.stringify(creep.memory))
    let base = Memory.bases[creep.memory.base]
    let room = Game.rooms[base.name]
    // fireCreep(base, creep.name, creep.memory.jobId)
     if (!creep.memory.jobId && !creep.memory.target) {
       let piles
       // const checkExistingPiles = base.structures?.piles?.length
       // if (checkExistingPiles) {
       //   piles = base.structures.piles
       // } else {
       //   piles = room.find(FIND_DROPPED_RESOURCES)
       // }
       // console.log('piles.length', piles.length, piles.length && piles[0].energy > 0, JSON.stringify(piles[0]))
       if (piles?.length) {
         // piles.some(p => {
         //   if (p.energy > 0) {
         //     const pileId = `pile-${p.pos}`
         //     let creepJob
         //     if (checkExistingPiles && base.jobs[pileId]) {
         //       creepJob = base.jobs[p.pos]
         //     } else {
         //       creepJob = jobCreators.pile.create(base, creep, p)
         //       addJobToBase(base, creepJob, false)
         //     }
         //     hireCreep(base, creep.name, creepJob.id)
         //   } else {
         //     if (checkExistingPiles) {
         //       jobCreators.pile.destroy(base, p)
         //       completeJob(base, p.pos)
         //     }
         //   }
         // })
       } else {
         // try a mining Job


       }
     }
    getJobForCreep(base, creep)
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

const EXAMPLE_PILE = {
  "room":{
    "name":"sim",
    "energyAvailable":10,
    "energyCapacityAvailable":300,
    "survivalInfo":{"mode":"survival","status":"active","user":"5a36af6766a5f468481beb41","score":0,"timeToWave":200,"wave":1,"survivalEnabled":true,"invaders":{"bodies":[]}},
    "visual":{"roomName":"sim"}
  }
  ,"pos":{"x":28,"y":25,"roomName":"sim"},
  "id":"30bcfb25b09283fc161b9a25",
  "energy":192,
  "amount":192,
  "resourceType":"energy"
}
