"use strict";

function WidgetTopPanel(options) {
	var that = this;
	this.elem = options.container;
	this.left = options && options.left ? options.left : '';
	this.right = options && options.right ? options.right : '';
	this.counters = options && options.counters ? options.counters : '{}';

	this.jsonData = JSON.parse(that.counters);

	var elem = void 0;
	this.init = function () {
		if (!that.elem || !document.getElementById(that.elem)) {
			console.warn('Container not defined or missing in document');
			return false;
		}
		that.renderItems();
		slider(0);
	};

	this.renderItems = function () {
		elem = document.getElementById(that.elem);
		var innerElem = document.createElement('div');
		elem.appendChild(innerElem);
		innerElem.className = "jptb-top-panel";
		var leftItem = document.createElement('div');
		innerElem.appendChild(leftItem);
		leftItem.className = "jptb-left";
		leftItem.textContent = that.left;

		var centerItem = document.createElement('div');
		innerElem.appendChild(centerItem);
		centerItem.className = "jptb-center";

		var rightItem = document.createElement('div');
		innerElem.appendChild(rightItem);
		rightItem.className = "jptb-right";
		rightItem.textContent = that.right;

		if (document.querySelector('.jptb-center')) {
			that.update(that.json);
		}
	};

	/* counters generator */

	this.counterBuffer = new Map();

	this.update = function (json) {
		var jsonData = json ? JSON.parse(json) : false;

		var event = new CustomEvent("update", {
			detail: jsonData
		});

		document.dispatchEvent(event);

		for (var counter in jsonData) {
			var id = jsonData[counter].id;
			var amount = jsonData[counter].amount ? jsonData[counter].amount : false;
			var action = jsonData[counter].action ? jsonData[counter].action : false;
			var jackSelf = that.counterBuffer.has(id) ? that.counterBuffer.get(id) : {};

			if (id && !that.counterBuffer.has(id)) that.counterBuffer.set(jsonData[counter].id, new Odometer(jsonData[counter]));
			if (id && amount && amount > that.counterBuffer.get(id).currentValue) that.counterBuffer.get(id).setCurrentValue(amount);
			if (id && action) {
				that.counterBuffer.get(id).actionPlay(action);
			}
		}
	};

	// 🔚 

	/* slider */
	var parent = void 0,
	    left = void 0,
	    right = void 0;
	var slider = function slider(y) {
		parent = document.querySelector('.jptb-center');
		left = document.querySelector('.jptb-left');
		right = document.querySelector('.jptb-right');

		if (window.innerWidth < 575 && left.parentElement !== parent) {
			parent.appendChild(left);
			parent.appendChild(right);
		}
		var widgetHeight = parent.clientHeight;
		var arr = Array.from(parent.children),
		    parentWidth = parent.clientWidth,
		    itemsWidth = arr.reduce(function (sum, current) {
			return sum + current.clientWidth;
		}, 0);

		var scrollHeight = +parent.scrollHeight;
		if (itemsWidth > parent.clientWidth || window.innerWidth < 575) {
			if (y < scrollHeight) {
				parent.style.transform = "translateY(-" + y + "px)";
				y += 40;
				setTimeout(slider, 8000, y);
			} else goDown(y - 40);
		}
	};

	function goDown(y) {
		if (y > 0) {
			parent.style.transform = "translateY(-" + y + "px)";
			y += -40;
			setTimeout(goDown, 8000, y);
		} else slider(0);
	}

	// 🔚 

	return this;
};

function Odometer(options) {
	var _this = this;

	var that = this;
	var ANGLE = 36;
	this.coordinates = {
		time: [0],
		rotate: [0],
		rBuffer: [],
		speed: [],
		delay: 500,
		speedAverage: 0,
		deviation: 0,
		duration: 0
	};
	this.action = options && options.action ? options.action : '';
	this.currentValue = options && options.amount ? options.amount : 0;
	this.id = options && options.id ? options.id : 0;
	this.currency = options && options.currency ? options.currency : '';
	this.jackName = options && options.jackName ? options.jackName : '';
	this.jackOrder = parseInt(that.currentValue * -1);
	this.numRolls = options && options.numRolls ? options.numRolls : 7;
	this.tickLength = options && options.tickLength ? options.tickLength : 5000;
	this.elemArr;
	this.$;
	var drawingCells = "<div class='jptb-jackpot-counter-cell'><div class='jptb-roller' data-rotate='0' data-duration='5000' style='transform: rotateX(0deg);transition-duration:5000ms'><div class='jptb-plane jptb-figure0'>0</div><div class='jptb-plane jptb-figure1'>1</div><div class='jptb-plane jptb-figure2'>2</div><div class='jptb-plane jptb-figure3'>3</div><div class='jptb-plane jptb-figure4'>4</div><div class='jptb-plane jptb-figure5'>5</div><div class='jptb-plane jptb-figure6'>6</div><div class='jptb-plane jptb-figure7'>7</div><div class='jptb-plane jptb-figure8'>8</div><div class='jptb-plane jptb-figure9'>9</div></div></div>";

	this.setCurrentValue = function (v) {
		if (isNaN(v / 2)) return console.info('= waiting for integer =');
		if (v > Math.pow(10, that.numRolls - 2)) {
			that.setNumRolls(v);
		}
		_this.currentValue = v;
		var tt = new Date();
		that.coordinates.time.splice(0, 0, tt);
		var dur = parseInt(that.currentValue * 100) * ANGLE;
		that.controller(dur);
		return _this.currentValue;
	};

	this.setNumRolls = function (a) {
		var digits = that.numRolls - 3,
		    str = a.toFixed(0),
		    rstr = Math.pow(10, digits).toFixed(0),
		    def = str.length - rstr.length;

		that.numRolls += def;
		var wrapper = document.querySelector('#jptb' + that.id + ' .jptb-jackpot-counter-wrapper');
		var cell = wrapper.children[0];
		for (var i = 0; i < def; i++) {
			cell.insertAdjacentHTML("beforeBegin", drawingCells);
		}
		that.elemArr = Array.from(document.querySelectorAll('#jptb' + that.id + ' .jptb-roller'));
	};

	this.controller = function (rotate) {
		_this.coordinates.rotate.splice(0, 0, rotate);
		var dRotate = _this.coordinates.rotate[0] - _this.coordinates.rotate[1];
		_this.coordinates.speed.splice(0, 0, parseInt(dRotate / (_this.tickLength / 1000)));
		_this.coordinates.speed.length = _this.coordinates.speed.length > 4 ? 4 : _this.coordinates.speed.length;
		_this.coordinates.speedAverage = _this.coordinates.speed.reduce(function (sum, current) {
			return parseInt(sum + current);
		}) / _this.coordinates.speed.length;
		_this.coordinates.deviation = Math.sqrt(_this.coordinates.speed.reduce(function (a, b) {
			var dev = b - that.coordinates.speedAverage;
			return a + dev * dev;
		}) / _this.coordinates.speed.length) / 1000;
		_this.coordinates.duration = _this.coordinates.deviation > 4 ? parseInt(dRotate / _this.coordinates.speedAverage * 1000) : _this.tickLength;
	};

	this.transform = function (elemArr, val) {
		val = val ? val : that.currentValue;
		var arr = elemArr.slice(),
		    data = val * 100;
		for (var i = arr.length; i >= 0; i--) {
			var multiplier = parseInt(data / Math.pow(10, arr.length - i)),
			    rotate = multiplier * ANGLE;

			_this.coordinates.rBuffer[i] = _this.coordinates.rBuffer[i] ? rotate - _this.coordinates.rBuffer[i] : rotate;

			if (_this.coordinates.rBuffer[i] > 0) {
				var bezier = 'cubic-bezier(.7, .16, .3, .84)';
				that.setTransform(arr[i - 1], rotate, _this.coordinates.duration, _this.coordinates.delay, bezier);
			}
		}
	};

	this.setTransform = function (el, rotate, duration, delay, bezier) {
		el.setAttribute('style', "transform: rotateX(" + rotate + "deg);transition-duration:" + duration + "ms; transition-delay:" + delay + "ms;transition-timing-function:" + bezier + ";transform: rotateX(" + rotate + "deg);-webkit-transition-duration:" + duration + "ms; -webkit-transition-delay:" + delay + "ms;-webkit-transition-timing-function:" + bezier);
	};

	/* actions */

	var eventText = document.querySelector('.aim') ? document.querySelector('.aim') : newElem('div', { class: 'fadeIn aim' });
	this.win = function () {
		eventText.textContent = "WIN";
		append(eventText);
		//that.addClass(document.getElementById('jptb' + that.id), 'jptb-win');
	};

	this.hit = function () {
		eventText.textContent = "HIT";
		append(eventText);
	};
	this.delete = function () {
		eventText.textContent = "DEL";
		append(eventText);
	};

	this.actionPlay = function (action) {
		switch (action) {
			case "WIN":
				that.win();
				break;

			case "HIT":
				that.hit();
				break;

			case "DELETE":
				that.delete();
				break;
		}
	};

	// 🔚 

	this.sorting = function () {
		var elem = document.getElementById('jptb' + that.id);
		elem.style.order = parseInt(-that.currentValue);
	};

	(this.drawOdometer = function () {
		var parent = document.querySelector('.jptb-center');
		var jackpotItem = document.createElement('div');
		jackpotItem.className = 'jptb-jackpot-item';
		jackpotItem.style.order = that.jackOrder + '';
		jackpotItem.id = "jptb" + that.id;
		if (options && options.jackName) {
			jackpotItem.innerHTML = "<div class='jptb-jackpot-name'>" + that.jackName + "</div>";
		} else jackpotItem.innerHTML = "<div class='jptb-jackpot-name'></div>";

		var jackpotCounter = document.createElement('div');
		jackpotCounter.className = 'jptb-jackpot-counter';

		var jackpotСurrency = document.createElement('div');
		jackpotСurrency.className = 'jptb-jackpot-currency';
		jackpotСurrency.textContent = _this.currency;

		var wrapper = document.createElement('div');
		wrapper.className = 'jptb-jackpot-counter-wrapper';
		var collection = '';
		for (var i = that.numRolls; i > 0; i--) {
			collection += drawingCells;
		}wrapper.innerHTML = collection;
		jackpotCounter.appendChild(wrapper);
		jackpotItem.appendChild(jackpotCounter);
		jackpotItem.appendChild(jackpotСurrency);
		parent.appendChild(jackpotItem);

		that.elemArr = Array.from(document.querySelectorAll('#jptb' + that.id + ' .jptb-roller'));
		that.$ = that.elemArr[that.elemArr.length - 1];
	})();

	var event = new Event("trasitionend");
	this.stack = [];
	document.addEventListener("update", function (event) {
		var update = event.detail[0];

		if (update.id && update.id == that.id) {
			that.stack.splice(0, 0, update.amount);
			console.log('stack: ' + that.stack);
			if (that.stack.length == 1) {
				that.transform(that.elemArr);
			}
		}
	}, false);

	this.$.addEventListener("webkitTransitionEnd", function (event) {
		setTimeout(function () {
			that.transform(that.elemArr, that.stack.pop());
			that.sorting();
		}, 1000);
	}, false);

	return this;
};
/* helpers */

function newElem(tag, params) {
	params = params || {};
	var elem = document.createElementNS ? document.createElementNS('http://www.w3.org/1999/xhtml', tag) : document.createElement(tag);

	for (var pr in params) {
		attr(elem, pr, params[pr]);
	}

	return elem;
}

function attr(el, at, value) {
	at = {
		'for': 'htmlFor',
		'class': 'className'
	}[at] || at;
	if (!value) {
		return el[at] || el.getAttribute(at) || '';
	} else {
		if (at == 'style') {
			el.style.cssText = value;
			return;
		}
		el[at] = value;
		if (el.setAttribute) el.setAttribute(at, value);
	}
}

function append(el, where) {
	(where || document.body).appendChild(el);
}
// 🔚

document.addEventListener("DOMContentLoaded", function (ev) {
	(function () {

		var panel = new WidgetTopPanel({
			container: 'topPanel',
			left: 'game',
			right: 'GO',
			counters: '[{"id": 1, "amount": 0}]'
		});
		panel.init();
		/* demo test */
		/* on production works through the method update(json) */
		var submit = document.getElementById('submitData'),
		    input = document.getElementById('dataVal');

		var a = new Odometer({
			amount: 0,
			tickLength: 10000
		});
		submit.onclick = function (ev) {
			ev.preventDefault();
			a.setCurrentValue(input.value);
			console.log(a.currentValue);
			a.transform(a.elemArr, input.value);
		};
		console.log(a);
		/*test*/
	})();
}, false);