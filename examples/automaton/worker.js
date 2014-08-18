importScripts('../../src/pso.js');
importScripts('mechanism.js');

var parameters;
var mechanism;
var id;

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

onmessage = function(ev) {
	id = ev.data.id;
	var userPointSet = ev.data.userPointSet;
	var parameterListing = ev.data.parameterListing;

	parameters = getDefaults(parameterListing);
	mechanism = new Mechanism(parameters);

	var domain = getDomain(parameterListing);
	var nStep = 50;
	var initialPopulationSize = 30;

	var bestFit = -Infinity;
	var bestPosition;
	var nTrials = 5;

	for (var i = 0; i < nTrials; i++) {
		var candidate = runPSO(domain, computeFitness, nStep, initialPopulationSize);
		if (candidate.bestFitness > bestFit) {
			bestFitness = candidate.bestFitness;
			bestPosition = candidate.bestPosition;

			postMessage({ bestFitness: bestFitness, bestPosition: bestPosition });
		}
	}

	postMessage({ done: true });
	self.close();

//-----------------------------------------------------------------------------
	function computeDistances(targetPointSet, candidatePointSet) {
	// verify for impossible paths
	for (var i = 0; i < candidatePointSet.length; i++) {
		var candidatePoint = candidatePointSet[i];
		if (isNaN(candidatePoint.x) || isNaN(candidatePoint.y)) {
			return 100000;
		}
	}

	// compute sum of mse
	var sum = 0;

	targetPointSet.forEach(function(targetPoint){
		var min = Infinity;
		candidatePointSet.forEach(function(candidatePoint) {
			var dist = Math.sqrt(Math.pow(targetPoint.x - candidatePoint.x, 2) + Math.pow(targetPoint.y - candidatePoint.y, 2));
			if (dist < min) {
				min = dist;
			}
		});
		sum += min;
	});

	return sum;
}

	function computeFitness(ar) {
		var cycles = 100;

		getParameters(ar, parameterListing, parameters);
		var candidatePointSet = mechanism.getPointSet(cycles);
		var dist = -computeDistances(userPointSet, candidatePointSet);
		return dist;
	}

	function runPSO(domain, objectiveFunction, nStep, initialPopulationSize) {
    var optimizer = new pso.Optimizer();
    optimizer.setOptions({
	 		inertiaWeight: 0.8,
	 		social: 0.6,
	 		personal: 0.4
		});
    optimizer.init(initialPopulationSize, domain);
    optimizer.setObjectiveFunction(objectiveFunction);

    for (var i = 0; i < nStep; i++) {
        optimizer.step();
    }

    return { bestPosition: optimizer.getBestPosition(), bestFitness: optimizer.getBestFitness() };
	}
};


