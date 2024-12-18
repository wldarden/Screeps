const {addEnergyRequest} = require('./utils.request')
const {addJobToBase} = require('./operation.job')
const {createBuildJob, createUpgradeJob} = require('./utils.build')


function needsEnergy (controllerId) {
  let controller = Game.getObjectById(controllerId)
  // TODO - add something about downgrading in here
  return (
    controller.level < 2 ||
    (controller.progress + 1) / (controller.progressTotal + 1) < .5// [controller.progress              |controller.progressTotal   ]
  )
}
function shouldUpgradeController (controllerId) {
  return Object.keys(Game.creeps).length > 5 && needsEnergy(controllerId)
}
module.exports.controllerNeedsEnergy = needsEnergy

module.exports.run = function (base, manifest) {
  base.structures[STRUCTURE_CONTROLLER].forEach(controllerId => {

    // should it be added to the energyTargets list?

    if (shouldUpgradeController(controllerId)) {
      createUpgradeJob(base)
    }

  })
}
