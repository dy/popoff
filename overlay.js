/**
 * @module  popoff/overlay
 *
 * Because overlay-component is hopelessly out of date.
 * This is modern rewrite.
 */

const Emitter = require('events').EventEmitter;
const inherits = require('inherits');
const extend = require('xtend/mutable');


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

	//create overlay element
	this.element = document.createElement('div');
	this.element.classList.add('popoff-overlay');

	if (this.closable) {
		this.element.addEventListener('click', e => {
			this.hide();
		});
		this.element.classList.add('popoff-closable');
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
	this.emit('show');

	this.container.appendChild(this.element);

	//class removed in a timeout to save animation
	setTimeout( () => {
		this.element.classList.add('popoff-visible');
		this.emit('afterShow');
	}, 10);

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

	this.element.classList.remove('popoff-visible');

	this.element.addEventListener('transitionend', end);
	this.element.addEventListener('webkitTransitionEnd', end);
	this.element.addEventListener('otransitionend', end);
	this.element.addEventListener('oTransitionEnd', end);
	this.element.addEventListener('msTransitionEnd', end);
	var to = setTimeout(end, 1000);

	var that = this;
	function end () {
		that.element.removeEventListener('transitionend', end);
		that.element.removeEventListener('webkitTransitionEnd', end);
		that.element.removeEventListener('otransitionend', end);
		that.element.removeEventListener('oTransitionEnd', end);
		that.element.removeEventListener('msTransitionEnd', end);
		clearInterval(to);

		that.container.removeChild(that.element);
		that.emit('afterHide');
	}

	return this;
};

