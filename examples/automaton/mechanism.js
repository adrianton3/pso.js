(function() {
	'use strict';
	
	function Mechanism(props) {
		this.props = props;
	}
	
	function circleIntersection(c0, c1) {
		var d, a, h;
		d = Math.sqrt(Math.pow(c0.x - c1.x, 2) + Math.pow(c0.y - c1.y, 2));
		a = (c0.r * c0.r - c1.r * c1.r + d * d) / (2 * d);
		h = Math.sqrt(c0.r * c0.r - a * a);
		var p2 = { 
			x: (c1.x - c0.x) * (a / d) + c0.x, 
			y: (c1.y - c0.y) * (a / d) + c0.y
		};
		var x3 = p2.x + h * (c1.y - c0.y) /d;
		var y3 = p2.y - h * (c1.x - c0.x) / d;
		var x4 = p2.x - h * (c1.y - c0.y) / d;
		var y4 = p2.y + h * (c1.x - c0.x) / d;
		
		return [{ x: x3, y: y3 }, { x: x4, y: y4 }];
	}
	
	Mechanism.prototype.valid = function() {
		// compute diatnce between centers and check if > len1+len2 + r1+r2 
		return true;
	};
	
	Mechanism.prototype.getAt = function(time) {
		var k1 = time;
		var k2 = time + this.props.cog2AngleOffset;
		
		var rod1X = Math.cos(k1) * this.props.cog1R + this.props.cog1X;
		var rod1Y = Math.sin(k1) * this.props.cog1R + this.props.cog1Y;
			
		var rod2X = Math.cos(k2) * this.props.cog2R + this.props.cog2X;
		var rod2Y = Math.sin(k2) * this.props.cog2R + this.props.cog2Y;
			
		var intersection = circleIntersection(
			{ x: rod1X, y: rod1Y, r: this.props.rod1Len }, 
			{ x: rod2X, y: rod2Y, r: this.props.rod2Len }
		);
		//if (isNaN(intersection[1].x) || isNaN(intersection[1].y)) return {};
		
		var rodIntersection = intersection[1];
			
		var dx = rod1X - rodIntersection.x;
		var dy = rod1Y - rodIntersection.y;
		var d = Math.sqrt(dx * dx + dy * dy);
		var dnx = -dx / d;
		var dny = -dy / d;
		
		var endPointX = rodIntersection.x + dnx * this.props.rod1Ext;
		var endPointY = rodIntersection.y + dny * this.props.rod1Ext;
		
		return { 
			x: endPointX,
			y: endPointY,
			k1: k1,
			k2: k2,
			rod1X: rod1X,
			rod1Y: rod1Y,
			rod2X: rod2X,
			rod2Y: rod2Y,
			rodIntersectionX: rodIntersection.x,
			rodIntersectionY: rodIntersection.y,
		};
	};
	
	Mechanism.prototype.drawAt = function(time) {
		var coords = this.getAt(time);
		
		Draw.fillColor('#000');
		Draw.lineColor('#F90');
		Draw.circle(this.props.cog1X, this.props.cog1Y, this.props.cog1R);
		Draw.circle(this.props.cog2X, this.props.cog2Y, this.props.cog2R);
		
		Draw.lineColor('#9F0');
		Draw.lineWidth(2);
		Draw.line(coords.rod1X, coords.rod1Y, coords.x, coords.y);
		Draw.line(coords.rod2X, coords.rod2Y, coords.rodIntersectionX, coords.rodIntersectionY);
	};
	
	Mechanism.prototype.getPointSet = function(resolution) {
		var pointSet = [];
		
		var increment = (Math.PI * 2) / resolution;
		for (var time = 0; time < Math.PI * 2; time += increment) {
			var coords = this.getAt(time);
			pointSet.push({ x: coords.x, y: coords.y });
		}
		
		return pointSet;
	};
	
	if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
		self.Mechanism = Mechanism;
	}	else {
		window.Mechanism = Mechanism;
	}
})();
