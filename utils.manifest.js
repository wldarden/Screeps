




function hasBuildRequest (manifest, nodeId, params = {}) {
    return manifest.req.build.some(r => {
        return r.node === nodeId && Object.keys(params).every(key => (r[key] && r[key] === params[key])) // params key is in req base and matches
    })
}
module.exports.hasBuildRequest = hasBuildRequest


function hasSpawnRequest (manifest, nodeId, params = {}) {
    return manifest.req.spawn.some(r => {
        return r.mem.node === nodeId && Object.keys(params).every(key => (
          (
            r.mem[key] && r.mem[key] === params[key]) || // params key is in req mem and matches
            r[key] && r[key] === params[key] // params key is in req base and matches
          )
        )
    })
}
module.exports.hasSpawnRequest = hasSpawnRequest

function addRequest (manifest, request, type) {
    let priIndex = manifest.req[type].findIndex(req => req.pri < request.pri)
    if (priIndex === -1) {
        manifest.req[type].push(request)
    } else {
        manifest.req[type].splice(priIndex, 0, request)
    }
}
module.exports.addRequest = addRequest




function requestBuilder (manifest, baseName, nodeId, planObj, memory, priority) {
    const plan = planObj || {W: 2, C: 1, M: 1}
    const mem = memory || {
        base: baseName,
        node: nodeId,
        role: 'build'
    }
    const pri = priority || 1 // this should be some function of build length, income balance, and saturations
    addSpawnRequest(manifest, {plan, mem, pri})
}
module.exports.requestBuilder = requestBuilder

const DEFAULT_BODY_PLAN = {W: 1, C: 2, M: 2}
function addSpawnRequest (manifest, request) {
    // request = {
    //     mem: {
    //         base: ''
    //         node: '',
    //         role: ''
    //     },
    //     plan: {W: 1, C: 2, M: 2}
    // }
    addRequest(manifest, request, 'spawn')
}
module.exports.addSpawnRequest = addSpawnRequest

function addBuildRequest (manifest, request) {
    // request = {
    //     node: '',
    //     structureType: STRUCTURE_CONTAINER,
    //     pri: 1
    // }
    addRequest(manifest, request, 'build')
}
module.exports.addBuildRequest = addBuildRequest
