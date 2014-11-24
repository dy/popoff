var type = require('mutype');
var css = require('mucss');
var place = require('placer');
var q = require('query-relative');
var parse = require('muparse');
var extend = require('extend');
var state = require('st8');


/**
 * Poppy is a base class for building any kind of popupping stuff.
 *
 * These things might be:
 * overlay
 * tooltip
 * dropdown
 * notifier
 * popover
 * slide-screen
 * modal
 * balloon
 * etc.
 *
 * @module Poppy
 */
module.exports = Poppy;


/* ---------------------------------- I N I T ---------------------------------------- */


/**
 * @constructor
 */
function Poppy(options){
	//take over all props
	extend(this, options);

	//apply params
	state(this, this.constructor.options);
}


/**
 * Defaults & behaviour
 */
Poppy.options = {
	/**
	 * An element causing popup to show.
	 * Redefine in exact instance of poppy.
	 */
	target: {},

	/**
	 * A container instance.
	 * Unique per poppy.
	 *
	 * @type {Element}
	 */
	container: {
		init: function(){
			// create poppy container
			var $container = document.createElement('div');
			$container.className = 'poppy-container';
			$container.className += ' ' + this.containerClass;

			// set reference to this
			$container.poppy = this;

			return $container;
		}
	},


	/**
	 * Class to append to {@link container}
	 */
	containerClass: '',


	/**
	 * Small arrow aside the container.
	 * Tip is a tip container indeed, but user shouldn’t care.
	 *
	 * @todo Think of placing tip via placer and placing to the holder
	 *       The way container is placed.
	 *       It will allow to encapsulate tip placing logic.
	 *       Or try to pass relativeTo attribute to the placer for the tip.
	 *       So try to use placer for tips anyway.
	 */
	tip: {
		init: function(){
			//create tip - a container with overflow:hidden, and :after - a white rectangle pseudo inside.
			var $tip = document.createElement('div');
			$tip.className = 'popp-tip';

			return $tip;
		}
	},


	/**
	 * Where to place container
	 *
	 * @type {Element}
	 */
	holder: {
		init: 'body',
		get: function(value){
			return q(value);
		}
	},


	/**
	 * Content to show in the container.
	 *
	 * @type {(string|Node|selector)}
	 */
	content: null,


	/**
	 * Type of content to show
	 *
	 * @enum {string}
	 * @default null
	 *
	 * null		Other element on the page
	 * 'html'	Insert content as innerHTML
	 * 'image'	An image will be loaded
	 * 'ajax'	Request an URL, insert as an HTML
	 * 'iframe'	Insert an iframe with URL passed
	 * 'swf'
	 * 'text'	Insert content as a plain text
	 */
	contentType: {
		//some external element/selector
		_:{
			getContentElement: function(val){
				return q(val);
			},
		},

		//innerHTML
		html: {
			getContentElement: function(val){
				var el;
				//ensure content holder exists
				if (!this.contentElement) {
					el = this.contentElement = document.createElement('div');
					this.container.appendChild(el);
				}
				else {
					el = this.contentElement;
				}
				el.innerHTML = val;
				return el;
			}
		}
	},


	/** Whether to show tip or not
	 *
	 * @enum {boolean}
	 * @default false
	 */
	// tip: {
	// 	'top, left, bottom, right': {
	// 		before: function(){
	// 			//add tip class
	// 			this.$container.classList.add(name + '-container-tip');

	// 			//append tip to the container
	// 			this.$container.appendChild(this.$tip);
	// 		}
	// 	},
	// 	'top, bottom': {
	// 		updateTip: function(){
	// 			var self = this;

	// 			//tipSize is a size of tip diagonal
	// 			var containerOffsets = css.offsets(this.$container);
	// 			var targetOffsets = css.offsets(this);
	// 			var tipLimit = this.$tip.offsetWidth * .5,
	// 				tipSize = this.$tip.firstChild.offsetWidth * 1.414;

	// 			//place the tip according to the current tipAlign value
	// 			var tipOffset = Math.min(Math.max(
	// 				targetOffsets.left - containerOffsets.left + this.tipAlign * targetOffsets.width - tipLimit
	// 				, -tipLimit + tipSize * .5)
	// 				, containerOffsets.width - tipLimit + tipSize * .5);

	// 			css(this.$tip, {
	// 				left: tipOffset,
	// 				top: null
	// 			});
	// 		}
	// 	},
	// 	'left, right': {
	// 		updateTip: function(){
	// 			var self = this;

	// 			var containerOffsets = css.offsets(this.$container);
	// 			var targetOffsets = css.offsets(this);
	// 			var tipLimit = this.$tip.offsetHeight * .5,
	// 				tipSize = this.$tip.firstChild.offsetHeight * 1.414;

	// 			//subtract page offsets, if fixed
	// 			if (css.isFixed(this.$container)) {
	// 				targetOffsets.top -= window.pageYOffset;
	// 			}

	// 			//place the tip according to the current tipAlign value
	// 			var tipOffset = Math.min(Math.max(
	// 				targetOffsets.top - containerOffsets.top + this.tipAlign * targetOffsets.height - tipLimit
	// 				, -tipLimit + tipSize * .5)
	// 				, containerOffsets.height - tipLimit + tipSize * .5);

	// 			css(this.$tip, {
	// 				top: tipOffset,
	// 				left: null
	// 			});
	// 		}
	// 	},
	// 	changed: function(newValue, old){
	// 		//keep tip direction class updated
	// 		this.container.classList.remove(name + '-container-tip-' + old);
	// 		this.container.classList.add(name + '-container-tip-' + newValue);
	// 	},
	// 	_: {
	// 		before: function(){
	// 			//remove tip from the container
	// 			if (this.container.contains(this.$tip))
	// 				this.container.removeChild(this.$tip);

	// 			//remove tip class
	// 			this.container.classList.remove(name + '-container-tip');
	// 		}
	// 	}
	// },


	/** Side to align tip relative to the target but within the container
	 *
	 * @enum {string|number}
	 * @default .5
	 */
	tipAlign: 0.5,


	/** Instantly close other dropdowns when the one shows */
	single: false,


	/**
	 * Visibility state of popup.
	 *
	 * @enum {string}
	 * @default 'hidden'
	 * @abstract
	 */
	state: {
		init: 'hidden',

		/** Do open animation or whatever */
		opening: function(){
			var self = this;
			setTimeout(function(){
				self.state = 'visible';
			});
		},

		/** Visible state */
		visible: {},

		/** Hidden state */
		hidden: {},

		/** Make popup inactive */
		disabled: {
			'show, hide': 'noop',
			after: function(a,b){
				//passing enabled state causes unlock
				if (a === 'enabled') return 'hidden';
				return false;
			}
		},

		/** Keep class on the container according to the visibility */
		changed: function(newState, oldState){
			//FIXME: why container there might be undefined?
			//FIXME: why hidden→hidden change fires?
			// console.log('---', this.$container)
			if (!this.$container) {
				return;
			}

			//keep class updated
			this.$container.classList.add(name + '-' + newState);
			this.$container.classList.remove(name + '-' + oldState);
		}
	}
};


/**
 * Content selector ←→ poppy-instance
 * To share content between poppies
 */
var contentCache = {};


/* ----------------------------------- A P I ----------------------------------------- */


var proto = Poppy.prototype;


/**
 * Show the container
 * @chainable
 * @return {Target} Chaining
 */
proto.show = function(target){
	var self = this;

	//get real content evaled
	var contentEl = self.getContentElement(self.content);

	//append container to the holder
	self.holder.appendChild(self.container);

	//place
	self.place(target);

	//switch state
	self.state = 'opening';

	return self;
};


/**
 * Close the container
 * @chainable
 * @return {Target} Chaining
 */
proto.hide = function(){
	// console.log('hide');

	//remove container from the holder, if it is still there
	if (this.$container.parentNode === this.holder)
		this.holder.removeChild(this.$container);

	//remove content from the container
	if (this.content && this.content.parentNode === this.$container) {
		this.$container.removeChild(this.content);
	}

	//switch state
	this.state = 'hidden';

	return this;
};


/**
 * Automatically called after show.
 * Override this behaviour in instances, if needed.
 *
 * @abstract
 */
proto.place = function(){};


/** Correct the tip according to the tipAlign value.
 * Defined in tip state.
 * @abstract
 */
proto.placeTip = function(){};


/** Make inactive
 * @chainable
 */
proto.disable = function(){
	this.state = 'disabled';
	return this;
};


/** Make active
 * @chainable
 */
proto.enable = function(){
	this.state = 'enabled';
	return this;
};