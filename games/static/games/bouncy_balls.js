
function main() {
    // in the url of the game, we can find the current variant
    var href = window.location.href.split("/")
    if (href[href.length - 1] === "") {
        var variant = href[href.length - 2]
    } else {
        var variant = href[href.length - 1]
    }
    const FPS = 120
    const PLAYER_COLOR = "#2b13af"
    // All constants and elements of the game
    var game = {
        variant: variant,
        canvas: document.getElementById("game-canvas"), 
        context: document.getElementById("game-canvas").getContext("2d"), 
        FPS: FPS, 
        PLAYER_MOUSE_SPEED_FACTOR: 1 / 2000, // the higher this number, the faster 
                                             // the player goes with greater mouse distance
        player: new Player(document.getElementById("game-canvas").width / 2, document.getElementById("game-canvas").height / 2, 
                            20, 120, 800, PLAYER_COLOR), 
        mouse_pos: {x: 0, y: 0}, 
        RECT_WIDTHS: [[30, 30], [22, 40], [40, 22]], // possibilities for the obstacles
        RECT_START_SPEED: 100,
        start_time: performance.now(), 
        start: false, // wait 3 seconds before start of game
        end_score: -1,
        N_START_ENEMIES: 3,
        SPEED_BOOST: 1.05, // each speed boost, boosts the speed by this amount
        SIZE_BOOST: 1.08,  // each size boost, boosts the size by this amount
        REVERSE_PROBABILITY: 0.25, // the probability that something does a reverse per second (approx)
        HOME_IN_PROBABILITY: 0.20, // the probability that something does a home-in per second (approx)
        enemy_start_radius: 15,
        enemy_start_speed: 500,
        ENEMY_MAX_SPEED: 800,
        BOOST_TIME: 5, // every BOOST_TIME seconds, something is added to the game
        n_boosts_added: 0,
        ADD_ENEMY_CHANGE: 4, // every ADD_ENEMY_CHANGE boosts, instead of a boost an enemy is added
        POWERUPS: [function (enemies, rects) {return size_boost(enemies, rects, game)}, 
            function (enemies, rects) {return speed_boost(enemies, rects, game)}], 
        enemies: [],
        rects: [],
        INACTIVE_ENEMY_COLOR: "#d33c3c",
        ACTIVE_ENEMY_COLOR: "#ce1717",
        HOMEIN_ENEMY_COLOR: "#cf7601",
        REVERSE_ENEMY_COLOR: "#cf7601",
        PLAYER_COLOR: PLAYER_COLOR, 
        time_last_update: performance.now(),
    }

    if (variant !== "Classic") {
        game.POWERUPS.push(function (enemies, rects) {return reverse_boost(enemies, game)})
        game.POWERUPS.push(function (enemies, rects) {return add_rect(enemies, rects, game)})
        game.POWERUPS.push(function (enemies, rects) {return home_in_boost(enemies, game)})

        game.SPEED_BOOST = 1.07
        game.SIZE_BOOST = 1.1
    } 

    for(var i = 0; i < game.N_START_ENEMIES; i++){
        add_enemy(game.enemies, game.player, game.canvas, game.enemy_start_radius, game.enemy_start_speed,
                  game.ENEMY_MAX_SPEED, game)
    }

    window.addEventListener('mousemove', e => {
            game.mouse_pos = getMousePos(game.canvas, e)
      });

    window.addEventListener("touchmove", e => {
        game.mouse_pos = getMousePos(game.canvas, e.changedTouches[0])
    })

    setInterval(function () {
        game_loop(game)
    }, 1000 / FPS)
}

function getMousePos(canvas, event) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: (event.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
        y: (event.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
    };
}

class Circle {
    // base class for the player and the enemy
    constructor(x, y, radius, color) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
    }

    draw (context) {
        context.beginPath();
        context.fillStyle = this.color;
        context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        context.fill();
    } 

    checkCollide (other_circle) {
        return (this.x - other_circle.x) ** 2 + (this.y - other_circle.y) ** 2 <= (this.radius + other_circle.radius) ** 2
    }

    checkCollideSide (canvas) {
        var collides = []
        if (this.x <= this.radius) {
            collides.push("left")
        } else if (this.x >= canvas.width - this.radius) {
            collides.push("right")
        } 

        if (this.y <= this.radius) {
            collides.push("top")
        } else if (this.y >= canvas.height - this.radius) {
            collides.push("bottom")
        }
        return collides
    }
}


class Enemy extends Circle {
    // a class for the enemy
    constructor(x, y, radius, speed_x, speed_y, max_speed, color) {
        super(x, y, radius, color)
        this.speed_x = speed_x
        this.speed_y = speed_y
        this.mass = 1
        this.max_speed = max_speed
        this.reverse_probability = 0
        this.home_in_probability = 0
        this.create_time = performance.now()
        this.active = false // the first few seconds, the ball can't interact
    }

    collideEnemy (enemy) {
        // colliding with other circular enemy -> physics of billiart collissions
        let speed = (this.speed_x ** 2 + this.speed_y ** 2) ** 0.5
        let speed_enemy = (enemy.speed_x ** 2 + enemy.speed_y ** 2) ** 0.5

        var overlap = (this.radius + enemy.radius) - distance(this.x, this.y, enemy.x, enemy.y)
        var normalized_speed = {x: -this.speed_x / speed, y: -this.speed_y / speed}
        this.x += normalized_speed.x * (overlap + 1)
        this.y += normalized_speed.y * (overlap + 1)

        let phi = Math.atan2(this.y - enemy.y, this.x - enemy.x)
        let theta1 = Math.atan2(this.speed_y, this.speed_x)
        let theta2 = Math.atan2(enemy.speed_y, enemy.speed_x)

        let factor1 = speed * Math.cos(theta1 - phi) * (this.mass - enemy.mass) + 2 * enemy.mass * speed_enemy * 
                                                                                    Math.cos(theta2 - phi)
        let factor2 = speed * Math.sin(theta1 - phi)

        this.speed_x = factor1 / (this.mass + enemy.mass) * Math.cos(phi) + factor2 * Math.cos(phi + Math.PI / 2)
        this.speed_y = factor1 / (this.mass + enemy.mass) * Math.sin(phi) + factor2 * Math.sin(phi + Math.PI / 2)

        factor1 = speed_enemy * Math.cos(theta2 - phi) * (enemy.mass - this.mass) + 2 * this.mass * speed * 
                                                                                    Math.cos(theta1 - phi)
        factor2 = speed_enemy * Math.sin(theta2 - phi)

        enemy.speed_x = factor1 / (this.mass + enemy.mass) * Math.cos(phi) + factor2 * Math.cos(phi + Math.PI / 2)
        enemy.speed_y = factor1 / (this.mass + enemy.mass) * Math.sin(phi) + factor2 * Math.sin(phi + Math.PI / 2)

        speed = (this.speed_x ** 2 + this.speed_y ** 2) ** 0.5
        speed_enemy = (enemy.speed_x ** 2 + enemy.speed_y ** 2) ** 0.5

        if (speed > this.max_speed) {
            this.speed_x *= this.max_speed / speed
            this.speed_y *= this.max_speed / speed
        }

        if (speed_enemy > enemy.max_speed) {
            enemy.speed_x *= enemy.max_speed / speed_enemy
            enemy.speed_y *= enemy.max_speed / speed_enemy
        }

    }

    set_reverse (new_reverse_probability, color) {
        // reverse ability
        this.reverse_probability += new_reverse_probability
        if (new_reverse_probability > 0) {
            this.color = color
        }
    }

    set_home_in (new_home_in_probability, color) {
        // home in ability
        this.home_in_probability += new_home_in_probability
        if (new_home_in_probability > 0) {
            this.color = color
        }
    }

    update_pos (enemies, player, canvas, game, time) {
        // updates the position of the ball
        this.x += this.speed_x * time
        this.y += this.speed_y * time
        var collide_sides = this.checkCollideSide(canvas)

        // collide the side of the board
        if (collide_sides.includes("left")) {
            this.x = this.radius
            this.speed_x *= -1
        } else if (collide_sides.includes("right")) {
            this.x = canvas.width - this.radius
            this.speed_x *= -1
        }
        if (collide_sides.includes("top")) {
            this.y = this.radius
            this.speed_y *= -1
        } else if (collide_sides.includes("bottom")) {
            this.y = canvas.height - this.radius
            this.speed_y *= -1
        }

        // collide other enemies
        if (this.active) {
            for (const enemy of enemies) {
                if (enemy !== this && this.checkCollide(enemy)) {
                    this.collideEnemy(enemy)
                }
            }
        }
        
        // player collision
        if (this.checkCollide(player) && this.active) {
            player.alive = false
        }

        if ((performance.now() - this.create_time) > 1000 && !this.active) {
            this.active = true
            if (this.color === game.INACTIVE_ENEMY_COLOR) {
                this.color = game.ACTIVE_ENEMY_COLOR
            }
        }

        // reverse ability
        if (Math.random() < this.reverse_probability * time) {
            this.speed_x *= -1
            this.speed_y *= -1
        }

        // go in the direction of the player
        if (Math.random() < this.home_in_probability * time) {
            var current_speed = (this.speed_x ** 2 + this.speed_y ** 2) ** 0.5
            var direction = {x: player.x - this.x, y: player.y - this.y}
            var dir_size = (direction.x ** 2 + direction.y ** 2) ** 0.5
            var dir_normalized = {x: direction.x / dir_size, y: direction.y / dir_size}
            this.speed_x = dir_normalized.x * current_speed
            this.speed_y = dir_normalized.y * current_speed
        }
    }
}

class Player extends Circle {
    // class for the player
    constructor(x, y, radius, speed, max_speed, color) {
        super(x, y, radius, color)
        this.speed = speed
        this.max_speed = max_speed
        this.alive = true
    }

    update_pos (mouse_pos, canvas, game, time) {
        if (!this.alive) {
            return
        }
        // direction is determined by current mouse position
        var direction = {x: mouse_pos.x - this.x, y: mouse_pos.y - this.y}
        var direction_speed = (direction.x ** 2 + direction.y ** 2) ** 0.5
        var direction_uni = {x: direction.x / direction_speed, y: direction.y / direction_speed}
        // updates position based on the direction and speeds up if mouse further away
        var update = {x: this.speed * (direction_uni.x + direction.x  * direction_speed * 
                                                    game.PLAYER_MOUSE_SPEED_FACTOR) * 1 * time, 
                      y: this.speed * (direction_uni.y + direction.y  * direction_speed * 
                                                    game.PLAYER_MOUSE_SPEED_FACTOR) * 1 * time}
        
        // player speed has maximum
        if (Math.abs(update.x) > this.max_speed * time) {
            update.y = update.y / Math.abs(update.x) * this.max_speed * time
            update.x = update.x / Math.abs(update.x) * this.max_speed * time
            
        }
        if (Math.abs(update.y) > this.max_speed * time) {
            update.x = update.x / Math.abs(update.y) * this.max_speed * time
            update.y = update.y / Math.abs(update.y) * this.max_speed * time
        }

        // if collides with canvas -> death
        var collide_sides = this.checkCollideSide(canvas)
        if (collide_sides.length !== 0) {
            this.alive = false
        }

        // only update position if there is some movements 
        // (make sure that ball is still when not very far away from center)
        if (direction_speed > 10 && this.alive) {
            this.x += update.x
            this.y += update.y
        }
    }
}


class RectEnemy {
    // rect enemy is the obstacle
    constructor(x, y, width, height,  speed_x, speed_y, color) {
        this.x = x
        this.y = y
        this.width = width
        this.height = height
        this.color = color
        this.speed_x = speed_x
        this.speed_y = speed_y
        this.create_time = performance.now()
        this.active = false
    }

    draw (context) {
        context.fillStyle = this.color;
        context.beginPath();
        context.rect(this.x, this.y, this.width, this.height);
        context.fill();
    }

    checkCollide (circle) {
        var distX = circle.x - this.x - this.width / 2
        var distY = circle.y - this.y - this.height / 2

        if (Math.abs(distX) > this.width / 2 + circle.radius) {
             return ""
        }
        if (Math.abs(distY) > this.height / 2 + circle.radius) {
             return ""
        }

        if (Math.abs(distX) <= this.width / 2) { 
            if (distY > 0) {
                return "bottom"
            } else {
                return "top"
            }
        } 

        if (Math.abs(distY) <= this.height / 2) { 
            if (distX > 0) {
                return "right"
            } else {
                return "left"
            }
        }

        // also test for corner collisions
        var dx = Math.abs(distX) - this.width / 2
        var dy = Math.abs(distY) - this.height / 2
        if (dx ** 2 + dy ** 2 <= circle.radius ** 2) {
            if (distX > 0) {
                return "right"
            } else {
                return "left"
            }
        }

        return ""
    }

    checkCollideSide (canvas) {
        var sides = []
        if (this.x <= 0) {
            sides.push("left")
        } else if (this.y <= 0) {
            sides.push("top")
        } else if (this.x + this.width >= canvas.width) {
            sides.push("right")
        } else if (this.y + this.height >= canvas.height) {
            sides.push("bottom")
        }
        return sides
    } 

    checkCollideRect (rect) {
        if(this.x < rect.x && this.x + this.width > rect.x && this.y < rect.y + rect.height 
            && this.y + this.height > rect.y){
            var overlap_width = this.x + this.width - rect.x
            var overlap_height = this.y + this.height - rect.y
            if (overlap_width > overlap_height) {
                return "bottom"
            } else {
                return "right"
            } 
        } else if (rect.x < this.x && rect.x + rect.width > this.x && rect.y < this.y + this.height 
            && rect.y + rect.height > this.y) {
                var overlap_width = rect.x + rect.width - this.x
                var overlap_height = rect.y + rect.height - this.y
                if (overlap_width > overlap_height) {
                    return "top"
                } else {
                    return "left"
                } 
            }
    return ""
    }

    update_pos (enemies, rect_enemies, player, canvas, game, time) {
        this.x += this.speed_x * time
        this.y += this.speed_y * time
        
        var collide_sides = this.checkCollideSide(canvas)
        if (collide_sides.includes("left")) {
            this.x = 0
            this.speed_x *= -1
        } else if (collide_sides.includes("right")) {
            this.x = canvas.width - this.width
            this.speed_x *= -1
        }
        if (collide_sides.includes("top")) {
            this.y = 0
            this.speed_y *= -1
        } else if (collide_sides.includes("bottom")) {
            this.y = canvas.height - this.height
            this.speed_y *= -1
        }

        for (const rect of rect_enemies) {
            if (rect !== this) {
                var collision;
                var collision2;
                collision = this.checkCollideRect(rect)
                collision2 = rect.checkCollideRect(this)

                var total_speed = Math.abs(this.speed_x + this.speed_y)
                var total_speed_enemy = Math.abs(rect.speed_x + rect.speed_y)
                if (collision === "left") {
                    this.speed_x = total_speed
                    this.speed_y = 0
                } else if (collision === "right") {
                    this.speed_x = - total_speed
                    this.speed_y = 0
                } else if (collision === "top") {
                    this.speed_x = 0
                    this.speed_y = total_speed
                } else if (collision === "bottom") {
                    this.speed_x = 0
                    this.speed_y = - total_speed
                }
    
                if (collision2 === "left") {
                    rect.speed_x = total_speed_enemy
                    rect.speed_y = 0
                } else if (collision2 === "right") {
                    rect.speed_x = - total_speed_enemy
                    rect.speed_y = 0
                } else if (collision2 === "top") {
                    rect.speed_x = 0
                    rect.speed_y = total_speed_enemy
                } else if (collision2 === "bottom") {
                    rect.speed_x = 0
                    rect.speed_y = - total_speed_enemy
                }
            }
        }

        if (this.checkCollide(player) !== "" && this.active) {
            player.alive = false
        }
        if ((performance.now() - this.create_time) > 1000 && !this.active) {
            this.active = true
            this.color = game.ACTIVE_ENEMY_COLOR
        }
    }
}

function distance(x1, y1, x2, y2) {
    return ((x1 - x2) ** 2 + (y2 - y1) ** 2) ** 0.5
}

function speed_boost(enemies, rects, game) {
    for (const enemy of enemies) {
        enemy.speed_x *= game.SPEED_BOOST
        enemy.speed_y *= game.SPEED_BOOST
    }
    for (const rect of rects) {
        rect.speed_x *= game.SPEED_BOOST
        rect.speed_y *= game.SPEED_BOOST
    }

    game.enemy_start_speed *= game.SPEED_BOOST
    return "Enemy speed boost"
}

function size_boost(enemies, rects, game) {
    for (const enemy of enemies) {
        enemy.radius *= game.SIZE_BOOST
    }
    for (const rect of rects) {
        rect.width *= game.SIZE_BOOST
        rect.height *= game.SIZE_BOOST
    }
    game.enemy_start_radius *= game.SIZE_BOOST

    return "Enemy size boost"
}

function reverse_boost(enemies, game) {
    var enemy = enemies[Math.floor(Math.random() * enemies.length)]
    enemy.set_reverse(game.REVERSE_PROBABILITY, game.REVERSE_ENEMY_COLOR)
    return "Enemy reverse ability"
}

function home_in_boost(enemies, game) {
    var enemy = enemies[Math.floor(Math.random() * enemies.length)]
    enemy.set_home_in(game.HOME_IN_PROBABILITY, game.HOMEIN_ENEMY_COLOR)
    return "Enemy home-in ability"
}

function add_rect(enemies, rect_enemies, game) {
    added = false
    while (!added) {
        var rect_width = game.RECT_WIDTHS[Math.floor(Math.random() * game.RECT_WIDTHS.length)]
        var start_x = Math.random() * (game.canvas.width - rect_width[0])
        var start_y = Math.random() * (game.canvas.height  - rect_width[1])
        if (Math.random() >= 0.5) {
            var speed_x = [-1, 1][Math.floor(Math.random() * 2)] * game.RECT_START_SPEED
            var speed_y = 0
        } else {
            var speed_x = 0
            var speed_y = [-1, 1][Math.floor(Math.random() * 2)] * game.RECT_START_SPEED
        }
        var can_be_added = true
        if (distance(game.player.x, game.player.y, start_x, start_y) < 2 * (game.player.radius + Math.max(rect_width[0], rect_width[1]))) {
            can_be_added = false
        }

        for (const enemy of enemies) {
            if (distance(start_x, start_y, enemy.x, enemy.y) < enemy.radius + Math.max(rect_width[0], rect_width[1])) {
                can_be_added = false
            } 
        }

        for (const rect of rect_enemies) {
            if (distance(start_x, start_y, rect.x, rect.y) < Math.max(rect_width[0], rect_width[1], rect.width, rect.height)) {
                can_be_added = false
            } 
        }
    
        if (can_be_added) {
            rect_enemies.push(new RectEnemy(start_x, start_y, rect_width[0], rect_width[1], speed_x, speed_y,
                                            game.INACTIVE_ENEMY_COLOR))
            added = true
        }
    }
    return "Added obstacle"
}

function add_enemy(enemies, player, canvas, ENEMY_START_RADIUS, ENEMY_START_SPEED, ENEMY_MAX_SPEED, game) {
    added = false
    while (!added) {
        var start_x = Math.random() * (canvas.width - 2 * ENEMY_START_RADIUS) + ENEMY_START_RADIUS
        var start_y = Math.random() * (canvas.height  - 2 * ENEMY_START_RADIUS) + ENEMY_START_RADIUS
        var speed_x = Math.random()
        var speed_y = (1 - speed_x ** 2) ** 0.5
        speed_x *= ENEMY_START_SPEED
        speed_y *= ENEMY_START_SPEED
        var can_be_added = true
        if (distance(player.x, player.y, start_x, start_y) < 100) {
            can_be_added = false
        }
        for (const enemy of enemies) {
            if (distance(start_x, start_y, enemy.x, enemy.y) < 2 * ENEMY_START_RADIUS + 1) {
                can_be_added = false
            } 
        }
    
        if (can_be_added) {
            enemies.push(new Enemy(start_x, start_y, ENEMY_START_RADIUS, speed_x, speed_y, ENEMY_MAX_SPEED, 
                                    game.INACTIVE_ENEMY_COLOR))
            added = true
        }
    
    }
}

function game_loop (game) {
    if (!game.start) {
        var time_until_start = String(Math.round((game.start_time + 3000 - performance.now()) / 1000))
        document.getElementById("time-info").innerHTML = "Starting in: " + time_until_start 
        if (performance.now() - game.start_time > 3000) {
            game.start_time = performance.now()
            game.time_last_update = performance.now()
            game.start = true
            document.getElementById("time-info").innerHTML = "Time: <span id='time'>0</span>"
        }
        game.context.clearRect(0, 0, game.canvas.width, game.canvas.height);
        game.player.draw(game.context)
        for (const enemy of game.enemies) {
            enemy.draw(game.context)
        }
        
        for (const rect of game.rects) {
            rect.draw(game.context)
        }
        return
    }

    if (!game.player.alive) {
        return 
    } else {
        var time = (performance.now() - game.time_last_update) / 1000
        game.time_last_update = performance.now()
        game.context.clearRect(0, 0, game.canvas.width, game.canvas.height);
        game.player.update_pos(game.mouse_pos, game.canvas, game, time)

        for (const enemy of game.enemies) {
            enemy.update_pos(game.enemies, game.player, game.canvas, game, time)
            enemy.draw(game.context)
        }

        for (const rect of game.rects) {
            rect.update_pos(game.enemies, game.rects, game.player, game.canvas, game, time)
            rect.draw(game.context)
        }
    
        game.player.draw(game.context)

        if ((performance.now() - game.start_time) / 1000 > game.BOOST_TIME * (game.n_boosts_added + 1)) {
            game.n_boosts_added += 1
            if (game.n_boosts_added % game.ADD_ENEMY_CHANGE === 0) {
                add_enemy(game.enemies, game.player, game.canvas, game.enemy_start_radius, game.enemy_start_speed, 
                                game.ENEMY_MAX_SPEED, game)
                document.getElementById("add-enemy-information").innerHTML = "Enemy added"
            } else {
                var selected_power = game.POWERUPS[Math.floor(Math.random() * game.POWERUPS.length)](game.enemies, game.rects)
                document.getElementById("boost-information").innerHTML = selected_power
            }
        } else if ((performance.now() - game.start_time) / 1000 > game.BOOST_TIME * game.n_boosts_added + 2) {
            document.getElementById("boost-information").innerHTML = ""
            document.getElementById("add-enemy-information").innerHTML = ""
        }
    }

    if (!game.player.alive) {
        if (game.end_score === -1) {
            game.end_score = Math.round((performance.now() - game.start_time) / 10) / 100
            end_game(game.end_score)
        }
    } else {
        var new_time = String(Math.round((performance.now() - game.start_time) / 100) / 10)
        if (! new_time.includes(".")) {
            new_time += ".0"
        }
        document.getElementById("time").innerHTML = new_time
    }
    return
}

main()