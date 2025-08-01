const Hyperparams = require("../../Hyperparameters");
const CellStates = require("../Cell/CellStates");

const Decision = {
    neutral: 0,
    retreat: 1,
    chase: 2,
    move_left: 3,
    move_right: 4,
    stop: 5,
    turn_left: 6,
    turn_right: 7,
    getRandom: function() {
        const range = Hyperparams.rotationEnabled ? 8 : 6
        return Math.floor(Math.random() * range);
    }
}

// the brain takes eye observations in -> movement decision out
// it operates as a state machine (the brain state), and has independent logic for each eye
// each eye has a list of decision maps, one for each brain state
// each decision map is a map from (observed cell state) -> (movement decision, next brain state)
// (action,next_state) = decisions[eye_index][state_index][observed_cell]
// the nearest eye's observations is the one that determines the action

class Brain {
    constructor(owner) {
        this.owner = owner;
        this.num_states = 1;
        this.state = 0;
        this.observations = [];
        this.decisions = [[ this.newDecisionMap() ]];
        this.eye_cell_count = 0;
    }

    checkAddedCell(cell) {
        if (cell.state.name == CellStates.eye.name) {
            if (this.decisions.length <= this.eye_cell_count) {
                if (this.decisions.length === 0) {
                    const eyeStates = [];
                    for(let s=0;s<this.num_states;s++) eyeStates.push(this.newDecisionMap());
                    this.decisions.push(eyeStates);
                } else {
                    // if there are already eyes, copy the last eye's states/decisions to new eye
                    const last_eye_copy = JSON.parse(JSON.stringify(this.decisions[this.decisions.length - 1]));
                    this.decisions.push(last_eye_copy);
                }
            }
            this.eye_cell_count++;
        }
    }

    checkRemovedCell(cell) {
        if (cell.state.name == CellStates.eye.name) {
            let eye_index = -1;
            for (let c of this.owner.anatomy.cells) {
                if (c.state.name == CellStates.eye.name) {
                    eye_index++;
                }
                if (c === cell) {
                    break;
                }
            }
            if (eye_index != -1) {
                this.decisions.splice(eye_index, 1);
            }
            this.eye_cell_count--;
        }
    }

    countCells() {
        this.eye_cell_count = 0;
        for (let cell of this.owner.anatomy.cells) {
            if (cell.state.name == CellStates.eye.name) {
                this.eye_cell_count++;
            }
        }
    }
    
    newBrainState(randomize_connections=true) {
        if (this.num_states >= 10) {
            return;
        }
        this.num_states++;
        // console.log('new brain state', this.num_states);
        for (let eye of this.decisions) {
            const last_state = eye[eye.length - 1];
            if (last_state) {
                const last_state_copy = JSON.parse(JSON.stringify(last_state));
                eye.push(last_state_copy);
            } else {
                eye.push(this.newDecisionMap(default_decision));
            }
        }
        if (!randomize_connections)
            return;
        const numMut = Math.max(1, Math.floor(Math.random() * this.decisions.length * this.num_states * 2));
        for (let i = 0; i < numMut; i++) {
            const eyeIdx = Math.floor(Math.random() * this.decisions.length);
            const fromState = Math.floor(Math.random() * (this.num_states - 1));
            const toState = this.num_states - 1;
            const cellType = CellStates.getRandomName();
            this.decisions[eyeIdx][fromState][cellType].state = toState;
        }
    }

    removeBrainState(index=-1) {
        if (index === -1) {
            index = this.num_states - 1;
        }
        if (this.num_states <= 1) {
            return;
        }
        const new_num_states = this.num_states - 1;
        for (let eye of this.decisions) {
            for (let i=0;i<eye.length;i++) {
                if (i === index) {
                    continue;
                }
                const state = eye[i];
                for (let cell of CellStates.all) {
                    if (state[cell.name].state === index) {
                        state[cell.name].state = Math.floor(Math.random() * new_num_states);
                    }
                    if (state[cell.name].state > index) {
                        state[cell.name].state--;
                    }
                }
            }
            eye.splice(index, 1);
        }
        this.num_states = new_num_states;
        if (this.state >= this.num_states) {
            this.state = this.num_states;
        }
    }

    newDecisionMap(default_decision=null) {
        const decisions = {};
        for (let cell of CellStates.all) {
            decisions[cell.name] = {
                decision: default_decision || Decision.getRandom(),
                state: Math.floor(Math.random() * this.num_states)
            };
        }
        decisions[CellStates.food.name].decision = Decision.chase;
        decisions[CellStates.killer.name].decision = Decision.retreat;
        return decisions;
    }

    copy(brain) {
        this.countCells();
        this.decisions = [];
        if (Array.isArray(brain.decisions)) {
            this.decisions = JSON.parse(JSON.stringify(brain.decisions));
        } else if (brain.decisions && typeof brain.decisions === 'object') {
            // legacy single-map structure
            for (let i = 0; i < this.eye_cell_count; i++) {
                const decisions_copy = JSON.parse(JSON.stringify(brain.decisions));
                for (let cell of CellStates.all) {
                    decisions_copy[cell.name] = {
                        decision: decisions_copy[cell.name],
                        state: 0
                    };
                }
                this.decisions.push([decisions_copy]);
            }
        }
        if (this.decisions.length > 0) {
            this.num_states = this.decisions[0].length;
        }
        this.countCells();
    }

    randomizeDecisions() {
        for (let eye of this.decisions) {
            for (let state of eye) {
                for (let cell of CellStates.all) {
                    state[cell.name].decision = Decision.getRandom();
                }
            }
        }
    }

    observe(observation) {
        this.observations.push(observation);
    }

    decide() {
        let decision = {
            decision: Decision.neutral,
            state: 0
        };
        let closest = Hyperparams.lookRange + 1;
        let move_direction = 0;
        for (let i = 0; i < this.observations.length; i++) {
            let obs = this.observations[i];
            if (obs.cell == null || obs.cell.owner == this.owner) {
                continue;
            }
            if (obs.distance < closest) {
                const eye_index = (i < this.decisions.length) ? i : 0;
                if (this.state >= this.num_states) {
                    console.error('state out of bounds', this.state, this.num_states);
                }
                decision = this.decisions[eye_index][this.state][obs.cell.state.name];
                move_direction = obs.direction;
                closest = obs.distance;
            }
        }
        this.observations = [];
        this.state = decision.state;
        return {decision: decision.decision, move_direction};
    }

    mutate() {
        let eye_index = Math.floor(Math.random() * this.decisions.length);
        let state_index = Math.floor(Math.random() * this.decisions[eye_index].length);
        this.decisions[eye_index][state_index][CellStates.getRandomName()].decision = Decision.getRandom();
        if (Math.random() < 0.1) {
            if (Math.random() < 0.5) {
                this.newBrainState();
            } else {
                this.removeBrainState();
            }
        }
    }
    
    serialize() {
        return {decisions: this.decisions};
    }
}

Brain.Decision = Decision;

module.exports = Brain;