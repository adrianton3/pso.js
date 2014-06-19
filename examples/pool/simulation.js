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
			var groundMaterial = new p2.Material();
			var boxMaterial = new p2.Material();

			function placeWalls() {
				var thickness = 0.3;
				var length = 6.8;
				var height = 10.8;

				addEntity(getBox(4, 0, thickness, height, 0, groundMaterial), 'green', drawBox);
				addEntity(getBox(-4, 0, thickness, height, 0, groundMaterial), 'green', drawBox);
				addEntity(getBox(0, 6, length, thickness, 0, groundMaterial), 'green', drawBox);
				addEntity(getBox(0, -6, length, thickness, 0, groundMaterial), 'green', drawBox);
			}

			function placeBalls() {
				var radius = 0.4;
				var dY = Math.sqrt(3) / 2;
				var baseY = 4;

				addEntity(getBall(-1.5, baseY - 1 * dY, radius, 1, boxMaterial), 'red', drawBall);
				addEntity(getBall(-0.5, baseY - 1 * dY, radius, 1, boxMaterial), 'red', drawBall);
				addEntity(getBall(0.5, baseY - 1 * dY, radius, 1, boxMaterial), 'red', drawBall);
				addEntity(getBall(1.5, baseY - 1 * dY, radius, 1, boxMaterial), 'red', drawBall);

				addEntity(getBall(-1.0, baseY - 2 * dY, radius, 1, boxMaterial), 'red', drawBall);
				addEntity(getBall(0, baseY - 2 * dY, radius, 1, boxMaterial), 'red', drawBall);
				addEntity(getBall(1.0, baseY - 2 * dY, radius, 1, boxMaterial), 'red', drawBall);

				addEntity(getBall(-0.5, baseY - 3 * dY, radius, 1, boxMaterial), 'red', drawBall);
				addEntity(getBall(0.5, baseY - 3 * dY, radius, 1, boxMaterial), 'red', drawBall);

				addEntity(getBall(0, baseY - 4 * dY, radius, 1, boxMaterial), 'red', drawBall);
			}

			function placeHoles() {
				var radius = 0.6;

				addEntity(getHole(4, 6, radius), 'blue', drawBall, 'sensor');
				addEntity(getHole(-4, 6, radius), 'blue', drawBall, 'sensor');
				addEntity(getHole(-4, -6, radius), 'blue', drawBall, 'sensor');
				addEntity(getHole(4, -6, radius), 'blue', drawBall, 'sensor');
			}

			placeWalls();
			placeBalls();
			placeHoles();

			mainBall = addEntity(getBall(0, -3, 0.4, 1, boxMaterial), 'darkred', drawBall);

			world.addContactMaterial(new p2.ContactMaterial(boxMaterial, groundMaterial, {
				friction: 0.6
			}));

			world.on('beginContact', function (ev) {
				var entityA = ev.bodyA.entity;
				var entityB = ev.bodyB.entity;

				if (entityA.type === 'sensor') {
					removeEntity(entityB);
//					console.log(ev);
				} else if (entityB.type === 'sensor') {
					removeEntity(entityA);
//					console.log(ev);
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
		var frameCounter = 0;

		function animate(params, canvas) {
			initCanvas(canvas);
			initWorld();

			mainBall.body.applyForce(
				[Math.cos(params.angle) * params.force, Math.sin(params.angle) * params.force],
				[mainBall.body.position[0], mainBall.body.position[1]]
			);

			function loop() {
				frameCounter++;
				if (frameCounter >= nFrames) { return; }

				requestAnimationFrame(loop);
				world.step(stepSize);
				render();
			}

			loop();
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