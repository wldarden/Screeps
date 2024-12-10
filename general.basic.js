


class General {
    name = 'General Generic'
    creeps = []
    rooms = []
    spawns = []
    strategy = {
        name: 'start',
        status: 'running',
        goals: [
          {type: 'spawnCreep', role: 'harvester', count: 2, done: false},
          {type: 'spawnCreep', role: 'upgrader', count: 1, done: false},
          {type: 'spawnCreep', role: 'builder', count: 1, done: false},
          {type: 'build', role: STRUCTURE_EXTENSION, count: 6, done: false},
        ]
    }
    constructor(type = 'start', resources) {
        console.log('constructor for general')
    }

    run (available) {
        console.log(`general ${this.name} running`)
        // have 2 harvesters?
        // have 1 upgraders?
        // controller level 2?
        // have 6 extentions?
        // built advanced harvester?
        this.goals.forEach(g => {

        })
        this.spawns.forEach(s => {

        })
        return {
            requests: [],
            free: []
        }
    }
    checkGoal (goal) {
        switch (goal.type) {
            case 'spawnCreep':

        }
    }

    add (type, name) {
        switch(type) {
            case 'creep':
                this.creeps.push(name)
            case 'room':
                this.rooms.push(name)
            case 'spawn':
                this.spawns.push(name)
        }
    }

}

module.exports = General
