/**
* Extend poppy with popup behaviour
*/

var Poppy = require('../index');
var Mod = window.Mod || require('mod-constructor');
var place = require('placer');
var extend = require('extend');
var css = require('mucss');

/**
 * Popup module
 * @constructor
 * @chainable
 * @module popup
 */
var Popup = module.exports = Mod({
	mixins: [Poppy]
});


var name = Poppy.displayName;

//shortcuts
var win = window, doc = document, root = doc.documentElement;



/* ---------------------------------- I N I T ---------------------------------------- */


/** Popup constructor */
var proto = Popup.fn;

proto.init = function(){
	// console.log('init popup')
};

proto.created = function(){
	// console.log('created popup', this.$blind)
};


/**
 * Autoinit instances.
 *
 * @see Use [selector-observer]{@link https://www.npmjs.org/package/selector-observer}
 *      if you want to init items dynamically. *
 */

document.addEventListener("DOMContentLoaded", function() {
	var items = document.querySelectorAll('[data-popup]');
	for(var i = items.length; i--;){
		new Popup(items[i]);
	}
});



/* -------------------------------- E L E M E N T S ---------------------------------- */


/**
 * Close button element
 */

proto.$closeButton = {
	init: function(){
		//create button
		var $closeButton = document.createElement('div');
		$closeButton.classList.add(name + '-close');

		return $closeButton;
	}
};

/** static overlay blind */
Popup.$blind = new Poppy({
	created: function(){
		this.$container.classList.add(name + '-blind');
	}
});
proto.$blind = {
	init: Popup.$blind
};

proto.$blindContainer = {
	init: Popup.$blind.$container
};

//make blind the holder
proto.holder.init = Popup.$blind.$container;


/** add proper class to the container */
proto.$container.changed = function($container){
	$container.classList.add(name + '-popup');
};



/* ------------------------------- O P T I O N S --------------------------------------*/


/** whether to show close button */
proto.closeButton = {
	'false': {

	},
	_: {
		before: function(){
			this.$container.appendChild(this.$closeButton);
		},
		after: function(){
			this.$container.removeChild(this.$closeButton);
		}
	}
};


/** show overlay along with popup */
proto.blind = {
	'false': {

	},
	'true': {

	}
};


/** react on href change */
proto.handleHref = {
	_: {
		'before, window hashchange': function(){
			//detect link in href
			if (document.location.hash === this.hash) {
				this.show();
			}
		}
	},
	'false' : {

	}
};



/* ----------------------------- B E H A V I O U R ----------------------------------- */


proto.state = extend({}, Poppy.fn.state, {
	hidden: {
		'click': 'show'
	},
	visible: {
		'this.$closeButton click, document click:not(.poppy-popup)': 'hide'
	}
});

proto.show = function(e) {
	//show blind
	this.$blind.show();

	//add overflow:hidden class to the body
	css(doc.body, {
		'overflow': 'hidden'
	});
	//in case if content is too high, add scrollbar
	this.initialMargin = css(root, 'margin-right');
	if (this.$container.offsetHeight > win.innerHeight) {
		css(root, {
			'margin-right': css.scrollbar
		});
	}

	//show container
	Poppy.fn.show.call(this);
};

proto.hide = function () {
	//show container
	Poppy.fn.hide.call(this);

	//remove overflow:hidden from the body
	css(doc.body, {
		'overflow': ''
	});
	css(root, {
		'margin-right': this.initialMargin
	});

	//show blind
	this.$blind.hide();
};

proto.place = function () {
	var self = this;

	//place properly (align by center)
	//@deprecated - popup style is set via css
	// place(this.$container, {
	// 	relativeTo: [win.innerWidth * .5, 0],
	// 	side: 'bottom',
	// 	align: .5,
	// 	within: this.$blind.$container
	// });

	//prevent anchor jump
	setTimeout(function(){
		self.$blind.$container.scrollTop = 0;
	});
};


//handle popup as a mod
module.exports = Mod(Popup);
