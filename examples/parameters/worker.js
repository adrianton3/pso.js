'use strict';

importScripts('../../src/pso.js');

self.onmessage = function (ev) {
	// setup optimizer
	var objectiveFunction = function (x) {
		return -(20 +
			Math.pow(x[0], 2) + Math.pow(x[1], 2) +
			-10 * (Math.cos(Math.PI * 2 * x[0]) + Math.cos(Math.PI * 2 * x[1])));
	};

	var domain = [new pso.Interval(-5.12, 5.12), new pso.Interval(-5.12, 5.12)];

	var optimizer = new pso.Optimizer();

	optimizer.setOptions({
		inertiaWeight: ev.data.inertiaWeight,
		social: ev.data.social,
		personal: ev.data.personal
	});
	optimizer.setObjectiveFunction(objectiveFunction);


	var trials = 500;
	var nBatches = 4;
	var batchSize = trials / nBatches;

	var sumBest = 0;
	var sumMean = 0;
	var runs = 0;

	// run batches
	for (var i = 0; i < nBatches; i++) {

		// run a batch
		for (var j = 0; j < batchSize; j++) {
			optimizer.init(ev.data.initialPopulationSize, domain);

			// step the optimizer
			for (var k = 0; k < ev.data.iterations; k++) {
				optimizer.step();
			}

			sumBest += optimizer.getBestFitness();
			sumMean += optimizer.getMeanFitness();

			runs++;
		}

		var averageBest = sumBest / runs;
		var averageMean = sumMean / runs;

		// post batch stats
		self.postMessage({
			averageBest: averageBest,
			averageMean: averageMean,
			index: ev.data.index,
			message: 'partial'
		});
	}

	// terminate
	self.postMessage({
		message: 'idle'
	});
};
