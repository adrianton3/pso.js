//     Copyright 2015 Adrian Toncean; released under the MIT license
(function () {
	'use strict';

	// Defines a candidate solution
	function Particle(position, velocity, options) {
		this.position = position;
		this.velocity = velocity;
		this.bestPosition = new Array(this.position.length);
		this.fitness = -Infinity;
		this.bestFitness = -Infinity;
	 
		this.inertiaWeight = options.inertiaWeight;
		this.social = options.social;
		this.personal = options.personal;
	}
	
	Particle.prototype = {
		// Stores the current position as its best so far.
		storePosition: function () {
			this.bestPosition = this.position.slice(0);
		},

		// Retrieves the particle's current position.
		getPosition: function () {
			return this.position.slice(0);
		},

		// Retrieves the particle's best saved position.
		getBestPosition: function () {
			return this.bestPosition.slice(0);
		},

		// Updates the particle's velocity vector based on inertia,
		// the best-performing particle in the swarm and
		// the best position the current particle has saved.
		updateVelocity: function (globalBest, random) {
			this.position.forEach(function (component, index) {
				var inertia = this.velocity[index] * this.inertiaWeight;
				var socialInfluence = (globalBest.position[index] - component) * random() * this.social;
				var personalInfluence = (this.bestPosition[index] - component) * random() * this.personal;

				this.velocity[index] = inertia + socialInfluence + personalInfluence;
			}.bind(this));
		},

		// Applies the velocity
		updatePosition: function () {
			this.velocity.forEach(function (component, index) {
				this.position[index] += component;
			}.bind(this));
		}
	};
	
	Particle.createRandom = function (domain, options, random) {
		var position = domain.map(function (interval) {
			return random() * (interval.end - interval.start) + interval.start;
		});
		
		var velocity = domain.map(function (interval) {
			return (random() * (interval.end - interval.start)) * 0.05;
		});

		return new Particle(position, velocity, options);
	};
	// ------------------------------------------------------------------------
	// Used to define domains.
	// An *Interval* is anything with a *start* and an *end*.
	function Interval(start, end) {
		this.start = start;
		this.end = end;
	}
	// ------------------------------------------------------------------------
	// Holds particles and carries out the optimization task.
	function Optimizer() {
		this.particles = null;
		this.objectiveFunction = null;
		
		this.bestPositionEver = null;
		this.bestFitnessEver = -Infinity;

		this.options = {
			inertiaWeight: 0.8,
			social: 0.4,
			personal: 0.4,
			pressure: 0.5
		};

		this.async = false;
		this._waiting = false;

		this.rng = {
			random: Math.random,
			setSeed: function () {}
		};
	}

	Optimizer.prototype = {
		setOptions: function (options) {
			options = options || {};
			if (options.inertiaWeight !== undefined) {
				this.options.inertiaWeight = options.inertiaWeight;
			}
			if (options.social !== undefined) {
				this.options.social = options.social;
			}
			if (options.personal !== undefined) {
				this.options.personal = options.personal;
			}
			if (options.pressure !== undefined) {
				this.options.pressure = options.pressure;
			}
		},
		
		setObjectiveFunction: function (objectiveFunction, options) {
			this.objectiveFunction = objectiveFunction;
			this.async = options && options.async;
		},

		// To be called before any simulation
		// Creates the swarm and resets any previous recoded best solutions
		init: function (nParticles, generationOption) {
			var generator = generationOption instanceof Function ?
				generationOption :
				function () {
					return Particle.createRandom(generationOption, this.options, this.rng.random);
				}.bind(this);

			this.bestPositionEver = null;
			this.bestFitnessEver = -Infinity;
			
			this.particles = [];
			for (var i = 0; i < nParticles; i++) {
				this.particles.push(generator());
			}
		},

		// Retrieve the fittest particle from a subset of the entire swarm
		_getRandomBest: function (except) {
			var ret = Math.floor(this.rng.random() * this.particles.length);
			
			this.particles.forEach(function (particle, index) {
				if (this.rng.random() < this.options.pressure &&
					this.particles[index].fitness > this.particles[ret].fitness && 
					index !== except
				) {
					ret = index;
				}
			}.bind(this));
			
			return ret;
		},

		// Iterate once
		step: function (callback) {
			if (this.async) {
				if (this._waiting) {
					console.warn('Cannot step again before previous requests have been completed!');
					return;
				}
				this._waiting = true;
				var completed = 0;
				var optimizer = this;
				this.particles.forEach(function (particle) {
					optimizer.objectiveFunction(particle.position, function (fitness) {
						particle.fitness = fitness;
						completed++;
						if (completed >= optimizer.particles.length) {
							optimizer._waiting = false;
							optimizer._completeStep();
							callback();
						}
					});
				});
			} else {
				this.particles.forEach(function (particle) {
					particle.fitness = this.objectiveFunction(particle.position);
				}.bind(this));
				this._completeStep();
			}
		},

		_completeStep: function () {
			// Record the best found solutions
			this.particles.forEach(function (particle) {
				if (particle.fitness > particle.bestFitness) {
					particle.bestFitness = particle.fitness;
					particle.storePosition();
		
					if (particle.fitness > this.bestFitnessEver) {
						this.bestFitnessEver = particle.fitness;
						this.bestPositionEver = particle.getPosition();
					}
				}
			}.bind(this));
		 
			// Update velocities
			this.particles.forEach(function (particle, index) {
				var randomBest = this.particles[this._getRandomBest(index)];
				particle.updateVelocity(randomBest, this.rng.random);
			}.bind(this));
		    
			// Update positions
			this.particles.forEach(function (particle) {
				particle.updatePosition();
			});
		},

		// Retrieves an array of all solutions in the swarm
		getParticles: function () {
			return this.particles.map(function (particle) {
				return particle.getPosition();
			});
		},

		// Retrieves an array of the best solutions encountered by every particle
		getParticlesBest: function () {
			return this.particles.map(function (particle) {
				return particle.getBestPosition();
			});
		},

		// Retrieves the best solution ever recorded
		getBestPosition: function () {
			return this.bestPositionEver;
		},

		// Retrieves the best fitness ever recorded
		getBestFitness: function () {
			return this.bestFitnessEver;
		},

		// Retrieves the mean fitness of the entire swarm
		getMeanFitness: function () {
			var sum = this.particles.reduce(function (partialSum, particle) {
				return partialSum + particle.fitness;
			}, 0);
			return sum / this.particles.length;
		}
	};
	// ------------------------------------------------------------------------
	// *pso.js* works
	if (typeof define === 'function' && define.amd) {
		// + with *RequireJS*
		define('pso/Interval', function () { return Interval; });
		define('pso/Particle', function () { return Particle; });
		define('pso/Optimizer', function () { return Optimizer; });
	} else {
		var pso = {
			Interval: Interval,
			Particle: Particle,
			Optimizer: Optimizer
		};
		if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
			// + from a *WebWorker*
			self.pso = pso;
		} else if (typeof module !== 'undefined' && module.exports) {
			// + in *node*
			module.exports = pso;
		} else {
			// + or in a plain browser environment
			window.pso = pso;
		}
	}
})();