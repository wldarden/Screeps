const {CREEP_MIN_LIFE_TICKS} = require('./config')
const {getDestNode, getChildren, runChildren, getNodePos, addNodeToParent} = require('./utils.nodes')
const {ACTIONS} = require('./actions')
const {createStorageNode, createBaseNode, serializePos, createSpawnNode, createControllerNode, createSrcNode,
  deserializePos
} = require('./utils.memory')
const {getSlotsAround} = require('./utils.cartographer')
const {runBase} = require('./node.base')
const {destroyCreep, creepPlanInfo} = require('./utils.creep')
const {spawnForNode} = require('./utils.spawner')




class Sites {
  static cache = {}
  static clearCache() {
    this.cache = {};
  }
  //static createBase(spawn) {
  //  let base = new Base (spawn.room.name)
  //  base.initialize(spawn)
  //}

  static changeType (site) {
    // remove from parent,
    site.removeParent()
    // change siteType
    // add to parent
  }
  static getSiteName (type) {
    let i = 0
    while (Memory.nodes[`${type}-${i}`]) { i++ }
    return `${type}-${i}`
  }
  static createSite (id, type, initParams) {
    let newSite
    switch (type) {
      case 'mine':
        newSite = new Mine(id).initialize(initParams)
        break
      case 'log':
        newSite = new Logistic(id).initialize(initParams)
        break
      case 'base':

        newSite = new Base(id).initialize(initParams)
        break
      case 'spawn':
        newSite = new Spawn(id).initialize(initParams)
        break
      //case 'ec':
      //  //site = new Logistic(id);
      //  break;
      //case STRUCTURE_CONTAINER:
      //  //site = new Logistic(id);
      //  break;
      //case STRUCTURE_EXTENSION:
      //  //site = new Logistic(id);
      //  break;
      //case STRUCTURE_CONTAINER:
      //  //site = new Logistic(id);
      //  break;
      default:
        console.log('Error: unsupported site type: ', type)
        break
    }
    return newSite
  }
  static getSite (id) {
    if (typeof id !== 'string' && id instanceof Site) { return id } // was already a site
    if (this.cache[id]) {
      return this.cache[id]
    }
    const mem = Memory.sites?.[id];
    if (!mem) {
      console.error(`Node with id ${id} not found in memory.`);
      return null;
    }

    let site;
    switch (mem.type) {
      case 'mine':
        site = new Mine(id)
        break;
      case 'log':
        site = new Logistic(id);
        break;
      case 'base':
        site = new Base(id);
        break;
      //case 'ec':
      //  //site = new Logistic(id);
      //  break;
      //case STRUCTURE_CONTAINER:
      //  //site = new Logistic(id);
      //  break;
      //case STRUCTURE_EXTENSION:
      //  //site = new Logistic(id);
      //  break;
      //case STRUCTURE_CONTAINER:
      //  //site = new Logistic(id);
      //  break;
    }
    if (!site) {
      console.log(`wasnt able to get site of type ${mem.type} in Sites.getSite`)
    }
    this.cache[id] = site
    return site;
  }
}

//class Children {
//  constructor (childObj) {
//    //this.
//  }
//  getTypeChildren (type) {
//    if (!this._typeChildren) {
//      this._typeChildren = {}
//    }
//    if (!this._typeChildren[type]) {
//      let typeChildrenIds = this.mem.children[type] || []
//      this._typeChildren[type] = typeChildrenIds
//        .map(childId => Sites.getSite(childId))
//        .filter(child => child !== null ? true : this.error('missing child'))
//    }
//    return this._typeChildren[type]
//  }
//
//  get all () {
//    if (!this._children) {
//      this._children = []
//      Object.keys(this.mem.children).forEach(type => {
//        this._children = this._children.concat(this.getTypeChildren(type))
//      })
//    }
//    return this._children;
//  }
//}
class Site {
  constructor(id) {
    Memory.sites[id] = Memory.sites[id] || {
      type: null,

      base: null,
      parent: null,
      dist: null,

      children: {},
      creeps: {},

      srcs: [],
      dests: [],
      ept: 0,
      stage: 0,
      spawnReqCount: 0,
    };

    this.mem = Memory.sites[id];
    //if (this.mem.parent) {
    //  this.parent = Sites.getSite(this.mem.parent)
    //
    //}
    //this.base = this.mem.base || this.parent.base
    this.type = this.mem.type
    this.stage = this.mem.stage
    //this.children = []
    this.pos = this.mem.pos
    this.id = id;
  }

  initialize () {
    return this
  }

  get base () {
    if (!this._base) {
      if (this.mem.base) {
        this._base = this.mem.base
      } else if (this.parent) {
        if (this.parent.type === 'base') {
          this._base = this.parent.id
        } else {
          this._base = this.parent.base
        }
        this.mem.base = this._base
      }
    }
    return this._base;
  }
  get gameSite () {
    if (!this._gameSite) {
      this._gameSite = Game.getObjectById(this.id)
      if (!this._gameSite) {
        console.log(`Error: couldnt get gameSite of ${this.type} ${this.id}`)
      }
    }
    return this._gameSite;
  }
  get pos () {
    if (!this._pos) {
      if (this.gameSite) {
        this._pos =  this.gameSite.pos
      } else if (this.parent) {
        this.error('Used parents pos:')
        this.parent.error(`Parent pos: ${serializePos(this.parent.pos)}`)
        this._pos = this.parent.pos
      } else {
        console.log(`Error: couldnt get pos of ${this.id}`)
      }
    }
    return this._pos
  }
  clearCache (field) {
    //let memField = field
    if (typeof field === 'string' && field.charAt(0) !== '_') {
      //memField = field
      field = '_' + field
    }
    //else {
    //  //memField = field.slice(0)
    //}
    delete this[field]
    //delete this.mem[field]
  }

  getTypeChildren (type) {
    if (!this._typeChildren) {
      this._typeChildren = {}
    }
    if (!this._typeChildren[type]) {
      let typeChildrenIds = this.mem.children[type] || []
      this._typeChildren[type] = typeChildrenIds
        .map(childId => Sites.getSite(childId))
        .filter(child => child !== null ? true : this.error('missing child'))
    }
    return this._typeChildren[type]
  }
  get children() {
    if (!this._children) {
      this._children = []
      Object.keys(this.mem.children).forEach(type => {
        this._children = this._children.concat(this.getTypeChildren(type))
      })
    }
    return this._children;
  }

  get parent() {
    if (this._parent && this._parent.id === this.mem.parent) {
      return this._parent
    } else if (!this._parent && this.mem.parent) {
      this._parent = Sites.getSite(this.mem.parent)
    }
    return this._parent;
  }

  error (msg = '') {
    console.log(`Error: ${this.type} ${this.id}: ${msg}`)
  }
  removeCreep (creep) {
    creep = Creeps.getCreep(creep)
    //if (creep === 'string') { creep = Creeps.getCreep(creep) }
    this.mem.recalcEpt = true
    if (this.mem.creeps[creep.role]) {
      if (this.mem.creeps[creep.role].length <= 1) {
        delete this.mem.creeps[creep.role]
      } else {
        this.mem.creeps[creep.role] = this.mem.creeps[creep.role].filter(cId => cId !== this.id && !!Game.creeps[cId]) // remove creep from old node and this.role
      }
    }
  }
  addCreep (creep) {
    if (creep === 'string') {
      creep = Creeps.getCreep(creep)
    }
    if (creep) {
      if (creep.mem.siteId && creep.mem.role && creep.mem.siteId !== this.id) {
        creep.leaveSite()
      }
      let role = creep.mem.role
      creep.mem.siteId = this.id

      if (!this.mem.creeps[role]) { this.mem.creeps[role] = [] }
      if (!this.mem.creeps[role].includes(creep.id)) {
        this.mem.creeps[role].push(creep.id) // add creep to new node
      }
    }
  }
  removeParent () {
    //removeNodeFromParent(node, child.parent)
    if (this.parent) {
      this.parent.removeSite(this)
      this.clearCache('parent')
    }
    this.clearCache('dist')
    delete this.mem.parent
    console.log('removing parent not fully instantiated')
  }

  get dist () {
    if (!this._dist) {
      if (this.mem.dist) {
        this._dist = this.mem.dist
      } else {
        if (this.parent) {
          this._dist = this.pos.findPathTo(this.parent.pos, {ignoreCreeps: true}).length
        } else {
          console.log(`Error: no parent to get dist to for ${this.id}`)
        }
      }
    }
    return this._dist
  }

  calcEpt (newEpt) {
    if (newEpt === undefined) {
      newEpt = 0
      this.children.forEach(child => { newEpt = newEpt + child.ept })
    }
    const bubble = this.mem.ept !== newEpt
    this.mem.ept = newEpt
    delete this.mem.recalcEpt
    if (bubble) { this.parent.calcEpt() }
    return newEpt
  }
  get ept () { return (this.mem.ept === undefined || this.mem.recalcEpt) ? this.calcEpt() : this.mem.ept }

  removeSite (child) {
    child = Sites.getSite(child)
    if (child && child.type) {
      this.mem.children[child.type] = this.mem.children[child.type].filter(cId => cId !== child.id)
      this._typeChildren[child.type] = this._typeChildren[child.type].filter(ch => ch.id !== child.id)
      this.clearCache('children')
    }
  }

  changeId(newId) {
    if (newId === this.id) { return }
    const oldId = this.id

    if (this.parent) { // Update parent's children array
      this.parent.removeSite(this);
      this.id = newId;
      this.parent.addSite(this);
    }

    Memory.nodes[newId] = Memory.nodes[oldId] // Update memory reference
    delete Memory.nodes[oldId]
    this.id = newId
    this.mem = Memory.nodes[newId]

    this.children.forEach(child => this.addSite(child)) // update childrens parent
    this.creeps.forEach(c => this.addCreep(c.id)) // update childrens parent
  }

  get creeps () {
    if (!this._creeps) {
      this._creeps = []
      if (!this.mem.creeps) { return this._creeps }

      Object.keys(this.mem.creeps).forEach(type => {
        this._creeps = this._creeps.concat(this.getTypeCreeps(type))
      })
    }
    return this._creeps;
  }

  getTypeCreeps (type) {
    if (!type) { return this.creeps }
    if (!this._typeCreeps) { this._typeCreeps = {} }
    if (!this._typeCreeps[type]) {
      let typeCreepIds = this.mem.children[type] || []
      this._typeCreeps[type] = typeCreepIds
        .map(cId => Creeps.getCreep(cId))
        .filter(cId => cId !== null ? true : this.error('missing child'))
    }
    return this._typeCreeps[type]
  }
  addSite (child) {
    if (!child) { return }

    child = Sites.getSite(child)
    if (!child.mem.base) {
      child.mem.base = this.base
    }
    if (child.mem.parent && child.mem.parent !== this.id) {
      child.removeParent()
    }

    // save children to memory
    if (!this.mem.children[child.mem.type]) {
      this.mem.children[child.mem.type] = [child.mem.id]
    } else if (!this.mem.children[child.mem.type].some(cId => cId === child.mem.id)) {
      this.mem.children[child.mem.type].push(child.mem.id)
    }

    // update live caches if needed
    if (this._typeChildren && this._typeChildren[child.mem.type]) {
      this._typeChildren[child.mem.type].push(child) // add child to type children cache
      if (this._children) {
        this._children.push(child) // add child to all children cache
      }
    }

    child.mem.parent = this.id

    //Memory.sites[child.mem.id] = child
    //if (newId && child.mem.creeps) {
    //  Object.keys(child.mem.creeps).forEach(role => {
    //    child.mem.creeps[role].forEach(cId => {
    //      addCreepToNode(child.mem.id, role, cId)
    //    })
    //  })
    //}
  }
  run (parent) {
    this.runChildren()
  }
  runChildren () {
    let children = this.getChildren()
    if (!node || !this.children) {
      return
    }


    let childLineage = [...lineage, this.id]
    for (let nodeType in this.mem.children) {

      let nodeRunnerDef = getNodeRunner(nodeType)
      if (nodeRunnerDef) {
        node.children[nodeType].forEach(childId => {

        })
      }
    }
  }
}

class MetaSite extends Site {

  constructor (id) {
    super(id)

  }

  getPos () {

  }
  get pos () {
    if (!this._pos) {
      if (this.mem.pos) {
        this._pos = deserializePos(this.mem.pos)
      } else if (this.parent) {
        this.error('Used parents pos:')
        this.parent.error(`Parent pos: ${serializePos(this.parent.pos)}`)
        let pos = this.parent.pos
        if (pos) {
          this.mem.pos = serializePos(pos)
          this._pos = pos
        }
      }
    }
    return this._pos
  }
}
class MineSite extends Site {
  constructor (id) {
    super(id)
    //
  }

  initialize () {
    let slots = getSlotsAround(this.pos)
    this.mem.slots = {}
    slots.forEach(pos => this.mem.slots[pos] = false)
    this.mem.dist = this.getDist()//spawn.pos.findPathTo(src.getPos(), {ignoreCreeps: true}).length
    return this
  }
  addCreep(creep) {
    super.addCreep(creep)
    this.mem.recalcEpt = true
  }

  get miners () {
    if (!this._miners) {
      this._miners = this.getTypeCreeps('miner')
    }
    return this._miners || []
  }

  calcEpt () {
    let newEpt
    const workParts = 1 // ASSUMED 1 work part
    const load = 100 // ASSUMED 2 carry parts
    const travelTicks = (this.stage < 3) ? (this.dist * 3) : 3 // ASSUMED speed of 1tps empty, 2 tps full miners : ASSUMED container is ~3 ticks away when dropping off in the container

    const workSpeed = workParts * 2 // energy mined per tick when harvesting
    const workTicks = load / workSpeed
    const loadTicks = travelTicks + workTicks
    const eptPerMiner =  load / loadTicks
    const creepsPerSlot = loadTicks / workTicks
    const maxCreeps = Object.keys(this.mem.slots).length * creepsPerSlot
    const currentEpt =  Math.min(this.miners.length, maxCreeps) * eptPerMiner
    //const maxEpt = maxCreeps * eptPerMiner
    newEpt = Math.min(currentEpt , 10)
    return super.calcEpt(newEpt)
  }
}

class SpawnSite extends Site {
  constructor (id) {
    super(id)
    this.mem.type = STRUCTURE_SPAWN
  }
}

class ControllerSite extends Site {
  constructor (id) {
    super(id)
    this.mem.type = STRUCTURE_CONTROLLER

  }
}

class ContainerSite extends Site {
  constructor (id) {
    super(id)
    this.mem.type = STRUCTURE_CONTAINER

  }

  addCreep(creep) {
    super.addCreep(creep)
    this.mem.recalcEpt = true
  }
}

class ExtensionSite extends Site {
  constructor (id) {
    super(id)
    this.mem.type = STRUCTURE_EXTENSION

  }
}

class BuildSite extends Site {
  constructor (id) {
    super(id)
    this.mem.type = STRUCTURE_CONTAINER

  }

  addCreep(creep) {
    super.addCreep(creep)
    this.mem.recalcEpt = true
  }
}

class LogisticSite extends MetaSite {
  constructor (id) {
    super(id)
    this.mem.type = 'log'
  }

}

class ExtensionClusterSite extends MetaSite {
  constructor (id) {
    super(id)
    this.mem.type = 'ec'

  }
}

class BaseSite extends MetaSite {
  constructor (id) {
    super(id)
    if (!this.mem.pos) {
      this.mem.pos = serializePos(spawn.pos)
    }
    this.energyLevel = 0
    this.energyStage = 0 // [empty: 0, critical: 1, stable: 2, high: 3, full: 4]
    this.sites = []
    this.type = 'base'
    this.manifest = Memory.manifests[this.id] || {}
  }

  initialize (spawn) {
    super.initialize()

    this.mem.pos = serializePos(spawn.pos)
    // add building nodes in room
    let structs = spawn.room.find(FIND_MY_STRUCTURES)
    structs.forEach(s => { this.addSite(Sites.createSite(s.id, s.structureType)) })

    // add src nodes in room
    let sources = spawn.room.find(FIND_SOURCES)
    sources.forEach(s => { this.addSite(Sites.createSite(s.id, 'mine')) })

    Memory.manifests[this.id] = {
      //finance: {income: {}, cost: {}, total: {income: 0, cost: 0, balance: 0, reserved: 0}},
      spawn: [],
      //free: {creeps: []}
    }
    Memory.bases.push(this.id)
    return this
  }

  addSite (child) {
    child = Sites.getSite(child)
    if (!child.base) { child.base = this.id }
    super.addSite(child)
  }

  run () {
    Memory.workers = {}
    switch (this.stage) {
      default:
        console.log('Error: unhandled Base stage: ', this.mem.stage)
        break
      case undefined:
      case 0:
        this.mem.stage = 0

        /**
         * CREATE LOGISTIC NODE WHEN NEEDED
         */

        if (this.manifest.baseSrcEnergy && this.manifest.baseSrcEnergy > 350 && this.mem.children.container && this.mem.children.container.length === 2) {
          if (!this.mem.children.log) { this.mem.children.log = [] }
          if (!this.mem.children.log.length) { // and we have not initialized a storage node
            let servicedSrcs = getChildren(this.mem, [STRUCTURE_CONTAINER], (child) => child.subType === 'src', true)
            let i = 0
            while (Memory.nodes[`log-${i}`]) {
              i++
            }
            let newStorageNode = createStorageNode(`log-${i}`, servicedSrcs) // make the node
            this.mem.stage = 1
            addNodeToParent(newStorageNode, this.id) // add it to this base
            Sites.createSite(`log-${i}`, 'log', {serviced: servicedSrcs})
            //this.addSite(newStorageNode)
          }
        }
        /**
         * END CREATE LOGISTIC NODE WHEN NEEDED
         */
        break
      case 1: // has logistics node
        if (!this.mem.children.maint.length) {
          this.addSite(Sites.createSite('maint-0', 'maint'))
        }
        this.mem.stage = 2
        break
      case 2:
        break
      case 3:
        break
    }

    this.manifest.roomEnergyFrac = Game.rooms[this.id].energyAvailable / Game.rooms[this.id].energyCapacityAvailable
    //this.runChildren()

    if (this.manifest.totalEpt === undefined || this.mem.recalcEpt) {
      const prevEpt = this.manifest.totalEpt
      this.manifest.totalEpt = 0
      let allChildren = getChildren(this, [], undefined, false, 1)
      allChildren.forEach(child => {
        if (child.totalEpt) {
          this.manifest.totalEpt = this.manifest.totalEpt + child.totalEpt
        }
      })
      console.log('recalced base node ept', this.id, prevEpt, '=>', this.manifest.totalEpt)

      delete this.mem.recalcEpt
    }
    this.manifest.baseSrcEnergy = 0
    if (this.mem.srcs) {
      Object.keys(this.mem.srcs).forEach(sId => {
        this.manifest.baseSrcEnergy = this.manifest.baseSrcEnergy + this.mem.srcs[sId]
      })
    }
  }
}

/**
 * Sites
 */

/**
 * CREEPS
 */

class Creeps {
  static cache = {}

  static clearCache () {this.cache = {}}
  static getCreep (creep) {
    if (typeof creep !== 'string' && creep instanceof CreepBase) {
      if (!this.cache[creep.id]) {
        this.cache[creep.id] = creep
      }
      return creep
    }
    let id = creep // because creep was actually an id
    if (this.cache[id]) { return this.cache[id] }
    const mem = Memory.creeps?.[id];
    if (!mem) {
      console.error(`Creep with id ${id} not found in memory.`);
      return null;
    }

    switch (mem.role) {
      case 'miner':
        creep = new CreepMiner(id)
        break;
      case 'supplier':
        creep = new CreepSupplier(id);
        break;
      case 'builder':
        creep = new CreepBuilder(id);
        break;
      case 'upgrader':
        creep = new CreepUpgrader(id);
        break;
    }
    if (!creep) {
      console.log(`wasnt able to get creep of type ${mem.role} in Sites.getSite`)
    }
    this.cache[id] = creep
    return creep;
  }
}

class CreepBase {
  constructor (id) {
    Memory.creeps[id] = Memory.creeps[id] || {
      role: null,
      siteId: null,
      site: null,
    };
    this.creep = Game.creeps[id]
    this.mem = Memory.creeps[id];
    this.site = Sites.getSite(this.siteId)
    this.role = this.mem.role
    this.id = id;
  }
  leaveSite () {
    if (this.site) { this.site.removeCreep(this) }
    delete this.mem.siteId
  }

}

class CreepMiner extends CreepBase {
  constructor (id) {
    super(id)
    this.mem.role = 'miner'
  }

}
class CreepSupplier extends CreepBase {
  constructor (id) {
    super(id)
    this.mem.role = 'supplier'
  }
}

class CreepBuilder extends CreepBase {
  constructor (id) {
    super(id)
    this.mem.role = 'builder'
  }
}
class CreepUpgrader extends CreepBase {
  constructor (id) {
    super(id)
    this.mem.role = 'upgrader'
  }
}


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

/**
 * CREEPS
 */

/**
 * HELPER FUNCS
 */
function clearCache () {
  Sites.clearCache()
  Creeps.clearCache()
}

function initMemory () {
  Memory.bases = []
  Memory.sites = {}
  Memory.manifests = {}
  Memory.workers = {}

  for (let name in Game.spawns) {
    let spawn = Game.spawns[name]
    if (!Memory.sites[spawn.room.name]) { // make new base
      Sites.createSite(spawn.room.name, 'base', spawn)
    }
  }
}

/**
 * HELPER FUNCS
 */
/**
 * MAIN LOOP
 */

module.exports.loop = function () {
  try {
    if (!Memory.sites) { initMemory() }

    //gatherGlobal()
    for (let baseIndex = 0; baseIndex < Memory.bases.length; baseIndex++) {
      let baseId = Memory.bases[baseIndex]
      let base = Sites.getSite(baseId)
      //let base = Memory.nodes[baseId]
      if (base) {
        base.run()
      } else {
        // dead base. destroy
      }
    }
    for (let name in Memory.creeps) {
      let creep = Game.creeps[name]
      //creep.runTask()
      if (creep) {
        runCreep(creep)
      } else {
        destroyCreep(name)
      }
    }
    clearCache()

    // Memory.manifest = manifest
  } catch (e) {
    console.log('Global Uncaught Error: ', e.stack)
  }
}

/**
 * MAIN LOOP
 */
