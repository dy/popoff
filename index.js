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

module.exports = Popup;

//FIXME: sidebar
//FIXME: effects
//FIXME: demo
//FIXME: draggable & resizable

//FIXME: move tall to modal-only mode

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

	var typeOpts = this.types[opts.type || this.type] || {};

	//hook up type events and options events
	if (typeOpts.onInit) this.on('init', typeOpts.onInit);
	if (typeOpts.onShow) this.on('show', typeOpts.onShow);
	if (typeOpts.onHide) this.on('hide', typeOpts.onHide);
	if (typeOpts.onAfterShow) this.on('afterShow', typeOpts.onAfterShow);
	if (typeOpts.onAfterHide) this.on('afterHide', typeOpts.onAfterHide);
	if (opts.onInit) this.on('init', opts.onInit);
	if (opts.onShow) this.on('show', opts.onShow);
	if (opts.onHide) this.on('hide', opts.onHide);
	if (opts.onAfterShow) this.on('afterShow', opts.onAfterShow);
	if (opts.onAfterHide) this.on('afterHide', opts.onAfterHide);

	//take over type’s options
	extend(this, typeOpts, opts);

	//generate unique id
	this.id = uid();

	//FIXME: :'(
	this.update = this.update.bind(this);

	//take over a target first
	if (!this.container) {
		this.container = document.body || document.documentElement;
	}

	//ensure element
	if (!this.element) this.element = document.createElement('div');
	this.element.classList.add('popoff-popup');
	this.element.classList.add('popoff-hidden');
	this.element.classList.add(`popoff-${this.type}`);

	if (this.content instanceof HTMLElement) {
		this.element.appendChild(this.content);
	}
	else if (typeof this.content === 'string') {
		this.element.innerHTML = this.content;
	}

	//create close element
	this.closeElement = document.createElement('div');
	this.closeElement.classList.add('popoff-close');
	if (this.closable) {
		this.closeElement.addEventListener('click', e => {
			this.hide();
		});
		this.element.appendChild(this.closeElement);
	}

	//create tip
	this.tipElement = document.createElement('div');
	this.tipElement.classList.add('popoff-tip');
	this.tipElement.classList.add('popoff-hidden');
	if (this.tip) {
		this.container.appendChild(this.tipElement);
		this.element.classList.add('popoff-popup-tip');
	}

	//create overflow for tall content
	this.overflowElement = document.createElement('div');
	this.overflowElement.classList.add('popoff-overflow');

	this.container.appendChild(this.element);

	if (this.escapable) {
		document.addEventListener('keyup', e => {
			if (e.which === 27) {
				this.hide();
			}
		});
	}

	//init proper target
	if (typeof this.target === 'string') {
		this.target = document.querySelector(this.target);
	}

	//update on resize
	window.addEventListener('resize', () => {
		this.update();
	});

	//preset effects
	var effects = Array.isArray(this.effect) ? this.effect : [this.effect];
	effects.forEach((effect) => {
		this.element.classList.add(`popoff-${ effect }-out`);
		this.tipElement.classList.add(`popoff-${ effect }-out`);
	});

	this.emit('init');
}

inherits(Popup, Emitter);

extend(Popup.prototype, {
	/** Show overlay, will be detected based off type */
	overlay: true,

	/** Show close button */
	closable: true,

	/** Close by escape */
	escapable: true,

	/** Show tip */
	tip: false,

	/** Place popup relative to the element, like dropdown */
	target: window,

	/** Whether to show only one popup */
	single: true,

	/** A target to bind default placing */
	container: document.body || document.documentElement,

	/** Animation effect, can be a list */
	effect: 'fade',

	/** Default module type to take over the options */
	type: 'modal',

	/** Placing settings */
	side: 'center',
	align: 'center',

	//default anim fallback
	animTimeout: 1000,

	//detect tall content
	tall: false
});



/** Type of default interactions */
Popup.prototype.types = {
	modal: {
		overlay: false,
		closable: true,
		escapable: true,
		tip: false,
		single: true,
		side: 'center',
		align: 'center',
		target: null,
		effect: ['fade', 'zoom', 'slide'],
		onInit: function () {
			if (this.target) {
				this.target.addEventListener('click', (e) => {
					if (this.isVisible) return;

					return this.show();
				});
			}
			else {
				this.target = window;
			}
		},
		onShow: function () {
			//FIXME: maybe not really good pattern, but the modal is always placed relative to window viewport. Easies than managing alignTo property.
			this.currentTarget = window;
		}
	},

	dropdown: {
		overlay: false,
		closable: false,
		escapable: true,
		target: null,
		tip: true,
		single: true,
		side: 'bottom',
		align: 'center',
		effect: ['fade', 'slide'],
		onInit: function () {
			if (this.target) {
				this.target.addEventListener('click', (e) => {
					if (this.isVisible) return this.hide();
					else return this.show();
				});
			}

			//hide on unfocus
			document.addEventListener('click', e => {
				if (!this.isVisible) {
					return;
				}

				//ignore contain clicks
				if (this.element.contains(e.target)) {
					return;
				}

				//ignore self clicks
				this.hide();
			});
		}
	},

	tooltip: {
		overlay: false,
		closable: false,
		escapable: true,
		target: null,
		tip: true,
		single: true,
		side: 'right',
		align: 'center',
		effect: ['fade', 'slide'],
		timeout: 500,
		onInit: function () {
			var that = this;

			if (this.target) {
				this.target.addEventListener('mouseenter', (e) => {
					this._leave && clearTimeout(this._leave);
					if (this.isVisible) return;
					this.show();
				});
				this.target.addEventListener('mouseleave', (e) => {
					if (!this.isVisible) return;
					this._leave = setTimeout(() => {
						this.hide();
					}, this.timeout);
				});
			}

			this.element.addEventListener('mouseenter', (e) => {
				if (!this.isVisible) return;
				this._leave && clearTimeout(this._leave);
			});
			this.element.addEventListener('mouseleave', (e) => {
				if (!this.isVisible) return;
				this._leave = setTimeout(() => {
					this.hide();
				}, this.timeout);
			});
		}
	},

	sidebar: {
		overlay: false,
		closable: true,
		escapable: true,
		tip: false,
		single: true,
		side: 'right',
		align: .5,
		target: null,
		effect: ['fade', 'zoom', 'slide'],
		update: () => {},
		onInit: function () {
			if (this.target) {
				this.target.addEventListener('click', (e) => {
					if (this.isVisible) return;

					return this.show();
				});
			}
			else {
				this.target = window;
			}
			this.element.setAttribute('data-side', this.side);
		}
	}
};


/**
 * Show popup near to the target
 */
Popup.prototype.show = function (target) {
	this.currentTarget = target || this.target;
	this.currentTarget.classList.add('popoff-active');
	this.element.classList.remove('popoff-hidden');
	this.tipElement.classList.remove('popoff-hidden');

	var elHeight = this.element.offsetHeight;

	//apply overflow on body for tall content
	if (elHeight > window.innerHeight) {
		this.isTall = true;
		this.element.style.left = null;
		this.element.style.right = null;
		this.container.classList.add('popoff-container');
		this.container.appendChild(this.overflowElement);
		this.overflowElement.appendChild(this.element);
	}

	this.emit('show', this.currentTarget);

	//in some way it needs to be called in timeout with some delay, otherwise animation fails
	setTimeout(() => {
		var effects = Array.isArray(this.effect) ? this.effect : [this.effect];
		effects.forEach((effect) => {
			this.element.classList.remove(`popoff-${ effect }-out`);
			this.element.classList.add(`popoff-${ effect }-in`);
			this.tipElement.classList.remove(`popoff-${ effect }-out`);
			this.tipElement.classList.add(`popoff-${ effect }-in`);
		});
		this.isVisible = true;
		this.update();
	}, 10);

	if (this.overlay) {
		this._overlay = createOverlay({
			closable: true,
			container: this.isTall ? this.overflowElement : this.container
		})
		.on('hide', e => {
			this._overlay = null;
			this.hide();
		})
		.show();
	}

	this.isAnimating = true;
	this.animend((e) => {
		//in case if something happened with content during the animation
		// this.update();
		this.isAnimating = false;
		this.emit('afterShow');
	});

	return this;
}


/**
 * Hide popup
 */
Popup.prototype.hide = function () {
	//overlay recurrently calls this.hide, so just drop it here
	if (this._overlay) return this._overlay.hide();

	this.currentTarget && this.currentTarget.classList && this.currentTarget.classList.remove('popoff-active');

	this.emit('hide');


	var effects = Array.isArray(this.effect) ? this.effect : [this.effect];
	effects.forEach((effect) => {
		this.element.classList.remove(`popoff-${ effect }-in`);
		this.element.classList.add(`popoff-${ effect }-out`);
		this.tipElement.classList.remove(`popoff-${ effect }-in`);
		this.tipElement.classList.add(`popoff-${ effect }-out`);
	});

	this.isAnimating = true;
	this.animend(() => {
		this.isVisible = false;
		this.isAnimating = false;
		this._overlay = null;
		this.element.classList.add('popoff-hidden');
		this.tipElement.classList.add('popoff-hidden');

		if (this.isTall) {
			this.isTall = false;
			this.container.classList.remove('popoff-container');
			this.container.removeChild(this.overflowElement);
			this.container.appendChild(this.element);
		}

		this.emit('afterHide');
	});

	return this;
}


/** Place popup next to the target */
Popup.prototype.update = function (how) {
	if (!this.isVisible) return this;

	//tall modals are placed via css
	if (this.isTall) return this;

	how = extend({
		target: this.currentTarget || this.target,
		side: this.side,
		align: this.align,
		within: window
	}, how);

	this.emit('update', how);

	place(this.element, how);

	if (this.tip) {
		var side = 'top';
		switch (how.side) {
			case 'top':
				side = 'bottom';
				break;
			case 'bottom':
				side = 'top';
				break;
			case 'left':
				side = 'right';
				break;
			case 'right':
				side = 'left';
				break;
			default:
				side = 'center';
		}

		this.tipElement.setAttribute('data-side', side);
		place(this.tipElement, {
			target: this.target,
			side: how.side,
			align: 'center',
			within: null
		});
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
