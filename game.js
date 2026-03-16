//Inheritance
//Base class (Every game object has a position and type)
class GameObject {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
    }
}

//Adds the ability to move
class Movable extends GameObject {
    constructor(x, y, type) {
        super(x, y, type); //Call parent constructor
    }

    //Move the object to a new position
    moveTo(x, y) {
        this.x = x;
        this.y = y;
    }
}

//Hero is a Movable object (It can move around the screen)
class Hero extends Movable {
    constructor(x, y) {
        super(x, y, 'Hero'); //Type is automatically set to Hero
    }
}

//No movement capability yet
class Enemy extends GameObject {
    constructor(x, y) {
        super(x, y, 'Enemy');
    }
}

//Pub/sub event system
// EventEmitter handles communication between game components
class EventEmitter {
    constructor() {
        this.listeners = {}; //Stores all registered listeners
    }

    //Register a listener for a specific message type
    on(message, listener) {
        if (!this.listeners[message]) {
            this.listeners[message] = [];
        }
        this.listeners[message].push(listener);
    }

    //Send a message to all registered listeners
    emit(message, payload = null) {
        if (this.listeners[message]) {
            this.listeners[message].forEach(listener => {
                listener(message, payload);
            });
        }
    }
}

//Messages
//Define message types as constants to avoid typos
const Messages = {
    HERO_MOVE_LEFT: 'HERO_MOVE_LEFT',
    HERO_MOVE_RIGHT: 'HERO_MOVE_RIGHT',
    HERO_MOVE_UP: 'HERO_MOVE_UP',
    HERO_MOVE_DOWN: 'HERO_MOVE_DOWN',
    ENEMY_SPOTTED: 'ENEMY_SPOTTED'
};

//Create event emitter and hero instances
const eventEmitter = new EventEmitter();
const hero = new Hero(0, 0);

//Movement messages and update hero position
eventEmitter.on(Messages.HERO_MOVE_LEFT, () => {
    hero.moveTo(hero.x - 5, hero.y);
    console.log(`Hero moved to position: ${hero.x}, ${hero.y}`);
});

eventEmitter.on(Messages.HERO_MOVE_RIGHT, () => {
    hero.moveTo(hero.x + 5, hero.y);
    console.log(`Hero moved to position: ${hero.x}, ${hero.y}`);
});

eventEmitter.on(Messages.HERO_MOVE_UP, () => {
    hero.moveTo(hero.x, hero.y - 5);
    console.log(`Hero moved to position: ${hero.x}, ${hero.y}`);
});

eventEmitter.on(Messages.HERO_MOVE_DOWN, () => {
    hero.moveTo(hero.x, hero.y + 5);
    console.log(`Hero moved to position: ${hero.x}, ${hero.y}`);
});

//Keyboard input publishes messages to the event emitter (Arrow keys)
window.addEventListener('keydown', (event) => {
    event.preventDefault(); //Stop browser default scroll behaviour
    switch (event.key) {
        case 'ArrowLeft':
            eventEmitter.emit(Messages.HERO_MOVE_LEFT);
            break;
        case 'ArrowRight':
            eventEmitter.emit(Messages.HERO_MOVE_RIGHT);
            break;
        case 'ArrowUp':
            eventEmitter.emit(Messages.HERO_MOVE_UP);
            break;
        case 'ArrowDown':
            eventEmitter.emit(Messages.HERO_MOVE_DOWN);
            break;
    }
});