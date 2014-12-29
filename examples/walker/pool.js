(function () {
    'use strict';

    function makePool(poolSize) {
        var jobs = new Set();
        var idleWorkers = new Set();
        var busyWorkers = new Set();

        createWorkers();

        function createWorkers() {
            for (var i = 0; i < poolSize; i++) {
                (function () {
                    // create a worker
                    var worker = new Worker('worker.js');
                    var pair = { worker: worker, done: null };

                    // set it as idle initially
                    idleWorkers.add(pair);

                    worker.onmessage = function (ev) {
                        if (ev.data.type === 'result') {
                            // report the result
                            pair.done(ev.data.result);

                            // set worker as idle
                            pair.done = null;
                            busyWorkers.delete(pair);
                            idleWorkers.add(pair);

                            // request a new job when idle
                            next();
                        }
                    };
                })();
            }
        }

        function compute(data, done) {
            // add the job
            jobs.add({
                data: data,
                done: done
            });

            // try to execute it
            next();
        }

        function next() {
            if (busyWorkers.size >= poolSize || jobs.size <= 0) { return; }

            // get a worker
            var pair = idleWorkers.values().next().value;
            idleWorkers.delete(pair);
            busyWorkers.add(pair);

            // get a job
            var job = jobs.values().next().value;
            jobs.delete(job);

            // pair the two and execute the job
            pair.done = job.done;
            pair.worker.postMessage({
                type: 'compute',
                data: job.data
            });
        }

        return {
            compute: compute
        };
    }

    window.makePool = makePool;
})();