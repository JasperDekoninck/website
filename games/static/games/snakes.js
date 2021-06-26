function main() {
    var game = {
        SIZE_SQUARE: 30, 
        FPS: 6, 
        START_LENGTH: 3,

        canvas: document.getElementById("game-canvas"), 
        context: document.getElementById("game-canvas").getContext("2d"),

        width: 0, 
        height: 0, 
        apples: [],
        snake: [],
        score: 0,
        alive: true, 
        score_send: false, 
        prev_direction: [-1, 0],  // directions so you can easily press two buttons directly after each other 
        // without any issues
        direction: [-1, 0], 
        next_direction: [-1, 0], 
        next_next_direction: [-1, 0], 
        touchX: -1, 
        touchY: -1,
        time_last_update: performance.now(),
    }

    // get variant
    var href = window.location.href.split("/")
    if (href[href.length - 1] === "") {
        var variant = href[href.length - 2]
    } else {
        var variant = href[href.length - 1]
    }

    if (variant.includes("Fast")) {
        game.FPS = 12
    }

    game.canvas.width = Math.round(game.canvas.width / game.SIZE_SQUARE) * game.SIZE_SQUARE
    game.canvas.height = Math.round(game.canvas.height / game.SIZE_SQUARE) * game.SIZE_SQUARE

    game.width = Math.round(game.canvas.width / game.SIZE_SQUARE)
    game.height = Math.round(game.canvas.height / game.SIZE_SQUARE)

    document.addEventListener('keydown', function(e) {
        var code = e.key
        if (code === "ArrowUp") {
            e.preventDefault()
            moveUp(game)
        }
        else if (code === "ArrowDown") {
            e.preventDefault()
            moveDown(game)
        }
        else if (code === "ArrowLeft") {
            e.preventDefault()
            moveLeft(game)
        }
        else if (code === "ArrowRight") {
            e.preventDefault()
            moveRight(game)
        }
    })

    document.addEventListener("touchstart", function(e) {
        var touches = e.changedTouches[0]
        game.touchX = touches.pageX
        game.touchY = touches.pageY
    }, false)

    document.addEventListener("touchend", function(e) {
        var touches = e.changedTouches[0]
        var dx = touches.pageX - game.touchX
        var dy = touches.pageY - game.touchY
        if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 0) {
                moveRight(game)
            } else {
                moveLeft(game)
            }
        } else {
            if (dy > 0) {
                moveDown(game)
            } else {
                moveUp(game)
            }
        }
    })

    game.canvas.addEventListener("touchmove", function(e){
        e.preventDefault()
    }) 

    var start_row = Math.round(game.width / 2)
    var start_col = Math.round(game.height / 2)

    // initialize snake
    game.snake = new Array(game.START_LENGTH)
    for (var i=0; i < game.START_LENGTH; i++) {
        game.snake[i] = new Array(2).fill(0)
        game.snake[i] = [start_row + i, start_col]
    }
    addApple(game.width, game.height, game.snake, game.apples)
    draw(game.context, game.snake, game.apples, game)
    var start_time = performance.now()

    // set the game interval
    setInterval(function() {
        if (start_time + 3000 - performance.now() > 0) {
            document.getElementById("score-info").innerHTML = "Starting in: " + Math.round((start_time + 3000 - performance.now()) / 1000)
            game.time_last_update = performance.now()
        } else {
            document.getElementById("score-info").innerHTML = 'Score: <span id="score-live">0</span>'
            if (performance.now() - game.time_last_update > 1000 / game.FPS) {
                game.time_last_update += 1000 / game.FPS
                move(game.snake, game.apples, game.width, game.height, game)
            }
        }
        draw(game.context, game.snake, game.apples, game)
        if (!game.alive && !game.score_send) {
            game.score_send = true
            end_game(game.score)
        }
    }, 1000 / 60)
}

function moveUp(game) {
    if (game.direction[0] === game.next_direction[0] && game.direction[1] === game.next_direction[1] && 
        game.direction[1] !== 1) {
        game.next_direction = [0, -1]
        game.next_next_direction = [0, -1]
    } else if (game.next_direction[1] !== 1) {
        game.next_next_direction = [0, -1]
    }
}

function moveDown(game) {
    if (game.direction[0] === game.next_direction[0] && game.direction[1] === game.next_direction[1] && 
        game.direction[1] !== -1) {
        game.next_direction = [0, 1]
        game.next_next_direction = [0, 1]
    } else if (game.next_direction[1] !== -1) {
        game.next_next_direction = [0, 1]
    }
}

function moveLeft(game) {
    if (game.direction[0] === game.next_direction[0] && game.direction[1] === game.next_direction[1] && 
        game.direction[0] !== 1) {
        game.next_direction = [-1, 0]
        game.next_next_direction = [-1, 0]
    } else if (game.next_direction[0] !== 1) {
        game.next_next_direction = [-1, 0]
    }
}

function moveRight(game) {
    if (game.direction[0] === game.next_direction[0] && game.direction[1] === game.next_direction[1] && 
        game.direction[0] !== -1) {
        game.next_direction = [1, 0]
        game.next_next_direction = [1, 0]
    } else if (game.next_direction[0] !== -1) {
        game.next_next_direction = [1, 0]
    }
}

function addApple(width, height, snake, apples) {
    var col = Math.floor(Math.random() * height)
    var row = Math.floor(Math.random() * width)
    while (positionInList([row, col], snake) || positionInList([row, col], apples)) {
        var col = Math.floor(Math.random() * height)
        var row = Math.floor(Math.random() * width)
    }
    apples.push([row, col])
}

function positionInList (position, list) {
    for (const pos of list) {
        if (pos[0] == position[0] && pos[1] == position[1]) {
            return true
        }
    }
    return false;
}

function move (snake, apples, width, height, game) {
    if (!game.alive) {
        return
    }
    var next_snake_head = [snake[0][0] + game.next_direction[0], snake[0][1] + game.next_direction[1]]
    game.prev_direction = game.direction.slice()
    game.direction = game.next_direction.slice()
    game.next_direction = game.next_next_direction.slice()

    if (positionInList(next_snake_head, snake)  || next_snake_head[0] < 0 || next_snake_head[1] < 0 || 
        next_snake_head[0] >= width || next_snake_head[1] >= height) {
        game.alive = false
        game.direction = game.prev_direction.slice()
        return 
    }
    
    var apple_to_eat = -1
    for (var i = 0; i < apples.length; i++) {
        var apple = apples[i]
        if (apple[0] === next_snake_head[0] && apple[1] == next_snake_head[1]) {
            apple_to_eat = i
            break
        }
    }
    if (apple_to_eat > -1) {
        game.score += 100
        apples.splice(apple_to_eat, 1)
        snake.splice(0, 0, next_snake_head);
        addApple(width, height, snake, apples)
    } else {
        snake.splice(0, 0, next_snake_head)
        snake.splice(snake.length - 1, 1)
    }
}

function draw (context, snake, apples, game) {
    if (document.getElementById("score-live")) {
        document.getElementById("score-live").innerHTML = game.score
    }

    context.clearRect(0, 0, game.canvas.width, game.canvas.height);
    for (const apple of apples) {
        context.drawImage(document.getElementById("apple"), apple[0] * game.SIZE_SQUARE, apple[1] * game.SIZE_SQUARE, 
        game.SIZE_SQUARE, game.SIZE_SQUARE)
    }

    for (var i=0; i < snake.length; i++) {
        draw_snake_part(snake, i, game)
    }
}

function draw_snake_part(snake, i, game) {
    // complicated function as rotations and stuff is necessary
    var image;
    var rotation;
    var next_snake_head = [snake[0][0] + game.next_direction[0], snake[0][1] + game.next_direction[1]]
    if (i === 0) {
        image = document.getElementById("snake-head")
        if (!game.alive) {
            image = document.getElementById("snake-head-dead")
        } else if (positionInList(next_snake_head, game.apples)) {
            image = document.getElementById("snake-head-tongue")            
        }


        if (game.direction[0] === 0 && game.direction[1] === 1) {
            rotation = Math.PI / 2 
        } else if (game.direction[0] === 0 && game.direction[1] === -1) {
            rotation = 3 * Math.PI / 2
        } else if (game.direction[0] === -1 && game.direction[1] === 0) {
            rotation = Math.PI
        } else {
            rotation = 0
        }
    } else if (i === snake.length - 1) {
        image = document.getElementById("snake-end")
        var direction = [
            snake[i][0] - snake[i - 1][0], 
            snake[i][1] - snake[i - 1][1]
        ]
        if (direction[0] === 0 && direction[1] === 1) {
            rotation = Math.PI / 2 
        } else if (direction[0] === 0 && direction[1] === -1) {
            rotation = 3 * Math.PI / 2
        } else if (direction[0] === -1 && direction[1] === 0) {
            rotation = Math.PI
        } else {
            rotation = 0
        }
    } else {
        var direction = [
            snake[i - 1][0] - snake[i + 1][0], 
            snake[i - 1][1] - snake[i + 1][1]
        ]
        if (direction[0] === 0) {
            image = document.getElementById("snake-body")
            rotation = Math.PI / 2
        } else if (direction[1] === 0) {
            image = document.getElementById("snake-body")
            rotation = 0
        } else {
            image = document.getElementById("snake-body-twisted")
            if (direction[0] + direction[1] === 0) {
                if (snake[i][0] - snake[i - 1][0] === 1 || snake[i][0] - snake[i + 1][0] === 1) {
                    rotation = Math.PI / 2
                } else {
                    rotation = 3 * Math.PI / 2
                } 

            } else if (snake[i][0] - snake[i - 1][0] === -1 || snake[i][0] - snake[i + 1][0] === -1) {
                rotation = Math.PI
            }
        }
    }

    drawRotatedImage(game.context, image, snake[i][0] * game.SIZE_SQUARE, snake[i][1] * game.SIZE_SQUARE, rotation, game)
}

function drawRotatedImage(context, image, x, y, angle, game) { 
	context.save(); 
	context.translate(x + game.SIZE_SQUARE / 2, y + game.SIZE_SQUARE / 2);
	context.rotate(angle);
	context.drawImage(image, - game.SIZE_SQUARE / 2, -game.SIZE_SQUARE / 2, game.SIZE_SQUARE, game.SIZE_SQUARE)
 	context.restore(); 
}

$('#images-snakes').imagesLoaded( function() {
    main()
});
