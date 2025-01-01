
const EXAMPLE_PLAN = {
  role: '',
  body: [],
  addOns: [],
  maxAddOns: -1, // 0,1,2,3...
  saturation: 1,

}

module.exports.PLANS = {
  spawn: {
    default: {
      role: 'miner',
      body: [CARRY, MOVE, WORK, CARRY, MOVE], // 300
      addOns: [CARRY, MOVE], // 100
      maxAddOns: 3,
      saturation: 1
    },
    containerized: {
      role: 'miner',
      body: [WORK, WORK, MOVE, CARRY], // 300
      addOns: [WORK], // 100
      maxAddOns: 3,
      saturation: 1
    }
  },
  [STRUCTURE_CONTAINER]: {
    default: {
      role: 'supplier',
      body: [CARRY, MOVE], // 300
      addOns: [CARRY, MOVE], // 100
      maxAddOns: 6,
      saturation: 1
    }
  },
  maint: {
    role: 'maint',
    body: [CARRY, MOVE], // 300
    addOns: [CARRY, MOVE], // 100
    maxAddOns: 6,
    saturation: 1
  }
}
