function end_game(score) {
    // Because the code of flappy_bird.js in games is used, we need to define this function 
    // (normally this function sends the highscore)  
}

function mean(array) {
    // Calculates the mean of teh array
    if (array.length === 0) {
        return 0
    }
    var sum = 0
    for (const el of array) {
        sum += el
    }
    return sum / array.length
}

function matmul(a, b) {
    // matrix multiplication
    var a_rows = a.length
    var a_cols = a[0].length
    var b_cols = b[0].length

    var m = new Array(a_rows) 
    for (var r = 0; r < a_rows; ++r) {
      m[r] = new Array(b_cols);
      for (var c = 0; c < b_cols; ++c) {
        m[r][c] = 0;
        for (var i = 0; i < a_cols; ++i) {
          m[r][c] += a[r][i] * b[i][c];
        }
      }
    }
    return m;
}

function sigmoid(matrix) {
    // Calculates the sigmoid function for the given matrix
    var output = []
    for (var i = 0; i < matrix.length; i++) {
        var output_row = []
        for (var j = 0; j < matrix[0].length; j++) {
            var numb = -matrix[i][j]
            if (numb > 20) {
                numb = 20
            } else if (numb < -20) {
                numb = -20
            }
            output_row.push(1 / (1 + Math.exp(numb)))
        }
        output.push(output_row)
    }
    return output
}

function all_bigger(output, number) {
    // Checks whether or not all output elements are bigger or equal to the given number
    for (var i = 0; i < output.length; i++) {
        for (var j = 0; j < output[i].length; j++) {
            if (output[i][j] < number) {
                return false
            }
        }
    }
    return true
}

class Individual {
    // An individual in the genetic algorithm
    constructor (n_inputs, n_outputs, hidden_layer_size, weights, biases) {
        // The weights is a list of weights of the neural network. 
        // Each element is a weight from one layer to the next
        this.weights = []
        // The biases is a list of biases in the neural network
        // Each element is a bias from one layer to the next
        this.biases = []
        // The score or fitness of the individual in all its previous passes through the game
        this.past_fitnesses = []
        // The current fitness score of the individual
        this.fitness = 0
        // the number of generations the individual is alive
        this.n_generations_alive = 1
        // The type of the individual (it is not "human")
        this.type = "ai"
        // If there is one hidden layer -> adding support for a number input
        if (typeof hidden_layer_size === "number"){
            hidden_layer_size = [hidden_layer_size]
        }

        // Logging the number of inputs and outputs etc. (comes in handy for mutation)
        this.n_inputs = n_inputs
        this.n_outputs = n_outputs
        this.hidden_layer_size = hidden_layer_size
        // n_inputs, n_outputs and hidden_layer_size added together
        this.sizes = hidden_layer_size.slice()
        this.sizes.push(n_outputs)
        this.sizes.splice(0, 0, n_inputs)

        // If the weights are given -> set the weights to the given weights, otherwise generate new weights
        if (weights) {
            this.weights = weights
            this.biases = biases
        } else {
            this.initialize_weights_and_biases()
        }
    }

    initialize_weights_and_biases () {
        // Complicated for loops with specific size to get the right weights and biases initialization
        this.weights = []
        this.biases = []
        for (var i = 0; i < this.sizes.length - 1; i++) {
            var weights_layer = []
            for (var j = 0; j < this.sizes[i]; j++) {
                var weights_layer_el = []
                for (var k = 0; k < this.sizes[i + 1]; k++) {
                    weights_layer_el.push(this.initialize_number())
                }
                weights_layer.push(weights_layer_el.slice())
            }
            this.weights.push(weights_layer.slice())

            var bias_layer = []
            for (var j = 0; j < this.sizes[i + 1]; j++) {
                bias_layer.push(this.initialize_number())
            }
            this.biases.push(bias_layer.slice())
        }
    }

    initialize_number() {
        // For now: random uniform between [-1, 1]
        return Math.random() * 2 - 1
    }

    get_fitness() {
        // get_fitness retursn the mean of all past fitnesses: this is better as regularization
        return mean(this.past_fitnesses)
    }

    sum_bias(matrix, bias) {
        // Sums the bias of shape (i) with the output of the matrix multiplication of shape (j, i)
        // For now, we always use this with j = 1
        var output = []
        for (var i = 0; i < matrix.length; i++) {
            var output_row = []
            for (var j = 0; j < matrix[0].length; j++) {
                output_row.push(matrix[i][j] + bias[j])
            }
            output.push(output_row)
        }
        return output
    }

    predict(observation) {
        // Predicts what to do based on the observation.
        var output = [observation]
        for (var i = 0; i < this.weights.length; i++) {
            output = this.sum_bias(matmul(output.slice(), this.weights[i].slice()), this.biases[i].slice())
            output = sigmoid(output.slice())
        }
        return all_bigger(output, 0.5)
    }

    mutate(mutation_rate) {
        // Mutates an individual, mutation rate is the std of the changes made to the individual
        var new_weights = []
        for (const weight of this.weights) {
            // New weights
            var new_weight = []
            for (var i = 0; i < weight.length; i++) {
                var new_weight_row = []
                for (var j = 0; j < weight[0].length; j++) {
                    // add other weights
                    new_weight_row.push(weight[i][j] + normalRandomScaled(0, mutation_rate))
                }
                new_weight.push(new_weight_row.slice())
            }
            new_weights.push(new_weight.slice())
        }
        
        // new biases 
        var new_biases = []
        for (var i = 0; i < this.biases.length; i++) {
            var bias_layer = []
            for (var j = 0; j < this.sizes[i + 1]; j++) {
                bias_layer.push(this.biases[i][j] + normalRandomScaled(0, mutation_rate))
            }
            new_biases.push(bias_layer.slice())
        }
        // Create the new individual
        return new Individual(this.n_inputs, this.n_outputs, this.hidden_layer_size, new_weights, new_biases)
    }
}

function normalRandom() {
    // Generates a random number from the normal distribution with mean = 0 and std = 1
    var u = Math.random() * 2 - 1
    var v = Math.random() * 2 - 1
    var s = u * u + v * v

    while(s === 0 || s >= 1) {
        u = Math.random() * 2 - 1
        v = Math.random() * 2 - 1

        s = u * u + v * v
    }
	var mul = Math.sqrt(-2 * Math.log(s) / s);

    var val = u * mul;
	
	return val;
}

function normalRandomScaled(mean, stddev) {
    // Scales the previous output to get normal distribution with given mean and std
	var r = normalRandom()
	return r * stddev + mean
}


class Population {
    // A population consisting out of a number of individuals 
    constructor(size_population, start_mutation_rate, n_keep_best, n_offspring, 
                hidden_layers_size, n_inputs, n_outputs) {
        this.individuals = []

        for (var i = 0; i < size_population; i++) {
            var new_ind = new Individual(n_inputs, n_outputs, hidden_layers_size)
            this.individuals.push(new_ind)
        }

        this.start_mutation_rate = start_mutation_rate
        this.n = 0
        this.n_offspring = n_offspring
        this.n_keep_best = n_keep_best
        this.size_population = size_population
        }

    argmax(array) {
        // calculates the argmax of the given array
        return array.map((x, i) => [x, i]).reduce((r, a) => (a[0] > r[0] ? a : r))[1];
    }

    get_stats() {
        var scores = []

        for (const ind of this.individuals) {
            scores.push(ind.get_fitness())
        }

        var sorted_scores = scores.sort(function(a, b) {return b - a})

        return [mean(sorted_scores), sorted_scores.slice(0, 5)]
    }

    update() {
        var new_individuals = []
        var scores = []

        // get fitness individuals
        for (const ind of this.individuals) {
            ind.past_fitnesses.push(ind.fitness)
            scores.push(ind.get_fitness())
        }

        // Copy the score 
        var copy_scores = scores.slice()

        // get the 'n_keep_best' best individuals
        for (var i = 0; i < this.n_keep_best; i++) {
            var argmax_ = this.argmax(copy_scores)
            var best_ind = this.individuals[argmax_]

            // set the copy_score to -1 -> score will certainly be worse than all other score
            copy_scores[argmax_] = -1
            // keep the bird alive
            new_individuals.push(best_ind)
            best_ind.n_generations_alive += 1

            // generate offspring
            for (var j = 0; j < this.n_offspring; j++) {
                new_individuals.push(best_ind.mutate(this.mutation_rate(best_ind)))
            }
        }

        // generate individuals from random individuals
        while (new_individuals.length < this.size_population) {
            var random_ind = this.individuals[Math.floor(Math.random() * this.individuals.length)]
            for (var j = 0; j < Math.min(this.n_offspring, this.size_population - new_individuals.length); j++) {
                new_individuals.push(best_ind.mutate(this.mutation_rate(random_ind)))
            }
        }

        this.individuals = new_individuals.slice()
        this.n += 1
    }

    mutation_rate(ind) {
        // get the mutation rate of an individual: note that this is changed based on the fitness of the individual
        return Math.max(this.start_mutation_rate * (1 / 1.1) ** ind.fitness, this.start_mutation_rate / 100)
    }
}

// Same basic things that are used in simulation and come in handy to be globally defined
var interval = null
var speed = Number(document.getElementById("speed").value)
var game = null
var birds = []
var population = null
var top_scores = []

const FPS = 60

function step_function() {
    // A step that is repeated infinitely
    // move the game forward an keep track whether or not the game is finished
    game.step()
    var done = true
    for (const bird of birds) {
        if (bird.alive) {
            done = false
        }
    }

    if (done) {
        // if the game is finished, update the population, revive the birds with another individual and reset the game
        population.update()
        var score = game.score
        if (top_scores.length < 3 || top_scores[2][0] < score) {
            top_scores.push([score, population.n])
            top_scores = top_scores.sort(function(a, b){return b[0] - a[0]}).slice(0, 3)
            document.getElementById("top-scores").innerHTML = ""
            for (const top_score of top_scores) {
                document.getElementById("top-scores").innerHTML += `<li>Generation ${ top_score[1] }: 
                                                                        ${top_score[0]}</li>`
            }
            for (var i = 0; i < 3 - top_scores.length; i++) {
                document.getElementById("top-scores").innerHTML += "<li></li>"
            }
        }
        document.getElementById("current-generation").innerHTML = population.n + 1

        for (var i = 0; i < population.size_population; i++) {
            birds[i].revive(population.individuals[i])
            if (population.individuals[i].n_generations_alive <= 1) {
                birds[i].set_color("red")
            } else if (population.individuals[i].n_generations_alive <= 3) {
                birds[i].set_color("yellow")
            } else {
                birds[i].set_color("blue")
            }
        }
        game.reset()
    }
}

function changeSpeed() {
    // Changes the speed of the simulation
    speed = Number(document.getElementById("speed").value)
    if (interval) {
        clearInterval(interval)
        interval = setInterval(step_function, 1000 / (speed * FPS))
    }
}

function main() {
    // Main function
    if (interval) {
        clearInterval(interval)
    }
    top_scores = []

    var speed = Number(document.getElementById("speed").value)

    // All constants
    const SCREEN_SIZE = [288, 404]
    const START_POS_BIRD = [SCREEN_SIZE[0] * 0.2, 300]
    const LENGTH_PIPES = 95
    const DISTANCE_PIPES = 149
    const HORIZONTAL_SPEED = 120
    const JUMP_SPEED = -400
    const MAX_DESCEND_SPEED = 2000
    const GRAVITY = 1600
    const TIME_UPDATE_SPRITE = 0.1

    const N_INPUTS = 4
    const N_OUTPUTS = 1
    const HIDDEN_LAYER_SIZE = [6, 4, 2]
    
    // Parameters the user can define
    speed = Number(document.getElementById("speed").value)
    var generation_size = Number(document.getElementById("generation").value)
    var best_selected = Number(document.getElementById("best").value)

    // ensuring best_selected is not too high
    if (best_selected > generation_size) {
        best_selected = generation_size
        document.getElementById("best").value = generation_size
    }

    var offspring = Number(document.getElementById("offspring").value)

    // ensuring offspring is not too high
    if (offspring * best_selected > generation_size) {
        offspring = Math.floor(generation_size / best_selected) - 1
        document.getElementById("offspring").value = offspring
    }

    var mutation_rate = document.getElementById("mutation").value

    // initialize everything
    population = new Population(generation_size, mutation_rate, best_selected, offspring, HIDDEN_LAYER_SIZE, N_INPUTS, N_OUTPUTS)

    birds = []
    for (var i = 0; i < population.size_population; i++) {
        birds.push(new Bird(START_POS_BIRD, JUMP_SPEED, TIME_UPDATE_SPRITE, MAX_DESCEND_SPEED, 
                            HORIZONTAL_SPEED, population.individuals[i], "red"))
    }

    game = new Game(SCREEN_SIZE, birds, DISTANCE_PIPES, HORIZONTAL_SPEED, LENGTH_PIPES,
            GRAVITY, FPS, false, false, true)
    
    // set the interval
    interval = setInterval(step_function, 1000 / (speed * FPS))

    // make sure the page is not reloaded
    return false        
}
