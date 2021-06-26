function getMousePos(canvas, event) {
    // Gets the mouse position within the canvas
    var rect = canvas.getBoundingClientRect();
    return {
        x: (event.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
        y: (event.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
    };
}

function letter_main() {
    document.getElementById("letter-forms").style.display = "block"
    document.addEventListener("keydown", function(e) {
        if (e.key === " ") {
            start_new = true
            e.preventDefault()
        } else if (e.key === "z") {
            letter[letter.length - 1] = letter[letter.length - 1].slice(0, letter[letter.length - 1].length - 1) 
        }
    })
    canvas.addEventListener("mousedown", function(e) {
        var mouse_pos = getMousePos(canvas, e)
        if (start_new) {
            start_new = false
            letter.push([mouse_pos])
        } else {
            letter[letter.length - 1].push(mouse_pos)
        }
        showLetter()
    })

    setInterval(function() {
        draw_letter(letter)
    }, 10)
}

function draw_circle (pos) {
    context.beginPath()
    context.fillStyle = "green"
    context.arc(pos.x, pos.y, 5, 0, 2 * Math.PI)
    context.fill()
}

function draw_line (from, to) {
    context.beginPath()
    context.strokeStyle = "green"
    context.moveTo(from.x, from.y)
    context.lineTo(to.x, to.y)
    context.stroke()
}

function showLetter() {
    var p = document.getElementById("letter")
    p.innerHTML = "["
    for (const line of letter) {
        p.innerHTML += "[ "
        for (const el of line) {
            p.innerHTML += `{x: ${el.x}, y: ${el.y}}, `
        }
        p.innerHTML = p.innerHTML.slice(0, p.innerHTML.length - 2) + "], "

    }
    p.innerHTML = p.innerHTML.slice(0, p.innerHTML.length - 2) + "]"
}

function draw_letter(letter) {
    context.clearRect(0, 0, canvas.width, canvas.height)
    for (const line of letter) {
        for (var i = 0; i < line.length; i++) {
            draw_circle(line[i])
            if (i < line.length - 1) {
                draw_line(line[i], line[i + 1])
            }
        }
    }
}


class Particle {
    constructor (size, start_pos, start_direction, speed, color, next_direction) {
        this.size = size
        this.pos = start_pos
        this.direction = start_direction
        this.next_direction = next_direction
        this.speed = speed
        this.color = color
        this.vel = [0, 0]
        this.alpha = 1
        this.start_move()
        this.start_chase = Date.now()
    }
    draw(context) {
        var colorStop2 = `rgba(255, 255, 255, ${this.alpha})`
        var colorStop1 = `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, ${this.alpha})`
    
        var gradient = context.createRadialGradient(this.pos[0], this.pos[1], 0, this.pos[0], this.pos[1], this.size);
        gradient.addColorStop(0, colorStop1)
        gradient.addColorStop(1.0, colorStop2)
    
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(this.pos[0], this.pos[1], this.size, 0, 2 * Math.PI);
        context.fill();
    }

    draw2 (context) {
        for (var i = this.size; i >= 1; i--) {
            context.beginPath();
            context.fillStyle = `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, 
                                        ${(1 - (i / this.size) ** 0.8) * Math.max(this.alpha, 0)})`
            context.arc(this.pos[0], this.pos[1], i, 0, 2 * Math.PI);
            context.fill();
        }
    }

    start_move () {
        this.vel = [this.direction[0] - this.pos[0], this.direction[1] - this.pos[1]]
        var size_vel = (this.vel[0] ** 2 + this.vel[1] ** 2) ** 0.5
        this.vel = [this.vel[0] / size_vel * this.speed, this.vel[1] / size_vel * this.speed]
    }

    update(time) {
        if (this.direction) {
            var acceleration = [this.direction[0] - this.pos[0], this.direction[1] - this.pos[1]]
            var size_acc = (acceleration[0] ** 2 + acceleration[1] ** 2) ** 0.5
            acceleration[0] *= 1 / size_acc * this.speed * (Date.now() - this.start_chase) ** 2 / 200 ** 2
            acceleration[1] *= 1 / size_acc * this.speed * (Date.now() - this.start_chase) ** 2 / 200 ** 2
            this.vel[0] += acceleration[0] * time
            this.vel[1] += acceleration[1] * time
            var size_vel = (this.vel[0] ** 2 + this.vel[1] ** 2) ** 0.5
            this.vel = [this.vel[0] / size_vel * this.speed, this.vel[1] / size_vel * this.speed]
    
            if ((this.direction[0] - this.pos[0]) ** 2 + (this.direction[1] - this.pos[1]) ** 2 > 2) {
                this.pos[0] += this.vel[0] * time
                this.pos[1] += this.vel[1] * time
            } else if (this.next_direction) {
                this.change_direction(this.next_direction.slice())
                this.next_direction = null
            }   
        } else {
            this.alpha = Math.max(0, this.alpha - time)
        }
    }

    change_direction (new_direction) {
        this.direction = new_direction
        this.start_chase = Date.now()
    }

    reached_destination() {
        if (this.direction) {
            return (this.direction[0] - this.pos[0]) ** 2 + (this.direction[1] - this.pos[1]) ** 2 <= 2
        }
        return true
    }

    can_be_removed () {
        return this.alpha <= 0
    }
}


function get_dimensions_letter(letter) {
    var x_range = [null, null]
    var y_range = [null, null]
    for (const el of letter) {
        for (const particle_pos of el) {
            if (!x_range[0]) {
                x_range = [particle_pos.x, particle_pos.x]
                y_range = [particle_pos.y, particle_pos.y]
            }
             else {
                 if (particle_pos.x < x_range[0]) {
                     x_range[0] = particle_pos.x
                 } else if (particle_pos.x > x_range[1]) {
                     x_range[1] = particle_pos.x
                 }
                 if (particle_pos.y < y_range[0]) {
                    y_range[0] = particle_pos.y
                 } else if (particle_pos.y > y_range[1]) {
                    y_range[1] = particle_pos.y
                 }
             }
        }
    }
    return [x_range, y_range]
}

function perturb_letter(letter) {
    var dimensions_letter = get_dimensions_letter(letter)
    var new_letter = []
    for (const el of letter) {
        var particles_positions = []
        for (const particle_pos of el) {
            particles_positions.push({x: particle_pos.x - dimensions_letter[0][0], 
                                        y: particle_pos.y - dimensions_letter[1][0]})
        }
        new_letter.push(particles_positions.slice())
    }
    return new_letter
}

function distance_from_list(circle, other_circles) {
    if (other_circles.length === 0) {
        return 10000
    }
    var distance = (circle.x - other_circles[0].x) ** 2 + (circle.y - other_circles[0].y) ** 2
    for (const other_circle of other_circles) {
        var this_distance = (circle.x - other_circle.x) ** 2 + (circle.y - other_circle.y) ** 2
        if (this_distance < distance) {
            distance = this_distance
        }
    }
    return distance ** 0.5
}

function generate_letter(letter, x_offset, y_offset, resize_letter_factor, minimal_distance) {
    var elements = []
    for (const el of letter) {
        for (var i = 0; i < el.length; i++) {

            var this_circle = {x: el[i].x * resize_letter_factor + x_offset, y: el[i].y * resize_letter_factor + y_offset}
            if (distance_from_list(this_circle, elements) > minimal_distance) {
                elements.push(this_circle)
            }

            if (i < el.length - 1) {
                var vector = [(el[i + 1].x - el[i].x) * resize_letter_factor, (el[i + 1].y - el[i].y) * resize_letter_factor]
                var size_vector = (vector[0] ** 2 + vector[1] ** 2) ** 0.5
                var extra_particles = Math.floor(size_vector / DISTANCE_PARTICLES)
                var distance_current_particles = size_vector / (extra_particles + 1)
                for (var j = 1; j <= extra_particles; j++) {
                    var distance_vector = [vector[0] / size_vector * j * distance_current_particles, 
                                            vector[1] / size_vector * j * distance_current_particles]
                    var this_element = [el[i].x * resize_letter_factor + distance_vector[0], el[i].y * resize_letter_factor + distance_vector[1]]
                    var circle = {x: this_element[0] + x_offset, y: this_element[1] + y_offset}
                    console.log(distance_from_list(circle, elements))
                    if (distance_from_list(circle, elements) > minimal_distance) {
                        elements.push(circle)
                    }
                }
            }
        }
    }
    return elements
}

function random_pos(max_size_x, max_size_y, x_radius, y_radius, center_x, center_y) {
    var x = Math.random() * (max_size_x - 100) + 50
    var y = Math.random() * (max_size_y - 100) + 50
    while ((x - center_x) ** 2 / x_radius ** 2 + (y - center_y) ** 2 / y_radius ** 2 <= 1) {
        x = Math.random() * max_size_x
        y = Math.random() * max_size_y
    }
    return [x, y]
}


function positions_word(word, particles, canvas_x, canvas_y) {
    var x_size = 0
    var word_perturbed = []
    var dimensions_x = []
    for (const letter of word) {
        var perturbed_letter = perturb_letter(letters[letter])
        var dimensions_letter = get_dimensions_letter(perturbed_letter)
        word_perturbed.push(perturbed_letter)
        dimensions_x.push(dimensions_letter)
        x_size += dimensions_letter[0][1]
    }
    var resize_letter_factor = (canvas_x - distance_between_letters * (word.length + 1)) / x_size
    var offset_x = distance_between_letters
    if (particles) {
        var original_size = particles.length
        var j = 0
        for (const particle of particles) {
            particle.change_direction(null)
        }
        for (var i = 0; i < word_perturbed.length; i++) {
            var letter_elements = generate_letter(word_perturbed[i], offset_x, canvas_y / 2 - SIZE_LETTER / 2, 
                                                        resize_letter_factor, MINIMAL_DISTANCE)
            offset_x += distance_between_letters + dimensions_x[i][0][1] * resize_letter_factor
            for (const letter_element of letter_elements) {
                var random_direction = random_pos(canvas.width, canvas.height, 200, 100, 
                    canvas.width / 2, canvas.height / 2)
                if (j < original_size) {
                    particles[j].change_direction(random_direction)
                    particles[j].next_direction = [letter_element.x, letter_element.y]
                } else {
                    var start_pos = particles[j % original_size].pos.slice()
                    particles.push(new Particle(RADIUS_PARTICLES, start_pos, random_direction, 100, [46, 177, 20], [letter_element.x, letter_element.y]))
                }
                j++;
            }
        }
    } else {
        var particles = []
        for (var i = 0; i < word_perturbed.length; i++) {
            var letter_elements = generate_letter(word_perturbed[i], offset_x, canvas_y / 2 - SIZE_LETTER / 2, 
                resize_letter_factor, MINIMAL_DISTANCE)
            offset_x += distance_between_letters + dimensions_x[i][0][1] * resize_letter_factor
            for (el of letter_elements) {
                var random_start_pos = random_pos(canvas.width, canvas.height, 200, 100, canvas.width / 2, canvas.height / 2)
                particles.push(new Particle(RADIUS_PARTICLES, random_start_pos, [el.x, el.y], 100, [46, 177, 20]))
            }
        }
    }
    return particles
}

function random_direction_particles (particles) {
    for (const particle of particles) {
        var random_direction = random_pos(canvas.width, canvas.height, 200, 100, canvas.width / 2, canvas.height / 2)
        particle.change_direction(random_direction)
    }
}

function update_particles (particles) {
    context.clearRect(0, 0, canvas.width, canvas.height)
    destination_reached = true
    i = 0;
    while (i < particles.length) {
        var particle = particles[i]
        if (!particle.reached_destination()) {
            destination_reached = false;
        }
        particle.update( 1 / FPS)
        particle.draw(context)
        if (particle.can_be_removed()) {
            particles = particles.splice(i, 1)
        } else {
            i++
        }
    }
    if (destination_reached && !destination_reached_this_frame) {
        destination_reached_this_frame = true
    }
}

function change_after_destination_reached(particles) {
    if (destination_reached && destination_reached_this_frame) {
        start_word_time = Date.now()
        destination_reached_this_frame = false
    } else if (destination_reached && Date.now() - start_word_time > 1000 * remain_time) {
        destination_reached = false
        current_word = (current_word + 1) % words.length
        particles = positions_word(words[current_word], particles, canvas.width, canvas.height)
    }
}

function update_step(particles) {
    if (destination_reached) {
        change_after_destination_reached(particles)
    } else {
        update_particles(particles)
    }
}

function main() {
    particles = positions_word(words[current_word], null, canvas.width, canvas.height)
    setInterval(function() {    
        update_step(particles)
    }, 1000 / FPS)
}


var words = ["ABCDEFG", "ABCDEFG"]
var current_word = 0
const RADIUS_PARTICLES = 6
const MINIMAL_DISTANCE = 3
const DISTANCE_PARTICLES = 12
const FPS = 60
const remain_time = 2
var start_word_time = Date.now()
var towards_word_modus = true
var destination_reached = false
var destination_reached_this_frame = false
var particles = null
var distance_between_letters = 30
const SIZE_LETTER = 100
var canvas = null

const letters = {
    A: [[ {x: 10.714285714285714, y: 76.30434782608695}, {x: 35.064935064935064, y: 11.739130434782608}, {x: 59.41558441558442, y: 77.28260869565217}], [ {x: 18.506493506493506, y: 56.73913043478261}, {x: 51.62337662337662, y: 55.76086956521739}]],
    B: [[ {x: 16.558441558441558, y: 75.32608695652175}, {x: 16.558441558441558, y: 12.717391304347824}, {x: 37.98701298701298, y: 13.695652173913045}, {x: 46.75324675324675, y: 19.565217391304348}, {x: 46.75324675324675, y: 30.32608695652174}, {x: 39.93506493506493, y: 38.15217391304348}, {x: 30.1948051948052, y: 41.086956521739125}, {x: 17.532467532467532, y: 41.086956521739125}], [ {x: 37.98701298701298, y: 44.02173913043478}, {x: 46.75324675324675, y: 48.91304347826087}, {x: 50.64935064935065, y: 56.73913043478261}, {x: 48.701298701298704, y: 67.5}, {x: 38.96103896103896, y: 74.34782608695652}, {x: 25.324675324675326, y: 74.34782608695652}]],
    C: [[ {x: 56.493506493506494, y: 16.630434782608695}, {x: 46.75324675324675, y: 11.739130434782608}, {x: 36.03896103896104, y: 13.695652173913045}, {x: 25.324675324675326, y: 19.565217391304348}, {x: 18.506493506493506, y: 25.43478260869565}, {x: 14.61038961038961, y: 34.23913043478261}, {x: 14.61038961038961, y: 44.02173913043478}, {x: 15.584415584415586, y: 55.76086956521739}, {x: 18.506493506493506, y: 63.58695652173913}, {x: 25.324675324675326, y: 71.41304347826086}, {x: 35.064935064935064, y: 75.32608695652175}, {x: 45.77922077922078, y: 76.30434782608695}, {x: 54.54545454545455, y: 73.3695652173913}]],
    D: [[ {x: 16.558441558441558, y: 12.717391304347824}, {x: 17.532467532467532, y: 76.30434782608695}, {x: 35.064935064935064, y: 75.32608695652175}, {x: 49.675324675324674, y: 69.45652173913044}, {x: 59.41558441558442, y: 58.69565217391305}, {x: 63.31168831168831, y: 44.02173913043478}, {x: 60.3896103896104, y: 29.347826086956523}, {x: 52.5974025974026, y: 15.652173913043478}, {x: 42.857142857142854, y: 13.695652173913045}, {x: 23.376623376623375, y: 12.717391304347824}]],
    E: [[ {x: 45.77922077922078, y: 12.717391304347824}, {x: 17.532467532467532, y: 11.739130434782608}, {x: 17.532467532467532, y: 75.32608695652175}, {x: 46.75324675324675, y: 75.32608695652175}], [ {x: 42.857142857142854, y: 43.04347826086957}], [ {x: 16.558441558441558, y: 45}]],
    F: [[ {x: 17.532467532467532, y: 76.30434782608695}, {x: 17.532467532467532, y: 11.739130434782608}, {x: 45.77922077922078, y: 11.739130434782608}], [ {x: 16.558441558441558, y: 45}, {x: 43.83116883116883, y: 45}]],
    G: [[ {x: 43.83116883116883, y: 45.97826086956522}, {x: 61.36363636363637, y: 45.97826086956522}, {x: 61.36363636363637, y: 72.3913043478261}, {x: 46.75324675324675, y: 76.30434782608695}, {x: 36.03896103896104, y: 76.30434782608695}, {x: 21.428571428571427, y: 68.47826086956522}, {x: 14.61038961038961, y: 53.80434782608695}, {x: 11.688311688311687, y: 39.130434782608695}, {x: 17.532467532467532, y: 28.369565217391305}, {x: 25.324675324675326, y: 17.608695652173914}, {x: 37.98701298701298, y: 13.695652173913045}, {x: 46.75324675324675, y: 12.717391304347824}, {x: 57.46753246753247, y: 13.695652173913045}]],
    H: [[ {x: 16.558441558441558, y: 11.739130434782608}, {x: 17.532467532467532, y: 76.30434782608695}], [ {x: 61.36363636363637, y: 11.739130434782608}, {x: 60.3896103896104, y: 75.32608695652175}], [ {x: 16.558441558441558, y: 42.06521739130435}, {x: 60.3896103896104, y: 43.04347826086957}]],
    I: [[ {x: 17.532467532467532, y: 10.760869565217392}, {x: 17.532467532467532, y: 77.28260869565217}]],
    J: [[ {x: 27.272727272727273, y: 12.717391304347824}, {x: 27.272727272727273, y: 60.65217391304348}, {x: 19.48051948051948, y: 74.34782608695652}, {x: 7.792207792207793, y: 76.30434782608695}]],
    K: [[ {x: 17.532467532467532, y: 11.739130434782608}, {x: 16.558441558441558, y: 76.30434782608695}], [ {x: 52.5974025974026, y: 10.760869565217392}, {x: 26.2987012987013, y: 43.04347826086957}, {x: 54.54545454545455, y: 76.30434782608695}]],
    L: [[ {x: 18.506493506493506, y: 12.717391304347824}, {x: 17.532467532467532, y: 74.34782608695652}, {x: 45.77922077922078, y: 74.34782608695652}]],
    M: [[ {x: 16.630434782608695, y: 76.30434782608695}, {x: 16.630434782608695, y: 12.717391304347824}, {x: 48.91304347826087, y: 75.32608695652175}, {x: 78.26086956521739, y: 13.695652173913045}, {x: 80.21739130434783, y: 76.30434782608695}]],
    N: [[ {x: 17.608695652173914, y: 75.32608695652175}, {x: 19.565217391304348, y: 14.673913043478262}, {x: 62.608695652173914, y: 74.34782608695652}, {x: 64.56521739130434, y: 10.760869565217392}]],
    O: [[ {x: 42.06521739130435, y: 13.695652173913045}, {x: 28.369565217391305, y: 15.652173913043478}, {x: 19.565217391304348, y: 23.478260869565215}, {x: 14.673913043478262, y: 37.17391304347826}, {x: 13.695652173913045, y: 50.8695652173913}, {x: 19.565217391304348, y: 64.56521739130434}, {x: 27.39130434782609, y: 72.3913043478261}, {x: 41.086956521739125, y: 74.34782608695652}, {x: 55.76086956521739, y: 72.3913043478261}, {x: 65.54347826086956, y: 59.67391304347826}, {x: 69.45652173913044, y: 45}, {x: 66.52173913043478, y: 28.369565217391305}, {x: 58.69565217391305, y: 17.608695652173914}, {x: 47.934782608695656, y: 13.695652173913045}]],
    P: [[ {x: 17.608695652173914, y: 76.30434782608695}, {x: 17.608695652173914, y: 12.717391304347824}, {x: 39.130434782608695, y: 13.695652173913045}, {x: 47.934782608695656, y: 23.478260869565215}, {x: 50.8695652173913, y: 35.21739130434783}, {x: 45, y: 45}, {x: 30.32608695652174, y: 48.91304347826087}, {x: 19.565217391304348, y: 46.95652173913043}]],
    Q: [[ {x: 43.04347826086957, y: 12.717391304347824}, {x: 31.304347826086957, y: 13.695652173913045}, {x: 24.456521739130434, y: 18.58695652173913}, {x: 15.652173913043478, y: 28.369565217391305}, {x: 13.695652173913045, y: 42.06521739130435}, {x: 14.673913043478262, y: 54.78260869565218}, {x: 19.565217391304348, y: 66.52173913043478}, {x: 31.304347826086957, y: 74.34782608695652}, {x: 43.04347826086957, y: 75.32608695652175}, {x: 57.71739130434782, y: 70.43478260869566}, {x: 67.5, y: 60.65217391304348}, {x: 69.45652173913044, y: 45}, {x: 66.52173913043478, y: 31.304347826086957}, {x: 61.6304347826087, y: 20.543478260869563}, {x: 49.891304347826086, y: 11.739130434782608}], [ {x: 70.43478260869566, y: 86.08695652173914}, {x: 57.71739130434782, y: 75.32608695652175}]],
    R: [[ {x: 17.608695652173914, y: 76.30434782608695}, {x: 18.58695652173913, y: 12.717391304347824}, {x: 43.04347826086957, y: 13.695652173913045}, {x: 49.891304347826086, y: 24.456521739130434}, {x: 47.934782608695656, y: 37.17391304347826}, {x: 37.17391304347826, y: 45}, {x: 43.04347826086957, y: 53.80434782608695}, {x: 48.91304347826087, y: 65.54347826086956}, {x: 55.76086956521739, y: 76.30434782608695}], [ {x: 17.608695652173914, y: 45}, {x: 30.32608695652174, y: 45.97826086956522}]],
    S: [[ {x: 12.717391304347824, y: 73.3695652173913}, {x: 30.32608695652174, y: 76.30434782608695}, {x: 42.06521739130435, y: 71.41304347826086}, {x: 48.91304347826087, y: 62.608695652173914}, {x: 43.04347826086957, y: 49.891304347826086}, {x: 26.41304347826087, y: 42.06521739130435}, {x: 15.652173913043478, y: 29.347826086956523}, {x: 15.652173913043478, y: 17.608695652173914}, {x: 27.39130434782609, y: 12.717391304347824}, {x: 39.130434782608695, y: 13.695652173913045}, {x: 45.97826086956522, y: 15.652173913043478}]],
    T: [[ {x: 30.32608695652174, y: 76.30434782608695}, {x: 30.32608695652174, y: 12.717391304347824}], [ {x: 7.826086956521739, y: 11.739130434782608}, {x: 52.82608695652174, y: 12.717391304347824}]],
    U: [[ {x: 15.652173913043478, y: 11.739130434782608}, {x: 16.630434782608695, y: 56.73913043478261}, {x: 23.478260869565215, y: 71.41304347826086}, {x: 35.21739130434783, y: 74.34782608695652}, {x: 45.97826086956522, y: 73.3695652173913}, {x: 57.71739130434782, y: 64.56521739130434}, {x: 59.67391304347826, y: 48.91304347826087}, {x: 59.67391304347826, y: 11.739130434782608}]],
    V: [[ {x: 10.760869565217392, y: 13.695652173913045}, {x: 35.21739130434783, y: 76.30434782608695}, {x: 59.67391304347826, y: 10.760869565217392}]],
    W: [[ {x: 10.784313725490197, y: 12.717391304347824}, {x: 31.372549019607842, y: 74.34782608695652}, {x: 51.9607843137255, y: 13.695652173913045}, {x: 70.58823529411765, y: 75.32608695652175}, {x: 90.19607843137256, y: 11.739130434782608}]],
    X: [[ {x: 14.705882352941178, y: 13.695652173913045}, {x: 54.90196078431373, y: 75.32608695652175}], [ {x: 12.745098039215685, y: 76.30434782608695}, {x: 54.90196078431373, y: 13.695652173913045}]],
    Y: [[ {x: 11.76470588235294, y: 13.695652173913045}, {x: 32.35294117647059, y: 50.8695652173913}, {x: 31.372549019607842, y: 76.30434782608695}], [ {x: 52.94117647058824, y: 11.739130434782608}, {x: 35.294117647058826, y: 45.97826086956522}]],
    Z: [[ {x: 11.76470588235294, y: 12.717391304347824}, {x: 52.94117647058824, y: 13.695652173913045}, {x: 10.784313725490197, y: 76.30434782608695}, {x: 54.90196078431373, y: 74.34782608695652}]]
}

var letter = []
var start_new = true

var canvas = document.getElementById("game-canvas")
main()

//var canvas = document.getElementById("create-letters")
//letter_main()
var context = canvas.getContext('2d')

