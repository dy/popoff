/**
 * @module  popup
 */


const Emitter = require('events');
const place = require('placer');
const extend = require('xtend/mutable');
const uid = require('get-uid');
const inherits = require('inherits');


/** Animation end event */
const ANIM_END = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';


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
function Popup () {
	var self = this;

	//ensure opts
	options = options || {};

	//generate unique id
	self.id = uid();

	//take over a target first
	self.target = options.target;

	//ensure element
	if (!(el instanceof HTMLElement)) {
		self.element = document.createElement('div');

		//think of element as a string
		if (el) {
			self.element.innerHTML = el;
		}
	} else {
		self.element = el;
	}

	self.element.classList.add('popup');

	//ensure element is in the document
	document.body.appendChild(self.element);

	//create close element
	self.closeElement = document.createElement('div');
	self.closeElement.classList.add('popup-close');

	//take over all props
	extend(self, options);

	//go initial hidden state
	self.state = 'hidden';

	//bind events etc
	self.enable();

}

inherits(Popup, Emitter);

extend(Popup.prototype, {
	/** Show overlay */
	overlay: false,

	/** Show close button */
	closable: false,

	/** Close by escape */
	escapable: false,

	/** Show tip */
	tip: false,

	/** Whether to show only one popup */
	single: true,

	/** A target to bind default placing */
	target: window,

	/** Animation effect */
	effect: 'fade'
});


/** Undisable */
Popup.prototype.enable = function (target) {
	var self = this;

	//hook up closable
	if (self.closable) {
		self.element.appendChild(self.closeElement);
	}

	on(self.closeElement, `click.${ self.id }`, function () {
		self.hide();
	});

	//hook up escapable
	if (self.escapable) {
		on(document, 'keyup', function (e) {
			if (e.which === 27) {
				self.hide();
			}
		});
	}

	return self;
}


/**
 * Show popup near to the target
 */
Popup.prototype.show = function () {
	var self = this;

	if (self.state !== 'hidden') return;

	self.element.classList.remove('popup-hidden');

	self.element.classList.add('popup-animating');
	self.element.classList.add(`popup-${ self.effect }-in`);

	self.element.addEventListener(ANIM_END, () => {
		self.element.classList.add('popup-visible');
	});

	self.place();

	self.emit('show');

	return self;
}


/**
 * Hide popup
 */
Popup.prototype.hide = function () {
	var self = this;

	self.element.classList.add('popup-hidden');

	self.state = 'animOut';

	self.emit('hide');

	return self;
}


/** Place popup next to the target */
Popup.prototype.place = function (how) {
	var self = this;

	place(self.element, extend({
		to: self.target,
		side: 'center',
		align: 'center',
		within: window
	}, how));

	return self;
}


/** Type of default interactions */
proto.type = {
	//undefined - implement showing strategy manually
	_: {
		before: function () {
			var self = this;
		}
	},

	//dropdown
	dropdown: {
		before: function () {
			var self = this;

			//show on click
			on(self.target, `click`, function (e) {
				//ignore instant bubbling
				if (self.state !== 'hidden') {
					return;
				}

				self.show();
			});

			//hide on unfocus
			document.addEventListener('click', () => {
				//ignore instant bubbling
				if (self.state !== 'visible') {
					return;
				}
				//ignore self clicks
				if (self.element.contains(e.target)) {
					return;
				}

				self.hide();
			})
		},
		after: function () {
			var self = this;

			off(self.target, `click.${ self.id }`);
			off(document, `click.${ self.id }`);
		}
	},

	//tooltip
	tooltip: {
		before: function () {
			var self = this;

			on(self.target, `mouseenter.${ self.id }`, function () {
				if (self.state !== 'hidden') {
					return;
				}

				self.show();
			});

			on(self.target, `mouseleave.${ self.id }`, function () {
				if (self.state !== 'visible') {
					return;
				}

				self.hide();
			});

			on(self.element, `mouseleave.${ self.id }`, function () {
				if (self.state !== 'visible') {
					return;
				}

				self.hide();
			});
		},
		after: function () {
			var self = this;

			off(self.target, `.${ self.id }`);
			off(document, `.${ self.id }`);
		}
	}
};


/** Current visibility state */
proto.state = {
	animIn: {

		after: function () {
			var self = this;

			self.element.classList.remove('popup-animating');
			self.element.classList.remove(`popup-${ self.effect }-in`);

			off(self.element, ANIM_END);
		}
	},
	animOut: {
		before: function () {
			var self = this;

			self.element.classList.add('popup-animating');
			self.element.classList.add(`popup-${ self.effect }-out`);

			once(self.element, ANIM_END, function () {
				self.state = 'hidden';
			});
		},

		after: function () {
			var self = this;

			self.element.classList.remove('popup-animating');
			self.element.classList.remove(`popup-${ self.effect }-out`);

			off(self.element, ANIM_END);
		}
	},
};



module.exports = Popup;