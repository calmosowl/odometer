"use strict";
function WidgetTopPanel(options){
	let that = this;
	this.elem = options.container;
	this.left = options&&options.left ? options.left : '';
	this.right = options&&options.right ? options.right : '';
	this.counters = options&&options.counters ? options.counters : '{}';
	this.slider_enable = options&&options ? options.counters : 'on';
	this.jsonData = JSON.parse(that.counters);
	
	let elem;
	this.init = () => {
    	if ( !that.elem || !document.getElementById(that.elem) ) {
    		console.warn('Container not defined or missing in document');
    		return false;
    	} 
    	that.renderItems();
    	slider(0);
  	}

	this.renderItems = () => {	
		elem = document.getElementById(that.elem);
		let innerElem = document.createElement('div');
			elem.appendChild(innerElem);
			innerElem.className = "jptb-top-panel";
		let leftItem = document.createElement('div');
			innerElem.appendChild(leftItem);
			leftItem.className = "jptb-left";
			leftItem.textContent = that.left;

		let centerItem = document.createElement('div');
			innerElem.appendChild(centerItem);
			centerItem.className = "jptb-center";

		let rightItem = document.createElement('div');
			innerElem.appendChild(rightItem);
			rightItem.className = "jptb-right";
			rightItem.textContent = that.right;

		if (document.querySelector('.jptb-center')){
			that.update(that.json);
		} 
	}

	/* counters generator */

	this.counterBuffer = new Map();

	this.update = (json) => {
		let jsonData = json ? JSON.parse(json) : false;

		let event = new CustomEvent("update", {
			detail: jsonData 
  		});
	
		document.dispatchEvent(event);

		for (var counter in jsonData) {
			let id = jsonData[counter].id;
			let amount = jsonData[counter].amount ? jsonData[counter].amount : false;
			let action = jsonData[counter].action ? jsonData[counter].action : false;
			let jackSelf = that.counterBuffer.has(id) ? that.counterBuffer.get(id) : {};

			if(id && !that.counterBuffer.has(id))
				that.counterBuffer.set(jsonData[counter].id, new Odometer(jsonData[counter]));
			if(id && amount && amount > that.counterBuffer.get(id).currentValue)
				that.counterBuffer.get(id).setCurrentValue(amount);
			if(id && action) {	
				that.counterBuffer.get(id).actionPlay(action);
			}
		}
	}

	

	// 🔚 

	/* slider */
	let parent, left, right;
	let slider = (y) => {
		if(this.slider_enable == 'on') {
			parent = document.querySelector('.jptb-center');
			left = document.querySelector('.jptb-left');
			right = document.querySelector('.jptb-right');

			if(window.innerWidth < 575 && left.parentElement !== parent){
				parent.appendChild(left);
				parent.appendChild(right);
			}
			let widgetHeight = parent.clientHeight;
			let	arr = Array.from(parent.children),
					parentWidth = parent.clientWidth,
					itemsWidth = arr.reduce(function(sum, current) {
						return sum + current.clientWidth;
					}, 0);

			let scrollHeight = +parent.scrollHeight;
			if(itemsWidth > parent.clientWidth || window.innerWidth < 575) {
				if (y < scrollHeight) {
					parent.style.transform = "translateY(-" + y + "px)";
					y += 40;
					setTimeout(slider, 8000, y);
				} else goDown(y - 40);
			}
		}
	}

	function goDown(y) {
		if ( y > 0 ) {
			parent.style.transform = "translateY(-" + y + "px)";
			y += -40;
		setTimeout(goDown, 8000, y);	
		} else slider(0);
	}

	// 🔚 

	return this;
};


function Odometer(options){
	let that = this;
	const ANGLE = 36;
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
	this.action = options&&options.action ? options.action : '';
	this.currentValue = options&&options.amount ? options.amount : 0;
	this.id = options&&options.id ? options.id : 0;
	this.currency = options&&options.currency ? options.currency : '';
	this.jackName = options&&options.jackName ? options.jackName : '';
	this.jackOrder = parseInt(that.currentValue * (-1));
	this.numRolls = options&&options.numRolls ? options.numRolls : 7;
	this.tickLength = options&&options.tickLength ? options.tickLength : 5000;
	this.elemArr;
	this.$;
	const drawingCells = "<div class='jptb-jackpot-counter-cell'><div class='jptb-roller' data-rotate='0' data-duration='5000' style='transform: rotateX(0deg);transition-duration:5000ms'><div class='jptb-plane jptb-figure0'>0</div><div class='jptb-plane jptb-figure1'>1</div><div class='jptb-plane jptb-figure2'>2</div><div class='jptb-plane jptb-figure3'>3</div><div class='jptb-plane jptb-figure4'>4</div><div class='jptb-plane jptb-figure5'>5</div><div class='jptb-plane jptb-figure6'>6</div><div class='jptb-plane jptb-figure7'>7</div><div class='jptb-plane jptb-figure8'>8</div><div class='jptb-plane jptb-figure9'>9</div></div></div>";

	this.setCurrentValue = (v) => {
		if(isNaN(v/2)) 
			return console.info('= waiting for integer =');
		if(v > Math.pow(10, that.numRolls-2)){ 
			that.setNumRolls(v);
		}
		this.currentValue = v;
		let tt = new Date();
		that.coordinates.time.splice(0, 0, tt);
		let dur = parseInt(that.currentValue * 100) * ANGLE;
		that.controller(dur);		
		return this.currentValue;
	};
		
	this.setNumRolls = (a) => {
		let digits = that.numRolls-3,
			str = a.toFixed(0),
			rstr = Math.pow(10, digits).toFixed(0),
			def = str.length - rstr.length;

		that.numRolls += def;
		let wrapper = document.querySelector('#jptb' + that.id + ' .jptb-jackpot-counter-wrapper');
		let cell = wrapper.children[0];
		for(let i = 0; i < def; i++) {
			cell.insertAdjacentHTML("beforeBegin", drawingCells);
		}
		that.elemArr = Array.from(document.querySelectorAll('#jptb' + that.id + ' .jptb-roller'));
	}

	this.controller = (rotate) => {
		this.coordinates.rotate.splice(0, 0, rotate);
		let dRotate = this.coordinates.rotate[0]-this.coordinates.rotate[1];
		this.coordinates.speed.splice(0, 0, parseInt((dRotate/(this.tickLength/1000))));
		this.coordinates.speed.length = this.coordinates.speed.length > 4 ? 4 : this.coordinates.speed.length;
		this.coordinates.speedAverage = this.coordinates.speed.reduce(function(sum, current) {return parseInt(sum + current)}) / this.coordinates.speed.length;	
		this.coordinates.deviation = (Math.sqrt(this.coordinates.speed.reduce(function(a, b) {
			var dev = b - that.coordinates.speedAverage;
			return a+dev*dev;
		})/this.coordinates.speed.length))/1000;
		this.coordinates.duration = this.coordinates.deviation > 4 ? parseInt(dRotate / this.coordinates.speedAverage * 1000) :	this.tickLength;
	}

	this.transform = (elemArr, val) => {
		val = val ? val : that.currentValue;
		var arr = elemArr.slice(),
			data = val * 100;
		for(var i = arr.length; i >= 0; i--) {
			var multiplier = parseInt(data / Math.pow(10, arr.length - i)),
				rotate = multiplier * ANGLE;

			this.coordinates.rBuffer[i] = this.coordinates.rBuffer[i] ? rotate - this.coordinates.rBuffer[i] : rotate;
			
			if(this.coordinates.rBuffer[i] > 0) {
				let bezier = 'cubic-bezier(.7, .16, .3, .84)';
				that.setTransform(arr[i - 1], rotate, this.coordinates.duration, this.coordinates.delay, bezier);
			}
		}
	};
	
	this.setTransform = (el, rotate, duration, delay, bezier) => { 
		el.setAttribute('style', "transform: rotateX(" + rotate  + "deg);transition-duration:" + duration + "ms; transition-delay:" + delay + "ms;transition-timing-function:" + bezier + ";transform: rotateX(" + rotate  + "deg);-webkit-transition-duration:" + duration + "ms; -webkit-transition-delay:" + delay + "ms;-webkit-transition-timing-function:" + bezier);
	};

	/* actions */

	let eventText = document.querySelector('.aim') ? document.querySelector('.aim') : newElem('div', {class: 'fadeIn aim'});
	this.win = () => {
		eventText.textContent = "WIN";
		append(eventText);
		//that.addClass(document.getElementById('jptb' + that.id), 'jptb-win');
	};

	this.hit = () => {
		eventText.textContent = "HIT";
		append(eventText);
	};
	this.delete = () => {
		eventText.textContent = "DEL";
		append(eventText);
	};

	this.actionPlay = (action) => {
		switch (action) {
			case "WIN":	that.win();
			break;
			
			case "HIT":	that.hit();
			break;
			
			case "DELETE":	that.delete();
			break;
		}
	}

	// 🔚 
	
	this.sorting = () => {
		let elem = document.getElementById('jptb' + that.id);
			elem.style.order = parseInt(-that.currentValue);
	}

	
	(this.drawOdometer = () => {
		let parent = document.querySelector('.jptb-center');
			let jackpotItem = document.createElement('div');
				jackpotItem.className = 'jptb-jackpot-item';
				jackpotItem.style.order = that.jackOrder + '';
				jackpotItem.id = "jptb" + that.id;
				if(options&&options.jackName){
					jackpotItem.innerHTML = "<div class='jptb-jackpot-name'>" + that.jackName + "</div>";
				} else jackpotItem.innerHTML = "<div class='jptb-jackpot-name'></div>";
					
			let jackpotCounter = document.createElement('div');
			jackpotCounter.className = 'jptb-jackpot-counter';
			
			let jackpotСurrency = document.createElement('div');
			jackpotСurrency.className = 'jptb-jackpot-currency';
			jackpotСurrency.textContent = this.currency;

		let wrapper = document.createElement('div');
		wrapper.className = 'jptb-jackpot-counter-wrapper';
		let collection = '';
		for (let i = that.numRolls; i > 0; i--) collection += drawingCells;
		wrapper.innerHTML=collection;
		jackpotCounter.appendChild(wrapper);
		jackpotItem.appendChild(jackpotCounter);
		jackpotItem.appendChild(jackpotСurrency);
		parent.appendChild(jackpotItem);
		
		that.elemArr = Array.from(document.querySelectorAll('#jptb' + that.id + ' .jptb-roller'));
		that.$ = that.elemArr[that.elemArr.length-1];
	})();

	let event = new Event("trasitionend");
	this.stack = [];
	document.addEventListener("update", function(event) {
		let update = event.detail[0];  
		
		if(update.id && update.id == that.id) {
			that.stack.splice(0, 0, update.amount);
			console.log('stack: ' + that.stack);
			if(that.stack.length == 1) {
				that.transform(that.elemArr);
			}
		}
	}, false);

	this.$.addEventListener("webkitTransitionEnd", function(event) {
		setTimeout(()=>{
			that.transform(that.elemArr, that.stack.pop());
			that.sorting();
		}, 1000)
	}, false);

	return this;
};
/* helpers */

function newElem(tag, params) {
    params = params || {};
    var elem = document.createElementNS ?
        document.createElementNS('http://www.w3.org/1999/xhtml', tag) :
        document.createElement(tag);

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

document.addEventListener("DOMContentLoaded", (ev) => {
	(()=>{

		let panel = new WidgetTopPanel({
			container: 'topPanel',
			left     : 'game',
			right    : 'GO',
			slider_enable: 'off',
			counters : '[{"id": 1, "amount": 0}]'
		});
		panel.init();
		/* demo test */
		/* on production works through the method update(json) */
		let submit = document.getElementById('submitData'),
			input = document.getElementById('dataVal');

		let a = new Odometer({
			amount: 0,
			tickLength: 10000
		});
		submit.onclick = (ev) => {
			ev.preventDefault();
			a.setCurrentValue(input.value);
		console.log(a.currentValue);
			a.transform(a.elemArr, input.value);
		};
		console.log(a);
		/*test*/
	})();
}, false);
