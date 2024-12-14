let listUtils = require("./utils.list");
let mapUtils = require("./utils.map");
let requestUtils = require("./utils.requests");

module.exports.updateGlobal = function(actions) {
}

module.exports.updateBase = function(base, creepRequests, structureRequests, defenseRequests) {
  try {
    let baseMemory
    let level
    let roles
    let simpleHarvesterCount
    let harvesters
    let collectorCount
    let harvesterWorkPartCount

    try {
      baseMemory = base.memory;
      level = Game.rooms[base.name].controller.level;
      roles = baseMemory.roles;
      simpleHarvesterCount = roles['peon'].creeps.length;
      harvesters = roles['harvester'];
      collectorCount = roles['collector'].creeps.length;
      harvesterWorkPartCount = harvesters.parts.work;
    } catch (e) {
      console.log('init updateBase vars', e.stack)
    }
    console.log('aqui', baseMemory.sources.length)
    for (let i = 0; i < baseMemory.sources.length; i++) {
      let sourceMemory = Memory.sources[baseMemory.sources[i]];
      let maxHarvesters = sourceMemory.maxHarvesters;
      console.log('Max Harvesters: ', maxHarvesters)
      //Update containers
      let room = Game.rooms[sourceMemory.room];
      let containerMemory = sourceMemory.container;
      if (room) {
        containerMemory.amount = 0;
        checkContainer(room, containerMemory);
      }

      //Adjust max harvesters to a more reasonable value
      if (maxHarvesters > 2)
        maxHarvesters = 2;

      let sourceHarvesters = sourceMemory.harvesters;
      if (containerMemory.amount < 2000 && sourceHarvesters.length < maxHarvesters) {
        let sourceWorkParts = 0;
        for (let j = 0; j < sourceHarvesters.length; j++) {
          let creepMemory = Memory.creeps[sourceHarvesters[j]];
          if (!creepMemory) {
            listUtils.removeAt(sourceHarvesters, j--);
            continue;
          }
          sourceWorkParts += creepMemory.parts.work;
        }

        let maxSourceWorkParts;
        let room = Game.rooms[sourceMemory.room];
        if (!room || !mapUtils.isReserved(room))
          maxSourceWorkParts = 3;
        else
          maxSourceWorkParts = 6;

        console.log('Add harvester?', sourceWorkParts < maxSourceWorkParts && harvesterWorkPartCount < 42, sourceWorkParts < maxSourceWorkParts, harvesterWorkPartCount < 42)
        if (sourceWorkParts < maxSourceWorkParts && harvesterWorkPartCount < 42) {
          let id = baseMemory.sources[i];
          let roomMemory = Memory.rooms[Memory.sources[id].room];
          if (roomMemory && roomMemory.threatLevel <= 2) {
            let priority;
            let memory = {
              role: 'harvester',
              target: id
            };
            if ((harvesters.creeps.length + simpleHarvesterCount) < 3 && collectorCount < 3) {
              priority = 0.99;
              memory.role = 'peon';
            }
            else if (sourceHarvesters.length === 0)
              priority = 0.96;
            else
              priority = 0.80;
            requestUtils.add(creepRequests, priority, memory);
          }
        }
      }
    }

    if (level >= 6) {
      for (let i = 0; i < baseMemory.minerals.length; i++) {
        let mineralMemory = Memory.minerals[baseMemory.minerals[i]];
        let maxMiners = mineralMemory.maxMiners;

        //Update containers
        let room = Game.rooms[mineralMemory.room];
        let containerMemory = mineralMemory.container;
        let extractorMemory = mineralMemory.extractor;
        if (room) {
          containerMemory.amount = 0;
          checkContainer(room, containerMemory);
          checkExtractor(room, extractorMemory, mineralMemory.pos);
        }

        //Adjust max miners to a more reasonable value
        if (maxMiners > 1)
          maxMiners = 1;

        let mineralMiners = mineralMemory.miners;
        if (extractorMemory.id && containerMemory.id && containerMemory.amount < 2000 && mineralMemory.miners.length < maxMiners) {
          let sourceWorkParts = 0;
          for (let j = 0; j < mineralMiners.length; j++) {
            let creepMemory = Memory.creeps[mineralMiners[j]];
            if (!creepMemory) {
              listUtils.removeAt(mineralMiners, j--);
              continue;
            }
            sourceWorkParts += Memory.creeps[mineralMiners[j]].parts.work;
          }

          let room = Game.rooms[mineralMemory.room];
          if (sourceWorkParts < 6) {
            let id = baseMemory.minerals[i];
            let roomMemory = Memory.rooms[Memory.minerals[id].room];
            if (roomMemory && roomMemory.threatLevel <= 2) {
              let priority;
              let memory = {
                role: 'miner',
                target: id
              };
              if (mineralMiners.length === 0)
                priority = 0.96;
              else
                priority = 0.80;
              requestUtils.add(creepRequests, priority, memory);
            }
          }
        }
      }
    }
  } catch (e) {
    console.log('Error updating base.harvesters', e.stack)
  }
}


function checkContainer(room, containerMemory) {
  try {
    if (containerMemory.id) {
      delete containerMemory.site;
      var container = Game.getObjectById(containerMemory.id);
      if (container) {
        let sum = 0
        Object.keys(container.store).forEach(k => sum += container.store[k])
        containerMemory.amount = sum
      }

      else
        containerMemory.id = null; //Destroyed
    }
    else if (containerMemory.site) {
      var site = Game.constructionSites[containerMemory.site];
      if (!site)
        delete containerMemory.site;
    }

    if (!containerMemory.id && !containerMemory.site) {
      var pos = mapUtils.deserializePos(containerMemory.pos);
      if (pos) {
        if (room.createConstructionSite(pos.x, pos.y, STRUCTURE_CONTAINER) !== OK) {
          var structures = pos.lookFor(LOOK_STRUCTURES);
          for (let j = 0; j < structures.length; j++) {
            if (structures[j].structureType === STRUCTURE_CONTAINER) {
              containerMemory.id = structures[j].id;
              break;
            }
          }
          var sites = pos.lookFor(LOOK_CONSTRUCTION_SITES);
          for (let j = 0; j < sites.length; j++) {
            if (sites[j].structureType === STRUCTURE_CONTAINER) {
              containerMemory.site = sites[j].id;
              break;
            }
          }
        }
      }
    }
  } catch (e) {
    console.log('Error in checkContainer()', e.stack)
  }
}

function checkExtractor(room, extractorMemory, pos) {
  if (extractorMemory.id) {
    delete extractorMemory.site;
    var container = Game.getObjectById(extractorMemory.id);
    if (!container)
      extractorMemory.id = null; //Destroyed
  }
  else if (extractorMemory.site) {
    var site = Game.constructionSites[extractorMemory.site];
    if (!site)
      delete extractorMemory.site;
  }

  if (!extractorMemory.id && !extractorMemory.site) {
    var pos = mapUtils.deserializePos(pos);
    if (pos) {
      if (room.createConstructionSite(pos.x, pos.y, STRUCTURE_EXTRACTOR) !== OK) {
        var structures = pos.lookFor(LOOK_STRUCTURES);
        for (let j = 0; j < structures.length; j++) {
          if (structures[j].structureType === STRUCTURE_EXTRACTOR) {
            extractorMemory.id = structures[j].id;
            break;
          }
        }
        var sites = pos.lookFor(LOOK_CONSTRUCTION_SITES);
        for (let j = 0; j < sites.length; j++) {
          if (sites[j].structureType === STRUCTURE_EXTRACTOR) {
            extractorMemory.site = sites[j].id;
            break;
          }
        }
      }
    }
  }
}
