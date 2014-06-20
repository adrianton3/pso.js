(function () {
	'use strict';

	function populateSelect(id, start, end, step) {
		var select = document.getElementById(id);
		for (var i = start; i <= end; i += step) {
			var option = document.createElement('option');
			option.value = i + '';
			option.text = i + '';
			select.appendChild(option);
		}
	}

	populateSelect('resolutionX', 10, 120, 10);
	populateSelect('resolutionY', 10, 120, 10);

	populateSelect('particles', 10, 30, 2);
	populateSelect('iterations', 10, 70, 10);

	plotter.init(document.getElementById('plot-can'));

	var space = {
		domainX: {
			start: Math.PI / 3,
			end: Math.PI / 2
		},
		resolutionX: 10,
		domainY: {
			start: 200,
			end: 2000
		},
		resolutionY: 10
	};

	function plot() {
		space.resolutionX = +document.getElementById('resolutionX').value;
		space.resolutionY = +document.getElementById('resolutionY').value;

		plotter.resolve(space, function (angle, force) {
			var pool = makeSimulation();
			return pool.compute({ angle: angle, force: force });
		}); // on complete
	}

	document.getElementById('plot').addEventListener('click', plot);

	plot();

	reverseCoords.bind(
		document.getElementById('plot-can'),
		space,
		plotter.zoom,
		function (x, y) {
			console.log('angle:', x, 'force:', y);

			var pool = makeSimulation();
			pool.animate({
				angle: x,
				force: y
			}, document.getElementById('sim-can'));
		});


	document.getElementById('best').addEventListener('click', function () {
		var initialPopulationSize = 20;
		var domain = [new Interval(Math.PI / 3, Math.PI / 2), new Interval(200, 2000)];
		var iterationNMax = 50;

		var pso = new PSO();
		pso.setOptions();
		pso.setObjectiveFunction(function (x) {
			var pool = makeSimulation();
			return pool.compute({ angle: x[0], force: x[1] });
		});
		pso.init(initialPopulationSize, domain);

		throttler.repeatDelayed(iterationNMax, function (i) {
			pso.step();
			console.log(i, iterationNMax);
		}, complete);

		function complete() {
			var position = pso.getBestPosition();
			var score = pso.getBestFitness();
			console.log('score:', score);

			var pool = makeSimulation();
			pool.animate({
				angle: position[0],
				force: position[1]
			}, document.getElementById('sim-can'));

			// idle
			// set status
		}
	});
})();