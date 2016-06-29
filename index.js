/**
 * @module  popup
 */


const Emitter = require('events');
const place = require('placer');
const extend = require('xtend/mutable');
const uid = require('get-uid');
const inherits = require('inherits');
const createOverlay = require('./overlay');
var sf = require('sheetify');
var className = sf('./index.css');


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
	this.place = this.place.bind(this);

	//take over a target first
	if (!this.container) {
		this.container = document.body || document.documentElement;
	}
	this.container.classList.add(className);

	//ensure element
	if (!this.element) this.element = document.createElement('div');
	this.element.classList.add('popup');
	this.element.classList.add('hidden');
	this.element.innerHTML = this.content;
	this.container.appendChild(this.element);

	//create close element
	this.closeElement = document.createElement('div');
	this.closeElement.classList.add('close');
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

	animTimeout: 1000
});


/**
 * Show popup near to the target
 */
Popup.prototype.show = function () {
	this.emit('show');

	//in some way it needs to be called in timeout, otherwise animation fails
	setTimeout(() => {
		this.element.classList.remove('hidden');
		this.element.classList.add(`${ this.effect }-in`);
		this.place();
	});

	if (this.overlay) {
		this._overlay = createOverlay({closable: this.closable})
		.on('hide', e => {
			this._overlay = null;
			this.hide();
		})
		.show();
	}

	var that = this;

	// this.element.addEventListener('animationend', end);
	// this.element.addEventListener('mozAnimationEnd', end);
	// this.element.addEventListener('webkitAnimationEnd', end);
	// this.element.addEventListener('oanimationend', end);
	// this.element.addEventListener('MSAnimationEnd', end);
	this.element.addEventListener('transitionend', end);
	this.element.addEventListener('webkitTransitionEnd', end);
	this.element.addEventListener('otransitionend', end);
	this.element.addEventListener('oTransitionEnd', end);
	this.element.addEventListener('msTransitionEnd', end);
	var to = setTimeout(end, this.animTimeout);

	function end () {
		that.element.classList.remove(`${ that.effect }-in`);
		window.addEventListener('resize', that.place);

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
	}

	return this;
}


/**
 * Hide popup
 */
Popup.prototype.hide = function () {
	//overlay recurrently calls this.hide, so just drop it here
	if (this._overlay) return this._overlay.hide();

	this.emit('hide');

	this.element.classList.add('hidden');
	this.element.classList.add(`${ this.effect }-out`);

	this.container.addEventListener('animationend', end);
	this.container.addEventListener('mozAnimationEnd', end);
	this.container.addEventListener('webkitAnimationEnd', end);
	this.container.addEventListener('oanimationend', end);
	this.container.addEventListener('MSAnimationEnd', end);
	var to = setTimeout(end, this.animTimeout);

	var that = this;

	function end () {
		that.element.classList.remove(`${ that.effect }-out`);
		that._overlay = null;

		clearTimeout(to);
		that.container.removeEventListener('animationend', end);
		that.container.removeEventListener('mozAnimationEnd', end);
		that.container.removeEventListener('webkitAnimationEnd', end);
		that.container.removeEventListener('oanimationend', end);
		that.container.removeEventListener('MSAnimationEnd', end);
		window.removeEventListener('resize', that.place);
	}

	return this;
}


/** Place popup next to the target */
Popup.prototype.place = function (how) {
	place(this.element, extend({
		target: this.container,
		side: 'center',
		align: 'center'
	}, how));

	return this;
}


/** Type of default interactions */
Popup.prototype.type = {
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