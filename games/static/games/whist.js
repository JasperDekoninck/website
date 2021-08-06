const SUITS = ["spades", "diamonds", "clubs", "hearts"]
const TIME_BETWEEN_ACTIONS = 600

const TYPE = {
    AI: 0, 
    HUMAN: 1
}

const POSSIBILITIES = {
    Pass: 0, 
    Ask: 1, 
    Follow: 2, 
    Abondance_Spades: 3, 
    Abondance_Diamonds: 4, 
    Abondance_Clubs: 5, 
    Abondance_Hearts: 6, 
    Misery: 7,
    Open_Misery: 8, 
    Grand_Slam_Spades: 9, 
    Grand_Slam_Diamonds: 10, 
    Grand_Slam_Clubs: 11, 
    Grand_Slam_Hearts: 12, 
    Trull: 13
}

class Card {
    constructor(rank, suit) {
        this.rank = rank
        this.suit = suit
    }

    getValue() {
        if (this.rank === 1) {
            return 14
        }
        return this.rank
    }

    getSortingValue() {
        return this.suit * 15 + this.getValue()
    }
}

class Deck {
    constructor() {
        this.cards = []
        for (var rank = 1; rank < 14; rank++) {
            for (var suit = 0; suit < 4; suit++) {
                this.cards.push(new Card(rank, suit))
            }
        }
    }

    shuffle() {
        this.cards = this.cards.sort(() => Math.random() - 0.5)
    }

    redeck() {
        var index = Math.floor(Math.random() * this.cards.length)
        this.cards = this.cards.slice(index, this.cards.length).concat(this.cards.slice(0, index))
    }

    addCard(card) {
        this.cards.push(card)
    }

    popCard() {
        this.cards.pop()
    }

    removeCard(card) {
        this.cards.splice(this.cards.findIndex(findExact(card)), 1)
    }
}

class Hand {
    constructor(type, name) {
        this.cards = []
        this.type = type
        this.score_game = 0
        this.overall_score = 0
        this.name = name
        this.possibility = null
    }

    reset() {
        this.possibility = null
        this.cards = []
        this.score_game = 0
    }

    addCard(card) {
        this.cards.push(card)
    }

    removeCard(card) {
        this.cards.splice(this.cards.findIndex(findExact(card)), 1)
    }

    sortCards() {
        this.cards = this.cards.sort((card1, card2) => card1.getSortingValue() - card2.getSortingValue())
    }
}

class Dealer {
    constructor(deck, hands, nDealCards) {
        this.deck = deck
        this.hands = hands
        this.nDealCards = nDealCards
    }

    dealOne(hand) {
        var card = this.deck.cards[this.deck.cards.length - 1]
        hand.addCard(card)
        this.deck.popCard()
    }

    deal() {
        for(var i = 0; i < this.nDealCards; i++) {
            for(const hand of this.hands) {
                this.dealOne(hand)
            }
        }
    }

    retrieveAll() {
        for(const hand of this.hands) {
            for (const card of hand.cards) {
                this.deck.addCard(card)
            }
            hand.cards = []
        }
    }
}

class Trick {
    constructor(trump) {
        this.cards_hands = []
        this.trump = trump
        this.extra_suit_requirement = null
        this.extra_rank_requirement = null
    }

    addCard(card, hand) {
        this.cards_hands.push([card, hand])
    }

    returnToDeck(deck) {
        for(const card_hand of this.cards_hands) {
            deck.addCard(card_hand[0])
        }
    }

    allowedCards(hand) {
        var suit_cards = []
        for (const card of hand.cards) {
            if (this.cards_hands.length === 0 || this.cards_hands[0][0].suit === card.suit) {
                if (this.extra_suit_requirement === null || card.suit === this.extra_suit_requirement) {
                    if (this.cards_hands.length > 0 || this.extra_rank_requirement === null || card.rank == this.extra_rank_requirement) {
                        suit_cards.push(card)
                    }
                }
            }
        }

        if (suit_cards.length === 0) {
            return hand.cards
        }

        return suit_cards
    }

    clearCards() {
        this.cards_hands = []
    }

    scoreCard(card) {
        if (this.trump !== null) {
            return card.getValue() * ((card.suit === this.trump) * 15 + (card.suit === this.cards_hands[0][0].suit))
        } else {
            return card.getValue() * (card.suit === this.cards_hands[0][0].suit)

        }
    }

    decideWinner() {
        var max_val = -100
        var max_card_hand = null
        for (const card_hand of this.cards_hands) {
            var score = this.scoreCard(card_hand[0])
            if (score > max_val) {
                max_val = score
                max_card_hand = card_hand
            }
        }
        return max_card_hand[1]
    }
}

class AIDecider {
    constructor(hand) {
        this.hand = hand
    }

    decide(trick) {
        var cardsAllowed = trick.allowedCards(this.hand)
        var index = Math.floor(Math.random() * cardsAllowed.length)
        return cardsAllowed[index]
    }

    decide_possibility(whist) {
        if (this.hand.possibility !== null) {
            return POSSIBILITIES.Pass
        } else {
            return POSSIBILITIES.Pass
        }   
    }
}


class UIHandler {
    constructor() {

    }

    HTMLCard(card, clickable, before_id) {
        if (clickable) {
            return `
            <a class="clickable-card card ${SUITS[card.suit]} rank-${card.rank}" id="${before_id}-${card.rank}-${card.suit}">
                <span class="rank-symbol-1"></span>
                <span class="suit-symbol-1"></span>
                <span class="suit-symbol-2"></span>
                <span class="suit-symbol-3"></span>
                <span class="rank-symbol-2"></span>
            </a>`
        } else {
            return `
            <div class="card ${SUITS[card.suit]} rank-${card.rank}" id="${before_id}-${card.rank}-${card.suit}">
                <span class="rank-symbol-1"></span>
                <span class="suit-symbol-1"></span>
                <span class="suit-symbol-2"></span>
                <span class="suit-symbol-3"></span>
                <span class="rank-symbol-2"></span>
            </div>`
        }
    }

    changeName(index, name) {
        document.getElementById("name-player-" + index.toString()).innerHTML = name
    }

    setOptionFunction(whist) {
        $(".option").click(function() {
            if (whist.allowedPossibilities().includes(Number($(this).attr("value"))) && whist.turn == 0) {
                whist.hands[0].possibility = Number($(this).attr("value"))
                document.getElementById(`choice-player-info-${whist.turn}`).innerHTML = Object.keys(POSSIBILITIES)[Number($(this).attr("value"))].replaceAll("_", " ")
                whist.updateStartRound()
                document.getElementById("choice-menu-1").style.display = "none"
            }
        })
    }

    removeDisabledOption() {
        $(".option").each(function() {
            $(this).removeClass("disabled")
        });
    }

    setOption2Function(whist) {
        $(".option-2").click(function() {
            if (whist.turn == 0) {
                whist.hands[0].possibility = Number($(this).attr("value"))
                document.getElementById(`choice-player-info-${whist.turn}`).innerHTML = Object.keys(POSSIBILITIES)[Number($(this).attr("value"))].replaceAll("_", " ")
                whist.updateStartRound()
                document.getElementById("choice-menu-2").style.display = "none"
            }
        })
    }

    setTurnImages(turn, start_turn) {
        for (var i = 0; i < 4; i++) {
            if (i === turn) {
                $("#turn-player-" + i.toString()).removeClass("not-turn-player")
                $("#turn-player-" + i.toString()).addClass("turn-player")
            } else {
                $("#turn-player-" + i.toString()).addClass("not-turn-player")
                if ($("#turn-player-" + i.toString()).attr("class").includes("turn-player")) {
                    $("#turn-player-" + i.toString()).removeClass("turn-player")
                }
            }

            if (i === (start_turn + 3) % 4) {
                $("#dealer-player-" + i.toString()).removeClass("not-dealer-player")
                $("#dealer-player-" + i.toString()).addClass("dealer-player")
            } else {
                $("#dealer-player-" + i.toString()).addClass("not-dealer-player")
                if ($("#dealer-player-" + i.toString()).attr("class").includes("dealer-player")) {
                    $("#dealer-player-" + i.toString()).removeClass("dealer-player")
                }
            }
        }
    }

    showHand(hand, whist) {
        var html_element = document.getElementById("hand-player")
        html_element.innerHTML = ""
        for (const card of hand.cards) {
            html_element.innerHTML += this.HTMLCard(card, true, "hand")
        }
        $(".clickable-card").click(function() {
            var classList = $(this).attr("class")
            var classArr = classList.split(/\s+/)
            var suit = SUITS.findIndex(findExact(classArr[2]))
            var rank = Number(classArr[3].split("-")[1])
            for (const card of whist.hands[0].cards) {
                if (card.suit === suit && card.rank === rank) {
                    whist.humanPlayCard(card)
                }
            }
        })
    }

    atStart(whist) {
        this.setHTMLPreviousTrick(whist.previous_trick)
        this.removeAnimationsCards()
        for (var i = 0; i < 4; i++) {
            document.getElementById(`score-player-now-${i}`).innerHTML = 0
            document.getElementById(`choice-player-info-${i}`).innerHTML = ""
        }
        document.getElementById("trump-card").innerHTML = this.HTMLCard(whist.trump_card, false, "trump")
        this.setTurnImages(whist.turn, whist.start_turn)
        this.showHand(whist.hands[0], whist)
        this.removeDisabledOption()
    }

    handlePlayCardHuman(card, hand) {
        $(`#hand-${card.rank}-${card.suit}`).addClass("animation-card")
        $(`#hand-${card.rank}-${card.suit} span`).addClass("animation-card-text")
        $(`#hand-${card.rank}-${card.suit}`).click(function() {})
        for (const card of hand.cards) {
            $(`#hand-${card.rank}-${card.suit}`).removeClass("disabled")
        }
    }

    removeAnimationsCards() {
        for (var turn = 0; turn < 4; turn++) {
            if ($("#card-turn-" + turn.toString()).hasClass("animate")) {
                $("#card-turn-" + turn.toString()).removeClass("animate")
            }
        }
    }

    throwCard(card, turn) {
        document.getElementById("card-turn-" + turn.toString()).innerHTML = this.HTMLCard(card, false, "trick")
        $("#card-turn-" + turn.toString()).addClass("animate")
    }

    setHTMLPreviousTrick(previous_trick) {
        for(var i = 0; i < 4; i++) {
            if (previous_trick.cards_hands[i]) {
                document.getElementById(`trick-card-${i}`).innerHTML = this.HTMLCard(previous_trick.cards_hands[i][0], false, "previous")
            } else {
                document.getElementById(`trick-card-${i}`).innerHTML = ""
            }
        }
    }

    endTrick(hands, previous_trick) {
        for (var i = 0; i < 4; i++) {
            document.getElementById(`score-player-now-${i}`).innerHTML = hands[i].score_game
        }
        for(var turn = 0; turn < 4; turn++) {
            document.getElementById("card-turn-" + turn.toString()).innerHTML = ""
        }
        this.setHTMLPreviousTrick(previous_trick)
    }

    updateOverallScore(hands) {
        for (var i = 0; i < 4; i++) {
            document.getElementById(`score-player-overall-${i}`).innerHTML = hands[i].overall_score
        }
    }

    showAskAgainChoiceMenu() {
        document.getElementById("choice-menu-2").style.display = "block"
    }

    showMainOptionMenu() {
        document.getElementById("choice-menu-1").style.display = "block"
    }

    updateTrumpCard(trump_card) {
        if (trump_card === null) {
            document.getElementById("trump-card").innerHTML = ""
            document.getElementById("trump-card-info").innerHTML = "No trump"
        } else {
            document.getElementById("trump-card").innerHTML = this.HTMLCard(trump_card, false, "trump")
        }
    }

    updateChoicePlayer(index, choice) {
        document.getElementById(`choice-player-info-${index}`).innerHTML = Object.keys(POSSIBILITIES)[choice].replaceAll("_", " ")
    }

    disableNotAllowedCards(current_trick, hand) {
        var allowedCards = current_trick.allowedCards(hand)
        for (const card of hand.cards) {
            if (!allowedCards.includes(card)) {
                $(`#hand-${card.rank}-${card.suit}`).addClass("disabled")
            }
        }
    }

    disableNotAllowedOptions(allowed) {
        $(".option").each(function() {
            if (!allowed.includes(Number($(this).attr("value")))) {
                $(this).addClass("disabled")
            }
        });
    }
}

class Whist {
    constructor(handle_ui) {
        this.deck = new Deck()
        this.deck.shuffle()
        this.trump = this.deck.cards[0].suit
        this.handle_ui = handle_ui
        this.uihandler = new UIHandler()
        this.trump_card = this.deck.cards[0]
        this.hands = [new Hand(TYPE.HUMAN, "You"), 
                        new Hand(TYPE.AI, "Harry"),
                        new Hand(TYPE.AI, "Ron"), 
                        new Hand(TYPE.AI, "Hermione")]
        this.ais = [null, new AIDecider(this.hands[1]), new AIDecider(this.hands[2]), new AIDecider(this.hands[3])]
        this.dealer = new Dealer(this.deck, this.hands, 13)
        this.turn = 0
        this.start_turn = -1
        this.start_round = true
        this.start_round_chosen = 0
        this.current_trick = new Trick(this.trump)
        this.previous_trick = new Trick(this.trump)
        this.asked_again = false
        
        this.time_last_action = performance.now() - TIME_BETWEEN_ACTIONS
        this.ended = false
        this.start()

        if (this.handle_ui) {
            for (var i = 0; i < 4; i++) {
                this.uihandler.changeName(i, this.hands[i].name)
            }
            this.uihandler.setOptionFunction(this)
            this.uihandler.setOption2Function(this)
        }
    }

    getVariant() {
        var id_variant = 0
        for (var hand of this.hands) {
            if (hand.possibility !== null && hand.possibility > id_variant) {
                id_variant = hand.possibility
            }
        }
        return id_variant
    }

    allowedPossibilities() {
        var max_score = this.getVariant()
        if (max_score === POSSIBILITIES.Abondance_Spades + this.trump) {
            max_score = POSSIBILITIES.Abondance_Hearts + 0.5
        } else if (max_score === POSSIBILITIES.Grand_Slam_Spades + this.trump) {
            max_score = POSSIBILITIES.Grand_Slam_Hearts + 0.5
        }

        var allowed = [0]
        for (var i=0; i < POSSIBILITIES.Trull; i++) {
            var score_element = i
            if (score_element === POSSIBILITIES.Abondance_Spades + this.trump) {
                score_element = POSSIBILITIES.Abondance_Hearts + 0.5
            } else if (score_element === POSSIBILITIES.Grand_Slam_Spades + this.trump) {
                score_element = POSSIBILITIES.Grand_Slam_Hearts + 0.5
            }
            if (score_element > max_score && (max_score != 0 || i != POSSIBILITIES.Follow)) {
                allowed.push(i) 
            }
        }
        return allowed
    }

    calculateScoreEnd() {
        var max_possibility = 0
        var max_score_hand = null
        for (const hand of this.hands) {
            if (hand.possibility !== null && hand.possibility > max_possibility) {
                max_possibility = hand.possibility
                max_score_hand = hand
            }
        }
        var score = 0
        var n_winners = 1
        if (max_possibility === POSSIBILITIES.Ask) {
            score = (max_score_hand.score_game - 4) * 3
        } else if (max_possibility === POSSIBILITIES.Follow) {
            score = (max_score_hand.score_game - 7) * 2
            n_winners = 2
        } else if (POSSIBILITIES.Abondance_Spades <= max_possibility && max_possibility <= POSSIBILITIES.Abondance_Hearts) {
            score = Math.sign(max_score_hand.score_game - 8.5) * 15
        } else if (max_possibility === POSSIBILITIES.Misery) {
            score = - Math.sign(max_score_hand.score_game - 0.5) * 15
        } else if (max_possibility === POSSIBILITIES.Open_Misery) {
            score = - Math.sign(max_score_hand.score_game - 0.5) * 30
        } else if (POSSIBILITIES.Grand_Slam_Spades <= max_possibility && max_possibility <= POSSIBILITIES.Grand_Slam_Hearts) {
            score = Math.sign(max_score_hand.score_game - 12.5) * 48
        } else if (max_possibility === POSSIBILITIES.Trull) {
            score = (max_score_hand.score_game - 7) * 2
            n_winners = 2
        }

        for (const hand of this.hands) {
            if (hand === max_score_hand || (n_winners == 2 && hand.possibility == POSSIBILITIES.Follow)) {
                hand.overall_score += score
            } else {
                hand.overall_score -= score
            }
        }
    }


    start() {
        this.dealer.retrieveAll()
        this.start_turn = (this.start_turn + 1) % 4
        this.turn = this.start_turn
        this.asked_again = false
        this.current_trick.clearCards()
        this.current_trick = new Trick(this.trump)
        this.previous_trick = new Trick(this.trump)
        for (const hand of this.hands) {
            hand.reset()
        }

        this.deck.shuffle()
        this.start_round = true
        this.start_round_chosen = 0
        this.trump = this.deck.cards[0].suit
        this.trump_card = this.deck.cards[0]
        this.ended = false
        this.time_last_action = performance.now() - TIME_BETWEEN_ACTIONS
        this.dealer.deal()
        for (const hand of this.hands) {
            hand.sortCards()
        }

        if (this.handle_ui) {
            this.uihandler.atStart(this)
        }
        this.trullDetect()
    }

    humanPlayCard(card) {
        this.doEndTrick()
        if (this.hands[this.turn].type === TYPE.HUMAN &&
          this.current_trick.allowedCards(this.hands[this.turn]).find(findExact(card)) && !this.start_round) {
            if (this.handle_ui) {
                this.uihandler.handlePlayCardHuman(card, this.hands[this.turn])
            }
            this.playCard(card)
            this.time_last_action = performance.now()
            
        }
    }

    playCard(card) {
        this.hands[this.turn].removeCard(card)
        this.current_trick.addCard(card, this.hands[this.turn])
        if (this.handle_ui) {
            this.uihandler.throwCard(card, this.turn)
        }
        this.turn = (this.turn + 1) % 4
        if (!this.checkEndTrick() && this.handle_ui) {
            this.uihandler.setTurnImages(this.turn, this.start_turn)
        }
    }

    checkEndTrick() {
        return this.current_trick.cards_hands.length === 4
    }

    doEndTrick() {
        if (this.checkEndTrick()) {
            var winner = this.current_trick.decideWinner()
            winner.score_game += 1
            
            this.turn = this.hands.findIndex(findExact(winner))
            this.current_trick.returnToDeck(this.deck)
            this.previous_trick = this.current_trick
            this.current_trick = new Trick(this.trump)
            if (this.handle_ui) {
                this.uihandler.endTrick(this.hands, this.previous_trick)
            }
            
            if (this.hands[0].cards.length === 0) {
                this.end()
            }
            if (this.handle_ui) {
                this.uihandler.setTurnImages(this.turn, this.start_turn)
                this.uihandler.removeAnimationsCards()
            }
        }
    }

    end() {
        this.ended = true
        this.calculateScoreEnd()
        if (this.handle_ui) {
            this.uihandler.updateOverallScore(this.hands)
        }
        this.start()
    }

    updateStartRound() {
        this.turn = (this.turn + 1) % 4
        this.start_round_chosen += 1
        this.start_round = (this.start_round_chosen < 4)
        if (!this.start_round && !this.asked_again) {
            this.asked_again = true
            var variant = this.getVariant()
            if (variant === POSSIBILITIES.Ask) {
                var follower = false
                for (const hand of this.hands) {
                    if (hand.possibility === POSSIBILITIES.Follow) {
                        follower = true
                        break
                    }
                }
                if (!follower) {
                    this.start_round_chosen -= 1
                    this.start_round = true
                    for (var i = 0; i < 4; i++) {
                        if (this.hands[i].possibility === POSSIBILITIES.Ask) {
                            this.turn = i
                            break
                        }
                    }
                    if (this.turn === 0 && this.handle_ui) {
                        this.uihandler.showAskAgainChoiceMenu()
                    }
                }
            }
        } else if (!this.start_round) {
            var variant = this.getVariant()
            this.turn = this.start_turn
            if (variant == POSSIBILITIES.Pass) {
                this.start()
            } else {
                if (variant === POSSIBILITIES.Misery || variant == POSSIBILITIES.Open_Misery) {
                    this.trump_card = null
                    this.trump = null
                } else if (POSSIBILITIES.Abondance_Spades  <= variant && variant <= POSSIBILITIES.Abondance_Hearts) {
                    this.trump = variant - POSSIBILITIES.Abondance_Spades
                    this.trump_card = new Card(1, this.trump)
                } else if (POSSIBILITIES.Grand_Slam_Spades  <= variant && variant <= POSSIBILITIES.Grand_Slam_Hearts) {
                    this.trump = variant - POSSIBILITIES.Grand_Slam_Spades
                    this.trump_card = new Card(1, this.trump)
                }
                for (var i = 0; i < 4; i++) {
                    var hand = this.hands[i]
                    if (hand.possibility < variant && (hand.possibility !== POSSIBILITIES.Ask || 
                        variant !== POSSIBILITIES.Follow)) {
                            hand.possibility = POSSIBILITIES.Pass
                            if (this.handle_ui) {
                                this.uihandler.updateChoicePlayer(i, hand.possibility)
                            }
                    } else {
                        hand.possibility = variant
                    }
                    if ((POSSIBILITIES.Abondance_Spades <= hand.possibility && POSSIBILITIES.Abondance_Hearts >= hand.possibility)) {
                        this.turn = i
                        this.current_trick.extra_suit_requirement = hand.possibility - POSSIBILITIES.Abondance_Spades
                    } else if ((POSSIBILITIES.Grand_Slam_Spades <= hand.possibility && POSSIBILITIES.Grand_Slam_Hearts >= hand.possibility)) {
                        this.turn = i
                        this.current_trick.extra_suit_requirement = hand.possibility - POSSIBILITIES.Grand_Slam_Spades
                    } 
                }
            }
            if (this.handle_ui) {
                this.uihandler.updateTrumpCard(this.trump_card)
            }
            this.current_trick = new Trick(this.trump)
            this.previous_trick = new Trick(this.trump)
        }
        if (this.handle_ui) {
            this.uihandler.setTurnImages(this.turn, this.start_turn)
        }
    }

    trullDetect() {
        for (var j = 0; j < 4; j++) {
            var hand = this.hands[j]
            var aces = 0
            for (const card of hand.cards) {
                if (card.rank === 1) {
                    aces += 1
                }
            }
            if (aces >= 3) {
                hand.possibility = POSSIBILITIES.Trull
                if (this.handle_ui) {
                    this.uihandler.updateChoicePlayer(j, hand.possibility)
                }
                var highest_other_val = 0
                var highest_other_rank = 0
                var highest_other_suit = 0
                var partner = null
                var partner_index = 0
                for (var i = 0; i < 4; i++) {
                    var other_hand = this.hands[i]
                    if (other_hand !== hand) {
                        for(const card of other_hand.cards) {
                            if (card.getValue() + 0.1 * card.suit > highest_other_val) {
                                highest_other_val = card.getValue() + 0.1 * card.suit
                                highest_other_rank = card.rank
                                highest_other_suit = card.suit
                                partner = other_hand
                                partner_index = i
                                this.trump_card = card
                                this.trump = card.suit
                                if (this.handle_ui) {
                                    this.uihandler.updateTrumpCard(this.trump_card)
                                }
                            }
                        }
                    }
                }
                partner.possibility = POSSIBILITIES.Trull
                if (this.handle_ui) {
                    this.uihandler.updateChoicePlayer(partner_index, partner.possibility)
                }
                this.current_trick.extra_rank_requirement = highest_other_rank
                this.current_trick.extra_suit_requirement = highest_other_suit
                this.turn = (partner_index + 3) % 4
                this.start_round_chosen = 3
                this.updateStartRound()
                if (this.turn === 0 && this.handle_ui) {
                    this.uihandler.disableNotAllowedCards(this.current_trick, this.hands[this.turn])
                }
            }
        }
    }

    update() {
        if (this.start_round) {
            if (this.hands[this.turn].type === TYPE.AI && 
                performance.now() - this.time_last_action > TIME_BETWEEN_ACTIONS) {
                    this.hands[this.turn].possibility = this.ais[this.turn].decide_possibility(this) 
                    if (this.handle_ui) {
                        this.uihandler.updateChoicePlayer(this.turn, this.hands[this.turn].possibility)
                    }
                    this.time_last_action = performance.now()
                    this.updateStartRound()
                }
            else if (this.turn === 0 && this.hands[this.turn].possibility === null) {
                if(this.handle_ui) {
                    this.uihandler.showMainOptionMenu()
                }
                if(this.handle_ui) {
                    var allowed = this.allowedPossibilities()
                    this.uihandler.disableNotAllowedOptions(allowed)
                }
            }
        } else if (!this.ended) {
            if (this.hands[this.turn].type === TYPE.AI && 
                performance.now() - this.time_last_action > TIME_BETWEEN_ACTIONS &&
                this.current_trick.cards_hands.length < 4) {
                this.time_last_action = performance.now()
                var card = this.ais[this.turn].decide(this.current_trick)
                this.playCard(card)  
                if (this.turn === 0 && !this.checkEndTrick() && this.handle_ui) {
                    this.uihandler.disableNotAllowedCards(this.current_trick, this.hands[this.turn])
                }  
            }
    
            if (performance.now() - this.time_last_action > TIME_BETWEEN_ACTIONS) {
                this.time_last_action = performance.now()
                this.doEndTrick()
            }
        }
        
    }
}

function findExact(value) {
    function findFun(val) {
        return val === value
    }
    return findFun
}

function main() {
    var whist = new Whist(true)
    setInterval(function() {whist.update()}, 500)
    
}

main()
