(function () {
	'use strict';

	function repeatDelayed(iterationNMax, stepCallback, completionCallback) {
		var iterationCount = 0;

		function loop() {
			iterationCount++;

			stepCallback(iterationCount);

			if (iterationCount >= iterationNMax) {
				completionCallback();
			} else {
				setTimeout(loop, 4);
			}
		}

		loop();
	}

	function repeatAnim(iterationNMax, stepCallback, completionCallback) {
		var iterationCount = 0;

		function loop() {
			iterationCount++;

			stepCallback(iterationCount);

			if (iterationCount >= iterationNMax) {
				completionCallback();
			} else {
				requestAnimationFrame(loop);
			}
		}

		loop();
	}

	var maxTime = 100;
	function execDelayed(jobs, progressCallback, completionCallback) {
		var i = 0;

		function execBatch() {
			var startTime = performance.now();
			while (i < jobs.length && performance.now() - startTime < maxTime) {
				jobs[i]();
				i++;
				progressCallback(i, jobs.length);
			}

			if (i >= jobs.length) {
				completionCallback();
			} else {
				setTimeout(execBatch, 4);
			}
		}

		execBatch();
	}

	window.throttler = window.throttler || {};
	window.throttler.repeatDelayed = repeatDelayed;
	window.throttler.repeatAnim = repeatAnim;
	window.throttler.execDelayed = execDelayed;
})();
