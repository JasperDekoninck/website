NEIGHBORS = [[0, 1], [1, 0], [-1, 0], [0, -1], [1, -1], [-1, 1], [1, 1], [-1, -1]]

main()

function main() {
    var game = {
        board: [], 
        currentTurn: 1,
        radiusElement: 40,
        done: false,
        depth: 2,
        onlyWin: false,
        AIPlayer: Math.round(Math.random()) + 1,
        relaxation: 0.05,
        canvas: document.getElementById("game-canvas"), 
        ctx: document.getElementById("game-canvas").getContext("2d")
    }

    // get variant
    var href = window.location.href.split("/")
    if (href[href.length - 1] === "") {
        var variant = href[href.length - 2]
    } else {
        var variant = href[href.length - 1]
    }
    if (variant.includes("easy")) {
        game.depth = 2
        game.onlyWin = true
    } else if (variant.includes("hard")) {
        game.depth = 6
    }

    initialize(game)
    if (game.AIPlayer == 1) {
        var move = minimax(game.board, game.board[0].length, game.AIPlayer, game.depth, game.relaxation, game.onlyWin)
        makeMove(game.board, move, game.AIPlayer)
        switchTurn(game)
    }
    drawBoard(game)
    game.canvas.addEventListener('mousedown', e => {
        var mousePos = getMousePos(game.canvas, e)
        handleClick(game, mousePos)
    });
}

function initialize(game) {
    for (var i = 0; i < 6; i++) {
        row = []
        for (var j = 0; j < 7; j++) {
            row.push(0)
        }
        game.board.push(row)
    }
}

function getMousePos(canvas, event) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: (event.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
        y: (event.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
    };
}

const delay = ms => new Promise(res => setTimeout(res, ms));

async function handleClick(game, pos) {
    if (game.done || game.AIPlayer == game.currentTurn) {
        return
    }
    var column = Math.floor((pos.x - 10) / (2 * game.radiusElement))
    var newElement = makeMove(game.board, column, game.currentTurn)
    if (newElement != null) {
        switchTurn(game)
        drawBoard(game)
        var done = checkDone(game.board, newElement)
        if (done[0] < 0) {
            var start = performance.now()
            var move = minimax(game.board, game.board[0].length, game.AIPlayer, game.depth, game.relaxation, game.onlyWin)
            if (performance.now() - start <= 500) {
                await delay(500 - performance.now() + start)
            }

            newElement = makeMove(game.board, move, game.AIPlayer)
            switchTurn(game)
            done = checkDone(game.board, newElement)
        }
        drawBoard(game)

        if (done[0] >= 0) {
            game.ctx.strokeStyle = 'rgb(255,69,0)';
            game.ctx.lineWidth = 5;
            game.ctx.beginPath();
            game.ctx.moveTo((done[1][1] * 2 + 1) * game.radiusElement + 10, (done[1][0] * 2 + 1) * game.radiusElement + 10);
            game.ctx.lineTo((done[2][1] * 2 + 1) * game.radiusElement + 10, (done[2][0] * 2 + 1) * game.radiusElement + 10);
            game.ctx.stroke();
            game.done = true
            document.getElementById("end-message").style.visibility = "visible"
            if (done[0] == game.AIPlayer) {
                document.getElementById("end-message").innerHTML = "AI won"
            } else if (done[0] != game.AIPlayer && done[0] > 0) {
                document.getElementById("end-message").innerHTML = "You won"
            } else {
                document.getElementById("end-message").innerHTML = "Draw"
            }
            end_game_no_score()
        }
    }
}

function checkDone(board, lastMove) {
    for (const stepNeighbor of NEIGHBORS) {
        neighbor1 = [lastMove[0] + stepNeighbor[0], lastMove[1] + stepNeighbor[1]]
        completed = 1
        while (0 <= neighbor1[0] && neighbor1[0] < board.length && 0 <= neighbor1[1] 
            && neighbor1[1] < board[0].length && board[neighbor1[0]][neighbor1[1]] == board[lastMove[0]][lastMove[1]]) {
                completed += 1
                neighbor1 = [neighbor1[0] + stepNeighbor[0], neighbor1[1] + stepNeighbor[1]]
        }
        neighbor2 = [lastMove[0] - stepNeighbor[0], lastMove[1] - stepNeighbor[1]]
        while (0 <= neighbor2[0] && neighbor2[0] < board.length && 0 <= neighbor2[1] 
            && neighbor2[1] < board[0].length && board[neighbor2[0]][neighbor2[1]] == board[lastMove[0]][lastMove[1]]) {
                completed += 1
                neighbor2 = [neighbor2[0] - stepNeighbor[0], neighbor2[1] - stepNeighbor[1]]
        }

        if (completed >= 4) {
            return [board[lastMove[0]][lastMove[1]], 
                    [neighbor1[0] - stepNeighbor[0], neighbor1[1] - stepNeighbor[1]], 
                    [neighbor2[0] + (completed - 3) * stepNeighbor[0], neighbor2[1] + (completed - 3) * stepNeighbor[1]]]
        }
       
    }

    var allMovesMade = true
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[i].length; j++) {
            if (board[i][j] == 0) {
                allMovesMade = false
                break
            }
        }
        if (!allMovesMade) {
            break
        }
    }
    if (allMovesMade) {
        return [0, null, null]
    }
    return [-1, null, null]
}

function switchTurn(game) {
    if (game.currentTurn == 1) {
        game.currentTurn = 2
    } else {
        game.currentTurn = 1
    }
}

function makeMove(board, column, player) {
    for (var i = board.length - 1; i >= 0; i--) {
        if (board[i][column] == 0) {
            board[i][column] = player
            return [i, column]
        }
    }
    return null
}


function rowCol(element, columns) {
    return [Math.round(element / columns), element % columns]
}

function giveValidMoves(board) {
    validMoves = []
    for (var i = 0; i < board[0].length; i++) {
        if (board[0][i] == 0) {
            validMoves.push(i)
        }
    }
    return validMoves
}

function countWindow(windowEl) {
    var countZeros = 0
    var countOnes = 0
    var countTwos = 0
    for (const el of windowEl) {
        if (el == 0) {
            countZeros += 1
        } else if (el == 1) {
            countOnes += 1
        } else if (el == 2) {
            countTwos += 1
        }
    }
    var count1 = 0
    var count2 = 0
    if (countOnes + countZeros == 4) {
        count1 = countOnes
    }
    if (countTwos + countZeros == 4) {
        count2 = countTwos
    }
    return [count1, count2]
}

function getWindow(board, elements) {
    var windowEl = []
    for (const element of elements) {
        windowEl.push(board[element[0]][element[1]])
    }
    return windowEl
}

function evaluateBoard(board, player, onlyWin) {
    var score = 0
    var count1 = [0, 0, 0, 0, 0]
    var count2 = [0, 0, 0, 0, 0]
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            if (i + 3 < board.length) {
                var window1 = getWindow(board, [[i, j], [i + 1, j], [i + 2, j], [i + 3, j]])
                var counting1 = countWindow(window1)
                count1[counting1[0]] += 1
                count2[counting1[1]] += 1
            }
            if (j + 3 < board[0].length) {
                var window2 = getWindow(board, [[i, j], [i, j + 1], [i, j + 2], [i, j + 3]])
                var counting2 = countWindow(window2)
                count1[counting2[0]] += 1
                count2[counting2[1]] += 1
            }
            if (i + 3 < board.length && j + 3 < board[0].length) {
                var window3 = getWindow(board, [[i, j], [i + 1, j + 1], [i + 2, j + 2], [i + 3, j + 3]])
                var counting3 = countWindow(window3)
                count1[counting3[0]] += 1
                count2[counting3[1]] += 1
            }
            if (i - 3 >= 0 && j + 3 < board[0].length) {
                var window4 = getWindow(board, [[i, j], [i - 1, j + 1], [i - 2, j + 2], [i - 3, j + 3]])
                var counting4 = countWindow(window4)
                count1[counting4[0]] += 1
                count2[counting4[1]] += 1
            }
        }
    }
    for (var i = 1; i < 5; i++) {
        if (i != 4 && !onlyWin) {
            score += count1[i] * 3 ** (i - 1) - count2[i] * 3 ** (i - 1)
        }  else if(i == 4) {
            score += count1[i] * 3 ** i - count2[i] * 3 ** i
        }
    }

    if (player == 2) {
        return - score / 100
    }
    return score / 100
}

function createCopyBoard(board) {
    newBoard = []
    for (var i = 0; i < board.length; i++) {
        row = []
        for (var j = 0; j < board[0].length; j++) {
            row.push(board[i][j])
        }
        newBoard.push(row)
    }
    return newBoard
}

function alphabeta(board, depth, alpha, beta, maximizingPlayer, player, newestElement, onlyWin) {
    if (depth == 0) {
        return [evaluateBoard(board, player, onlyWin), -1]
    }

    var checkingEnd = checkDone(board, newestElement)[0] > - 1
    if (checkingEnd) {
        return [evaluateBoard(board, player, onlyWin), -1]
    }

    if (maximizingPlayer) {
        var value = -100000000
        var bestMove = -1
        for (const move of giveValidMoves(board)) {
            var copyBoard = createCopyBoard(board)
            var position = makeMove(copyBoard, move, player)
            var valueNode = alphabeta(copyBoard, depth - 1, alpha, beta, false, player, position, onlyWin)
            if (valueNode[0] > value) {
                value = valueNode[0]
                bestMove = move
            }
            alpha = Math.max(alpha, valueNode[0])
            if (alpha >= beta) {
                break
            }
        }
    } else {
        var value = 10000000
        var bestMove = -1
        for (const move of giveValidMoves(board)) {
            var copyBoard = createCopyBoard(board)
            var position = makeMove(copyBoard, move, player % 2 + 1)
            var valueNode = alphabeta(copyBoard, depth - 1, alpha, beta, true, player, position, onlyWin) 
            if (value > valueNode[0]) {
                value = valueNode[0]
                bestMove = move
            }
            beta = Math.min(beta, valueNode[0])
            if (beta <= alpha) {
                break
            }
        }
    }

    return [0.995 * value, bestMove]
}

function minimax(board, cols, player, depth, relaxation, onlyWin) {
    var validMoves = giveValidMoves(board)
    var moveScore = []
    for (var i = 0; i < cols; i++) {
        moveScore.push(-100000)
    }
    for (const move of validMoves) {
        var copyBoard = createCopyBoard(board)
        var newestElement = makeMove(copyBoard, move, player)
        var valueNode = alphabeta(copyBoard, depth - 1, -10000000, 10000000, false, player, newestElement, onlyWin)
        moveScore[move] = valueNode[0]
    }
    var bestMoveScore = Math.max(...moveScore)
    var bestMoves = []
    for (const move of validMoves) {
        if (moveScore[move] >= bestMoveScore - relaxation) {
            bestMoves.push(move)
        }
    }
    return bestMoves[Math.floor(Math.random() * bestMoves.length)]
}

function drawBoard(game) {
    var grd = game.ctx.createRadialGradient(game.canvas.width / 2, game.canvas.height / 2, 10, 
                                            game.canvas.width / 2, game.canvas.height / 2, 500);
    grd.addColorStop(0, 'rgb(0, 0, 50)');
    grd.addColorStop(1, 'rgb(0, 0, 0)');
    game.ctx.fillStyle = grd;
    game.ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);
    for (var i = 0; i < 6; i++) {
        for (var j = 0; j < 7; j++) {
            pos = [10 + game.radiusElement + j * 2 * game.radiusElement, 
                    10 + game.radiusElement + i * 2 * game.radiusElement]
            game.ctx.beginPath();
            game.ctx.arc(pos[0], pos[1], game.radiusElement - 4, 0, 2 * Math.PI, false);
            if (game.board[i][j] == 0) {
                game.ctx.fillStyle = 'rgb(20, 20, 20)';
            } else if (game.board[i][j] == 1) {
                game.ctx.fillStyle = 'rgb(128, 128, 0)';
            } else {
                game.ctx.fillStyle = 'rgb(128, 0, 0)';
            }
            game.ctx.fill();
            game.ctx.lineWidth = 2;
            game.ctx.strokeStyle = 'rgb(0, 0, 139)';
            game.ctx.stroke();
        }
    }
}

