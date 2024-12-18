const {deserializePos} = require('./utils.memory')


module.exports.run = function (base, manifest) {
    if (base?.newSites?.length) {
      let newBaseSites = []
      base.newSites.forEach(pos => {
        console.log('pos in base.builder', pos)
        const lookRes = deserializePos(pos).lookFor(LOOK_CONSTRUCTION_SITES)
        if (lookRes?.length) {
          // lookRes.find(r => {
          //   r.type === ''
          // })
          console.log('1111',JSON.stringify(lookRes))
          console.log('1111',base.jobs[pos])
          base.jobs[pos].siteId = lookRes[0]?.id
          console.log('2222',JSON.stringify(base.jobs[pos]), JSON.stringify(base.jobs[pos].siteId))
        } else {
          console.log('ERROR: New site not found!', pos)
          newBaseSites.push(pos)
        }
      })
      base.newSites = newBaseSites
    }
}
