// some constants for the size of a square and the size of a border
const SIZE_SQUARE = 20
const SIZE_BORDER = 3
// this will ensure only one process at a time happens by supplying it as an id to each function
var called = 1

document.getElementById("width").value = Math.min(Math.round(window.innerWidth * 0.7 / SIZE_SQUARE), 30)
document.getElementById("height").value = Math.round(20 / 30 * Math.min(window.innerWidth * 0.7 / SIZE_SQUARE, 30))
var width = Number(document.getElementById("width").value)
var height = Number(document.getElementById("height").value)

var canvas = document.getElementById("generation-canvas")
var context = canvas.getContext("2d")

var START = [0, 0]
var END = [1, 1]
const NEIGHBOURS = [[-1, 0], [0, -1], [1, 0], [0, 1]]

var current_maze = []
var astar_solution = []
var user_solution = []

// variable keeping track of the previous length of the maze when drawn -> only updates drawing when necessary
var previous_length = 0
var a_star_length = 0
var user_length = 0

function getMousePos(canvas, event) {
    // Gets the mouse position withn the canvas
    var rect = canvas.getBoundingClientRect();
    return {
        x: (event.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
        y: (event.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
    };
}

// allows the user to interact with the maze
$("#generation-canvas").mousedown(function (event1) {
    var mouse_pos = getMousePos(canvas, event1)

    var mouse_square = [Math.floor(mouse_pos.y / SIZE_SQUARE), Math.floor(mouse_pos.x / SIZE_SQUARE)]
    if (event1.originalEvent.button === 0) { // left click
        if (!positionInList(mouse_square, user_solution)) {
            user_solution.push(mouse_square)
        }
    } else if (event1.originalEvent.button === 2) { // right click
        var index = positionInListIndex(mouse_square, user_solution)
        if (index > -1) {
            user_solution.splice(index, 1)
        }
    }
    // Dragging is possible -> state of all cells that are hovered changes
    $(this).mousemove(function (e) {
        var mouse_pos = getMousePos(canvas, e)
        var mouse_square = [Math.floor(mouse_pos.y / SIZE_SQUARE), Math.floor(mouse_pos.x / SIZE_SQUARE)]
        if (event1.originalEvent.button === 0) { // left click
            if (!positionInList(mouse_square, user_solution)) {
                user_solution.push(mouse_square)
            }
        } else if (event1.originalEvent.button === 2) { // right click
            var index = positionInListIndex(mouse_square, user_solution)
            if (index > -1) {
                user_solution.splice(index, 1)
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
        var mouse_square = [Math.floor(mouse_pos.y / SIZE_SQUARE), Math.floor(mouse_pos.x / SIZE_SQUARE)]
        if (!positionInList(mouse_square, user_solution)) {
            user_solution.push(mouse_square)
        }
    });


$("#maze-form").on("submit", function(e) {
    e.preventDefault()
    // called += 1 -> previous function stops running
    called += 1
    generate()
})

function download() {
    var dt = canvas.toDataURL('image/jpeg');
    this.href = dt;
    return false;
}
  
downloadLnk.addEventListener('click', download, false);

function changeCanvasSize(doReset) {
    width = Math.min(Number(document.getElementById("width").value), 50)
    height = Math.min(Number(document.getElementById("height").value), 50)
    canvas.style.width = SIZE_SQUARE * width
    canvas.style.height = SIZE_SQUARE * height
    canvas.width = SIZE_SQUARE * width
    canvas.height = SIZE_SQUARE * height
    canvas.style.border = "1px solid black"
    if (doReset) {
        reset()
    }
}

window.addEventListener('resize', function () {
    // resize canvas based on the size of the screen
    document.getElementById("width").value = Math.min(Math.round(window.innerWidth * 0.7 / SIZE_SQUARE), 30)
    document.getElementById("height").value = Math.round(20 / 30 * Math.min(window.innerWidth * 0.7 / SIZE_SQUARE, 30)) 
    changeCanvasSize(false)
}, false);

changeCanvasSize(true)

function reset() {
    current_maze = []
    astar_solution = []
    document.getElementById("astar-button").innerHTML = "Solve"
    user_solution = []

    previous_length = 0
    a_star_length = 0
    user_length = 0

    // fills everything with black
    context.fillStyle = "black";
    context.fillRect(0, 0, canvas.width, canvas.height);
}

function generate() {
    // constants necessary for the generation
    width = Math.min(Number(document.getElementById("width").value), 50)
    height = Math.min(Number(document.getElementById("height").value), 50)
    var algorithm = document.getElementById("sel1").value
    var timeout_ms = Number(document.getElementById("timeout").value)
    changeCanvasSize(true)
    canvas.style.border = "none"

    var maze = new Array(height)
    for (var i = 0; i < height; i++) {
        maze[i] = new Array(width).fill(0)
    }

    START = [0, 0]
    END = [height - 1, width - 1]

    if (algorithm === "depth-first") {
        generateDepthFirst(maze, START, END, height, width, timeout_ms, called)
    } else if (algorithm === "kruskal") {
        randomizedKruskal(START, END, height, width, timeout_ms, called)
    } else if (algorithm === "prim") {
        randomizedPrimsAlgorithm(START, END, height, width, timeout_ms, called)
    } else if (algorithm === "wilson") {
        WilsonsAlgorithm(START, END, height, width, timeout_ms, called)
    }

    return false
}

function timeout(ms) {
    // timeout that you can await to stop the function
    return new Promise(resolve => setTimeout(resolve, ms));
}

function drawCircle (width_element, height_element, color) {
    context.beginPath()
    context.fillStyle = color
    context.arc(width_element * SIZE_SQUARE + SIZE_SQUARE / 2, height_element * SIZE_SQUARE + SIZE_SQUARE / 2, 
                    SIZE_SQUARE / 2 - SIZE_BORDER, 0, 2 * Math.PI)
    context.fill()
}

function drawDoorway(from_element, to_element, color) {
    context.beginPath()
    context.fillStyle = color

    // determines how the doorway should go: from left to right, top to bottom, ...
    if (from_element[0] < to_element[0]) {
        var left_top = [from_element[1] * SIZE_SQUARE + SIZE_BORDER, from_element[0] * SIZE_SQUARE + SIZE_SQUARE / 2]
        var size = [SIZE_SQUARE - 2 * SIZE_BORDER, SIZE_SQUARE]
    } else if (from_element[1] < to_element[1]) {
        var left_top = [from_element[1] * SIZE_SQUARE + SIZE_SQUARE / 2, from_element[0] * SIZE_SQUARE + SIZE_BORDER]
        var size = [SIZE_SQUARE, SIZE_SQUARE  - 2 * SIZE_BORDER]
    } else if (to_element[0] < from_element[0]) {
        var left_top = [to_element[1] * SIZE_SQUARE + SIZE_BORDER, to_element[0] * SIZE_SQUARE + SIZE_SQUARE / 2]
        var size = [SIZE_SQUARE - 2 * SIZE_BORDER, SIZE_SQUARE]
    } else {
        var left_top = [to_element[1] * SIZE_SQUARE + SIZE_SQUARE / 2, to_element[0] * SIZE_SQUARE + SIZE_BORDER]
        var size = [SIZE_SQUARE, SIZE_SQUARE  - 2 * SIZE_BORDER]
    }

    context.rect(left_top[0], left_top[1], size[0], size[1])
    context.fill()
}

function draw() {
    if (previous_length != current_maze.length || a_star_length != astar_solution.length || 
        user_length != user_solution.length) {
        previous_length = current_maze.length
        a_star_length = astar_solution.length
        user_length = user_solution.length

        context.fillStyle = "black";
        context.fillRect(0, 0, canvas.width, canvas.height);
        for (const wall of current_maze) {
            // only draw if it is not in the astar solution or user solution, otherwise you get ugly squiggles
            var wall0_astar = positionInList(wall[0], astar_solution)
            var wall1_astar = positionInList(wall[1], astar_solution)
            var wall0_user = positionInList(wall[0], user_solution)
            var wall1_user = positionInList(wall[1], user_solution)
            if (!wall0_astar && !wall0_user) {
                drawCircle(wall[0][1], wall[0][0], "white")
            }
            if (!wall1_astar && !wall1_user) {
                drawCircle(wall[1][1], wall[1][0], "white")
            }
            drawDoorway(wall[0], wall[1], "white")

        }

        // Unfortunately this needs to be done as well, as some things are overwritten by doorways not in the solution
        for (var i = 0; i < user_length; i++) {
            drawCircle(user_solution[i][1], user_solution[i][0], "green")
            for (var j = 0; j < i; j++) {
                if (wallInWallList([user_solution[i], user_solution[j]], current_maze)) {
                    drawDoorway(user_solution[i], user_solution[j], "green")
                }
            }
        }

        for (var i = 0; i < a_star_length; i++) {
            drawCircle(astar_solution[i][1], astar_solution[i][0], "red")
            if (i < a_star_length - 1) {
                drawDoorway(astar_solution[i], astar_solution[i + 1], "red")
            }
        }

        if (a_star_length > 0) {
            drawDoorway([START[0] - 1, START[1]], START, "red")
            drawDoorway([END[0] + 1, END[1]], END, "red")
        } 
    } 
}

setInterval(draw, 1000 / 60)

function positionInListIndex (position, list) {
    // checks whether the given position is in the list
    for (var i = 0; i < list.length; i++) {
        var pos = list[i]
        if (pos[0] == position[0] && pos[1] == position[1]) {
            return i
        }
    }
    return -1;
}

function positionInList (position, list) {
    // checks whether the given position is in the list
    return positionInListIndex(position, list) > -1
}

function wallInWallList (wall, wall_list) {
    // checks whether the given position is in the list
    for (var i = 0; i < wall_list.length; i++) {
        var current_wall = wall_list[i]
        if (positionInList(wall[0], current_wall) && positionInList(wall[1], current_wall)) {
            return true
        }
    }
    return false
}



async function generateDepthFirst(maze, START, END, height, width, timeout_ms, called_here) {
    // greedy algorithm: depth first
    var stack = []
    stack.push(START)
    maze[START[0]][START[1]] = 1
    
    current_maze.push([[START[0] - 1, START[1]], START])
    current_maze.push([END, [END[0] + 1, END[1]]])

    info = {"maze": maze, "stack": stack}
    while (info.stack.length > 0) {
        depthFirstRecursion(info, NEIGHBOURS, height, width)
        if (timeout_ms > 0) {
            await timeout(timeout_ms)
        }
        // if the user has moved on to the following algorithm -> stop running
        if (called_here != called) {
            return
        }
    }
   
}

function depthFirstRecursion(info, NEIGHBOURS, height, width) {
    // function that is called as long as the maze is not finished generating
    if (info.stack.length === 0) {
        return true
    }
    // select the element that is currently on the stack
    var last_element = info.stack[info.stack.length - 1]
    var last_stack_free_neighbours = []
    for (const neighbour of NEIGHBOURS) {
        // checks all possible neighbours that are not visited yet
        var element = [last_element[0] + neighbour[0], last_element[1] + neighbour[1]]
        if (element[0] >= 0 && element[1] >= 0 && element[0] < height && element[1] < width && 
            info.maze[element[0]][element[1]] === 0) {
                last_stack_free_neighbours.push(element.slice())
            }
    }
    // chooses a random free neighbour if there is any, otherwise just remove the current element from the stack
    if (last_stack_free_neighbours.length === 0) {
        info.stack = info.stack.slice(0, info.stack.length - 1)
        return 
    }

    // chooses random neigbour of the element
    var random_free_neighbour = last_stack_free_neighbours[Math.floor(Math.random() * last_stack_free_neighbours.length)]
    
    // draw the doorway between the neigbour and the current element
    info.maze[random_free_neighbour[0]][random_free_neighbour[1]] = 1
    current_maze.push([last_element, random_free_neighbour])

    info.stack.push(random_free_neighbour)
    
    return
}


async function randomizedKruskal(START, END, height, width, timeout_ms, called_here) {
    // Implements the randomized Kruskal Algorithm
    
    current_maze.push([[START[0] - 1, START[1]], START])
    current_maze.push([END, [END[0] + 1, END[1]]])

    // keeping track of all groups
    var groups = []
    var walls = []
    // initializes walls: a list of all walls that exist between two neighbours
    for (var i = 0; i < height; i++) {
        for (var j = 0; j < width; j++) {
            groups.push([[i, j]])
            for (const neighbour of NEIGHBOURS) {
                var element = [i + neighbour[0], j + neighbour[1]]
                if (element[0] >= 0 && element[1] >= 0 && element[0] < height && element[1] < width) {
                        walls.push([[i, j], element])
                    }
            }
        }
    }

    // while there is more than one group (a full maze is connected), break a wall
    while (groups.length > 1) {
        if (called_here != called) {
            return
        }

        // Choose a random wall to break through, but only do that if the elements in the wall are not in the same 
        // group
        var random_index = Math.floor(Math.random() * walls.length)
        var random_wall = walls[random_index]

        // group of the start of the wall
        var start_index = -1
        // group of the end of the wall
        var end_index = -1
        // checking whether or not the elements alongside the wall are not in the same group
        for(var i = 0; i < groups.length; i++) {
            var group = groups[i]
            if (positionInList(random_wall[0], group)) {
                start_index = i
            }
            if (positionInList(random_wall[1], group)) {
                end_index = i
            }
        }

        // Break the wall if not to the same group
        if (start_index !== end_index) {
            // merge the groups
            for (const element of groups[end_index]) {
                groups[start_index].push(element)
            }
            current_maze.push(random_wall)

            if (timeout_ms > 0) {
                await timeout(timeout_ms)
            }
            // remove the group
            groups.splice(end_index, 1)
        }
        // remove the wall
        walls.splice(random_index, 1)
    }
}

async function randomizedPrimsAlgorithm(START, END, height, width, timeout_ms, called_here) {
    // Randomized Prim Algorithm

    current_maze.push([[START[0] - 1, START[1]], START])
    current_maze.push([END, [END[0] + 1, END[1]]])

    // keeping track of the cells that are visited and all walls that side with one element that has already been 
    // visited
    var visited = [START]
    var walls = []

    for (const neighbour of NEIGHBOURS) {
        var element = [START[0] + neighbour[0], START[1] + neighbour[1]]
        if (element[0] >= 0 && element[1] >= 0 && element[0] < height && element[1] < width) {
                walls.push([START, element])
            }
    }

    // As long as there exist walls that can be broken apart, break one of those walls
    while (walls.length > 0) {
        if (called_here != called) {
            return
        }
        var random_index = Math.floor(Math.random() * walls.length)
        var random_wall = walls[random_index]
        // make sure that the other end of the wall is not already visited
        if (!positionInList(random_wall[1], visited)) {
            // add all walls that surround the new element
            for (const neighbour of NEIGHBOURS) {
                var element = [random_wall[1][0] + neighbour[0], random_wall[1][1] + neighbour[1]]
                if (element[0] >= 0 && element[1] >= 0 && element[0] < height && element[1] < width) {
                        walls.push([random_wall[1], element])
                    }
            }
            current_maze.push(random_wall)
            if (timeout_ms > 0) {
                await timeout(timeout_ms)
            }
            visited.push(random_wall[1])
        } 
        // remove the wall
        walls.splice(random_index, 1)
    }
}


async function WilsonsAlgorithm(START, END, height, width, timeout_ms, called_here) {
    // Wilsons algorithm

    // Choose a random starting point
    var random_start = [Math.floor(Math.random() * height), Math.floor(Math.random() * width)]
    // Keeps track of all cells that are in the maze
    var cells_in_maze = [random_start]
    
    // as long as not all cells are in the maze, do a random walk and let it connect with the already existing maze
    // unless it makes a loop -> delete the random walk
    while (cells_in_maze.length < height * width) {
        // choose a random cell that has not yet been visited
        var random_cell = [Math.floor(Math.random() * height), Math.floor(Math.random() * width)]
        while (positionInList(random_cell, cells_in_maze)) {
            var random_cell = [Math.floor(Math.random() * height), Math.floor(Math.random() * width)]
        }
        var random_walk = [random_cell]

        // do the random walk
        while (true) {
            if (called_here != called) {
                return
            }
            var last_element = random_walk[random_walk.length - 1]
            var good_neighbours = []
            for (const neighbour of NEIGHBOURS) {
                var element = [last_element[0] + neighbour[0], last_element[1] + neighbour[1]]
                
                if (element[0] >= 0 && element[1] >= 0 && element[0] < height && element[1] < width) {
                    // we also make sure that it doesn't go back as this increases the speed of the algorithm
                    // drastically. however, the result of the algorithm will be slightly different than the ones of the 
                    // true Wilson Algorithm
                    if (random_walk.length <= 1 || element[0]!= random_walk[random_walk.length - 2][0] 
                        || element[1]!= random_walk[random_walk.length - 2][1]) {
                            good_neighbours.push(element.slice())
                        }
                }
            }
            // gets a random next neighbour
            var next = good_neighbours[Math.floor(Math.random() * good_neighbours.length)]

            // if the next neighbour is in the maze -> connect the maze
            if (positionInList(next, cells_in_maze)) {
                current_maze.push([last_element, next])

                for (const el of random_walk) {
                    cells_in_maze.push(el)
                }
                break
            } else if (positionInList(next, random_walk)) { // if there is a loop in the random walk -> remove it
                current_maze = current_maze.slice(0, current_maze.length - random_walk.length + 1)
                break
            } else {
                // continue the random walk
                random_walk.push(next)
                current_maze.push([last_element, next])
                if (timeout_ms > 0) {
                    await timeout(timeout_ms)
                }
            }
            
        }
    }
    current_maze.push([[START[0] - 1, START[1]], START])
    current_maze.push([END, [END[0] + 1, END[1]]])
}

function heuristic_cost_estimate(node, goal) {
    // an approximation of the cost from going to node to the goal
    return Math.abs(node[0] - goal[0]) + Math.abs(node[0] - goal[0])
}

function find_lowest_in_2d_matrix(open_nodes, matrix) {
    // based on open nodes, finds the node with the lowest value in f_score
    var lowest_open_node = []
    var lowest = 10 ** 30
    for (const open_node of open_nodes) {
        if (matrix[open_node[1]][open_node[0]] < lowest) {
            lowest_open_node = open_node.slice()
            lowest = matrix[open_node[1]][open_node[0]]
        } 
    }
    return lowest_open_node
}

function reconstruct_path(came_from, current) {
    // based on the best route given by came_from, returns a path
    var total_path = [current]
    while (Object.keys(came_from).includes(String(current.slice()))) {
        current = came_from[String(current.slice())]
        total_path.push(current)

    }
    return total_path
}

function Astar() {
    if (astar_solution.length > 0) {
        astar_solution = []
        document.getElementById("astar-button").innerHTML = "Solve"
        return false;
    }
    document.getElementById("astar-button").innerHTML = "Reset solution"
    var closed_nodes = [] // list of nodes already evaluated, right now it is empty
    var open_nodes = [START] // the nodes that are currently under evaluation
    var came_from = {} // for each node, its most efficient neighbour from where it can be reached

    // for each node th cost of getting from the START to that node
    var g_score = new Array(width)
    for (var i = 0; i < width; i++) {
        g_score[i] = new Array(height).fill(10 ** 30)
    } 
    g_score[START[1]][START[0]] = 0

    // For each node, the total cost of getting from the start node to the goal by passing by that node. That values
    // is partly known partly heuristic
    var f_score = new Array(width)
    for (var i = 0; i < width; i++) {
        f_score[i] = new Array(height).fill(10 ** 30)
    } 
    f_score[START[1]][START[0]] = heuristic_cost_estimate(START, END)

    while (open_nodes.length > 0) {
        // find the node to check next
        current = find_lowest_in_2d_matrix(open_nodes, f_score)

        // solution found
        if (current[0] === END[0] && current[1] === END[1]) {
            astar_solution = reconstruct_path(came_from, current).reverse()
            return
        }

        // mark the node as finished
        open_nodes.splice(positionInListIndex(current, open_nodes), 1)
        closed_nodes.push(current)

        for (const neighbour of NEIGHBOURS) {
            var element = [
                current[0] + neighbour[0],
                current[1] + neighbour[1]
            ]
            // Check if the two elements are in fact neighbours
            if (wallInWallList([current, element], current_maze)) {
                // add to open_nodes if not checked yet
                if (!positionInList(element, open_nodes) && !positionInList(element, closed_nodes)) {
                    open_nodes.push(element)
                } 

                // update the route if it was faster than the route now created (note that there is actually only
                // one route in all of these mazes, so...)
                var tentative_gscore = g_score[current[1]][current[0]] + 1
                if (tentative_gscore < g_score[element[1]][element[0]]) {
                    came_from[String(element.slice())] = current
                    g_score[element[1]][element[0]] = tentative_gscore
                    f_score[element[1]][element[0]] = g_score[element[1]][element[0]] +
                                                heuristic_cost_estimate(element, END)
                }
            }
        }
    }
}
