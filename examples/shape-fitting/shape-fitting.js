(function() {
    'use strict';

    var optimizer = new pso.Optimizer();
    var iterationNMax = 20;
    var initialPopulationSize;

    var domain;
	var shapes;
	var nShapes = 4;
	var shapeGenerators = {
		style: {
			regular: function () { return 0.2; },
			star: function (i) { return (i % 2) * 0.15 + 0.05; },
			random: function () { return Math.random() * 0.2 + 0.05; }
		},
		angles: {
			triangle: function () { return 3; },
			tetragon: function () { return 4; },
			pentagon: function () { return 5; },
			hexagon: function () { return 6; },
			octogon: function () { return 8; },
			random: function () { return Math.floor(Math.random() * 5) + 3; }
		}
	};
	var currentGenerator = {
		style: shapeGenerators.style.random,
		angles: shapeGenerators.angles.random
	};

	var running = false;

	function repeat(n, fun) {
		var ret = [];

		for (var i = 0; i < n; i++) {
			ret.push(fun(i));
		}

		return ret;
	}

	function getShape() {
		var nPoints = currentGenerator.angles();
		return {
			color: getRandomColor(),
			points: repeat(nPoints, function (i) {
				var angle = i / nPoints * Math.PI * 2;
				var radius = currentGenerator.style(i);
				return {
					x: Math.cos(angle) * radius,
					y: Math.sin(angle) * radius
				};
			})
		};
	}

	function getShapes(n) {
		return repeat(n, getShape);
	}

	function getDomain(n) {
		var domain = [];
		repeat(n, function () {
			domain.push(
				new pso.Interval(0, 1),
				new pso.Interval(0, 1),
				new pso.Interval(0, Math.PI * 2),
				new pso.Interval(0.2, 1.4)
			);
		});
		return domain;
	}

    var objectiveFunction = (function () {
		var dim = 32;
		var canvas = document.createElement('canvas');
		canvas.width = dim;
		canvas.height = dim;

		var con2d = canvas.getContext('2d');
		con2d.clearStyle = '#FFF';
		con2d.fillStyle = 'rgba(16, 16, 16, 0.5)';
		con2d.scale(dim, dim);

		return function (x) {
			// clear
			con2d.clearRect(0, 0, dim, dim);

			// draw shapes
			shapes.forEach(function (shape, i) {
				var cx = x[i * 4 + 0];
				var cy = x[i * 4 + 1];
				var angle = x[i * 4 + 2];
				var scale = Math.min(x[i * 4 + 3], 1.4);
				drawShape(con2d, shape.points, cx, cy, angle, scale);
			});

			// read back data and start counting
			var overlapped = 0;
			var empty = 0;

			var data = con2d.getImageData(0, 0, dim, dim).data;
			for (var i = 0; i < data.length; i += 4) {
				if (data[i] > 20) {
					overlapped += data[i];
				} else if (data[i] === 0) {
					empty++;
				}
			}

			return -(Math.pow(empty, 2) + Math.pow(overlapped, 2));
		};
	})();

	function drawShape(con2d, shape, x, y, angle, scale) {
		con2d.save();
		con2d.translate(x, y);
		con2d.rotate(angle);
		con2d.scale(scale, scale);

		con2d.beginPath();
		con2d.moveTo(shape[0].x, shape[0].y);
		for (var i = 1; i < shape.length; i++) {
			con2d.lineTo(shape[i].x, shape[i].y);
		}
		con2d.fill();

		con2d.restore();
	}

    function getRandomColor() {
        var angle = Math.random() * 2 * Math.PI;
        var r = Math.floor((Math.sin(angle) + 1) / 2 * 255);
        var g = Math.floor((Math.sin(angle + Math.PI * 2 / 3) + 1) / 4 * 255);
        var b = Math.floor((Math.sin(angle + Math.PI * 4 / 3) + 1) / 16 * 255);

        return 'rgb(' + r + ',' + g + ',' + b + ')';
    }

    function reset() {
		if (running) { return; }

		updateShapeParameters();
		shapes = getShapes(nShapes);
		domain = getDomain(nShapes);

        Draw.clear();
    }

	function runningOn() {
		running = true;
		document.getElementById('but_reset').disabled = true;
		document.getElementById('but_best').disabled = true;
	}

	function runningOff() {
		running = false;
		document.getElementById('but_reset').disabled = false;
		document.getElementById('but_best').disabled = false;
	}

    function best() {
		if (running) { return; }

		updatePsoParameters();

		optimizer.init(initialPopulationSize, domain);

		var iteration = 1;
		runningOn();

		function loop() {
			if (iteration < iterationNMax) {
				requestAnimationFrame(loop);
				iteration++;
			} else {
				runningOff();
			}

			optimizer.step();

			var position = optimizer.getBestPosition();

			Draw.clear();
			for (var i = 0; i < nShapes; i++) {
				Draw.fillColor(shapes[i].color);

				var cx = position[i * 4 + 0];
				var cy = position[i * 4 + 1];
				var angle = position[i * 4 + 2];
				var scale = position[i * 4 + 3];

				Draw.save();

				Draw.translate(cx, cy);
				Draw.rotate(angle);
				Draw.scale(scale, scale);

				Draw.poly(shapes[i].points);

				Draw.restore();
			}
		}

		loop();
    }

    function updatePsoParameters() {
        iterationNMax = parseInt(document.getElementById('inp_niter').value);

        initialPopulationSize = parseInt(document.getElementById('inp_popinit').value);
        var inertiaWeight = parseFloat(document.getElementById('inp_accel').value);
        var social = parseFloat(document.getElementById('inp_social').value);
        var personal = parseFloat(document.getElementById('inp_personal').value);

        optimizer.setOptions({
            inertiaWeight: inertiaWeight,
            social: social,
            personal: personal
        });
    }

	function updateShapeParameters() {
		var shapeAngles = document.getElementById('shape-angles');
		var shapeStyle = document.getElementById('shape-style');

		var angles = shapeAngles.options[shapeAngles.selectedIndex].value;
		var style = shapeStyle.options[shapeStyle.selectedIndex].value;

		currentGenerator.style = shapeGenerators.style[style];
		currentGenerator.angles = shapeGenerators.angles[angles];
	}

    function setup() {
        Draw.init(document.getElementById('canvascircles'));

        document.getElementById('but_reset').addEventListener('click', reset);
        document.getElementById('but_best').addEventListener('click', best);

        optimizer.setObjectiveFunction(objectiveFunction);

        Draw.clearColor('#FFF');
        Draw.lineColor('#000');

		Draw.scale(500, 500);

		updateShapeParameters();
		shapes = getShapes(nShapes);
		domain = getDomain(nShapes);
    }

    window.addEventListener('load', setup);
})();
