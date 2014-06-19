(function () {
	'use strict';

	if (!window.DrawA) { window.DrawA = {}; }
	var DrawA = window.DrawA;

	var canvas, con2d;

	DrawA.init = function (element) {
		canvas = element;
		con2d = canvas.getContext('2d');

		DrawA.con2d = con2d; //
		DrawA.canvas = canvas; //
	};

	DrawA.rect = function (x, y, w, h, a) {
		con2d.save();

		con2d.translate(x, y);
		con2d.rotate(a);
		con2d.scale(w, h);
		con2d.fillRect(-0.5, -0.5, 1, 1);

		con2d.restore();
	};

	DrawA.circle = function (x, y, r) {
		con2d.save();

		con2d.translate(x, y);

		con2d.beginPath();
		con2d.arc(0, 0, r, 0, Math.PI * 2);
		con2d.closePath();
		con2d.fill();

		con2d.restore();
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