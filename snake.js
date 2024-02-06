class vec2d {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
};
class keystate {
    constructor() {
        this.pressed = false;
        this.held = false;
        this.released = false;
        this.async_state = false;
    }
};
function ab_contains_c(a, b, c) {
    return c.x >= a.x && c.y >= a.y && c.x < b.x && c.y < b.y;
}
let keys = {
    right: new keystate(),
    left: new keystate()
};
const DIRECTIONS = {
    RIGHT: 0,
    DOWN: 1,
    LEFT: 2,
    UP: 3
};

const canvas = document.getElementById("canvas1");
const ctx = canvas.getContext("2d");
console.log(ctx);

canvas.width = 500;
canvas.height = 500;

const pf_size = new vec2d(10, 10);
const cell_size = canvas.width / pf_size.x;

let score = 0;
let best = 0;

let snake_body = [];
let dir = DIRECTIONS.RIGHT;
let next_dir = dir;
function speed() {
    return 6.7 * Math.log10(0.1 * score + 1.3) + 1;
}
let timer = 0;

let fruit = new vec2d(0, 0);

function is_snake_body(pos, include_head = true) {
    for (let i = (include_head ? 0 : 1); i < snake_body.length; i++) {
        if (pos.x == snake_body[i].x && pos.y == snake_body[i].y) {
            return true;
        }
    }
    return false;
}

function respawnFruit() {
    do {
        let pick = Math.trunc(Math.random() * pf_size.x * pf_size.y);

        fruit.x = pick % pf_size.x;
        fruit.y = Math.trunc(pick / pf_size.x);
    } while (is_snake_body(fruit));
}

function resetGame() {
    snake_body = [];
    let origin = new vec2d(0, 0);
    origin.x = Math.trunc(pf_size.x / 2);
    origin.y = Math.trunc(pf_size.y / 2);
    for (let i = 0; i < 3; i++) {
        snake_body[i] = new vec2d(origin.x - i, origin.y);
    }
    next_dir = dir = DIRECTIONS.RIGHT;

    timer = 0;

    if (score > best) {
        best = score;
        document.getElementById("best").innerHTML = best;
    }
    score = 0;
    document.getElementById("score").innerHTML = score;

    respawnFruit();
}

let animationFrameId;
let tp0 = 0;
function gameLoop(tp1) {
    if (tp0 == 0) {
        tp0 = tp1;
    }
    let elapsedTime = (tp1 - tp0) / 1000; //seconds
    tp0 = tp1;

    //input
    for (let k in keys) {
        if (keys[k].async_state) {
            keys[k].pressed = !keys[k].held;
            keys[k].held = true;
        }
        else if (keys[k].held) {
            keys[k].pressed = false;
            keys[k].held = false;
            keys[k].released = true;
        }
        else {
            keys[k].released = false;
        }
    }

    //logic
    if (keys.right.pressed) {
        next_dir = (dir + 1) % 4;
    }
    if (keys.left.pressed) {
        next_dir = (dir + 3) % 4;
    }

    timer += elapsedTime;
    if (timer > 1 / speed()) {
        timer -= 1 / speed();
        dir = next_dir;
        let new_pos = new vec2d(snake_body[0].x, snake_body[0].y);
        switch (dir) {
            case DIRECTIONS.RIGHT:
                new_pos.x++;
                break;
            case DIRECTIONS.DOWN:
                new_pos.y++;
                break;
            case DIRECTIONS.LEFT:
                new_pos.x--;
                break;
            case DIRECTIONS.UP:
                new_pos.y--;
                break;
        }
        //check for head collision with walls
        let dead = !ab_contains_c(new vec2d(0, 0), pf_size, new_pos);

        //check for head collision with body and update snake body if not dead
        if (!dead) {
            let fruitEaten = (new_pos.x == fruit.x && new_pos.y == fruit.y);
            if (fruitEaten) {                
                //grow tail
                snake_body[snake_body.length] = new vec2d(0, 0);
                snake_body[snake_body.length - 1].x = snake_body[snake_body.length - 2].x;
                snake_body[snake_body.length - 1].y = snake_body[snake_body.length - 2].y;
            }
            //update snake body
            for (let i = snake_body.length - 1; i > 0; i--) {
                snake_body[i] = snake_body[i - 1];
            }
            snake_body[0] = new_pos;
            
            //increase score and respawn fruit
            if (fruitEaten) {
                score++;
                document.getElementById("score").innerHTML = score;
                respawnFruit();
            }
            //only check for collision with the tail if the fruit hasn't been eaten
            //because a fruit will never overlap the tail
            else {
                //check for collision with the tail
                dead = is_snake_body(new_pos, false);
            }
        }

        if (dead) {
            document.getElementById("game_over").style.visibility = "visible";
            pauseGame();
            return;
        }
    }

    //draw
    //clear canvas
    ctx.fillStyle = "rgb(100, 58, 28)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    //draw snake tail
    ctx.fillStyle = "rgb(116, 201, 22)";
    for (let i = 1; i < snake_body.length; i++) {
        ctx.fillRect(
            snake_body[i].x * cell_size + 1,
            snake_body[i].y * cell_size + 1,
            cell_size - 2, cell_size - 2
        );
    }
    //draw snake head
    ctx.fillStyle = "rgb(255, 242, 0)";
    ctx.fillRect(
        snake_body[0].x * cell_size + 1,
        snake_body[0].y * cell_size + 1,
        cell_size - 2, cell_size - 2
    );

    //draw fruit
    ctx.fillStyle = "red";
    ctx.fillRect(
        fruit.x * cell_size + 1,
        fruit.y * cell_size + 1,
        cell_size - 2, cell_size - 2
    );

    animationFrameId = requestAnimationFrame(gameLoop);
}

function resumeGame() {
    gameLoop(0);
}
function startGame() {
    resetGame();
    gameLoop(0);
}
function pauseGame() {
    tp0 = 0;
    cancelAnimationFrame(animationFrameId);
}

//execution
document.addEventListener("keydown",
    event => {
        if (event.key == "ArrowLeft") {
            keys.left.async_state = true;
        }
        else if (event.key == "ArrowRight") {
            keys.right.async_state = true;
        }
        else if (event.key == "p") {
            pauseGame();
            document.getElementById("pause").style.visibility = "visible";
        }
    }
);
document.addEventListener("keyup",
    event => {
        if (event.key == "ArrowLeft") {
            keys.left.async_state = false;
        }
        else if (event.key == "ArrowRight") {
            keys.right.async_state = false;
        }
    }
);