function end_game(score) {
    for (const element of document.getElementsByName("score")) {
        element.value = score;
    }

    document.getElementById("end-buttons").style.visibility = "visible"
    if (document.getElementById("submit-score-not-logged") != null) {
        document.getElementById("submit-score-not-logged").style.visibility = "visible"
    }
    
    document.getElementById("highscore-button").style.visibility = "visible"

    var csrf = document.getElementsByName("csrfmiddlewaretoken")[0]
    if (csrf) {
        var data = [
            {"name": "csrfmiddlewaretoken", "value": csrf.value},
            {"name": "score", "value": score}, 
            {"name": "id", "value": document.getElementById("id-score").innerHTML}
        ]
        $.ajax({
            type : "POST", // http method
            data: data
        })
    }
}

function end_game_no_score() {
    document.getElementById("end-buttons").style.visibility = "visible"
    if (document.getElementById("submit-score-not-logged") != null) {
        document.getElementById("submit-score-not-logged").style.visibility = "hidden"
    } 
    if (document.getElementById("highscore-button") != null) {
        document.getElementById("highscore-button").style.visibility = "hidden"
    }
}