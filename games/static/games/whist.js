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
    Abondance_Clubs: 3, 
    Abondance_Diamonds: 4, 
    Abondance_Spades: 5, 
    Abondance_Hearts: 6, 
    Misery: 7,
    Open_Misery: 8, 
    Grand_Slam_Clubs: 9, 
    Grand_Slam_Diamonds: 10, 
    Grand_Slam_Spades: 11, 
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

    scoreCard(card, trump_counts) {
        if (trump_counts) {
            return card.getValue() * ((card.suit === this.trump) * 15 + (card.suit === this.cards_hands[0][0].suit))
        } else {
            return card.getValue() * (card.suit === this.cards_hands[0][0].suit)

        }
    }

    decideWinner(trump_counts) {
        var max_val = -100
        var max_card_hand = null
        for (const card_hand of this.cards_hands) {
            var score = this.scoreCard(card_hand[0], trump_counts)
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
        return POSSIBILITIES.Pass
    }
}

class Whist {
    constructor() {
        this.deck = new Deck()
        this.deck.shuffle()
        this.trump = this.deck.cards[0].suit
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
        
        this.time_last_action = performance.now() - TIME_BETWEEN_ACTIONS
        this.ended = false
        for (var i = 0; i < 4; i++) {
            document.getElementById("name-player-" + i.toString()).innerHTML = this.hands[i].name
        }
        this.start()
        var whist = this
        $(".option").click(function() {
            if (whist.allowedPossibilities().includes(Number($(this).attr("value"))) &&
                whist.turn == 0) {
                    whist.hands[0].possibility = Number($(this).attr("value"))
                    document.getElementById(`choice-player-info-${whist.turn}`).innerHTML = Object.keys(POSSIBILITIES)[Number($(this).attr("value"))]
                    whist.updateStartRound()
                    document.getElementById("choice-menu").style.display = "none"
            }
        })
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
        var allowed = [0]
        for (var i = max_score + 1; i < POSSIBILITIES.Trull; i++) {
            if (max_score != 0 || i != POSSIBILITIES.Follow) {
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
        } else if (POSSIBILITIES.Abondance_Clubs <= max_possibility && max_possibility <= POSSIBILITIES.Abondance_Hearts) {
            score = Math.sign(max_score_hand.score_game - 8.5) * 15
        } else if (max_possibility === POSSIBILITIES.Misery) {
            score = - Math.sign(max_score_hand.score_game - 0.5) * 15
        } else if (max_possibility === POSSIBILITIES.Open_Misery) {
            score = - Math.sign(max_score_hand.score_game - 0.5) * 30
        } else if (POSSIBILITIES.Grand_Slam_Clubs <= max_possibility && max_possibility <= POSSIBILITIES.Grand_Slam_Hearts) {
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

    setTurnImages() {
        for (var i = 0; i < 4; i++) {
            if (i === this.turn) {
                $("#turn-player-" + i.toString()).removeClass("not-turn-player")
                $("#turn-player-" + i.toString()).addClass("turn-player")
            } else {
                $("#turn-player-" + i.toString()).addClass("not-turn-player")
                if ($("#turn-player-" + i.toString()).attr("class").includes("turn-player")) {
                    $("#turn-player-" + i.toString()).removeClass("turn-player")
                }
            }

            if (i === (this.start_turn + 3) % 4) {
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

    showHand(hand) {
        var html_element = document.getElementById("hand-player")
        html_element.innerHTML = ""
        for (const card of hand.cards) {
            html_element.innerHTML += HTMLCard(card, true, "hand")
        }
        var whist = this
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

    start() {
        this.dealer.retrieveAll()
        this.start_turn = (this.start_turn + 1) % 4
        this.turn = this.start_turn
        this.current_trick.clearCards()
        this.current_trick = new Trick(this.trump)
        this.previous_trick = new Trick(this.trump)
        this.setHTMLPreviousTrick()
        for (const hand of this.hands) {
            hand.reset()
        }

        for (var i = 0; i < 4; i++) {
            document.getElementById(`score-player-now-${i}`).innerHTML = 0
            document.getElementById(`choice-player-info-${i}`).innerHTML = ""
        }

        this.deck.shuffle()
        this.start_round = true
        this.start_round_chosen = 0
        this.trump = this.deck.cards[0].suit
        this.trump_card = this.deck.cards[0]
        this.ended = false
        this.removeAnimations()
        this.time_last_action = performance.now() - TIME_BETWEEN_ACTIONS
        document.getElementById("trump-card").innerHTML = HTMLCard(this.trump_card, false, "trump")
        this.dealer.deal()
        for (const hand of this.hands) {
            hand.sortCards()
        }
        this.setTurnImages()
        this.showHand(this.hands[0])
        $(".option").each(function() {
            $(this).removeClass("disabled")
        });
        this.trullDetect()
    }

    humanPlayCard(card) {
        this.doEndTrick()
        if (this.hands[this.turn].type === TYPE.HUMAN &&
          this.current_trick.allowedCards(this.hands[this.turn]).find(findExact(card)) && !this.start_round) {
              $(`#hand-${card.rank}-${card.suit}`).addClass("animation-card")
              $(`#hand-${card.rank}-${card.suit} span`).addClass("animation-card-text")
              $(`#hand-${card.rank}-${card.suit}`).click(function() {})
            for (const card of this.hands[this.turn].cards) {
                $(`#hand-${card.rank}-${card.suit}`).removeClass("disabled")
            }
            this.playCard(card)
            this.time_last_action = performance.now()
            
        }
    }

    removeAnimations() {
        for (var turn = 0; turn < 4; turn++) {
            if ($("#card-turn-" + turn.toString()).hasClass("animate")) {
                $("#card-turn-" + turn.toString()).removeClass("animate")
            }
        }
    }

    playCard(card) {
        this.hands[this.turn].removeCard(card)
        this.current_trick.addCard(card, this.hands[this.turn])
        document.getElementById("card-turn-" + this.turn.toString()).innerHTML = HTMLCard(card, false, "trick")
        $("#card-turn-" + this.turn.toString()).addClass("animate")
        this.turn = (this.turn + 1) % 4
        if (!this.checkEndTrick()) {
            this.setTurnImages()
        }
    }

    checkEndTrick() {
        return this.current_trick.cards_hands.length === 4
    }

    doEndTrick() {
        if (this.checkEndTrick()) {
            var winner = this.current_trick.decideWinner(![POSSIBILITIES.Misery, POSSIBILITIES.Open_Misery].includes(this.getVariant()))
            winner.score_game += 1
            for (var i = 0; i < 4; i++) {
                document.getElementById(`score-player-now-${i}`).innerHTML = this.hands[i].score_game
            }
            this.turn = this.hands.findIndex(findExact(winner))
            this.current_trick.returnToDeck(this.deck)
            this.previous_trick = this.current_trick
            this.setHTMLPreviousTrick()
            this.current_trick = new Trick(this.trump)
            for(var turn = 0; turn < 4; turn++) {
                document.getElementById("card-turn-" + turn.toString()).innerHTML = ""
            }
            if (this.hands[0].cards.length === 0) {
                this.end()
            }
            this.setTurnImages()
            this.removeAnimations()
        }
    }

    end() {
        this.ended = true
        this.calculateScoreEnd()
        for (var i = 0; i < 4; i++) {
            document.getElementById(`score-player-overall-${i}`).innerHTML = this.hands[i].overall_score
        }
        this.start()
    }

    setHTMLPreviousTrick() {
        for(var i = 0; i < 4; i++) {
            if (this.previous_trick.cards_hands[i]) {
                document.getElementById(`trick-card-${i}`).innerHTML = HTMLCard(this.previous_trick.cards_hands[i][0], false, "previous")
            } else {
                document.getElementById(`trick-card-${i}`).innerHTML = ""

            }
        }
    }

    updateStartRound() {
        this.turn = (this.turn + 1) % 4
        this.start_round_chosen += 1
        this.start_round = (this.start_round_chosen < 4)
        if (!this.start_round) {
            var variant = this.getVariant()
            if (variant == POSSIBILITIES.Pass) {
                this.start()
            } else {
                for (var i = 0; i < 4; i++) {
                    var hand = this.hands[i]
                    if (hand.possibility < variant && (hand.possibility !== POSSIBILITIES.Ask || 
                        variant !== POSSIBILITIES.Follow)) {
                            hand.possibility = POSSIBILITIES.Pass
                            document.getElementById(`choice-player-info-${i}`).innerHTML = Object.keys(POSSIBILITIES)[POSSIBILITIES.Pass]
                    } else {
                        hand.possibility = variant
                    }
                    if ((POSSIBILITIES.Abondance_Clubs <= hand.possibility && POSSIBILITIES.Abondance_Hearts >= hand.possibility)) {
                        this.turn = i
                        this.current_trick.extra_suit_requirement = hand.possibility - POSSIBILITIES.Abondance_Clubs
                    } else if ((POSSIBILITIES.Grand_Slam_Clubs <= hand.possibility && POSSIBILITIES.Grand_Slam_Hearts >= hand.possibility)) {
                        this.turn = i
                        this.current_trick.extra_suit_requirement = hand.possibility - POSSIBILITIES.Grand_Slam_Clubs
                    }
                }
            }
        }
        this.setTurnImages()
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
                document.getElementById(`choice-player-info-${j}`).innerHTML = Object.keys(POSSIBILITIES)[POSSIBILITIES.Trull]
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
                            }
                        }
                    }
                }
                partner.possibility = POSSIBILITIES.Trull
                document.getElementById(`choice-player-info-${partner_index}`).innerHTML = Object.keys(POSSIBILITIES)[POSSIBILITIES.Trull]
                this.current_trick.extra_rank_requirement = highest_other_rank
                this.current_trick.extra_suit_requirement = highest_other_suit
                this.turn = (partner_index + 3) % 4
                this.start_round_chosen = 3
                this.updateStartRound()
                if (this.turn === 0) {
                    this.disableNotAllowed()
                }
            }
        }
    }

    disableNotAllowed() {
        var allowedCards = this.current_trick.allowedCards(this.hands[this.turn])
        for (const card of this.hands[this.turn].cards) {
            if (!allowedCards.includes(card)) {
                $(`#hand-${card.rank}-${card.suit}`).addClass("disabled")
            }
        }
    }

    update() {
        if (this.start_round) {
            if (this.hands[this.turn].type === TYPE.AI && 
                performance.now() - this.time_last_action > TIME_BETWEEN_ACTIONS) {
                    this.hands[this.turn].possibility = this.ais[this.turn].decide_possibility(this) 
                    document.getElementById(`choice-player-info-${this.turn}`).innerHTML = Object.keys(POSSIBILITIES)[this.hands[this.turn].possibility]
                    this.time_last_action = performance.now()
                    this.updateStartRound()
                }
            else if (this.turn === 0) {
                document.getElementById("choice-menu").style.display = "block"
                var allowed = this.allowedPossibilities()
                $(".option").each(function() {
                    if (!allowed.includes(Number($(this).attr("value")))) {
                        $(this).addClass("disabled")
                    }
                });
            }
        } else if (!this.ended) {
            if (this.hands[this.turn].type === TYPE.AI && 
                performance.now() - this.time_last_action > TIME_BETWEEN_ACTIONS &&
                this.current_trick.cards_hands.length < 4) {
                this.time_last_action = performance.now()
                var card = this.ais[this.turn].decide(this.current_trick)
                this.playCard(card)  
                if (this.turn === 0 && !this.checkEndTrick()) {
                    this.disableNotAllowed()
                }  
            }
    
            if (performance.now() - this.time_last_action > TIME_BETWEEN_ACTIONS) {
                this.time_last_action = performance.now()
                this.doEndTrick()
            }
        }
        
    }
}



function HTMLCard(card, clickable, before_id) {
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

function findExact(value) {
    function findFun(val) {
        return val === value
    }
    return findFun
}

function main() {
    var whist = new Whist()
    setInterval(function() {whist.update()}, 500)
    
}

main()
