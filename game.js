//Inheritance (Part 1)
//Every game object has a position and type
//Dead flag, width, height, img, and draw() method (Part 3)
//rectFromGameObject() for collision detection (Part 4)
class GameObject {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.dead = false;   //Tracks if object should be removed
        this.type = "";
        this.width = 0;
        this.height = 0;
        this.img = undefined;
    }

    //Every game object can draw itself to the canvas
    draw(ctx) {
        ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
    }

    //Returns rectangle boundaries for collision detection
    rectFromGameObject() {
        return {
            top: this.y,
            left: this.x,
            bottom: this.y + this.height,
            right: this.x + this.width,
        };
    }
}

//GameObject that the player controls (Hero)
//Cooldown system and fire() method (Part 4)
//Life and points tracking (Part 5)
class Hero extends GameObject {
    constructor(x, y) {
        super(x, y);
        this.width = 99;
        this.height = 75;
        this.type = "Hero";
        this.speed = { x: 0, y: 0 };
        this.cooldown = 0; //0 means ready to fire
        this.life = 3;     //Hero starts with 3 lives
        this.points = 0;   //Hero starts with 0 points
    }

    //Creates a laser and starts cooldown timer
    fire() {
        gameObjects.push(new Laser(this.x + 45, this.y - 10));
        this.cooldown = 500; //Set cooldown to 500ms

        //Count down cooldown every 200ms
        let id = setInterval(() => {
            if (this.cooldown > 0) {
                this.cooldown -= 100;
            } else {
                clearInterval(id);
            }
        }, 200);
    }

    //Returns true if hero is allowed to fire
    canFire() {
        return this.cooldown === 0;
    }

    //Reduce life by 1, mark as dead if no lives left
    decrementLife() {
        this.life--;
        if (this.life === 0) {
            this.dead = true;
        }
    }

    //Add 100 points for each enemy destroyed
    incrementPoints() {
        this.points += 100;
    }
}

//GameObject that automatically moves down the screen (Enemy)
class Enemy extends GameObject {
    constructor(x, y) {
        super(x, y);
        this.width = 98;
        this.height = 50;
        this.type = "Enemy";

        //Moves enemy down and stops when it reaches the bottom of the canvas
        const id = setInterval(() => {
            if (this.y < canvas.height - this.height) {
                this.y += 5; //Move down by 5 pixels
            } else {
                console.log('Stopped at', this.y);
                clearInterval(id); //Stop moving at bottom
            }
        }, 300);
    }
}

//Laser moves upward and destroys itself at top of screen (Part 4)
class Laser extends GameObject {
    constructor(x, y) {
        super(x, y);
        this.width = 9;
        this.height = 33;
        this.type = 'Laser';
        this.img = laserImg;

        //Move laser up every 100ms
        //Mark as dead when it reaches the top of the screen
        let id = setInterval(() => {
            if (this.y > 0) {
                this.y -= 15; //Move up
            } else {
                this.dead = true; //Remove when off screen
                clearInterval(id);
            }
        }, 100);
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

//Messages and global vars
//Updates messages to use KEY_EVENT naming (Part 3)
//Space key, laser-enemy collision, hero-enemy collision (Part 4)
const Messages = {
    KEY_EVENT_UP: "KEY_EVENT_UP",
    KEY_EVENT_DOWN: "KEY_EVENT_DOWN",
    KEY_EVENT_LEFT: "KEY_EVENT_LEFT",
    KEY_EVENT_RIGHT: "KEY_EVENT_RIGHT",
    KEY_EVENT_SPACE: "KEY_EVENT_SPACE",
    COLLISION_ENEMY_LASER: "COLLISION_ENEMY_LASER",
    COLLISION_ENEMY_HERO: "COLLISION_ENEMY_HERO",
};

//Global variables (accessible throughout the game)
//lifeImg (Part 5)
let heroImg,
    enemyImg,
    laserImg,
    lifeImg,
    canvas, ctx,
    gameObjects = [], //Stores all active game objects
    hero,
    eventEmitter = new EventEmitter();

//Image loading (Part 2)
//Loads an image from a path and returns a Promise
function loadTexture(path) {
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

//Keyboard input (Part 3)
//Prevent default browser behaviour for arrow keys and spacebar
const onKeyDown = function (e) {
    console.log(e.keyCode);
    switch (e.keyCode) {
        case 37: //Arrow left
        case 39: //Arrow right
        case 38: //Arrow up
        case 40: //Arrow down
        case 32: //Spacebar
            e.preventDefault();
            break;
        default:
            break;
    }
};

window.addEventListener("keydown", onKeyDown);

//Pub/sub keyboard events
//Detects key releases and emits the corresponding message
window.addEventListener("keyup", (evt) => {
    if (evt.key === "ArrowUp") {
        eventEmitter.emit(Messages.KEY_EVENT_UP);
    } else if (evt.key === "ArrowDown") {
        eventEmitter.emit(Messages.KEY_EVENT_DOWN);
    } else if (evt.key === "ArrowLeft") {
        eventEmitter.emit(Messages.KEY_EVENT_LEFT);
    } else if (evt.key === "ArrowRight") {
        eventEmitter.emit(Messages.KEY_EVENT_RIGHT);
    } else if (evt.keyCode === 32) {
        //Spacebar fires laser
        eventEmitter.emit(Messages.KEY_EVENT_SPACE);
    }
});

//Collision detection (Part 4)
//Checks if two rectangles are overlapping
function intersectRect(r1, r2) {
    return !(
        r2.left > r1.right ||
        r2.right < r1.left ||
        r2.top > r1.bottom ||
        r2.bottom < r1.top
    );
}

//Updates all game objects and checks for collisions
function updateGameObjects() {
    const enemies = gameObjects.filter(go => go.type === 'Enemy');
    const lasers = gameObjects.filter(go => go.type === 'Laser');

    //Check every laser against every enemy for collision
    lasers.forEach((laser) => {
        enemies.forEach((enemy) => {
            if (intersectRect(laser.rectFromGameObject(), enemy.rectFromGameObject())) {
                //Emit collision event with both objects
                eventEmitter.emit(Messages.COLLISION_ENEMY_LASER, {
                    first: laser,
                    second: enemy,
                });
            }
        });
    });

    //Check if any enemy collides with the hero (Part 5)
    enemies.forEach(enemy => {
        const heroRect = hero.rectFromGameObject();
        if (intersectRect(heroRect, enemy.rectFromGameObject())) {
            eventEmitter.emit(Messages.COLLISION_ENEMY_HERO, { enemy });
        }
    });

    //Remove all objects marked as dead
    gameObjects = gameObjects.filter(go => !go.dead);
}

//Draw life icons in bottom right corner (Part 5)
function drawLife() {
    const START_POS = canvas.width - 180;
    for (let i = 0; i < hero.life; i++) {
        ctx.drawImage(
            lifeImg,
            START_POS + (45 * (i + 1)),
            canvas.height - 37
        );
    }
}

//Draw points in bottom left corner (Part 5)
function drawPoints() {
    ctx.font = "30px Arial";
    ctx.fillStyle = "red";
    ctx.textAlign = "left";
    drawText("Points: " + hero.points, 10, canvas.height - 20);
}

//Helper function to draw text on the canvas
function drawText(message, x, y) {
    ctx.fillText(message, x, y);
}

//Game object creation (Part 3)
//Creates 5x5 enemy formation and adds them to gameObjects array
function createEnemies() {
    const MONSTER_TOTAL = 5;
    const MONSTER_WIDTH = MONSTER_TOTAL * 98;
    const START_X = (canvas.width - MONSTER_WIDTH) / 2; //Center formation
    const STOP_X = START_X + MONSTER_WIDTH;

    //Outer loop moves left to right
    for (let x = START_X; x < STOP_X; x += 98) {
        //Inner loop moves top to bottom
        for (let y = 0; y < 50 * 5; y += 50) {
            const enemy = new Enemy(x, y);
            enemy.img = enemyImg;
            gameObjects.push(enemy); //Add to game objects array
        }
    }
}

//Creates the hero and adds it to gameObjects array
function createHero() {
    hero = new Hero(
        canvas.width / 2 - 45,  //Center horizontally
        canvas.height - canvas.height / 4  //Near bottom
    );
    hero.img = heroImg;
    gameObjects.push(hero); //Add to game objects array
}

//Draws all active game objects to the canvas
function drawGameObjects(ctx) {
    gameObjects.forEach(go => go.draw(ctx));
}

//Init game (Part 3 & 4)
function initGame() {
    gameObjects = []; //Reset game objects array
    createEnemies();  //Create and position all enemies
    createHero();     //Create and position the hero

    //Key events and move hero accordingly
    eventEmitter.on(Messages.KEY_EVENT_UP, () => {
        hero.y -= 5; //Move up (decrease y)
    });

    eventEmitter.on(Messages.KEY_EVENT_DOWN, () => {
        hero.y += 5; //Move down (increase y)
    });

    eventEmitter.on(Messages.KEY_EVENT_LEFT, () => {
        hero.x -= 5; //Move left (decrease x)
    });

    eventEmitter.on(Messages.KEY_EVENT_RIGHT, () => {
        hero.x += 5; //Move right (increase x)
    });

    //Spacebar fires laser if cooldown allows
    eventEmitter.on(Messages.KEY_EVENT_SPACE, () => {
        if (hero.canFire()) {
            hero.fire();
        }
    });

    //When laser hits enemy, mark both as dead and add points
    eventEmitter.on(Messages.COLLISION_ENEMY_LASER, (_, { first, second }) => {
        first.dead = true;
        second.dead = true;
        hero.incrementPoints(); //Add 100 points
    });

    //When enemy hits hero, enemy dies and hero loses a life
    eventEmitter.on(Messages.COLLISION_ENEMY_HERO, (_, { enemy }) => {
        enemy.dead = true;
        hero.decrementLife(); //Lose a life
    });
}

//Game loop (Part 3, 4 & 5)
//Wait for page to fully load before starting
window.onload = async () => {
    //Get canvas element and 2D 
    canvas = document.getElementById("myCanvas");
    ctx = canvas.getContext("2d");

    //Load all image assets before starting game
    heroImg = await loadTexture("assets/player.png");
    enemyImg = await loadTexture("assets/enemyShip.png");
    laserImg = await loadTexture("assets/laserRed.png");
    lifeImg = await loadTexture("assets/life.png"); //Part 5

    //Initialize game objects and event listeners
    initGame();

    //Game loop runs every 100ms
    //Clears canvas, updates collisions, redraws everything
    const gameLoopId = setInterval(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height); //Clear old frame
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);  //Draw background
        updateGameObjects(); //Check collisions and remove dead objects
        drawGameObjects(ctx); //Draw all living objects
        drawPoints();  //Show score bottom left
        drawLife();    //Show lives bottom right
    }, 100);
};
