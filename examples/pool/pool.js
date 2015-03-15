/* global plotter, makeSimulation, reverseCoords, throttler */
(function () {
	'use strict';

	function populateSelect(id, start, end, step, def) {
		var select = document.getElementById(id);
		for (var i = start; i <= end; i += step) {
			var option = document.createElement('option');
			option.value = i + '';
			option.text = i + '';
			if (def === i) {
				option.selected = 'selected';
			}
			select.appendChild(option);
		}
	}

	populateSelect('resolutionX', 10, 120, 10, 10);
	populateSelect('resolutionY', 10, 120, 10, 10);

	populateSelect('particles', 10, 30, 2, 20);
	populateSelect('iterations', 10, 70, 10, 50);

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

	var idle = true;

	function setStatus(text) {
		document.getElementById('status').innerText = text;
	}

	function setIdle(text) {
		idle = true;
		if (text) {
			setStatus(text);
		}

		var buttons = Array.prototype.slice.call(document.getElementsByTagName('button'), 0);
		buttons.forEach(function (button) {
			button.disabled = false;
		});
	}

	function setBusy(text) {
		idle = false;
		if (text) {
			setStatus(text);
		}

		var buttons = Array.prototype.slice.call(document.getElementsByTagName('button'), 0);
		buttons.forEach(function (button) {
			button.disabled = true;
		});
	}

	function condition(predicate, body) {
		return function () {
			if (predicate()) {
				body.apply(null, arguments);
			}
		};
	}

	function isIdle() {
		return idle;
	}

	function begin() {
		var funs = Array.prototype.slice.call(arguments, 0);
		return function () {
			var args = arguments;
			funs.forEach(function (fun) {
				fun.apply(null, args);
			});
		};
	}

	function ifIdle(fun) {
		return condition(isIdle, begin(setBusy, fun));
	}

	function printGreeting() {
		var canvas = document.getElementById('sim-can');
		var con2d = canvas.getContext('2d');

		con2d.font = '12px sans-serif';

		var text = 'When the plotting is done, click on the canvas \nto run the simulation associated with that pair of parameters';
		text.split('\n').forEach(function (line, i) {
			con2d.fillText(line, 10, 200 + i * 14);
		});
	}

	var plot = ifIdle(function () {
		space.resolutionX = +document.getElementById('resolutionX').value;
		space.resolutionY = +document.getElementById('resolutionY').value;

		plotter.resolve(space, function (angle, force) {
			var pool = makeSimulation();
			return pool.compute({ angle: angle, force: force });
		}, function (i, total) {
			setStatus('plotting; computing cell ' + i + ' out of ' + total);
		}, setIdle.bind(null, 'idle'));
	});

	document.getElementById('plot').addEventListener('click', plot);

	printGreeting();
	plot();

	// set up the click-on-the-canvas-to-get-an-animation
	reverseCoords.bind(
		document.getElementById('plot-can'),
		space,
		plotter.zoom,
		ifIdle(function (x, y) {
			setStatus('running simulation for (angle: ' + x + ', force: ' + y + ')');

			var pool = makeSimulation();
			pool.animate({
				angle: x,
				force: y
			}, document.getElementById('sim-can'),
				setIdle.bind(null, 'idle')
			);
		}));


	document.getElementById('best').addEventListener('click', ifIdle(function () {
		var initialPopulationSize = +document.getElementById('particles').value;
		var iterationNMax = +document.getElementById('iterations').value;

		var domain = [new pso.Interval(Math.PI / 3, Math.PI / 2), new pso.Interval(200, 2000)];

		// get a new optimizer and set it up
		var optimizer = new pso.Optimizer();
		optimizer.setObjectiveFunction(function (x) {
			var pool = makeSimulation();
			return pool.compute({ angle: x[0], force: x[1] });
		});
		optimizer.init(initialPopulationSize, domain);

		// start the search
		throttler.repeatDelayed(iterationNMax, function (i) {
			optimizer.step();
			setStatus('optimizing; running iteration ' + i + ' out of ' + iterationNMax);
		}, function () {
			var position = optimizer.getBestPosition();

			// play the best solution found
			setStatus('running simulation for (angle: ' + position[0] + ', force: ' + position[1] + ')');
			var pool = makeSimulation();
			pool.animate({
				angle: position[0],
				force: position[1]
			}, document.getElementById('sim-can'),
				setIdle.bind(null, 'idle')
			);
		});
	}));
})();
