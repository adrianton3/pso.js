/*
 pso.js 0.1 Copyright (c) 2013, Adrian Toncean
 Available via the MIT or new BSD license
*/
(function() {
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
		storePosition: function() {
			for (var i = 0; i < this.position.length; i++) {
				this.bestPosition[i] = this.position[i];
			}
		},
	
		getPosition: function() {
			var ret = [];
			for (var i = 0; i < this.position.length; i++) {
				ret.push(this.position[i]);
			}
			return ret;
		},
		
		getBestPosition: function() {
			var ret = [];
			for (var i = 0; i < this.position.length; i++) {
				ret.push(this.bestPosition[i]);
			}
			return ret;
		},
	
		updateVelocity: function(globalBest) {
			for (var i = 0; i < this.position.length; i++) {
				this.velocity[i] = this.velocity[i] * this.inertiaWeight + 
					(globalBest.position[i] - this.position[i]) * Math.random() * this.social + 
					(this.bestPosition[i] - this.position[i]) * Math.random() * this.personal;
			}
		},
	
		updatePosition: function() {
			for (var i = 0; i < this.position.length; i++) {
				this.position[i] += this.velocity[i];
			}
		}
	};
	
	Particle.createRandom = function(domain, options, velocityMultiplier) {
		velocityMultiplier = typeof velocityMultipler === 'undefined' ? 0.1 : velocityMultiplier; 
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
	function PSO() {
		this.particles = null;
		this.objecttiveFunction = null;
		
		this.bestPositionEver = null;
		this.bestFitnessEver = -Infinity;
		this.iteration = 0;
		this.pressure = 0.5;
	 
		this.inertiaWeight = 0.8;
		this.social = 0.4;
		this.personal = 0.4;
	}
	
	PSO.prototype = {
		setOptions: function(options) {
			this.options = options || {};
			this.options.inertiaWeight = this.options.inertiaWeight !== undefined ? this.options.inertiaWeight : 0.8;
			this.options.social = this.options.social !== undefined ? this.options.social : 0.4;
			this.options.personal = this.options.personal !== undefined ? this.options.personal : 0.4;
		},
		
		setObjectiveFunction: function(objectiveFunction) {
			this.objectiveFunction = objectiveFunction;
		},
		
		init: function(nParticles, generationOption) {			
			var generator = generationOption instanceof Function ?
				function() { return geneationOption(); } :
				function() { return Particle.createRandom(generationOption, this.options); }.bind(this);
			
			this.iteration = 0;
			this.bestPositionEver = null;
			this.bestFitnessEver = -Infinity;
			
			this.particles = [];
			for (var i = 0; i < nParticles; i++) {
				this.particles.push(generator());
			}
		},
	
		getRandomBest: function(except) {
			var ret = (Math.random() * this.particles.length) | 0;
			
			this.particles.forEach(function(particle, index) {
				if (Math.random() < this.pressure &&
					this.particles[index].fitness > this.particles[ret].fitness && 
					index !== except) {
					ret = index;
				}
			}.bind(this));
			
			return ret;
		},
	
		step: function() {
			this.particles.forEach(function(particle) {		
				particle.fitness = this.objectiveFunction(particle.position);
				
				if(particle.fitness > particle.bestFitness) {
					particle.bestFitness = particle.fitness;
					particle.storePosition();
		
					if(particle.fitness > this.bestFitnessEver) {
						this.bestFitnessEver = particle.fitness;
						this.bestPositionEver = particle.getPosition();
					}
				}
			}.bind(this));
		 
			// update velocities
			this.particles.forEach(function(particle, index) {
				var randomBest = this.particles[this.getRandomBest(index)];
				particle.updateVelocity(randomBest);
			}.bind(this));
		    
			// update positions
			this.particles.forEach(function(particle, index) {
				particle.updatePosition();
			});
			
			this.iteration++;
		},
	
		getParticles: function() {
			return this.particles.map(function(particle) {
				return particle.getPosition();
			});
		},
		
		getParticlesBest: function() {
			return this.particles.map(function(particle) {
				return particle.getBestPosition();
			});
		},
	
		getBestPosition: function() {
			return this.bestPositionEver;
		},
	
		getBestFitness: function() {
			return this.bestFitnessEver;
		},
	
		getMeanFitness: function() {
			var sum = 0;
			this.particles.forEach(function(particle) {
		  	sum += particle.fitness;
			});
		  return sum / this.particles.length;
		}
	};
	//=============================================================================
	if (typeof define === 'function' && define.amd) {
		define(function() {
			return {
				Interval: Interval,
				Particle: Particle,
				PSO: PSO
			};
		});
	}  

  window.Interval = Interval;
  window.Particle = Particle;
  window.PSO = PSO; 
})();