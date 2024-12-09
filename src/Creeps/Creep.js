
// Body part	Build cost	Effect per one body part
// MOVE	50	Decreases fatigue by 2 points per tick.
//   WORK	100
// Harvests 2 energy units from a source per tick.
//
//   Harvests 1 resource unit from a mineral or a deposit per tick.
//
//   Builds a structure for 5 energy units per tick.
//
//   Repairs a structure for 100 hits per tick consuming 1 energy unit per tick.
//
//   Dismantles a structure for 50 hits per tick returning 0.25 energy unit per tick.
//
//   Upgrades a controller for 1 energy unit per tick.
//
//   CARRY	50	Can contain up to 50 resource units.
//   ATTACK	80	Attacks another creep/structure with 30 hits per tick in a short-ranged attack.
//   RANGED_ATTACK	150
// Attacks another single creep/structure with 10 hits per tick in a long-range attack up to 3 squares long.
//
//   Attacks all hostile creeps/structures within 3 squares range with 1-4-10 hits (depending on the range).
//
// HEAL	250	Heals self or another creep restoring 12 hits per tick in short range or 4 hits per tick at a distance.
//   CLAIM	600
// Claims a neutral room controller.
//
//   Reserves a neutral room controller for 1 tick per body part.
//
//   Attacks a hostile room controller downgrading its timer by 300 ticks per body parts.
//
//   Attacks a neutral room controller reservation timer by 1 tick per body parts.
//
//   A creep with this body part will have a reduced life time of 600 ticks and cannot be renewed.
//
//   TOUGH	10	No effect, just additional hit points to the creep's body. Can be boosted to resist damage.

const PART_COST = {
    [MOVE]: 50,
    [WORK]: 100,
    [CARRY]: 50,
    [ATTACK]: 150,
    [RANGED_ATTACK]: 150,
    [HEAL]: 250,
    [CLAIM]: 600,
    [TOUGH]: 10
}

const types = {
    peon: {
        bodyPlan: [WORK, CARRY, MOVE],
        roles: ['builder', 'upgrader', 'harvester'],
        cost: 200
    },
    miner: {
        bodyPlan: [WORK, WORK, WORK, WORK, WORK, MOVE],
        roles: ['miner'],
        cost: 550
    },
    transporter: {
        bodyPlan: [CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE],
        roles: ['transport'],
        cost: 500
    }
}
