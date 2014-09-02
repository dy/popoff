!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var o;"undefined"!=typeof window?o=window:"undefined"!=typeof global?o=global:"undefined"!=typeof self&&(o=self),o.Popover=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
//FIXME: include Mod as a dependency
var Mod = window.Mod || require('mod-constructor');


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



/* --------------------- E V E N T S ------------------------- */


/**
 * Visibility state of popup.
 *
 * @enum {string}
 * @default 'hidden'
 * @abstract
 */

proto.state = {
	_: undefined,
	visible: {
		/** Keep container updated on resize */
		'window resize': 'place'
	},

	/** Keep class on the container according to the visibility */
	changed: function(newState, oldState){
		//keep class updated
		this.$container.classList.add(name + '-' + newState);
		this.$container.classList.remove(name + '-' + oldState);
	}
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
		$container.show = this.show;
		$container.hide = this.hide;

		return $container;
	}
};


/**
 * Small arrow aside the container.
 * Tip is a tip container indeed, but user shouldn’t care.
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

		if (typeof value === 'string'){
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
		//unhide content if it is hidden and if it is not in the popupper
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

proto.align = {
	set: setSide
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
	set: setSide
};


/**
 * Instantly close other dropdowns when the one shows
 */

proto.single = false;



/* ------------------- A P I --------------------- */


/**
 * Show the container.
 *
 * @return {Poppy} Chaining
 */

proto.show = function(){
	var self = this;

	//set timeout in order to pass over current bubbling event
	setTimeout(function(){
		//eval content to show
		if (self.content) {
			self.$container.appendChild(self.content);
		}
		//append container to the holder
		self.holder.appendChild(self.$container);

		//place
		self.place();

		//switch state
		self.state = 'visible';
	});

	return self;
};


/**
 * Close the container
 * @return {Poppy} Chaining
 */

proto.hide = function(){
	// console.log('hide')

	//remove container from the holder, if it is still there
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
 * Implement this behaviour in instances - place container accordingly to the element.
 *
 * @abstract
 */

proto.place = function(){};



/* ------------ H E L P E R S ------------- */


/**
 * Alignment setter
 *
 * @param {string|number} value Convert any value passed to float 0..1
 */

function setSide(value){
	if (typeof value === 'string') {
		switch (value) {
			case 'left':
			case 'top':
				return 0;
			case 'right':
			case 'bottom':
				return 1;
			default:
				return 0.5;
		}
	}

	return value;
}


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
},{"mod-constructor":"mod-constructor"}],2:[function(require,module,exports){
/**
* @module  placer
*
* Places any element relative to any other element the way you define
*/
module.exports = place;

var css = require('mucss');

var win = window;

/**
 * Default options
 */

var defaults = {
	//source to align relatively to
	//element/{x,y}/[x,y]/
	relativeTo: window,

	//which side to palce element
	//t/r/b/l, 'center' ( === undefined),
	side: 'center',

	//intensity of alignment
	//left, center, right, top, bottom, 0..1
	align: 0.5,

	//selector/nodelist/node/[x,y]/window/function(el)
	avoid: undefined,

	//selector/nodelist/node/[x,y]/window/function(el)
	within: window
};


/**
 * Set of position placers
 * @enum {Function}
 */

var placeBySide = {
	center: function(placee, rect){
		var center = [(rect[2] + rect[0]) / 2, (rect[3] + rect[1]) / 2];
		var width = placee.offsetWidth;
		var height = placee.offsetHeight;
		css(placee, {
			top: (center[1] - height/2),
			left: (center[0] - width/2)
		});
	},

	left: function(el, rect){

	},

	right: function(el, rect){

	},

	top: function(el, rect){

	},

	bottom: function(placee, rect){
		var width = placee.offsetWidth;
		var height = placee.offsetHeight;

		css(placee, {
			left: rect[0],
			top: rect[3]
		});
	}
};


/**
 * Place element relative to the target by the side & params passed.
 *
 * @param {Element} element An element to place
 * @param {object} options Options object
 *
 * @return {boolean} The result of placement - whether placing succeeded
 */

function place(element, options){
	options = options || {};

	//get target rect to align
	var target = options.relativeTo || defaults.relativeTo;
	var targetRect;

	if (target === win) {
		targetRect = [0, 0, win.innerWidth, win.innerHeight];

		//fix the position
		element.style.position = 'fixed';
	}
	else if (target instanceof Element) {
		var rect = css.offsets(target);
		targetRect = [rect.left, rect.top, rect.right, rect.bottom];

	}
	else if (typeof target === 'string'){
		var targetEl = document.querySelector(target);
		if (!targetEl) return false;
		// var rect;
		//TODO
	}

	//set the position as of the target
	if (css.isFixed(target)) element.style.position = 'fixed';
	else element.style.position = 'absolute';

	//align according to the position
	var side = options.side || defaults.side;

	placeBySide[side](element, targetRect);

	return element;
}
},{"mucss":3}],3:[function(require,module,exports){
module['exports'] = css;


var win = window;


/** Get clean style. */
var fakeStyle = document.createElement('div').style;


/** Detect vendor prefix. */
var prefix = css['prefix'] = (function() {
	var regex = /^(webkit|moz|ms|O|khtml)[A-Z]/, prop;
	for (prop in fakeStyle) {
		if (regex.test(prop)) {
			return prop.match(regex)[1];
		}
	}
	return '';
}());


/** Prevent you know what. */
function pd(e){
	e.preventDefault();
}


/**
 * Disable or Enable any selection possibilities for an element.
 *
 * @param    {Element}   $el   Target to make unselectable.
 */

css['disableSelection'] = function($el){
	css($el, {
		'user-select': 'none',
		'user-drag': 'none',
		'touch-callout': 'none'
	});
	$el.setAttribute('unselectable', 'on');
	$el.addEventListener('selectstart', pd);
};
css['enableSelection'] = function($el){
	css($el, {
		'user-select': null,
		'user-drag': null,
		'touch-callout': null
	});
	$el.removeAttribute('unselectable');
	$el.removeEventListener('selectstart', pd);
};


/**
 * Return paddings of an element.
 *
 * @param    {Element}   $el   An element to calc paddings.
 * @return   {Object}   Paddings object `{top:n, bottom:n, left:n, right:n}`.
 */

css['paddings'] = function($el){
	var style = win.getComputedStyle($el);

	return {
		top: parseValue(style.paddingTop),
		left: parseValue(style.paddingLeft),
		bottom: parseValue(style.paddingBottom),
		right: parseValue(style.paddingRight)
	};
};


/**
 * Return margins of an element.
 *
 * @param    {Element}   $el   An element which to calc margins.
 * @return   {Object}   Paddings object `{top:n, bottom:n, left:n, right:n}`.
 */

css['margins'] = function($el){
	var style = win.getComputedStyle($el);

	return {
		top: parseValue(style.marginTop),
		left: parseValue(style.marginLeft),
		bottom: parseValue(style.marginBottom),
		right: parseValue(style.marginRight)
	};
};


/** Returns parsed css value. */
function parseValue(str){
	str += '';
	return ~~str.slice(0,-2);
}
css['parseValue'] = parseValue;


/**
 * Return absolute offsets of any target passed
 *
 * @param    {Element}   el   A target.
 * @return   {Object}   Offsets object with trbl, fromRight, fromLeft.
 */

css['offsets'] = function(el){
	if (!el) return false;

	//calc client rect
	var cRect;

	try {
		cRect = el.getBoundingClientRect();
	} catch (e) {
		cRect = {
			top: el.clientTop,
			left: el.clientLeft
		};
	}

	//whether element is or is in fixed
	var isFixed = css['isFixed'](el);
	var xOffset = isFixed ? 0 : win.pageXOffset;
	var yOffset = isFixed ? 0 : win.pageYOffset;

	return {
		top: cRect.top + yOffset,
		left: cRect.left + xOffset,
		width: el.offsetWidth,
		height: el.offsetHeight,
		bottom: cRect.top + yOffset + el.offsetHeight,
		right: cRect.left + xOffset + el.offsetWidth,
		fromRight: win.innerWidth - cRect.left - el.offsetWidth,
		fromBottom: (win.innerHeight + yOffset - cRect.top - el.offsetHeight)
	};
};


/**
 * Detect whether element is placed to fixed container or fixed itself.
 *
 * @param {(Element|Object)} el Element to detect fixedness.
 *
 * @return {boolean} Whether element is nested.
 */

css['isFixed'] = function (el) {
	var parentEl = el;

	//window is fixed, btw
	if (el === win) return true;

	//unlike the document
	if (el === document) return false;

	while (parentEl) {
		if (win.getComputedStyle(parentEl).position === 'fixed') return true;
		parentEl = parentEl.offsetParent;
	}
	return false;
};


/**
 * Apply styles to an element. This is the module exports.
 *
 * @param    {Element}   el   An element to apply styles.
 * @param    {Object|string}   obj   Set of style rules or string to get style rule.
 */

function css(el, obj){
	if (!el || !obj) return;

	var name, value;

	//return value, if string passed
	if (typeof obj === 'string') {
		name = obj;

		//return value, if no value passed
		if (arguments.length < 3) {
			return el.style[prefixize(name)];
		}

		//set style, if value passed
		value = arguments[2] || '';
		obj = {};
		obj[name] = value;
	}


	for (name in obj){
		//convert numbers to px
		if (typeof obj[name] === 'number') obj[name] += 'px';

		value = obj[name] || '';

		el.style[prefixize(name)] = value;
	}
}


/**
 * Return prefixized prop name, if needed.
 *
 * @param    {string}   name   A property name.
 * @return   {string}   Prefixed property name.
 */

function prefixize(name){
	var uName = name[0].toUpperCase() + name.slice(1);
	if (fakeStyle[name] !== undefined) return name;
	if (fakeStyle[prefix + uName] !== undefined) return prefix + uName;
	return '';
}
},{}],4:[function(require,module,exports){
var Poppy = require('../index');
var Mod = window.Mod || require('mod-constructor');
var place = require('placer');

module.exports = Poppy.extend(Popover);


var name = Poppy.displayName;

//FIXME: replace Poppy.fn with Poppy.prototype
//FIXME: extension doesn't clone the object: use Object.create(Poppy);
function Popover(){
	return this.constructor.apply(this, arguments);
}
var proto = Popover.prototype;

/**
* Lifecycle
*/
proto.init = function(){
	// console.log('init popover')
};
proto.created = function(){
	// console.log('popover created')
};


//add proper class to the container
proto.$container.changed = function($container){
	$container.classList.add(name + '-popover');
};


/**
* Behaviour
*/
//hidden
proto.state._ = {
	//FIXME: get rid of defer
	'click:defer': function (e) {
		this.show();
	}
};
proto.state.visible = {
	//FIXME: replace with :not modifier
	'document click': function(e){
		if (e.target !== this.$container && !this.$container.contains(e.target)) this.hide();
	},

	//if mouse moved too far - close also
	'document mousemove': function(e){
		var rect = this.getBoundingClientRect();
		var centerX = (rect.left + rect.right) / 2;
		var centerY = (rect.top + rect.bottom) / 2;
		var xDiff = e.clientX - centerX, yDiff = e.clientY - centerY;
		var dist = Math.sqrt(xDiff*xDiff + yDiff*yDiff);
		if (dist > this.visibleDistance) this.hide();

	}
};
//distance from the place of initial click to hide the popover
proto.visibleDistance = {
	init: function(){
		return window.innerWidth * 0.4;
	}
};


/**
 * Popover is always placed over the element
 *
 * @return {[type]} [description]
 */

proto.place = function(){
	//place properly (align by center)
	place(this.$container, {
		relativeTo: this,
		align: 'center'
	});
};


/**
 * Autoinit instances.
 *
 * @see Use [selector-observer]{@link https://www.npmjs.org/package/selector-observer}
 *      if you want to init items dynamically. *
 */

var items = document.querySelectorAll('[data-popover]');
for(var i = items.length; i--;){
	new Popover(items[i]);
}

},{"../index":1,"mod-constructor":"mod-constructor","placer":2}]},{},[4])(4)
});