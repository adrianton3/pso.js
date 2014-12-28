(function () {
	'use strict';

	if (!window.DrawA) { window.DrawA = {}; }
	var DrawA = window.DrawA;

	var canvas, con2d;

	DrawA.init = function (element) {
		canvas = element;
		con2d = canvas.getContext('2d');

		DrawA.con2d = con2d;
		DrawA.canvas = canvas;
	};

	DrawA.rect = function (x, y, width, height, angle) {
		con2d.save();

		con2d.translate(x, y);
		con2d.rotate(angle);

		con2d.fillRect(-width / 2, -height / 2, width, height);
		con2d.strokeRect(-width / 2, -height / 2, width, height);

		con2d.restore();
	};

	DrawA.line = function (xs, ys, xe, ye) {
		con2d.beginPath();
		con2d.moveTo(xs, ys);
		con2d.lineTo(xe, ye);
		con2d.stroke();
	};

	DrawA.clearColor = function (color) {
		con2d.clearStyle = color;
	};

	DrawA.fillColor = function (color) {
		con2d.fillStyle = color;
	};

	DrawA.lineColor = function (color) {
		con2d.strokeStyle = color;
	};
})();