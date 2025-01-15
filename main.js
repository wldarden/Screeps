//const DONE = 999
const DONE = 'DONE'
//const IN_PROGRESS = 998
const IN_PROGRESS = 'IN_PROGRESS'
//const INVALID_ACTION = 997
const INVALID_ACTION = 'INVALID_ACTION'
//const IDLE = 996
const IDLE = 'IDLE'

class Log {
  static error (...msg) {
    console.log(`Error: ${msg.join(', ')}`)
  }

}
function serializePos (pos) {
  if (typeof pos === 'string') {
    return pos
  }
  const x = (pos.x < 10) ? '0' + pos.x : pos.x.toString()
  const y = (pos.y < 10) ? '0' + pos.y : pos.y.toString()
  return x + y + pos.roomName;
}

function deserializePos (pos) {
  if (typeof pos === 'string') {
    try {
      var x = parseInt(pos.slice(0, 2));
      var y = parseInt(pos.slice(2, 4));
      var room = pos.slice(4);
      return new RoomPosition(x, y, room);
    } catch (e) {
      Log.error('ERROR: deserializingPos: ', 'stringified pos:', JSON.stringify(pos), 'obj pos:', pos, e)
    }
  } else {
    Log.error('Tried to deseralize a non string: ', JSON.stringify(pos), pos)
    if (pos.x && pos.y && pos.roomName) {
      return new RoomPosition(pos.x, pos.y, pos.roomName)
    }
    return pos
  }
}

class Spawner {
  static getPartCost (parts) {
    let cost = 0
    parts.forEach(part => {
      //Log.error('getting part cost:', part, BODYPART_COST[part], cost)
      cost += BODYPART_COST[part]
    })
    return cost
  }

  static getUniqueName (role) {
    let i = 0
    while(Game.creeps[`${role}-${i}`]) {
      i++
    }
    return `${role}-${i}`
  }

  static buildRoleCreep (site, role, maxCost = 300) {
    let body = []
    let addOns = []
    let addOnCount = 0
    let baseCost = 0
    let addOnCost = 0
    switch (role) {
      case 'miner':
        if (site.type === 'src' && site.stage >= 3) {
          body = [WORK,CARRY,MOVE,CARRY,MOVE]
          addOns = [WORK]
          baseCost = 300
          addOnCost = 100
          addOnCount = Math.floor((maxCost - baseCost) / addOnCost)
        } else {
          body = [CARRY, WORK, MOVE, CARRY, MOVE]
          addOns = [CARRY, MOVE]
          baseCost = 300
          addOnCost = 100
          addOnCount = Math.floor((maxCost - baseCost) / addOnCost)
        }
        break
      case 'explorer':
        body = [TOUGH, TOUGH, TOUGH, MOVE, MOVE, MOVE]
        addOns = [MOVE, TOUGH]
        baseCost = 300
        addOnCost = 100
        addOnCount = Math.floor((maxCost - baseCost) / addOnCost)
        break
      case 'maint':
        body = [CARRY, WORK, MOVE]
        addOns = [CARRY, MOVE, WORK]
        baseCost = 200
        addOnCost = 200
        addOnCount = Math.floor((maxCost - baseCost) / addOnCost)
        break
      case 'supplier':
        body = [CARRY, CARRY, CARRY, MOVE, MOVE, MOVE]
        addOns = [CARRY, MOVE]
        baseCost = 300
        addOnCost = 100
        addOnCount = Math.floor((maxCost - baseCost) / addOnCost)
        break
      case 'builder':
        if (site.type === 'build' && Memory.sites[site.parent] && Memory.sites[site.parent].type === 'ec') {
          body = [WORK, WORK, CARRY, MOVE]
          addOns = [CARRY, MOVE]
          baseCost = 300
          addOnCost = 100
          addOnCount = Math.floor((maxCost - baseCost) / addOnCost)
        } else {
          body = [CARRY, MOVE, WORK, CARRY, MOVE]
          addOns = [WORK, CARRY]
          baseCost = 300
          addOnCost = 150
          addOnCount = Math.floor((maxCost - baseCost) / addOnCost)
        }

        break
      case 'upgrader':
        body = [CARRY, WORK, MOVE, CARRY, MOVE]
        addOns = [WORK, MOVE]
        baseCost = 300
        addOnCost = 150
        addOnCount = Math.floor((maxCost - baseCost) / addOnCost)
        break
      default:
        body = [CARRY, WORK, MOVE, CARRY, MOVE]
        addOns = [CARRY, MOVE]
        baseCost = 300
        addOnCost = 100
        addOnCount = Math.floor((maxCost - baseCost) / 100)
        break
    }
    if (maxCost > 300) {
      for (let i = 0; i < addOnCount; i++) {
        body = body.concat(addOns)
      }
    }
    const cost = baseCost + (addOnCount * addOnCost)
    return {body, cost}
  }

  static spawnForSrc (site, maxCost = 300) {
    let role = 'miner'
    //let body
    //let addOns
    //if (site.type === 'src' && site.stage >= 3) {
    //  body = [WORK,CARRY,MOVE,CARRY,MOVE]
    //  addOns = [WORK]
    //  baseCost = 300
    //  addOnCost = 100
    //  addOnCount = Math.floor((maxCost - baseCost) / addOnCost)
    //} else {
    //  body = [CARRY, WORK, MOVE, CARRY, MOVE]
    //  addOns = [CARRY, MOVE]
    //  baseCost = 300
    //  addOnCost = 100
    //  addOnCount = Math.floor((maxCost - baseCost) / addOnCost)
    //}
    let body = [CARRY, WORK, MOVE, CARRY, MOVE]
    let addOns = [CARRY, MOVE, WORK]
    let maxAddOns = -1
    switch (site.stage) {
      case 3:
        body = [WORK, CARRY, MOVE, CARRY, MOVE]
        addOns = [WORK]
        maxAddOns = 5
        //maxAddOns = Math.ceil(5 / Object.keys(site.slots).length) + 1
        break
      case 0:
      case 1:
      case 2:
      default:
        break
    }
    let baseCost = this.getPartCost(body)
    let addOnCost = this.getPartCost(addOns) || 0
    let count = 0
    //Log.error(baseCost < maxCost, addOns.length,'maxAddOns', maxAddOns, 'addOnCost', addOnCost, 'base', baseCost, 'count', Math.floor((maxCost - baseCost) / addOnCost))

    if (baseCost <= maxCost && addOns.length) {
      //addOnCost = this.getPartCost(addOns) || 0
      count = Math.floor((maxCost - baseCost) / addOnCost)
      count = maxAddOns === -1 ? count : Math.min(count, maxAddOns)
      for (let i = 0; i < count; i++) {
        body = addOns.concat(body)
      }
    }
    //Log.error('maxAddons', body)
    //return {
    //  name: getUniqueName(role),
    //  memory: {role: role, siteId: site.id},
    //  body: body,
    //  cost: baseCost + (addOnCost * count)
    //}
    //Log.error('final body: ', body, 'cost: ', baseCost + (addOnCost * count), 'role:', role, 'siteId', site.id, 'maxAddOns:', maxAddOns)
    return {
      id: site.id,
      name: this.getUniqueName(role),
      memory: {
        role: role,
        siteId: site.id
      },
      body: body,
      cost: baseCost + (addOnCost * count)
    }
  }

  static spawnForSite (id, maxCost = 300) {
    let site = Sites.getSite(id) // Memory.sites[id]
    let role
    switch (site.type) {
      case 'mine':
        role = 'miner'
        let res = this.spawnForSrc(site, maxCost)
        //log({spawnReq: res})
        return res
      case STRUCTURE_CONTAINER:
        role = 'supplier'
        break
      case 'nav':
        role = 'explorer'
        break
      case 'build':
        role = 'builder'
        break
      case 'log':
        role = 'supplier'
        break
      case STRUCTURE_CONTROLLER:
        role = 'upgrader'
        break
      case 'maint':
        role = 'maint'
        break
      case 'ec':
        role = 'supplier'
        break
    }
    if (site && role) {
      let bodyInfo = this.buildRoleCreep(site, role, maxCost)
      return {
        id: site.id,
        name: this.getUniqueName(role),
        memory: {
          role: role,
          siteId: site.id
        },
        body: bodyInfo.body,
        cost: bodyInfo.cost
      }
    } else {
      Log.error('Unhandled spawn for node: ', site.type, id, site.id, maxCost)
    }

  }

}


function getSlotsAround (pos) {
  try {
    let room
    let terrain
    try {
      room = Game.rooms[pos.roomName]
    } catch (e) {
      Log.error('getting room: ', pos.roomName, e.stack)
    }
    try {
      terrain = room.getTerrain()
    } catch (e) {
      Log.error('getting room terrain: ', pos.roomName, e.stack)
    }
    let res = []
    // let count = 0
    const minCheckX = pos.x === 0 ? 0 : -1
    const minCheckY = pos.y === 0 ? 0 : -1
    const maxCheckX = pos.x === 49 ? 0 : 1
    const maxCheckY = pos.y === 49 ? 0 : 1
    for (let x = minCheckX; x <= maxCheckX; x++) {
      for (let y = minCheckY; y <= maxCheckY; y++) {
        if (x !== 0 || y !== 0) {
          const checkX = x + pos.x
          const checkY = y + pos.y
          if (terrain.get(checkX, checkY) !== 1) {
            res.push(serializePos({x: checkX, y: checkY, roomName: pos.roomName}))
            // count++
          }
        }
      }
    }
    return res
    // return count
  } catch (e) {
    Log.error('getSlotsAround', JSON.stringify(pos), e.stack)
  }
}
/**
 * SITES
 */
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
  static getNewSiteName (type) {
    let i = 0
    while (Memory.nodes[`${type}-${i}`]) { i++ }
    return `${type}-${i}`
  }

  static getMidpoint (sites) {
    let x = 0
    let y = 0
    let count = 0
    let roomName
    sites.forEach(s => {
      s = this.getSite(s)
      let pos = s.pos
      x = x + pos.x
      y = y + pos.y
      count = count + 1
      roomName = roomName || pos.roomName
    })
    x = Math.round(x / count)
    y = Math.round(y / count)
    return new RoomPosition(x, y , roomName)
  }

  static findServicePos (srcs = [], dests = []) {
    let midDest = Sites.getMidpoint(dests)
    let midSrc = Sites.getMidpoint(srcs)
    let midPath = midDest.findPathTo(midSrc, {ignoreCreeps: true})
    let midPathPoint = midPath[2]
    return new RoomPosition(midPathPoint.x, midPathPoint.y, midDest.roomName)
  }
  static buildSite (parent, type, pos, nodeParams) {
    pos = serializePos(pos)
    const siteMem = {
      nodeParams: JSON.stringify(nodeParams),
      pos: pos,
      strType: type,
      //id: `${parent.id}-new-${type}`,
      //parentId: parent.id
    }
    const req = {siteMem: siteMem, id: `${parent.id}-new-${type}`, pId: parent.id, type: 'build'}
    parent.manifest.build.add(req)
  }
  static createSite (type, initParams, id, siteMem) {
    if (!id) { id = this.getNewSiteName(type) }
    let newSite
    switch (type) {
      case 'mine':
        newSite = new SiteMine(id, type).initialize(initParams)
        break
      case 'log':
        newSite = new SiteLogistic(id, type).initialize(initParams)
        break
      case 'base':
        newSite = new SiteBase(id, type).initialize(initParams)
        break
      case STRUCTURE_CONTROLLER:
        newSite = new SiteController(id, type).initialize(initParams)
        break
      case STRUCTURE_SPAWN:
        newSite = new SiteSpawn(id, type).initialize(initParams)
        break
      case 'build':
        newSite = new SiteBuild(id, type).initialize(initParams)
        break
      //case 'ec':
      //  //site = new Logistic(id);
      //  break;
      case STRUCTURE_CONTAINER:
        newSite = new SiteContainer(id).initialize(initParams);
        break;
      //case STRUCTURE_EXTENSION:
      //  //site = new Logistic(id);
      //  break;
      //case STRUCTURE_CONTAINER:
      //  //site = new Logistic(id);
      //  break;
      default:
        Log.error('unsupported site type: ', type)
        return null
    }
    newSite.mem = {...newSite.mem, ...siteMem}

    Memory.sites[newSite.id] = newSite.mem
    return newSite
  }
  static getSite (id) {
    if (!id) {
      Log.error('cant get null site')
      return
    }
    if (typeof id !== 'string' && id instanceof Site) {
      if (!this.cache[id.id]) {
        this.cache[id.id] = id
      }
      return id
    } // was already a site
    if (this.cache[id]) {
      return this.cache[id]
    }
    const mem = Memory.sites[id]
    if (!mem) {
      Log.error(`Node with id ${id} not found in memory.`);
      return null;
    }

    let site;
    switch (mem.type) {
      case 'mine':
        site = new SiteMine(id, mem.type)
        break;
      case 'log':
        site = new SiteLogistic(id, mem.type);
        break;
      case 'base':
        site = new SiteBase(id, mem.type);
        break;
      case STRUCTURE_CONTROLLER:
        site = new SiteController(id, mem.type)
        break
      case STRUCTURE_SPAWN:
        site = new SiteSpawn(id, mem.type)
        break
      case 'build':
        site = new SiteBuild(id, mem.type)
        break
      //case 'ec':
      //  //site = new Logistic(id);
      //  break;
      case STRUCTURE_CONTAINER:
        site = new SiteContainer(id);
        break;
      //case STRUCTURE_EXTENSION:
      //  //site = new Logistic(id);
      //  break;
      //case STRUCTURE_CONTAINER:
      //  //site = new Logistic(id);
      //  break;
    }
    if (!site) {
      Log.error(`wasnt able to get site of type ${mem.type} in Sites.getSite: ${id}`)
      return null
    }
    this.cache[id] = site
    return site;
  }

  static runSites (sites = []) {
    sites.forEach(site => {
      try {
        site = Sites.getSite(site)
        if (site) {
          site.run()
        } else {
          // dead base. destroy
        }
      } catch (e) {
        Log.error('Site Error.', e.stack)
      }
    })
  }
}

class SiteChildren {
  constructor(parentSite) {
    this.site = parentSite; // Reference to the parent site
    this.mem = this.site.mem.children || {}; // Child memory
  }

  get hasChildren () { return this.mem && Object.keys(this.mem).length }

  getTypes (types) {
    let res = []
    types.forEach(type => {
      res = res.concat(this.getType(type))
    })
    return res
  }
  getType (type) {
    if (!type) { return this.all }
    if (!this._typeChildren) {
      this._typeChildren = {}
    }
    if (!this._typeChildren[type]) {
      let typeChildrenIds = this.mem[type] || []
      this._typeChildren[type] = typeChildrenIds
        .map(childId => {
          return Sites.getSite(childId)
        })
        .filter(child => child !== null ? true : this.site.error('missing child'))
    }
    return this._typeChildren[type]
  }

  get all () {
    if (!this._children) {
      this._children = []
      if (this.mem) {
        Object.keys(this.mem).forEach(type => {
          this._children = this._children.concat(this.getType(type))
        })
      }
    }
    return this._children;
  }

  remove (child) {
    child = Sites.getSite(child)
    if (child && child.type) {
      if (this.mem[child.type] && this.mem[child.type].length <= 1) {
        delete this.mem[child.type]
      } else {
        this.mem[child.type] = this.mem[child.type].filter(cId => cId !== child.id)
      }
      if (this._typeChildren && this._typeChildren[child.type]) {
        if (this._typeChildren[child.type].length <= 1) {
          this._typeChildren[child.type] = []
        } else {
          this._typeChildren[child.type] = this._typeChildren[child.type].filter(ch => ch.id !== child.id)
        }
      }
      if (this._children) {
        this._children = this._children.filter(c => c.id !== child.id)
      }
    }
  }

  add (child) {
    if (!child) { return }

    child = Sites.getSite(child.id)
    if (!child.mem.base) {
      child.mem.base = this.site.base
    }
    if (child.mem.parent && child.mem.parent !== this.site.id) {
      child.removeParent()
    }
    // save children to memory
    if (!this.mem[child.type]) {
      this.mem[child.type] = [child.id]
    } else if (!this.mem[child.type].some(cId => cId === child.id)) {
      this.mem[child.type].push(child.id)
    }

    // update live caches if needed
    if (this._typeChildren && this._typeChildren[child.mem.type]) {
      this._typeChildren[child.mem.type].push(child) // add child to type children cache
      if (this._children) {
        this._children.push(child) // add child to all children cache
      }
    }

    // update child to have this parent
    child.mem.parent = this.site.id
  }
}

class SiteCreeps {
  constructor(parentSite) {
    this.parent = parentSite; // Reference to the parent site
    this.mem = this.parent.mem.creeps || {}; // Child memory
    //this.cache = {}; // Cached children by type
  }

  remove (creep) {
    creep = Creeps.getCreep(creep)
    if (this.mem[creep.role]) {
      if (this.mem[creep.role].length <= 1) {
        this.mem[creep.role] = undefined
      } else {
        this.mem[creep.role] = this.mem[creep.role].filter(cId => cId !== this.parent.id && !!Game.creeps[cId]) // remove creep from old node and this.role
      }
    }
    this.parent.mem.recalcEpt = true
  }
  add (creep) {
    if (typeof creep === 'string') {
      creep = Creeps.getCreep(creep)
    }
    if (creep && creep.mem) {
      if (creep.mem.siteId && creep.mem.role && creep.mem.siteId !== this.parent.id) {
        creep.leaveSite()
      }
      let role = creep.mem.role
      creep.mem.siteId = this.parent.id

      if (!this.mem[role]) { this.mem[role] = [] }
      if (!this.mem[role].includes(creep.id)) {
        this.mem[role].push(creep.id) // add creep to new node
      }
    }
  }
  get all () {
    if (!this._creeps) {
      this._creeps = []
      if (!this.mem) { return this._creeps }

      Object.keys(this.mem).forEach(type => {
        this._creeps = this._creeps.concat(this.getType(type))
      })
    }
    return this._creeps;
  }

  getType (type) {
    if (!type) { return this.creeps }
    if (!this._typeCreeps) { this._typeCreeps = {} }
    if (!this._typeCreeps[type]) {
      let typeCreepIds = this.mem[type] || []
      this._typeCreeps[type] = typeCreepIds
        .map(cId => Creeps.getCreep(cId))
        .filter(cId => cId !== null ? true : this.parent.error('missing child'))
    }
    return this._typeCreeps[type]
  }
}

class Site {
  constructor(id, type) {
    if (type === 'build') {
    }
    Memory.sites[id] = Memory.sites[id] || {
      type: type,

      base: null,
      parent: null,
      dist: null,

      children: {},
      creeps: {},

      srcs: [],
      dests: [],
      ept: 0,
      stage: 0,
      threat: 0,
      spawnReqCount: 0
    }
    this.mem = Memory.sites[id]
    //this.children = new Children(this.mem.children)
    this.children = new SiteChildren(this); // Attach a Children instance
    this.creeps = new SiteCreeps(this)

    //if (this.mem.parent) {
    //  this.parent = Sites.getSite(this.mem.parent)
    //
    //}
    //this.base = this.mem.base || this.parent.base
    this.type = this.mem.type

    //this.pos = this.mem.pos
    this.id = id;
  }
  get type () { return this.mem.type}
  set type (type) {
    this.mem.type = type
    return type
  }

  get energy () {
    if (!this._energy) {
      this._energy = this.gameSite.store.getUsedCapacity(RESOURCE_ENERGY)
    }
    return this._energy
  }

  get energyNeeded () {
    if (!this._energyNeeded) {
      this._energyNeeded = this.gameSite && this.gameSite.store && this.gameSite.store.getFreeCapacity(RESOURCE_ENERGY)
    }
    return this._energyNeeded
  }

  initialize () {
    return this
  }

  get manifest () { return Manifests.getManifest(this) }

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
    return this._base
  }
  set base (name) { this.mem.base = name }

  get gameSite () {
    if (!this._gameSite) {
      this._gameSite = Game.getObjectById(this.id)
      if (!this._gameSite) {
        Log.error(`couldnt get gameSite of ${this.type} ${this.id}`)
      }
    }
    return this._gameSite;
  }

  set pos (pos) { this.mem.pos = (typeof pos === 'string') ? pos : serializePos(pos) }
  get pos () {
    if (!this._pos) {
      if (this.gameSite) {
        this._pos =  this.gameSite.pos
      } else
        //  if (this.mem.pos && typeof this.mem.pos === 'string') {
        //  this._pos = deserializePos(this.mem.pos)
        //} else
      if (this.parent) {
        this.error('Used parents pos:')
        this.parent.error(`Parent pos: ${serializePos(this.parent.pos)}`)
        this._pos = this.parent.pos
      } else {
        Log.error(`Error: couldnt get pos of ${this.id}`)
      }
    }
    return this._pos
  }
  get parent() {
    if (this._parent && this._parent.id === this.mem.parent) {
      return this._parent
    } else if (!this._parent && this.mem.parent) {
      this._parent = Sites.getSite(this.mem.parent)
    }
    return this._parent;
  }

  getDest (creep) {
    if (this.energyNeeded && this.id !== creep.site.id) {
      return {trg: this.id, action: 'transfer'}
    } else if (this.parent) {
      return this.parent.getDest(creep)
    }
  }
  maintain (count, role, urgency) {
    let existing = this.creeps.getType(role).length
    if ((existing + this.manifest.spawn.myReqCount(this.id)) < count) {
      this.manifest.spawn.add(this.id, urgency)
    }
  }
  increaseThreat () {
    this.mem.threat = this.mem.threat + 1
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



  error (msg = '') {
    Log.error(`Error: ${this.type} ${this.id}: ${msg}`)
  }

  removeParent () {
    if (this.parent) {
      this.parent.children.remove(this)
    }
    this.clearCache('dist')
    delete this.mem.parent
    console.log('removing parent not fully instantiated...?')
  }

  get dist () {
    if (!this._dist) {
      if (this.mem.dist) {
        this._dist = this.mem.dist
      } else {
        if (this.parent) {

          this._dist = this.pos.findPathTo(this.parent.pos, {ignoreCreeps: true}).length
        } else {
          Log.error(`Error: no parent to get dist to for ${this.id}`)
        }
      }
    }
    if (this._dist) {
      this.mem.dist = this._dist
    }
    return this._dist
  }

  calcEpt (newEpt) {
    if (newEpt === undefined) {
      newEpt = 0
      this.children.all.forEach(child => { newEpt = newEpt + child.ept }) // TODO - write a different one that just gets the energy producing node types
    }
    const bubble = this.mem.parent && this.mem.ept !== newEpt
    this.mem.ept = newEpt
    delete this.mem.recalcEpt
    if (bubble && this.mem.parent) { this.parent.calcEpt() }
    return newEpt
  }
  get ept () { return (this.mem.ept === undefined || this.mem.recalcEpt) ? this.calcEpt() : this.mem.ept }

  addSite (child) {
    this.children.add(child)
  }
  removeSite (child) { this.children.remove(child) }
  addCreep (creep) {
    this.creeps.add(creep)
    this.calcEpt()
  }

  changeType(newType) {
    if (newType === this.type) { return }
    const oldType = this.type

    if (this.parent) { // Update parent's children array
      this.parent.removeSite(this);
      this.mem.type = newType
      this.type = newType
      this.parent.addSite(this);
    }
  }

  clearSpawnReqs () {
    this.manifest.spawn.clear(this.id)
    this.mem.spawnReqCount = 0
  }
  changeId(newId) {
    if (newId === this.id) { return }
    const oldId = this.id
    this.clearSpawnReqs()
    if (this.parent) { // Update parent's children array
      this.parent.removeSite(this);
      this.id = newId;
      Memory.sites[newId] = Memory.sites[oldId] // Update memory reference
      this.parent.addSite(this)
    } else {
      Memory.sites[newId] = Memory.sites[oldId] // Update memory reference
    }
    this.manifest.build.changeId(oldId, newId)

    delete Memory.sites[oldId]
    this.id = newId
    this.mem = Memory.sites[newId]
    this.children.all.forEach(child => this.children.add(child)) // update childrens parent
    this.creeps.all.forEach(c => this.addCreep(c.id)) // update childrens parent
  }
  removeCreep (creep) {
    this.creeps.remove(creep)
  }


  run (parent) {
    this.preRun()
    this.runChildren()
    this.postRun()
  }

  preRun () {

  }

  runChildren () {
    if (this.children.hasChildren) {
      this.children.all.forEach(child => {
        child.run()
      })
    }
  }

  postRun () {
    if (this.mem.recalcEpt) { this.calcEpt() }
  }


}

class MetaSite extends Site {

  constructor (id, type) {
    super(id, type)

  }

  getDest (creep) {
    if (this.parent) {
      return this.parent.getDest(creep)
    }
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

          this._pos = pos
        }
      }
    }
    if (!this.mem.pos && this._pos) {
      this.mem.pos = serializePos(this._pos)
    }
    return this._pos
  }
}
class SiteMine extends Site {
  constructor (id, type) {
    super(id, type)
    this.slots = this.mem.slots
  }
  get energyNeeded () {
    return 0
  }
  initialize () {
    let slots = getSlotsAround(this.pos)
    this.mem.slots = {}
    slots.forEach(pos => this.mem.slots[pos] = false)
    this.slots = this.mem.slots
    return this
  }

  getDest (creep) {
    if (this.parent) {
      return this.parent.getDest(creep)
    } else {
      super.getDest(creep)
    }
  }

  addCreep (creep) {
    super.addCreep(creep)
    this.calcEpt()
  }
  calcEpt () {
    let newEpt
    const workParts = 1 // ASSUMED 1 work part
    const load = 100 // ASSUMED 2 carry parts
    const travelTicks = (this.mem.stage < 3) ? (this.dist * 3) : 3 // ASSUMED speed of 1tps empty, 2 tps full miners : ASSUMED container is ~3 ticks away when dropping off in the container

    const workSpeed = workParts * 2 // energy mined per tick when harvesting
    const workTicks = load / workSpeed
    const loadTicks = travelTicks + workTicks
    const eptPerMiner =  load / loadTicks
    const creepsPerSlot = loadTicks / workTicks
    const maxCreeps = Object.keys(this.mem.slots).length * creepsPerSlot
    const currentEpt =  Math.min(this.creeps.getType('miner').length, maxCreeps) * eptPerMiner
    //const maxEpt = maxCreeps * eptPerMiner
    newEpt = Math.min(currentEpt , 10)
    return super.calcEpt(newEpt)
  }
  myContainerPos () {
    let stoPath = this.pos.findPathTo(this.parent.pos, {ignoreCreeps: true})
    if (stoPath.length) {
      let pos
      if (stoPath[0].dx !== 0) {
        pos = {x: stoPath[0].x + stoPath[0].dx, y: stoPath[0].y, roomName: this.gameSite.pos.roomName }
      } else {
        pos = {x: stoPath[0].x, y: stoPath[0].y + stoPath[0].dy, roomName: this.gameSite.pos.roomName }
      }
      return pos
    }
  }
  preRun () {
    try {
      if (this.mem.threat) {
        if (!this.mem.cleared) {
          this.manifest.spawn.clear(this.id)
          this.mem.cleared = true
        }
        return
      } // threat nodes are skipped
      const miners = this.creeps.getType('miner')
      const maxMiners = Object.keys(this.mem.slots).length
      const saturation = miners.length / maxMiners
      let mode = 'default'
      switch (this.mem.stage) {
        default:
        case 0:
          if (this.parent && this.parent.type === 'log') {
            //this.mem.stage = 1
          }
          if (saturation >= 1 && Object.keys(this.slots).length > 2) {
            //this.mem.stage = 1
          }
          break
        case 1: // Begin containerizing
          if (this.parent) {
            if (this.pos) {
              Sites.buildSite(this, STRUCTURE_CONTAINER, this.myContainerPos(), {subType: 'src'})
              this.mem.stage = 2
            }
          }
          break
        case 2:// Wait for containerization to complete
          if (this.mem.buildReqCount === 1 && this.manifest.build.active && this.manifest.build.active.pId === this.id) {
            mode = 'containerized'
            let containers = this.children.getType(STRUCTURE_CONTAINER)
            if (containers.length) { // we completed our container node. swap places and move to stage 3
              let cont = containers[0]
              cont.subType = 'src'
              const contId = cont.id
              this.mem.stage = 3
              //addNodeToParent(cont, node.parent) // move container to parent
              //node.containerId = contId
              //addNodeToParent(node, contId) // move this src to container
            }
          }

          //let containers = getChildren(node, [STRUCTURE_CONTAINER], undefined, false, 1)

          break
        case 3: // containerized src
          //if (node.containerId && node.parent !== node.containerId) {
          //  addNodeToParent(node, node.containerId) // move this src to container
          //}
          //delete node.dests[node.containerId]
          mode = 'containerized'
          break
      }
      this.maintain(maxMiners, 'miner', URGENCY.HIGH)
    } catch(e) {
      Log.error('failed to preRun Mine Site', e.stack, this.id)
    }
  }
}

class SiteSpawn extends Site {
  constructor (id, type) {
    super(id, type)
    this.mem.type = STRUCTURE_SPAWN
    this.room = this.gameSite.room
    this.minSpawnEnergy = 300
  }
  doSpawn () {
    let res = this.gameSite.spawnCreep(this.req.obj.body, this.req.obj.name, {memory: this.req.obj.memory})

    switch (res) {
      case OK:
        let creepParentId = this.req.obj.memory.siteId
        let creepParentSite = Sites.getSite(creepParentId)
        creepParentSite.addCreep(this.req.obj.name)
        this.req.complete()
        //addCreepToNode(spawnReq.memory.nodeId, spawnReq.memory.role, spawnReq.name)
        return true
      //case ERR_NAME_EXISTS: // -3 - serializedReq has name that already exists. we should redo the req:
      //  if (spawnReq) {
      //    const maxEnergy = node.waited ? gameNode.room.energyAvailable : baseManifest.spawnCapacity
      //    const newReq = spawnForNode(spawnReq.memory.nodeId, maxEnergy)
      //    return doSpawn(node, gameNode, newReq, baseManifest)
      //  } else {
      //    //deleteSpawnReq(baseManifest, node, spawnReq.memory.nodeId) // i dont think this is necessary...
      //    return false
      //  }
      //case ERR_BUSY:
      //  node.waitUntilTime = Game.time + gameNode.spawning.remainingTime
      //  delete node.waitUntilCost
      //  node.serializedReq = JSON.stringify(spawnReq)
      //  break
      //case ERR_INVALID_ARGS:
      //  log({spawnReq})
      //  Log.error('invalid spawn req', spawnReq.name)
      //  deleteSpawnReq(baseManifest, node, spawnReq.memory.nodeId)
      //  if (baseManifest.spawn.length) {
      //    const maxEnergy = node.waited ? gameNode.room.energyAvailable : baseManifest.spawnCapacity
      //    const newReq = spawnForNode(baseManifest.spawn[0], maxEnergy)
      //    return doSpawn(node, gameNode, newReq, baseManifest)
      //  }
      //  break
      //case ERR_NOT_ENOUGH_RESOURCES:
      //  if (node.waited && gameNode.room.energyAvailable >= 300) {
      //    const maxEnergy = gameNode.room.energyAvailable
      //    const newReq = spawnForNode(spawnReq.memory.nodeId, maxEnergy)
      //    return doSpawn(node, gameNode, newReq, baseManifest)
      //  } else {
      //    node.serializedReq = JSON.stringify(spawnReq)
      //    node.waitUntilCost = spawnReq.cost
      //    if (!node.lastTry) {
      //      node.lastTry = Game.time
      //    }
      //  }
      //
      //  break
      default:
        Log.error('unhandled spawn res:', res)
        break
    }
    //node.waited = true
    return false
  }
  deleteSpawnReq (baseManifest, node, id) {
    //completeSpawnReq(baseManifest, id)
    //delete node.waitUntilCost
    //delete node.waitUntilTime
    //delete node.serializedReq
    //delete node.waited
    //delete node.lastTry
    //delete node.currReqId
  }
  preRun () {
    if (this.room.energyAvailable >= this.minSpawnEnergy) {
      if (!this.req) {
        this.req = this.manifest.spawn.nextReq()
      }
      if (this.req) {
        if (this.doSpawn()) {
          // spawned!
        }
      }
    }

  }
}

class SiteController extends Site {
  constructor (id, type) {
    super(id, type)
  }
}

class SiteContainer extends Site {
  constructor (id, type) {
    super(id, type)
    this.mem.type = STRUCTURE_CONTAINER
    this.mem.servSrcs = this.mem.servSrcs || []
    this.mem.servDests = this.mem.servDests || []
  }

  addCreep(creep) {
    super.addCreep(creep)
    this.mem.recalcEpt = true
  }

  //constructor (id, type) {
  //  super(id, type)
  //  this.mem.type = 'log'
  //  this.servDests
  //}

  get servicedDests () {return this.mem.servDests}
  get servicedSrcs () {return this.mem.servSrcs}

  srcContainerPos (src) {
    let stoPath = src.pos.findPathTo(this.pos, {ignoreCreeps: true})
    if (stoPath.length) {
      let pos
      if (stoPath[0].dx !== 0) {
        pos = {x: stoPath[0].x + stoPath[0].dx, y: stoPath[0].y, roomName: this.gameSite.pos.roomName }
      } else {
        pos = {x: stoPath[0].x, y: stoPath[0].y + stoPath[0].dy, roomName: this.gameSite.pos.roomName }
      }
      return pos
    }
  }
  preRun () {
    switch (this.mem.stage) {
      default:
      case 0:
        //this.servicedSrcs.forEach(src => {
        //  src = Sites.getSite(src)
        //  this.children.add(src)
        //})
        this.mem.servSrcs = this.mem.servSrcs.filter((src) => !Sites.getSite(src).threat)
        break
      case 1:

        if (this.servicedSrcs.length) {
          let best
          let bestIndex
          this.servicedSrcs.forEach((src, ind) => {
            let newSrc = Sites.getSite(src)
            if (!newSrc.threat && (!best || best.dist < newSrc.dist)) {
              best = newSrc
              bestIndex = ind
            }
          })
          Sites.buildSite(this, STRUCTURE_CONTAINER, this.srcContainerPos(best), {subType: 'src', takeChild: [best.mem.id]})
          this.mem.servSrcs.splice(bestIndex, 1)
        }
        // req energy

        break
      case 2: // Sto node complete. get children to begin servicing
        if (this.mem.buildReqCount >= 0) {

        }
        this.mem.stage = 1
        // when complete, go to stage 2
        break
      case 3:
        break
      case 4:
        break
    }
    if (this.mem.subType === 'log' && this.energy) {
      this.maintain(1, 'supplier', URGENCY.MEDIUM)
    }
  }
}

const EXAMPLE_LOOK_RES = {
  "room":{
    "name":"sim",
    "energyAvailable":222,
    "energyCapacityAvailable":300,
    "survivalInfo":{
      "mode":"survival",
      "status":"active",
      "user":"5a36af6766a5f468481beb41",
      "score":0,
      "timeToWave":200,
      "wave":1,
      "survivalEnabled":true,
      "invaders":{"bodies":[]}
    },
    "visual":{"roomName":"sim"}
  },
  "pos":{"x":32, "y":30, "roomName":"sim"},
  "id":"e8cf2aa7a6acf120cfafae8b",
  "progress":0,
  "progressTotal":5000,
  "structureType":"container",
  "owner":{"username":"clearc2"},
  "my":true
}
class SiteExtension extends Site {
  constructor (id, type) {
    super(id, type)
    this.mem.type = STRUCTURE_EXTENSION

  }
}

class SiteBuild extends MetaSite {
  constructor (id, type) {
    super(id, type)
    this.mem.type = 'build'
    this.strType = this.mem.strType
  }

  get energy () {
    if (!this._energy) {
      this._energy = 0
    }
    return this._energy
  }
  get energyNeeded () {
    if (!this._energyNeeded) {
      this._energyNeeded = this.gameSite && this.gameSite.progressTotal > this.gameSite.progress
    }
    return this._energyNeeded
  }

  getDest (creep) {
    let res
    if (this.parent) {
      res = this.parent.getDest(creep)
    }
    if (!res && this.energyNeeded && creep.creep.getActiveBodyparts(WORK)) {
      res = {trg: this.id, action: 'transfer'}
    }
    return res
  }

  findSiteAtPos () {
    const lookRes = this.pos.lookFor(LOOK_CONSTRUCTION_SITES)
    if (lookRes.length) {
      return lookRes.find(item => item.structureType === this.strType).id
    }
  }
  findStrAtPos () {
    const lookRes = this.pos.lookFor(LOOK_STRUCTURES)
    if (lookRes.length) {
      return lookRes.find(item => {
        return item.structureType === this.strType
      }).id
    }
  }
  preRun () {
    try {
      switch (this.mem.stage) {
        default:
        case 0: // Create construction site:
          if (this.pos) {
            //let pos = deserializePos(this.pos)

            const res = Game.rooms[this.pos.roomName].createConstructionSite(this.pos.x, this.pos.y, this.strType)
            switch (res) {
              case ERR_INVALID_TARGET: // -7 might already have built the thing.
                let siteId = this.findSiteAtPos()
                if (siteId) { // change self id to siteId, upgrade stage
                  //addNodeToParent(node, node.parent, siteId)
                  this.mem.stage = 2
                } else {
                  siteId = this.findStrAtPos()
                  if (siteId) {
                    this.changeId(siteId)
                    //this.parent.addSite(this)
                    //addNodeToParent(node, node.parent, siteId)
                    this.mem.stage = 2
                  }
                }
                break
              case ERR_RCL_NOT_ENOUGH: // -14
                Log.error('Tried to build ', this.strType, ' but RCL not high enough. parent: ', this.parent.id)
                //deleteNode(node, baseManifest)
                this.removeSite(this)
              case OK:
                this.mem.stage = 1
                break
              default:
                Log.error('Unhandled createConstructionSite error res: ', res, this.id, this.pos.x, this.pos.y, this.strType, this.pos.roomName)
            }
          }
          break
        case 1: // Register siteId with parent

          let siteId = this.findSiteAtPos()
          if (siteId) { // change self id to siteId, upgrade stage
            this.changeId(siteId)

            let newSite = Sites.getSite(siteId)
            if (this.mem.nodeParams) { // add the extra params that were created when build requested
              let obj = JSON.parse(this.mem.nodeParams)
              delete this.mem.nodeParams
              Memory.sites[this.id] = {...this.mem, ...obj}
              this.mem = Memory.sites[this.id]
            }

            if (this.mem.takeChild) {
              this.mem.takeChild.forEach(id => {
                let child = Sites.getSite(id)
                if (child) {
                  newSite.children.add(child)
                } else {
                  Log.error('Wasnt able to get child in takeChild', id)
                }
              })
              delete this.mem.takeChild
            }
            newSite.mem.stage = newSite.mem.stage + 1
            //this.mem.stage = this.mem.stage + 1
          }


          break
        case 2: // Request energy until built. Then register strId with parent and convert to final node type
          //let site = Game.getObjectById(node.id)
          //registerDestToParent(node, baseManifest) // requests energy as site, and deletes req as str
          if (!this.gameSite || !this.gameSite.progress) { // no site found, maybe the str has been built:
            let strId = this.findStrAtPos()
            if (strId) {
              this.mem.stage = 0 // set new structure's stage to 1
              const newType = this.strType
              delete this.strType
              delete this.mem.pos
              this.changeId(strId)
              let newSite = Sites.getSite(strId)
              newSite.changeType(newType)
            }
          }
          break
        case 3:
          Log.error('Error: build node reached stage 3 and is still a build node: ', this.id, this.type, this.strType, this.mem.stage, this.parent.id)
          this.mem.stage = 2
          break
      }

      //this.maintain(1, 'builder', URGENCY.LOW)
      if (this.mem.stage >= 2 && Game.time % 10 === 0 && !this.mem.spawnReqCount) {
        //this.maintain(1, 'builder', URGENCY.LOW)
      }
      //if (!node.spawnReqCount) {
      //  let globalBuilders = Object.keys(Memory.creeps).filter(cId => cId.includes('builder')).length
      //  const siteBuildersWanted = (Math.round((baseManifest.totalEpt || 0) / 4) - globalBuilders) + Math.round((baseManifest.baseSrcEnergy || 0) / 2000)
      //  maintainRoleCreepsForNode(baseManifest, node, 'builder', siteBuildersWanted)
      //}
      //}
    } catch (e) {
      Log.error('BuildSite Error', e.stack)
    }
  }
}

class SiteLogistic extends MetaSite {
  constructor (id, type) {
    super(id, type)
    this.mem.type = 'log'
    this.servDests
  }

  get servicedDests () {return this.mem.servDests}
  get servicedSrcs () {return this.mem.servSrcs}

  reposition () {
    let midDest = Sites.getMidpoint(this.servicedDests)
    let midSrc = Sites.getMidpoint(this.servicedSrcs)
    let midPath = midDest.findPathTo(midSrc, {ignoreCreeps: true})
    let midPathPoint = midPath[3]
    let pos = new RoomPosition(midPathPoint.x, midPathPoint.y, midPathPoint.roomName)
    this.mem.pos = serializePos(pos)
    this.mem.positioned = true
    return pos
  }
  preRun () {
    switch (this.mem.stage) {
      default:
      case 0: // INIT: 1. POSITION SELF BASED ON PARENT NEEDS; 2. BUILD FIRST CONTAINER
        let pos = this.mem.positioned ? this.pos : this.reposition()
        if (!this.mem.buildReqCount) {
          Sites.buildSite(this, STRUCTURE_CONTAINER, newPos, {subType: 'src'})
        } else { // wait until our build is the active one:
          if (this.manifest.build.active.pId === this.id) {
            this.mem.stage = 1

          }
        }
        break
      case 1: // Sto node complete. get children to begin servicing
              // req energy
        if (this.mem.buildReqCount >= 0) {

        }
        // when complete, go to stage 2
        break
      case 2:
        break
      case 3:
        break
      case 4:
        break
    }
  }
}

class SiteExtensionCluster extends MetaSite {
  constructor (id, type) {
    super(id, type)
    this.mem.type = 'ec'

  }
}

/**
 * MANIFESTS
 */
const DefaultManifest = {
  spawn: [],
  energy: { energy: 0, stage: 0 },
  build: []
}
class Manifests {

  static cache = {}

  static clearCache () {this.cache = {}}
  static getManifest (site) {
    let manifestId = site.type === 'base' ? site.id : site.base

    if (!manifestId) {
      Log.error('tried to get a manifest without any id: ', site, site.type, site.id, site.base)
    }

    if (this.cache[manifestId]) {
      return this.cache[manifestId]
    }

    let manifest = new BaseManifest(site)

    if (!manifest) {
      Log.error(`Wasnt able to get manifest in Manifests.getManifest`)
      return
    }

    this.cache[manifestId] = manifest

    return manifest
  }
}

class Queue {
  constructor (manifest, urgency) {
    this.manifest = manifest; // Reference to the parent site
    manifest.mem.spawn[urgency] = manifest.mem.spawn[urgency] || []
    this.mem = manifest.mem.spawn[urgency]
  }
}

class BaseBuildQueue {
  constructor (manifest) {
    this.manifest = manifest; // Reference to the parent manifest
    this.mem = manifest.mem.build || {active: null}
  }

  get active () {
    if (!this._active) {
      this._active = this.mem.active ? JSON.parse(this.mem.active) : undefined
    }
    return this._active
  }
  clear (id) {
    Object.keys(this.mem).forEach(urgency => {
      if (this.mem[urgency]) {
        this.mem[urgency] = this.mem[urgency].filter(qReq => !qReq.includes(id))
      }
    })
    let site = Sites.getSite(id)
    site.mem.buildReqCount = 0
  }


  getType (type) {
    if (!type) { return this.all }
    if (!this._urgencyBuilds) {
      this._urgencyBuilds = {}
    }
    if (!this._urgencyBuilds[type]) {
      let typeBuildStrings = this.mem[type] || []
      this._urgencyBuilds[type] = typeBuildStrings
        .map(qReq => { return JSON.parse(qReq) })
        .filter(qReq => qReq !== null)
    }
    return this._urgencyBuilds[type]
  }

  get all () {
    if (!this._buildReqs) {
      this._buildReqs = []
      if (this.mem) {
        Object.keys(this.mem).forEach(type => {
          this._buildReqs = this._buildReqs.concat(this.getType(type))
        })
      }
    }
    return this._buildReqs;
  }

  hasRequestedBuild () {

  }

  changeId (oldId, newId) {
    //delete this._active
    if (this.mem.active) {
      this.mem.active = this.mem.active.replaceAll(oldId, newId)
    }

    for (let key in URGENCY) {
      let lvl = URGENCY[key]
      if (this.mem[lvl] && this.mem[lvl].length) {
        this.mem[lvl] = this.mem[lvl].map(req => {

          req = req.replaceAll(oldId, newId)
          return req
        })
      }
    }
  }
  myReqCount (id) {
    return this.all.filter(req => req.id === id).length
  }
  get hasBuildReqs () {
    return this.all.length
  }

  add (req, urgency = URGENCY.MEDIUM) {
    if (!this.mem[urgency]) {
      this.mem[urgency] = []
    }
    if (!this.mem[urgency].some(qReq => qReq.id === req.id)) {
      req.urgency = urgency
      this.mem[urgency].push(JSON.stringify(req))
      let site = Sites.getSite(req.pId)
      site.mem.buildReqCount = site.mem.buildReqCount ? site.mem.buildReqCount + 1 : 1
      if (!this.active) {
        this.start(req)
      }
    }
  }

  getPriorityBuild (queue) {
    if (queue.length) {
      return queue[0]
    }
  }
  nextReq () {
    if (this._lastReq) {
      return this._lastReq
    }
    for (let key in URGENCY) {
      let lvl = URGENCY[key]
      if (this.mem[lvl] && this.mem[lvl].length) {
        let req = this.getPriorityBuild(this.getType(lvl))
        if (req) {
          req.urgency = key
          this._lastReq = req
          return this._lastReq
        }
      }
    }
  }

  start (req) {
    if (this.active) {
      Log.error('Already had an active build, but now a new build req is starting. not good. old:', this.active.id, 'new:', req.id)
    }
    delete this._active
    this.mem.active = JSON.stringify(req)
    req.siteMem.type = 'build'
    let site = Sites.createSite('build', {}, req.id, req.siteMem)
    site.mem.type = 'build'
    let parent = Sites.getSite(req.pId)
    parent.addSite(site)
  }

  finish (req) {
    if (this.active) {
      if (this.active.urgency) {
        let parent = Sites.getSite(this.active.pId)
        parent.mem.buildReqCount = parent.mem.buildReqCount - 1
        this.mem[this.active.urgency] = this.mem[this.active.urgency].filter(qReq => !qReq.includes(this.active.id) || JSON.parse(qReq).id !== this.active.id)
        delete this._urgencyBuilds[this.active.urgency]
        delete this._buildReqs
        delete this.mem.active
        delete this._lastReq
        let newReq = this.nextReq()
        if (newReq) {
          this.start(newReq)
        }
      } else {
        Log.error('build req didnt have an urgency', this.active)
      }
    } else {
      Log.error('Tried to finish build but there was no active build')
    }
  }

}
const URGENCY = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
  NONE: 0,
  MINE: 4
}
class BaseSpawnQueue {
  constructor (manifest) {
    this.manifest = manifest; // Reference to the parent site
    this.mem = manifest.mem.spawn || {}
    //this.queues = Object.keys(manifest.mem.spawn)
  }

  clear (id) {
    Object.keys(this.mem).forEach(urgency => {
      if (this.mem[urgency]) {
        this.mem[urgency] = this.mem[urgency].filter(qId => qId !== id)
      }
    })
    let site = Sites.getSite(id)
    site.mem.spawnReqCount = 0
  }
  get all () {
    let reqs = []
    Object.keys(this.mem).forEach(urgency => {
      if (this.mem[urgency]) {
        reqs = reqs.concat(this.mem[urgency])
      }
    })
    return reqs
  }
  get hasReqs () {
    return this.all.length
  }

  //complete (req = this._lastReq) {
  //  if (req) {
  //    let lvl = URGENCY[req.urgency]
  //    this.mem[lvl].shift() // this doesnt absolutely guarantee that the req being removed
  //    let completedIndex = this.mem[lvl].findIndex(id => req.id === id)
  //    if (completedIndex !== -1) {
  //      this.mem[lvl] = this.mem[lvl].splice(completedIndex, 1)
  //    } else {
  //      Log.error('Completing spawn req but couldnt find req in queue: ', req.id, req.urgency, this.mem[lvl])
  //    }
  //  } else {
  //    Log.error('Completing but no req given', req, this._lastReq)
  //  }
  //}

  myReqCount (id) {
    return this.all.filter(qId => qId === id).length
  }

  add (id, urgency) {
    if (!this.mem[urgency]) {
      this.mem[urgency] = []
    }
    if (!this.mem[urgency].some(reqId => reqId === id)) {
      this.mem[urgency].push(id)
      let site = Sites.getSite(id)
      site.mem.spawnReqCount = site.mem.spawnReqCount ? site.mem.spawnReqCount + 1 : 1
    }
  }

  getPrioritySpawn (queue) {
    if (queue.length === 1) {
      return queue[0]
    }
    let best
    queue.forEach(id => {
      if (best) {
        let site = Sites.getSite(id)
        if (best.dist > site.dist) {
          best = site
        }
      } else {
        best = Sites.getSite(id)
      }
    })
    return best.id
  }
  nextReq () {
    if (this._lastReq) {
      return this._lastReq
    }
    for (let key in URGENCY) {
      let lvl = URGENCY[key]
      if (this.mem[lvl] && this.mem[lvl].length) {
        let reqId = this.getPrioritySpawn(this.mem[lvl])
        let req = Spawner.spawnForSite(reqId, 300)
        req.urgency = key
        this._lastReq = new SpawnRequest(req, this)
        return this._lastReq
      }
    }
  }

}

class SpawnRequest {
  constructor (req, spawnQueue) {
    this.queue = spawnQueue
    this.id = req.id
    this.urgency = req.urgency
    this.obj = req
  }

  complete () {
    let lvl = URGENCY[this.urgency]
    let completedIndex = this.queue.mem[lvl].findIndex(id => this.id === id)
    if (completedIndex !== -1) {
      this.queue.mem[lvl].splice(completedIndex, 1)
      let site = Sites.getSite(this.id)
      site.mem.spawnReqCount = site.mem.spawnReqCount - 1
    } else {
      Log.error('Completing spawn req but couldnt find req in queue: ', this.id, this.urgency, this.queue.mem[lvl])
    }

  }
}

class BaseEnergy {
  constructor (manifest) {
    this.manifest = manifest; // Reference to the parent site
    this.mem = manifest.mem.energy || {}
    this.amount = this.mem.energy.amount
    this.status = 0 // [empty: 0, critical: 1, stable: 2, high: 3, full: 4]
  }

}

class BaseManifest {
  constructor (parentSite) {
    try {
      if (!parentSite) {
        Log.error('tried to construct a manifest without id: ', parentSite)
        return
      }
      this.parent = parentSite // Reference to the parent site
      this.id = this.parent.type === 'base' ? this.parent.id : this.parent.base

      Memory.manifests[this.id] = Memory.manifests[this.id] || DefaultManifest
      this.mem = Memory.manifests[this.id]

    } catch (e) {
      Log.error('Could not construct Manifest', e.stack)
    }


    //this.energy = new BaseEnergy(this)
    //this.spawn = new BaseSpawnQueue(this)
  }

  get energy () {
    if (!this._energy) {
      this._energy = new BaseEnergy(this)
    }
    return this._energy
  }

  get spawn () {
    if (!this._spawn) {
      this._spawn = new BaseSpawnQueue(this)
    }
    return this._spawn
  }

  get build () {
    if (!this._build) {
      this._build = new BaseBuildQueue(this)
    }
    return this._build
  }

}

/**
 * MANIFESTS
 */
function DEST_TYPE_ACTION (type) {
  switch (type) {
    case 'build':
      return 'build'
    default:
      return 'transfer'
  }
}
class SiteBase extends MetaSite {
  constructor (id, type) {
    super(id, type)
    this.mem.type = 'base'
    this.type = 'base'
    this.base = this.id
    this.sites = []
    //this.spawnQueue = new BaseSpawnQueue(this)
    //this.manifest = new BaseManifest(this) //Memory.manifests[this.id] || {}
  }

  getPriorityDest (type, action = 'transfer', pos, forbiddenId) {
    let dests = this.children.getType(type)
    if (dests.length ) {
      if (!this._destsNeedingEnergy) {
        this._destsNeedingEnergy = {}
      }
      if (!this._destsNeedingEnergy[type]) {
        this._destsNeedingEnergy[type] = dests.filter(s => {
          return s.energyNeeded > 0 && s.id !== forbiddenId
        })
      }
      if (this._destsNeedingEnergy[type].length) { // todo - add position consideration here
        let low = this._destsNeedingEnergy[type][0]
        return {trg: low.id, action: action}
      }

    }
  }


  getDest (creep) {
    let pos = creep.pos
    let forbiddenId = creep.site.id
    let orderedDests
    if (creep.creep.getActiveBodyparts(WORK)) {
      orderedDests = [STRUCTURE_SPAWN, STRUCTURE_CONTAINER, 'build', STRUCTURE_CONTROLLER]
    } else {
      orderedDests = [STRUCTURE_SPAWN, STRUCTURE_CONTAINER]
    }
    for (let i = 0; i < orderedDests.length; i++) {
      let destType = orderedDests[i]
      let low = this.getPriorityDest(destType, DEST_TYPE_ACTION(destType), pos, forbiddenId)
      if (low) {
        return low
      }
    }
  }
  initialize (spawn) {
    //super.initialize()
    this.mem.pos = serializePos(spawn.pos)

    // add building nodes in room
    let structs = spawn.room.find(FIND_MY_STRUCTURES)
    structs.forEach(s => {
      const newSite = Sites.createSite(s.structureType, {}, s.id)
      if (newSite) {
        this.addSite(newSite)
      }

    })

    // add src nodes in room
    let sources = spawn.room.find(FIND_SOURCES)
    sources.forEach(s => { this.addSite(Sites.createSite('mine', {}, s.id)) })

    Memory.manifests[this.id] = DefaultManifest
    Memory.bases.push(this.id)

    return this
  }

  addSite (child) {
    child = Sites.getSite(child.id)
    if (!child.base) { child.base = this.id }
    super.addSite(child)
  }

  preRun () {
    switch (this.mem.stage) {
      default:
        Log.error('Unhandled Base stage: ', this.mem.stage)
        break
      case undefined:
      case 0:
        this.mem.stage = 0
        /**
         * CREATE LOGISTIC NODE WHEN NEEDED
         */
        if (!this.mem.buildReqCount) {
          if (!this.children.getType(STRUCTURE_CONTAINER).length) { // and we have not initialized a storage node
            let servDests  = this.children.getTypes([STRUCTURE_SPAWN, STRUCTURE_CONTROLLER])
            let servSrcs = this.children.getType('mine').filter(child => !child.threat && Object.keys(child.slots).length > 2)
            let srcIds = servSrcs.map(s => s.id)
            const siteMem = {
              servSrcs: srcIds,
              servDests: servDests.map(s => s.id),
              takeChild: srcIds,
              subType: 'log'
            }
            let pos = Sites.findServicePos(servSrcs, servDests)
            Sites.buildSite(this, STRUCTURE_CONTAINER, pos, siteMem)
            //this.addSite(newStorageNode)
            this.mem.stage = 1
          }
        }

        //if (this.manifest.energy.amount && this.manifest.energy.amount > 350 && this.children.getType(STRUCTURE_CONTAINER).length === 2) {
        //  if (!this.children.getType(STRUCTURE_CONTAINER).length) { // and we have not initialized a storage node
        //    let servDests  = this.children.getTypes([STRUCTURE_SPAWN, STRUCTURE_CONTROLLER])
        //    let servSrcs = this.children.getType('mine').filter(child => !child.threat && Object.keys(child.slots).length > 2)
        //    let newLogSite = Sites.createSite('log', undefined, undefined,{servDests, servSrcs})
        //    this.children.add(newLogSite)
        //    //this.addSite(newStorageNode)
        //  }
        //}
        /**
         * END CREATE LOGISTIC NODE WHEN NEEDED
         */
        break
      case 1: // has logistics node
              //if (!this.mem.children.maint.length) {
              //  this.addSite(Sites.createSite('maint'))
              //}
              //this.mem.stage = 2
        break
      case 2:
        break
      case 3:
        break
    }

    //this.manifest.roomEnergyFrac = Game.rooms[this.id].energyAvailable / Game.rooms[this.id].energyCapacityAvailable
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
    const mem = Memory.creeps?.[id]
    if (!mem) {
      Log.error(`Creep with id ${id} not found in memory.`);
      return null
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
      Log.error(`wasnt able to get creep of type ${mem.role} in Sites.getSite`)
    }
    this.cache[id] = creep
    return creep;
  }

  static destroy (creep) {
    creep = this.getCreep(creep)
    if (creep.site) {
      creep.site.removeCreep(creep)
    }
    delete Memory.creeps[creep.id]
  }

  static runCreeps (creeps) {
    Object.keys(creeps).forEach(name => {
      let creep = Creeps.getCreep(name)
      if (creep.isAlive) {
        creep.run()
      } else {
        Creeps.destroy(creep)
      }
    })
  }
}

/**
 * CREEPS ^ Static | Classes v
 */

class CreepBase {
  constructor (id) {
    Memory.creeps[id] = Memory.creeps[id] || {
      role: null,
      siteId: null,
      site: null,
    }
    this.mem = Memory.creeps[id]
    this.role = this.mem.role
    this.id = id
    this.creep = Game.creeps[id]
    this.isAlive = !!this.creep
    this.action = Actions.getAction(this)
  }

  get energy () { return this.creep.store.getUsedCapacity(RESOURCE_ENERGY) }
  get energyNeeded () { return this.creep.store.getFreeCapacity(RESOURCE_ENERGY)}

  get site () {
    if (!this._site) {
      this._site = Sites.getSite(this.mem.siteId)
    }
    return this._site
  }

  leaveSite () {
    if (this.site) { this.site.creeps.remove(this) }
    delete this.mem.siteId
  }

  getNewAction () {

  }

  findDest (noWork = false) {
    try {
      let trgInfo = this.site.getDest(this)
      if (trgInfo) {
        return trgInfo
      }
      Log.error('Creep failed to get site source from lineage. finding sites directly', this.id, serializePos(this.creep.pos))
      let dest = this.creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {maxOps: 500, filter: (str) => {
          return str.store && str.store.getFreeCapacity(RESOURCE_ENERGY) > 5
        }})
      if (dest) {
        return {trg: dest.id, action: 'transfer'}
      } else if (!noWork) {
        let dest = this.creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES, {maxOps: 500})
        if (dest) {
          return {trg: dest.id, action: 'build'}
        }
      }
    } catch (e) {
      Log.error('getDestNode', e.stack)
    }
  }
  startAction (action, trgId) {
    this.mem.action = { action, trgId, start: Game.time }
    this.action = Actions.getAction(this)
  }

  run () {
    if (this.creep.spawning) {
      return
    }
    // todo - wait logic here
    if (this.action) {
      const res = this.action.do()
      switch (res) {
        case DONE:
          this.action.finish()
          return res
        default:
          return res
      }
    } else {
      return IDLE
    }
  }

}

/**
 * CREEPS ^ Base | Extenders v
 */

class CreepMiner extends CreepBase {
  constructor (id) {
    super(id)
    this.mem.role = 'miner'
  }

  run () {
    if (this.creep.hits < this.creep.hitsMax) {
      this.site.increaseThreat()
    }
    let res = super.run()
    if (res === IDLE) {
      if (this.energy > 0 || this.creep.ticksToLive < 40) {
        let trg = this.findDest()
        if (trg && trg.trg) {
          return this.startAction(trg.action, trg.trg)
        }
      }
      if (this.energyNeeded >= this.energy) {
        //Actions.start(this, 'harvest', this.site.id)
        return this.startAction('harvest', this.site.id)
      }
    }


  }

}

class CreepSupplier extends CreepBase {
  constructor (id) {
    super(id)
    this.mem.role = 'supplier'
  }

  run () {
    let res = super.run()
    if (res === IDLE) {
      if (this.energy > 0 || this.creep.ticksToLive < 40) {
        let trg = this.findDest(true)
        if (trg && trg.trg) {
          return this.startAction(trg.action, trg.trg)
        }
      }
      if (this.energy === 0) {
        //Actions.start(this, 'harvest', this.site.id)
        return this.startAction('withdraw', this.site.id)
      }
    }
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

/**
 * CREEPS
 */

/**
 * ACTIONS
 */

class Actions {
  //static getAction (creep) {
  //
  //}
  //
  //static start (creep, name, trgId) {
  //  let action = this.getAction
  //
  //  action.do()
  //}
  //
  //static getAction (creep) {
  //  if (!creep.mem.action) {
  //    return null
  //  } else {
  //    let action
  //    switch (creep.mem.action.type) {
  //      case 'harvest':
  //        action = new ActionHarvest(creep, creep.mem.action.trgId)
  //        break
  //    }
  //    return action
  //  }
  //
  //}
  //static do (creep) {
  //  if (!creep.mem.action) {
  //    return null
  //  } else {
  //    let action = this.getAction(creep)
  //    if (action) {
  //      let res = action.do()
  //      if (res === DONE) {
  //        action.finish()
  //      }
  //    }
  //  }
  //}

  static getAction(creep) {
    const mem = creep.mem.action;
    if (!mem) return null;
    switch (mem.action) {
      case 'harvest':
        return new ActionHarvest(creep, mem.trgId);
      case 'transfer':
        return new ActionTransfer(creep, mem.trgId)
      case 'build':
        return new ActionBuild(creep, mem.trgId)
      case 'withdraw':
        return new ActionWithdraw(creep, mem.trgId)
      default:
        Log.error('Unhandled action type: ', mem.action)
        return null;
    }
  }
  //
  //static start(creep, action, trgId) {
  //  creep.mem.action = { action, trgId, start: Game.time }
  //  action = this.getAction(creep)
  //  if (action) {
  //    action.do()
  //  }
  //}
  //
  //static do(creep) {
  //  const action = this.getAction(creep)
  //  if (action) {
  //    return action.do()
  //  } else {
  //    Log.error('Could not run action.do for ', creep && creep.id, action)
  //    return INVALID_ACTION
  //  }
  //}
}
// OK	                       0  The operation has been scheduled successfully.
// ERR_NOT_OWNER	          -1  You are not the owner of this creep, or the room controller is owned or reserved by another player.
// ERR_NO_PATH              -2  Path can not be found.
// ERR_BUSY	                -4  The creep is still being spawned.
// ERR_NOT_FOUND	          -5  Extractor not found. You must build an extractor structure to harvest minerals. Learn more
// ERR_NOT_ENOUGH_RESOURCES	-6  The target does not contain any harvestable energy or mineral.
// ERR_INVALID_TARGET	      -7  The target is not a valid source or mineral object.
// ERR_NOT_IN_RANGE	        -9  The target is too far away.
// ERR_TIRED	              -11 The extractor or the deposit is still cooling down.
// ERR_NO_BODYPART	        -12 There are no WORK body parts in this creep’s body.
const ACT_TRANS = {
  [OK]: 'OK: 0',
  [ERR_NOT_OWNER]: 'ERR_NOT_OWNER: -1',
  [ERR_NO_PATH]: 'ERR_NO_PATH: -2',
  [ERR_BUSY]: 'ERR_BUSY: -4',
  [ERR_NOT_FOUND]: 'ERR_NOT_FOUND: -5',
  [ERR_NOT_ENOUGH_RESOURCES]: 'ERR_NOT_ENOUGH_RESOURCES: -6',
  [ERR_INVALID_TARGET]: 'ERR_INVALID_TARGET: -7',
  [ERR_NOT_IN_RANGE]: 'ERR_NOT_IN_RANGE: -9',
  [ERR_NO_BODYPART]: 'ERR_NOT_IN_RANGE: -12',
  [ERR_TIRED]: 'ERR_TIRED'
}
class Action {
  constructor(creep, action, trgId) {
    this.actor = creep
    if (!this.actor.mem.action) {
      this.actor.mem.action = {
        action: action,
        start: Game.time,
        trgId: trgId
      }
    }
    this.id = trgId
    this.gameTrg = Game.getObjectById(this.id)
    this.action = action

  }

  isValid() {
    // Default implementation. Override in child classes.
    return true
  }

  do(...extraArgs) {
    if (!this.gameTrg) return DONE
    let res = this.actor.creep[this.action](this.gameTrg, ...extraArgs)
    switch (res) {
      case ERR_TIRED:
        return OK
      case ERR_NOT_IN_RANGE:
        this.actor.creep.moveTo(this.gameTrg)
        return OK
      case ERR_NO_BODYPART:
        Log.error(`Creep attempting action it has no body part for: Creep: ${this.actor.id} Action: ${this.action} trg: ${this.gameTrg.id}. Bailing on Action.`)
        return DONE
      default:
        return res
    }
  }

  finish() {
    // Cleanup or state update after the action is completed.
    delete this.actor.mem.action
  }
}

class ActionWithdraw extends Action {
  constructor(creep, targetId) {
    super(creep, 'withdraw', targetId);
  }
  do() {
    const res = super.do(RESOURCE_ENERGY)
    switch (res) {
      case OK:
        if (this.actor.energyNeeded === 0) { return DONE }
        break
      case ERR_NOT_IN_RANGE:
        this.actor.creep.moveTo(this.gameTrg)
        break
      case ERR_NOT_ENOUGH_RESOURCES: // done with the job.
        return DONE
      case ERR_INVALID_ARGS: // -10
        Log.error('Invalid args in tansfer action')
        break
      case ERR_TIRED:
        return OK
      //case ERR_INVALID_TARGET:
      //  break
      case ERR_FULL: // dest is full. what should transfer people do?
        return DONE
      //  if (target.structureType === STRUCTURE_SPAWN && !creep.memory.waited) {
      //    creep.memory.wait = Game.time + 2
      //    return
      //  } else {
      //    return DONE
      //  }
      case DONE:
        // clean up transfer action
        break
      default:
        Log.error('Unhandled transfer res: ', this.action, ACT_TRANS[res], this.actor && this.actor.id, this.actor && this.actor.creep && this.actor.creep.name)
    }
    return res
  }
}

class ActionTransfer extends Action {
  constructor(creep, targetId) {
    super(creep, 'transfer', targetId);
  }
  do() {
    const res = super.do(RESOURCE_ENERGY)
    switch (res) {
      case OK:
        if (this.actor.energy === 0) { return DONE }
        break
      case ERR_NOT_IN_RANGE:
        this.actor.creep.moveTo(this.gameTrg)
        break
      case ERR_NOT_ENOUGH_RESOURCES: // done with the job.
        return DONE
      case ERR_INVALID_ARGS: // -10
        Log.error('Invalid args in tansfer action')
        break
      case ERR_TIRED:
        return OK
      //case ERR_INVALID_TARGET:
      //  break
      case ERR_FULL: // dest is full. what should transfer people do?
        return DONE
      //  if (target.structureType === STRUCTURE_SPAWN && !creep.memory.waited) {
      //    creep.memory.wait = Game.time + 2
      //    return
      //  } else {
      //    return DONE
      //  }
      case DONE:
        // clean up transfer action
        break
      default:
        Log.error('Unhandled transfer res: ', this.action, ACT_TRANS[res], this.actor && this.actor.id, this.actor && this.actor.creep && this.actor.creep.name)
    }
    return res
  }
}


class ActionBuild extends Action {
  constructor(creep, targetId) {
    super(creep, 'build', targetId);
  }
  // OK	                       0  The operation has been scheduled successfully.
  // ERR_NOT_OWNER	          -1  You are not the owner of this creep, or the room controller is owned or reserved by another player.
  // ERR_BUSY	                -4  The creep is still being spawned.
  // ERR_NOT_FOUND	          -5  Extractor not found. You must build an extractor structure to harvest minerals. Learn more
  // ERR_NOT_ENOUGH_RESOURCES	-6  The target does not contain any harvestable energy or mineral.
  // ERR_INVALID_TARGET	      -7  The target is not a valid source or mineral object.
  // ERR_NOT_IN_RANGE	        -9  The target is too far away.
  // ERR_TIRED	              -11 The extractor or the deposit is still cooling down.
  // ERR_NO_BODYPART	        -12 There are no WORK body parts in this creep’s body.
  do() {
    const res = super.do()
    switch (res) {
      case OK:
        if (this.actor.energy === 0) { return DONE }
        break
      case ERR_NOT_IN_RANGE:
        this.actor.creep.moveTo(this.gameTrg)
        break
      case ERR_NOT_ENOUGH_RESOURCES: // done with the job.
        return DONE
      case ERR_INVALID_ARGS: // -10
        Log.error('Invalid args in tansfer action')
        break
      case ERR_TIRED:
        return OK
      //case ERR_INVALID_TARGET:
      //  break
      //case ERR_FULL: // dest is full. what should transfer people do?
      //  if (target.structureType === STRUCTURE_SPAWN && !creep.memory.waited) {
      //    creep.memory.wait = Game.time + 2
      //    return
      //  } else {
      //    return DONE
      //  }
      case DONE:
        // clean up transfer action
        break
      default:
        Log.error('Unhandled build res: ', this.action, ACT_TRANS[res], this.actor && this.actor.id, this.actor && this.actor.creep && this.actor.creep.name)
    }
    return res
  }
}

class ActionHarvest extends Action {
  constructor(creep, targetId) {
    super(creep, 'harvest', targetId);
  }
  // OK	                       0  The operation has been scheduled successfully.
  // ERR_NOT_OWNER	          -1  You are not the owner of this creep, or the room controller is owned or reserved by another player.
  // ERR_NO_PATH              -2  Path can not be found.
  // ERR_BUSY	                -4  The creep is still being spawned.
  // ERR_NOT_FOUND	          -5  Extractor not found. You must build an extractor structure to harvest minerals. Learn more
  // ERR_NOT_ENOUGH_RESOURCES	-6  The target does not contain any harvestable energy or mineral.
  // ERR_INVALID_TARGET	      -7  The target is not a valid source or mineral object.
  // ERR_NOT_IN_RANGE	        -9  The target is too far away.
  // ERR_TIRED	              -11 The extractor or the deposit is still cooling down.
  // ERR_NO_BODYPART	        -12 There are no WORK body parts in this creep’s body.
  do() {
    const res = super.do()
    switch (res) {
      case OK:
        if (this.actor.energyNeeded === 0) { return DONE }
        break
      case ERR_NOT_IN_RANGE:
        this.actor.creep.moveTo(this.gameTrg)
        break
      case ERR_NOT_ENOUGH_RESOURCES:
        if (this.actor.energy > this.actor.energyNeeded) {
          return DONE
        } else if (this.gameTrg.energy === 0) {
          this.actor.mem.wait = Game.time + this.gameTrg.ticksToRegeneration
        }
        break
      case DONE:
        // clean up harvest action
        break
      default:
        Log.error('Unhandled harvest res: ', JSON.stringify(res), '::' + res + '::', this.actor && this.actor.id, this.actor && this.actor.creep && this.actor.creep.name)
    }
    return res
  }
}

/**
 * ACTIONS
 */

/**
 * HELPER FUNCS
 */

function clearCache () {
  Sites.clearCache()
  Creeps.clearCache()
  Manifests.clearCache()
}

function initMemory () {
  delete Memory.spawns
  delete Memory.rooms
  delete Memory.flags
  Memory.bases = []
  Memory.sites = {}
  Memory.manifests = {}
  for (let name in Game.spawns) {
    let spawn = Game.spawns[name]
    let newBaseName = spawn.room.name
    if (!Memory.sites[newBaseName]) { // make new base
      Sites.createSite('base', spawn, newBaseName)
    }
  }
  Memory.init = true
}

class Main {
  constructor() {
    if (!Memory.init) { initMemory() }
  }

  run () {
    try {
      Sites.runSites(Memory.bases)
      Creeps.runCreeps(Memory.creeps)
      clearCache()
    } catch (e) {
      Log.error('Error in Main:', e.stack);
    }
  }
}

/**
 * MAIN LOOP
 */

module.exports.loop = function () {
  const main = new Main();
  main.run();
}

/**
 * MAIN LOOP
 */



