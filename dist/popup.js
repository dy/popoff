!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Popup=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
//FIXME: include Mod as a dependency
var Mod = window.Mod || require('mod-constructor');
var type = require("mutypes");
var css = require("mucss");
var place = require("placer");

/** @module Poppy */
module.exports = Mod(Poppy);



/* ---------------------------------- I N I T ---------------------------------------- */


/** Poppy mod to extend.
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



/* ----------------------------- E L E M E N T S ------------------------------------- */


/** Keeper of content.
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


/** Small arrow aside the container.
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



/* ------------------------------ O P T I O N S -------------------------------------- */


/** Class to append to {@link $container}
 */
proto.containerClass = {
	init: function(value){
		if (value) {
			value.split(/\s/).forEach(function(value){
				this.$container.classList.add(value);
			});
		}
	}
};


/** Where to place popupped content-container
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


/** Content to show in the container.
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

		return '';
	}
};


/** Content selector ←→ poppy-instance
 * To share content between poppies
 */
var contentCache = {};


/** Need to be captured on init */
proto['for'] = undefined;


/** Type of content to show
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
		content: {
			//eval content each time it is going to be get
			get: function(v){
				var content;

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

				return content;
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

			//remove the element from the DOM and prepare to be used as a poppy content
			changed: function(content){
				//unhide the content if it is hidden and if it is not in the container
				if (content instanceof HTMLElement) {
					if (content.parentNode && !content.parentNode.classList.contains(name + '-container')) {
						content.parentNode.removeChild(content);
					}

					content.removeAttribute('hidden');
				}
			}
		}
	},

	//image href
	image: {

	},

	//remote href
	ajax: {

	},

	//iframe href
	iframe: {
		content: {
			//any time content is changed, redirect an iframe to the url passed
			changed: function(url){
				if (type.isString(url)) {
					this.iframe.src = url;
				}
				else if (type.isElement(url)){
					this.iframe = url;
				}
			},

			get: function(){
				return this.iframe;
			}
		},

		//iframe to init
		iframe: {
			init: function(){
				var iframe = document.createElement('iframe');
				iframe.setAttribute('margin', '0');
				iframe.setAttribute('frameborder', '0');
				iframe.setAttribute('scrolling', 'no');

				//iframe hook to set up attributes, e.g. w/h
				this.emit('initIframe', {iframe: iframe});
				return iframe;
			}
		}
	},
	swf: {

	},
	//inline content
	text: {

	}
};


/** Side to align the container relative to the target
 * only meaningful range
 */
proto.alignment = {
	init: 0,
	set: place.getAlign
};


/** Whether to show tip or not
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


/** Side to align tip relative to the target but within the container
 *
 * @enum {string|number}
 * @default .5
 */
proto.tipAlign = {
	init: 0.5,
	set: place.getAlign
};


/** Instantly close other dropdowns when the one shows */
proto.single = false;



/* ---------------------------------- A P I ------------------------------------------ */


/** Visibility state of popup.
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
		'window resize:throttle(50)': 'place, updateTip',
		'document scroll:throttle(50)': 'place, updateTip'
	},

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
};


/** Show the container.
 * @chainable
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


/** Close the container
 * @chainable
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


/** Automatically called after show.
 * Override this behaviour in instances, if needed.
 *
 * @abstract
 */
proto.place = function(){};


/** Correct the tip according to the tipAlign value.
 * Defined in tip state.
 * @abstract
 */
proto.updateTip = function(){};


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


/* -------------------------------- H E L P E R S ------------------------------------ */


/** Element setter - parse an argument passed, return element
 *
 * @param {*} value New element
 * @param {*} oldValue Old element
 * @return {Element} Parsed element
 */
function setElement(value, oldValue){
	return value;
}
},{"mod-constructor":"mod-constructor","mucss":3,"mutypes":4,"placer":5}],2:[function(require,module,exports){
var hasOwn = Object.prototype.hasOwnProperty;
var toString = Object.prototype.toString;
var undefined;

var isPlainObject = function isPlainObject(obj) {
	"use strict";
	if (!obj || toString.call(obj) !== '[object Object]' || obj.nodeType || obj.setInterval) {
		return false;
	}

	var has_own_constructor = hasOwn.call(obj, 'constructor');
	var has_is_property_of_method = obj.constructor && obj.constructor.prototype && hasOwn.call(obj.constructor.prototype, 'isPrototypeOf');
	// Not own constructor property must be Object
	if (obj.constructor && !has_own_constructor && !has_is_property_of_method) {
		return false;
	}

	// Own properties are enumerated firstly, so to speed up,
	// if last one is own, then all properties are own.
	var key;
	for (key in obj) {}

	return key === undefined || hasOwn.call(obj, key);
};

module.exports = function extend() {
	"use strict";
	var options, name, src, copy, copyIsArray, clone,
		target = arguments[0],
		i = 1,
		length = arguments.length,
		deep = false;

	// Handle a deep copy situation
	if (typeof target === "boolean") {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	} else if (typeof target !== "object" && typeof target !== "function" || target == undefined) {
			target = {};
	}

	for (; i < length; ++i) {
		// Only deal with non-null/undefined values
		if ((options = arguments[i]) != null) {
			// Extend the base object
			for (name in options) {
				src = target[name];
				copy = options[name];

				// Prevent never-ending loop
				if (target === copy) {
					continue;
				}

				// Recurse if we're merging plain objects or arrays
				if (deep && copy && (isPlainObject(copy) || (copyIsArray = Array.isArray(copy)))) {
					if (copyIsArray) {
						copyIsArray = false;
						clone = src && Array.isArray(src) ? src : [];
					} else {
						clone = src && isPlainObject(src) ? src : {};
					}

					// Never move original objects, clone them
					target[name] = extend(deep, clone, copy);

				// Don't bring in undefined values
				} else if (copy !== undefined) {
					target[name] = copy;
				}
			}
		}
	}

	// Return the modified object
	return target;
};


},{}],3:[function(require,module,exports){
module.exports = css;


var win = window, doc = document, root = doc.documentElement, body = doc.body;


/** Get clean style. */
var fakeStyle = doc.createElement('div').style;


/** Detect vendor prefix. */
var prefix = css.prefix = (function() {
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

css.disableSelection = function($el){
	css($el, {
		'user-select': 'none',
		'user-drag': 'none',
		'touch-callout': 'none'
	});
	$el.setAttribute('unselectable', 'on');
	$el.addEventListener('selectstart', pd);
};
css.enableSelection = function($el){
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

css.paddings = function($el){
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

css.margins = function($el){
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
	return parseFloat(str.slice(0,-2)) || 0;
}
css.parseValue = parseValue;


/**
 * Return absolute offsets of any target passed
 *
 * @todo   calc relativeTo
 *
 * @param    {Element}   el   A target.
 * @return   {Object}   Offsets object with trbl, fromBottom, fromLeft.
 */

css.offsets = function(el, relativeTo){
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
	var isFixed = css.isFixed(el);
	var xOffset = isFixed ? 0 : win.pageXOffset;
	var yOffset = isFixed ? 0 : win.pageYOffset;

	return {
		top: cRect.top + yOffset,
		left: cRect.left + xOffset,
		width: el.offsetWidth,
		height: el.offsetHeight,
		bottom: cRect.top + yOffset + el.offsetHeight,
		right: cRect.left + xOffset + el.offsetWidth
	};
};


/**
 * Detect whether element is placed to fixed container or fixed itself.
 *
 * @param {(Element|Object)} el Element to detect fixedness.
 *
 * @return {boolean} Whether element is nested.
 */

css.isFixed = function (el) {
	var parentEl = el;

	//window is fixed, btw
	if (el === win) return true;

	//unlike the doc
	if (el === doc) return false;

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


/**
 * Calc sb width
 *
 * @return {number} in pixels
 */

// Create the measurement node
var scrollDiv = doc.createElement("div");
css(scrollDiv,{
	width: 100,
	height: 100,
	overflow: 'scroll',
	position: 'absolute',
	top: -9999,
});
root.appendChild(scrollDiv);

// Get the scrollbar width
css.scrollbar = scrollDiv.offsetWidth - scrollDiv.clientWidth;

// Delete the DIV
root.removeChild(scrollDiv);
},{}],4:[function(require,module,exports){
/**
* Trivial types checkers.
* Because there’re no common lib for that ( lodash_ is a fatguy)
*/
//TODO: make main use as `is.array(target)`

var _ = module.exports = {
	//speedy impl,ementation of `in`
	//NOTE: `!target[propName]` 2-3 orders faster than `!(propName in target)`
	has: function(a, b){
		if (!a) return false;
		//NOTE: this causes getter fire
		if (a[b]) return true;
		return b in a;
		// return a.hasOwnProperty(b);
	},

	//isPlainObject
	isObject: function(a){
		var Ctor, result;

		if (_.isPlain(a) || _.isArray(a) || _.isElement(a) || _.isFn(a)) return false;

		// avoid non `Object` objects, `arguments` objects, and DOM elements
		if (
			//FIXME: this condition causes weird behaviour if a includes specific valueOf or toSting
			// !(a && ('' + a) === '[object Object]') ||
			(!_.has(a, 'constructor') && (Ctor = a.constructor, isFn(Ctor) && !(Ctor instanceof Ctor))) ||
			!(typeof a === 'object')
			) {
			return false;
		}
		// In most environments an object's own properties are iterated before
		// its inherited properties. If the last iterated property is an object's
		// own property then there are no inherited enumerable properties.
		for(var key in a) {
			result = key;
		};

		return typeof result == 'undefined' || _.has(a, result);
	},

	isFn: function(a){
		return !!(a && a.apply);
	},

	isString: function(a){
		return typeof a === 'string'
	},

	isNumber: function(a){
		return typeof a === 'number'
	},

	isBool: function(a){
		return typeof a === 'boolean'
	},

	isPlain: function(a){
		return !a || _.isString(a) || _.isNumber(a) || _.isBool(a);
	},

	isArray: function(a){
		return a instanceof Array;
	},

	isElement: function(target){
		if (typeof document === 'undefined') return;
		return target instanceof HTMLElement
	},

	isPrivateName: function(n){
		return n[0] === '_' && n.length > 1
	}
}
},{}],5:[function(require,module,exports){
/**
* @module  placer
*
* Places any element relative to any other element the way you define
*/
module.exports = place;


var type = require('mutypes');
var css = require('mucss');


//shortcuts
var win = window, doc = document, root = doc.documentElement, body = doc.body;


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

	//set of sides to ignore positioning, {top:true, ...}
	ignore: {},

	/**
	 * Side to align: trbl/0..1/center
	 *
	 * @default  0
	 * @type {(number|string)}
	 */
	align: 0,

	//selector/nodelist/node/[x,y]/window/function(el)
	avoid: undefined,

	//selector/nodelist/node/[x,y]/window/function(el)
	within: undefined,

	//TODO: whether to calc placement
	fluidly: false
};


/**
 * Place element relative to the target by the side & params passed.
 *
 * @main
 *
 * @param {Element} element An element to place
 * @param {object} options Options object
 *
 * @return {boolean} The result of placement - whether placing succeeded
 */

function place(element, options){
	options = softExtend(options, defaults);

	//recalc align
	options.align = getAlign(options.align);

	//calc containers
	var withinRect = getRect(options.within);
	var relativeToRect = getRect(options.relativeTo);
	var elementRect = getRect(element);


	//set the position as of the target
	if (type.isElement(options.relativeTo) && css.isFixed(options.relativeTo)) {
		element.style.position = 'fixed';
	}
	else {
		element.style.position = 'absolute';
		//get proper win offsets
		if (options.within === win) {
			withinRect.top += win.pageYOffset;
			withinRect.bottom += win.pageYOffset;
			withinRect.left += win.pageXOffset;
			withinRect.right += win.pageXOffset;
		}
	}


	//check whether there’s enough place (avoid placing redirection loop)
	// var margins = css.margins(element);
	// var requiredWidth = elementRect.width + relativeToRect.width + (margins.left + margins.right) * 1.1;
	// var requiredHeight = elementRect.height + relativeToRect.height + (margins.top + margins.bottom) * 1.1;


	// //if not - place centered
	// if (requiredWidth > withinRect.width && requiredHeight > withinRect.height)
	// 	placeBySide.center(element, relativeToRect, withinRect, options);


	//else place according to the position
	placeBySide[options.side](element, relativeToRect, withinRect, options);


	return element;
}


/**
 * Set of position placers
 * @enum {Function}
 * @param {Element} placee Element to place
 * @param {object} target Offsets rectangle (absolute position)
 * @param {object} ignore Sides to avoid entering (usually, already tried)
 */

var placeBySide = {
	center: function(placee, target, within, opts){
		// console.log('place center');

		var center = [(target.left + target.right) *.5, (target.bottom + target.top) *.5];
		var width = placee.offsetWidth;
		var height = placee.offsetHeight;

		css(placee, {
			top: (center[1] - height*.5),
			left: (center[0] - width*.5)
		});

		//upd options
		opts.side = 'center';
	},

	left: function(placee, target, within, opts){
		// console.log('place left')

		var width = placee.offsetWidth;
		var height = placee.offsetHeight;

		//check if there is enough place for placing from the left
		// if (width > Math.abs(within.left - target.left)) {
		// 	opts.ignore.left = true;

		// 	//if not - compare left/bottom displacement and place whether vertically or inverse
		// 	if (Math.abs(target.top - within.top) > Math.abs(within.left - target.left) && !opts.ignore.right){
		// 		return placeBySide.right.apply(this, arguments);
		// 	} else {
		// 		return placeBySide.bottom.apply(this, arguments);
		// 	}
		// }


		//get reliable parent width
		var parent = placee.offsetParent;
		var parentWidth = parent && parent.offsetWidth || 0;
		if (parent === body || parent === root && win.getComputedStyle(parent).position === 'static') parentWidth = win.innerWidth;

		//place left
		css(placee, {
			right: parentWidth - target.left - 18,
			left: 'auto'
		});

		//place vertically properly
		placeVertically.apply(this, arguments);

		//upd options
		opts.side = 'left';
	},

	right: function(placee, target, within, opts){
		// console.log('place right')

		var width = placee.offsetWidth;
		var height = placee.offsetHeight;

		//check if there is enough place for placing bottom
		// if (width > Math.abs(within.right - target.right)) {
		// 	opts.ignore.right = true;

		// 	//if not - compare top/right displacement and place whether aside or inverse
		// 	if (Math.abs(target.top - within.top) > Math.abs(within.right - target.right) && !opts.ignore.left){
		// 		return placeBySide.left.apply(this, arguments);
		// 	} else {
		// 		return placeBySide.bottom.apply(this, arguments);
		// 	}
		// }

		//place right
		css(placee, {
			left: target.right,
			right: 'auto',
		});

		//place vertically properly
		placeVertically.apply(this, arguments);

		//upd options
		opts.side = 'right';
	},

	top: function(placee, target, within, opts){
		// console.log('place top');

		var width = placee.offsetWidth;
		var height = placee.offsetHeight;

		//check if there is enough place for placing top
		// if (height > Math.abs(within.top - target.top)) {
		// 	opts.ignore.top = true;

		// 	//if not - compare left/top displacement and place whether aside or inverse
		// 	if (Math.abs(target.left - within.left) > Math.abs(within.top - target.top) && !opts.ignore.bottom){
		// 		return placeBySide.bottom.apply(this, arguments);
		// 	} else {
		// 		return placeBySide.left.apply(this, arguments);
		// 	}
		// }

		//place horizontally properly
		placeHorizontally.apply(this, arguments);

		//place top
		var parent = placee.offsetParent;
		var parentHeight = parent && parent.offsetHeight || 0;

		//get reliable parent height
		//body & html with position:static tend to consider bottom:0 as a viewport bottom
		//so take the parentHeight for the vp height

		if ((parent === body || parent === root) && win.getComputedStyle(parent).position === 'static') parentHeight = win.innerHeight;
		css(placee, {
			bottom: parentHeight - target.top,
			top: 'auto'
		});

		//upd options
		opts.side = 'top';
	},

	bottom: function(placee, target, within, opts){
		// console.log('place bottom');

		var height = placee.offsetHeight;
		var width = placee.offsetWidth;
		var margins = css.margins(placee);

		//check if there is enough place for placing bottom
		// if (height + margins.top + margins.bottom > Math.abs(within.bottom - target.bottom)) {
		// 	opts.ignore.bottom = true;

		// 	//if not - compare left/bottom displacement and place whether aside or inverse
		// 	if (Math.abs(target.left - within.left) > Math.abs(within.bottom - target.bottom) && !opts.ignore.top){
		// 		return placeBySide.top.apply(this, arguments);
		// 	} else {
		// 		return placeBySide.left.apply(this, arguments);
		// 	}
		// }

		//calc body margin collapsing offset
		var parent = placee.offsetParent;
		var bodyOffsetY = 0;
		if ((parent === body || parent === root) && win.getComputedStyle(parent).position !== 'static') bodyOffsetY = css.offsets(parent).top;

		//place bottom
		css(placee, {
			top: target.bottom - bodyOffsetY,
			bottom: 'auto',
		});

		//place horizontally properly
		placeHorizontally.apply(this, arguments);

		//upd options
		opts.side = 'bottom';
	}
};


/**
 * Horizontal placer for the top and bottom sides
 */

function placeHorizontally(placee, target, within, opts){
	var width = placee.offsetWidth;
	var margins = css.margins(placee);

	var desirableLeft = target.left + target.width*opts.align - width*opts.align;

	if (within && width + desirableLeft < within.right) {
		css(placee, {
			left: Math.max(desirableLeft, within.left),
			right: 'auto'
		});
		return;
	}

	//if too close to the within right - set right = 0
	css(placee, {
		right: 0,
		left: 'auto'
	});
}


/**
 * Vertical placer for the left and right sides
 */

function placeVertically ( placee, target, within, opts ) {
	var height = placee.offsetHeight;
	var margins = css.margins(placee);
	var desirableTop = target.top + target.height*opts.align - height*opts.align;

	//if too close to the `within.right` - set right = 0
	if (height + desirableTop > within.bottom) {
		css(placee, {
			bottom: 0,
			top: 'auto'
		});
	}
	else {
		css(placee, {
			top: Math.max(desirableTop, within.top),
			bottom: 'auto'
		});
	}
}


/**
 * Return offsets rectangle of an element/array/any target passed.
 * I. e. normalize offsets rect
 *
 * @param {*} el Element, selector, window, document, rect, array
 *
 * @return {object} Offsets rectangle
 */

function getRect(target){
	var rect = target;

	if (target === win) {
		rect = {
			top: 0,
			left: 0,
			right: body.offsetWidth,
			bottom: win.innerHeight,
		};
		rect.width = rect.right - rect.left;
		rect.height = rect.bottom - rect.top;
	}
	else if (type.isElement(target)) {
		rect = css.offsets(target);
	}
	else if (type.isString(target)) {
		var targetEl = doc.querySelector(target);
		if (!targetEl) throw Error('No element queried by `' + target + '`');

		rect = css.offsets(targetEl);
	}
	else if (type.isArray(target)){
		//[left, top]
		if (target.length === 2){
			return {
				top: target[1],
				left: target[0],
				bottom: target[1],
				right: target[0],
				width: 0,
				height: 0
			};
		}
		//[left,top,right,bottom]
		else if (target.length === 4){
			return {
				left: target[0],
				top: target[1],
				right: target[2],
				bottom: target[3],
				width: target[2] - target[0],
				height: target[3] - target[1]
			};
		}
	}
	else if (type.isObject(target)){
		if (target.width === undefined) target.width = target.right - target.left;
		if (target.height === undefined) target.height = target.bottom - target.top;
	}

	return rect;
}


/**
 * Alignment setter
 *
 * @param {string|number} value Convert any value passed to float 0..1
 */

function getAlign(value){
	if (!value) return 0;

	if (type.isString(value)) {
		switch (value) {
			case 'left':
			case 'top':
				return 0;
			case 'right':
			case 'bottom':
				return 1;
		}
	}
	var num = parseFloat(value);

	return num !== undefined ? num : 0.5;
}


/**
 * Soft extender (appends lacking props)
 */

function softExtend(a,b){
	//ensure object
	if (!a) a = {};

	for (var i in b){
		if (a[i] === undefined) a[i] = b[i];
	}

	return a;
}

},{"mucss":3,"mutypes":4}],6:[function(require,module,exports){
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
		'click': 'preventDefault, show'
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
	return Poppy.fn.show.call(this);
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

	return this;
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

},{"../index":1,"extend":2,"mod-constructor":"mod-constructor","mucss":3,"placer":5}]},{},[6])(6)
});