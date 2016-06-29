/**
 * @module  popup
 */


const Emitter = require('events');
const place = require('placer');
const extend = require('xtend/mutable');
const uid = require('get-uid');
const inherits = require('inherits');
const createOverlay = require('./overlay');
const insertCss = require('insert-css');
const fs = require('fs');

insertCss(fs.readFileSync('./index.css', 'utf-8'));


/**
 * @class  Popup
 *
 * @constructor
 *
 * @param {Element} el An element to take as a content
 * @param {Object} options Showing options
 *
 * @return {Popup} A popup controller
 */
function Popup (opts) {
	if (!(this instanceof Popup)) return new Popup(opts);

	extend(this, opts);

	//generate unique id
	this.id = uid();

	//FIXME: :'(
	this.update = this.update.bind(this);

	//take over a target first
	if (!this.container) {
		this.container = document.body || document.documentElement;
	}
	this.container.classList.add('popoff-container');

	//ensure element
	if (!this.element) this.element = document.createElement('div');
	this.element.classList.add('popoff-popup');
	this.element.classList.add('popoff-hidden');
	this.element.innerHTML = this.content;
	this.container.appendChild(this.element);

	//create close element
	this.closeElement = document.createElement('div');
	this.closeElement.classList.add('popoff-close');
	if (this.closable) {
		this.closeElement.addEventListener('click', e => {
			this.hide();
		});
		this.element.appendChild(this.closeElement);
	}

	if (this.escapable) {
		document.addEventListener('keyup', e => {
			if (e.which === 27) {
				this.hide();
			}
		});
	}

	if (/modal|popup|dialog|confirm/.test(this.type)) {
		this.element.classList.add('big');
	}
	else {
		this.element.classList.add('small');
	}

	window.addEventListener('resize', () => {
		this.update();
	});

	//ensure element is in the document
	document.body.appendChild(this.element);
}

inherits(Popup, Emitter);

extend(Popup.prototype, {
	/** Show overlay */
	overlay: true,

	/** Show close button */
	closable: true,

	/** Close by escape */
	escapable: true,

	/** Show tip */
	tip: false,

	/** Whether to show only one popup */
	single: true,

	/** A target to bind default placing */
	container: document.body || document.documentElement,

	/** Animation effect */
	effect: 'fade',

	//default type is modal
	type: 'modal',

	//default anim fallback
	animTimeout: 1000
});


/**
 * Show popup near to the target
 */
Popup.prototype.show = function () {
	this.emit('show');

	//in some way it needs to be called in timeout, otherwise animation fails
	setTimeout(() => {
		this.element.classList.remove('popoff-hidden');
		this.element.classList.add(`popoff-${ this.effect }`);
		// this.element.classList.add(`popoff-${ this.effect }-in`);
		this.update();
	});

	if (this.overlay) {
		this._overlay = createOverlay({closable: this.closable})
		.on('hide', e => {
			this._overlay = null;
			this.hide();
		})
		.show();
	}

	this.animend((e) => {
		//in case if something happened with content during the animation
		this.update();
	});

	return this;
}


/**
 * Hide popup
 */
Popup.prototype.hide = function () {
	//overlay recurrently calls this.hide, so just drop it here
	if (this._overlay) return this._overlay.hide();

	this.emit('hide');

	this.element.classList.add('popoff-hidden');
	this.element.classList.remove(`popoff-${ this.effect }`);

	this.animend(() => {
		this._overlay = null;
	});

	return this;
}


/** Place popup next to the target */
Popup.prototype.update = function (how) {
	if (/modal|popup|dialog|confirm/.test(this.type)) {
		place(this.element, extend({
			target: window,
			side: 'center',
			align: 'center'
		}, how));
	}
	else {
		place(this.element, extend({
			target: this.container,
			side: 'center',
			align: 'center',
			within: window
		}, how));
	}

	return this;
}


/** Trigger callback once on anim end */
Popup.prototype.animend = function (cb) {
	var to = setTimeout(() => {
		cb.call(this);
	}, this.animTimeout);

	this.element.addEventListener('transitionend', end);
	this.element.addEventListener('webkitTransitionEnd', end);
	this.element.addEventListener('otransitionend', end);
	this.element.addEventListener('oTransitionEnd', end);
	this.element.addEventListener('msTransitionEnd', end);

	var that = this;
	function end () {
		clearTimeout(to);

		// that.element.removeEventListener('animationend', end);
		// that.element.removeEventListener('mozAnimationEnd', end);
		// that.element.removeEventListener('webkitAnimationEnd', end);
		// that.element.removeEventListener('oanimationend', end);
		// that.element.removeEventListener('MSAnimationEnd', end);
		that.element.removeEventListener('transitionend', end);
		that.element.removeEventListener('webkitTransitionEnd', end);
		that.element.removeEventListener('otransitionend', end);
		that.element.removeEventListener('oTransitionEnd', end);
		that.element.removeEventListener('msTransitionEnd', end);

		cb.call(that);
	}
}

/** Type of default interactions */
Popup.prototype.types = {
	//undefined - implement showing strategy manually
	_: {
		before: function () {
			var that = this;
		}
	},

	//dropdown
	dropdown: {
		before: function () {
			var that = this;

			//show on click
			on(this.target, `click`, function (e) {
				//ignore instant bubbling
				if (this.state !== 'hidden') {
					return;
				}

				this.show();
			});

			//hide on unfocus
			document.addEventListener('click', () => {
				//ignore instant bubbling
				if (this.state !== 'visible') {
					return;
				}
				//ignore this clicks
				if (this.element.contains(e.target)) {
					return;
				}

				this.hide();
			})
		},
		after: function () {
			var that = this;

			off(this.target, `click.${ this.id }`);
			off(document, `click.${ this.id }`);
		}
	},

	//tooltip
	tooltip: {
		before: function () {
			var that = this;

			on(this.target, `mouseenter.${ this.id }`, function () {
				if (this.state !== 'hidden') {
					return;
				}

				this.show();
			});

			on(this.target, `mouseleave.${ this.id }`, function () {
				if (this.state !== 'visible') {
					return;
				}

				this.hide();
			});

			on(this.element, `mouseleave.${ this.id }`, function () {
				if (this.state !== 'visible') {
					return;
				}

				this.hide();
			});
		},
		after: function () {
			var that = this;

			off(this.target, `.${ this.id }`);
			off(document, `.${ this.id }`);
		}
	}
};


module.exports = Popup;