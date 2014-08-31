!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var o;"undefined"!=typeof window?o=window:"undefined"!=typeof global?o=global:"undefined"!=typeof self&&(o=self),o.Popover=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
			return this['for'];
		}
	},

	//FIXME: scope it within contentType states
	//FIXME: simplify this (too unclear)
	set: function(value){
		var res;

		if (typeof value === 'string'){
			//if pathname is current - shorten selector
			var linkElements = value.split('#');
			if (linkElements[0] === location.origin + location.pathname){
				//try to save queried element
				res = document.querySelector('#' + linkElements[1]);
				if (res) return res;

				//if not - save query string
				return '#' + linkElements[1];
			}

			//try to query element
			try {
				res = document.querySelector(value);
				if (res) return res;
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

	//remove container from the holder
	this.holder.removeChild(this.$container);

	//remove content from the container
	if (this.content) {
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
	align: 0.5,

	//selector/nodelist/node/[x,y]/window/function(el)
	avoid: undefined,

	//selector/nodelist/node/[x,y]/window/function(el)
	within: window
};

//set of position placers
var placeBySide = {
	center: function(el, rect){
		var center = [(rect[2] + rect[0]) / 2, (rect[3] + rect[1]) / 2];
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
		var width = el.offsetWidth;
		var height = el.offsetHeight;
		el.style.top = rect[3] + 'px';
		el.style.left = rect[0] + 'px';
	}
};


//place element relative to the target on the side
function place(element, options){
	options = options || {};

	//get target rect to align
	var target = options.relativeTo || defaults.relativeTo;
	var targetRect;

	if (target === win) {
		targetRect = [0, 0, win.innerWidth, win.innerHeight];
	}
	else if (target instanceof Element) {
		var rect = target.getBoundingClientRect();
		targetRect = [rect.left, rect.top, rect.right, rect.bottom];
	}
	else if (typeof target === 'string'){
		var targetEl = document.querySelector(target);
		if (!targetEl) return false;
		// var rect;
	}

	//align according to the position
	var side = options.side || defaults.side;

	placeBySide[side](element, targetRect);
}

function parseCSSValue(str){
	return ~~str.slice(0,-2);
}
},{}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
var Poppy = require('../index');
var Mod = window.Mod || require('mod-constructor');
var place = require('placer');
var SelectorObserver = require('selector-observer');

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

//watch for the elements
new SelectorObserver(document.documentElement, '[data-popover]', function(e){
	new Popover(this);
});

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
},{"../index":1,"mod-constructor":"mod-constructor","placer":2,"selector-observer":3}]},{},[4])(4)
});