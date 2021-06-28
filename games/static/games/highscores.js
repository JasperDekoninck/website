all_variants = []
calculate(true)

function calculate (game_change) {
    game = document.getElementById("sel1").value
    variant = document.getElementById("sel2").value
    if (document.getElementById("sel3")) {
        ranking = document.getElementById("sel3").value
    } else {
        ranking = "global"
    }

    if (document.getElementById("sel5")) {
        own_or_all = document.getElementById("sel5").value
    } else {
        own_or_all = "all"
    }

    show = document.getElementById("sel4").value

    if (all_variants.length === 0) {
        for (const element of document.getElementById("sel2").getElementsByTagName("option")) {
            all_variants.push(element)
        }

        ex_variant = document.getElementById("variant-post").innerHTML
        ex_game = document.getElementById("game-post").innerHTML

        if (ex_variant !== "") {
            variant = ex_variant
            game = ex_game
            document.getElementById('sel1').value = game
            document.getElementById('sel2').value = variant
            game_change = false
        }
    }

    if (game_change) {
        all_tags = document.getElementById("sel2").getElementsByTagName("option")
        length = all_tags.length
    
        for (var i = 0; i < length; i++) {
            document.getElementById("sel2").remove(0)
        }
    
        for (const variant of all_variants ) {
            if (variant.id.startsWith(game + "-")) {
                document.getElementById("sel2").add(variant)
            }
        }
        all_tags = document.getElementById("sel2").getElementsByTagName("option")
        variant = all_tags[0].value
        document.getElementById('sel2').value = variant
    }
    

    if (ranking === "global") {
        document.getElementById("friends").style.display = "none"
        document.getElementById("unique-friends").style.display = "none"
        document.getElementById("global").style.display = "block"
        document.getElementById("unique-global").style.display = "block"
        document.getElementById("friends-own").style.display = "none"
        document.getElementById("unique-friends-own").style.display = "none"
        document.getElementById("global-own").style.display = "block"
        document.getElementById("unique-global-own").style.display = "block"
    } else {
        document.getElementById("friends").style.display = "block"
        document.getElementById("unique-friends").style.display = "block"
        document.getElementById("global").style.display = "none"
        document.getElementById("unique-global").style.display = "none"
        document.getElementById("friends-own").style.display = "block"
        document.getElementById("unique-friends-own").style.display = "block"
        document.getElementById("global-own").style.display = "none"
        document.getElementById("unique-global-own").style.display = "none"
    }
    if (show === "10") {
        document.getElementById("unique-friends").style.display = "none"
        document.getElementById("unique-global").style.display = "none"
        document.getElementById("unique-friends-own").style.display = "none"
        document.getElementById("unique-global-own").style.display = "none"
    } else {
        document.getElementById("friends").style.display = "none"
        document.getElementById("global").style.display = "none"
        document.getElementById("friends-own").style.display = "none"
        document.getElementById("global-own").style.display = "none"
    }

    if (own_or_all === "all") {
        document.getElementById("friends-own").style.display = "none"
        document.getElementById("unique-friends-own").style.display = "none"
        document.getElementById("global-own").style.display = "none"
        document.getElementById("unique-global-own").style.display = "none"
    } else {
        document.getElementById("friends").style.display = "none"
        document.getElementById("unique-friends").style.display = "none"
        document.getElementById("global").style.display = "none"
        document.getElementById("unique-global").style.display = "none"
    }

    highscore_divs = document.getElementsByClassName("highscore-div")
    for (const div of highscore_divs) {
        if (div.id.endsWith("-" + variant)) {
            div.style.display = "block"
        } else {
            div.style.display = "none"
        }
    }
}