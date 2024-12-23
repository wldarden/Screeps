const {deserializePos} = require('./utils.memory')
const {getUniqueName} = require('./utils.spawner')

function getCatPriority (profit) {
	if (profit <= 2) {
		return ['mine']
	} else {
		return ['build', 'upgrade', 'mine']
	}
}

function isSafe (job) {
	return !job.threat
}

function isPossible (job, room) {
	return job.cost <= room.energyAvailable
}

function isCostEffective (job, revenue) {
	if (job.value > 0) { // job is already positive, so do sure
		return true
	} else {
		const newRevenue = revenue + job.value
		return newRevenue >= 2
	}
}
module.exports.run = function (base, manifest) {
	let room = Game.rooms[base.name]
	base.priority = base.priority || {
		spawn: []
	}
	let profit = 0
	let revenue = 0
	Object.keys(base.jobs).forEach(jobId => {
		const jobBalance = ((base.jobs[jobId].value ?? 0) * base.jobs[jobId].creeps.length)
		if (jobBalance > 0) {
			profit = profit + jobBalance
		}
		profit = profit + jobBalance
	})

	let possible = []
	let impossiblyExpensive = []
	let notProfitable = []
	let dangerous = []
	let needsSaving = []
	if (profit < 2) {
		base.queue.mine.forEach(jobId => {
			let job = base.jobs[jobId]
			if (!isSafe(job)) {
				return false
			} else if (!isPossible(job, room)) {
				return false
			} else if (!isCostEffective(job, profit)) {
				return false
			} else {
				possible.push(jobId)
			}
		})
	} else {
		Object.keys(base.queue).forEach(jobCat => {
			let queue = base.queue[jobCat]
			return queue.some(jobId => {
				let job = base.jobs[jobId]
				if (!isSafe(job)) {
					dangerous.push(jobId)
					return false
				} else if (!isPossible(job, room)) {
					impossiblyExpensive.push(jobId)
					return false
				} else if (!isCostEffective(job, profit)) {
					notProfitable.push(jobId)
					return false
				} else {
					possible.push(jobId)
				}
			})
		})
	}


	if (!possible?.length) {// no job is currently ideally possible. check other options:
	}
	possible.sort((a,b) => a.value - b.value)
	const controllerOk = true
	notProfitable.sort((a,b) => {
		if (controllerOk) {
			if (a.cat === 'build' && b.cat === 'build') {
				return a.value - b.value
			} else if (a.cat === 'build') {
				return -1
			} else if (b.cat === 'build') {
				return 1
			} else {
				return a.value - b.value
			}
		}
	})

	base.priority.spawn = [...possible, ...notProfitable]

	// console.log('Possible: ', JSON.stringify(possible))
	// console.log('notProfitable: ', JSON.stringify(notProfitable))
	// console.log('impossiblyExpensive: ', JSON.stringify(impossiblyExpensive))
	// console.log('dangerous: ', JSON.stringify(dangerous))
	// console.log('base.priority.spawn: ', JSON.stringify(base.priority.spawn))
}
