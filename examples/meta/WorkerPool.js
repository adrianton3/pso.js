(function () {
	'use strict';

	function WorkerPool(size) {
		this._workers = [];
		this._idleWorkerIds = [];
		this._jobs = [];
		this._jobForWorker = [];
		this._createWorkers(size);
	}

	WorkerPool.prototype._next = function () {
		if (this._idleWorkerIds.length === 0 || this._jobs.length === 0) { return; }

		var idleWorkerId = this._idleWorkerIds.shift();
		var job = this._jobs.shift();

		this._jobForWorker[idleWorkerId] = job;
		var worker = this._workers[idleWorkerId];
		worker.postMessage(job.data);
	};

	WorkerPool.prototype._result = function (workerId, data) {
		this._idleWorkerIds.push(workerId);
		var job = this._jobForWorker[workerId];
		this._next();
		job.callback(data);
	};

	WorkerPool.prototype._createWorkers = function (size) {
		for (var i = 0; i < size; i++) {
			(function (i) {
				var worker = new Worker('worker.js');
				worker.onmessage = function (ev) {
					if (ev.data.message === 'result') {
						this._result(i, ev.data);
					}
				}.bind(this);
				this._workers.push(worker);
				this._idleWorkerIds.push(i);
			}.bind(this))(i);
		}
	};

	WorkerPool.prototype.compute = function (data, callback) {
		this._jobs.push({
			data: data,
			callback: callback
		});

		this._next(); // ask for the first available worker
	};


	window.meta = window.meta || {};
	window.meta.WorkerPool = WorkerPool;
})();
