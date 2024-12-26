const {createUpgradeJob} = require('./utils.build')
const {addSpawnRequest, hasSpawnRequest} = require('./utils.manifest')


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
    if (!Memory.nodes[controllerId]) {
      Memory.nodes[controllerId] = {
        type: 'controller',
        base: base.name,
        creeps: []
      }
    }
    let maxUpgradeCreeps = 1
    if (manifest.income.total && manifest.income.total.rev && manifest.income.total.rev > 20 && base.creeps?.upgrade?.length < maxUpgradeCreeps) {
      if (!base.creeps?.upgrade?.length || base.creeps?.upgrade?.length < maxUpgradeCreeps) {
        if (!hasSpawnRequest(manifest, controllerId, {role: 'upgrade'})) {
          addSpawnRequest(manifest, {
            plan: {W: 1, C: 1, M: 1 },
            mem: {
              base: base.name,
              role: 'upgrade',
              node: controllerId
            },
            pri: .1
          })
        }
      }

      // request upgrade creep
      // addSpawnRequest(manifest, {
      //   plan: {},
      //   mem: {
      //     role: 'upgrader',
      //     node: controllerId,
      //
      //   }
      // })
    }
    // should it be added to the energyTargets list?

    // if (shouldUpgradeController(controllerId)) {
    //   createUpgradeJob(base)
    // }

  })
}
