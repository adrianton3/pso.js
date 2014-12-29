'use strict';

importScripts('../lib/p2.min.js');
importScripts('../../src/pso.js');
importScripts('simulation.js');

function compute(x) {
    var simulation = makeSimulation();

    var score = simulation.compute({
        joint1Speed: x[0],
        joint11Speed: x[1],
        joint2Speed: x[2],
        joint22Speed: x[3],
        bodyLength: x[4]
    });

    self.postMessage({
        type: 'result',
        result: score
    });
}

self.onmessage = function (ev) {
    if (ev.data.type === 'compute') {
        compute(ev.data.data);
    }
};