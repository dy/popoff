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

proto.show = function(e){
	var self = this;
	// console.log('show', e)

	//set ignoring hide flag in order to pass over current bubbling event
	this.ignoreHide = true;
	setTimeout(function(){self.ignoreHide = false;});

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

	return self;
};


/**
 * Close the container
 * @return {Poppy} Chaining
 */

proto.hide = function(){
	// console.log('hide');

	//ignore, if flag is set
	if (this.ignoreHide) return;

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