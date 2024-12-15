const {addEnergyRequest} = require('./utils.request')
const {addJobToBase} = require('./operation.job')


function needsEnergy (controller, base) {
  // TODO - add something about downgrading in here
  return (
    controller.level < 2 ||
    (controller.progress + 1) / (controller.progressTotal + 1) < .5// [controller.progress              |controller.progressTotal   ]
  )
}
module.exports.controllerNeedsEnergy = needsEnergy

module.exports.run = function (base, manifest) {
  base.structures[STRUCTURE_CONTROLLER].forEach(controllerId => {
    let controller = Game.getObjectById(controllerId)
    // should it be added to the energyTargets list?

    if (Object.keys(Game.creeps).length > 5 && needsEnergy(controller, base)) {
      let myJob = base.jobs[controllerId]
      myJob.max = 1
      if (!myJob) {
        const newJob = {
          cat: 'upgrade',
          id: controllerId,
          threat: 0,
          steps: [
            {id: base.structures[STRUCTURE_SPAWN][0], type: 'obj', action: ['withdraw']},
            {id: controllerId, type: 'obj', action: ['upgrade']}
            // {id: base.name, type: 'base', action: ['transfer', 'build', 'upgrade']}
          ],
          max: 1,
          cost: 300,
          creeps: [],
          plan: [WORK, CARRY, CARRY, MOVE, MOVE] ,
          reqs: { parts: [WORK, CARRY, MOVE] }
        }
        base = addJobToBase(base, newJob)
      }
    }

  })
}
