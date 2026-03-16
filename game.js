//Inheritance (Part 1)
//Every game object has a position and type
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

//No movement capability
class Enemy extends GameObject {
    constructor(x, y) {
        super(x, y, 'Enemy');
    }
}

//Pub/sub system (Part 1)
//EventEmitter handles communication between game components
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

//Define message types as constants to avoid typos
const Messages = {
    HERO_MOVE_LEFT: 'HERO_MOVE_LEFT',
    HERO_MOVE_RIGHT: 'HERO_MOVE_RIGHT',
    HERO_MOVE_UP: 'HERO_MOVE_UP',
    HERO_MOVE_DOWN: 'HERO_MOVE_DOWN',
    ENEMY_SPOTTED: 'ENEMY_SPOTTED'
};

//Image loading (Part 2)
//Loads an image from a path and returns a Promise
function loadAsset(path) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = path;
        img.onload = () => {
            resolve(img); //Image loaded successfully
        };
        img.onerror = () => {
            reject(new Error(`Failed to load image: ${path}`));
        };
    });
}

//Enemy formation (Part 2)
//Constants to control enemy spacing and formation size
const ENEMY_TOTAL = 5;
const ENEMY_SPACING = 98;
const FORMATION_WIDTH = ENEMY_TOTAL * ENEMY_SPACING;

//Draws a 5x5 grid of enemy ships on the canvas
function createEnemies(ctx, canvas, enemyImg) {
    const START_X = (canvas.width - FORMATION_WIDTH) / 2; //Center the formation
    const STOP_X = START_X + FORMATION_WIDTH;

    //Outer loop moves left to right
    for (let x = START_X; x < STOP_X; x += ENEMY_SPACING) {
        //Inner loop moves top to bottom
        for (let y = 0; y < 50 * 5; y += 50) {
            ctx.drawImage(enemyImg, x, y);
        }
    }
}

//Main setup
async function initGame() {
    try {
        //Load both image assets before starting
        const heroImg = await loadAsset('assets/player.png');
        const enemyImg = await loadAsset('assets/enemyShip.png');

        //Get the canvas element and 2D
        const canvas = document.getElementById('myCanvas');
        const ctx = canvas.getContext('2d');

        //Create hero object at center bottom of canvas
        const hero = new Hero(
            canvas.width / 2 - 45,
            canvas.height - canvas.height / 4
        );

        //Set up event emitter for pub/sub communication
        const eventEmitter = new EventEmitter();

        //Movement messages and update hero position
        eventEmitter.on(Messages.HERO_MOVE_LEFT, () => {
            hero.moveTo(hero.x - 5, hero.y);
        });

        eventEmitter.on(Messages.HERO_MOVE_RIGHT, () => {
            hero.moveTo(hero.x + 5, hero.y);
        });

        eventEmitter.on(Messages.HERO_MOVE_UP, () => {
            hero.moveTo(hero.x, hero.y - 5);
        });

        eventEmitter.on(Messages.HERO_MOVE_DOWN, () => {
            hero.moveTo(hero.x, hero.y + 5);
        });

        //Keyboard input publishes messages to the event emitter
        window.addEventListener('keydown', (event) => {
            event.preventDefault(); //Stops browser from scrolling bar at bottom
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

        //Game loop (Clears and redraws the canvas every frame)
        function gameLoop() {
            //Clear screen and draw black background
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            //Draw hero at its current position
            ctx.drawImage(heroImg, hero.x, hero.y);

            //Draw the 5x5 enemy formation
            createEnemies(ctx, canvas, enemyImg);

            //Call gameLoop again on next frame
            requestAnimationFrame(gameLoop);
        }

        //Start the game loop
        gameLoop();

    } catch (error) {
        console.error('Failed to initialize game:', error);
    }
}

//Start the game when the script loads
initGame();