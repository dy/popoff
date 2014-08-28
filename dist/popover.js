!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var o;"undefined"!=typeof window?o=window:"undefined"!=typeof global?o=global:"undefined"!=typeof self&&(o=self),o.Popover=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
},{}],3:[function(require,module,exports){
var Poppy = require('../index');
var Mod = window.Mod || require('mod-constructor');
var place = require('placer');



var name = Poppy.displayName;

//FIXME: replace Poppy.fn with Poppy.prototype
//FIXME: extension doesn't clone the object: use Object.create(Poppy);
var Popover = Mod({
	mixin: [Poppy],
	selector: '[data-popover]'
});

var proto = Popover.fn;


/**
* Lifecycle
*/
proto.init = function(){
}
proto.created = function(){
	// console.log('popover created')
}


//add proper class to the container
proto.$container.changed = function($container){
	$container.classList.add(name + '-popover');
}


/**
* Behaviour
*/
//hidden
proto.state._ = {
	//FIXME: get rid of defer
	'click:defer': function (e) {
		//save position of click
		this._xPos = e.clientX;
		this._yPos = e.clientY;

		this.show();
	}
}
proto.state.visible = {
	//FIXME: replace with :not modifier
	'document click': function(e){
		if (e.target !== this.$container && !this.$container.contains(e.target)) this.hide();
	},

	//if mouse moved too far - close also
	'document mousemove': function(e){
		var xDiff = e.clientX - this._xPos, yDiff = e.clientY - this._yPos;
		var dist = Math.sqrt(xDiff*xDiff + yDiff*yDiff);
		if (dist > this.visibleDistance) this.hide();

	}
}
//distance from the place of initial click to hide the popover
proto.visibleDistance = {
	init: function(){
		return window.innerWidth * .4;
	}
}

proto.place = function(){
	//place properly (align by center)
	place(this.$container, {
		relativeTo: this,
		align: 'center'
	})
}



//handle popup as a mod
module.exports = Mod(Popover);
},{"../index":1,"mod-constructor":undefined,"placer":2}]},{},[3])(3)
});