const roleHarvester = require('./role.harvester')
const roleUpgrader = require('./role.upgrader')
const roleBuilder = require('./role.builder')
const General = require('./general.basic')
const Mercury = require('./general.mercury')
const {buildNear, freeResources} = require('./utils')
const memoryUtils = require('./utils.memory')
const strategy = {
  name: 'start',
  status: 'running',
  goals: [
    {type: 'spawnCreep', role: 'harvester', count: 2, buildPlan: [WORK,CARRY,MOVE], done: false, cost: 200},
    {type: 'spawnCreep', role: 'upgrader', count: 1, buildPlan: [WORK,CARRY,MOVE], done: false, cost: 200},
    {type: 'spawnCreep', role: 'builder', count: 1, buildPlan: [WORK,CARRY,MOVE], done: false, cost: 200},
    {type: 'build', role: STRUCTURE_EXTENSION, count: 6, done: false, cost: 100},
  ]
}
const ROLE_MAP = {
  harvester: roleHarvester,
  upgrader: roleUpgrader,
  builder: roleBuilder
}

function init() {
  // memoryUtils.init();

  //Set up military roles
  // var militaryMemory = Memory.military;
  // for (let manager in unitManagers)
  //   militaryMemory.roles[manager] = memoryUtils.createRole();
  Memory.Generals = []
  Memory.init = true
}
const FREE_RESOURCE_INTERVAL = 10
module.exports.loop = function () {
  /**
   * INITIALIZE
   */

  // if (!Memory.Generals) {
  //   Memory.Generals = [new General('start', {})]
  // }
  //
  // /**
  //  * GATHER FREE RESOURCES
  //  */
  // let available
  // const cleanupTime = Game.time % FREE_RESOURCE_INTERVAL
  // if (cleanupTime === 0) {
  //   available = freeResources()
  // }
  //
  // /**
  //  * RUN
  //  */
  // Memory.Generals.forEach(general => {
  //   console.log(JSON.stringify(general))
  //   general.run(available)
  // })



    // for(var name in Memory.creeps) {
    //     if(!Game.creeps[name]) {
    //         delete Memory.creeps[name];
    //         console.log('Clearing non-existing creep memory:', name);
    //     }
    // }
    // var harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester');
    // console.log('Harvesters: ' + harvesters.length)
    // if(harvesters.length < 2) {
    //     var newName = 'Harvester' + Game.time;
    //     console.log('Spawning new harvester: ' + newName);
    //     Game.spawns['Spawn1'].spawnCreep([WORK,CARRY,MOVE], newName,
    //         {memory: {role: 'harvester'}});
    // }

    // if(Game.spawns['Spawn1'].spawning) {
    //     var spawningCreep = Game.creeps[Game.spawns['Spawn1'].spawning.name];
    //     Game.spawns['Spawn1'].room.visual.text(
    //         '🛠️' + spawningCreep.memory.role,
    //         Game.spawns['Spawn1'].pos.x + 1,
    //         Game.spawns['Spawn1'].pos.y,
    //         {align: 'left', opacity: 0.8});
    // }


  // if (!Memory.init) {
  //   if (!Game.spawns.length) {
  //     console.log('Place Spawn!')
  //   } else {
  //     Memory.goals = [{
  //       strategy: 'start',
  //       room: Game.spawns[0].
  //     }]
  //     Memory.init = true
  //   }
  //
  // }
  var spawns = Game.spawns
  var creeps = Game.creeps
  // var availableEnergy = 0
  // for (var name in spawns) {
  //   var spawn = spawns[name]
  //   if (!spawn.memory.init) {
  //     roleSpawn.init(spawn)
  //   } else {
  //     roleSpawn.run(spawn)
  //     availableEnergy = availableEnergy + spawn.room.energyAvailable
  //   }
  // }
  let creepCounts = {}
  for(var name in creeps) {
    if(!creeps[name]) {
         delete Memory.creeps[name];
         console.log('Clearing non-existing creep memory:', name);
    }
    var creep = creeps[name];
    var runner = ROLE_MAP[creep.memory.role]
    creepCounts[creep.memory.role] = creepCounts[creep.memory.role] ?  creepCounts[creep.memory.role] + 1 : 1
    runner.run(creep)
  }
  let myStructures = []
  let myStructuresCounts = {}
  strategy.goals.some(goal => {
    let keepChecking = false
    switch (goal.type) {
      case 'spawnCreep':
        if (!creepCounts[goal.role] || creepCounts[goal.role] < goal.count) {
          goal.done = false
          // do a spawn
          const res = Object.keys(spawns).some(name => {
            var spawn = spawns[name]
            if (!spawn.spawning && spawn.room.energyAvailable > goal.cost) {
              const res = spawn.spawnCreep(goal.buildPlan, `${goal.role}_${creepCounts[goal.role] ?? '0'}`, { memory: { role: goal.role }});
              if(spawn.spawning) { spawn.room.visual.text('🛠️' + Game.creeps[spawn.spawning.name].memory.role, spawn.pos.x + 1, spawn.pos.y, {align: 'left', opacity: 0.8});}
              if (res === 0) {
                return true
              } else {
                // didnt work
                console.log('Tried to spawn ', goal.role, 'but failed because ', res)
              }
            } else {
              return false
            }
          })
          if (res) {
            keepChecking = true
          }
        } else {
          goal.done = true
        }
        break
      case 'build':
        if (!myStructures.length) {
          for (var name in spawns) {
            var spawn = spawns[name]
            myStructures = myStructures.concat(spawn.room.find(FIND_MY_STRUCTURES))
          }
          myStructures.forEach(s => {
            // myStructuresCounts  structureType
            myStructuresCounts[s.structureType] = myStructuresCounts[s.structureType] ? 1 : myStructuresCounts[s.structureType] + 1
          })
        }
        if (!myStructuresCounts[goal.role] || myStructuresCounts[goal.role] < goal.count) {
          // try to build
          for (var name in spawns) {
            const spawn = spawns[name]
            // console.log(JSON.stringify(spawn.room.controller.level > 1, (spawn.room.energyAvailable * 3) > spawn.room.energyCapacityAvailable, spawn.room.energyCapacityAvailable < 800, spawn.room.find(FIND_MY_CONSTRUCTION_SITES).length < 1))
            if (
              spawn.room.controller.level >= 1 &&
              (spawn.room.energyAvailable * 3) > spawn.room.energyCapacityAvailable &&
              spawn.room.energyCapacityAvailable < 800 &&
              spawn.room.find(FIND_MY_CONSTRUCTION_SITES).length < 1
            ) {
              keepChecking = !buildNear(spawn.pos, STRUCTURE_EXTENSION)
            }
          }
        } else {
          goal.done = true
        }
        break
      default:
        console.log('Unhandled Goal! ', JSON.stringify(goal))
    }
    return keepChecking
  })
  Object.keys(creepCounts).forEach(role => {

  })
}
/**
 * Tactics:
 * - build extension: {}
 *
 * General => Strategy
 * Captain => Tactic
 *
 * at start:
 * - start a strategy
 *    - Pioneer
 *      - build harvester
 *      - build builder
 *      - make extention
 *      - build miner
 *      - build logistic
 *
 *
 * - Creep Types:
 *  - Harvester - walk move carry. starter.
 *  -
 */



//Game.rooms.sim.createConstructionSite(10, 15, STRUCTURE_ROAD);


//Game.spawns['Spawn1'].spawnCreep( [WORK, WORK, WORK, WORK, WORK, MOVE], 'Harvester1' )

// Game.spawns['Spawn1'].spawnCreep( [WORK, CARRY, MOVE], 'Harvester1' )
// Game.spawns['Spawn1'].spawnCreep( [WORK, CARRY, MOVE], 'Upgrader1' );
// Game.spawns['Spawn1'].spawnCreep( [WORK, CARRY, MOVE], 'Builder1',
//   { memory: { role: 'builder' } } );



// var creep = Game.creeps['Harvester1'];
// var sources = creep.room.find(FIND_SOURCES);
// if(creep.harvest(sources[0]) == ERR_NOT_IN_RANGE) {
//   creep.moveTo(sources[0]);
// }

// var creep = Game.creeps['Harvester1'];
//
// if(creep.store.getFreeCapacity() > 0) {
//   var sources = creep.room.find(FIND_SOURCES);
//   if(creep.harvest(sources[0]) == ERR_NOT_IN_RANGE) {
//     creep.moveTo(sources[0]);
//   }
// }
// else {
//   if( creep.transfer(Game.spawns['Spawn1'], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE ) {
//     creep.moveTo(Game.spawns['Spawn1']);
//   }
// }

// for(var name in Game.creeps) {
//   var creep = Game.creeps[name];
//
//   if(creep.store.getFreeCapacity() > 0) {
//     var sources = creep.room.find(FIND_SOURCES);
//     if(creep.harvest(sources[0]) == ERR_NOT_IN_RANGE) {
//       creep.moveTo(sources[0]);
//     }
//   }
//   else {
//     if(creep.transfer(Game.spawns['Spawn1'], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
//       creep.moveTo(Game.spawns['Spawn1']);
//     }
//   }
// }


// Game.creeps['Harvester1'].memory.role = 'harvester';
// Game.creeps['Upgrader1'].memory.role = 'upgrader';
