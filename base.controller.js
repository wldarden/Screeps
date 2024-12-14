const {addEnergyRequest} = require('./utils.request')


function needsEnergy (controller, base) {
  // TODO - add something about downgrading in here
  return (
    controller.level < base.goal.controllerLevel ||
    (controller.progress + 1) / (controller.progressTotal + 1) < .5// [controller.progress              |controller.progressTotal   ]
  )
}
module.exports.controllerNeedsEnergy = needsEnergy

module.exports.run = function (base) {
  // base.structures[STRUCTURE_CONTROLLER].forEach(controllerId => {
  //   let controller = Game.getObjectById(controllerId)
  //   // should it be added to the energyTargets list?
  //   if (needsEnergy(controller, base)) {
  //     addEnergyRequest(base, controller)
  //   }
  // })
}
