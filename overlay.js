/**
 * @module  popoff/overlay
 *
 * Because overlay-component is hopelessly out of date.
 * This is modern rewrite.
 */

const Emitter = require('events').EventEmitter;
const inherits = require('inherits');
const extend = require('xtend/mutable');
var sf = require('sheetify');
var className = sf('./index.css');


module.exports = Overlay;


/**
 * Initialize a new `Overlay`.
 *
 * @param {Object} options
 * @api public
 */

function Overlay(options) {
	if (!(this instanceof Overlay)) return new Overlay(options);

	Emitter.call(this);
	extend(this, options);

	if (!this.container) {
		this.container = document.body || document.documentElement;
	}
	this.container.classList.add(className);

	//create overlay element
	this.element = document.createElement('div');
	this.element.classList.add('overlay');
	this.element.classList.add('hidden');

	if (this.closable) {
		this.element.addEventListener('click', e => {
			this.hide();
		});
		this.element.classList.add('closable');
	}
}

inherits(Overlay, Emitter);

//close overlay by click
Overlay.prototype.closable = true;


/**
 * Show the overlay.
 *
 * Emits "show" event.
 *
 * @return {Overlay}
 * @api public
 */

Overlay.prototype.show = function () {
	var self = this;

	this.emit('show');
	this.container.appendChild(this.element);

	//class removed in a timeout to save animation
	setTimeout( function () {
		self.element.classList.remove('hidden');
	});

	return this;
};


/**
 * Hide the overlay.
 *
 * Emits "hide" event.
 *
 * @return {Overlay}
 * @api public
 */

Overlay.prototype.hide = function () {
	this.emit('hide');

	this.element.classList.add('hidden');

	this.container.addEventListener('transitionend', end);
	this.container.addEventListener('webkitTransitionEnd', end);
	this.container.addEventListener('otransitionend', end);
	this.container.addEventListener('oTransitionEnd', end);
	this.container.addEventListener('msTransitionEnd', end);
	var to = setTimeout(end, 1000);

	var that = this;
	function end () {
		that.container.removeEventListener('transitionend', end);
		that.container.removeEventListener('webkitTransitionEnd', end);
		that.container.removeEventListener('otransitionend', end);
		that.container.removeEventListener('oTransitionEnd', end);
		that.container.removeEventListener('msTransitionEnd', end);
		clearInterval(to);

		that.container.removeChild(that.element);
	}

	return this;
};

