const roleHarvester = require('./role.harvester')
const roleUpgrader = require('./role.upgrader')
const roleBuilder = require('./role.builder')
const {initBase} = require('./utils.memory')
const memoryUtils = require('./utils.memory')
const actions = require('./actions')

const militaryGenerals = [
  { general: require('military.creeps'), offset: 0, interval: 1 }, //Checks for destroyed creeps
  // { general: require('military.flags'), offset: 0, interval: 1 }, //Checks for destroyed flags
  //
  { general: require('military.intel'), offset: 1, interval: 2 }, //Updates power levels in each room
  // { general: require('military.rally'), offset: 1, interval: 2 }, //Processes new rally flags
  //
  // //Managers that request units (must be the same tick as base.spawns)
  { general: require('military.claims'), offset: 1, interval: 2 }, //Processes claim flags, requests remote builders
  // { general: require('military.reservations'), offset: 1, interval: 2 }, //Requests reservers
  // { general: require('military.defense'), offset: 1, interval: 2 }, //Requests defenders
  // { general: require('military.squads'), offset: 1, interval: 2 } //Processes attack squads
]
const baseGenerals = [
  { general: require('base.creeps'), offset: 0, interval: 1 }, //Checks for destroyed creeps
  { general: require('base.storage'), offset: 0, interval: 1 }, //Updates storages/resources needing pickup, and nonfull dropoffs
  //
  // //Managers that request structures (must be the same tick as base.construction)
  { general: require('base.structures'), offset: 0, interval: 2 }, //Requests structures
  { general: require('base.construction'), offset: 0, interval: 2 }, //Checks construction sites, destroyed structures, creates structures
  //
  // //Managers that request units (must be the same tick as base.spawns)
  { general: require('base.harvesters'), offset: 1, interval: 2 }, //Requests harvesters and miners
  { general: require('base.builders'), offset: 1, interval: 2 }, //Requests builders/repairers and assigns targets
  { general: require('base.transporters'), offset: 1, interval: 2 }, //Requests collectors/rechargers/scavengers and assigns targets
  { general: require('base.upgraders'), offset: 1, interval: 2 }, //Requests upgraders/maintainers
  { general: require('base.territory'), offset: 1, interval: 2 }, //Requests scouts, claims bases/rooms
  { general: require('base.spawns'), offset: 1, interval: 2 }, //Spawns creeps
  //
  // //Must be last:
  { manager: require('base.declump'), offset: 0, interval: 2 }, //Moves creeps away from spawns
]
const unitGenerals = {
  // builder_remote: require('unit.builder_remote'),
  // claimer: require('unit.claimer'),
  // healer: require('unit.healer'),
  // reserver: require('unit.reserver'),
  // scout: require('unit.scout'),
  // melee: require('unit.melee'),
  // ranged: require('unit.ranged'),
  // hybrid: require('unit.hybrid')
}
const creepGenerals = {
  builder_defense: require('role.builder_defense'),
  builder_road: require('role.builder_road'),
  builder_structure: require('role.builder_structure'),
  collector: require('role.collector'),
  harvester: require('role.harvester'),
  peon: require('role.peon'),
  // healer: require('role.healer'),
  // maintainer: require('role.maintainer'),
  miner: require('role.miner'),
  // recharger: require('role.recharger'),
  // recharger_core: require('role.recharger_core'),
  // repairer: require('role.repairer'),
  scavenger: require('role.scavenger'),
  upgrader: require('role.upgrader')
}
var towerGeneral = require('structure.tower');
function initMemory () {

  memoryUtils.init();
  Memory.init = true
}

module.exports.loop = function () {
  if (!Memory.init) {
    initMemory()
  }

  gatherGlobal()
  for (let name in Memory.bases)
    runBase(name);
  for(var name in Game.creeps)
    runCreep(Game.creeps[name]);


  // var spawns = Game.spawns
  // var creeps = Game.creeps
  //
  // /**
  //  * Define Goals
  //  */
  //
  // // given...
  //
  // let creepCounts = {}
  // let myStructures = []
  // let myStructuresCounts = {}
  // for(var name in creeps) {
  //   if(!creeps[name]) {
  //        delete Memory.creeps[name];
  //        delete Game.creeps[name];
  //        console.log('Clearing non-existing creep memory:', name);
  //   }
  //   var creep = creeps[name];
  //   var runner = ROLE_MAP[creep.memory.role]
  //   creepCounts[creep.memory.role] = creepCounts[creep.memory.role] ?  creepCounts[creep.memory.role] + 1 : 1
  //   runner.run(creep)
  // }
  //
  //
  // strategy.goals.some(goal => {
  //   let keepChecking = false
  //   switch (goal.type) {
  //     case 'spawnCreep':
  //       if (!creepCounts[goal.role] || creepCounts[goal.role] < goal.count) {
  //         goal.done = false
  //         // do a spawn
  //         const res = Object.keys(spawns).some(name => {
  //           var spawn = spawns[name]
  //           if (!spawn.spawning && spawn.room.energyAvailable > goal.cost) {
  //             let lowestName = `${goal.role}_0`
  //             if (creepCounts[goal.role]) {
  //               let i = 0
  //               let found = false
  //               while(!found && i <= creepCounts[goal.role]) {
  //                 const testName =`${goal.role}_${i}`
  //                 if (!Game.creeps[testName]) {
  //                   lowestName = testName
  //                   found = true
  //                 }
  //                 i++
  //               }
  //             }
  //
  //             const res = spawn.spawnCreep(goal.buildPlan, lowestName, { memory: { role: goal.role }});
  //             if(spawn.spawning) { spawn.room.visual.text('🛠️' + Game.creeps[spawn.spawning.name].memory.role, spawn.pos.x + 1, spawn.pos.y, {align: 'left', opacity: 0.8});}
  //             if (res === 0) {
  //               return true
  //             } else {
  //               // didnt work
  //               console.log('Tried to spawn ', goal.role, 'but failed because ', res, lowestName, creepCounts[creep.memory.role])
  //             }
  //           } else {
  //             return false
  //           }
  //         })
  //         if (res) {
  //           keepChecking = true
  //         }
  //       } else {
  //         goal.done = true
  //       }
  //       break
  //     case 'build':
  //       if (!myStructures.length) {
  //         for (var name in spawns) {
  //           var spawn = spawns[name]
  //           myStructures = myStructures.concat(spawn.room.find(FIND_MY_STRUCTURES))
  //         }
  //         myStructures.forEach(s => {
  //           // myStructuresCounts  structureType
  //           myStructuresCounts[s.structureType] = myStructuresCounts[s.structureType] ? 1 : myStructuresCounts[s.structureType] + 1
  //         })
  //       }
  //       if (!myStructuresCounts[goal.role] || myStructuresCounts[goal.role] < goal.count) {
  //         // try to build
  //         for (var name in spawns) {
  //           const spawn = spawns[name]
  //           // console.log(JSON.stringify(spawn.room.controller.level > 1, (spawn.room.energyAvailable * 3) > spawn.room.energyCapacityAvailable, spawn.room.energyCapacityAvailable < 800, spawn.room.find(FIND_MY_CONSTRUCTION_SITES).length < 1))
  //           if (
  //             spawn.room.controller.level >= 1 &&
  //             (spawn.room.energyAvailable * 3) > spawn.room.energyCapacityAvailable &&
  //             spawn.room.energyCapacityAvailable < 800 &&
  //             spawn.room.find(FIND_MY_CONSTRUCTION_SITES).length < 1
  //           ) {
  //             keepChecking = !buildNear(spawn.pos, STRUCTURE_EXTENSION)
  //           }
  //         }
  //       } else {
  //         goal.done = true
  //       }
  //       break
  //     default:
  //       console.log('Unhandled Goal! ', JSON.stringify(goal))
  //   }
  //   return keepChecking
  // })
}

/**
 * After this, all rooms with spawns will have a room in memory
 */
function gatherGlobal () {
  try {
    Game.creepGenerals = creepGenerals;
    Game.unitGenerals = unitGenerals;
    for (let spawnName in Game.spawns) {
      var spawn = Game.spawns[spawnName];
      if (!Memory.bases[spawn.room.name]) {
        createBase(spawn.room);
        Memory.structures[spawn.id] = {};
      }
    }
    for (let i = 0; i < baseGenerals.length; i++) {
      var gen = baseGenerals[i];
      gen.general.updateGlobal(actions);
    }
    // if (runManagers) {
    //   for (let i = 0; i < militaryManagers.length; i++) {
    //     var manager = militaryManagers[i];
    //     if (hasElapsed(manager.offset, manager.interval))
    //       manager.manager.updateGlobal(actions);
    //   }
    //   for (let i = 0; i < baseManagers.length; i++) {
    //     var manager = baseManagers[i];
    //     if (hasElapsed(manager.offset, manager.interval))
    //       manager.manager.updateGlobal(actions);
    //   }
    // }

  } catch (e) {
    console.log("[!] gatherGlobal Error: " + e.stack);
  }
}

function runBase (name) {
  var base = {
    name: name,
    memory: Memory.bases[name],
    dropoffs: [],
    pickups: []
  };

  try
  {
    try {
      if (!Game.bases) {
        Game.bases = {}
      }
      Game.bases[name] = base;
    } catch (e) {
      console.log('failed to set base', name, e.stack)
    }

    try {
      if (!Game.rooms[name]) {
        destroyBase(base);
        return;
      }
    } catch (e) {
      console.log('failed to destroy base')
    }


    var creepRequests = [];
    var structureRequests = [];
    var defenseRequests = [];

    try {
      for (let i = 0; i < militaryGenerals.length; i++) {
        var gen = militaryGenerals[i];
        try {
          gen.general.updateBase(base, actions, creepRequests, structureRequests, defenseRequests);
        } catch (e) {
          console.log('Failed to run Military General: ', gen)
        }
      }
      for (let i = 0; i < baseGenerals.length; i++) {
        var gen = baseGenerals[i];
        try {
          gen.general.updateBase(base, actions, creepRequests, structureRequests, defenseRequests);
        } catch (e) {
          console.log('Failed to run Base General: ', i, e.stack)
        }
      }
    } catch (e) {
      console.log('failed to run base',name,  e.stack)
    }


    //Update structures
    var towers = base.memory.structures[STRUCTURE_TOWER];
    for(var i = 0; i < towers.length; i++)
      towerGeneral.updateTower(Game.structures[towers[i]], actions);

  } catch (e) {
    if (base.memory && !base.memory.error)
      base.memory.error = e.stack;
    console.log("[!] Base Error (" + name + "): " + e.stack);
  }
}

function runCreep(creep) {
  try {
    if (creep.spawning)
      return;

    if (!actions.hasAnyAction(creep)) {
      if (creep.pos.x === 0 || creep.pos.y === 0 ||
        creep.pos.x === 49 || creep.pos.y === 49)
        actions.flee(creep, creep, 1);
    }
    if (actions.continueAction(creep) !== true) {
      if (creep.memory.military) {
        unitGenerals[creep.memory.role].run(creep, creep.memory, actions);
      } else {
        creepGenerals[creep.memory.role].run(creep, creep.memory, actions);
      }
    }

  } catch (error) {
    console.log("[!] Creep Error (" + creep.name + "): " + error.stack);
  }
}


function createBase (room) {
  try {
    var baseMemory = memoryUtils.createBaseMemory();
    var base = {
      name: room.name,
      memory: baseMemory
    };
    Memory.bases[room.name] = baseMemory;
    Game.bases[room.name] = base;

    baseMemory.structures[STRUCTURE_CONTROLLER] = [];
    for (let structureType in CONSTRUCTION_COST) {
      if (structureType !== STRUCTURE_RAMPART &&
        structureType !== STRUCTURE_WALL &&
        structureType !== STRUCTURE_ROAD &&
        structureType !== STRUCTURE_CONTAINER)
        baseMemory.structures[structureType] = [];
    }

    var structures = room.find(FIND_MY_STRUCTURES);
    for (let i = 0; i < structures.length; i++) {
      var structure = structures[i];
      var list = baseMemory.structures[structure.structureType];
      if (list) {
        list.push(structure.id)
      }
      if (structure.structureType === STRUCTURE_SPAWN) {
        baseMemory.spawns.push(structure.name)
      }
    }
    for (let general in creepGenerals)
      baseMemory.roles[general] = memoryUtils.createRoll()

    console.log(base.name + ': Created');
  } catch (e) {
    console.log("[!] Create Base Error (" + room.name + "): " + e.stack);
  }

}

function destroyBase(base) {
  delete Memory.bases[base.name];
  delete Game.bases[base.name];

  console.log(base.name + ': Destroyed');
}
