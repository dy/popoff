//FIXME: include Mod as a dependency
var Mod = window.Mod || require('mod-constructor');
var type = require("mutypes");
var css = require("mucss");
var place = require("placer");

/** @module Poppy */
module.exports = Mod(Poppy);



/* -------------------- I N I T ------------------- */


/**
 * Poppy mod to extend.
 * Poppy is always a link/target to click to show the container.
 *
 * @constructor
 * @chainable
 * @augments {Element}
 */

function Poppy(){
	return this.constructor.apply(this, arguments);
}


/** Prefix for classes */
var name = Poppy.displayName = 'poppy';


var proto = Poppy.prototype;


/** Ensure target element at least a div */
proto['extends'] = 'div';


/** Before created */
proto.init = function(){
	// console.log('poppy init')
};


/** After created */
proto.created = function(){
	// console.log('poppy created')
};



/* -------------------- E L E M E N T S ---------------------- */


/**
 * Keeper of content.
 *
 * @type {Element}
 */

proto.$container = {
	init: function(){
		//create poppy container
		var $container = document.createElement('div');
		$container.classList.add(name + '-container');

		//set reference to poppy
		$container.poppy = this;

		//bind API
		$container.show = this.show.bind(this);
		$container.hide = this.hide.bind(this);

		return $container;
	}
};


/**
 * Small arrow aside the container.
 * Tip is a tip container indeed, but user shouldn’t care.
 *
 * @todo Think of placing tip via placer and placing to the holder
 *       The way container is placed.
 *       It would allow to get encapsulate tip placing logic.
 *       Or try to pass relativeTo attribute to the placer for the tip.
 *       So try to use placer for tips anyway.
 */

proto.$tip = {
	init: function(){
		//create tip container - overflow:hidden for the tip
		var $tipContainer = document.createElement('div');
		$tipContainer.classList.add(name + '-tip-container');

		//create tip - a white rectangle to rotate to look as a tip
		var $tip = document.createElement('div');
		$tip.classList.add(name + '-tip');
		$tipContainer.appendChild($tip);

		return $tipContainer;
	}
};



/* ---------------------- O P T I O N S ----------------------- */


/**
 * Class to append to {@link $container}
 */

proto.containerClass = {
	init: function(value){
		if (value) this.$container.classList.add(value);
	}
};


/**
 * Where to place popupped content-container
 *
 * @type {Element}
 */

proto.holder = {
	init: 'body',
	get: function(value){
		if (value === 'body') return document.body;
		else return value;
	},
	set: setElement
};


/**
 * Content to show in container.
 *
 * @type {(string|Node|selector)}
 */

proto.content = {
	init: function(value){
		//if specified - return it
		if (value) return value;

		//read for, if defined
		if (this['for']) {
			return this['for'];
		}

		//read href, if it is set
		if (this.href) {
			return this.href;
		}
	},

	//FIXME: scope it within contentType states
	//FIXME: simplify this (too unclear)
	set: function(value){
		var res;

		if (type.isString(value)){
			//try to get cached content
			if (contentCache[value]) return contentCache[value];

			//if pathname is current - shorten selector
			var linkElements = value.split('#');
			if (linkElements[0] === location.origin + location.pathname){
				var q = '#' + linkElements[1];
				//try to save queried element
				res = document.querySelector(q);
				if (res) {
					//save queried content
					contentCache[q] = res;
					return res;
				}

				//if not - save query string
				return q;
			}

			//try to query element
			try {
				res = document.querySelector(value);
				if (res) {
					//save queried content
					contentCache[value] = res;
					return res;
				}
			} catch (e) {
			}

			//if not - create element with content
			res = document.createElement('div');
			res.innerHTML = value;

			return res;
		}

		return value;
	},

	//FIXME: place it to the contentType scope
	//eval content each time it is going to be get
	get: function(v){
		var content;
		// console.log('get content', v)

		if (v instanceof HTMLElement){
			return v;
		}

		else if (typeof v === 'string'){
			try {
				content = document.querySelector(v);
				return content;
			} catch (e){

			}
		}

		//return absent target stub
		// content = document.createElement('div');
		// content.innerHTML = v;

		return content;
	},

	changed: function(content){
		//unhide content if it is hidden and if it is not in the container
		if (content instanceof HTMLElement) {
			if (content.parentNode && !content.parentNode.classList.contains(name + '-container')) {
				content.parentNode.removeChild(content);
			}

			content.removeAttribute('hidden');
		}
	}
};


/** Content selector ←→ poppy-instance */
var contentCache = {};


/** Need to be captured on init */
proto['for'] = undefined;


/**
 * Type of content to show
 *
 * @enum {string}
 * @default null
 *
 * null		Other element on the page
 * 'image'	An external image will be loaded
 * 'ajax'	Request an URL, insert as an HTML
 * 'iframe'	Insert an iframe with URL passed
 * 'swf'
 * 'text'	Insert content as a plain test
 */

proto.contentType = {
	//target selector
	_:{

	},
	//image href
	image: {

	},
	//remote href
	ajax: {

	},
	//iframe href
	iframe: {

	},
	swf: {

	},
	//inline content
	text: {

	}
};


/**
 * Side to align the container relative to the target
 * only meaningful range
 *
 */

proto.alignment = {
	init: 0,
	set: place.getAlign
};


/**
 * Whether to show tip or not
 *
 * @enum {boolean}
 * @default false
 */

proto.tip = {
	'top, left, bottom, right': {
		before: function(){
			//add tip class
			this.$container.classList.add(name + '-container-tip');

			//append tip to the container
			this.$container.appendChild(this.$tip);
		}
	},
	'top, bottom': {
		updateTip: function(){
			var self = this;

			//tipSize is a size of tip diagonal
			var containerOffsets = css.offsets(this.$container);
			var targetOffsets = css.offsets(this);
			var tipLimit = this.$tip.offsetWidth * .5,
				tipSize = this.$tip.firstChild.offsetWidth * 1.414;

			//place the tip according to the current tipAlign value
			var tipOffset = Math.min(Math.max(
				targetOffsets.left - containerOffsets.left + this.tipAlign * targetOffsets.width - tipLimit
				, -tipLimit + tipSize * .5)
				, containerOffsets.width - tipLimit + tipSize * .5);

			css(this.$tip, {
				left: tipOffset,
				top: null
			});
		}
	},
	'left, right': {
		updateTip: function(){
			var self = this;

			var containerOffsets = css.offsets(this.$container);
			var targetOffsets = css.offsets(this);
			var tipLimit = this.$tip.offsetHeight * .5,
				tipSize = this.$tip.firstChild.offsetHeight * 1.414;

			//subtract page offsets, if fixed
			if (css.isFixed(this.$container)) {
				targetOffsets.top -= window.pageYOffset;
			}

			//place the tip according to the current tipAlign value
			var tipOffset = Math.min(Math.max(
				targetOffsets.top - containerOffsets.top + this.tipAlign * targetOffsets.height - tipLimit
				, -tipLimit + tipSize * .5)
				, containerOffsets.height - tipLimit + tipSize * .5);

			css(this.$tip, {
				top: tipOffset,
				left: null
			});
		}
	},
	changed: function(newValue, old){
		//keep tip direction class updated
		this.$container.classList.remove(name + '-container-tip-' + old);
		this.$container.classList.add(name + '-container-tip-' + newValue);
	},
	_: {
		before: function(){
			//remove tip from the container
			if (this.$container.contains(this.$tip))
				this.$container.removeChild(this.$tip);

			//remove tip class
			this.$container.classList.remove(name + '-container-tip');
		}
	}
};


/**
 * Side to align tip relative to the target but within the container
 *
 * @enum {string|number}
 * @default .5
 */

proto.tipAlign = {
	init: 0.5,
	set: place.getAlign
};


/**
 * Instantly close other dropdowns when the one shows
 */

proto.single = false;



/* ------------------- A P I --------------------- */


/**
 * Visibility state of popup.
 *
 * @enum {string}
 * @default 'hidden'
 * @abstract
 */

proto.state = {
	init: 'hidden',

	/** Invisible state */
	_: undefined,

	/** Do open animation or whatever */
	opening: function(){
		var self = this;
		setTimeout(function(){
			self.state = 'visible';
		});
	},

	/** Visible state */
	visible: {
		/** Keep container updated on resize */
		'window resize': 'place, updateTip',
		'document scroll:throttle(50)': 'place, updateTip'
	},

	/** Keep class on the container according to the visibility */
	changed: function(newState, oldState){
		//keep class updated
		this.$container.classList.add(name + '-' + newState);
		this.$container.classList.remove(name + '-' + oldState);
	}
};


/**
 * Show the container.
 *
 * @return {Poppy} Chaining
 */

proto.show = function(e){
	var self = this;
	// console.log('show')

	//eval content to show
	if (self.content) {
		self.$container.appendChild(self.content);
	}

	//append container to the holder
	self.holder.appendChild(self.$container);

	//place
	self.place();
	self.updateTip();

	//switch state
	self.state = 'opening';

	return self;
};


/**
 * Close the container
 * @return {Poppy} Chaining
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


/**
 * Correct the tip according to the tipAlign value.
 * Defined in tip state.
 * @abstract
 */

proto.updateTip = function(){};



/* ------------ H E L P E R S ------------- */


/**
 * Element setter - parse an argument passed, return element
 *
 * @param {*} value New element
 * @param {*} oldValue Old element
 * @return {Element} Parsed element
 */

function setElement(value, oldValue){
	return value;
}