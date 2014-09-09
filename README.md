pso.js
======

Particle Swarm Optimisation library written in JS. Works with/without require.js or from a worker.

Sample applications
-------------------

+ [simple](http://madflame991.github.io/pso.js/examples/simple/simple.html) A simple application that optimizes a one dimensional function
+ [simple_require](http://madflame991.github.io/pso.js/examples/simple_require/simple_require.html) The same as simple, except using require.js
+ [automaton](http://madflame991.github.io/pso.js/examples/automaton/automaton.html) A more sophisticated application that adapts a mechanism for a specified output path.
Pso.js is launched in this case by web workers
+ [circles](http://madflame991.github.io/pso.js/examples/circles/circles.html) A simple application that optimizes a two dimensional function
+ [shape-fitting](http://madflame991.github.io/pso.js/examples/shape-fitting/shape-fitting.html) Optimizes the positioning of arbitrary shapes in a square
+ [pool](http://madflame991.github.io/pso.js/examples/pool/pool.html) Optimizes the breaking shot of a pool game
+ [async](http://madflame991.github.io/pso.js/examples/async/async.html) Example of an asynchronous objective function
+ [parameters](http://madflame991.github.io/pso.js/examples/parameters/parameters.html) Optimizer performance when varying its parameters
+ [meta-optimizer](http://madflame991.github.io/pso.js/examples/meta/meta.html) pso.js is used to optimize the parameters of another instance of pso which is optimizing the Rastrigin function

Usage
-----

```javascript
// create the optimizer
var optimizer = new pso.Optimizer();

// set the objective function
optimizer.setObjectiveFunction(function (x) { return -(x[0] * x[0] + x[1] * x[1]); });

// set an initial population of 20 particles spread across the search space *[-10, 10] x [-10, 10]* 
optimizer.init(20, [{ start: -10, end: 10 }, { start: -10, end: 10 }]);

// run the optimizer 40 iterations
for (var i = 0; i < 40; i++) {
  optimizer.step();
}

// print the best found fitness value and position in the search space
console.log(optimizer.getBestFitness(), optimizer.getBestPosition());
```