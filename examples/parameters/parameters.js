/* global angular, Chart, par */
(function () {
	'use strict';

	var nSamples = 10;
	var defaultNWorkers = 3;

	var referenceSpecs = {
		iterations: { min: 4, max: 64, 'default': 30 },
		initialPopulationSize: { min: 4, max: 64, 'default': 20 },
		inertiaWeight: { min: 0, max: 1, 'default': 0.7 },
		social: { min: 0, max: 1, 'default': 0.6 },
		personal: { min: 0, max: 1, 'default': 0.3 }
	};

	var labels = [], averageBest = [], averageMean = [];


	function populateLabels(labels, min, max) {
		var step = (max - min) / (nSamples - 1);

		labels.length = nSamples;
		for (var i = 0, x = min; i < nSamples; i++, x += step) {
			labels[i] = x.toFixed(1);
		}
	}

	function populateZeros(data) {
		data.length = nSamples;
		for (var i = 0; i < nSamples; i++) {
			data[i] = 0;
		}
	}

	function getSpecs(referenceSpecs, varying) {
		var specs = {};

		var keys = Object.keys(referenceSpecs);
		for (var i = 0; i < keys.length; i++) {
			var key = keys[i];
			var referenceSpec = referenceSpecs[key];

			specs[key] = varying === key ?
				{
					min: referenceSpec.min,
					max: referenceSpec.max
				} :
				{
					min: referenceSpec.default,
					max: referenceSpec.default
				};
		}

		return specs;
	}

	function getEntries(nSamples, specs) {
		var entries = [];

		var keys = Object.keys(specs);

		for (var i = 0; i < nSamples; i++) {
			var progress = i / (nSamples - 1);

			var entry = {};
			for (var j = 0; j < keys.length; j++) {
				var key = keys[j];
				var spec = specs[key];
				entry[key] = spec.min + (spec.max - spec.min) * progress;
			}

			entry.index = i;
			entries.push(entry);
		}

		return entries;
	}

	function createChart() {
		populateLabels(labels, 0, 0);
		populateZeros(averageBest);
		populateZeros(averageMean);

		var data = {
			labels: labels,
			datasets: [{
				label: 'Best',
				strokeColor: 'rgb(120,120,120)',
				pointColor: 'rgb(120,120,120)',
				pointStrokeColor: '#fff',
				pointHighlightFill: '#fff',
				pointHighlightStroke: 'rgb(120,120,120)',
				data: averageBest
			}, {
				label: 'Mean',
				strokeColor: 'rgb(151,187,205)',
				pointColor: 'rgb(151,187,205)',
				pointStrokeColor: '#fff',
				pointHighlightFill: '#fff',
				pointHighlightStroke: 'rgb(151,187,205)',
				data: averageMean
			}]
		};

		var con2d = document.getElementById('chart').getContext('2d');
		return new Chart(con2d).Line(data, {
			bezierCurve: false,
			datasetFill: false,
			showTooltips: false
		});
	}



	var chart = createChart();

	var app = angular.module('app', []);

	app.controller('AppController', ['$scope', function ($scope) {
		this.varying = 'social';
		this.busy = false;

		// let one thread to update the UI
		var nWorkers = navigator.hardwareConcurrency ? Math.max(1, navigator.hardwareConcurrency - 1) :
			defaultNWorkers;

		var workerPool = new par.WorkerPool(nWorkers);

		function onUpdate(result) {
			chart.datasets[0].points[result.index].value = result.averageBest;
			chart.datasets[1].points[result.index].value = result.averageMean;

			chart.update();
		}

		function onComplete() {
			this.busy = false;
			$scope.$apply();
		}

		this.run = function () {
			if (this.busy) { return; }

			this.busy = true;
			var specs = getSpecs(referenceSpecs, this.varying);

			populateLabels(labels, specs[this.varying].min, specs[this.varying].max);
			populateZeros(averageBest);
			populateZeros(averageMean);
			chart.update();

			var entries = getEntries(nSamples, specs);
			workerPool.run(entries, onUpdate, onComplete.bind(this));
		};
	}]);
})();
