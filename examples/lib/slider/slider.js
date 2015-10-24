(function () {
	'use strict';

	function makeSlider(options) {
		function createElements() {
			var root = document.createElement('div');
			root.classList.add('slider');
			root.classList.add('slider-root');

			var left = document.createElement('div');
			left.classList.add('slider');
			left.classList.add('slider-left');

			root.appendChild(left);

			return root;
		}

		function setupEvents(element) {
			function update(e) {
				var x = e.clientX - this.getBoundingClientRect().left;
				element.firstChild.style.width = x + 'px';

				var fraction = x / (element.getBoundingClientRect().width - 1);
				var value = fraction * (options.max - options.min) + options.min;
				options.onChange(value);
			}

			var dragging = false;

			function onDown(e) {
				e.stopPropagation();
				e.preventDefault();

				dragging = true;
				update.call(this, e);
			}

			function onUp(e) {
				dragging = false;
			}

			function onMove(e) {
				if (!dragging) { return; }
				update.call(this, e);
			}

			element.addEventListener('mousedown', onDown);
			window.addEventListener('mouseup', onUp);
			element.addEventListener('mousemove', onMove);
		}

		function attachSlider(dummy, root) {
			var elementAfter = dummy.nextSibling;
			dummy.parentElement.insertBefore(root, elementAfter);
			dummy.parentElement.removeChild(dummy);

			var fraction = (options.default - options.min) / (options.max - options.min);
			var width = fraction * root.getBoundingClientRect().width;
			root.firstChild.style.width = Math.round(width) + 'px';
		}

		function setValue(root) {
			return function (value) {
				var fraction = (value - options.min) / (options.max - options.min);
				var width = fraction * root.getBoundingClientRect().width;
				root.firstChild.style.width = Math.round(width) + 'px';
			}
		}

		var root = createElements();
		setupEvents(root);
		attachSlider(options.element, root);

		return {
			setValue: setValue(root)
		}
	}

	function associateSlider(dummySlider, input) {
		var onChange = input.getAttribute('step') === '1' ?
			function (value) {
				input.value = Math.floor(value);
			} :
			function (value) {
				input.value = value.toFixed(2);
			};


		var slider = makeSlider({
			min: +input.getAttribute('min'),
			max: +input.getAttribute('max'),
			default: +input.getAttribute('value'),
			element: dummySlider,
			onChange: onChange
		});

		input.addEventListener('change', function (e) {
			var value = +input.value;
			slider.setValue(value);
		});
	}

	window.makeSlider = makeSlider;
	window.associateSlider = associateSlider;
})();