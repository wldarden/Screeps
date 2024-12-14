
const jobRunners = {
    harvest: {runner: require('job.harvest')}
}
module.exports.runJob = function (creep) {
    try {
        let jobRunner = jobRunners[creep.memory.job.type]
        if (jobRunner) {
            jobRunner.runner.run(creep)
        } else {
            console.log('Error: No job runner found for ', creep.memory.job.type, creep.name)
        }
    } catch (e) {
        console.log('Error: failed to run ', creep.memory.job.type, ' job for creep:', creep.name, e.stack)
    }
}
