/* global p2, throttler */
(function () {
	'use strict';

	var COLORS = {
		WALKER: {
			BODY: 'hsl(208, 100%, 70%)',
			LEGS: 'hsl(208, 100%, 80%)'
		},
		GROUND: 'hsl(208, 100%, 90%)'
	};

	var COLLISION = {
		BODY: 1,
		GROUND: 2
	};

	function makeSimulation() {
		var zoom = 16;
		var world;

		var entities = [];

		var nFrames = 1000;
		var stepSize = 1 / 60;

		function addEntity(body, color, drawMethod) {
			var entity = {
				body: body,
				color: color,
				drawMethod: drawMethod
			};

			body.entity = entity;
			world.addBody(body);
			entities.push(entity);
			return entity;
		}

		function addImmaterialEntity(color, drawMethod) {
			var entity = {
				color: color,
				drawMethod: drawMethod
			};
			entities.push(entity);
			return entity;
		}

		function getBox(x, y, width, height, mass, material) {
			var shape = new p2.Rectangle(width, height);
			shape.material = material;

			var body = new p2.Body({
				mass: mass,
				position: [x, y]
			});
			body.addShape(shape);
			return body;
		}

		function attachBox(parent, child, parentPivot, childPivot) {
			var joint = new p2.RevoluteConstraint(parent.body, child.body, {
				localPivotA: parentPivot,
				localPivotB: childPivot,
				collideConnected: false
			});
			world.addConstraint(joint);
			return joint;
		}

		function placeAll() {
			var groundMaterial = new p2.Material();

			function placeWalls() {
				var thickness = 6;
				var length = 500;

				var ground = addEntity(getBox(0, -7, length, thickness, 0, groundMaterial), COLORS.GROUND, drawBox);
				ground.body.shapes[0].collisionGroup = COLLISION.GROUND;
				ground.body.shapes[0].collisionMask = COLLISION.BODY;
			}

			function placeMarkers() {
				for (var i = -100; i < 100; i += 10) {
					addImmaterialEntity('black', getDrawMarker(i, i.toFixed(1)));
				}
			}

			placeWalls();
			placeMarkers();
		}

		function buildWalker(params) {
			var boxMaterial = new p2.Material();
			var legMaterial = new p2.Material();

			function setBodyCollisionGroup(body) {
				body.shapes[0].collisionGroup = COLLISION.BODY;
				body.shapes[0].collisionMask = COLLISION.GROUND;
			}

			var mainBox = addEntity(getBox(0, 0, params.bodyLength, 2, 10, boxMaterial), COLORS.WALKER.BODY, drawBox);
			setBodyCollisionGroup(mainBox.body);

			var leg1Box = addEntity(getBox(0, 0, 0.4, 2, 1, legMaterial), COLORS.WALKER.LEGS, drawBox);
			var joint1 = attachBox(mainBox, leg1Box, [params.bodyLength / 2, 0], [0, 1]);
			joint1.enableMotor();
			joint1.setMotorSpeed(params.joint1Speed);
			setBodyCollisionGroup(leg1Box.body);

			var leg11Box = addEntity(getBox(0, 0, 0.4, 2, 1, legMaterial), COLORS.WALKER.LEGS, drawBox);
			var joint11 = attachBox(leg1Box, leg11Box, [0, -1], [0, 1]);
			joint11.enableMotor();
			joint11.setMotorSpeed(params.joint11Speed);
			setBodyCollisionGroup(leg11Box.body);

			var leg2Box = addEntity(getBox(0, 0, 0.4, 2, 1, legMaterial), COLORS.WALKER.LEGS, drawBox);
			var joint2 = attachBox(mainBox, leg2Box, [-params.bodyLength / 2, 0], [0, 1]);
			joint2.enableMotor();
			joint2.setMotorSpeed(params.joint2Speed);
			setBodyCollisionGroup(leg2Box.body);

			var leg22Box = addEntity(getBox(0, 0, 0.4, 2, 1, legMaterial), COLORS.WALKER.LEGS, drawBox);
			var joint22 = attachBox(leg2Box, leg22Box, [0, -1], [0, 1]);
			joint22.enableMotor();
			joint22.setMotorSpeed(params.joint22Speed);
			setBodyCollisionGroup(leg22Box.body);

			return mainBox;
		}

		function initWorld() {
			world = new p2.World({
				gravity: [0, -10]
			});

			world.defaultContactMaterial.friction = 1.0;
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

		function getDrawMarker(x, text) {
			return function () {
				DrawA.con2d.save();
				DrawA.con2d.scale(1, -1);
				DrawA.con2d.fillText(text, x, 7.5);
				DrawA.line(x, 4, x, 6);
				DrawA.con2d.restore();
			};
		}

		function render(mainBox) {
			DrawA.con2d.clearRect(0, 0, DrawA.canvas.width, DrawA.canvas.height);

			DrawA.con2d.save();
			DrawA.con2d.translate(DrawA.canvas.width / 2, DrawA.canvas.height / 5 * 2);
			DrawA.con2d.scale(zoom, -zoom);
			DrawA.con2d.translate(-mainBox.body.position[0], 0);

			DrawA.con2d.strokeStyle = 'black';

			entities.forEach(function (entity) {
				DrawA.con2d.fillStyle = entity.color;
				entity.drawMethod(entity.body);
			});


			DrawA.line(mainBox.body.position[0], -10, mainBox.body.position[0], -8);

			DrawA.con2d.restore();
		}

		function animate(params, canvas, completionCallback) {
			DrawA.init(canvas);
			DrawA.con2d.lineWidth = 1 / zoom;
			DrawA.con2d.font = '0.7pt sans-serif';
			DrawA.con2d.textAlign = 'center';
			DrawA.con2d.textBaseline = 'middle';
			initWorld();
			var mainBox = buildWalker(params);

			throttler.repeatAnim(nFrames, function () {
				world.step(stepSize);
				render(mainBox);
			}, completionCallback);
		}

		function compute(params) {
			if (params.bodyLength < 0) { return -1024; }
			initWorld();

			var mainBox = buildWalker(params);

			for (var i = 0; i < nFrames; i++) {
				world.step(stepSize);
			}

			var score = mainBox.body.position[0];

			return score;
		}

		return {
			animate: animate,
			compute: compute
		};
	}

	if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
		self.makeSimulation = makeSimulation;
	}	else {
		window.makeSimulation = makeSimulation;
	}
})();