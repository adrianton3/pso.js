/*
 pso.js Copyright (c) 2014, Adrian Toncean
 Available via the MIT or new BSD license
*/
(function () {
	'use strict';

	function Particle(position, velocity, inertiaWeight, social, personal) {
		this.position = position;
		this.velocity = velocity;
		this.bestPosition = new Array(this.position.length);
		this.fitness = -Infinity;
		this.bestFitness = -Infinity;
	 
		this.inertiaWeight = inertiaWeight;
		this.social = social;
		this.personal = personal;
	}
	
	Particle.prototype = {
		storePosition: function () {
			for (var i = 0; i < this.position.length; i++) {
				this.bestPosition[i] = this.position[i];
			}
		},
	
		getPosition: function () {
			var ret = [];
			for (var i = 0; i < this.position.length; i++) {
				ret.push(this.position[i]);
			}
			return ret;
		},
		
		getBestPosition: function () {
			var ret = [];
			for (var i = 0; i < this.position.length; i++) {
				ret.push(this.bestPosition[i]);
			}
			return ret;
		},
	
		updateVelocity: function (globalBest) {
			for (var i = 0; i < this.position.length; i++) {
				this.velocity[i] = this.velocity[i] * this.inertiaWeight + 
					(globalBest.position[i] - this.position[i]) * Math.random() * this.social + 
					(this.bestPosition[i] - this.position[i]) * Math.random() * this.personal;
			}
		},
	
		updatePosition: function () {
			for (var i = 0; i < this.position.length; i++) {
				this.position[i] += this.velocity[i];
			}
		}
	};
	
	Particle.createRandom = function (domain, options, velocityMultiplier) {
		velocityMultiplier = typeof velocityMultiplier === 'undefined' ? 0.1 : velocityMultiplier;
		var position = [];
		var velocity = [];
		for (var i = 0; i < domain.length; i++) {
			position.push(Math.random() * (domain[i].end - domain[i].start) + domain[i].start);
			velocity.push((Math.random() * 2 - 1) * velocityMultiplier);
		}
		return new Particle(position, velocity, options.inertiaWeight, options.social, options.personal);
	};
	//=============================================================================
	function Interval(start, end) {
		this.start = start;
		this.end = end;
	}
	//=============================================================================
	function Optimizer() {
		this.particles = null;
		this.objectiveFunction = null;
		
		this.bestPositionEver = null;
		this.bestFitnessEver = -Infinity;
		this.iteration = 0;
		this.pressure = 0.5;
	 
		this.options = {
			inertiaWeight: 0.8,
			social: 0.4,
			personal: 0.4
		};

		this.async = false;
		this._waiting = false;
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
		},
		
		setObjectiveFunction: function (objectiveFunction, options) {
			this.objectiveFunction = objectiveFunction;
			this.async = options && options.async;
		},
		
		init: function (nParticles, generationOption) {
			var generator = generationOption instanceof Function ?
				function () { return generationOption(); } :
				function () {
					return Particle.createRandom(generationOption, this.options);
				}.bind(this);
			
			this.iteration = 0;
			this.bestPositionEver = null;
			this.bestFitnessEver = -Infinity;
			
			this.particles = [];
			for (var i = 0; i < nParticles; i++) {
				this.particles.push(generator());
			}
		},
	
		getRandomBest: function (except) {
			var ret = Math.floor(Math.random() * this.particles.length);
			
			this.particles.forEach(function (particle, index) {
				if (Math.random() < this.pressure &&
					this.particles[index].fitness > this.particles[ret].fitness && 
					index !== except) {
					ret = index;
				}
			}.bind(this));
			
			return ret;
		},

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
		 
			// update velocities
			this.particles.forEach(function (particle, index) {
				var randomBest = this.particles[this.getRandomBest(index)];
				particle.updateVelocity(randomBest);
			}.bind(this));
		    
			// update positions
			this.particles.forEach(function (particle) {
				particle.updatePosition();
			});
			
			this.iteration++;
		},
	
		getParticles: function () {
			return this.particles.map(function (particle) {
				return particle.getPosition();
			});
		},
		
		getParticlesBest: function () {
			return this.particles.map(function (particle) {
				return particle.getBestPosition();
			});
		},
	
		getBestPosition: function () {
			return this.bestPositionEver;
		},
	
		getBestFitness: function () {
			return this.bestFitnessEver;
		},
	
		getMeanFitness: function () {
			var sum = 0;
			this.particles.forEach(function (particle) {
				sum += particle.fitness;
			});
		  return sum / this.particles.length;
		}
	};
	//=============================================================================
	if (typeof define === 'function' && define.amd) {
		define('pso/Interval', [], function () { return Interval; });
		define('pso/Particle', [], function () { return Particle; });
		define('pso/Optimizer', [], function () { return Optimizer; });
	} else if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
		self.pso = {
			Interval: Interval,
			Particle: Particle,
			Optimizer: Optimizer
		};
	} else {
		window.pso = {
			Interval: Interval,
			Particle: Particle,
			Optimizer: Optimizer
		};
	}
})();