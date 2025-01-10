const {CREEP_MIN_LIFE_TICKS} = require('./config')
const {getDestNode} = require('./utils.nodes')
const {ACTIONS} = require('./actions')

Object.defineProperty(Creep.prototype, 'node', {
  get: function() { return _.get(Memory, ['nodes', this.memory.nodeId]) }, enumerable: false, configurable: true
});
Object.defineProperty(Creep.prototype, 'energyNeeded', {
  get: function() { return this.store.getFreeCapacity(RESOURCE_ENERGY) }, enumerable: false, configurable: true
});
Object.defineProperty(Creep.prototype, 'energy', {
  get: function() { return this.store.getUsedCapacity(RESOURCE_ENERGY) }, enumerable: false, configurable: true
});
Object.defineProperty(Creep.prototype, 'capacity', {
  get: function() { return this.store.getCapacity(RESOURCE_ENERGY) }, enumerable: false, configurable: true
});


Creep.prototype.runMiner = function runTask() {
  if (this.energy > 0 || this.ticksToLive < CREEP_MIN_LIFE_TICKS) {
    let trgInfo = getDestNode(this.node, this, {canWork: true, minCapacity: 1})
    if (trgInfo.trg) {
      ACTIONS[trgInfo.action].start(this, trgInfo.trg)
    }
  }
  if (this.energyNeeded >= this.energy) {
    ACTIONS.harvest.start(this, this.memory.nodeId)
  }
}
