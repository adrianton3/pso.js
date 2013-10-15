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

Sample applications
-------------------

+ `simple` A simple application that optimizes a one dimensional function
+ `simple_require` The same as simple, except using require.js
+ `automaton` A more sophisticated application that adapts a mechanism for a specified output path. 
Pso.js is launched in this case by web workers.