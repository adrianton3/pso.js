(function () {
	'use strict';

	var con2d;

	function init(element) {
		con2d = element.getContext('2d');
	}

	var maxHue = 270;
	var zoom = { x: 5, y: 5 };

	function repeat(times, fun) {
		for (var i = 0; i < times; i++) {
			fun(i, times);
		}
	}

	var minValue = 0;
	var maxValue = 11;

	function getData(space, fun) {
		var domainX = space.domainX,
			resolutionX = space.resolutionX,
			domainY = space.domainY,
			resolutionY = space.resolutionY;

		var stepX = (domainX.end - domainX.start) / resolutionX;
		var stepY = (domainY.end - domainY.start) / resolutionY;

		var jobs = [];

//		var data = [];
		repeat(resolutionY + 1, function (i) {
//			var line = [];
			repeat(resolutionX + 1, function (j) {
				jobs.push(function () {
					var value = fun(domainX.start + j * stepX, domainY.start + i * stepY);
//					data[i][j] = value;

					var hue = ((maxValue - value) / (maxValue - minValue)) * maxHue;
					con2d.fillStyle = 'hsl(' + hue + ', 100%, 50%)';
					con2d.fillRect(
						Math.floor(j * zoom.x), Math.floor(i * zoom.y),
						Math.ceil(zoom.x), Math.ceil(zoom.y)
					);
				});
			});

//			data.push(line);
		});

		return jobs;
	}

	function updateZoom(element, resolutionX, resolutionY) {
		zoom.x = element.width / resolutionX;
		zoom.y = element.height / resolutionY;
	}

	function resolve(space, fun, onProgress, onCompletion) {
		updateZoom(con2d.canvas, space.resolutionX + 1, space.resolutionY + 1);

		var jobs = getData(space, fun);

		onProgress = onProgress || function (i, total) {
//			console.log(i, total);
		};

		onCompletion = onCompletion || function () {
			console.log('done');
		};

		throttler.execDelayed(jobs, onProgress, onCompletion);
	}

	window.plotter = window.plotter || {};
	window.plotter.init = init;
	window.plotter.zoom = zoom;
	window.plotter.resolve = resolve;
})();