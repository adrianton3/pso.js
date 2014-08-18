(function () {
	'use strict';

	function bind(canvas, space, zoom, callback) {
		canvas.addEventListener('click', function (ev) {
			var cx = ev.layerX;
			var cy = ev.layerY;

			var x = (Math.floor(cx / zoom.x) / space.resolutionX) *
				(space.domainX.end - space.domainX.start) + space.domainX.start;
			var y = (Math.floor(cy / zoom.y) / space.resolutionY) *
				(space.domainY.end - space.domainY.start) + space.domainY.start;

			callback(x, y);
		});
	}

	window.reverseCoords = window.reverseCoords || {};
	window.reverseCoords.bind = bind;
})();