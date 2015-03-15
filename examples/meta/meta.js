/* global angular, Chart, meta */
(function () {
	'use strict';

	var defaultNWorkers = 3;

	// metaoptimizer parameters
	var initialPopulationSize = 15;
	var iterations = 30;
	var domain = [
		new pso.Interval(0, 1),
		new pso.Interval(0, 1),
		new pso.Interval(0, 1)
	];

	// chart related variables
	var labels = [];
	var data = {
		inertiaWeight: [],
		social: [],
		personal: [],
		averageBest: [],
		averageMean: []
	};

	function populateLabels(labels, length) {
		labels.length = length;
		for (var i = 0; i < length; i++) {
			labels[i] = i;
		}
	}

	function populateZeros(data, length) {
		data.length = length;
		for (var i = 0; i < length; i++) {
			data[i] = 0;
		}
	}

	function createParametersChart() {
		populateLabels(labels, iterations);
		populateZeros(data.inertiaWeight, iterations);
		populateZeros(data.social, iterations);
		populateZeros(data.personal, iterations);

		var chartSpec = {
			labels: labels,
			datasets: [{
				label: 'Inertia weight',
				strokeColor: 'rgb(120,120,120)',
				pointColor: 'rgb(120,120,120)',
				pointStrokeColor: '#fff',
				pointHighlightFill: '#fff',
				pointHighlightStroke: 'rgb(120,120,120)',
				data: data.inertiaWeight
			}, {
				label: 'Social influence',
				strokeColor: 'rgb(151,187,205)',
				pointColor: 'rgb(151,187,205)',
				pointStrokeColor: '#fff',
				pointHighlightFill: '#fff',
				pointHighlightStroke: 'rgb(151,187,205)',
				data: data.social
			}, {
				label: 'Personal influence',
				strokeColor: 'rgb(251,87,205)',
				pointColor: 'rgb(251,87,205)',
				pointStrokeColor: '#fff',
				pointHighlightFill: '#fff',
				pointHighlightStroke: 'rgb(251,87,205)',
				data: data.personal
			}]
		};

		var con2d = document.getElementById('parameters-chart').getContext('2d');
		return new Chart(con2d).Line(chartSpec, {
			bezierCurve: false,
			datasetFill: false,
			showTooltips: false
		});
	}

	function createPerformanceChart() {
		populateLabels(labels, iterations);
		populateZeros(data.averageBest, iterations);
		populateZeros(data.averageMean, iterations);

		var chartSpec = {
			labels: labels,
			datasets: [{
				label: 'Best',
				strokeColor: 'rgb(120,120,120)',
				pointColor: 'rgb(120,120,120)',
				pointStrokeColor: '#fff',
				pointHighlightFill: '#fff',
				pointHighlightStroke: 'rgb(120,120,120)',
				data: data.averageBest
			}, {
				label: 'Mean',
				strokeColor: 'rgb(151,187,205)',
				pointColor: 'rgb(151,187,205)',
				pointStrokeColor: '#fff',
				pointHighlightFill: '#fff',
				pointHighlightStroke: 'rgb(151,187,205)',
				data: data.averageMean
			}]
		};

		var con2d = document.getElementById('performance-chart').getContext('2d');
		return new Chart(con2d).Line(chartSpec, {
			bezierCurve: false,
			datasetFill: false,
			showTooltips: false
		});
	}


	Chart.defaults.global.scaleIntegersOnly = false;
	var parametersChart = createParametersChart();
	var performanceChart = createPerformanceChart();


	function repeat(times, step, complete) {
		var counter = 0;
		function iterate() {
			if (counter >= times) {
				complete();
			} else {
				step(counter, iterate);
				counter++;
			}
		}

		iterate();
	}


	var app = angular.module('app', []);

	app.controller('AppController', ['$scope', function ($scope) {
		this.busy = false;

		// let one thread to update the UI
		var nWorkers = navigator.hardwareConcurrency ?
			Math.max(1, navigator.hardwareConcurrency - 1) :
			defaultNWorkers;

		var workerPool = new meta.WorkerPool(nWorkers);


		this.run = function () {
			if (this.busy) { return; }

			this.busy = true;


			var optimizer = new pso.Optimizer();
			optimizer.init(initialPopulationSize, domain);

			optimizer.setObjectiveFunction(function (x, done) {
				var params = {
					inertiaWeight: x[0],
					social: x[1],
					personal: x[2]
				};

				workerPool.compute(params, function (data) {
					done(data.averageMean);
				});
			}, { async: true });


			function updateCharts(index, parameters, performance) {
				parametersChart.datasets[0].points[index].value = parameters.inertiaWeight;
				parametersChart.datasets[1].points[index].value = parameters.social;
				parametersChart.datasets[2].points[index].value = parameters.personal;
				parametersChart.update();

				performanceChart.datasets[0].points[index].value = performance.meanFitness;
				performanceChart.datasets[1].points[index].value = performance.bestFitness;
				performanceChart.update();
			}


			optimizer.step(function () {
				repeat(iterations, function (counter, cont) {
					var bestPosition = optimizer.getBestPosition();
					var parameters = {
						inertiaWeight: bestPosition[0],
						social: bestPosition[1],
						personal: bestPosition[2]
					};

					var meanFitness = optimizer.getMeanFitness();
					var bestFitness = optimizer.getBestFitness();
					var performance = {
						meanFitness: meanFitness,
						bestFitness: bestFitness
					};

					updateCharts(counter, parameters, performance);

					optimizer.step(cont);
				}, function () {
					this.busy = false;
					$scope.$apply();
				}.bind(this));
			}.bind(this));
		};
	}]);
})();
