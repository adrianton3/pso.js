(function() {
	'use strict';

	var parameterListing;
	var parameters;
	var gui;
	var mechanism;
	var dummy;

	var mouseState = {
		down: false
	};
	
	var animationState = {
		running: false,
		oldTime: 0
	};
	
	var userPointSet = [];
	var mechanismPointSet = [];

	var defaultNWorkers = 4;
	
	window.addEventListener('load', setup);

	function getDefaults(parameterListing) {
		var obj = {};
		parameterListing.forEach(function(element) {
			obj[element.key] = element.def;
		});
		return obj;
	}
	
	function getDomain(parameterListing) {
		return parameterListing.map(function(element) {
			return element.interval;
		});
	}
	
	function getParameters(ar, parameterListing, store) {
		var obj = store || {};
		ar.forEach(function(element, index) {
			obj[parameterListing[index].key] = element;
		});
		return obj;
	}

	function setup() {
		function setupCanvas() {
			var canvas = document.getElementById('canvaspso');
			Draw.init(canvas);
            Draw.clearColor('#F00');
	
			canvas.addEventListener('mousemove', onMouseMove, false);
			canvas.addEventListener('mousedown', onMouseDown, false);
			canvas.addEventListener('mouseup', onMouseUp, false);
		}
		
		function setupParameters() {
			parameterListing = [
				{ key: 'cog1X', def: 400, interval: new pso.Interval(350, 500) },
				{ key: 'cog1Y', def: 400, interval: new pso.Interval(350, 450) },
				{ key: 'cog1R', def: 50, interval: new pso.Interval(10, 90) },
				
				{ key: 'cog2X', def: 200, interval: new pso.Interval(50, 250) },
				{ key: 'cog2Y', def: 400, interval: new pso.Interval(350, 450) },
				{ key: 'cog2R', def: 50, interval: new pso.Interval(10, 90) },
				{ key: 'cog2AngleOffset', def: 0, interval: new pso.Interval(0, Math.PI * 2) },
				
				{ key: 'rod1Len', def: 120, interval: new pso.Interval(80, 200) },
				{ key: 'rod2Len', def: 120, interval: new pso.Interval(80, 200) },
				{ key: 'rod1Ext', def: 120, interval: new pso.Interval(80, 200) }
			];
			
			parameters = getDefaults(parameterListing);
		}
		
		function setupMechanism() {
			mechanism = new Mechanism(parameters);
		}
		
		function setupGUI() {
			gui = new dat.GUI();
			
			parameterListing.forEach(function (element) {
				gui.add(parameters, element.key, element.interval.start, element.interval.end, 0.1).onChange(function(value) {
					Draw.clear();
					drawUserPointSet();
					mechanismPointSet = mechanism.getPointSet(100);
					drawMechanismPointSet();
					if (!animationState.running) mechanism.drawAt(0);
				});
			});
			
			gui.add(dummy, 'animate');
			gui.add(dummy, 'search');
			gui.add(dummy, 'reset');
		}
		
		function setupDummy() {
			dummy = {};
			dummy.animate = startStopAnimation.bind(this);
			dummy.search = run;
			dummy.reset = reset;
		}
		
		setupCanvas();
		setupParameters();
		setupMechanism();		
		setupDummy();
		
		setupGUI();
	}
//=============================================================================
	function reset() {
		if (!searching) {
			stopAnimation();
			userPointSet = [];
			Draw.clear();
		}
	}
//=============================================================================
	function startAnimation() {
		if (animationState.running) return ;
		
		mechanismPointSet = mechanism.getPointSet(100);
		
		var accumulatedProgress = 0;
		var oldTime = 0;
		
		animationState.running = true;
		var loop = function (time) {
			if (animationState.running) {
				var delta = time - oldTime; 
				oldTime = time;
				
				Draw.clear();				
				drawUserPointSet();				
				drawMechanismPointSet();
				
				mechanism.drawAt(accumulatedProgress);
				if (!isNaN(delta)) {
					accumulatedProgress += delta * 0.002;
				}
			
				if (animationState.running) {
					animationState.requestId = requestAnimationFrame(loop);
				}
			}
		}.bind(this);
		
		loop();
	}
	
	function stopAnimation() {
		if (!animationState.running) return ;
		
		animationState.running = false;
		cancelAnimationFrame(animationState.requestId);
		
		Draw.clear();
		drawUserPointSet();
		mechanismPointSet = mechanism.getPointSet(100);
		drawMechanismPointSet();
		mechanism.drawAt(0);
	}
	
	function startStopAnimation() {
		if (!animationState.running) startAnimation();
		else stopAnimation();
	}
//=============================================================================
	function drawUserPointSet() {
		Draw.lineWidth(3);
		Draw.lineColor('#E80');
		Draw.path(userPointSet);
	}
	
	function drawMechanismPointSet(pointSet) {
		Draw.lineWidth(1.2);
		Draw.lineColor('#FFF');
		Draw.path(mechanismPointSet);
	}
//=============================================================================
	var searching = false;

	function run() {
		if (searching) return ;
		searching = true;
		var bestFitness = -Infinity;
		stopAnimation();
		Draw.clear();
		drawUserPointSet();
		
		var nWorkers = navigator.hardwareConcurrency || defaultNWorkers;
		for (var i = 0; i < nWorkers; i++) {
			var worker = new Worker('worker.js');
			worker.postMessage({ userPointSet: userPointSet, parameterListing: parameterListing, id: i });
			worker.onmessage = onMessage;
		}
		
		var doneRecv = 0;
		var doneExpected = nWorkers;
		
		function onMessage(ev) {
			if (ev.data.done) {
				doneRecv++;
				if(doneRecv >= doneExpected) {
					searching = false;
					startAnimation();
				}
			} else {
				var candidateBestFitness = ev.data.bestFitness;
				if (candidateBestFitness > bestFitness) {
					bestFitness = candidateBestFitness;
					var bestPosition = ev.data.bestPosition;
					getParameters(bestPosition, parameterListing, parameters);
					
					Draw.clear();
					drawUserPointSet();
					
					mechanismPointSet = mechanism.getPointSet(100);
					drawMechanismPointSet();
					mechanism.drawAt(0);
				}
			}
		}
	}
//=============================================================================
	function onMouseUp(ev) {
		ev.preventDefault();
		mouseState.down = false;
	}

	function onMouseDown(ev) {
		ev.preventDefault();
		mouseState.down = true;
	}

	function onMouseMove(ev) {
		ev.preventDefault();
		paint(mouseGetCoord(ev));
	}

	function paint(coord) {
		if(mouseState.down) {
			userPointSet.push(new Point(coord.x, coord.y));
			Draw.clear();
			drawUserPointSet();
		}
	}

	function mouseGetCoord(ev) {
		return new Point(ev.layerX, ev.layerY);
	}

	function Point(x, y) {
		this.x = x;
		this.y = y;
	}
})();
