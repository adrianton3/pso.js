(function () {
	'use strict';

	var idle = true;
	var nCores = navigator.hardwareConcurrency ? navigator.hardwareConcurrency : 1;
	var workerPool = makePool(Math.max(nCores - 1, 1));

	function setStatus(text) {
		document.getElementById('status').innerText = text;
	}

	function setIdle(text) {
		idle = true;
		setStatus(text);

		document.getElementById('search').disabled = false;
	}

	function setBusy(text) {
		idle = false;
		setStatus(text);

		document.getElementById('search').disabled = true;
	}

	document.getElementById('search').addEventListener('click', function () {
		if (!idle) { return; }

		setBusy('searching for an optimal walker');

		var initialPopulationSize = 14;
		var iterationNMax = 25;

		var domain = [
			new pso.Interval(-8, 8),
			new pso.Interval(-8, 8),
			new pso.Interval(-8, 8),
			new pso.Interval(-8, 8),
			new pso.Interval(2, 10)
		];

		// get a new optimizer and set it up
		var optimizer = new pso.Optimizer();
		optimizer.setObjectiveFunction(workerPool.compute, { async: true });
		optimizer.init(initialPopulationSize, domain);

		// ---
		function removeChildren(element) {
			while (element.firstChild) {
				element.removeChild(element.firstChild);
			}
		}

		var bestList = document.getElementById('best');
		var worstList = document.getElementById('worst');

		removeChildren(bestList);
		removeChildren(worstList);

		function animate(x) {
			if (!idle) { return; }

			// play the best solution found
			setBusy('running simulation');
			var pool = makeSimulation();
			pool.animate({
					joint1Speed: x[0],
					joint11Speed: x[1],
					joint2Speed: x[2],
					joint22Speed: x[3],
					bodyLength: x[4]
				}, document.getElementById('can'),
				setIdle.bind(null, 'idle')
			);
		}

		function displayResults() {
			function populateList(element, entries, offset) {
				entries.forEach(function (entry, index) {
					var li = document.createElement('li');
					li.textContent = (index + 1 + offset) + '. best fitness: ' +
						entry.bestFitness.toFixed(2) + '; current fitness: ' + entry.fitness.toFixed(2);

					li.addEventListener('click', function () {
						animate(entry.bestPosition);
					});

					element.appendChild(li);
				})
			}

			var particles = optimizer.getParticles();
			particles.sort(function (a, b) {
				return b.bestFitness - a.bestFitness;
			});

			populateList(bestList, particles.slice(0, 3), 0);
			populateList(worstList, particles.slice(-3), initialPopulationSize - 3);

			animate(particles[0].bestPosition);
		}

		var iterations = 0;
		function loop() {
			if (iterations >= iterationNMax) {
				setIdle('optimization done; replaying best solution found');
				displayResults();
			} else {
				iterations++;
				setStatus('optimizing: iteration ' + iterations + '/' + iterationNMax);
				optimizer.step(loop);
			}
		}

		loop();
	});
})();