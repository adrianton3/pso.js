(function () {
    'use strict';

    var idle = true;
    var nCores = navigator.hardwareConcurrency ? navigator.hardwareConcurrency : 1;
    var workerPool = makePool(Math.max(nCores - 1, 1));

    function setStatus(text) {
        document.getElementById('status').innerText = text;
    }

    function setIdle(text) {
        idle = true;
        setStatus(text);

        document.getElementById('best').disabled = false;
    }

    function setBusy(text) {
        idle = false;
        setStatus(text);

        document.getElementById('best').disabled = true;
    }

    document.getElementById('best').addEventListener('click', function () {
        if (!idle) { return; }

        setBusy('searching for an optimal walker');

        var initialPopulationSize = 14;
        var iterationNMax = 25;

        var domain = [
            new pso.Interval(-8, 8),
            new pso.Interval(-8, 8),
            new pso.Interval(-8, 8),
            new pso.Interval(-8, 8),
            new pso.Interval(2, 10)
        ];

        // get a new optimizer and set it up
        var optimizer = new pso.Optimizer();
        optimizer.setObjectiveFunction(workerPool.compute, { async: true });
        optimizer.init(initialPopulationSize, domain);

        function animateBest() {
            var x = optimizer.getBestPosition();
            var bestScore = optimizer.getBestFitness();

            // play the best solution found
            setStatus('running simulation; furthest distance reached: ' + bestScore.toFixed(2));
            var pool = makeSimulation();
            pool.animate({
                    joint1Speed: x[0],
                    joint11Speed: x[1],
                    joint2Speed: x[2],
                    joint22Speed: x[3],
                    bodyLength: x[4]
                }, document.getElementById('can'),
                setIdle.bind(null, 'idle')
            );
        }

        var iterations = 0;
        function loop() {
            if (iterations >= iterationNMax) {
                setStatus('optimization done; replaying best solution found');
                animateBest();
            } else {
                iterations++;
                setStatus('optimizing: iteration ' + iterations + '/' + iterationNMax);
                optimizer.step(loop);
            }
        }

        loop();
    });
})();