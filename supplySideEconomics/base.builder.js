const {deserializePos} = require('./utils.memory')


module.exports.run = function (base, manifest) {
    if (base?.newSites?.length) {
      let newBaseSites = []
      base.newSites.forEach(pos => {
        const lookRes = deserializePos(pos).lookFor(LOOK_CONSTRUCTION_SITES)
        if (lookRes?.length) {
          // lookRes.find(r => {
          //   r.type === ''
          // })
          base.jobs[pos].siteId = lookRes[0]?.id
        } else {
          console.log('ERROR: New site not found!', pos)
          newBaseSites.push(pos)
        }
      })
      base.newSites = newBaseSites
    }
}
