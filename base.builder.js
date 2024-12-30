const {deserializePos} = require('./utils.memory')
const {requestBuilder, hasSpawnRequest} = require('./utils.manifest')



function getMaxBuilders (base, manifest) {
  let maxBuilders = 0
  let total = manifest.income?.total
  if (total) {
    if (total.rev > 15) {
      if (total.bal > 1) {
        maxBuilders = 4
      }
    } else {
      if (total.bal > 3) {
        maxBuilders = 1
      }
    }
  }
  return maxBuilders
}
module.exports.run = function (base, manifest) {
  const weWantToBuild = true

  if (manifest.req?.build?.length && weWantToBuild) { // and have queued build requests
    if ((!base.creeps?.build || base.creeps?.build?.length < getMaxBuilders(base, manifest)) && !hasSpawnRequest(manifest, base.name)) { // make sure we have builders
        requestBuilder(manifest, base.name, base.name)
    }
    if (base.creeps?.build?.length > 0) { // if we have builders
      const priorityReq = manifest.req.build[0]
      if (!priorityReq.placed) { // if construction not even started:
        let room = Game.rooms[base.name]
        const pos = deserializePos(priorityReq.pos)
        const res = room.createConstructionSite(pos.x, pos.y, priorityReq.structureType)
        if (res === 0) {
          let node = Memory.nodes[priorityReq.node] || Memory.nodes[priorityReq.node]
          if (node) {
            if (!node.sites) {
              node.sites = {}
            }
            if (!node.sites[priorityReq.structureType]) {
              node.sites[priorityReq.structureType] = [priorityReq.pos]
            } else {
              node.sites[priorityReq.structureType].push(priorityReq.pos)
            }
          }
          // manifest.res.build.push(manifest.req.build.shift())
        }
      } else { // if site existed already, but request doesnt have the siteId, get it and attatch to qrequest
        if (!priorityReq.siteId && Game.time - priorityReq.placed > 2) {
          const pos = deserializePos(priorityReq.pos)
          const lookRes = pos.lookFor(LOOK_CONSTRUCTION_SITES)
          if (lookRes?.length) {
            lookRes.some(item => {
              if (item.structureType === priorityReq.structureType) {
                priorityReq.siteId = item.id
                return true
              }
              return false
            })
          }
        }
      }

    }

    // check existing siteIds to see if they completed
    if (manifest.req.build && manifest.req.build[0] && manifest.req.build[0].siteId) {
      let priorityReq = manifest.req.build[0]
      if (!Game.getObjectById(priorityReq.siteId)) {
        const lookRes = deserializePos(priorityReq.pos).lookFor(LOOK_STRUCTURES)

        if (lookRes?.length) {
          let found = lookRes.find(item => item.structureType === priorityReq.structureType)
          if (found) {
            base.structures[priorityReq.structureType].push(found.id)
            if (!Memory.nodes[priorityReq.node]) {
              Memory.nodes[priorityReq.node] = {}
            }
            if (!Memory.nodes[priorityReq.node].structures) {
              Memory.nodes[priorityReq.node].structures = {}
            }
            if(!Memory.nodes[priorityReq.node].structures[priorityReq.structureType]) {
              Memory.nodes[priorityReq.node].structures[priorityReq.structureType] = []
            }
            Memory.nodes[priorityReq.node].structures[priorityReq.structureType].push(found.id)
            if (!Memory.nodes[priorityReq.node].sites) {
              Memory.nodes[priorityReq.node].sites = {}
            }
            if (!Memory.nodes[priorityReq.node].sites[priorityReq.structureType]) {
              Memory.nodes[priorityReq.node].sites[priorityReq.structureType] = []
            }
            Memory.nodes[priorityReq.node].sites[priorityReq.structureType] = Memory.nodes[priorityReq.node].sites[priorityReq.structureType].filter(pos => priorityReq.pos !== pos)
            manifest.req.build.shift()
          }
        }
      }
    }
  }
    // if (base?.newSites?.length) {
    //   let newBaseSites = []
    //   base.newSites.forEach(pos => {
    //     const lookRes = deserializePos(pos).lookFor(LOOK_CONSTRUCTION_SITES)
    //     if (lookRes?.length) {
    //       // lookRes.find(r => {
    //       //   r.type === ''
    //       // })
    //       base.jobs[pos].siteId = lookRes[0]?.id
    //     } else {
    //       console.log('ERROR: New site not found!', pos)
    //       newBaseSites.push(pos)
    //     }
    //   })
    //   base.newSites = newBaseSites
    // }
}
