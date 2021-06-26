main()

function main() {
    // get the variant of the game based on the href
    var href = window.location.href.split("/")
    if (href[href.length - 1] === "") {
        var variant = href[href.length - 2]
    } else {
        var variant = href[href.length - 1]
    }

    var game = {
        variant: variant,
        board_size: Number(variant.split("x")[0]), 
        n_bombs: 0, 
        size_square: 0, 
        COLORS: [
            "rgb(2, 0, 252)", 
            "rgb(1, 126, 2)", 
            "rgb(254, 0, 1)", 
            "rgb(1, 1, 128)", 
            "rgb(131, 1, 0)", 
            "rgb(128, 128, 0)", 
            "rgb(0, 0, 0)",
            "rgb(128, 128, 128)"
        ], 
        NEIGHBOURS: [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]],
        death: false,
        end: false,
        first_press: true,
        score_send: false,
        time: performance.now(), 
        timer: "", 
        pressTimer: null,
        pressTimeout: null,
        doneTimeout: false,
        board: [], 

    }

    // a calculation for the number of bombs
    game.n_bombs = Math.floor(game.board_size ** 2 / 6)

    document.getElementById("bombs").innerHTML = game.n_bombs

    // formula for the size of the squares -> not too small but not too big either
    game.size_square = Math.min(Math.max(30, 64 * 8 / game.board_size), 44)
    createBoard(game)
    document.getElementById("game-board").style.width = (game.size_square * game.board_size + 20).toString() + "px"
    game.timer = setInterval(function () {updateTimer(game)}, 10)
    
    
    for (const element of document.getElementsByName("score")) {
        element.value = -1;
    }
    
    drawBoard(game)
}

function updateTimer(game) {
    // only start time once the player has clicked for the first time on a button
    if (game.first_press) {
        game.time = performance.now()
    } else {
        var new_time = String(Math.round((performance.now() - game.time) / 100) / 10)
        if (! new_time.includes(".")) {
            new_time += ".0"
        }
        document.getElementById("time").innerHTML = new_time
    }
}


function createBoard (game) {
    game.board = new Array(game.board_size)
    for(var i=0; i<game.board_size; i++) {
        game.board[i] = new Array(game.board_size)
        
        for (var j=0; j < game.board_size; j++) {
            game.board[i][j] = new Array(2).fill(0)
        }
    }

    // add all bombs
    for (var i=0; i < game.n_bombs; i++) {
        var random_row = Math.floor(Math.random() * game.board_size)
        var random_column = Math.floor(Math.random() * game.board_size)
        while (game.board[random_row][random_column][1] === -2) {
            var random_row = Math.floor(Math.random() * game.board_size)
            var random_column = Math.floor(Math.random() * game.board_size)
        }
        game.board[random_row][random_column][1] = -2
    }

    // set the number of bombs as neighbours
    for (var i=0; i < game.board_size; i++) {
        for (var j=0; j < game.board_size; j++) {
            if (game.board[i][j][1] != -2) {
                for (const neighbour of game.NEIGHBOURS) {
                    var element = [i + neighbour[0], j + neighbour[1]]
                    if (element[0] < game.board_size && element[0] >= 0 && element[1] < game.board_size && element[1] >= 0 
                        && game.board[element[0]][element[1]][1] === -2) {
                            game.board[i][j][1] += 1
                    }
                }
            } 
        }
    }
}


function HTMLButton (i, j, game) {
    // create the HTML of a button
    var extra_style = `line-height: ${game.size_square}px; font-size: ${game.size_square / 4 * 3}px;`
    if (i === 0) {
        extra_style += "border-top-width: 2px;"
    } else if (i === game.board_size - 1) {
        extra_style += "border-bottom-width: 2px;"  
    }

    if (j === 0) {
        extra_style += "border-left-width: 2px;"
    } else if (j === game.board_size - 1) {
        extra_style += "border-right-width: 2px;"  
    }
    var element = game.board[i][j]
    var HTML_style = `style='width: ${game.size_square}px; height: ${game.size_square}px; ${extra_style};'`
    var HTML_image = `style='width: ${game.size_square - 5}px; height: ${game.size_square - 5}px; display:block; margin: auto; margin-top: 2px;'`
    if (element[0] === -1) { // flag
        return `<div id='${i}-${j}' class="field empty" ${HTML_style}><img src="/media/games/minesweeper/flag.png" ${HTML_image}></img></div>`
    } else if (element[0] === 0) { // invisible field
        return `<div id='${i}-${j}' class="field empty" ${HTML_style}></div>`
    } else if (element[1] === -2) { //bomb that is shown
        return `<div id='${i}-${j}' class="field empty" ${HTML_style}><img src="/media/games/minesweeper/bomb.png" ${HTML_image}></img></div>`
    } else if (element[1] > 0) { // visible field with more than 0 neighbouring bombs
        HTML_style = HTML_style.substring(0, HTML_style.length - 1) + `; color:${game.COLORS[element[1] - 1]}'`
        return `<div id='${i}-${j}'  class="field number" ${HTML_style}>${element[1]}</div>`
    } else {
        return `<div id='${i}-${j}' class="field number" ${HTML_style}></div>`
    }
}

function touchendFunction(i, j, game) {
    function output(e) {
        clearTimeout(game.pressTimeout)
        var button_function = pressButton(i, j, game)
        if (performance.now() - game.pressTimer < 300 && !game.doneTimeout) {
            button_function()
        } 
        game.doneTimeout = false
        return false;
    }
    return output
}

function touchstartFunction(i, j, game) {
    function output(e) {
        var flag_function = addFlag(i, j, game)
        game.pressTimeout = setTimeout(flag_function, 300)
        game.pressTimer = performance.now()
        return false
    }
    return output
}

function drawBoard(game) {
    var div = document.getElementById("game-board")
    new_HTML = ""
    for (var i = 0; i < game.board_size; i++) {
        new_HTML += `<div class='button-row'>`
        for (var j = 0; j < game.board_size; j++) {
            new_HTML += HTMLButton(i, j, game)
        }
        new_HTML += "</div>"
    }
    div.innerHTML = new_HTML
    var total_flags = 0
    for (var i = 0; i < game.board_size; i++) {
        for (var j = 0; j < game.board_size; j++) {
            if (game.board[i][j][0] === 0) {
                var button_function = pressButton(i, j, game)
                var flag_function = addFlag(i, j, game)
                var touchend = touchendFunction(i, j, game)
                var touchstart = touchstartFunction(i, j, game)
                document.getElementById(`${i}-${j}`).onclick = button_function
                document.getElementById(`${i}-${j}`).addEventListener("touchstart", touchstart)
                document.getElementById(`${i}-${j}`).addEventListener("touchend", touchend)
                document.getElementById(`${i}-${j}`).addEventListener("touchmove", function() {game.doneTimeout = true; clearTimeout(game.pressTimeout)})
                document.getElementById(`${i}-${j}`).oncontextmenu = flag_function
                document.getElementById(`${i}-${j}`).style.cursor = "pointer"
            } else if (game.board[i][j][0] === -1) {
                total_flags += 1
                var flag_function = removeFlag(i, j, game)
                document.getElementById(`${i}-${j}`).oncontextmenu = flag_function
                document.getElementById(`${i}-${j}`).style.cursor = "pointer"
            } else if (game.board[i][j][0] === 1) {
                // reveal everything around it button
                var pressed_button_function = pressShowedButton(i, j, game) 
                document.getElementById(`${i}-${j}`).onclick = pressed_button_function
                // check whether or not the style of the cursor should be changed (indicate user can press it)
                var n_flags = 0
                var hidden_element = false
                for (const neighbour of game.NEIGHBOURS) {
                    var element = [i + neighbour[0], j + neighbour[1]]
                    if (element[0] < game.board_size && element[0] >= 0 && element[1] < game.board_size && element[1] >= 0) {
                        if (game.board[element[0]][element[1]][0] === -1) {
                            n_flags += 1
                        } else if (game.board[element[0]][element[1]][0] === 0) {
                            hidden_element = true
                        }
                    }
                }
                if (game.board[i][j][1] === n_flags && hidden_element) {
                    document.getElementById(`${i}-${j}`).style.cursor = "pointer"
                }
            }
        }
    }

    document.getElementById("bombs").innerHTML = game.n_bombs - total_flags
}

function revealElement(i, j, game) {
    // reveals an element
    if (game.board[i][j][1] === -2) {
        game.death = true // bomb is shown -> death
        for (var i=0; i < game.board_size; i++) {
            for (var j=0; j < game.board_size; j++) {
                game.board[i][j][0] = 1
            }
        }
    } else if (game.board[i][j][1] === 0) { // empty element -> reveal more than just this one
        game.board[i][j][0] = 1

        for (const neighbour of game.NEIGHBOURS) {
            var element = [i + neighbour[0], j + neighbour[1]]
            if (element[0] < game.board_size && element[0] >= 0 && element[1] < game.board_size && element[1] >= 0 &&
                game.board[element[0]][element[1]][0] === 0) {
                    revealElement(element[0], element[1], game)  // iteratively show elements
            }
        }
    } else {
        game.board[i][j][0] = 1
    }
}

function checkEnd (game) {
    // check if the game is finished
    game.end = true
    var flags = 0
    for (var i=0; i < game.board_size; i++) {
        for (var j=0; j < game.board_size; j++) {
            if (game.board[i][j][0] === 0) {
                game.end = false
            } else if (game.board[i][j][0] === -1) {
                flags += 1
            }
        }
    }
    if (flags > game.n_bombs) {
        game.end = false
    }
    if (game.end) {

        clearInterval(game.timer)

        if (!game.score_send && !game.death) {
            var score = Math.round((performance.now() - game.time) / 10) / 100
            end_game(score)
            game.score_send = true
        } else if (!game.score_send) {
            end_game_no_score()
            game.score_send = true
        }
    }
}

function retry_possible (game) {
    // checks whether or not it is possible to automatically 'retry': at first press automatically retry if
    // the element shown is a bomb or just one element is revealed (it's just stupid if that happens)
    if (!game.first_press){
        return false
    }

    var n_revealed = 0
    for (var k=0; k < game.board.length; k++) {
        for (var l=0; l < game.board[k].length; l++) {
            if (game.board[k][l][0] > 0) {
                n_revealed += 1
                if (game.board[k][l][1] === -2) {
                    return true
                }
            }
        }
    }
    return n_revealed <= 1
}

function pressButton (i, j, game) {
    function output () {
        revealElement(i, j, game)
        while(retry_possible(game)) {
            game.death = false
            game.end = false
            game.score_send = false
            createBoard(game)
            revealElement(i, j, game)
        }
        checkEnd(game)
        game.first_press = false
        drawBoard(game)
        return false
    }
    return output
}

function addFlag (i, j, game) {
    function output () {
        game.board[i][j][0] = -1
        drawBoard(game)
        checkEnd(game)
        return false
    }
    return output
}

function removeFlag (i, j, game) {
    function output () {
        game.board[i][j][0] = 0
        drawBoard(game)
        return false
    }
    return output
}


function pressShowedButton(i, j, game) {
    function output () {
        var n_flags = 0
        for (const neighbour of game.NEIGHBOURS) {
            var element = [i + neighbour[0], j + neighbour[1]]
            if (element[0] < game.board_size && element[0] >= 0 && element[1] < game.board_size && element[1] >= 0 &&
                 game.board[element[0]][element[1]][0] === -1) {
                   n_flags += 1
            }
        }
        if (game.board[i][j][0] === 1 && game.board[i][j][1] === n_flags) {
            for (const neighbour of game.NEIGHBOURS) {
                var element = [i + neighbour[0], j + neighbour[1]]
                if (element[0] < game.board_size && element[0] >= 0 && element[1] < game.board_size && element[1] >= 0 &&
                    game.board[element[0]][element[1]][0] !== -1) {
                       revealElement(element[0], element[1], game)
                       checkEnd(game)
                }
            }
        }
        drawBoard(game)
        return false
    }
    return output
}
