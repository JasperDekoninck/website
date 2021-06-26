toStartScreen();

function calculateSchulze(options, votes){
    /*calculate de volgorde van de options op basis van de gegeven votes
    :param options: list van strings, elke string geeft een bepaalde vote mogelijkheid weer
    :param votes: list van votes, elke vote is een string als A-B-C-D. 
    :pre Gaat ervan uit dat de votes mogelijk zijn (dus geen twee keer een A in de vote, geen onmogelijke
        options in de vote)
    :return Een list van listen. Elke list is een list van strings met de options die op die positie 
                                   geëindigd zijn.
    */

   // zet de votes om naar listen, dus van A-B-CD -> [A, B, CD]
    list_votes = [];
    for(var vote of votes){
        list_votes.push(split_vote(vote));
    }

    // De preferences matrix, op https://en.wikipedia.org/wiki/Schulze_method wordt dit genoteerd met d
    // element i, j van preferences geeft weer hoeveel mensen option i prefereren boven option j
    var preferences = []
    for(var option of options){
        var preference = [];
        for(var option2 of options){
            var total = 0;
            for(var vote of list_votes){
                // Als de option eerder voorkomt in de vote dan option2, een extra persoon gevonden
                if(search(vote, option) < search(vote, option2)){
                    total++;
                }
            }
            preference.push(total);
        }
        preferences.push(preference)
    }
    // calculatet de matrix van sterkste paden, op wikipedia genoteerd met p
    // het i, j -de element van de matrix bevat het sterkste pad van i naar j
    var strongest_path = calculateStrongestPaths(preferences)
    // Creëren van de ordening
    var ranking = []

    for(var i = 0; i < options.length; i++){
        var added = false;
        for(var j = 0; j < ranking.length; j++){
            var equally_good = true;
            for(var element = 0; element < ranking[j].length; element++){
                var index_element = options.indexOf(ranking[j][element]);
                // Inserten van de new options[i] voor ordening[j]
                // als deze beter is dan ordening[j] die nu op deze plaats staat
                if(strongest_path[index_element][i] < strongest_path[i][index_element]){
                    ranking.splice(j, 0, [options[i]]);
                    added = true;
                    equally_good = false;
                }
                // Als het slechter is dan één van de current elementen -> mag er niet in.
                else if(strongest_path[index_element][i] > strongest_path[i][index_element]){
                    equally_good = false;
                }
            }
            // Even goed als alle elementen die erin zitten -> toevoegen
            if(equally_good){
                ranking[j].push(options[i])
                added = true;
            }
            if (added){
                break;
            }
        }

        // Nog niet toegevoegd? -> Helemaal achteraan
        if(!added){
            ranking.push([options[i]])
        }
    }
    return ranking
}

function search(vote, option){
    /*Zoekt naar een bepaalde option in een vote en returned de index hiervan
    Returned -1 als de option niet in de vote voorkomt (wat niet zou mogen).
    */
    for(var i = 0; i < vote.length; i++){
        if(vote[i].includes(option)){
            return i;
        }
    }
    return -1;
}

function split_vote(vote){
    /*
    Splitst een vote op in een list bv. A-D-BC -> [A, D, BC]
     */
    var new_vote = [];
    var pref = "";
    for(var i of vote){
        if(" -_".includes(i)){
            new_vote.push(pref);
            pref = "";
        }
        else{
            pref += i
        }
    }
    if(pref !== ""){
        new_vote.push(pref);
    }
    return new_vote
}

function calculateStrongestPaths(preferences){
    /*
    calculatet de sterkste paden door gebruik te maken van het algoritme in 
    https://en.wikipedia.org/wiki/Schulze_method#Implementation
    */
    var strongest_path = [];

    for(var i=0; i<options.length; i++) {
        strongest_path[i] = new Array(options.length).fill(0);
    }

    for(var i=0; i < preferences.length; i++){
        for(var j=0; j < preferences.length; j++){
            if(i !== j && preferences[i][j] > preferences[j][i]){
                strongest_path[i][j] = preferences[i][j];
            }
        }
    }

    for(var i=0; i < preferences.length; i++){
        for(var j=0; j < preferences.length; j++){
            if(i !== j){
                for(var k=0; k < preferences.length; k++){
                    if(k !== j && i !== k){
                        strongest_path[j][k] = Math.max(strongest_path[j][k], Math.min(strongest_path[j][i], strongest_path[i][k]));
                    }
                }
            }
        }
    }
    return strongest_path;
}

// Variabelen om de options op te slagen
var options = []
const options_abbreviation = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

function insert_options_in_HTML(){
    /*
    Inserts de HTML code voor de options die al bestaan zodat de gebruiker deze ook kan removeen etc.
    */
    document.getElementById("current-options").innerHTML = ""
    
    for(var i = 0; i < options.length; i++){
        document.getElementById("current-options").innerHTML += `
        <div class="input-group standard-width-hight one-div-line">
                <div class="input-group-prepend">
                    <span class="option-list">
                    `+ options_abbreviation[i] + `
                    </span>
                </div>
            <span class="list-option-name">`+ options[i] + `</span>
            <button class="btn btn-primary" onclick='removeOption(`+ i +`)'>Remove</button>
        </div>
        `
    }
}

function addOption(){
    /*
    Voegt een option toe aan de options die bestaan
     */
    // Wegdoen van alle error-messages

    // De option die de gebruiker wilt toevoegen

    var option_element = document.getElementById("new-option")
    var option = option_element.value;
    
    // removeen van HTML content om ervoor te zorgen dat de user geen vage shit kan doen
    var regex = /(<([^>]+)>)/ig;
    option = option.replace(regex, "");
    // Geen naam is niet mogelijk om toe te voegen
    if (option === "") {
        option_element.classList.add("is-invalid")
        document.getElementById("add-option-invalid-feedback").innerHTML = "You cannot add an empty option."
        option_element.value = "";
        return false;
    }
    // Geen dubbele namen
    else if (options.indexOf(option) !== -1) {
        option_element.classList.add("is-invalid")
        document.getElementById("add-option-invalid-feedback").innerHTML = "This option has already been used."
        option_element.value = "";
        return false;
    }
    // Maximum 26 options
    else if(options.length === 26) {
        option_element.classList.add("is-invalid")
        document.getElementById("add-option-invalid-feedback").innerHTML = "You can add at most 26 options."
        option_element.value = "";
        return false;
    } else if (option.length > 255) {
        option_element.classList.add("is-invalid")
        document.getElementById("add-option-invalid-feedback").innerHTML = "Option name cannot have more than 255 characters."
        option_element.value = "";
        return false;
    }

    option_element.classList.remove("is-invalid")
    option_element.value = "";
    options.push(option);
    insert_options_in_HTML();
    return false;
}

function removeOption(index){
    /* removet een option op een gegeven index */
    options.splice(index, 1);
    insert_options_in_HTML();
}

function toVote(){
    /*Verander het scherm zodat de gebruiker votes kan invoeren */
    document.getElementById("start-screen").style.display = "none";
    document.getElementById("votes-screen").style.display = "block";
    insert_result_in_HTML();

    var el = document.getElementById("new-vote");
    el.select();
}

function insert_votes_in_HTML () {
    /* 
    Inserts de HTML Code voor de votes 
     */
    document.getElementById("current-votes").innerHTML = "";
    for(var i = 0; i < votes.length; i++){
        const plaats = i + 1;
        extra = ""

        if (i === 0) { 
            extra = "mt-2"
        }

        document.getElementById("current-votes").innerHTML += `
        <div class="input-group `+  extra  +` standard-width-hight" id="` + plaats + `">
                <div class="input-group-prepend">
                    <span class="input-group-text prepend-votes">
                    `+ plaats + `
                    </span>
                </div>
            <span class="form-control">`+ votes[i] + `</span>
            <button class="btn btn-primary" onclick='removeVote(`+ i +`)'>Remove</button>
        </div>
        `
    }
    // Scrollt helemaal naar beneden
    document.getElementById("votes-scroll").scrollTo(0, document.getElementById("votes-scroll").scrollHeight);
}

function insert_result_in_HTML(){
    /*
     * Inserts de HTML code om het current result weer te geven
     */
    document.getElementById("current-results").innerHTML = "";
    result = calculateSchulze(options_abbreviation.split("").splice(0, options.length), votes);
    for(var i = 0; i < result.length; i++){
        var plaats = i + 1;
        var extra_inner_HTML = `
            <div class="input-group list-result">
            `

        for(var j=0; j < result[i].length; j++){
            if(j === 0){
                extra_inner_HTML += `
                <p class="list-result-prepend">
                `+ plaats + `
                </p>
                <div class="list-option-result result-1">`+ options[options_abbreviation.split("").indexOf(result[i][j])] + "</div>"
            }
            else{
                extra_inner_HTML += `
                <p class="list-result-prepend" style="visibility: hidden;">
                `+ plaats + `
                </p>
                <div class="list-option-result result-1">` + options[options_abbreviation.split("").indexOf(result[i][j])] + "</div>"
            }
            extra_inner_HTML += `<p class="list-result-postend">
            `+ result[i][j] + `
            </p>`
        }
        extra_inner_HTML += " </div>"
        document.getElementById("current-results").innerHTML += extra_inner_HTML
    }
}

var votes = []

function strip_vote(vote){
    /*
    Stript een vote van alle tekens die erin mogen staan (bv. alle" - _" en één teken voor elke option abbreviation)
    */
    var stripped = vote.replace(/["-\s_"]/gi, "");
    var mogelijke_abbreviationen = options_abbreviation.slice(0, options.length);
    for(const mogelijke_abbreviation of mogelijke_abbreviationen){
        stripped = stripped.replace(mogelijke_abbreviation, "");
    }
    return stripped
}

function addVote(){
    /**
     * Voegt een vote toe aan de votes
     */
    var vote_element = document.getElementById("new-vote")
    var vote = vote_element.value;
    
    // error message als het geen valide vote is
    if(strip_vote(vote) !== ""){
        vote_element.classList.add("is-invalid")
        vote_element.value = "";
        return false;
    }
    var original_vote = vote
    // toevoegen van options die zijn weggelaten (door ze achteraan toe te voegen)
    var added = false;
    for(var option of options_abbreviation.substring(0, options.length)){
        if(!vote.includes(option)){
            if(added || original_vote.replace(/["-\s_"]/gi, "") === ""){
                vote += option;
            }
            else{
                added = true;
                vote += "-" + option;
            }
        }
    }

    vote_element.classList.remove("is-invalid")

    vote_element.value = "";
    votes.push(vote);
    insert_votes_in_HTML();
    insert_result_in_HTML();

    return false
}

function removeVote(index){
    /**
     * removet een vote
     */
    votes.splice(index, 1);
    insert_votes_in_HTML();
    insert_result_in_HTML();
}

function toStartScreen () {
    /**
     * Gaat naar het start scherm.
     */
    options = [];
    votes = [];
    document.getElementById("start-screen").style.display = "block";
    document.getElementById("votes-screen").style.display = "none";
    insert_options_in_HTML();
}
