(function () {
	'use strict';

	describe('Optimizer', function () {
		var Optimizer = pso.Optimizer;
		var Interval = pso.Interval;

		var optimizer;
		beforeEach(function () {
			optimizer = new Optimizer();
		});

		describe('step', function () {
			it('completes the step for a synchronous fitness function', function () {
				optimizer.init(2, [new Interval(0, 1)]);
				optimizer.setObjectiveFunction(function (x) { return 123; });
				optimizer.step();

				expect(optimizer.getBestFitness()).toEqual(123);
			});

			it('completes the step for an asynchronous fitness function', function (done) {
				optimizer.init(2, [new Interval(0, 1)]);
				optimizer.setObjectiveFunction(function (x, callback) { setTimeout(callback, 4, 123); }, { async: true });
				optimizer.step(function () {
					expect(optimizer.getBestFitness()).toEqual(123);
					done();
				});
				expect(optimizer.getBestFitness()).toEqual(-Infinity);
			});
		});

		describe('getMeanFitness', function () {
			it('completes the mean fitness', function () {
				optimizer.init(2, [new Interval(0, 1)]);

				var fitness = 123;
				optimizer.setObjectiveFunction(function (x) { fitness += 4; return fitness; });
				optimizer.step();

				expect(optimizer.getMeanFitness()).toEqual(129);
			});
		});
	});
})();