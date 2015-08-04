/**
 * @module  poppy
 */


import Emitter from 'events';
import place from 'placer';
import extend from 'xtend/mutable';
import defineState from 'define-state';
import on from 'emmy/on';
import off from 'emmy/off';
import once from 'emmy/once';
import uid from 'get-uid';


/** Animation end event */
const ANIM_END = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';


/**
 * @class  Popup
 */
class Popup extends Emitter {
	/**
	 * @constructor
	 *
	 * @param {Element} el An element to take as a content
	 * @param {Object} options Showing options
	 *
	 * @return {Popup} A poppy controller
	 */
	constructor (el, options) {
		super();

		var self = this;

		//ensure opts
		options = options || {};

		//generate unique id
		self.id = uid();

		//define states
		defineState(self, 'type', self.type);
		defineState(self, 'state', self.state);

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

		self.element.classList.add('poppy');

		//ensure element is in the document
		document.body.appendChild(self.element);

		//create close element
		self.closeElement = document.createElement('div');
		self.closeElement.classList.add('poppy-close');

		//take over all props
		extend(self, options);

		//go initial hidden state
		self.state = 'hidden';

		//bind events etc
		self.enable();
	}


	/** Undisable */
	enable (target) {
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
	show () {
		var self = this;

		if (self.state !== 'hidden') return;

		self.state = 'animIn';

		self.place();

		return self;
	}


	/**
	 * Hide popup
	 */
	hide () {
		var self = this;

		if (self.state !== 'visible') return;

		self.state = 'animOut';

		return self;
	}


	/** Place popup next to the target */
	place (how) {
		var self = this;

		place(self.element, extend({
			to: self.target,
			side: 'center',
			align: 'center',
			within: window
		}, how));

		return self;
	}
}


var proto = Popup.prototype;


/** Show overlay */
proto.overlay = false;


/** Show close button */
proto.closable = false;


/** Close by escape */
proto.escapable = false;


/** Show tip */
proto.tip = false;


/** Whether to show only one poppy */
proto.single = true;


/** A target to bind default placing */
proto.target = window;


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
			on(document, `click.${ self.id }`, function (e) {
				//ignore instant bubbling
				if (self.state !== 'visible') {
					return;
				}
				//ignore self clicks
				if (self.element.contains(e.target)) {
					return;
				}

				self.hide();
			});
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
	//disabled state
	_: {

	},
	hidden: {
		before: function () {
			var self = this;

			self.element.classList.add('poppy-hidden');
		},

		after: function () {
			var self = this;

			self.element.classList.remove('poppy-hidden');
		}
	},
	animIn: {
		before: function () {
			var self = this;

			self.element.classList.add('poppy-animating');
			self.element.classList.add(`poppy-${ self.effect }-in`);

			once(self.element, ANIM_END, function () {
				self.state = 'visible';
			});
		},

		after: function () {
			var self = this;

			self.element.classList.remove('poppy-animating');
			self.element.classList.remove(`poppy-${ self.effect }-in`);

			off(self.element, ANIM_END);
		}
	},
	animOut: {
		before: function () {
			var self = this;

			self.element.classList.add('poppy-animating');
			self.element.classList.add(`poppy-${ self.effect }-out`);

			once(self.element, ANIM_END, function () {
				self.state = 'hidden';
			});
		},

		after: function () {
			var self = this;

			self.element.classList.remove('poppy-animating');
			self.element.classList.remove(`poppy-${ self.effect }-out`);

			off(self.element, ANIM_END);
		}
	},
	visible: {
		before: function () {
			var self = this;

			self.element.classList.add('poppy-visible');
		},

		after: function () {
			var self = this;

			self.element.classList.remove('poppy-visible');
		}
	}
};


/** Animation effect */
proto.effect = 'fade';


module.exports = Popup;