'use strict';

var pso = require('../../src/pso.js');

// create the optimizer
var optimizer = new pso.Optimizer();
optimizer.setObjectiveFunction(function (x) {
	return -(x[0] * x[0] + x[1] * x[1]);
});

// define the solution space and initialize 20 particles in it
var domain = [{ start: -10, end: 10 }, { start: -10, end: 10 }];
optimizer.init(20, domain);

// run the optimizer 40 iterations
for (var i = 0; i < 40; i++) {
	optimizer.step();
}

// print the best found fitness value and position in the search space
console.log('Best solution found', optimizer.getBestFitness());
console.log('at', optimizer.getBestPosition());