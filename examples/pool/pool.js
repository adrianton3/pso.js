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
		}
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
		}
	}

	function ifIdle(fun) {
		return condition(isIdle, begin(setBusy, fun));
	}

	var plot = ifIdle(function () {
		space.resolutionX = +document.getElementById('resolutionX').value;
		space.resolutionY = +document.getElementById('resolutionY').value;

		plotter.resolve(space, function (angle, force) {
			var pool = makeSimulation();
			return pool.compute({ angle: angle, force: force });
		}, function (i, total) {
			setStatus('plotting; computing cell ' + i + ' out of ' + total);
		}, setIdle.bind(null, 'Idle'));
	});

	document.getElementById('plot').addEventListener('click', plot);

	plot();

	// set up the click-on-the-canvas-to-get-an-animation
	reverseCoords.bind(
		document.getElementById('plot-can'),
		space,
		plotter.zoom,
		ifIdle(function (x, y) {
			console.log('angle:', x, 'force:', y);

			var pool = makeSimulation();
			pool.animate({
				angle: x,
				force: y
			}, document.getElementById('sim-can'),
				setIdle.bind(null, 'Idle')
			);
		}));


	document.getElementById('best').addEventListener('click', ifIdle(function () {
		var initialPopulationSize = 20;
		var domain = [new Interval(Math.PI / 3, Math.PI / 2), new Interval(200, 2000)];
		var iterationNMax = 50;

		// get a new optimizer and set it up
		var pso = new PSO();
		pso.setOptions();
		pso.setObjectiveFunction(function (x) {
			var pool = makeSimulation();
			return pool.compute({ angle: x[0], force: x[1] });
		});
		pso.init(initialPopulationSize, domain);

		// start the search
		throttler.repeatDelayed(iterationNMax, function (i) {
			pso.step();
			setStatus('optimizing; running iteration ' + i + ' out of ' + iterationNMax);
		}, function () {
			var position = pso.getBestPosition();

			// play the best solution found
			var pool = makeSimulation();
			pool.animate({
				angle: position[0],
				force: position[1]
			}, document.getElementById('sim-can'),
				setIdle.bind(null, 'Idle')
			);
		});
	}));
})();