/* global p2, throttler */
(function () {
	'use strict';

	function makeSimulation() {
		var zoom = 30;
		var world;

		var entities = [];
		var mainBall;

		function addEntity(body, color, drawMethod, type) {
			var entity = {
				body: body,
				color: color,
				drawMethod: drawMethod,
				type: type
			};

			body.entity = entity;
			world.addBody(body);
			entities.push(entity);
			return entity;
		}

		var score = 0;

		function removeEntity(entity) {
			var index = entities.indexOf(entity);
			if (index > -1) {
				entities.splice(index, 1);
				world.removeBody(entity.body);
				score++;
			}
		}

		function getBox(x, y, w, h, mass, material) {
			var shape = new p2.Rectangle(w, h);
			shape.material = material;

			var body = new p2.Body({
				mass: mass,
				position: [x, y]
			});
			body.addShape(shape);
			return body;
		}

		function getBall(x, y, r, mass, material) {
			var shape = new p2.Circle(r);
			shape.material = material;

			var body = new p2.Body({
				mass: mass,
				position: [x, y]
			});
			body.addShape(shape);
			return body;
		}

		function getHole(x, y, r) {
			var shape = new p2.Circle(r);
			shape.sensor = true;
			var body = new p2.Body({
				mass: 0,
				position: [x, y]
			});
			body.addShape(shape);
			world.addBody(body);
			return body;
		}

		function placeAll() {
			var COLORS = {
				wall: 'hsla(200, 70%, 40%, 1)',
				hole: 'hsla(200, 70%, 50%, 1)',
				ball: 'hsla(340, 90%, 60%, 1)',
				main: 'hsla(340, 100%, 40%, 1)'
			};

			var groundMaterial = new p2.Material();
			var boxMaterial = new p2.Material();

			function placeWalls() {
				var thickness = 0.3;
				var length = 6.8;
				var height = 10.8;

				[
					{ x:  4,  y:  0, width: thickness, height: height },
					{ x: -4,  y:  0, width: thickness, height: height },
					{ x:  0,  y:  6, width: length, height: thickness },
					{ x:  0,  y: -6, width: length, height: thickness }
				].forEach(function (attributes) {
					var box = getBox(attributes.x, attributes.y, attributes.width, attributes.height, 0, groundMaterial);
					addEntity(box, COLORS.wall, drawBox);
				});
			}

			function placeBalls() {
				var radius = 0.4;
				var dY = Math.sqrt(3) / 2;
				var baseY = 4;

				[
					{ x: -1.5, y: baseY - dY },
					{ x: -0.5, y: baseY - dY },
					{ x:  0.5, y: baseY - dY },
					{ x:  1.5, y: baseY - dY },
					{ x: -1.0, y: baseY - 2 * dY },
					{ x:  0.0, y: baseY - 2 * dY },
					{ x:  1.0, y: baseY - 2 * dY },
					{ x: -0.5, y: baseY - 3 * dY },
					{ x:  0.5, y: baseY - 3 * dY },
					{ x:  0.0, y: baseY - 4 * dY }
				].forEach(function (position) {
					var ball = getBall(position.x, position.y, radius, 1, boxMaterial);
					addEntity(ball, COLORS.ball, drawBall);
				});
			}

			function placeHoles() {
				var radius = 0.6;

				[
					{ x:  4, y:  6 },
					{ x: -4, y:  6 },
					{ x: -4, y: -6 },
					{ x:  4, y: -6 },
					{ x:  4, y:  0 },
					{ x: -4, y:  0 }
				].forEach(function (position) {
					var hole = getHole(position.x, position.y, radius);
					addEntity(hole, COLORS.hole, drawBall, 'sensor');
				});
			}

			placeWalls();
			placeBalls();
			placeHoles();

			mainBall = addEntity(getBall(0, -3, 0.4, 1, boxMaterial), COLORS.main, drawBall);

			world.addContactMaterial(new p2.ContactMaterial(boxMaterial, groundMaterial, {
				friction: 0.6
			}));

			world.on('beginContact', function (ev) {
				var entityA = ev.bodyA.entity;
				var entityB = ev.bodyB.entity;

				if (entityA.type === 'sensor') {
					removeEntity(entityB);
				} else if (entityB.type === 'sensor') {
					removeEntity(entityA);
				}
			});
		}

		function initCanvas(canvas) {
			DrawA.init(canvas);
		}

		function initWorld() {
			world = new p2.World({
				gravity: [0, 0]
			});

			world.defaultContactMaterial.friction = 0.0;
			world.setGlobalStiffness(1e5);

			placeAll();
		}

		function drawBox(body) {
			DrawA.rect(
				body.position[0],
				body.position[1],
				body.shapes[0].width,
				body.shapes[0].height,
				body.angle
			);
		}

		function drawBall(body) {
			DrawA.circle(
				body.position[0],
				body.position[1],
				body.shapes[0].radius
			);
		}

		function render() {
			DrawA.con2d.clearRect(0, 0, DrawA.canvas.width, DrawA.canvas.height);

			DrawA.con2d.save();
			DrawA.con2d.translate(DrawA.canvas.width / 2, DrawA.canvas.height / 2);
			DrawA.con2d.scale(zoom, -zoom);

			DrawA.con2d.strokeStyle = 'none';

			entities.forEach(function (entity) {
				DrawA.con2d.fillStyle = entity.color;
				entity.drawMethod(entity.body);
			});

			DrawA.con2d.restore();
		}

		var nFrames = 300;
		var stepSize = 1 / 60;

		function animate(params, canvas, completionCallback) {
			initCanvas(canvas);
			initWorld();

			mainBall.body.applyForce(
				[Math.cos(params.angle) * params.force, Math.sin(params.angle) * params.force],
				[mainBall.body.position[0], mainBall.body.position[1]]
			);

			throttler.repeatAnim(nFrames, function () {
				world.step(stepSize);
				render();
			}, completionCallback);
		}

		function compute(params) {
			initWorld();

			mainBall.body.applyForce(
				[Math.cos(params.angle) * params.force, Math.sin(params.angle) * params.force],
				[mainBall.body.position[0], mainBall.body.position[1]]
			);

			for (var i = 0; i < nFrames; i++) {
				world.step(stepSize);
			}

			return score;
		}

		return {
			animate: animate,
			compute: compute
		};
	}

	window.makeSimulation = makeSimulation;
})();
