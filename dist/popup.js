!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Popup=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
//FIXME: include Mod as a dependency
var Mod = window.Mod || require('mod-constructor');


var name = module.exports.displayName = 'poppy';


/**
* Poppy is always a link/target to click to show the container
*/
var proto = Poppy = {};

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
}




/**
* ------------------ Options
*/
//just state of popup
proto.state = {
	_: undefined,
	visible: undefined,
	changed: function(newState, oldState){
		//keep class updated
		this.classList.add(newState);
		this.classList.remove(oldState);
	}
}

//Where to place popupped content-container
proto.holder = {
	init: 'body',
	get: function(value){
		if (value === 'body') return document.body;
		else return value;
	},
	set: setElement
}

//string selector, Node, or href. Content to show in container
proto.content = {
	init: function(value){
		//if specified - return it
		if (value) return value;

		//read href, if it is set
		if (this.href) {
			return this.href;
		}

		//read for, if defined
		if (this['for']) {
			return this['for']
		}
	},

	//FIXME: scope it within contentType states
	//FIXME: simplify this (too unclear)
	set: function(value){
		if (typeof value === 'string'){
			//if pathname is current - shorten selector
			var linkElements = value.split('#');
			if (linkElements[0] === location.origin + location.pathname){
				//try to save queried element
				var res = document.querySelector('#' + linkElements[1]);
				if (res) return res;

				//if not - save query string
				return '#' + linkElements[1];
			}

			//try query element
			var res = document.querySelector(value);
			if (res) return res;

			//if not - return value as is
			return value;
		}

		return value;
	},

	//FIXME: place it to the contentType scope
	//eval content each time it is going to be get
	get: function(v){
		var content;

		if (v instanceof HTMLElement){
			return v;
		}

		else if (typeof v === 'string'){
			content = document.querySelector(v);
		}

		//return absent target stub
		else {
			// content = document.createElement('div');
			// content.innerHTML = 'No target found for poppy ' + this;
		}

		return content;
	},

	changed: function(content){
		//unhide content if it is hidden
		if (content instanceof HTMLElement) {
			if (content.parentNode) content.parentNode.removeChild(content);
			content.removeAttribute('hidden');
		}
	}
}

//type of content to show
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
}


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

//restriction area for the popup, viewport by default
proto.within = {
	set: setElement
}

//selector of elements to avoid overlapping with
proto.avoid = null
*/


//instantly close other dropdowns when one shows
proto.single = false



/**
* -------------------------- API
*/
proto.show = function(){
	//eval content to show
	if (this.content) {
		this.$container.appendChild(this.content);
	}

	//append container to the holder
	this.holder.appendChild(this.$container);

	//place
	this.place();

	//switch state
	this.state = 'visible';

	return this;
}

proto.hide = function(){
	// console.log('hide', this.$container.parentNode)

	//remove container from the holder
	this.holder.removeChild(this.$container);

	//remove content from the container
	if (this.content) {
		this.$container.removeChild(this.content);
	}

	//switch state
	this.state = 'hidden';

	return this;
}

proto.place = function(){
	//implement this behaviour in instances
}


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


module.exports = Mod(Poppy);
},{"mod-constructor":undefined}],2:[function(require,module,exports){
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
/**
* Placer
* Places any element relative to any other element the way you define
*/

module.exports = place;

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
	align: .5,

	//selector/nodelist/node/[x,y]/window/function(el)
	avoid: undefined,

	//selector/nodelist/node/[x,y]/window/function(el)
	within: window
}

//set of position placers
var placeBySide = {
	center: function(el, rect){
		var center = [(rect[1] + rect[0]) / 2, (rect[3] + rect[2]) / 2];
		var width = el.offsetWidth;
		var height = el.offsetHeight;
		el.style.top = (center[1] - height/2) + 'px';
		el.style.left = (center[0] - width/2) + 'px';
	},

	left: function(el, rect){

	},

	right: function(el, rect){

	},

	top: function(el, rect){

	},

	bottom: function(el, rect){

	}
}


//place element relative to the target on the side
function place(element, options){
	options = options || {};

	//get target rect to align
	var target = options.relativeTo || defaults.relativeTo;
	var targetRect;
	if (target === win) {
		targetRect = [0, win.innerWidth, 0, win.innerHeight]
	}
	else if (target instanceof Element) {
		var rect = target.getBoundingClientRect();
		targetRect = [rect.left, rect.right, rect.top, rect.bottom]
	}
	else if (typeof target === 'string'){
		var targetEl = document.querySelector(target);
		if (!targetEl) return false;
		var rect
	}

	//align according to the position
	var side = options.side || defaults.side;

	placeBySide[side](element, targetRect);
}

function parseCSSValue(str){
	return ~~str.slice(0,-2);
}
},{}],4:[function(require,module,exports){
/**
* Extend poppy with popup behaviour
*/

var Poppy = require('../index');
var Mod = window.Mod || require('mod-constructor');
var place = require('placer');
var extend = require('extend');




var name = Poppy.displayName;


/**
* Popup constructor
*/
var Popup = Mod({
	mixin: [Poppy],
	selector: '[data-popup]'
});

var proto = Popup.fn;



/**
* Lifecycle
*/
proto.init = function(){
	// console.log('init popup')
}
proto.created = function(){
}



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
}

//show overlay along with popup
proto.blind = {
	'false': {

	},
	'true': {

	}
}

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
}




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
}

proto.hide = function(){
	//show container
	Poppy.fn.hide.call(this);

	//show blind
	this.$blind.hide();
}

proto.place = function(){
	//place properly (align by center)
	place(this.$container, {
		relativeTo: window,
		align: 'center'
	})
}


//handle popup as a mod
module.exports = Mod(Popup);
},{"../index":1,"extend":2,"mod-constructor":undefined,"placer":3}]},{},[4])(4)
});