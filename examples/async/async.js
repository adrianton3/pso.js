(function () {
	'use strict';

	var outTextarea = document.getElementById('out');
	function log(text) {
		outTextarea.value += text;
	}


	var optimizer = new pso.Optimizer();

	optimizer.setObjectiveFunction(function (x, done) {
		setTimeout(function () {
			log('x');
			done(-Math.pow(x[0], 2));
		}, Math.random() * 800 + 20);
	}, {
		async: true
	});

	var initialPopulationSize = 20;
	var domain = [new pso.Interval(-5, 5)];

	optimizer.init(initialPopulationSize, domain);

	var iterations = 0, maxIterations = 10;
	function loop() {
		if (iterations >= maxIterations) {
			log([
				'\n--- ---\nOptimization done',
				'Best value found: ' + optimizer.getBestFitness(),
				''
			].join('\n'));
		} else {
			iterations++;
			log('\nIteration ' + iterations + '/' + maxIterations + ' ');
			optimizer.step(loop);
		}
	}

	log('Starting optimizer');
	loop();
})();