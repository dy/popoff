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


	//create tip element
	this.tipEl = document.createElement('div');
	this.tipEl.className = 'poppy-tip';

	//create content element
	this.contentEl;

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


	/** Align container left by default */
	align: 'left',


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
		init: false,
		//by default - hide link
		_: function(){
			this.container.classList.remove('poppy-container-tip');
		},
		'true': function(){
			this.container.classList.add('poppy-container-tip');
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
	content: {
		init: ''
	},


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
		init: null,

		//some external element/selector
		_:{
			content: {
				changed: function(val){
					var el = q(val);
					el.removeAttribute('hidden');

					this.contentEl = el;
				}
			}
		},

		//innerHTML
		html: {
			content: {
				changed: function(val){
					var el;
					//ensure content holder exists
					if (!this.contentEl) {
						el = this.contentEl = document.createElement('div');
						this.container.appendChild(el);
					}
					else {
						el = this.contentEl;
					}
					el.innerHTML = val;
					return el;
				}
			}
		}
	},


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

	//append content element to the container
	if (this.contentEl.parentNode !== this.container)
		this.container.appendChild(this.contentEl);

	//append container to the holder
	self.holder.appendChild(self.container);

	//append tip, if needed
	if (this.tip && !this.tipEl.parentNode) self.holder.appendChild(this.tipEl)

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
	if (this.container.parentNode)
		this.holder.removeChild(this.container);

	//remove tip
	if (this.tipEl.parentNode)
		this.holder.removeChild(this.tipEl);

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