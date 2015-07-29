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


/** Animation end event */
const ANIM_END = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';


/**
 * @class  Poppy
 */
class Poppy extends Emitter {
	/**
	 * @constructor
	 *
	 * @param {Element} el An element to take as a content
	 * @param {Object} options Showing options
	 *
	 * @return {Poppy} A poppy controller
	 */
	constructor (el, options) {
		super();

		var self = this;

		//ensure element
		if (el instanceof HTMLElement) {
			self.element = el;
		}
		else {
			self.element = document.createElement('div');

			//think of element as a string
			if (el) {
				self.element.innerHTML = el;
			}
		}

		self.element.classList.add('poppy');

		//ensure element is in the document
		document.body.appendChild(self.element);


		//define states
		defineState(self, 'type', self.type);
		defineState(self, 'state', self.state);

		//take over all props
		extend(self, options);

		//go hidden state
		self.state = 'hidden';

		//bind events etc
		self.enable();
	}


	/** Undisable */
	enable (target) {
		var self = this;

		return self;
	}


	/**
	 * Show popup near to the target
	 *
	 * @param {Element|number} target An element or coordinates to show the popup
	 */
	show (target) {
		var self = this;

		self.state = 'animIn';

		return self;
	}


	/**
	 * Hide popup
	 */
	hide () {
		var self = this;

		self.state = 'animOut';

		return self;
	}


	/** Place popup next to the target */
	place (target) {
		var self = this;

		return self;
	}
}


var proto = Poppy.prototype;


/** Show overlay */
proto.overlay = false;


/** Show close button */
proto.closable = true;


/** Close by escape */
proto.escapable = true;


/** Show tip */
proto.tip = true;


/** Whether to show only one poppy */
proto.single = true;


/** A target to bind default placing */
proto.target = document;


/** Type of default interactions */
proto.type = {
	//undefined - implement showing strategy manually
	_: {

	},

	//dropdown
	dropdown: {
		before: function () {
			var self = this;

			//show on click
			on(self.target, 'click', function (e) {
				self.show();
			});

			//hide on unfocus
			on(document, 'click', function (e) {
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

		}
	},

	//tooltip
	tooltip: {
		before: function () {

		},
		after: function () {

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


module.exports = Poppy;