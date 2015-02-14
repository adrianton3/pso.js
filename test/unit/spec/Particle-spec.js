(function () {
	'use strict';

	describe('Particle', function () {
		var Particle = pso.Particle;

		describe('.storePosition / .getBestPosition', function () {
			it('saves the current position', function () {
				var particle = new Particle([123, 234], [456, 567], 1, 2, 3);

				particle.storePosition();
				particle.updatePosition();

				var bestPosition = particle.getBestPosition();

				expect(bestPosition).toEqual([123, 234]);
			});
		});

		describe('.getPosition', function () {
			it('saves the current position', function () {
				var position = [123, 234];
				var particle = new Particle(position, [456, 567], 1, 2, 3);

				var retrievedPosition = particle.getPosition();
				expect(retrievedPosition).toEqual(position);
				expect(retrievedPosition).not.toBe(position);
			});
		});
	});
})();