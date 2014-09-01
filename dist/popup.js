!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Popup=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Poppy is always a link/target to click to show the container
 */

//FIXME: include Mod as a dependency
var Mod = window.Mod || require('mod-constructor');

module.exports = Mod(Poppy);


//prefix for classes
var name = 'poppy';


/**
 * ------------- Constructor
 */

function Poppy(){
	return this.constructor.apply(this, arguments);
}

Poppy.displayName = name;

var proto = Poppy.prototype;

proto['extends'] = 'div';




/**
 * -------------- Lifecycle & events
 */

proto.init = function(){
	// console.log('poppy init')
}

proto.created = function(){
	// console.log('poppy created')
}





/**
 * --------------- Elements
 */

//keeper of content
proto.$container = {
	init: function(){
		//create poppy container
		var $container = document.createElement('div');
		$container.classList.add(name + '-container');

		return $container;
	}
};




/**
 * ------------------ Options
 */
//just state of popup
proto.state = {
	_: undefined,
	visible: undefined,
	changed: function(newState, oldState){
		//keep class updated
		this.classList.add(name + '-' + newState);
		this.classList.remove(name + '-' + oldState);
	}
};

//Where to place popupped content-container
proto.holder = {
	init: 'body',
	get: function(value){
		if (value === 'body') return document.body;
		else return value;
	},
	set: setElement
};


/**
 * Set ptoperties need to be observed
 */

proto['for'] = undefined;


/**
 * Content selector ←→ poppy-instance
 */

var contentCache = {};


/**
 * Content to show in container.
 *
 * @type {(string|Node|selector)} init
 *
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
		//unhide content if it is hidden
		if (content instanceof HTMLElement) {
			if (content.parentNode) content.parentNode.removeChild(content);
			content.removeAttribute('hidden');
		}
	}
};


/**
 * Type of content to show
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


/* Replace with external modules
//the side to align the container relative to the target - only meaningful range
proto.align = {
	set: setSide
}

//whether to show tip
proto.tip = {
	true: {
		before: function(){
			//append tip to the container
			this.$container.appendChild(this.$tip);
		}
	},
	_: {
		before: function(){
			//remove tip from the container
			if (this.$container.contains(this.$tip))
				this.$container.removeChild(this.$tip);
		}
	}
}

//the side to align tip relative to the target but within the container
proto.tipAlign = {
	set: setSide
}
*/


//instantly close other dropdowns when the one shows
proto.single = false;



/**
 * -------------------------- API
 */


/**
 * Show the container
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
 * Implement this behaviour in instances
 * Place container properly.
 */

proto.place = function(){};



/**
 * ---------------------- Helpers
 */

//alignment setter
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

//element setter
function setElement(value, oldValue){
	return value;
}
},{"mod-constructor":"mod-constructor"}],2:[function(require,module,exports){
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
 * Return absolute offsets.
 *
 * @param    {Element}   el   A target.
 * @return   {Object}   Offsets object with trbl, fromRight, fromLeft.
 */

css['offsets'] = function(el){
	if (!el) return {};

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

	//return value, if string passed
	if (typeof obj === 'string') {
		return el.style[prefixize(obj)];
	}

	for (var name in obj){
		//convert numbers to px
		if (typeof obj[name] === 'number') obj[name] += 'px';

		if (obj[name]) {
			el.style[prefixize(name)] = obj[name];
		} else {
			el.style[prefixize(name)] = '';
		}
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
	if (fakeStyle[prefix + uName] !== undefined) return prefix + uName;
	return name;
}
},{}],4:[function(require,module,exports){
/**
* Placer
* Places any element relative to any other element the way you define
*/

module.exports = place;

var css = require('mucss');

var win = window;

//default options
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

//set of position placers
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
 * @return {Element} Placed element to chain calls
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

		//set the position as of the target
		if (css.isFixed(target)) element.style.position = 'fixed';
		else element.style.position = 'absolute';
	}
	else if (typeof target === 'string'){
		var targetEl = document.querySelector(target);
		if (!targetEl) return false;
		// var rect;
		//TODO
	}

	//align according to the position
	var side = options.side || defaults.side;

	placeBySide[side](element, targetRect);

	return element;
}
},{"mucss":3}],5:[function(require,module,exports){
var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver
function matches(el, selector) {
  var fn = el.matches || el.matchesSelector || el.msMatchesSelector || el.mozMatchesSelector || el.webkitMatchesSelector || el.oMatchesSelector
  return fn ? fn.call(el, selector) : false
}
function toArr(nodeList) {
  return Array.prototype.slice.call(nodeList)
}

// polyfill for IE < 11
var isOldIE = false
if (typeof MutationObserver === 'undefined') {
  MutationObserver = function(callback) {
    this.targets = []
    this.onAdded = function(e) {
      callback([{ addedNodes: [e.target], removedNodes: [] }])
    }
    this.onRemoved = function(e) {
      callback([{ addedNodes: [], removedNodes: [e.target] }])
    }
  }

  MutationObserver.prototype.observe = function(target) {
    target.addEventListener('DOMNodeInserted', this.onAdded)
    target.addEventListener('DOMNodeRemoved', this.onRemoved)
    this.targets.push(target)
  }

  MutationObserver.prototype.disconnect = function() {
    var target
    while (target = this.targets.shift()) {
      target.removeEventListener('DOMNodeInserted', this.onAdded)
      target.removeEventListener('DOMNodeRemoved', this.onRemoved)
    }
  }

  isOldIE = !!~navigator.appName.indexOf('Internet Explorer')
}

var SelectorObserver = function(targets, selector, onAdded, onRemoved) {
  var self     = this
  this.targets = targets instanceof NodeList
                   ? Array.prototype.slice.call(targets)
                   : [targets]

  // support selectors starting with the childs only selector `>`
  var childsOnly = selector[0] === '>'
    , search = childsOnly ? selector.substr(1) : selector
    , initialized = false

  function apply(nodes, callback) {
    toArr(nodes).forEach(function(node) {
      //ignore non-element nodes
      if (node.nodeType !== 1) return;

      // if looking for childs only, the node's parentNode
      // should be one of our targets
      if (childsOnly && self.targets.indexOf(node.parentNode) === -1) {
        return
      }

      // test if the node itself matches the selector
      if (matches(node, search)) {
        callback.call(node)
      }

                     // ↓ IE workarounds ...
      if (childsOnly || (initialized && isOldIE && callback !== onRemoved)) return

      if (!node.querySelectorAll) return
      toArr(node.querySelectorAll(selector)).forEach(function(node) {
        callback.call(node)
      })
    })
  }

  this.observer = new MutationObserver(function(mutations) {
    self.disconnect()

    mutations.forEach(function(mutation) {
      if (onAdded)   apply(mutation.addedNodes,   onAdded)
      if (onRemoved) apply(mutation.removedNodes, onRemoved)
    })

    self.observe()
  })

  initialized = true

  function start() {
    // call onAdded for existing elements
    if (onAdded) {
      self.targets.forEach(function(target) {
        apply(target.children, onAdded)
      })
    }

    self.observe()
  }

  if (document.readyState !== 'loading') {
    start()
  } else {
    document.addEventListener('DOMContentLoaded', start)
  }
}

SelectorObserver.prototype.disconnect = function() {
  this.observer.disconnect()
}

SelectorObserver.prototype.observe = function() {
  var self = this
  this.targets.forEach(function(target) {
    self.observer.observe(target, { childList: true, subtree: true })
  })
}

if (typeof exports !== 'undefined') {
  module.exports = SelectorObserver
}

// DOM extension
Element.prototype.observeSelector = function(selector, onAdded, onRemoved) {
  return new SelectorObserver(this, selector, onAdded, onRemoved)
}

},{}],6:[function(require,module,exports){
/**
* Extend poppy with popup behaviour
*/

var Poppy = require('../index');
var Mod = window.Mod || require('mod-constructor');
var place = require('placer');
var extend = require('extend');
var SelectorObserver = require('selector-observer');


var Popup = module.exports = Mod({
	mixins: [Poppy]
});


var name = Poppy.displayName;

/**
* Popup constructor
*/
var proto = Popup.fn;

//watch for the elements
new SelectorObserver(document.documentElement, '[data-popup]', function(e){
	new Popup(this);
});

/**
* Lifecycle
*/
proto.init = function(){
	// console.log('init popup')
};

proto.created = function(){
	// console.log('created popup', this.$blind)
};



/**
* Elements
*/
//close button
proto.$closeButton = {
	init: function(){
		//create button
		var $closeButton = document.createElement('div');
		$closeButton.classList.add(name + '-close');

		return $closeButton;
	}
}

//static overlay blind
// console.log('---init blind')
Popup.$blind = new Poppy({
	created: function(){
		this.$container.classList.add(name + '-blind')
	}
});
proto.$blind = {
	init: Popup.$blind
}
proto.$blindContainer = {
	init: Popup.$blind.$container
}


//add proper class to the container
proto.$container.changed = function($container){
	$container.classList.add(name + '-popup');
}


/**
* Options
*/
//show close button
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

//show overlay along with popup
proto.blind = {
	'false': {

	},
	'true': {

	}
};

//react on href change
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




/**
* Behaviour
*/
//FIXME: ? replace with Poppy.prototype.state
proto.state = extend({}, Poppy.fn.state, {
	_: {
		'click': 'show'
	},
	visible: {
		'click, this.$closeButton click, this.$blindContainer click': 'hide'
	}
});

proto.show = function(){
	//show blind
	this.$blind.show();

	//show container
	Poppy.fn.show.call(this);
};

proto.hide = function(){
	//show container
	Poppy.fn.hide.call(this);

	//show blind
	this.$blind.hide();
};

proto.place = function(){
	//place properly (align by center)
	place(this.$container, {
		relativeTo: window,
		align: 'center'
	});
};


//handle popup as a mod
module.exports = Mod(Popup);
},{"../index":1,"extend":2,"mod-constructor":"mod-constructor","placer":4,"selector-observer":5}]},{},[6])(6)
});