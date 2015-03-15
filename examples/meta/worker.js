'use strict';

importScripts('../../src/pso.js');

self.onmessage = function (ev) {
	// setup optimizer
	var objectiveFunction = function (x) {
		return Math.cos(Math.PI * 2 * x[0]) * 5 - Math.pow(x[0], 2);
	};


	var initialPopulationSize = 8;
	var iterations = 8;
	var domain = [new pso.Interval(-5.12, 5.12)];

	var optimizer = new pso.Optimizer();

	optimizer.setOptions({
		inertiaWeight: ev.data.inertiaWeight,
		social: ev.data.social,
		personal: ev.data.personal
	});
	optimizer.setObjectiveFunction(objectiveFunction);


	var trials = 100;

	var sumBest = 0;
	var sumMean = 0;

	// run batches
	for (var i = 0; i < trials; i++) {
		optimizer.init(initialPopulationSize, domain);

		// step the optimizer
		for (var k = 0; k < iterations; k++) {
			optimizer.step();
		}

		sumBest += optimizer.getBestFitness();
		sumMean += optimizer.getMeanFitness();
	}

	var averageBest = sumBest / trials;
	var averageMean = sumMean / trials;

	// post result
	self.postMessage({
		averageBest: averageBest,
		averageMean: averageMean,
		message: 'result'
	});
};
