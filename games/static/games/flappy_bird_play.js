$('#images-flappy').imagesLoaded( function() {
    main()
});

function main(){
    player = new Human()
    SCREEN_SIZE = [288, 404]
    START_POS_BIRD = [SCREEN_SIZE[0] * 0.2, 300]
    LENGTH_PIPES = 95
    DISTANCE_PIPES = 149
    HORIZONTAL_SPEED = 120
    JUMP_SPEED = -400
    MAX_DESCEND_SPEED = 2000
    GRAVITY = 1600
    FPS = 120
    TIME_UPDATE_SPRITE = 0.1
    birds = [new Bird(START_POS_BIRD, JUMP_SPEED, TIME_UPDATE_SPRITE, MAX_DESCEND_SPEED, HORIZONTAL_SPEED, player)]
    game = new Game(SCREEN_SIZE, birds, DISTANCE_PIPES, HORIZONTAL_SPEED, LENGTH_PIPES, GRAVITY, FPS, true, 
        true, false)

    document.addEventListener('keydown', function(e) {
        var code = e.key
        if (code === " ") {
            e.preventDefault() 
            for (const bird of game.birds) {
                if (bird.player.type === "human") {
                    bird.player.jump = true
                }
            }
        }
    })  

    canvas.addEventListener("mousedown", function(e) {
        e.preventDefault() 
        for (const bird of game.birds) {
            if (bird.player.type === "human") {
                bird.player.jump = true
            }
        }
    })

    setInterval(function() {
        game.step()
    }, 1000 / FPS)
}   

