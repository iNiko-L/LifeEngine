const Hyperparams = require("../../Hyperparameters");
const Directions = require("../Directions");
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
        let range = Hyperparams.can_rotate ? 7 : 5;
        return Math.floor(Math.random() * range);
    }
}

class Brain {
    constructor(owner){
        this.owner = owner;
        this.observations = [];

        // corresponds to CellTypes
        this.decisions = {};
        for (let cell of CellStates.all) {
            this.decisions[cell.name] = Decision.neutral;
        }
        this.decisions[CellStates.food.name] = Decision.chase;
        this.decisions[CellStates.killer.name] = Decision.retreat;
    }

    copy(brain) {
        for (let dec in brain.decisions) {
            this.decisions[dec] = brain.decisions[dec];
        }
    }

    randomizeDecisions(randomize_all=false) {
        // randomize the non obvious decisions
        if (randomize_all) {
            this.decisions[CellStates.food.name] = Decision.getRandom();
            this.decisions[CellStates.killer.name] = Decision.getRandom();
        }
        this.decisions[CellStates.mouth.name] = Decision.getRandom();
        this.decisions[CellStates.producer.name] = Decision.getRandom();
        this.decisions[CellStates.mover.name] = Decision.getRandom();
        this.decisions[CellStates.armor.name] = Decision.getRandom();
        this.decisions[CellStates.eye.name] = Decision.getRandom();
    }

    observe(observation) {
        this.observations.push(observation);
    }

    decide() {
        let decision = Decision.neutral;
        let closest = Hyperparams.lookRange + 1;
        let move_direction = 0;
        for (let obs of this.observations) {
            if (obs.cell == null || obs.cell.owner == this.owner) {
                continue;
            }
            if (obs.distance < closest) {
                decision = this.decisions[obs.cell.state.name];
                move_direction = obs.direction;
                closest = obs.distance;
            }
        }
        this.observations = [];
        return {decision, move_direction};
    }

    mutate() {
        this.decisions[CellStates.getRandomName()] = Decision.getRandom();
        // this.decisions[CellStates.empty.name] = Decision.neutral; // if the empty cell has a decision it gets weird
    }
    
    serialize() {
        return {decisions: this.decisions};
    }
}

Brain.Decision = Decision;

module.exports = Brain;