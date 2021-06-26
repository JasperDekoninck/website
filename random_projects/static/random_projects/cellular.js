// The size of one square
var size_square = Number(document.getElementById("size").value)
// The border pixel size
const SIZE_BORDER = 1
// The interval that is currently active
var interval = null
// Whether or not the system is paused
var pause = false
var FPS = Number(document.getElementById("timeout").value)
var active_cells = []

var canvas = document.getElementById("generation-canvas")
var context = canvas.getContext("2d")

// The keys that are held down -> so that the user can keep 'left' pressed and moves left
var keys = {}

// Set the height and width to fit the window
canvas.width = window.innerWidth * 0.7;
canvas.height = window.innerHeight * 0.7;

// The top left in the grid.
var top_left = [0, 0]

// On resize -> resize the canvas
window.addEventListener('resize', function () {
    canvas.width = window.innerWidth * 0.7;
    canvas.height = window.innerHeight * 0.7;
}, false);

// pause the simulation
start_stop()

function changeSquare () {
    // changes the size of the square on user input.
    var new_size = Number(document.getElementById("size").value)

    // Make sure the middle is mapped to the middle -> zoom works as expected
    var center_square = [Math.floor(top_left[1] / size_square + (canvas.height / 2) / size_square),
                         Math.floor(top_left[0] / size_square + (canvas.width / 2) / size_square)]
    top_left = [center_square[1] * new_size - (canvas.width / 2), 
                center_square[0] * new_size - (canvas.height / 2),]
    size_square = new_size
}

function changeSpeed() {
    // Changes the speed of the simulation
    FPS = Number(document.getElementById("timeout").value)
    if (interval) {
        clearInterval(interval)
    }
    interval = setInterval( function() {
        if (!pause) {
            ConwayStateCalculator() 
        }
        draw()
    }, 1000 / FPS)
}

// On keyup -> remove the key that is pressed
document.addEventListener("keyup", function(e) {
    delete keys[e.key];
})

// On keydown: add the key that is pressed + prevent default (scrolling) when arrow key is pressed 
document.addEventListener("keydown", function(e) {
    var key = e.key
    keys[key] = true;
    if (key.startsWith("Arrow")) {
        e.preventDefault()
    }
})


// The move interval to move the screen 
var move_interval = setInterval(function() {
    if (keys["ArrowUp"]) {
        top_left[1] = top_left[1] - size_square
    }
    if (keys["ArrowDown"]) {
        top_left[1] = top_left[1] + size_square
    }
    if (keys["ArrowLeft"]) {
        top_left[0] = top_left[0] - size_square
    }
    if (keys["ArrowRight"]) {
        top_left[0] = top_left[0] + size_square
    }
    draw()
}, 5 * size_square)

function getMousePos(canvas, event) {
    // Gets the mouse position withn the canvas
    var rect = canvas.getBoundingClientRect();
    return {
        x: (event.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
        y: (event.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
    };
}

// changes the state of the element that is pressed
$("#generation-canvas").mousedown(function (event1) {
    var mouse_pos = getMousePos(canvas, event1)
    mouse_pos.x += top_left[0]
    mouse_pos.y += top_left[1]
    var mouse_square = [Math.floor(mouse_pos.y / size_square), Math.floor(mouse_pos.x / size_square)]
    if (event1.originalEvent.button === 0) { // left click
        if (indexPositionInList(mouse_square, active_cells) === -1) {
            active_cells.push(mouse_square)
        }
    } else if (event1.originalEvent.button === 2) { // right click
        var index = indexPositionInList(mouse_square, active_cells)
        if (index > -1) {
            active_cells.splice(index, 1)
        }
    }
    // Dragging is possible -> state of all cells that are hovered changes
    $(this).mousemove(function (e) {
        var mouse_pos = getMousePos(canvas, e)
        mouse_pos.x += top_left[0]
        mouse_pos.y += top_left[1]
        var mouse_square = [Math.floor(mouse_pos.y / size_square), Math.floor(mouse_pos.x / size_square)]
        if (event1.originalEvent.button === 0) { // left click
            if (indexPositionInList(mouse_square, active_cells) === -1) {
                active_cells.push(mouse_square)
            }
        } else if (event1.originalEvent.button === 2) { // right click
            var index = indexPositionInList(mouse_square, active_cells)
            if (index > -1) {
                active_cells.splice(index, 1)
            }
        }
    });
    }).mouseup(function () {
        $(this).unbind('mousemove');
    }).mouseout(function () {
        $(this).unbind('mousemove');
    }).on("touchmove", function (e) {
        e.preventDefault()
        var mouse_pos = getMousePos(canvas, e.changedTouches[0])
        mouse_pos.x += top_left[0]
        mouse_pos.y += top_left[1]
        var mouse_square = [Math.floor(mouse_pos.y / size_square), Math.floor(mouse_pos.x / size_square)]
        if (indexPositionInList(mouse_square, active_cells) === -1) {
            active_cells.push(mouse_square)
        }
    });

function indexPositionInList (position, list) {
    // Gets the index of the position in the list, returns -1 if not in list
    for (var i = 0; i < list.length; i++) {
        var pos  = list[i]
        if (pos[0] == position[0] && pos[1] == position[1]) {
            return i
        }
    }
    return -1;
}

function start_stop() {
    // Pauses or unpauses the game
    pause = ! pause

    // make sure the correct text is shown
    if (pause) {
        document.getElementById("start_stop").innerHTML = "Start"
    } else {
        document.getElementById("start_stop").innerHTML = "Pause"
    }
    if (interval) {
        clearInterval(interval)
    }
    interval = setInterval( function() {
        if (!pause) {
            ConwayStateCalculator() 
        }
        draw()
    }, 1000 / FPS)
}

function resetGrid () {
    // Resets the grid and pause the game
    active_cells = []
    if (!pause) {
        start_stop()
    }
}

function draw () {
    // Draws everything on canvas
    // clear
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw active cells
    for(const active_cell of active_cells) {
        var canvas_position = [active_cell[1] * size_square - top_left[0], 
                                active_cell[0] * size_square - top_left[1]]
        context.beginPath()
        context.fillStyle = "red"
        context.rect(canvas_position[0], canvas_position[1], size_square, size_square)
        context.fill()
    }

    // Draw border columns
    for (var i = top_left[0] - top_left[0] % size_square; i < canvas.width + top_left[0] + 1; i += size_square) {
        context.beginPath()
        context.strokeStyle = 'grey';
        context.lineWidth = 1.5;
        context.moveTo(i - top_left[0], 0)
        context.lineTo(i - top_left[0], canvas.height)
        context.stroke()
    }
    // Draw border rows
    for (var i = top_left[1] - top_left[1] % size_square; i < canvas.height + top_left[1] + 1; i += size_square) {
        context.beginPath()
        context.strokeStyle = 'grey';
        context.lineWidth = 1.5;
        context.moveTo(0, i - top_left[1])
        context.lineTo(canvas.width, i - top_left[1])
        context.stroke()
    }
}

function ConwayStateCalculator () {
    // Calculates the next state given the current active cells 

    // The cells that need to be checked whether or not they can be alive
    var cells = []
    // The i-th element of this list says how many living neighbours the i-th element of cells has 
    // and whether or not that cell is currently alive (a bit messy, but it works)
    var cells_living_neighbours = []
    const NEIGHBOURS= [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]

    // Check which cells to add to the 'cells' list
    for (const cell of active_cells) {
        for (const neighbour of NEIGHBOURS) {
            var element = [cell[0] + neighbour[0], neighbour[1] + cell[1]]
            var index_element = indexPositionInList(element, cells)
            if (index_element > -1) { // if already in list, update number of living cells
                cells_living_neighbours[index_element][0] += 1
            } else { // if not in list, check whether or not it is alive and set active neighbours to 1
                cells.push(element)
                var currently_active = indexPositionInList(element, active_cells)
                cells_living_neighbours.push([1, currently_active >= 0])
            }
        }
    }

    // Update the list of active cells based on the rules defined by Conway.
    active_cells = []
    for (var i = 0; i < cells.length; i++) {
        if (cells_living_neighbours[i][1] && 2 <= cells_living_neighbours[i][0] && cells_living_neighbours[i][0] <= 3) {
            active_cells.push(cells[i])
        } else if (!cells_living_neighbours[i][1] && cells_living_neighbours[i][0] === 3) {
            active_cells.push(cells[i])
        }
    }
}
