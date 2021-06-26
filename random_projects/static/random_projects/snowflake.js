function download() {
    var dt = canvas.toDataURL('image/jpeg')
    this.href = dt
    return false
  }
  
downloadLnk.addEventListener('click', download);


var canvas = document.getElementById("generation-canvas")
var context = canvas.getContext("2d")

// resize canvas based on the size of the screen
var square_size = Math.min(window.innerWidth * 1.4, window.innerHeight * 1.4)
canvas.width = Math.min(square_size, 1200)
canvas.height = Math.min(square_size, 1200)
canvas.style.width = canvas.width / 2 + "px"
canvas.style.height = canvas.height / 2 + "px"
drawRect(0, 0, canvas.width, canvas.height, "rgb(54, 151, 230)")
var interval = null

window.addEventListener('resize', function () {
    // resize canvas based on the size of the screen
    clearInterval(interval)
    var square_size = Math.min(window.innerWidth * 1.4, window.innerHeight * 1.4)
    canvas.width = Math.min(square_size, 1200)
    canvas.height = Math.min(square_size, 1200)
    canvas.style.width = canvas.width / 2 + "px"
    canvas.style.height = canvas.height / 2 + "px"
    drawRect(0, 0, canvas.width, canvas.height, "rgb(54, 151, 230)")
}, false);

// the angle to use over which to rotate
var angle = 60 * 2 * Math.PI / 360
document.getElementById("angle").value = 60
var size = document.getElementById("size").value
var spread = document.getElementById("spread").value

// all particles in the snowflake
var snowflake = []

function drawParticle (x, y) {
    // draws a particle
    context.beginPath();
    context.fillStyle = "white";
    context.arc(x, y, size, 0, 2 * Math.PI);
    context.fill()
}

function drawRect(x, y, width, height, color) {
    // draws a rectangle to reset the screen
    context.beginPath();
    context.fillStyle = color;
    context.rect(x, y, width, height)
    context.fill()
}

function rotate (point, angle) {
    // rotates a point around (0, 0)
    var qx = Math.cos(angle) * point[0] - Math.sin(angle) * point[1]
    var qy = Math.sin(angle) * point[0] + Math.cos(angle) * point[1]
    return [qx, qy]
}

function drawSnowflake(particle) {
    // draws a particle by rotating it around the angle several times 

    // mirror
    var rotate_list = [particle, [-particle[0], particle[1]]]
    var all_particles = rotate_list.slice()
    // rotate around the given angle
    for (var i = angle; i < 2 * Math.PI; i += angle) {
        all_particles.push(rotate(rotate_list[0], i))
        all_particles.push(rotate(rotate_list[1], i))
    }

    // draw all rotated particles
    for (const el of all_particles) {
        drawParticle(el[0] + canvas.width / 2, el[1] + canvas.height / 2)
    }
}

function reset() {
    // resets the snowflake
    snowflake = []
    if (interval) {
        clearInterval(interval)
    }
    drawRect(0, 0, canvas.width, canvas.height, "rgb(54, 151, 230)")
}

reset()

function generate() {
    // generates a snowflake
    reset()
    angle = document.getElementById("angle").value * 2 * Math.PI / 360
    size = document.getElementById("size").value
    spread = document.getElementById("spread").value
    if (interval) {
        clearInterval(interval)
    }
    interval = setInterval(randomWalk, 0)

    return false
}

function distance(el1, el2) {
    // calculates squared distance between two particles
    return (el1[0] - el2[0]) ** 2 + (el1[1] - el2[1]) ** 2
}

function intersectsSnowflake(particle) {
    // Checks whether the given particle intersects with the snowflake
    for (const el of snowflake) {
        if (distance(el, particle) < 4 * size ** 2) {
            return true
        }
    }
    return false
}

function randomWalk() {
    // does a random walk of one particle
    var start = [0, canvas.height / 2 - Math.max(1 / 12 * canvas.height, 1 / 12 * canvas.width)]
    while (start[1] >= 1 && !intersectsSnowflake(start)) {
        start[1] -= 1
        // uniform random walk step between [-spread, spread]
        start[0] += Math.random() * spread * 2 - spread
        if (Math.abs(start[0]) > Math.abs(Math.tan(angle) * start[1])) {
            start[0] = Math.sign(start[0]) * Math.tan(angle) * start[1]
        }
    }
    snowflake.push(start)
    drawSnowflake(start)
}