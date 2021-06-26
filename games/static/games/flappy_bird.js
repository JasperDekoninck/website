var canvas = document.getElementById("game-canvas")
var context = canvas.getContext("2d")


class Bird {
    // class for the bird in flappy bird
    constructor(start_pos, jump_speed, time_update_sprite, max_descend_speed, horizontal_speed, player, color) {
        this.pos = start_pos
        this.start_pos = start_pos.slice() // for reset
        this.jump_speed = jump_speed
        this.time_update_sprite = time_update_sprite // time between two sprite updates
        this.time_since_last_change = 0
        this.max_descend_speed = max_descend_speed
        this.vel = [horizontal_speed, 0]
        this.player = player  // player that controls the bird, must have a "predict" method (which predicts whether
        // or not to jump given the observation) and a "fitness" field
        this.alive = true
        if (!color) {
            this.color = ["red", "blue", "yellow"][Math.floor(Math.random() * 3)]
        } else {
            this.color = color
        }

        this.sprites = [
            document.getElementById(this.color + "1"),
            document.getElementById(this.color + "2"),
            document.getElementById(this.color + "3"),
            document.getElementById(this.color + "4")
        ]

        this.size = [this.sprites[0].width, this.sprites[0].height]
        this.current_sprite = 1
    }

    set_color(new_color) {
        this.color = new_color

        this.sprites = [
            document.getElementById(this.color + "1"),
            document.getElementById(this.color + "2"),
            document.getElementById(this.color + "3"),
            document.getElementById(this.color + "4")
        ]
    }

    reset() {
        this.pos = this.start_pos.slice()
        this.vel = [this.vel[0], 0]
        this.time_since_last_change = 0
        this.alive = true
        this.size = [this.sprites[0].width, this.sprites[0].height]
        this.current_sprite = 1
    }

    revive(other_player) {
        // revives the bird with another player as controller (for AI)
        this.pos = this.start_pos.slice()
        this.alive = true
        this.current_sprite = 1
        this.player.fitness = 0
        this.vel[1] = 0
        if (other_player) {
            this.player = other_player
        }
    }

    update (time, gravity, observation) {
        if (this.alive) {
            this.pos[1] += this.vel[1] * time
            this.vel[1] += gravity * time
            if (this.vel[1] > this.max_descend_speed) {
                this.vel[1] = this.max_descend_speed
            }

            this.time_since_last_change += time

            if (this.time_since_last_change > this.time_update_sprite) {
                this.time_since_last_change = 0
                this.current_sprite = (this.current_sprite + 1) % 4
            } 
            if (this.decide_to_jump(observation)) {
                this.vel[1] = Math.min(this.jump_speed, this.vel[1] + this.jump_speed)
            } 
            if (this.player) {
                this.player.fitness += time
            }
        } else {
            this.pos[0] -= this.vel[0] * time
        }
    }

    closest_point_to_point (rect, point) {
        // finds the closest side point of the rectangle compared to the given point
        var closest_point = [0, 0]
        if (point[0] <= rect[0] + rect[2]) {
            closest_point[0] = Math.max(point[0], rect[0])
        } else {
            closest_point[0] = rect[0] + rect[2]
        }

        if (point[1] <= rect[1] + rect[3]) {
            closest_point[1] = Math.max(point[1], rect[1])
        } else {
            closest_point[1] = rect[1] + rect[3]
        }
        return closest_point
    }

    collide_oval_rect(oval, rect) {
        // checks whether or not an oval (the bird) and a rect (the pipe) collide
        var closest_point_rect = this.closest_point_to_point(rect, oval.slice(0, 2))
        return (oval[0] - closest_point_rect[0]) ** 2 / oval[2] ** 2 + 
                    (oval[1] - closest_point_rect[1]) ** 2 / oval[3] ** 2 <= 1
    }

    check_death(pipes, screen_size, ground_pos) {
        // checks whether or not the bird is death
        var screen_size_allowed = [screen_size[0], ground_pos[1]]
        if (this.pos[1] <= 0 || this.pos[1] + this.size[1] >= screen_size_allowed[1]) {
            this.alive = false
            return
        }
        var oval = [this.pos[0] + this.size[0] / 2, this.pos[1] + this.size[1] / 2, 
                    this.size[0] / 2 - 3, this.size[1] / 2 - 3]
        
        for(const pipe of pipes) {
            for (var i = 0; i < 2; i++) {
                var pos = [pipe.pos_high, pipe.pos_low][i]
                var size = [pipe.size_high, pipe.size_low][i]
                var rect2 = [pos[0], pos[1], size[0], size[1]]
                if (this.collide_oval_rect(oval, rect2)) {
                    this.alive = false
                    return
                }
            }
        }
        return
    }

    decide_to_jump(observation) {
        return this.player.predict(observation)
    }

    draw() {
        context.drawImage(this.sprites[this.current_sprite], this.pos[0], this.pos[1])
    }

}

class Pipe {
    // class for a pipe
    constructor(pos, screen_size, horizontal_speed, length) {
        this.pos_high = [pos[0], 0]
        this.pos_low = [pos[0], pos[1] + length]
        this.sprite_high = document.getElementById("pipe")
        this.size_high = [this.sprite_high.width, pos[1]]

        this.sprite_low = document.getElementById("pipe")
        this.size_low = [this.sprite_low.width, screen_size[1] - length - pos[1]]
        this.horizontal_speed = horizontal_speed
        this.counted_score = false
    }

    update (time) {
        this.pos_high[0] -= this.horizontal_speed * time
        this.pos_low[0] -= this.horizontal_speed * time
    }

    must_be_terminated() {
        // checks whether or not the pipe is off screen and thus must be removed
        return this.pos_low[0] + this.size_low[0] <= 0
    }

    drawRotatedImage() { 
        // draws the top pipe: it needs to be rotated 180 degrees
        context.save()
        context.translate(this.pos_high[0], this.pos_high[1])
        context.rotate(Math.PI)
        // complex why? Because you want the end of the pipes to have the same size not matter the size of
        // the pipe
        context.drawImage(this.sprite_high, 0, 0, this.size_high[0], 
                            Math.min(this.size_high[1], this.sprite_high.height),
                        - this.size_high[0], - this.size_high[1], this.size_high[0], this.size_high[1])
        context.restore(); 
    }

    draw() {
        this.drawRotatedImage()
        // complex why? Because you want the end of the pipes to have the same size not matter the size of
        // the pipe
        context.drawImage(this.sprite_low, 0, 0, this.size_low[0], 
                            Math.min(this.size_low[1], this.sprite_low.height),
                            this.pos_low[0], this.pos_low[1], this.size_low[0], this.size_low[1])
    }
}

class Human {
    // human player
    constructor() {
        this.type = "human"
        this.jump = false
        this.fitness = 0
    }

    predict(observation) {
        if (this.jump) {
            this.jump = false
            return true
        }
        return false
    }
} 

class Game {
    // game 
    constructor(screen_size, birds, distance_pipes, horizontal_speed, length_holes, gravity, 
        fps, send_score, wait_seconds, fps_mode) {
        this.screen_size = screen_size
        this.birds = birds // all birds playing the game
        this.distance_pipes = distance_pipes  // distance between two pipes
        this.length_holes = length_holes  // size of the whole between top and bottom pipe
        this.gravity = gravity
        this.fps = fps
        this.horizontal_speed = horizontal_speed
        this.start_time = performance.now()  // when game was started
        this.time = performance.now()
        this.score_sent = false
        this.send_score = send_score  // whether or not you want to send the score to the highscores
        this.wait_seconds = wait_seconds
        this.fps_mode = fps_mode
        this.ground_pos = [0, screen_size[1]]

        this.pipes = [this.create_new_pipe()]
        this.score = 0
    }

    create_new_pipe() {
        // between 0.2 and O.8, you don't want it to get further
        var y_pos = this.ground_pos[1] * 0.2 + Math.random() * (this.ground_pos[1] * 0.6 - this.length_holes)
        return new Pipe([this.screen_size[0], y_pos], [this.screen_size[0], this.screen_size[1]], 
                    this.horizontal_speed, this.length_holes)
    }

    reset(birds) {
        this.start_time = performance.now()
        this.time = performance.now()
        this.score_sent = false

        this.pipes = [this.create_new_pipe()]
        this.score = 0
        if (birds) {
            this.birds = birds
        } else {
            for (const bird of this.birds) {
                bird.reset()
            }
        }

        return this.convert_to_observation(this.birds[0])
    }

    render(gameover) {
        context.clearRect(0, 0, canvas.width, canvas.height)
        
        for (const bird of this.birds) {
            bird.draw()
        }

        for (const pipe of this.pipes) {
            pipe.draw()
        }

        if (this.wait_seconds && performance.now() - this.start_time < 3000) {
            var current_time = 3 - Math.round((performance.now() - this.start_time) / 1000)
            document.getElementById("score-information").innerHTML = "Start: " + current_time
        } else {
            document.getElementById("score-information").innerHTML = "Score: " + this.score
        }

        if (gameover) {
            document.getElementById("gameover").innerHTML = "Game Over"
        }
    }

    convert_to_observation (bird) {
        var observation = [bird.vel[1] / 350]
        for (var i = 0; i < this.pipes.length; i++) {
            var pipe = this.pipes[i]
            if (!pipe.counted_score) {
                observation.push(bird.pos[0] / 200 - pipe.pos_low[0] / 200)
                observation.push(bird.pos[1] / 200 - pipe.pos_low[1] / 200)
                if (i < this.pipes.length - 1) {
                    observation.push(bird.pos[1] / 200 - this.pipes[i + 1].pos_low[1] / 200)
                } else {
                    observation.push(0)
                }

                break
            }

        }
        return observation
    }

    step () {
        if (this.wait_seconds && (performance.now() - this.start_time) < 3000) {
            this.render()
            this.time = performance.now()
            return
        } 

        var alive_bird = this.birds[0]

        for (const bird of this.birds) {
            if (bird.alive) {
                alive_bird = bird
            }
        }

        var done = !alive_bird.alive
        var time_update = (performance.now() - this.time) / 1000
        if (this.fps_mode) {
            time_update = 1 / this.fps
        }
        this.time = performance.now()
        if (!done) {

            for(const bird of this.birds) {
                bird.update(time_update, this.gravity, this.convert_to_observation(bird))
                bird.check_death(this.pipes, this.screen_size, this.ground_pos) 
            }

            for (const pipe of this.pipes) {
                pipe.update(time_update)
                if (!pipe.counted_score && pipe.pos_low[0] + pipe.size_low[0] <= alive_bird.pos[0]) {
                    this.score += 1
                    pipe.counted_score += 1
                }
            }
    
            if (this.pipes[0].must_be_terminated()) {
                this.pipes = this.pipes.slice(1)
            }
            if (this.pipes.length === 0 || 
                this.screen_size[0] - this.pipes[this.pipes.length - 1].pos_low[0] >= this.distance_pipes) {
                    this.pipes.push(this.create_new_pipe())
            }
        }

        if (done) {
            var reward = -1
            if (this.send_score && ! this.score_sent) {
                this.score_sent = true
                end_game(this.score)
            }
        } else {
            reward = 0.01
        }
        this.render(done)

        return [this.convert_to_observation(alive_bird), reward, done]
    }
}     