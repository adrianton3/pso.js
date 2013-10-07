pso.js
======

Particle Swarm Optimisation library written in JS

Usage
-----

```javascript
var pso = new PSO();
pso.setObjectiveFunction(function(x) { return -(x[0]*x[0] + x[1]*x[1]); });
pso.init(20, [{start: -10, end: 10}, {start: -10, end: 10}]);
for (var i = 0; i < 40; i++)
 pso.step();
console.log(pso.getBestFitness(), pso.getBestPosition());
```