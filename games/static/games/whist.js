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

    standardRequirement(card) {
        return this.cards_hands.length === 0 || this.cards_hands[0][0].suit === card.suit
    }

    suitExtraRequirement(card) {
        return this.extra_suit_requirement === null || card.suit === this.extra_suit_requirement
    }

    rankExtraRequirement(card) {
        var discardRequirement = this.cards_hands.length > 0 || this.extra_rank_requirement === null
        return discardRequirement || card.rank == this.extra_rank_requirement
    }

    allowedCards(hand) {
        var suit_cards = []
        for (const card of hand.cards) {
            if (this.standardRequirement(card) && this.suitExtraRequirement(card) && this.rankExtraRequirement(card)) {
                suit_cards.push(card)
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
            var suitValue = (card.suit === this.trump) * 14 + (card.suit === this.cards_hands[0][0].suit)
            return card.getValue() * suitValue
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
    HTMLCard(card, clickable, before_id) {
        var clickable_class = ""
        if (clickable) {
            clickable_class = "clickable-card"
        }
        return `<a class="${clickable_class} card ${SUITS[card.suit]} 
                rank-${card.rank}" id="${before_id}-${card.rank}-${card.suit}">
                    <span class="rank-symbol-1"></span>
                    <span class="suit-symbol-1"></span>
                    <span class="suit-symbol-2"></span>
                    <span class="suit-symbol-3"></span>
                    <span class="rank-symbol-2"></span>
                </a>`
    }

    changeName(index, name) {
        $("#name-player-" + index.toString()).html(name)
    }

    getPossibility(choice) {
        return Object.keys(POSSIBILITIES)[choice].replaceAll("_", " ")
    }

    setOptionFunction(whist) {
        var ui = this
        $(".option").click(function() {
            var possibility = Number($(this).attr("value"))
            if (whist.allowedPossibilities().includes(possibility) && whist.turn == 0) {
                whist.hands[0].possibility = possibility
                $(`#choice-player-info-${whist.turn}`).html(ui.getPossibility(possibility))
                whist.updateStartRound()
                $("#choice-menu-1").css("display", "none")
            }
        })
    }

    removeDisabledOption() {
        $(".option").each(function() {
            $(this).removeClass("disabled")
        });
    }

    setOption2Function(whist) {
        var ui = this
        $(".option-2").click(function() {
            if (whist.turn == 0) {
                var possibility = Number($(this).attr("value"))
                whist.hands[0].possibility = possibility
                $(`#choice-player-info-${whist.turn}`).html(ui.getPossibility(possibility))
                whist.updateStartRound()
                $("#choice-menu-2").css("display", "none")
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
        var message = ""
        for (const card of hand.cards) {
            message += this.HTMLCard(card, true, "hand")
        }
        $("#hand-player").html(message)

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
            $(`#score-player-now-${i}`).html(0)
            $(`#choice-player-info-${i}`).html("")
        }
        $("#trump-card").html(this.HTMLCard(whist.trump_card, false, "trump"))
        this.setTurnImages(whist.turn, whist.start_turn)
        this.showHand(whist.hands[whist.player_index], whist)
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
        $("#card-turn-" + turn.toString()).html(this.HTMLCard(card, false, "trick"))
        $("#card-turn-" + turn.toString()).addClass("animate")
    }

    setHTMLPreviousTrick(previous_trick) {
        for(var i = 0; i < 4; i++) {
            if (previous_trick.cards_hands[i]) {
                $(`#trick-card-${i}`).html(this.HTMLCard(previous_trick.cards_hands[i][0], false, "previous"))
            } else {
                $(`#trick-card-${i}`).html("")
            }
        }
    }

    endTrick(hands, previous_trick) {
        for (var i = 0; i < 4; i++) {
            $(`#score-player-now-${i}`).html(hands[i].score_game)
        }
        for(var turn = 0; turn < 4; turn++) {
            $("#card-turn-" + turn.toString()).html("")
        }
        this.setHTMLPreviousTrick(previous_trick)
    }

    updateOverallScore(hands) {
        for (var i = 0; i < 4; i++) {
            $(`#score-player-overall-${i}`).html(hands[i].overall_score)
        }
    }

    showAskAgainChoiceMenu() {
        $("#choice-menu-2").css("display", "block")
    }

    showMainOptionMenu() {
        $("#choice-menu-1").css("display", "block")
    }

    updateTrumpCard(trump_card) {
        if (trump_card === null) {
            $("#trump-card").html("")
            $("#trump-card-info").html("No trump")
        } else {
            $("#trump-card").html(this.HTMLCard(trump_card, false, "trump"))
        }
    }

    updateChoicePlayer(index, choice) {
        $(`#choice-player-info-${index}`).html(this.getPossibility(choice))
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
    constructor(handle_ui, hands, ais, player_index) {
        this.deck = new Deck()
        this.trump = null
        this.handle_ui = handle_ui
        this.uihandler = new UIHandler()
        this.trump_card = null
        this.hands = hands
        this.ais = ais
        this.dealer = new Dealer(this.deck, this.hands, 13)
        this.turn = 0
        this.start_turn = -1
        this.start_round = true
        this.start_round_chosen = 0
        this.current_trick = null
        this.previous_trick = null
        this.asked_again = false
        this.player_index = player_index
        
        this.time_last_action = performance.now() - TIME_BETWEEN_ACTIONS
        this.start()

        if (this.handle_ui) {
            for (var i = 0; i < 4; i++) {
                this.uihandler.changeName(i, this.hands[i].name)
            }
            this.uihandler.setOptionFunction(this)
            this.uihandler.setOption2Function(this)
        }
    }

    start() {
        this.dealer.retrieveAll()
        this.start_turn = (this.start_turn + 1) % 4
        this.turn = this.start_turn
        this.asked_again = false
        if (this.current_trick !== null) {
            this.current_trick.clearCards()
        }
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

    humanPlayCard(card) {
        this.doEndTrick()
        if (this.turn === this.player_index && !this.start_round &&
                this.current_trick.allowedCards(this.hands[this.turn]).find(findExact(card))) {
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
                    if (this.hands[this.turn].type === TYPE.HUMAN && this.handle_ui) {
                        this.uihandler.showAskAgainChoiceMenu()
                    }
                }
            }
        } 
        if (!this.start_round) {
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

                this.current_trick = new Trick(this.trump)
                this.previous_trick = new Trick(this.trump)

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
                    if ((POSSIBILITIES.Abondance_Spades <= hand.possibility && 
                        POSSIBILITIES.Abondance_Hearts >= hand.possibility)) {
                        this.turn = i
                        this.current_trick.extra_suit_requirement = hand.possibility - POSSIBILITIES.Abondance_Spades
                    } else if ((POSSIBILITIES.Grand_Slam_Spades <= hand.possibility && 
                                POSSIBILITIES.Grand_Slam_Hearts >= hand.possibility)) {
                        this.turn = i
                        this.current_trick.extra_suit_requirement = hand.possibility - POSSIBILITIES.Grand_Slam_Spades
                    } 
                }
            }

            if (this.handle_ui) {
                this.uihandler.updateTrumpCard(this.trump_card)
                if (this.turn === this.player_index) {
                    this.uihandler.disableNotAllowedCards(this.current_trick, this.hands[this.player_index])
                }
            }
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
                            }
                        }
                    }
                }
                partner.possibility = POSSIBILITIES.Trull
                if (this.handle_ui) {
                    this.uihandler.updateTrumpCard(this.trump_card)
                    this.uihandler.updateChoicePlayer(partner_index, partner.possibility)
                }
                this.current_trick.extra_rank_requirement = highest_other_rank
                this.current_trick.extra_suit_requirement = highest_other_suit
                this.turn = (partner_index + 3) % 4
                this.start_round_chosen = 3
                this.updateStartRound()
                if (this.turn === this.player_index && this.handle_ui) {
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
            else if (this.turn === this.player_index && this.hands[this.turn].possibility === null) {
                if(this.handle_ui) {
                    this.uihandler.showMainOptionMenu()
                }
                if(this.handle_ui) {
                    var allowed = this.allowedPossibilities()
                    this.uihandler.disableNotAllowedOptions(allowed)
                }
            }
        } else {
            if (this.hands[this.turn].type === TYPE.AI && 
                performance.now() - this.time_last_action > TIME_BETWEEN_ACTIONS &&
                this.current_trick.cards_hands.length < 4) {
                this.time_last_action = performance.now()
                var card = this.ais[this.turn].decide(this.current_trick)
                this.playCard(card)  
                if (this.turn === this.player_index  && !this.checkEndTrick() && this.handle_ui) {
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
    var hands = [new Hand(TYPE.HUMAN, "You"), new Hand(TYPE.AI, "Harry"), new Hand(TYPE.AI, "Ron"), 
                 new Hand(TYPE.AI, "Hermione")]
    var ais = [null, new AIDecider(hands[1]), new AIDecider(hands[2]), new AIDecider(hands[3])]
    var whist = new Whist(true, hands, ais, 0)
    
    setInterval(function() {whist.update()}, TIME_BETWEEN_ACTIONS)
}

main()
