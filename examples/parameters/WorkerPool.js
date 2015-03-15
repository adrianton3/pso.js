(function () {
	'use strict';

	function WorkerPool(size) {
		this._workers = [];
		this._createWorkers(size);
	}

	WorkerPool.prototype._next = function (worker) {
		if (this._done >= this._entries.length) {
			this._onComplete();
		} else {
			worker.postMessage(this._entries[this._done]);
			this._done++;
		}
	};

	WorkerPool.prototype._createWorkers = function (size) {
		for (var i = 0; i < size; i++) {
			(function () {
				var worker = new Worker('worker.js');
				worker.onmessage = function (ev) {
					if (ev.data.message === 'idle') {
						this._next(worker);
					} else if (ev.data.message === 'partial') {
						this._onUpdate(ev.data);
					}
				}.bind(this);
				this._workers.push(worker);
			}.bind(this))();
		}
	};

	WorkerPool.prototype.run = function (entries, onUpdate, onComplete) {
		this._entries = entries;
		this._onUpdate = onUpdate;
		this._onComplete = onComplete;

		this._done = 0;

		this._workers.forEach(this._next.bind(this));
	};


	window.par = window.par || {};
	window.par.WorkerPool = WorkerPool;
})();
