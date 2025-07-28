// A cell state is used to differentiate type and render the cell
class CellState{
    constructor(name) {
        this.name = name;
        this.color = 'black';
    }

    render(ctx, cell, size) {
        ctx.fillStyle = this.color;
        ctx.fillRect(cell.x, cell.y, size, size);
    }
}

class Empty extends CellState {
    constructor() {
        super('empty');
    }
}
class Food extends CellState {
    constructor() {
        super('food');
    }
}
class Wall extends CellState {
    constructor() {
        super('wall');
    }
}
class Mouth extends CellState {
    constructor() {
        super('mouth');
    }
}
class Producer extends CellState {
    constructor() {
        super('producer');
    }
}
class Mover extends CellState {
    constructor() {
        super('mover');
    }
}
class Killer extends CellState {
    constructor() {
        super('killer');
    }
}
class Armor extends CellState {
    constructor() {
        super('armor');
    }
}
class Eye extends CellState {
    constructor() {
        super('eye');
        this.slit_color = 'black';
    }
    render(ctx, cell, size) {
        ctx.fillStyle = this.color;
        ctx.fillRect(cell.x, cell.y, size, size);

        if (size === 1) return;

        // compute vertical and horizontal slit dimensions
        const wVert = size >> 2;               // narrow width ~ size/4
        const hVert = (size * 3) >> 2;         // tall height ~ size*0.75
        const wHorz = hVert;                   // wide slit ~ size*0.75
        const hHorz = wVert;                   // short height ~ size/4

        let sx, sy, w, h; // slit rect
        const dir = cell.cell_owner.getAbsoluteDirection(); // 0-3 (up, right, down, left)

        switch (dir) {
            case 0: // up
                w = wVert; h = hVert;
                sx = cell.x + ((size - w) >> 1);
                sy = cell.y;
                break;
            case 1: // right
                w = wHorz; h = hHorz;
                sx = cell.x + size - w;
                sy = cell.y + ((size - h) >> 1);
                break;
            case 2: // down
                w = wVert; h = hVert;
                sx = cell.x + ((size - w) >> 1);
                sy = cell.y + size - h;
                break;
            case 3: // left
                w = wHorz; h = hHorz;
                sx = cell.x;
                sy = cell.y + ((size - h) >> 1);
                break;
            default:
                w = wVert; h = hVert;
                sx = cell.x;
                sy = cell.y;
        }

        ctx.fillStyle = this.slit_color;
        ctx.fillRect(sx, sy, w, h);
    }
}

const CellStates = {
    empty: new Empty(),
    food: new Food(),
    wall: new Wall(),
    mouth: new Mouth(),
    producer: new Producer(),
    mover: new Mover(),
    killer: new Killer(),
    armor: new Armor(),
    eye: new Eye(),
    defineLists() {
        this.all = [this.empty, this.food, this.wall, this.mouth, this.producer, this.mover, this.killer, this.armor, this.eye]
        this.living = [this.mouth, this.producer, this.mover, this.killer, this.armor, this.eye];
    },
    getRandomName: function() {
        return this.all[Math.floor(Math.random() * this.all.length)].name;
    },
    getRandomLivingType: function() {
        return this.living[Math.floor(Math.random() * this.living.length)];
    }
}

CellStates.defineLists();

module.exports = CellStates;
