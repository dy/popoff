(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var this$1 = this;

  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this$1, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var this$1 = this;

  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this$1.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this$1.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],2:[function(require,module,exports){
exports.endianness = function () { return 'LE' };

exports.hostname = function () {
    if (typeof location !== 'undefined') {
        return location.hostname
    }
    else return '';
};

exports.loadavg = function () { return [] };

exports.uptime = function () { return 0 };

exports.freemem = function () {
    return Number.MAX_VALUE;
};

exports.totalmem = function () {
    return Number.MAX_VALUE;
};

exports.cpus = function () { return [] };

exports.type = function () { return 'Browser' };

exports.release = function () {
    if (typeof navigator !== 'undefined') {
        return navigator.appVersion;
    }
    return '';
};

exports.networkInterfaces
= exports.getNetworkInterfaces
= function () { return {} };

exports.arch = function () { return 'javascript' };

exports.platform = function () { return 'browser' };

exports.tmpdir = exports.tmpDir = function () {
    return '/tmp';
};

exports.EOL = '\n';

},{}],3:[function(require,module,exports){
/**
 * @module  popup
 */

var Emitter = require('events');
var place = require('placer');
var extend = require('xtend/mutable');
var uid = require('get-uid');
var inherits = require('inherits');
var createOverlay = require('./overlay');
var insertCss = require('insert-css');
var sb = require('mucss/scrollbar');
var hasScroll = require('mucss/has-scroll');


insertCss(".popoff-overlay {\r\n\tposition: fixed;\r\n\ttop: 0;\r\n\tleft: 0;\r\n\tbottom: 0;\r\n\tright: 0;\r\n\topacity: 0;\r\n\tbackground-color: rgba(65,65,65,.85);\r\n\tbackground: linear-gradient(160deg, rgba(93, 88, 95, 0.75), rgba(63, 60, 72, 0.75));\r\n\t-webkit-transition: opacity .33s;\r\n\t-moz-transition: opacity .33s;\r\n\ttransition: opacity .33s;\r\n\tz-index: 5;\r\n}\r\n.popoff-closable {\r\n\tcursor: pointer;\r\n}\r\n\r\n.popoff-popup {\r\n\tz-index: 9;\r\n\tposition: absolute;\r\n\toverflow: hidden;\r\n\tmargin: auto;\r\n\tmin-width: 4rem;\r\n\tmin-height: 1rem;\r\n\tbackground: white;\r\n\topacity: 1;\r\n\tvisibility: visible;\r\n\tbackface-visibility: hidden;\r\n\tbox-sizing: border-box;\r\n\t-webkit-transform-origin: center center;\r\n\t-moz-transform-origin: center center;\r\n\ttransform-origin: center center;\r\n\t-webkit-transform: scale(1) rotate(0deg);\r\n\t-moz-transform: scale(1) rotate(0deg);\r\n\t-ms-transform: scale(1) rotate(0deg);\r\n\ttransform: scale(1) rotate(0deg);\r\n}\r\n.popoff-popup-tip {\r\n\tmargin: 1rem;\r\n}\r\n\r\n.popoff-animate {\r\n\t-webkit-transition: opacity .333s, transform .25s ease-out;\r\n\t-moz-transition: opacity .333s, transform .25s ease-out;\r\n\ttransition: opacity .333s, transform .25s ease-out;\r\n}\r\n.popoff-hidden {\r\n\topacity: 0;\r\n\tdisplay: none;\r\n\tpointer-events: none;\r\n\tvisibility: hidden;\r\n}\r\n.popoff-visible {\r\n\topacity: 1;\r\n}\r\n\r\n\r\n.popoff-container {\r\n}\r\n.popoff-container-overflow {\r\n\toverflow: hidden;\r\n\theight: 100%;\r\n}\r\n\r\n.popoff-overflow {\r\n\tposition: fixed;\r\n\toverflow: hidden;\r\n\ttop: 0;\r\n\tleft: 0;\r\n\tright: 0;\r\n\tbottom: 0;\r\n\tz-index: 10;\r\n\tdisplay: flex;\r\n\tjustify-content: center;\r\n\talign-items: center;\r\n}\r\n.popoff-overflow.popoff-overflow-tall {\r\n\toverflow-y: scroll;\r\n\tdisplay: block;\r\n}\r\n.popoff-overflow .popoff-popup {\r\n\tposition: relative;\r\n}\r\n\r\n.popoff-overflow-tall .popoff-popup {\r\n\tmargin: 2rem auto;\r\n}\r\n@media (max-width: 42rem) {\r\n\t.popoff-overflow-tall .popoff-popup {\r\n\t\tmargin: 0 auto;\r\n\t}\r\n}\r\n\r\n/* Close button */\r\n.popoff-close {\r\n\tposition: absolute;\r\n\tright: 0;\r\n\ttop: 0;\r\n\twidth: 3.333rem;\r\n\theight: 3.333rem;\r\n\tcursor: pointer;\r\n\tline-height: 3.333rem;\r\n\ttext-align: center;\r\n\tfont-size: 1.333rem;\r\n\tcolor: rgb(120,120,120);\r\n\tbackground: transparent;\r\n}\r\n.popoff-close:after {\r\n\tcontent: '✕';\r\n}\r\n.popoff-close:hover{\r\n\tcolor: rgb(0,0,0);\r\n}\r\n\r\n\r\n/* Types */\r\n.popoff-modal,\r\n.popoff-dialog,\r\n.popoff-confirm,\r\n.popoff-alert,\r\n.popoff-sidebar {\r\n\tposition: fixed;\r\n\tmax-width: 660px;\r\n\tmin-width: 320px;\r\n\tpadding: 1.6rem 2rem;\r\n\tbox-shadow: 0 4px 16px -2px rgba(19, 16, 27, 0.35);\r\n}\r\n@media (max-width: 42rem) {\r\n\t.popoff-modal,\r\n\t.popoff-dialog,\r\n\t.popoff-confirm,\r\n\t.popoff-alert {\r\n\t\tmax-width: 80%;\r\n\t}\r\n}\r\n.popoff-dropdown,\r\n.popoff-tooltip {\r\n\tmax-width: 320px;\r\n\tpadding: 1rem 1.2rem;\r\n\tbox-shadow: 0 1px 4px rgba(19, 16, 27, 0.25);\r\n}\r\n\r\n\r\n\r\n/** Special sidebar settings */\r\n.popoff-sidebar {\r\n\tmargin: 0;\r\n\tmax-width: none;\r\n\tmin-width: 0;\r\n\tmax-height: none;\r\n\toverflow-y: auto;\r\n\topacity: 1;\r\n\tpadding: 1.2rem;\r\n}\r\n.popoff-sidebar[data-side=\"top\"] {\r\n\ttop: 0;\r\n\tleft: 0;\r\n\tright: 0;\r\n\tbottom: auto;\r\n\tmax-height: 160px;\r\n}\r\n.popoff-sidebar[data-side=\"bottom\"] {\r\n\tbottom: 0;\r\n\tleft: 0;\r\n\tright: 0;\r\n\ttop: auto;\r\n\tmax-height: 160px;\r\n}\r\n.popoff-sidebar[data-side=\"right\"] {\r\n\tbottom: 0;\r\n\ttop: 0;\r\n\tright: 0;\r\n\tleft: auto;\r\n\tmax-width: 240px;\r\n}\r\n.popoff-sidebar[data-side=\"left\"] {\r\n\tbottom: 0;\r\n\ttop: 0;\r\n\tleft: 0;\r\n\tright: auto;\r\n\tmax-width: 240px;\r\n}\r\n\r\n\r\n\r\n/* Tip */\r\n.popoff-tip {\r\n\twidth: 30px;\r\n\theight: 30px;\r\n\tposition: absolute;\r\n\tz-index: 10;\r\n\toverflow: hidden;\r\n}\r\n.popoff-tip:after {\r\n\tcontent: '';\r\n\tborder-top-left-radius: 1px;\r\n\tposition: absolute;\r\n\tbackground: white;\r\n\tbox-shadow: 0 0px 3px rgba(19, 16, 27, 0.25);\r\n\t-webkit-transform-origin: center;\r\n\t-moz-transform-origin: center;\r\n\ttransform-origin: center;\r\n\t-webkit-transform: rotate(45deg);\r\n\t-moz-transform: rotate(45deg);\r\n\ttransform: rotate(45deg);\r\n\twidth: 30px;\r\n\theight: 30px;\r\n}\r\n.popoff-tip[data-side=\"top\"],\r\n.popoff-tip[data-side=\"bottom\"] {\r\n\theight: 20px;\r\n}\r\n.popoff-tip[data-side=\"top\"]:after {\r\n\tbottom: auto;\r\n\ttop: 17px;\r\n}\r\n.popoff-tip[data-side=\"bottom\"]:after {\r\n\tbottom: 17px;\r\n\ttop: auto;\r\n}\r\n.popoff-tip[data-side=\"left\"],\r\n.popoff-tip[data-side=\"right\"] {\r\n\twidth: 20px;\r\n}\r\n.popoff-tip[data-side=\"left\"]:after {\r\n\tleft: 17px;\r\n\tright: auto;\r\n}\r\n.popoff-tip[data-side=\"right\"]:after {\r\n\tleft: auto;\r\n\tright: 17px;\r\n}\r\n\r\n\r\n\r\n/* Basic fade */\r\n.popoff-effect-fade {\r\n\topacity: 0;\r\n\t-webkit-transition: all 0.3s;\r\n\t-moz-transition: all 0.3s;\r\n\ttransition: all 0.3s;\r\n}\r\n\r\n/* Effect 1: Fade in and scale up */\r\n.popoff-effect-scale {\r\n\t-webkit-transform: scale(0.7);\r\n\t-moz-transform: scale(0.7);\r\n\t-ms-transform: scale(0.7);\r\n\ttransform: scale(0.7);\r\n\topacity: 0;\r\n\t-webkit-transition: all 0.3s;\r\n\t-moz-transition: all 0.3s;\r\n\ttransition: all 0.3s;\r\n}\r\n\r\n\r\n/* Effect 2: Slide from the right */\r\n.popoff-effect-slide {\r\n\t-webkit-transform: translateY(20%);\r\n\t-moz-transform: translateY(20%);\r\n\t-ms-transform: translateY(20%);\r\n\ttransform: translateY(20%);\r\n\topacity: 0;\r\n\t-webkit-transition: all 0.3s;\r\n\t-moz-transition: all 0.3s;\r\n\ttransition: all 0.3s;\r\n}\r\n.popoff-effect-slide-right {\r\n\t-webkit-transform: translateX(20%);\r\n\t-moz-transform: translateX(20%);\r\n\t-ms-transform: translateX(20%);\r\n\ttransform: translateX(20%);\r\n\topacity: 0;\r\n\t-webkit-transition: all 0.3s;\r\n\t-moz-transition: all 0.3s;\r\n\ttransition: all 0.3s;\r\n}\r\n.popoff-effect-slide-bottom {\r\n\t-webkit-transform: translateY(20%);\r\n\t-moz-transform: translateY(20%);\r\n\t-ms-transform: translateY(20%);\r\n\ttransform: translateY(20%);\r\n\topacity: 0;\r\n\t-webkit-transition: all 0.3s;\r\n\t-moz-transition: all 0.3s;\r\n\ttransition: all 0.3s;\r\n}\r\n.popoff-effect-slide-left {\r\n\t-webkit-transform: translateX(-20%);\r\n\t-moz-transform: translateX(-20%);\r\n\t-ms-transform: translateX(-20%);\r\n\ttransform: translateX(-20%);\r\n\topacity: 0;\r\n\t-webkit-transition: all 0.3s;\r\n\t-moz-transition: all 0.3s;\r\n\ttransition: all 0.3s;\r\n}\r\n.popoff-effect-slide-top {\r\n\t-webkit-transform: translateY(-20%);\r\n\t-moz-transform: translateY(-20%);\r\n\t-ms-transform: translateY(-20%);\r\n\ttransform: translateY(-20%);\r\n\topacity: 0;\r\n\t-webkit-transition: all 0.3s;\r\n\t-moz-transition: all 0.3s;\r\n\ttransition: all 0.3s;\r\n}\r\n\r\n\r\n/* Effect 4: Newspaper */\r\n.popoff-effect-newspaper {\r\n\t-webkit-transform: scale(0) rotate(720deg);\r\n\t-moz-transform: scale(0) rotate(720deg);\r\n\t-ms-transform: scale(0) rotate(720deg);\r\n\ttransform: scale(0) rotate(720deg);\r\n\t-webkit-transition: all 0.5s;\r\n\t-moz-transition: all 0.5s;\r\n\ttransition: all 0.5s;\r\n\topacity: 0;\r\n}\r\n\r\n\r\n/* Effect 11: Super scaled */\r\n.popoff-effect-super-scaled {\r\n\t-webkit-transform: scale(2);\r\n\t-moz-transform: scale(2);\r\n\t-ms-transform: scale(2);\r\n\ttransform: scale(2);\r\n\topacity: 0;\r\n\t-webkit-transition: all 0.3s;\r\n\t-moz-transition: all 0.3s;\r\n\ttransition: all 0.3s;\r\n}\r\n");

module.exports = Popup;


/**
 * @class  Popup
 *
 * @constructor
 *
 * @param {Object} options Showing options
 *
 * @return {Popup} A popup controller
 */
function Popup (opts) {
	var this$1 = this;

	if (!(this instanceof Popup)) return new Popup(opts);

	var typeOpts = this.types[opts.type || this.type] || {};

	//hook up type events and options events
	if (typeOpts.onInit) this.on('init', typeOpts.onInit);
	if (typeOpts.onShow) this.on('show', typeOpts.onShow);
	if (typeOpts.onHide) this.on('hide', typeOpts.onHide);
	if (typeOpts.onAfterShow) this.on('afterShow', typeOpts.onAfterShow);
	if (typeOpts.onAfterHide) this.on('afterHide', typeOpts.onAfterHide);
	if (opts.onInit) this.on('init', opts.onInit);
	if (opts.onShow) this.on('show', opts.onShow);
	if (opts.onHide) this.on('hide', opts.onHide);
	if (opts.onAfterShow) this.on('afterShow', opts.onAfterShow);
	if (opts.onAfterHide) this.on('afterHide', opts.onAfterHide);


	//generate unique id
	this.id = uid();

	//FIXME: :'(
	this.update = this.update.bind(this);

	//ensure element
	if (!this.element) this.element = document.createElement('div');
	this.element.classList.add('popoff-popup');
	this.element.classList.add('popoff-hidden');

	//take over type’s options.
	//should be after element creation to init `content` property
	extend(this, typeOpts, opts);

	this.element.classList.add(("popoff-" + (this.type)));

	//take over a target first
	if (!this.container) {
		this.container = document.body || document.documentElement;
	}
	this.container.classList.add('popoff-container');

	//create close element
	this.closeElement = document.createElement('div');
	this.closeElement.classList.add('popoff-close');
	if (this.closable) {
		this.closeElement.addEventListener('click', function (e) {
			this$1.hide();
		});
		this.element.appendChild(this.closeElement);
	}

	//create tip
	this.tipElement = document.createElement('div');
	this.tipElement.classList.add('popoff-tip');
	this.tipElement.classList.add('popoff-hidden');
	if (this.tip) {
		this.container.appendChild(this.tipElement);
		this.element.classList.add('popoff-popup-tip');
	}

	//apply custom style
	if (this.style) {
		for (var name in this.style) {
			var value = this$1.style[name];
			if (typeof value === 'number' && !/z/.test(name)) value += 'px';
			this$1.element.style[name] = value;
		}
	}

	//create overflow for tall content
	this.overflowElement = document.createElement('div');
	this.overflowElement.classList.add('popoff-overflow');

	this.container.appendChild(this.element);

	if (this.escapable) {
		document.addEventListener('keyup', function (e) {
			if (!this$1.isVisible) return;
			if (e.which === 27) {
				this$1.hide();
			}
		});
	}

	//init proper target
	if (typeof this.target === 'string') {
		this.target = document.querySelector(this.target);
	}

	//update on resize
	window.addEventListener('resize', function () {
		this$1.update();
	});

	this.emit('init');
}

inherits(Popup, Emitter);

extend(Popup.prototype, {
	/** Show overlay, will be detected based off type */
	overlay: true,

	/** Show close button */
	closable: true,

	/** Close by escape */
	escapable: true,

	/** Show tip */
	tip: false,

	/** Place popup relative to the element, like dropdown */
	target: window,

	/** Whether to show only one popup */
	single: true,

	/** A target to bind default placing */
	container: document.body || document.documentElement,

	/** Animation effect, can be a list */
	effect: 'fade',

	/** Default module type to take over the options */
	type: 'modal',

	/** Placing settings */
	side: 'center',
	align: 'center',

	//default anim fallback
	animTimeout: 1000,

	//detect tall content
	wrap: false,

	//shift content
	shift: true
});

//FIXME: hope it will not crash safari
Object.defineProperties(Popup.prototype, {
	content: {
		get: function () {
			return this.element;
		},
		set: function (content) {
			if (!this.element) throw Error('Content element is undefined');

			if (this.closeElement) this.element.removeChild(this.closeElement);

			if (content instanceof HTMLElement) {
				this.element.innerHTML = '';
				this.element.appendChild(content);
			}
			else if (typeof content === 'string') {
				this.element.innerHTML = content;
			}

			if (this.closeElement) this.element.appendChild(this.closeElement);
		}
	}
});


/** Type of default interactions */
Popup.prototype.types = {
	modal: {
		overlay: true,
		closable: true,
		escapable: true,
		tip: false,
		single: true,
		side: 'center',
		align: 'center',
		target: null,
		wrap: true,
		effect: 'fade',
		onInit: function () {
			var this$1 = this;

			if (this.target) {
				this.target.addEventListener('click', function (e) {
					if (this$1.isVisible) return this$1.hide();

					return this$1.show();
				});
			}
			else {
				this.target = window;
			}
		}
	},

	dropdown: {
		overlay: false,
		closable: false,
		escapable: true,
		target: null,
		tip: true,
		single: true,
		side: 'bottom',
		align: 'center',
		effect: 'fade',
		onInit: function () {
			var this$1 = this;

			if (this.target) {
				this.target.addEventListener('click', function (e) {
					if (this$1.isVisible) return this$1.hide();
					else return this$1.show();
				});
			}

			//hide on unfocus
			document.addEventListener('click', function (e) {
				if (!this$1.isVisible) {
					return;
				}

				//ignore contain clicks
				if (this$1.element.contains(e.target)) {
					return;
				}

				//ignore self clicks
				this$1.hide();
			});
		}
	},

	tooltip: {
		overlay: false,
		closable: false,
		escapable: true,
		target: null,
		tip: true,
		single: true,
		side: 'right',
		align: 'center',
		effect: 'fade',
		timeout: 500,
		onInit: function () {
			var this$1 = this;

			var that = this;

			if (this.target) {
				this.target.addEventListener('mouseenter', function (e) {
					if (this$1._leave) {
						clearTimeout(this$1._leave);
						this$1._leave = null;
					}
					if (this$1.isVisible) return;
					this$1.show();
					setTimeout(function () {
						this$1._leave = setTimeout(function () {
							this$1.hide();
						}, this$1.timeout + 1000);
					});
				});
				this.target.addEventListener('mousemove', function (e) {
					if (this$1._leave) {
						clearTimeout(this$1._leave);
						this$1._leave = null;
					}
				});
				this.target.addEventListener('mouseleave', function (e) {
					if (!this$1.isVisible) return;
					this$1._leave = setTimeout(function () {
						this$1.hide();
					}, this$1.timeout);
				});
			}

			this.element.addEventListener('mouseenter', function (e) {
				if (!this$1.isVisible) return;
				this$1._leave && clearTimeout(this$1._leave);
			});
			this.element.addEventListener('mouseleave', function (e) {
				if (!this$1.isVisible) return;
				this$1._leave = setTimeout(function () {
					this$1.hide();
				}, this$1.timeout);
			});
		}
	},

	sidebar: {
		overlay: false,
		closable: true,
		escapable: true,
		tip: false,
		single: true,
		side: 'bottom',
		align: .5,
		target: null,
		effect: 'slide',
		shift: true,
		update: function () {},
		onInit: function () {
			var this$1 = this;

			//define shift
			if (this.shift === true) {
				this.shift = 100;
			}

			if (this.target) {
				this.target.addEventListener('click', function (e) {
					if (this$1.isVisible) return;

					return this$1.show();
				});
			}
			else {
				this.target = window;
			}
			this.container.parentNode.appendChild(this.element);
		},
		onShow: function () {
			if (!/top|left|bottom|right/.test(this.side)) this.side = this.types.sidebar.side;
			this.element.setAttribute('data-side', this.side);
			this.effect = 'slide-' + this.side;

			if (this.shift) {
				this.container.classList.add('popoff-animate');
				var value = typeof this.shift === 'number' ? (this.shift + 'px') : this.shift;
				if (/top|bottom/.test(this.side)) {
					this.container.style.transform = "translateY(" + ((this.side === 'top' ? '' : '-') + value) + ")";
				}
				else {
					this.container.style.transform = "translateX(" + ((this.side === 'left' ? '' : '-') + value) + ")";
				}
			}
		},
		onHide: function () {
			if (this.shift) this.container.style.transform = null;
		},
		onAfterHide: function () {
			this.shift && this.container.classList.remove('popoff-animate');
		}
	}
};


/**
 * Show popup near to the target
 */
Popup.prototype.show = function (target, cb) {
	var this$1 = this;

	if (this.isVisible) return this;

	if (target instanceof Function) {
		this.currentTarget = this.target;
		cb = target;
	}
	else {
		this.currentTarget = target || this.target;
	}

	this.currentTarget && this.currentTarget.classList && this.currentTarget.classList.add('popoff-active');
	this.element.classList.remove('popoff-hidden');
	this.tipElement.classList.remove('popoff-hidden');

	this.emit('show', this.currentTarget);

	//ensure effects classes
	this.element.classList.add(("popoff-effect-" + (this.effect)));
	this.tipElement.classList.add(("popoff-effect-" + (this.effect)));

	var elHeight = this.element.offsetHeight;

	//apply overflow on body for tall content
	if (this.wrap) {
		if (elHeight > window.innerHeight) {
			this.isTall = true;
			this.overflowElement.classList.add('popoff-overflow-tall');
		}
		if (hasScroll.y()) {
			this._border = this.container.style.borderRight;
			this.container.style.borderRight = sb + 'px solid transparent';
		}
		this.container.classList.add('popoff-container-overflow');
		this.container.appendChild(this.overflowElement);
		this.overflowElement.appendChild(this.element);
	}

	this.tipElement.classList.add('popoff-animate');
	this.element.classList.add('popoff-animate');

	//in some way it needs to be called in timeout with some delay, otherwise animation fails
	setTimeout(function () {
		this$1.element.classList.remove(("popoff-effect-" + (this$1.effect)));
		this$1.tipElement.classList.remove(("popoff-effect-" + (this$1.effect)));
		this$1.isVisible = true;
		this$1.update();
	}, 10);

	if (this.overlay) {
		this._overlay = createOverlay({
			closable: true,
			container: this.wrap ? this.overflowElement : this.container
		})
		.on('hide', function (e) {
			this$1._overlay = null;
			this$1.hide();
		})
		.show();
	}

	this.isAnimating = true;
	this.animend(function (e) {
		//in case if something happened with content during the animation
		// this.update();
		this$1.isAnimating = false;
		this$1.tipElement.classList.remove('popoff-animate');
		this$1.element.classList.remove('popoff-animate');
		this$1.element.classList.add('popoff-visible');
		this$1.tipElement.classList.add('popoff-visible');

		this$1.emit('afterShow');
		cb && cb.call(this$1);
	});

	return this;
}


/**
 * Hide popup
 */
Popup.prototype.hide = function (cb) {
	var this$1 = this;

	//overlay recurrently calls this.hide, so just drop it here
	if (this._overlay) return this._overlay.hide();

	this.currentTarget && this.currentTarget.classList && this.currentTarget.classList.remove('popoff-active');

	this.emit('hide');


	this.element.classList.add(("popoff-effect-" + (this.effect)));
	this.tipElement.classList.add(("popoff-effect-" + (this.effect)));

	this.isAnimating = true;

	this.tipElement.classList.add('popoff-animate');
	this.element.classList.add('popoff-animate');
	this.element.classList.remove('popoff-visible');
	this.tipElement.classList.remove('popoff-visible');


	this.animend(function () {
		this$1.isVisible = false;
		this$1.isAnimating = false;
		this$1._overlay = null;
		this$1.tipElement.classList.remove('popoff-animate');
		this$1.element.classList.remove('popoff-animate');
		this$1.element.classList.add('popoff-hidden');
		this$1.tipElement.classList.add('popoff-hidden');

		this$1.element.classList.remove(("popoff-effect-" + (this$1.effect)));
		this$1.tipElement.classList.remove(("popoff-effect-" + (this$1.effect)));

		if (this$1.wrap) {
			this$1.isTall = false;
			this$1.overflowElement.classList.remove('popoff-overflow-tall');
			this$1.container.classList.remove('popoff-container-overflow');
			this$1.container.style.borderRight = this$1._border || null;
			this$1._border = null;
			this$1.container.removeChild(this$1.overflowElement);
			this$1.container.appendChild(this$1.element);
		}

		this$1.emit('afterHide');
		cb && cb.call(this$1);
	});

	return this;
}


/** Place popup next to the target */
Popup.prototype.update = function (how) {
	if (!this.isVisible) return this;

	//wrapped modals are placed via css
	if (this.wrap) return this;

	how = extend({
		target: this.currentTarget || this.target,
		side: this.side,
		align: this.align,
		within: window
	}, how);

	this.emit('update', how);

	place(this.element, how);

	if (this.tip) {
		var side = 'top';
		switch (how.side) {
			case 'top':
				side = 'bottom';
				break;
			case 'bottom':
				side = 'top';
				break;
			case 'left':
				side = 'right';
				break;
			case 'right':
				side = 'left';
				break;
			default:
				side = 'center';
		}

		this.tipElement.setAttribute('data-side', side);
		place(this.tipElement, {
			target: this.element,
			side: side,
			align: 'center',
			within: null
		});
	}

	return this;
}


/** Trigger callback once on anim end */
Popup.prototype.animend = function (cb) {
	var this$1 = this;

	var to = setTimeout(function () {
		cb.call(this$1);
	}, this.animTimeout);

	this.element.addEventListener('transitionend', end);
	this.element.addEventListener('webkitTransitionEnd', end);
	this.element.addEventListener('otransitionend', end);
	this.element.addEventListener('oTransitionEnd', end);
	this.element.addEventListener('msTransitionEnd', end);

	var that = this;
	function end () {
		clearTimeout(to);

		// that.element.removeEventListener('animationend', end);
		// that.element.removeEventListener('mozAnimationEnd', end);
		// that.element.removeEventListener('webkitAnimationEnd', end);
		// that.element.removeEventListener('oanimationend', end);
		// that.element.removeEventListener('MSAnimationEnd', end);
		that.element.removeEventListener('transitionend', end);
		that.element.removeEventListener('webkitTransitionEnd', end);
		that.element.removeEventListener('otransitionend', end);
		that.element.removeEventListener('oTransitionEnd', end);
		that.element.removeEventListener('msTransitionEnd', end);

		cb.call(that);
	}
}
},{"./overlay":60,"events":1,"get-uid":24,"inherits":25,"insert-css":26,"mucss/has-scroll":35,"mucss/scrollbar":43,"placer":52,"xtend/mutable":59}],4:[function(require,module,exports){
var margins = require('mucss/margin');
var paddings = require('mucss/padding');
var offsets = require('mucss/offset');
var borders = require('mucss/border');
var isFixed = require('mucss/is-fixed');

/**
 * @module
 */
module.exports = align;
module.exports.toFloat = toFloat;


var doc = document, win = window, root = doc.documentElement;



/**
 * Align set of elements by the side
 *
 * @param {NodeList|Array} els A list of elements
 * @param {string|number|Array} alignment Alignment param
 * @param {Element|Rectangle} relativeTo An area or element to calc off
 */
function align(els, alignment, relativeTo){
	if (!els || els.length < 2) throw Error('At least one element should be passed');

	//default alignment is left
	if (!alignment) alignment = 0;

	//default key element is the first one
	if (!relativeTo) relativeTo = els[0];

	//figure out x/y
	var xAlign, yAlign;
	if (alignment instanceof Array) {
		xAlign = toFloat(alignment[0]);
		yAlign = toFloat(alignment[1]);
	}
	//catch y values
	else if (/top|middle|bottom/.test(alignment)) {
		yAlign = toFloat(alignment);
	}
	else {
		xAlign = toFloat(alignment);
	}


	//apply alignment
	var targetRect = offsets(relativeTo);
	if (relativeTo === window) {
		targetRect.top = 0;
		targetRect.left = 0;
	}

	for (var i = els.length, el, s; i--;){
		el = els[i];

		if (el === window) continue;

		//ignore self
		if (el === relativeTo) continue;

		s = getComputedStyle(el);

		//ensure element is at least relative, if it is static
		if (s.position === 'static') el.style.position = 'relative';


		//get relativeTo & parent rectangles
		if (isFixed(el)) {
			var parent = win;
		}
		else {
			var parent = el.offsetParent || win;
		}

		//include margins
		var placeeMargins = margins(el);
		var parentRect = offsets(parent);
		var parentPaddings = paddings(parent);
		var parentBorders = borders(parent);

		parentRect.top += -parentBorders.top + placeeMargins.top;
		parentRect.left += -parentBorders.left + placeeMargins.left;
		parentRect.bottom += -parentBorders.bottom + placeeMargins.bottom;
		parentRect.right += -parentBorders.right + placeeMargins.right;

		//FIXME: I don’t understand why, but for popoff and placer it is required like that
		if (parent !== doc.body) {
			parentRect.top += parentPaddings.top
			parentRect.left += parentPaddings.left;
			parentRect.bottom += parentPaddings.bottom;
			parentRect.right += parentPaddings.right;
		}

		//correct parentRect
		if ((parent === window && isFixed(relativeTo)) || (parent === doc.body && getComputedStyle(parent).position === 'static') || parent === root) {
			parentRect.left = 0;
			parentRect.top = 0;
		}

		alignX(els[i], targetRect, parentRect, xAlign);
		alignY(els[i], targetRect, parentRect, yAlign);
	}
}




/**
 * Place horizontally
 */
function alignX ( placee, placerRect, parentRect, align ){
	if (typeof align !== 'number') return;

	//desirable absolute left
	var desirableLeft = placerRect.left + placerRect.width*align - placee.offsetWidth*align - parentRect.left;

	placee.style.left = desirableLeft + 'px';
	placee.style.right = 'auto';
}


/**
 * Place vertically
 */
function alignY ( placee, placerRect, parentRect, align ){
	if (typeof align !== 'number') return;

	//desirable absolute top
	var desirableTop = placerRect.top + placerRect.height*align - placee.offsetHeight*align - parentRect.top;

	placee.style.top = desirableTop + 'px';
	placee.style.bottom = 'auto';
}



/**
 * @param {string|number} value Convert any value passed to float 0..1
 */
function toFloat(value){
	if (typeof value === 'string') {
		//else parse single-value
		switch (value) {
			case 'left':
			case 'top':
				return 0;
			case 'right':
			case 'bottom':
				return 1;
			case 'center':
			case 'middle':
				return 0.5;
		}
		// throw Error('Alignment ' + value + 'is weird');
		return parseFloat(value);
	}

	return value;
}
},{"mucss/border":32,"mucss/is-fixed":36,"mucss/margin":37,"mucss/offset":38,"mucss/padding":39}],5:[function(require,module,exports){
/**
 * Define stateful property on an object
 */
module.exports = defineState;

var State = require('st8');


/**
 * Define stateful property on a target
 *
 * @param {object} target Any object
 * @param {string} property Property name
 * @param {object} descriptor State descriptor
 *
 * @return {object} target
 */
function defineState (target, property, descriptor, isFn) {
	//define accessor on a target
	if (isFn) {
		target[property] = function () {
			if (arguments.length) {
				return state.set(arguments[0]);
			}
			else {
				return state.get();
			}
		};
	}

	//define setter/getter on a target
	else {
		Object.defineProperty(target, property, {
			set: function (value) {
				return state.set(value);
			},
			get: function () {
				return state.get();
			}
		});
	}

	//define state controller
	var state = new State(descriptor, target);

	return target;
}
},{"st8":6}],6:[function(require,module,exports){
/**
 * @module  st8
 *
 * Micro state machine.
 */


var Emitter = require('events');
var isObject = require('is-plain-object');


/** Defaults */

State.options = {
	leaveCallback: 'after',
	enterCallback: 'before',
	changeCallback: 'change',
	remainderState: '_'
};


/**
 * Create a new state controller based on states passed
 *
 * @constructor
 *
 * @param {object} settings Initial states
 */

function State(states, context){
	//ignore existing state
	if (states instanceof State) return states;

	//ensure new state instance is created
	if (!(this instanceof State)) return new State(states);

	//save states object
	this.states = states || {};

	//save context
	this.context = context || this;

	//initedFlag
	this.isInit = false;
}


/** Inherit State from Emitter */

var proto = State.prototype = Object.create(Emitter.prototype);


/**
 * Go to a state
 *
 * @param {*} value Any new state to enter
 */

proto.set = function (value) {
	var oldValue = this.state, states = this.states;
	// console.group('set', value, oldValue);

	//leave old state
	var oldStateName = states[oldValue] !== undefined ? oldValue : State.options.remainderState;
	var oldState = states[oldStateName];

	var leaveResult, leaveFlag = State.options.leaveCallback + oldStateName;

	if (this.isInit) {
		if (isObject(oldState)) {
			if (!this[leaveFlag]) {
				this[leaveFlag] = true;

				//if oldstate has after method - call it
				leaveResult = getValue(oldState, State.options.leaveCallback, this.context);

				//ignore changing if leave result is falsy
				if (leaveResult === false) {
					this[leaveFlag] = false;
					// console.groupEnd();
					return false;
				}

				//redirect, if returned anything
				else if (leaveResult !== undefined && leaveResult !== value) {
					this.set(leaveResult);
					this[leaveFlag] = false;
					// console.groupEnd();
					return false;
				}

				this[leaveFlag] = false;

				//ignore redirect
				if (this.state !== oldValue) {
					return;
				}
			}

		}

		//ignore not changed value
		if (value === oldValue) return false;
	}
	else {
		this.isInit = true;
	}


	//set current value
	this.state = value;


	//try to enter new state
	var newStateName = states[value] !== undefined ? value : State.options.remainderState;
	var newState = states[newStateName];
	var enterFlag = State.options.enterCallback + newStateName;
	var enterResult;

	if (!this[enterFlag]) {
		this[enterFlag] = true;

		if (isObject(newState)) {
			enterResult = getValue(newState, State.options.enterCallback, this.context);
		} else {
			enterResult = getValue(states, newStateName, this.context);
		}

		//ignore entering falsy state
		if (enterResult === false) {
			this.set(oldValue);
			this[enterFlag] = false;
			// console.groupEnd();
			return false;
		}

		//redirect if returned anything but current state
		else if (enterResult !== undefined && enterResult !== value) {
			this.set(enterResult);
			this[enterFlag] = false;
			// console.groupEnd();
			return false;
		}

		this[enterFlag] = false;
	}



	//notify change
	if (value !== oldValue)	{
		this.emit(State.options.changeCallback, value, oldValue);
	}


	// console.groupEnd();

	//return context to chain calls
	return this.context;
};


/** Get current state */

proto.get = function(){
	return this.state;
};


/** Return value or fn result */
function getValue(holder, meth, ctx){
	if (typeof holder[meth] === 'function') {
		return holder[meth].call(ctx);
	}

	return holder[meth];
}


module.exports = State;
},{"events":1,"is-plain-object":28}],7:[function(require,module,exports){
/**
 * Simple draggable component
 *
 * @module draggy
 */


//work with css
var css = require('mucss/css');
var parseCSSValue = require('mucss/parse-value');
var selection = require('mucss/selection');
var offsets = require('mucss/offset');
var getTranslate = require('mucss/translate');
var intersect = require('intersects');
var isFixed = require('mucss/is-fixed');

//events
var on = require('emmy/on');
var off = require('emmy/off');
var emit = require('emmy/emit');
var Emitter = require('events');
var getClientX = require('get-client-xy').x;
var getClientY = require('get-client-xy').y;

//utils
var isArray = require('mutype/is-array');
var isNumber = require('mutype/is-number');
var isString = require('mutype/is-string');
var isFn = require('mutype/is-fn');
var defineState = require('define-state');
var extend = require('xtend/mutable');
var round = require('mumath/round');
var between = require('mumath/clamp');
var loop = require('mumath/mod');
var getUid = require('get-uid');
var inherits =  require('inherits');


var win = window, doc = document, root = doc.documentElement;


/**
 * Draggable controllers associated with elements.
 *
 * Storing them on elements is
 * - leak-prone,
 * - pollutes element’s namespace,
 * - requires some artificial key to store,
 * - unable to retrieve controller easily.
 *
 * That is why weakmap.
 */
var draggableCache = Draggable.cache = new WeakMap;



/**
 * Make an element draggable.
 *
 * @constructor
 *
 * @param {HTMLElement} target An element whether in/out of DOM
 * @param {Object} options An draggable options
 *
 * @return {HTMLElement} Target element
 */
function Draggable(target, options) {
	if (!(this instanceof Draggable)) {
		return new Draggable(target, options);
	}

	var self = this;

	//ignore existing instance
	var instance = draggableCache.get(target);
	if (instance) {
		instance.state = 'reset';

		//take over options
		extend(instance, options);

		instance.update();

		return instance;
	}

	else {
		//get unique id for instance
		//needed to track event binders
		self.id = getUid();
		self._ns = '.draggy_' + self.id;

		//save element passed
		self.element = target;

		draggableCache.set(target, self);
	}

	//define state behaviour
	defineState(self, 'state', self.state);

	//preset handles
	self.currentHandles = [];

	//take over options
	extend(self, options);

	//define handle
	if (self.handle === undefined) {
		self.handle = self.element;
	}

	//setup droppable
	if (self.droppable) {
		self.initDroppable();
	}

	//try to calc out basic limits
	self.update();

	//go to initial state
	self.state = 'idle';
}


/** Inherit draggable from Emitter */
inherits(Draggable, Emitter);


//enable css3 by default
Draggable.prototype.css3 = true;

//both axes by default
Draggable.prototype.axis = null;


/** Init droppable "plugin" */
Draggable.prototype.initDroppable = function () {
	var self = this;

	on(self, 'dragstart', function () {
		var self = this;
		self.dropTargets = q(self.droppable);
	});

	on(self, 'drag', function () {
		var self = this;

		if (!self.dropTargets) {
			return;
		}

		var selfRect = offsets(self.element);

		self.dropTargets.forEach(function (dropTarget) {
			var targetRect = offsets(dropTarget);

			if (intersect(selfRect, targetRect, self.droppableTolerance)) {
				if (self.droppableClass) {
					dropTarget.classList.add(self.droppableClass);
				}
				if (!self.dropTarget) {
					self.dropTarget = dropTarget;

					emit(self, 'dragover', dropTarget);
					emit(dropTarget, 'dragover', self);
				}
			}
			else {
				if (self.dropTarget) {
					emit(self, 'dragout', dropTarget);
					emit(dropTarget, 'dragout', self);

					self.dropTarget = null;
				}
				if (self.droppableClass) {
					dropTarget.classList.remove(self.droppableClass);
				}
			}
		});
	});

	on(self, 'dragend', function () {
		var self = this;

		//emit drop, if any
		if (self.dropTarget) {
			emit(self.dropTarget, 'drop', self);
			emit(self, 'drop', self.dropTarget);
			self.dropTarget.classList.remove(self.droppableClass);
			self.dropTarget = null;
		}
	});
};


/**
 * Draggable behaviour
 * @enum {string}
 * @default is 'idle'
 */
Draggable.prototype.state = {
	//idle
	_: {
		before: function () {
			var self = this;

			self.element.classList.add('draggy-idle');

			//emit drag evts on element
			emit(self.element, 'idle', null, true);
			self.emit('idle');

			//reset keys
			self.ctrlKey = false;
			self.shiftKey = false;
			self.metaKey = false;
			self.altKey = false;

			//reset movement params
			self.movementX = 0;
			self.movementY = 0;
			self.deltaX = 0;
			self.deltaY = 0;

			on(doc, 'mousedown' + self._ns + ' touchstart' + self._ns, function (e) {
				//ignore non-draggy events
				if (!e.draggies) {
					return;
				}

				//ignore dragstart for not registered draggies
				if (e.draggies.indexOf(self) < 0) {
					return;
				}

				//if target is focused - ignore drag
				//FIXME: detect focused by whitelist of tags, name supposition may be wrong (idk, form elements have names, so likely to be focused by click)
				if (e.target.name !== undefined) {
					return;
				}

				//multitouch has multiple starts
				self.setTouch(e);

				//update movement params
				self.update(e);

				//go to threshold state
				self.state = 'threshold';
			});
		},
		after: function () {
			var self = this;

			self.element.classList.remove('draggy-idle');

			off(doc, self._ns);

			//set up tracking
			if (self.release) {
				self._trackingInterval = setInterval(function (e) {
					var now = Date.now();
					var elapsed = now - self.timestamp;

					//get delta movement since the last track
					var dX = self.prevX - self.frame[0];
					var dY = self.prevY - self.frame[1];
					self.frame[0] = self.prevX;
					self.frame[1] = self.prevY;

					var delta = Math.sqrt(dX * dX + dY * dY);

					//get speed as average of prev and current (prevent div by zero)
					var v = Math.min(self.velocity * delta / (1 + elapsed), self.maxSpeed);
					self.speed = 0.8 * v + 0.2 * self.speed;

					//get new angle as a last diff
					//NOTE: vector average isn’t the same as speed scalar average
					self.angle = Math.atan2(dY, dX);

					self.emit('track');

					return self;
				}, self.framerate);
			}
		}
	},

	threshold: {
		before: function () {
			var self = this;

			//ignore threshold state, if threshold is none
			if (isZeroArray(self.threshold)) {
				self.state = 'drag';
				return;
			}

			self.element.classList.add('draggy-threshold');

			//emit drag evts on element
			self.emit('threshold');
			emit(self.element, 'threshold');

			//listen to doc movement
			on(doc, 'touchmove' + self._ns + ' mousemove' + self._ns, function (e) {
				e.preventDefault();

				//compare movement to the threshold
				var clientX = getClientX(e, self.touchIdx);
				var clientY = getClientY(e, self.touchIdx);
				var difX = self.prevMouseX - clientX;
				var difY = self.prevMouseY - clientY;

				if (difX < self.threshold[0] || difX > self.threshold[2] || difY < self.threshold[1] || difY > self.threshold[3]) {
					self.update(e);
					self.state = 'drag';
				}
			});
			on(doc, 'mouseup' + self._ns + ' touchend' + self._ns + '', function (e) {
				e.preventDefault();

				//forget touches
				self.resetTouch();

				self.state = 'idle';
			});
		},

		after: function () {
			var self = this;

			self.element.classList.remove('draggy-threshold');

			off(doc, self._ns);
		}
	},

	drag: {
		before: function () {
			var self = this;

			//reduce dragging clutter
			selection.disable(root);

			self.element.classList.add('draggy-drag');

			//emit drag evts on element
			self.emit('dragstart');
			emit(self.element, 'dragstart', null, true);

			//emit drag events on self
			self.emit('drag');
			emit(self.element, 'drag', null, true);

			//stop drag on leave
			on(doc, 'touchend' + self._ns + ' mouseup' + self._ns + ' mouseleave' + self._ns, function (e) {
				e.preventDefault();

				//forget touches - dragend is called once
				self.resetTouch();

				//manage release movement
				if (self.speed > 1) {
					self.state = 'release';
				}

				else {
					self.state = 'idle';
				}
			});

			//move via transform
			on(doc, 'touchmove' + self._ns + ' mousemove' + self._ns, function (e) {
				self.drag(e);
			});
		},

		after: function () {
			var self = this;

			//enable document interactivity
			selection.enable(root);

			self.element.classList.remove('draggy-drag');

			//emit dragend on element, this
			self.emit('dragend');
			emit(self.element, 'dragend', null, true);

			//unbind drag events
			off(doc, self._ns);

			clearInterval(self._trackingInterval);
		}
	},

	release: {
		before: function () {
			var self = this;

			self.element.classList.add('draggy-release');

			//enter animation mode
			clearTimeout(self._animateTimeout);

			//set proper transition
			css(self.element, {
				'transition': (self.releaseDuration) + 'ms ease-out ' + (self.css3 ? 'transform' : 'position')
			});

			//plan leaving anim mode
			self._animateTimeout = setTimeout(function () {
				self.state = 'idle';
			}, self.releaseDuration);


			//calc target point & animate to it
			self.move(
				self.prevX + self.speed * Math.cos(self.angle),
				self.prevY + self.speed * Math.sin(self.angle)
			);

			self.speed = 0;
			self.emit('track');
		},

		after: function () {
			var self = this;

			self.element.classList.remove('draggy-release');

			css(this.element, {
				'transition': null
			});
		}
	},

	reset: function () {
		var self = this;

		self.currentHandles.forEach(function (handle) {
			off(handle, self._ns);
		});

		clearTimeout(self._animateTimeout);

		off(doc, self._ns);
		off(self.element, self._ns);

		return '_';
	}
};


/** Drag handler. Needed to provide drag movement emulation via API */
Draggable.prototype.drag = function (e) {
	var self = this;

	e.preventDefault();

	var mouseX = getClientX(e, self.touchIdx),
		mouseY = getClientY(e, self.touchIdx);

	//calc mouse movement diff
	var diffMouseX = mouseX - self.prevMouseX,
		diffMouseY = mouseY - self.prevMouseY;

	//absolute mouse coordinate
	var mouseAbsX = mouseX,
		mouseAbsY = mouseY;

	//if we are not fixed, our absolute position is relative to the doc
	if (!self._isFixed) {
		mouseAbsX += win.pageXOffset;
		mouseAbsY += win.pageYOffset;
	}

	//calc sniper offset, if any
	if (e.ctrlKey || e.metaKey) {
		self.sniperOffsetX += diffMouseX * self.sniperSlowdown;
		self.sniperOffsetY += diffMouseY * self.sniperSlowdown;
	}

	//save refs to the meta keys
	self.ctrlKey = e.ctrlKey;
	self.shiftKey = e.shiftKey;
	self.metaKey = e.metaKey;
	self.altKey = e.altKey;

	//calc movement x and y
	//take absolute placing as it is the only reliable way (2x proved)
	var x = (mouseAbsX - self.initOffsetX) - self.innerOffsetX - self.sniperOffsetX,
		y = (mouseAbsY - self.initOffsetY) - self.innerOffsetY - self.sniperOffsetY;

	//move element
	self.move(x, y);

	//save prevClientXY for calculating diff
	self.prevMouseX = mouseX;
	self.prevMouseY = mouseY;

	//emit drag
	self.emit('drag');
	emit(self.element, 'drag', null, true);
};


/** Current number of draggable touches */
var touches = 0;


/** Manage touches */
Draggable.prototype.setTouch = function (e) {
	if (!e.touches || this.isTouched()) return this;

	//current touch index
	this.touchIdx = touches;
	touches++;

	return this;
};
Draggable.prototype.resetTouch = function () {
	touches = 0;
	this.touchIdx = null;

	return this;
};
Draggable.prototype.isTouched = function () {
	return this.touchIdx !== null;
};


/** Index to fetch touch number from event */
Draggable.prototype.touchIdx = null;


/**
 * Update movement limits.
 * Refresh self.withinOffsets and self.limits.
 */
Draggable.prototype.update = function (e) {
	var self = this;

	self._isFixed = isFixed(self.element);

	//enforce abs position
	if (!self.css3) {
		css(this.element, 'position', 'absolute');
	}

	//update handles
	self.currentHandles.forEach(function (handle) {
		off(handle, self._ns);
	});

	var cancelEls = q(self.cancel);

	self.currentHandles = q(self.handle);

	self.currentHandles.forEach(function (handle) {
		on(handle, 'mousedown' + self._ns + ' touchstart' + self._ns, function (e) {
			//mark event as belonging to the draggy
			if (!e.draggies) {
				e.draggies = [];
			}

			//ignore draggies containing other draggies
			if (e.draggies.some(function (draggy) {
				return self.element.contains(draggy.element);
			})) {
				return;
			}
			//ignore events happened within cancelEls
			if (cancelEls.some(function (cancelEl) {
				return cancelEl.contains(e.target);
			})) {
				return;
			}

			//register draggy
			e.draggies.push(self);
		});
	});

	//update limits
	self.updateLimits();

	//preset inner offsets
	self.innerOffsetX = self.pin[0];
	self.innerOffsetY = self.pin[1];

	var selfClientRect = self.element.getBoundingClientRect();

	//if event passed - update acc to event
	if (e) {
		//take last mouse position from the event
		self.prevMouseX = getClientX(e, self.touchIdx);
		self.prevMouseY = getClientY(e, self.touchIdx);

		//if mouse is within the element - take offset normally as rel displacement
		self.innerOffsetX = -selfClientRect.left + getClientX(e, self.touchIdx);
		self.innerOffsetY = -selfClientRect.top + getClientY(e, self.touchIdx);
	}
	//if no event - suppose pin-centered event
	else {
		//take mouse position & inner offset as center of pin
		var pinX = (self.pin[0] + self.pin[2] ) * 0.5;
		var pinY = (self.pin[1] + self.pin[3] ) * 0.5;
		self.prevMouseX = selfClientRect.left + pinX;
		self.prevMouseY = selfClientRect.top + pinY;
		self.innerOffsetX = pinX;
		self.innerOffsetY = pinY;
	}

	//set initial kinetic props
	self.speed = 0;
	self.amplitude = 0;
	self.angle = 0;
	self.timestamp = +new Date();
	self.frame = [self.prevX, self.prevY];

	//set sniper offset
	self.sniperOffsetX = 0;
	self.sniperOffsetY = 0;
};

/**
 * Update limits only from current position
 */
Draggable.prototype.updateLimits = function () {
	var self = this;

	//initial translation offsets
	var initXY = self.getCoords();

	//calc initial coords
	self.prevX = initXY[0];
	self.prevY = initXY[1];
	self.initX = initXY[0];
	self.initY = initXY[1];

	//container rect might be outside the vp, so calc absolute offsets
	//zero-position offsets, with translation(0,0)
	var selfOffsets = offsets(self.element);

	self.initOffsetX = selfOffsets.left - self.prevX;
	self.initOffsetY = selfOffsets.top - self.prevY;
	self.offsets = selfOffsets;

	//handle parent case
	var within = self.within;
	if (self.within === 'parent') {
		within = self.element.parentNode;
	}
	within = within || doc;

	//absolute offsets of a container
	var withinOffsets = offsets(within);
	if (within === win && self._isFixed) {
		withinOffsets.top -= win.pageYOffset;
		withinOffsets.left -= win.pageXOffset;
		withinOffsets.bottom -= win.pageYOffset;
		withinOffsets.right -= win.pageXOffset;
	}
	self.withinOffsets = withinOffsets;

	//calculate movement limits - pin width might be wider than constraints
	self.overflowX = self.pin.width - withinOffsets.width;
	self.overflowY = self.pin.height - withinOffsets.height;
	self.limits = {
		left: withinOffsets.left - self.initOffsetX - self.pin[0] - (self.overflowX < 0 ? 0 : self.overflowX),
		top: withinOffsets.top - self.initOffsetY - self.pin[1] - (self.overflowY < 0 ? 0 : self.overflowY),
		right: self.overflowX > 0 ? 0 : withinOffsets.right - self.initOffsetX - self.pin[2],
		bottom: self.overflowY > 0 ? 0 : withinOffsets.bottom - self.initOffsetY - self.pin[3]
	};
};

/**
 * Update info regarding of movement
 */
Draggable.prototype.updateInfo = function (x, y) {
	var self = this;

	//provide delta from prev state
	self.deltaX = x - self.prevX;
	self.deltaY = y - self.prevY;

	//save prev coords to use as a start point next time
	self.prevX = x;
	self.prevY = y;

	//provide movement delta from initial state
	self.movementX = x - self.initX;
	self.movementY = y - self.initY;

}


/**
 * Way of placement:
 * - css3 === false (slower but more precise and cross-browser)
 * - css3 === true (faster but may cause blurs on linux systems)
 */
Draggable.prototype.getCoords = function () {
	if (!this.css3) {
		// return [this.element.offsetLeft, this.element.offsetTop];
		return [parseCSSValue(css(this.element,'left')), parseCSSValue(css(this.element, 'top'))];
	}
	else {
		return getTranslate(this.element).slice(0, 2) || [0,0];
	}
};
Draggable.prototype.setCoords = function (x, y) {
	if (this.css3) {
		if (x == null) x = this.prevX;
		if (y == null) y = this.prevY;

		x = round(x, this.precision);
		y = round(y, this.precision);

		css(this.element, 'transform', ['translate3d(', x, 'px,', y, 'px, 0)'].join(''));

		this.updateInfo(x, y);
	}
	else {
		if (x == null) x = this.prevX;
		if (y == null) y = this.prevY;

		x = round(x, this.precision);
		y = round(y, this.precision);

		css(this.element, {
			left: x,
			top: y
		});

		//update movement info
		this.updateInfo(x, y);
	}
};


/**
 * Restricting container
 * @type {Element|object}
 * @default doc.documentElement
 */
Draggable.prototype.within = doc;


/** Handle to drag */
Draggable.prototype.handle;


Object.defineProperties(Draggable.prototype, {
	/**
	 * Which area of draggable should not be outside the restriction area.
	 * @type {(Array|number)}
	 * @default [0,0,this.element.offsetWidth, this.element.offsetHeight]
	 */
	pin: {
		set: function (value) {
			if (isArray(value)) {
				if (value.length === 2) {
					this._pin = [value[0], value[1], value[0], value[1]];
				} else if (value.length === 4) {
					this._pin = value;
				}
			}

			else if (isNumber(value)) {
				this._pin = [value, value, value, value];
			}

			else {
				this._pin = value;
			}

			//calc pin params
			this._pin.width = this._pin[2] - this._pin[0];
			this._pin.height = this._pin[3] - this._pin[1];
		},

		get: function () {
			if (this._pin) return this._pin;

			//returning autocalculated pin, if private pin is none
			var pin = [0,0, this.offsets.width, this.offsets.height];
			pin.width = this.offsets.width;
			pin.height = this.offsets.height;
			return pin;
		}
	},

	/** Avoid initial mousemove */
	threshold: {
		set: function (val) {
			if (isNumber(val)) {
				this._threshold = [-val*0.5, -val*0.5, val*0.5, val*0.5];
			} else if (val.length === 2) {
				//Array(w,h)
				this._threshold = [-val[0]*0.5, -val[1]*0.5, val[0]*0.5, val[1]*0.5];
			} else if (val.length === 4) {
				//Array(x1,y1,x2,y2)
				this._threshold = val;
			} else if (isFn(val)) {
				//custom val funciton
				this._threshold = val();
			} else {
				this._threshold = [0,0,0,0];
			}
		},

		get: function () {
			return this._threshold || [0,0,0,0];
		}
	}
});



/**
 * For how long to release movement
 *
 * @type {(number|false)}
 * @default false
 * @todo
 */
Draggable.prototype.release = false;
Draggable.prototype.releaseDuration = 500;
Draggable.prototype.velocity = 1000;
Draggable.prototype.maxSpeed = 250;
Draggable.prototype.framerate = 50;


/** To what extent round position */
Draggable.prototype.precision = 1;


/** Droppable params */
Draggable.prototype.droppable = null;
Draggable.prototype.droppableTolerance = 0.5;
Draggable.prototype.droppableClass = null;


/** Slow down movement by pressing ctrl/cmd */
Draggable.prototype.sniper = true;


/** How much to slow sniper drag */
Draggable.prototype.sniperSlowdown = .85;


/**
 * Restrict movement by axis
 *
 * @default undefined
 * @enum {string}
 */
Draggable.prototype.move = function (x, y) {
	if (this.axis === 'x') {
		if (x == null) x = this.prevX;
		if (y == null) y = this.prevY;

		var limits = this.limits;

		if (this.repeat) {
			var w = (limits.right - limits.left);
			var oX = - this.initOffsetX + this.withinOffsets.left - this.pin[0] - Math.max(0, this.overflowX);
			x = loop(x - oX, w) + oX;
		} else {
			x = between(x, limits.left, limits.right);
		}

		this.setCoords(x);
	}
	else if (this.axis === 'y') {
		if (x == null) x = this.prevX;
		if (y == null) y = this.prevY;

		var limits = this.limits;

		if (this.repeat) {
			var h = (limits.bottom - limits.top);
			var oY = - this.initOffsetY + this.withinOffsets.top - this.pin[1] - Math.max(0, this.overflowY);
			y = loop(y - oY, h) + oY;
		} else {
			y = between(y, limits.top, limits.bottom);
		}

		this.setCoords(null, y);
	}
	else {
		if (x == null) x = this.prevX;
		if (y == null) y = this.prevY;

		var limits = this.limits;

		if (this.repeat) {
			var w = (limits.right - limits.left);
			var h = (limits.bottom - limits.top);
			var oX = - this.initOffsetX + this.withinOffsets.left - this.pin[0] - Math.max(0, this.overflowX);
			var oY = - this.initOffsetY + this.withinOffsets.top - this.pin[1] - Math.max(0, this.overflowY);
			if (this.repeat === 'x') {
				x = loop(x - oX, w) + oX;
			}
			else if (this.repeat === 'y') {
				y = loop(y - oY, h) + oY;
			}
			else {
				x = loop(x - oX, w) + oX;
				y = loop(y - oY, h) + oY;
			}
		}

		x = between(x, limits.left, limits.right);
		y = between(y, limits.top, limits.bottom);

		this.setCoords(x, y);
	}
};


/** Repeat movement by one of axises */
Draggable.prototype.repeat = false;


/** Check whether arr is filled with zeros */
function isZeroArray(arr) {
	if (!arr[0] && !arr[1] && !arr[2] && !arr[3]) return true;
}



/** Clean all memory-related things */
Draggable.prototype.destroy = function () {
	var self = this;

	self.currentHandles.forEach(function (handle) {
		off(handle, self._ns);
	});

	self.state = 'destroy';

	clearTimeout(self._animateTimeout);

	off(doc, self._ns);
	off(self.element, self._ns);


	self.element = null;
	self.within = null;
};



//little helpers

function q (str) {
	if (Array.isArray(str)) {
		return str.map(q).reduce( function (prev, curr) { return prev.concat(curr); }, [] );
	}
	else if (str instanceof HTMLElement) {
		return [str];
	}
	else {
		return [].slice.call(document.querySelectorAll(str));
	}
}


module.exports = Draggable;
},{"define-state":5,"emmy/emit":12,"emmy/off":21,"emmy/on":22,"events":1,"get-client-xy":23,"get-uid":24,"inherits":25,"intersects":27,"mucss/css":33,"mucss/is-fixed":36,"mucss/offset":38,"mucss/parse-value":40,"mucss/selection":44,"mucss/translate":45,"mumath/clamp":46,"mumath/mod":47,"mumath/round":49,"mutype/is-array":8,"mutype/is-fn":9,"mutype/is-number":10,"mutype/is-string":11,"xtend/mutable":59}],8:[function(require,module,exports){
module.exports = function(a){
	return a instanceof Array;
}
},{}],9:[function(require,module,exports){
module.exports = function(a){
	return !!(a && a.apply);
}
},{}],10:[function(require,module,exports){
module.exports = function(a){
	return typeof a === 'number' || a instanceof Number;
}
},{}],11:[function(require,module,exports){
module.exports = function(a){
	return typeof a === 'string' || a instanceof String;
}
},{}],12:[function(require,module,exports){
/**
 * @module emmy/emit
 */
var icicle = require('icicle');
var slice = require('sliced');
var isString = require('mutype/is-string');
var isNode = require('mutype/is-node');
var isEvent = require('mutype/is-event');
var listeners = require('./listeners');


/**
 * A simple wrapper to handle stringy/plain events
 */
module.exports = function(target, evt){
	if (!target) return;

	var args = arguments;
	if (isString(evt)) {
		args = slice(arguments, 2);
		evt.split(/\s+/).forEach(function(evt){
			evt = evt.split('.')[0];

			emit.apply(this, [target, evt].concat(args));
		});
	} else {
		return emit.apply(this, args);
	}
};


/** detect env */
var $ = typeof jQuery === 'undefined' ? undefined : jQuery;
var doc = typeof document === 'undefined' ? undefined : document;
var win = typeof window === 'undefined' ? undefined : window;


/**
 * Emit an event, optionally with data or bubbling
 * Accept only single elements/events
 *
 * @param {string} eventName An event name, e. g. 'click'
 * @param {*} data Any data to pass to event.details (DOM) or event.data (elsewhere)
 * @param {bool} bubbles Whether to trigger bubbling event (DOM)
 *
 *
 * @return {target} a target
 */
function emit(target, eventName, data, bubbles){
	var emitMethod, evt = eventName;

	//Create proper event for DOM objects
	if (isNode(target) || target === win) {
		//NOTE: this doesnot bubble on off-DOM elements

		if (isEvent(eventName)) {
			evt = eventName;
		} else {
			//IE9-compliant constructor
			evt = doc.createEvent('CustomEvent');
			evt.initCustomEvent(eventName, bubbles, true, data);

			//a modern constructor would be:
			// var evt = new CustomEvent(eventName, { detail: data, bubbles: bubbles })
		}

		emitMethod = target.dispatchEvent;
	}

	//create event for jQuery object
	else if ($ && target instanceof $) {
		//TODO: decide how to pass data
		evt = $.Event( eventName, data );
		evt.detail = data;

		//FIXME: reference case where triggerHandler needed (something with multiple calls)
		emitMethod = bubbles ? targte.trigger : target.triggerHandler;
	}

	//detect target events
	else {
		//emit - default
		//trigger - jquery
		//dispatchEvent - DOM
		//raise - node-state
		//fire - ???
		emitMethod = target['dispatchEvent'] || target['emit'] || target['trigger'] || target['fire'] || target['raise'];
	}


	var args = slice(arguments, 2);


	//use locks to avoid self-recursion on objects wrapping this method
	if (emitMethod) {
		if (icicle.freeze(target, 'emit' + eventName)) {
			//use target event system, if possible
			emitMethod.apply(target, [evt].concat(args));
			icicle.unfreeze(target, 'emit' + eventName);

			return target;
		}

		//if event was frozen - probably it is emitter instance
		//so perform normal callback
	}


	//fall back to default event system
	var evtCallbacks = listeners(target, evt);

	//copy callbacks to fire because list can be changed by some callback (like `off`)
	var fireList = slice(evtCallbacks);
	for (var i = 0; i < fireList.length; i++ ) {
		fireList[i] && fireList[i].apply(target, args);
	}

	return target;
}
},{"./listeners":13,"icicle":14,"mutype/is-event":16,"mutype/is-node":17,"mutype/is-string":19,"sliced":20}],13:[function(require,module,exports){
/**
 * A storage of per-target callbacks.
 * WeakMap is the most safe solution.
 *
 * @module emmy/listeners
 */


/**
 * Property name to provide on targets.
 *
 * Can’t use global WeakMap -
 * it is impossible to provide singleton global cache of callbacks for targets
 * not polluting global scope. So it is better to pollute target scope than the global.
 *
 * Otherwise, each emmy instance will create it’s own cache, which leads to mess.
 *
 * Also can’t use `._events` property on targets, as it is done in `events` module,
 * because it is incompatible. Emmy targets universal events wrapper, not the native implementation.
 */
var cbPropName = '_callbacks';


/**
 * Get listeners for the target/evt (optionally).
 *
 * @param {object} target a target object
 * @param {string}? evt an evt name, if undefined - return object with events
 *
 * @return {(object|array)} List/set of listeners
 */
function listeners(target, evt, tags){
	var cbs = target[cbPropName];
	var result;

	if (!evt) {
		result = cbs || {};

		//filter cbs by tags
		if (tags) {
			var filteredResult = {};
			for (var evt in result) {
				filteredResult[evt] = result[evt].filter(function (cb) {
					return hasTags(cb, tags);
				});
			}
			result = filteredResult;
		}

		return result;
	}

	if (!cbs || !cbs[evt]) {
		return [];
	}

	result = cbs[evt];

	//if there are evt namespaces specified - filter callbacks
	if (tags && tags.length) {
		result = result.filter(function (cb) {
			return hasTags(cb, tags);
		});
	}

	return result;
}


/**
 * Remove listener, if any
 */
listeners.remove = function(target, evt, cb, tags){
	//get callbacks for the evt
	var evtCallbacks = target[cbPropName];
	if (!evtCallbacks || !evtCallbacks[evt]) return false;

	var callbacks = evtCallbacks[evt];

	//if tags are passed - make sure callback has some tags before removing
	if (tags && tags.length && !hasTags(cb, tags)) return false;

	//remove specific handler
	for (var i = 0; i < callbacks.length; i++) {
		//once method has original callback in .cb
		if (callbacks[i] === cb || callbacks[i].fn === cb) {
			callbacks.splice(i, 1);
			break;
		}
	}
};


/**
 * Add a new listener
 */
listeners.add = function(target, evt, cb, tags){
	if (!cb) return;

	var targetCallbacks = target[cbPropName];

	//ensure set of callbacks for the target exists
	if (!targetCallbacks) {
		targetCallbacks = {};
		Object.defineProperty(target, cbPropName, {
			value: targetCallbacks
		});
	}

	//save a new callback
	(targetCallbacks[evt] = targetCallbacks[evt] || []).push(cb);

	//save ns for a callback, if any
	if (tags && tags.length) {
		cb._ns = tags;
	}
};


/** Detect whether an cb has at least one tag from the list */
function hasTags(cb, tags){
	if (cb._ns) {
		//if cb is tagged with a ns and includes one of the ns passed - keep it
		for (var i = tags.length; i--;){
			if (cb._ns.indexOf(tags[i]) >= 0) return true;
		}
	}
}


module.exports = listeners;
},{}],14:[function(require,module,exports){
/**
 * @module Icicle
 */
module.exports = {
	freeze: lock,
	unfreeze: unlock,
	isFrozen: isLocked
};


/** Set of targets  */
var lockCache = new WeakMap;


/**
 * Set flag on target with the name passed
 *
 * @return {bool} Whether lock succeeded
 */
function lock(target, name){
	var locks = lockCache.get(target);
	if (locks && locks[name]) return false;

	//create lock set for a target, if none
	if (!locks) {
		locks = {};
		lockCache.set(target, locks);
	}

	//set a new lock
	locks[name] = true;

	//return success
	return true;
}


/**
 * Unset flag on the target with the name passed.
 *
 * Note that if to return new value from the lock/unlock,
 * then unlock will always return false and lock will always return true,
 * which is useless for the user, though maybe intuitive.
 *
 * @param {*} target Any object
 * @param {string} name A flag name
 *
 * @return {bool} Whether unlock failed.
 */
function unlock(target, name){
	var locks = lockCache.get(target);
	if (!locks || !locks[name]) return false;

	locks[name] = null;

	return true;
}


/**
 * Return whether flag is set
 *
 * @param {*} target Any object to associate lock with
 * @param {string} name A flag name
 *
 * @return {Boolean} Whether locked or not
 */
function isLocked(target, name){
	var locks = lockCache.get(target);
	return (locks && locks[name]);
}
},{}],15:[function(require,module,exports){
module.exports = function(a){
	return a instanceof Array;
}
},{}],16:[function(require,module,exports){
module.exports = function(target){
	return typeof Event !== 'undefined' && target instanceof Event;
};
},{}],17:[function(require,module,exports){
module.exports = function(target){
	return typeof document !== 'undefined' && target instanceof Node;
};
},{}],18:[function(require,module,exports){
/**
 * @module mutype/is-object
 */

//TODO: add st8 tests

//isPlainObject indeed
module.exports = function(o){
	// return obj === Object(obj);
	return !!o && typeof o === 'object' && o.constructor === Object;
};
},{}],19:[function(require,module,exports){
module.exports = function(a){
	return typeof a === 'string' || a instanceof String;
}
},{}],20:[function(require,module,exports){

/**
 * An Array.prototype.slice.call(arguments) alternative
 *
 * @param {Object} args something with a length
 * @param {Number} slice
 * @param {Number} sliceEnd
 * @api public
 */

module.exports = function (args, slice, sliceEnd) {
  var ret = [];
  var len = args.length;

  if (0 === len) return ret;

  var start = slice < 0
    ? Math.max(0, slice + len)
    : slice || 0;

  if (sliceEnd !== undefined) {
    len = sliceEnd < 0
      ? sliceEnd + len
      : sliceEnd
  }

  while (len-- > start) {
    ret[len - start] = args[len];
  }

  return ret;
}

},{}],21:[function(require,module,exports){
/**
 * @module emmy/off
 */
module.exports = off;

var icicle = require('icicle');
var slice = require('sliced');
var listeners = require('./listeners');
var isArray = require('mutype/is-array');


/**
 * Remove listener[s] from the target
 *
 * @param {[type]} evt [description]
 * @param {Function} fn [description]
 *
 * @return {[type]} [description]
 */
function off(target, evt, fn) {
	if (!target) return target;

	var callbacks, i;

	//unbind all listeners if no fn specified
	if (fn === undefined) {
		var args = slice(arguments, 1);

		//try to use target removeAll method, if any
		var allOff = target['removeAll'] || target['removeAllListeners'];

		//call target removeAll
		if (allOff) {
			allOff.apply(target, args);
		}


		//then forget own callbacks, if any

		//unbind all evts
		if (!evt) {
			callbacks = listeners(target);
			for (evt in callbacks) {
				off(target, evt);
			}
		}
		//unbind all callbacks for an evt
		else {
			evt = '' + evt;

			//invoke method for each space-separated event from a list
			evt.split(/\s+/).forEach(function (evt) {
				var evtParts = evt.split('.');
				evt = evtParts.shift();
				callbacks = listeners(target, evt, evtParts);

				//returned array of callbacks (as event is defined)
				if (evt) {
					var obj = {};
					obj[evt] = callbacks;
					callbacks = obj;
				}

				//for each group of callbacks - unbind all
				for (var evtName in callbacks) {
					slice(callbacks[evtName]).forEach(function (cb) {
						off(target, evtName, cb);
					});
				}
			});
		}

		return target;
	}


	//target events (string notation to advanced_optimizations)
	var offMethod = target['removeEventListener'] || target['removeListener'] || target['detachEvent'] || target['off'];

	//invoke method for each space-separated event from a list
	evt.split(/\s+/).forEach(function (evt) {
		var evtParts = evt.split('.');
		evt = evtParts.shift();

		//use target `off`, if possible
		if (offMethod) {
			//avoid self-recursion from the outside
			if (icicle.freeze(target, 'off' + evt)) {
				offMethod.call(target, evt, fn);
				icicle.unfreeze(target, 'off' + evt);
			}

			//if it’s frozen - ignore call
			else {
				return target;
			}
		}

		if (fn.closedCall) fn.closedCall = false;

		//forget callback
		listeners.remove(target, evt, fn, evtParts);
	});


	return target;
}
},{"./listeners":13,"icicle":14,"mutype/is-array":15,"sliced":20}],22:[function(require,module,exports){
/**
 * @module emmy/on
 */


var icicle = require('icicle');
var listeners = require('./listeners');
var isObject = require('mutype/is-object');

module.exports = on;


/**
 * Bind fn to a target.
 *
 * @param {*} targte A single target to bind evt
 * @param {string} evt An event name
 * @param {Function} fn A callback
 * @param {Function}? condition An optional filtering fn for a callback
 *                              which accepts an event and returns callback
 *
 * @return {object} A target
 */
function on(target, evt, fn){
	if (!target) return target;

	//consider object of events
	if (isObject(evt)) {
		for(var evtName in evt) {
			on(target, evtName, evt[evtName]);
		}
		return target;
	}

	//get target `on` method, if any
	//prefer native-like method name
	//user may occasionally expose `on` to the global, in case of browserify
	//but it is unlikely one would replace native `addEventListener`
	var onMethod =  target['addEventListener'] || target['addListener'] || target['attachEvent'] || target['on'];

	var cb = fn;

	evt = '' + evt;

	//invoke method for each space-separated event from a list
	evt.split(/\s+/).forEach(function(evt){
		var evtParts = evt.split('.');
		evt = evtParts.shift();

		//use target event system, if possible
		if (onMethod) {
			//avoid self-recursions
			//if it’s frozen - ignore call
			if (icicle.freeze(target, 'on' + evt)){
				onMethod.call(target, evt, cb);
				icicle.unfreeze(target, 'on' + evt);
			}
			else {
				return target;
			}
		}

		//save the callback anyway
		listeners.add(target, evt, cb, evtParts);
	});

	return target;
}


/**
 * Wrap an fn with condition passing
 */
on.wrap = function(target, evt, fn, condition){
	var cb = function() {
		if (condition.apply(target, arguments)) {
			return fn.apply(target, arguments);
		}
	};

	cb.fn = fn;

	return cb;
};
},{"./listeners":13,"icicle":14,"mutype/is-object":18}],23:[function(require,module,exports){
/**
 * Get clientY/clientY from an event.
 * If index is passed, treat it as index of global touches, not the targetTouches.
 * Global touches include target touches.
 *
 * @module get-client-xy
 *
 * @param {Event} e Event raised, like mousemove
 *
 * @return {number} Coordinate relative to the screen
 */
function getClientY (e, idx) {
	// touch event
	if (e.touches) {
		if (arguments.length > 1) {
			return findTouch(e.touches, idx).clientY
		}
		else {
			return e.targetTouches[0].clientY;
		}
	}

	// mouse event
	return e.clientY;
}
function getClientX (e, idx) {
	// touch event
	if (e.touches) {
		if (arguments.length > idx) {
			return findTouch(e.touches, idx).clientX;
		}
		else {
			return e.targetTouches[0].clientX;
		}
	}

	// mouse event
	return e.clientX;
}

function getClientXY (e, idx) {
	return [getClientX.apply(this, arguments), getClientY.apply(this, arguments)];
}

function findTouch (touchList, idx) {
	for (var i = 0; i < touchList.length; i++) {
		if (touchList[i].identifier === idx) {
			return touchList[i];
		}
	}
}


getClientXY.x = getClientX;
getClientXY.y = getClientY;
getClientXY.findTouch = findTouch;

module.exports = getClientXY;
},{}],24:[function(require,module,exports){
/** generate unique id for selector */
var counter = Date.now() % 1e9;

module.exports = function getUid(){
	return (Math.random() * 1e9 >>> 0) + (counter++);
};
},{}],25:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],26:[function(require,module,exports){
var containers = []; // will store container HTMLElement references
var styleElements = []; // will store {prepend: HTMLElement, append: HTMLElement}

module.exports = function (css, options) {
    options = options || {};

    var position = options.prepend === true ? 'prepend' : 'append';
    var container = options.container !== undefined ? options.container : document.querySelector('head');
    var containerId = containers.indexOf(container);

    // first time we see this container, create the necessary entries
    if (containerId === -1) {
        containerId = containers.push(container) - 1;
        styleElements[containerId] = {};
    }

    // try to get the correponding container + position styleElement, create it otherwise
    var styleElement;

    if (styleElements[containerId] !== undefined && styleElements[containerId][position] !== undefined) {
        styleElement = styleElements[containerId][position];
    } else {
        styleElement = styleElements[containerId][position] = createStyleElement();

        if (position === 'prepend') {
            container.insertBefore(styleElement, container.childNodes[0]);
        } else {
            container.appendChild(styleElement);
        }
    }

    // actually add the stylesheet
    if (styleElement.styleSheet) {
        styleElement.styleSheet.cssText += css
    } else {
        styleElement.textContent += css;
    }

    return styleElement;
};

function createStyleElement() {
    var styleElement = document.createElement('style');
    styleElement.setAttribute('type', 'text/css');
    return styleElement;
}

},{}],27:[function(require,module,exports){
/** @module  intersects */
module.exports = intersects;


var min = Math.min, max = Math.max;


/**
 * Main intersection detector.
 *
 * @param {Rectangle} a Target
 * @param {Rectangle} b Container
 *
 * @return {bool} Whether target is within the container
 */
function intersects (a, b, tolerance){
	//ignore definite disintersection
	if (a.right < b.left || a.left > b.right) return false;
	if (a.bottom < b.top || a.top > b.bottom) return false;

	//intersection values
	var iX = min(a.right - max(b.left, a.left), b.right - max(a.left, b.left));
	var iY = min(a.bottom - max(b.top, a.top), b.bottom - max(a.top, b.top));
	var iSquare = iX * iY;

	var bSquare = (b.bottom - b.top) * (b.right - b.left);
	var aSquare = (a.bottom - a.top) * (a.right - a.left);

	//measure square overlap relative to the min square
	var targetSquare = min(aSquare, bSquare);


	//minimal overlap ratio
	tolerance = tolerance !== undefined ? tolerance : 0.5;

	if (iSquare / targetSquare > tolerance) {
		return true;
	}

	return false;
}
},{}],28:[function(require,module,exports){
/*!
 * is-plain-object <https://github.com/jonschlinkert/is-plain-object>
 *
 * Copyright (c) 2014-2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

var isObject = require('isobject');

function isObjectObject(o) {
  return isObject(o) === true
    && Object.prototype.toString.call(o) === '[object Object]';
}

module.exports = function isPlainObject(o) {
  var ctor,prot;
  
  if (isObjectObject(o) === false) return false;
  
  // If has modified constructor
  ctor = o.constructor;
  if (typeof ctor !== 'function') return false;
  
  // If has modified prototype
  prot = ctor.prototype;
  if (isObjectObject(prot) === false) return false;
  
  // If constructor does not have an Object-specific method
  if (prot.hasOwnProperty('isPrototypeOf') === false) {
    return false;
  }
  
  // Most likely a plain Object
  return true;
};

},{"isobject":29}],29:[function(require,module,exports){
/*!
 * isobject <https://github.com/jonschlinkert/isobject>
 *
 * Copyright (c) 2014-2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

module.exports = function isObject(val) {
  return val != null && typeof val === 'object'
    && !Array.isArray(val);
};

},{}],30:[function(require,module,exports){
var dictionary = {
  words: [
    'ad',
    'adipisicing',
    'aliqua',
    'aliquip',
    'amet',
    'anim',
    'aute',
    'cillum',
    'commodo',
    'consectetur',
    'consequat',
    'culpa',
    'cupidatat',
    'deserunt',
    'do',
    'dolor',
    'dolore',
    'duis',
    'ea',
    'eiusmod',
    'elit',
    'enim',
    'esse',
    'est',
    'et',
    'eu',
    'ex',
    'excepteur',
    'exercitation',
    'fugiat',
    'id',
    'in',
    'incididunt',
    'ipsum',
    'irure',
    'labore',
    'laboris',
    'laborum',
    'Lorem',
    'magna',
    'minim',
    'mollit',
    'nisi',
    'non',
    'nostrud',
    'nulla',
    'occaecat',
    'officia',
    'pariatur',
    'proident',
    'qui',
    'quis',
    'reprehenderit',
    'sint',
    'sit',
    'sunt',
    'tempor',
    'ullamco',
    'ut',
    'velit',
    'veniam',
    'voluptate'  
  ]
};

module.exports = dictionary;
},{}],31:[function(require,module,exports){
var generator = function() {
  var options = (arguments.length) ? arguments[0] : {}
    , count = options.count || 1
    , units = options.units || 'sentences'
    , sentenceLowerBound = options.sentenceLowerBound || 5
    , sentenceUpperBound = options.sentenceUpperBound || 15
	  , paragraphLowerBound = options.paragraphLowerBound || 3
	  , paragraphUpperBound = options.paragraphUpperBound || 7
	  , format = options.format || 'plain'
    , words = options.words || require('./dictionary').words
    , random = options.random || Math.random
    , suffix = options.suffix || require('os').EOL;

  units = simplePluralize(units.toLowerCase());

  var randomInteger = function(min, max) {
    return Math.floor(random() * (max - min + 1) + min);
  };

  var randomWord = function(words) {
    return words[randomInteger(0, words.length - 1)];
  };

  var randomSentence = function(words, lowerBound, upperBound) {
    var sentence = ''
      , bounds = {min: 0, max: randomInteger(lowerBound, upperBound)};

    while (bounds.min < bounds.max) {
      sentence = sentence + ' ' + randomWord(words);
      bounds.min = bounds.min + 1;
    }

    if (sentence.length) {
      sentence = sentence.slice(1);
      sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);
    }

    return sentence;
  };

  var randomParagraph = function(words, lowerBound, upperBound, sentenceLowerBound, sentenceUpperBound) {
    var paragraph = ''
      , bounds = {min: 0, max: randomInteger(lowerBound, upperBound)};

    while (bounds.min < bounds.max) {
      paragraph = paragraph + '. ' + randomSentence(words, sentenceLowerBound, sentenceUpperBound);
      bounds.min = bounds.min + 1;
    }

    if (paragraph.length) {
      paragraph = paragraph.slice(2);
      paragraph = paragraph + '.';
    }

    return paragraph;
  }

  var iter = 0
    , bounds = {min: 0, max: count}
    , string = ''
    , prefix = '';

  if (format == 'html') {
    openingTag = '<p>';
    closingTag = '</p>';
  }

  while (bounds.min < bounds.max) {
    switch (units.toLowerCase()) {
      case 'words':
        string = string + ' ' + randomWord(words);
        break;
      case 'sentences':
        string = string + '. ' + randomSentence(words, sentenceLowerBound, sentenceUpperBound);
        break;
      case 'paragraphs':
        var nextString = randomParagraph(words, paragraphLowerBound, paragraphUpperBound, sentenceLowerBound, sentenceUpperBound);

        if (format == 'html') {
          nextString = openingTag + nextString + closingTag;
          if (bounds.min < bounds.max - 1) {
            nextString = nextString + suffix; // Each paragraph on a new line
          }
        } else if (bounds.min < bounds.max - 1) {
          nextString = nextString + suffix + suffix; // Double-up the EOL character to make distinct paragraphs, like carriage return
        }

        string = string + nextString;

        break;
    }

    bounds.min = bounds.min + 1;
  }

  if (string.length) {
    var pos = 0;

    if (string.indexOf('. ') == 0) {
      pos = 2;
    } else if (string.indexOf('.') == 0 || string.indexOf(' ') == 0) {
      pos = 1;
    }

    string = string.slice(pos);

    if (units == 'sentences') {
      string = string + '.';
    }
  }

  return string;
};

function simplePluralize(string) {
  if (string.indexOf('s', string.length - 1) === -1) {
    return string + 's';
  }
  return string;
}

module.exports = generator;

},{"./dictionary":30,"os":2}],32:[function(require,module,exports){
/**
 * Parse element’s borders
 *
 * @module mucss/borders
 */

var Rect = require('./rect');
var parse = require('./parse-value');

/**
 * Return border widths of an element
 */
module.exports = function(el){
	if (el === window) return Rect();

	if (!(el instanceof Element)) throw Error('Argument is not an element');

	var style = window.getComputedStyle(el);

	return Rect(
		parse(style.borderLeftWidth),
		parse(style.borderTopWidth),
		parse(style.borderRightWidth),
		parse(style.borderBottomWidth)
	);
};
},{"./parse-value":40,"./rect":42}],33:[function(require,module,exports){
/**
 * Get or set element’s style, prefix-agnostic.
 *
 * @module  mucss/css
 */
var fakeStyle = require('./fake-element').style;
var prefix = require('./prefix').lowercase;


/**
 * Apply styles to an element.
 *
 * @param    {Element}   el   An element to apply styles.
 * @param    {Object|string}   obj   Set of style rules or string to get style rule.
 */
module.exports = function(el, obj){
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
		if (typeof obj[name] === 'number' && /left|right|bottom|top|width|height/i.test(name)) obj[name] += 'px';

		value = obj[name] || '';

		el.style[prefixize(name)] = value;
	}
};


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
},{"./fake-element":34,"./prefix":41}],34:[function(require,module,exports){
/** Just a fake element to test styles
 * @module mucss/fake-element
 */

module.exports = document.createElement('div');
},{}],35:[function(require,module,exports){
/**
 * Window scrollbar detector.
 *
 * @module mucss/has-scroll
 */

//TODO: detect any element scroll, not only the window
exports.x = function () {
	return window.innerHeight > document.documentElement.clientHeight;
};
exports.y = function () {
	return window.innerWidth > document.documentElement.clientWidth;
};
},{}],36:[function(require,module,exports){
/**
 * Detect whether element is placed to fixed container or is fixed itself.
 *
 * @module mucss/is-fixed
 *
 * @param {(Element|Object)} el Element to detect fixedness.
 *
 * @return {boolean} Whether element is nested.
 */
module.exports = function (el) {
	var parentEl = el;

	//window is fixed, btw
	if (el === window) return true;

	//unlike the doc
	if (el === document) return false;

	while (parentEl) {
		if (getComputedStyle(parentEl).position === 'fixed') return true;
		parentEl = parentEl.offsetParent;
	}
	return false;
};
},{}],37:[function(require,module,exports){
/**
 * Get margins of an element.
 * @module mucss/margins
 */

var parse = require('./parse-value');
var Rect = require('./rect');

/**
 * Return margins of an element.
 *
 * @param    {Element}   el   An element which to calc margins.
 * @return   {Object}   Paddings object `{top:n, bottom:n, left:n, right:n}`.
 */
module.exports = function(el){
	if (el === window) return Rect();

	if (!(el instanceof Element)) throw Error('Argument is not an element');

	var style = window.getComputedStyle(el);

	return Rect(
		parse(style.marginLeft),
		parse(style.marginTop),
		parse(style.marginRight),
		parse(style.marginBottom)
	);
};
},{"./parse-value":40,"./rect":42}],38:[function(require,module,exports){
/**
 * Calculate absolute offsets of an element, relative to the document.
 *
 * @module mucss/offsets
 *
 */
var win = window;
var doc = document;
var Rect = require('./rect');
var hasScroll = require('./has-scroll');
var scrollbar = require('./scrollbar');
var isFixedEl = require('./is-fixed');
var getTranslate = require('./translate');


/**
 * Return absolute offsets of any target passed
 *
 * @param    {Element|window}   el   A target. Pass window to calculate viewport offsets
 * @return   {Object}   Offsets object with trbl.
 */
module.exports = offsets;

function offsets (el) {
	if (!el) throw Error('Bad argument');

	//calc client rect
	var cRect, result;

	//return vp offsets
	if (el === win) {
		result = Rect(
			win.pageXOffset,
			win.pageYOffset
		);

		result.width = win.innerWidth - (hasScroll.y() ? scrollbar : 0),
		result.height = win.innerHeight - (hasScroll.x() ? scrollbar : 0)
		result.right = result.left + result.width;
		result.bottom = result.top + result.height;

		return result;
	}

	//return absolute offsets if document requested
	else if (el === doc) {
		var res = offsets(doc.documentElement);
		res.bottom = Math.max(window.innerHeight, res.bottom);
		res.right = Math.max(window.innerWidth, res.right);
		if (hasScroll.y(doc.documentElement)) res.right -= scrollbar;
		if (hasScroll.x(doc.documentElement)) res.bottom -= scrollbar;
		return res;
	}

	//FIXME: why not every element has getBoundingClientRect method?
	try {
		cRect = el.getBoundingClientRect();
	} catch (e) {
		cRect = Rect(
			el.clientLeft,
			el.clientTop
		);
	}

	//whether element is or is in fixed
	var isFixed = isFixedEl(el);
	var xOffset = isFixed ? 0 : win.pageXOffset;
	var yOffset = isFixed ? 0 : win.pageYOffset;

	result = Rect(
		cRect.left + xOffset,
		cRect.top + yOffset,
		cRect.left + xOffset + el.offsetWidth,
		cRect.top + yOffset + el.offsetHeight
	);

	return result;
};
},{"./has-scroll":35,"./is-fixed":36,"./rect":42,"./scrollbar":43,"./translate":45}],39:[function(require,module,exports){
/**
 * Caclulate paddings of an element.
 * @module  mucss/paddings
 */


var Rect = require('./rect');
var parse = require('./parse-value');


/**
 * Return paddings of an element.
 *
 * @param    {Element}   el   An element to calc paddings.
 * @return   {Object}   Paddings object `{top:n, bottom:n, left:n, right:n}`.
 */
module.exports = function(el){
	if (el === window) return Rect();

	if (!(el instanceof Element)) throw Error('Argument is not an element');

	var style = window.getComputedStyle(el);

	return Rect(
		parse(style.paddingLeft),
		parse(style.paddingTop),
		parse(style.paddingRight),
		parse(style.paddingBottom)
	);
};
},{"./parse-value":40,"./rect":42}],40:[function(require,module,exports){
/**
 * Returns parsed css value.
 *
 * @module mucss/parse-value
 *
 * @param {string} str A string containing css units value
 *
 * @return {number} Parsed number value
 */
module.exports = function (str){
	str += '';
	return parseFloat(str.slice(0,-2)) || 0;
};

//FIXME: add parsing units
},{}],41:[function(require,module,exports){
/**
 * Vendor prefixes
 * Method of http://davidwalsh.name/vendor-prefix
 * @module mucss/prefix
 */

var styles = getComputedStyle(document.documentElement, '');

if (!styles) {
	module.exports = {
		dom: '', lowercase: '', css: '', js: ''
	};
}

else {
	var pre = (Array.prototype.slice.call(styles)
		.join('')
		.match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o'])
	)[1];

	var dom = ('WebKit|Moz|MS|O').match(new RegExp('(' + pre + ')', 'i'))[1];

	module.exports = {
		dom: dom,
		lowercase: pre,
		css: '-' + pre + '-',
		js: pre[0].toUpperCase() + pre.substr(1)
	};
}
},{}],42:[function(require,module,exports){
/**
 * Simple rect constructor.
 * It is just faster and smaller than constructing an object.
 *
 * @module mucss/rect
 *
 * @param {number} l left
 * @param {number} t top
 * @param {number} r right
 * @param {number} b bottom
 *
 * @return {Rect} A rectangle object
 */
module.exports = function Rect (l,t,r,b) {
	if (!(this instanceof Rect)) return new Rect(l,t,r,b);

	this.left=l||0;
	this.top=t||0;
	this.right=r||0;
	this.bottom=b||0;
	this.width=Math.abs(this.right - this.left);
	this.height=Math.abs(this.bottom - this.top);
};
},{}],43:[function(require,module,exports){
/**
 * Calculate scrollbar width.
 *
 * @module mucss/scrollbar
 */

// Create the measurement node
var scrollDiv = document.createElement("div");

var style = scrollDiv.style;

style.width = '100px';
style.height = '100px';
style.overflow = 'scroll';
style.position = 'absolute';
style.top = '-9999px';

document.documentElement.appendChild(scrollDiv);

// the scrollbar width
module.exports = scrollDiv.offsetWidth - scrollDiv.clientWidth;

// Delete fake DIV
document.documentElement.removeChild(scrollDiv);
},{}],44:[function(require,module,exports){
/**
 * Enable/disable selectability of an element
 * @module mucss/selection
 */
var css = require('./css');


/**
 * Disable or Enable any selection possibilities for an element.
 *
 * @param    {Element}   el   Target to make unselectable.
 */
exports.disable = function(el){
	css(el, {
		'user-select': 'none',
		'user-drag': 'none',
		'touch-callout': 'none'
	});
	el.setAttribute('unselectable', 'on');
	el.addEventListener('selectstart', pd);
};
exports.enable = function(el){
	css(el, {
		'user-select': null,
		'user-drag': null,
		'touch-callout': null
	});
	el.removeAttribute('unselectable');
	el.removeEventListener('selectstart', pd);
};


/** Prevent you know what. */
function pd(e){
	e.preventDefault();
}
},{"./css":33}],45:[function(require,module,exports){
/**
 * Parse translate3d
 *
 * @module mucss/translate
 */

var css = require('./css');
var parseValue = require('./parse-value');

module.exports = function (el) {
	var translateStr = css(el, 'transform');

	//find translate token, retrieve comma-enclosed values
	//translate3d(1px, 2px, 2) → 1px, 2px, 2
	//FIXME: handle nested calcs
	var match = /translate(?:3d)?\s*\(([^\)]*)\)/.exec(translateStr);

	if (!match) return [0, 0];
	var values = match[1].split(/\s*,\s*/);

	//parse values
	//FIXME: nested values are not necessarily pixels
	return values.map(function (value) {
		return parseValue(value);
	});
};
},{"./css":33,"./parse-value":40}],46:[function(require,module,exports){
/**
 * Clamp value.
 * Detects proper clamp min/max.
 *
 * @param {number} a Current value to cut off
 * @param {number} min One side limit
 * @param {number} max Other side limit
 *
 * @return {number} Clamped value
 */

module.exports = require('./wrap')(function(a, min, max){
	return max > min ? Math.max(Math.min(a,max),min) : Math.max(Math.min(a,min),max);
});
},{"./wrap":50}],47:[function(require,module,exports){
/**
 * Looping function for any framesize.
 * Like fmod.
 *
 * @module  mumath/loop
 *
 */

module.exports = require('./wrap')(function (value, left, right) {
	//detect single-arg case, like mod-loop or fmod
	if (right === undefined) {
		right = left;
		left = 0;
	}

	//swap frame order
	if (left > right) {
		var tmp = right;
		right = left;
		left = tmp;
	}

	var frame = right - left;

	value = ((value + left) % frame) - left;
	if (value < left) value += frame;
	if (value > right) value -= frame;

	return value;
});
},{"./wrap":50}],48:[function(require,module,exports){
/**
 * @module  mumath/precision
 *
 * Get precision from float:
 *
 * @example
 * 1.1 → 1, 1234 → 0, .1234 → 4
 *
 * @param {number} n
 *
 * @return {number} decimap places
 */

module.exports = require('./wrap')(function(n){
	var s = n + '',
		d = s.indexOf('.') + 1;

	return !d ? 0 : s.length - d;
});
},{"./wrap":50}],49:[function(require,module,exports){
/**
 * Precision round
 *
 * @param {number} value
 * @param {number} step Minimal discrete to round
 *
 * @return {number}
 *
 * @example
 * toPrecision(213.34, 1) == 213
 * toPrecision(213.34, .1) == 213.3
 * toPrecision(213.34, 10) == 210
 */
var precision = require('./precision');

module.exports = require('./wrap')(function(value, step) {
	if (step === 0) return value;
	if (!step) return Math.round(value);
	step = parseFloat(step);
	value = Math.round(value / step) * step;
	return parseFloat(value.toFixed(precision(step)));
});
},{"./precision":48,"./wrap":50}],50:[function(require,module,exports){
/**
 * Get fn wrapped with array/object attrs recognition
 *
 * @return {Function} Target function
 */
module.exports = function(fn){
	return function (a) {
		var this$1 = this;

		var args = arguments;
		if (a instanceof Array) {
			var result = new Array(a.length), slice;
			for (var i = 0; i < a.length; i++){
				slice = [];
				for (var j = 0, l = args.length, val; j < l; j++){
					val = args[j] instanceof Array ? args[j][i] : args[j];
					val = val;
					slice.push(val);
				}
				result[i] = fn.apply(this$1, slice);
			}
			return result;
		}
		else if (typeof a === 'object') {
			var result = {}, slice;
			for (var i in a){
				slice = [];
				for (var j = 0, l = args.length, val; j < l; j++){
					val = typeof args[j] === 'object' ? args[j][i] : args[j];
					val = val;
					slice.push(val);
				}
				result[i] = fn.apply(this$1, slice);
			}
			return result;
		}
		else {
			return fn.apply(this, args);
		}
	};
};
},{}],51:[function(require,module,exports){
/**
* Trivial types checkers.
* Because there’re no common lib for that ( lodash_ is a fatguy)
*/
//TODO: make main use as `is.array(target)`

module.exports = {
	has: has,
	isObject: isObject,
	isFn: isFn,
	isString: isString,
	isNumber: isNumber,
	isBoolean: isBool,
	isPlain: isPlain,
	isArray: isArray,
	isArrayLike: isArrayLike,
	isElement: isElement,
	isPrivateName: isPrivateName,
	isRegExp: isRegExp,
	isEmpty: isEmpty
};

var win = typeof window === 'undefined' ? this : window;
var doc = typeof document === 'undefined' ? null : document;

//speedy impl,ementation of `in`
//NOTE: `!target[propName]` 2-3 orders faster than `!(propName in target)`
function has(a, b){
	if (!a) return false;
	//NOTE: this causes getter fire
	if (a[b]) return true;
	return b in a;
	// return a.hasOwnProperty(b);
}

//isPlainObject
function isObject(a){
	var Ctor, result;

	if (isPlain(a) || isArray(a) || isElement(a) || isFn(a)) return false;

	// avoid non `Object` objects, `arguments` objects, and DOM elements
	if (
		//FIXME: this condition causes weird behaviour if a includes specific valueOf or toSting
		// !(a && ('' + a) === '[object Object]') ||
		(!has(a, 'constructor') && (Ctor = a.constructor, isFn(Ctor) && !(Ctor instanceof Ctor))) ||
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

	return typeof result == 'undefined' || has(a, result);
}

function isEmpty(a){
	if (!a) return true;
	for (var k in a) {
		return false;
	}
	return true;
}

function isFn(a){
	return !!(a && a.apply);
}

function isString(a){
	return typeof a === 'string' || a instanceof String;
}

function isNumber(a){
	return typeof a === 'number' || a instanceof Number;
}

function isBool(a){
	return typeof a === 'boolean' || a instanceof Boolean;
}

function isPlain(a){
	return !a || isString(a) || isNumber(a) || isBool(a);
}

function isArray(a){
	return a instanceof Array;
}

//FIXME: add tests from http://jsfiddle.net/ku9LS/1/
function isArrayLike(a){
	return isArray(a) || (a && !isString(a) && !a.nodeType && a != win && !isFn(a) && typeof a.length === 'number');
}

function isElement(target){
	return doc && target instanceof HTMLElement;
}

function isPrivateName(n){
	return n[0] === '_' && n.length > 1;
}

function isRegExp(target){
	return target instanceof RegExp;
}
},{}],52:[function(require,module,exports){
/**
* @module  placer
*
* Places any element relative to any other element the way you define
*/

//TODO: use translate3d instead of absolute repositioning (option?)
//TODO: implement avoiding strategy (graphic editors use-case when you need to avoid placing over selected elements)
//TODO: enhance best-side strategy: choose the most closest side

var css = require('mucss/css');
var scrollbarWidth = require('mucss/scrollbar');
var isFixed = require('mucss/is-fixed');
var offsets = require('mucss/offset');
var hasScroll = require('mucss/has-scroll');
var borders = require('mucss/border');
var margins = require('mucss/margin');
var softExtend = require('soft-extend');
var align = require('aligner');
var parseValue = require('mucss/parse-value');

//shortcuts
var win = window, doc = document, root = doc.documentElement;


module.exports = place;

place.align = align;
place.toFloat = align.toFloat;

/**
 * Default options
 */
var defaults = {
	//an element to align relatively to
	//element
	target: win,

	//which side to place element
	//t/r/b/l, 'center', 'middle'
	side: 'auto',

	/**
	 * An alignment trbl/0..1/center
	 *
	 * @default  0
	 * @type {(number|string|array)}
	 */
	align: 0.5,

	//selector/nodelist/node/[x,y]/window/function(el)
	avoid: undefined,

	//selector/nodelist/node/[x,y]/window/function(el)
	within: window,

	//look for better blacement, if doesn’t fit
	auto: true
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
function place (element, options) {
	//inherit defaults
	options = softExtend(options, defaults);

	options.target = options.target || options.to || win;

	if (!options.within) {
		options.within = options.target === win ? win : root;
	}

	//TODO: query avoidables
	// options.avoid = q(element, options.avoid, true);


	//set the same position as the target or absolute
	var elStyle = getComputedStyle(element);
	if (elStyle.position === 'static') {
		if (options.target instanceof Element && isFixed(options.target)) {
			element.style.position = 'fixed';
		}
		else {
			element.style.position = 'absolute';
		}
	}

	//force placing into DOM
	if (!document.contains(element)) (document.body || document.documentElement).appendChild(element);


	//else place according to the position
	var side = (options.auto || options.side === 'auto') ? getBestSide(element, options) : options.side;
	placeBySide[side](element, options);


	return element;
}


/**
 * Set of positioning functions
 * @enum {Function}
 * @param {Element} placee Element to place
 * @param {object} target Offsets rectangle (absolute position)
 * @param {object} ignore Sides to avoid entering (usually, already tried)
 */
var placeBySide = {
	center: function(placee, opts){
		//get to & within rectangles
		var targetRect = offsets(opts.target);
		var parentRect = getParentRect(placee.offsetParent);

		//align centered
		var al = opts.align;
		if (!(al instanceof Array)) {
			if (/,/.test(al)) {
				al = al.split(/\s*,\s*/);
				al = [parseFloat(al[0]), parseFloat(al[1])];
			}
			else if (/top|bottom|middle/.test(al)) al = [.5, al];
			else al = [al, .5];
		}

		align([opts.target, placee], al);

		//apply limits
		//FIXME: understand this use-case when it should be called for centered view
		if (opts.within && opts.within !== window) {
			trimPositionY(placee, opts, parentRect);
			trimPositionX(placee, opts, parentRect);
		}


		//upd options
		opts.side = 'center';
	},

	left: function(placee, opts){
		var parent = placee.offsetParent || document.body || root;

		var targetRect = offsets(opts.target);
		var parentRect = getParentRect(parent);

		//correct borders
		contractRect(parentRect, borders(parent));


		//place left (set css right because placee width may change)
		css(placee, {
			right: parentRect.right - targetRect.left,
			left: 'auto'
		});

		//place vertically properly
		align([opts.target, placee], [null, opts.align]);


		//apply limits
		if (opts.within) trimPositionY(placee, opts, parentRect);


		//upd options
		opts.side = 'left';
	},

	right: function (placee, opts) {
		var parent = placee.offsetParent || document.body || root;

		//get to & within rectangles
		var targetRect = offsets(opts.target);
		var parentRect = getParentRect(parent);

		//correct borders
		contractRect(parentRect, borders(parent));


		//place right
		css(placee, {
			left: targetRect.right - parentRect.left,
			right: 'auto',
		});


		//place vertically properly
		align([opts.target, placee], [null, opts.align]);


		//apply limits
		if (opts.within) trimPositionY(placee, opts, parentRect);


		//upd options
		opts.side = 'right';
	},

	top: function(placee, opts){
		var parent = placee.offsetParent || document.body || root;

		var targetRect = offsets(opts.target);
		var parentRect = getParentRect(parent);

		//correct borders
		contractRect(parentRect, borders(parent));

		if (isFixed(placee)) {
			parentRect.top = 0;
			parentRect.bottom = window.innerHeight;
			targetRect.top -= window.pageYOffset;
			targetRect.bottom -= window.pageYOffset;
		}

		//place vertically top-side
		css(placee, {
			bottom: parentRect.bottom - targetRect.top,
			top: 'auto'
		});


		//place horizontally properly
		align([opts.target, placee], [opts.align]);


		//apply limits
		if (opts.within) trimPositionX(placee, opts, parentRect);


		//upd options
		opts.side = 'top';
	},

	bottom: function(placee, opts){
		var parent = placee.offsetParent || document.body || root;

		//get to & within rectangles
		var targetRect = offsets(opts.target);
		var parentRect = getParentRect(parent);


		//correct borders
		contractRect(parentRect, borders(parent));

		if (isFixed(placee)) {
			parentRect.top = 0;
			parentRect.bottom = window.innerHeight;
			targetRect.top -= window.pageYOffset;
			targetRect.bottom -= window.pageYOffset;
		}

		//place bottom
		css(placee, {
			top: targetRect.bottom - parentRect.top,
			bottom: 'auto',
		});


		//place horizontally properly
		align([opts.target, placee], [opts.align]);


		//apply limits
		if (opts.within) trimPositionX(placee, opts, parentRect);


		//upd options
		opts.side = 'bottom';
	}
};


/**
 * Find the most appropriate side to place element
 */
function getBestSide (placee, opts) {
	var initSide = opts.side === 'auto' ? 'bottom' : opts.side;

	var withinRect = offsets(opts.within),
		placeeRect = offsets(placee),
		targetRect = offsets(opts.target);

	contractRect(withinRect, borders(opts.within));

	var placeeMargins = margins(placee);

	//rect of "hot" area (available spaces from placer to container)
	var hotRect = {
		top: targetRect.top - withinRect.top,
		bottom: withinRect.bottom - targetRect.bottom,
		left: targetRect.left - withinRect.left,
		right: withinRect.right - targetRect.right
	};

	//rect of available spaces
	var availSpace = {
		top: hotRect.top - placeeRect.height - placeeMargins.top - placeeMargins.bottom,
		bottom: hotRect.bottom - placeeRect.height - placeeMargins.top - placeeMargins.bottom,
		left: hotRect.left - placeeRect.width - placeeMargins.left - placeeMargins.right,
		right: hotRect.right - placeeRect.width - placeeMargins.left - placeeMargins.right
	};

	//TODO: if avoidable el is within the hot area - specify the side limits


	//if fits initial side, return it
	if (availSpace[initSide] >= 0) return initSide;

	//if none of sides fit, return center
	if (availSpace.top < 0 && availSpace.bottom < 0 && availSpace.left < 0 && availSpace.right < 0) return 'center';

	//else find the most free side within others
	var maxSide = initSide, maxSpace = availSpace[maxSide];
	for (var side in availSpace) {
		if (availSpace[side] > maxSpace) {
			maxSide = side; maxSpace = availSpace[maxSide];
		}
	}

	return maxSide;
}



/** contract rect 1 with rect 2 */
function contractRect(rect, rect2){
	//correct rect2
	rect.left += rect2.left;
	rect.right -= rect2.right;
	rect.bottom -= rect2.bottom;
	rect.top += rect2.top;
	return rect;
}


/** Apply limits rectangle to the position of an element */
function trimPositionY(placee, opts, parentRect){
	var within = opts.within;

	var placeeRect = offsets(placee);
	var withinRect = offsets(within);
	var placeeMargins = margins(placee);

	if (within === window && isFixed(placee)) {
		withinRect.top = 0;
		withinRect.left = 0;
	}

	contractRect(withinRect, borders(within));

	//shorten withinRect by the avoidable elements
	//within the set of avoidable elements find the ones
	if (opts.avoid) {

	}

	if (withinRect.top > placeeRect.top - placeeMargins.top) {
		css(placee, {
			top: withinRect.top - parentRect.top,
			bottom: 'auto'
		});
	}

	else if (withinRect.bottom < placeeRect.bottom + placeeMargins.bottom) {
		css(placee, {
			top: 'auto',
			bottom: parentRect.bottom - withinRect.bottom
		});
	}
}
function trimPositionX(placee, opts, parentRect){
	var within = opts.within;

	var placeeRect = offsets(placee);
	var withinRect = offsets(within);
	var placeeMargins = margins(placee);

	if (within === window && isFixed(placee)) {
		withinRect.top = 0;
		withinRect.left = 0;
	}

	contractRect(withinRect, borders(within));

	if (withinRect.left > placeeRect.left - placeeMargins.left) {
		css(placee, {
			left: withinRect.left - parentRect.left,
			right: 'auto'
		});
	}

	else if (withinRect.right < placeeRect.right + placeeMargins.right) {
		css(placee, {
			left: 'auto',
			right: parentRect.right - withinRect.right
		});
	}
}


/**
 * Return offsets rectangle for an element/array/any target passed.
 * I. e. normalize offsets rect
 *
 * @param {*} el Element, selector, window, document, rect, array
 *
 * @return {object} Offsets rectangle
 */
function getParentRect (target) {
	var rect;

	//handle special static body case
	if (target == null || (target === window) || (target === doc.body && getComputedStyle(target).position === 'static') || target === root) {
		rect = {
			left: 0,
			right: win.innerWidth - (hasScroll.y() ? scrollbarWidth : 0),
			width: win.innerWidth,
			top: 0,
			bottom: win.innerHeight - (hasScroll.x() ? scrollbarWidth : 0),
			height: win.innerHeight
		};
	}
	else {
		rect = offsets(target);
	}

	return rect;
}
},{"aligner":4,"mucss/border":32,"mucss/css":33,"mucss/has-scroll":35,"mucss/is-fixed":36,"mucss/margin":37,"mucss/offset":38,"mucss/parse-value":40,"mucss/scrollbar":43,"soft-extend":57}],53:[function(require,module,exports){
/**
 * @module  resizable
 */


var Draggable = require('draggy');
var emit = require('emmy/emit');
var on = require('emmy/on');
var isArray = require('mutype/is-array');
var isString = require('mutype/is-string');
var isObject = require('mutype/is-object');
var extend = require('xtend/mutable');
var inherit = require('inherits');
var Emitter = require('events');
var between = require('mumath/clamp');
var splitKeys = require('split-keys');
var css = require('mucss/css');
var paddings = require('mucss/padding');
var borders = require('mucss/border');
var margins = require('mucss/margin');
var offsets = require('mucss/offset');


var doc = document, win = window, root = doc.documentElement;


/**
 * Make an element resizable.
 *
 * Note that we don’t need a container option
 * as arbitrary container is emulatable via fake resizable.
 *
 * @constructor
 */
function Resizable (el, options) {
	var self = this;

	if (!(self instanceof Resizable)) {
		return new Resizable(el, options);
	}

	self.element = el;

	extend(self, options);

	//if element isn’t draggable yet - force it to be draggable, without movements
	if (self.draggable === true) {
		self.draggable = new Draggable(self.element, {
			within: self.within,
			css3: self.css3
		});
	} else if (self.draggable) {
		self.draggable = new Draggable(self.element, self.draggable);
		self.draggable.css3 = self.css3;
	} else {
		self.draggable = new Draggable(self.element, {
			handle: null
		});
	}

	self.createHandles();

	//bind event, if any
	if (self.resize) {
		self.on('resize', self.resize);
	}
}

inherit(Resizable, Emitter);


var proto = Resizable.prototype;


/** Use css3 for draggable, if any */
proto.css3 = true;


/** Make itself draggable to the row */
proto.draggable = false;



/** Create handles according to options */
proto.createHandles = function () {
	var self = this;

	//init handles
	var handles;

	//parse value
	if (isArray(self.handles)) {
		handles = {};
		for (var i = self.handles.length; i--;){
			handles[self.handles[i]] = null;
		}
	}
	else if (isString(self.handles)) {
		handles = {};
		var arr = self.handles.match(/([swne]+)/g);
		for (var i = arr.length; i--;){
			handles[arr[i]] = null;
		}
	}
	else if (isObject(self.handles)) {
		handles = self.handles;
	}
	//default set of handles depends on position.
	else {
		var position = getComputedStyle(self.element).position;
		var display = getComputedStyle(self.element).display;
		//if display is inline-like - provide only three handles
		//it is position: static or display: inline
		if (/inline/.test(display) || /static/.test(position)){
			handles = {
				s: null,
				se: null,
				e: null
			};

			//ensure position is not static
			css(self.element, 'position', 'relative');
		}
		//else - all handles
		else {
			handles = {
				s: null,
				se: null,
				e: null,
				ne: null,
				n: null,
				nw: null,
				w: null,
				sw: null
			};
		}
	}

	//create proper number of handles
	var handle;
	for (var direction in handles) {
		handles[direction] = self.createHandle(handles[direction], direction);
	}

	//save handles elements
	self.handles = handles;
}


/** Create handle for the direction */
proto.createHandle = function(handle, direction){
	var self = this;

	var el = self.element;

	//make handle element
	if (!handle) {
		handle = document.createElement('div');
		handle.classList.add('resizable-handle');
	}

	//insert handle to the element
	self.element.appendChild(handle);

	//save direction
	handle.direction = direction;

	//detect self.within
	//FIXME: may be painful if resizable is created on detached element
	var within = self.within === 'parent' ? self.element.parentNode : self.within;

	//make handle draggable
	var draggy = new Draggable(handle, {
		within: within,
		//can’t use abs pos, as we engage it in styling
		// css3: false,
		threshold: self.threshold,
		axis: /^[ns]$/.test(direction) ? 'y' : /^[we]$/.test(direction) ? 'x' : 'both'
	});

	draggy.on('dragstart', function (e) {
		self.m = margins(el);
		self.b = borders(el);
		self.p = paddings(el);

		//update draggalbe params
		self.draggable.update(e);

		//save initial dragging offsets
		var s = getComputedStyle(el);
		self.offsets = self.draggable.getCoords();

		//recalc border-box
		if (getComputedStyle(el).boxSizing === 'border-box') {
			self.p.top = 0;
			self.p.bottom = 0;
			self.p.left = 0;
			self.p.right = 0;
			self.b.top = 0;
			self.b.bottom = 0;
			self.b.left = 0;
			self.b.right = 0;
		}

		//save initial size
		self.initSize = [el.offsetWidth - self.b.left - self.b.right - self.p.left - self.p.right, el.offsetHeight - self.b.top - self.b.bottom - self.p.top - self.p.bottom];

		//save initial full size
		self.initSizeFull = [
			el.offsetWidth,
			el.offsetHeight
		];

		//movement prev coords
		self.prevCoords = [0, 0];

		//shift-caused offset
		self.shiftOffset = [0, 0];

		//central initial coords
		self.center = [self.offsets[0] + self.initSize[0]/2, self.offsets[1] + self.initSize[1]/2];

		//calc limits (max height/width from left/right)
		if (self.within) {
			var po = offsets(within);
			var o = offsets(el);
			self.maxSize = [
				o.left - po.left + self.initSize[0],
				o.top - po.top + self.initSize[1],
				po.right - o.right + self.initSize[0],
				po.bottom - o.bottom + self.initSize[1]
			];
		} else {
			self.maxSize = [9999, 9999, 9999, 9999];
		}

		//preset mouse cursor
		css(root, {
			'cursor': direction + '-resize'
		});

		//clear cursors
		for (var h in self.handles){
			css(self.handles[h], 'cursor', null);
		}
	});

	draggy.on('drag', function () {
		var coords = draggy.getCoords();

		var prevSize = [
			el.offsetWidth,
			el.offsetHeight
		];

		//change width/height properly
		if (draggy.shiftKey) {
			switch (direction) {
				case 'se':
				case 's':
				case 'e':
					break;
				case 'nw':
					coords[0] = -coords[0];
					coords[1] = -coords[1];
					break;
				case 'n':
					coords[1] = -coords[1];
					break;
				case 'w':
					coords[0] = -coords[0];
					break;
				case 'ne':
					coords[1] = -coords[1];
					break;
				case 'sw':
					coords[0] = -coords[0];
					break;
			};

			//set placement is relative to initial center line
			css(el, {
				width: Math.min(
					self.initSize[0] + coords[0]*2,
					self.maxSize[2] + coords[0],
					self.maxSize[0] + coords[0]
				),
				height: Math.min(
					self.initSize[1] + coords[1]*2,
					self.maxSize[3] + coords[1],
					self.maxSize[1] + coords[1]
				)
			});

			var difX = prevSize[0] - el.offsetWidth;
			var difY = prevSize[1] - el.offsetHeight;

			//update draggable limits
			self.draggable.updateLimits();

			if (difX) {
				self.draggable.move(self.center[0] - self.initSize[0]/2 - coords[0]);
			}

			if (difY) {
				self.draggable.move(null, self.center[1] - self.initSize[1]/2 - coords[1]);
			}
		}
		else {
			switch (direction) {
				case 'se':
					css(el, {
						width: Math.min(
							self.initSize[0] + coords[0],
							self.maxSize[2]
						),
						height: Math.min(
							self.initSize[1] + coords[1],
							self.maxSize[3]
						)
					});

				case 's':
					css(el, {
						height: Math.min(
							self.initSize[1] + coords[1],
							self.maxSize[3]
						)
					});

				case 'e':
					css(el, {
						width: Math.min(
							self.initSize[0] + coords[0],
							self.maxSize[2]
						)
					});
				case 'se':
				case 's':
				case 'e':
					self.draggable.updateLimits();

					self.draggable.move(
						self.center[0] - self.initSize[0]/2,
						self.center[1] - self.initSize[1]/2
					);

					break;

				case 'nw':
					css(el, {
						width: between(self.initSize[0] - coords[0], 0, self.maxSize[0]),
						height: between(self.initSize[1] - coords[1], 0, self.maxSize[1])
					});
				case 'n':
					css(el, {
						height: between(self.initSize[1] - coords[1], 0, self.maxSize[1])
					});
				case 'w':
					css(el, {
						width: between(self.initSize[0] - coords[0], 0, self.maxSize[0])
					});
				case 'nw':
				case 'n':
				case 'w':
					self.draggable.updateLimits();

					//subtract t/l on changed size
					var deltaX = self.initSizeFull[0] - el.offsetWidth;
					var deltaY = self.initSizeFull[1] - el.offsetHeight;

					self.draggable.move(self.offsets[0] + deltaX, self.offsets[1] + deltaY);
					break;

				case 'ne':
					css(el, {
						width: between(self.initSize[0] + coords[0], 0, self.maxSize[2]),
						height: between(self.initSize[1] - coords[1], 0, self.maxSize[1])
					});

					self.draggable.updateLimits();

					//subtract t/l on changed size
					var deltaY = self.initSizeFull[1] - el.offsetHeight;

					self.draggable.move(null, self.offsets[1] + deltaY);
					break;
				case 'sw':
					css(el, {
						width: between(self.initSize[0] - coords[0], 0, self.maxSize[0]),
						height: between(self.initSize[1] + coords[1], 0, self.maxSize[3])
					});

					self.draggable.updateLimits();

					//subtract t/l on changed size
					var deltaX = self.initSizeFull[0] - el.offsetWidth;

					self.draggable.move(self.offsets[0] + deltaX);
					break;
			};
		}

		//trigger callbacks
		emit(self, 'resize');
		emit(el, 'resize');

		draggy.setCoords(0,0);
	});

	draggy.on('dragend', function(){
		//clear cursor & pointer-events
		css(root, {
			'cursor': null
		});

		//get back cursors
		for (var h in self.handles){
			css(self.handles[h], 'cursor', self.handles[h].direction + '-resize');
		}
	});

	//append styles
	css(handle, handleStyles[direction]);
	css(handle, 'cursor', direction + '-resize');

	//append proper class
	handle.classList.add('resizable-handle-' + direction);

	return handle;
};


/** deconstructor - removes any memory bindings */
proto.destroy = function () {
	var this$1 = this;

	//remove all handles
	for (var hName in this.handles){
		this$1.element.removeChild(this$1.handles[hName]);
		Draggable.cache.get(this$1.handles[hName]).destroy();
	}


	//remove references
	this.element = null;
};


var w = 10;

/** Threshold size */
proto.threshold = w;

/** Styles for handles */
var handleStyles = splitKeys({
	'e,w,n,s,nw,ne,sw,se': {
		'position': 'absolute'
	},
	'e,w': {
		'top, bottom':0,
		'width': w
	},
	'e': {
		'left': 'auto',
		'right': -w/2
	},
	'w': {
		'right': 'auto',
		'left': -w/2
	},
	's': {
		'top': 'auto',
		'bottom': -w/2
	},
	'n': {
		'bottom': 'auto',
		'top': -w/2
	},
	'n,s': {
		'left, right': 0,
		'height': w
	},
	'nw,ne,sw,se': {
		'width': w,
		'height': w,
		'z-index': 1
	},
	'nw': {
		'top, left': -w/2,
		'bottom, right': 'auto'
	},
	'ne': {
		'top, right': -w/2,
		'bottom, left': 'auto'
	},
	'sw': {
		'bottom, left': -w/2,
		'top, right': 'auto'
	},
	'se': {
		'bottom, right': -w/2,
		'top, left': 'auto'
	}
}, true);



/**
 * @module resizable
 */
module.exports = Resizable;
},{"draggy":7,"emmy/emit":12,"emmy/on":22,"events":1,"inherits":25,"mucss/border":32,"mucss/css":33,"mucss/margin":37,"mucss/offset":38,"mucss/padding":39,"mumath/clamp":46,"mutype/is-array":54,"mutype/is-object":55,"mutype/is-string":56,"split-keys":58,"xtend/mutable":59}],54:[function(require,module,exports){
module.exports = function(a){
	return a instanceof Array;
}
},{}],55:[function(require,module,exports){
/**
 * @module mutype/is-object
 */

//TODO: add st8 tests

//isPlainObject indeed
module.exports = function(o){
	// return obj === Object(obj);
	return !!o && typeof o === 'object' && o.constructor === Object;
};
},{}],56:[function(require,module,exports){
module.exports = function(a){
	return typeof a === 'string' || a instanceof String;
}
},{}],57:[function(require,module,exports){
/**
 * Append all not-existing props to the initial object
 *
 * @return {[type]} [description]
 */
module.exports = function(){
	var args = [].slice.call(arguments);
	var res = args[0];
	var l = args.length;

	if (typeof res !== 'object') throw  Error('Bad argument');

	for (var i = 1, l = args.length, obj; i < l; i++) {
		obj = args[i];
		if (typeof obj === 'object') {
			for (var prop in obj) {
				if (res[prop] === undefined) res[prop] = obj[prop];
			}
		}
	}

	return res;
};
},{}],58:[function(require,module,exports){
var type = require('mutype');
var extend = require('xtend/mutable');

module.exports = splitKeys;


/**
 * Disentangle listed keys
 *
 * @param {Object} obj An object with key including listed declarations
 * @example {'a,b,c': 1}
 *
 * @param {boolean} deep Whether to flatten nested objects
 *
 * @todo Think to provide such method on object prototype
 *
 * @return {oblect} Source set passed {@link set}
 */
function splitKeys(obj, deep, separator){
	//swap args, if needed
	if ((deep || separator) && (type.isBoolean(separator) || type.isString(deep) || type.isRegExp(deep))) {
		var tmp = deep;
		deep = separator;
		separator = tmp;
	}

	//ensure separator
	separator = separator === undefined ? splitKeys.separator : separator;

	var list, value;

	for(var keys in obj){
		value = obj[keys];

		if (deep && type.isObject(value)) splitKeys(value, deep, separator);

		list = keys.split(separator);

		if (list.length > 1){
			delete obj[keys];
			list.forEach(setKey);
		}
	}

	function setKey(key){
		//if existing key - extend, if possible
		//FIXME: obj[key] might be not an object, but function, for example
		if (value !== obj[key] && type.isObject(value) && type.isObject(obj[key])) {
			obj[key] = extend({}, obj[key], value);
		}
		//or replace
		else {
			obj[key] = value;
		}
	}

	return obj;
}


/** default separator */
splitKeys.separator = /\s?,\s?/;
},{"mutype":51,"xtend/mutable":59}],59:[function(require,module,exports){
module.exports = extend

var hasOwnProperty = Object.prototype.hasOwnProperty;

function extend(target) {
    var arguments$1 = arguments;

    for (var i = 1; i < arguments.length; i++) {
        var source = arguments$1[i]

        for (var key in source) {
            if (hasOwnProperty.call(source, key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}

},{}],60:[function(require,module,exports){
/**
 * @module  popoff/overlay
 *
 * Because overlay-component is hopelessly out of date.
 * This is modern rewrite.
 */

var Emitter = require('events').EventEmitter;
var inherits = require('inherits');
var extend = require('xtend/mutable');


module.exports = Overlay;


/**
 * Initialize a new `Overlay`.
 *
 * @param {Object} options
 * @api public
 */

function Overlay(options) {
	var this$1 = this;

	if (!(this instanceof Overlay)) return new Overlay(options);

	Emitter.call(this);

	extend(this, options);

	if (!this.container) {
		this.container = document.body || document.documentElement;
	}

	//create overlay element
	this.element = document.createElement('div');
	this.element.classList.add('popoff-overlay');

	if (this.closable) {
		this.element.addEventListener('click', function (e) {
			this$1.hide();
		});
		this.element.classList.add('popoff-closable');
	}
}

inherits(Overlay, Emitter);


//close overlay by click
Overlay.prototype.closable = true;


/**
 * Show the overlay.
 *
 * Emits "show" event.
 *
 * @return {Overlay}
 * @api public
 */

Overlay.prototype.show = function () {
	var this$1 = this;

	this.emit('show');

	this.container.appendChild(this.element);

	//class removed in a timeout to save animation
	setTimeout( function () {
		this$1.element.classList.add('popoff-visible');
		this$1.emit('afterShow');
	}, 10);

	return this;
};


/**
 * Hide the overlay.
 *
 * Emits "hide" event.
 *
 * @return {Overlay}
 * @api public
 */

Overlay.prototype.hide = function () {
	this.emit('hide');

	this.element.classList.remove('popoff-visible');

	this.element.addEventListener('transitionend', end);
	this.element.addEventListener('webkitTransitionEnd', end);
	this.element.addEventListener('otransitionend', end);
	this.element.addEventListener('oTransitionEnd', end);
	this.element.addEventListener('msTransitionEnd', end);
	var to = setTimeout(end, 1000);

	var that = this;
	function end () {
		that.element.removeEventListener('transitionend', end);
		that.element.removeEventListener('webkitTransitionEnd', end);
		that.element.removeEventListener('otransitionend', end);
		that.element.removeEventListener('oTransitionEnd', end);
		that.element.removeEventListener('msTransitionEnd', end);
		clearInterval(to);

		that.container.removeChild(that.element);
		that.emit('afterHide');
	}

	return this;
};
},{"events":1,"inherits":25,"xtend/mutable":59}],61:[function(require,module,exports){
var ipsum = require('lorem-ipsum');
var Draggable = require('draggy');
var Resizable = require('resizable');
var Overlay = require('./overlay');
var Popup = require('./');
var insertCSS = require('insert-css');
// var test = require('tst');
var test = function (a,b) {b();};
var body = document.body,
	doc = document,
	root = doc.documentElement;


insertCSS("\n\thtml {\n\t\tbackground-color: rgb(255,254,252);\n\t\tbackground: url(http://subtlepatterns2015.subtlepatterns.netdna-cdn.com/patterns/lightpaperfibers.png), rgb(255,254,252);\n\t\tfont-family: sans-serif;\n\t\tline-height: 1.5;\n\t}\n\n\tbody {\n\t\tposition: relative;\n\t\tmin-height: 100vh;\n\t\tpadding: 6rem 2rem 6rem;\n\t\tmax-width: 660px;\n\t\tmargin: auto;\n\t}\n\n\timg {\n\t\tmax-width: 60%;\n\t}\n\n\th1,h2,h3,h4,h5,h6 {\n\t\tmargin: 4rem 0rem 2rem 0;\n\t}\n\n\t.popoff-popup h1,\n\t.popoff-popup h2,\n\t.popoff-popup h3,\n\t.popoff-popup h4,\n\t.popoff-popup h5,\n\t.popoff-popup h6 {\n\t\tmargin-top: 1rem;\n\t}\n\n\t.target {\n\t\twhite-space: nowrap;\n\t\tmargin-right: .5rem;\n\t\ttext-transform: uppercase;\n\t\tletter-spacing: .25ex;\n\t\tfont-size: .75rem;\n\t\tdisplay: inline-block;\n\t\tmargin-bottom: .5rem;\n\t}\n\n\t.popoff-dropdown p,\n\t.popoff-sidebar p,\n\t.popoff-tooltip p {\n\t\tmargin: 0;\n\t}\n\n\t.popoff-sidebar h2 {\n\t\tmargin: 0 0 .66rem;\n\t}\n\n\t.popoff-overlay {\n\t\tbackground-color: rgba(85,85,85,.15);\n\t\tbackground: linear-gradient(160deg, rgba(103, 98, 105, .55), rgba(73, 70, 82, .55));\n\t}\n\n\t.popoff-overlay:before,\n\t.popoff-overlay:after {\n\t\tcontent: '';\n\t\tposition: absolute;\n\t\ttop: -100vw;\n\t\tleft: -100vw;\n\t\tright: -100vw;\n\t\tbottom: -100vw;\n\t\tbackground: url(./lines.png);\n\t\ttransform: rotate(-12.5deg) scale(1.5, 1.51);\n\t\ttransition: transform 50s ease-in;\n\t\topacity: .05;\n\t}\n\t.popoff-overlay:after {\n\t\ttransform: rotate(-12.4deg) scale(1.51, 1.5);\n\t\ttransition: transform 50s ease-out;\n\t}\n\t.popoff-overlay.popoff-fade-in:before {\n\t\ttransform: rotate(12.4deg) scale(1.51, 1.5);\n\t}\n\t.popoff-overlay.popoff-fade-in:after {\n\t\ttransform: rotate(12.5deg) scale(1.5, 1.51);\n\t}\n");


var meta = document.createElement('meta');
meta.setAttribute('name', 'viewport');
meta.setAttribute('content', 'width=device-width, initial-scale=1, shrink-to-fit=no');
document.head.appendChild(meta);
body.innerHTML = "<a href=\"https://en.wikipedia.org/wiki/Alexander_Stepanovich_Popov\" style=\"text-decoration: none\"><img id=\"popoff\" src='./popoff.png' alt=\"Señor Popov. Попов Александр Степанович, портрет гравюра.\" style=\"display: block; margin: auto;\"/></a>\n<h1 style=\"text-align:center;\">Señor Popoff</h1>\n<p style=\"text-align: center\">Popoff provides every and each sort of popup: dialog, modal, tooltip, dropdown, confirm, notifier, popover, lightbox, balloon, dialog, alert, overlay, sidebar etc.</p>\n<section id=\"types\">\n<h2 style=\"text-align:center;\">Cases</h2>\n<p>These are available types of popups. Use them as <code>type: 'type-name'</code> option.</p>\n<p style=\"text-align: center\"></p>\n</section>\n<section id=\"effects\">\n<h2 style=\"text-align:center;\">Effects</h2>\n<p style=\"text-align: center\">Use the following effects as <code>effect: 'effect-name'</code> option.</p>\n<p style=\"text-align: center\"></p>\n</section>\n<a href=\"https://github.com/dfcreative/popoff\" style=\"display: block; margin-top: 3rem; text-align: center; text-decoration: none; color: black;\"><svg style=\"width: 3rem; height: 3rem;\" xmlns=\"http://www.w3.org/2000/svg\" width=\"784\" height=\"1024\" viewBox=\"0 0 784 1024\"><path d=\"M4.168 480.005q0 107.053 52.114 194.314 52.114 90.085 141.399 141.799t194.314 51.714q105.441 0 195.126-51.714 89.685-52.114 141.199-141.599t51.514-194.514q0-106.652-51.714-195.126-52.114-89.685-141.599-141.199T392.007 92.166q-107.053 0-194.314 52.114-90.085 52.114-141.799 141.399T4.18 479.993zm64.634 0q0-64.634 25.451-124.832t69.482-103.828q44.031-44.031 103.828-69.282t124.432-25.251 124.832 25.251 104.229 69.282q43.631 43.631 68.882 103.828t25.251 124.832q0 69.482-28.487 132.504t-79.989 108.876-117.76 66.458V673.919q0-42.419-34.747-66.257 85.238-7.672 124.632-43.23t39.383-112.712q0-59.786-36.759-100.593 7.272-21.815 7.272-42.018 0-29.899-13.732-54.939-27.063 0-48.478 8.884t-52.515 30.699q-37.571-8.484-77.565-8.484-45.654 0-85.238 9.295-30.299-22.216-52.314-31.311t-49.891-9.084q-13.332 25.451-13.332 54.939 0 21.004 6.871 42.419-36.759 39.594-36.759 100.192 0 77.165 39.183 112.312t125.644 43.23q-23.027 15.355-31.911 44.843-19.792 6.871-41.207 6.871-16.156 0-27.875-7.272-3.636-2.024-6.66-4.236t-6.26-5.448-5.248-5.048-5.248-6.26-4.236-5.659-4.848-6.46-4.236-5.659q-18.991-25.051-45.243-25.051-14.143 0-14.143 6.06 0 2.424 6.871 8.083 12.931 11.308 13.732 12.12 9.696 7.672 10.908 9.696 11.719 14.544 17.779 31.911 22.627 50.502 77.565 50.502 8.884 0 34.747-4.036v85.649q-66.257-20.603-117.76-66.458T97.346 612.533 68.859 480.029z\"/></svg></a>\n";

var p = Popup({
	type: 'tooltip',
	target: '#popoff',
	side: 'right',
	content: "Hello my friend!",
	style: {
		borderRadius: 15,
		marginLeft: -25
	},
	onShow: function () {
		var quote = [
			"I don't dream about actors and actresses; they dream about me. I am reality, they are not.",
			"I respect everyone. I even respect journalists.",
			"The emission and reception of signals by Marconi by means of electric oscillations is nothing new. In America, the famous engineer Nikola Tesla carried the same experiments in 1893."
		][(Math.random()*3)|0];

		this.element.innerHTML = '<p>' + quote + '</p>';
	}
});


// var target = document.createElement('a');
// target.href = '#overlay';
// target.innerHTML = 'Overlay';
// target.className = 'target';
// target.style.textDecoration = 'none';
// target.style.background = 'black';
// target.style.color = 'white';
// target.style.padding = '10px';
// document.querySelector('#types p:last-of-type').appendChild(target);

// var o = Overlay();

// target.addEventListener('click', () => {
// 	o.show();
// });


test('modal', function () {
	var target = document.createElement('a');
	target.href = '#modal';
	target.innerHTML = 'Modal';
	target.className = 'target';
	target.style.textDecoration = 'none';
	target.style.background = 'black';
	target.style.color = 'white';
	target.style.padding = '10px';
	document.querySelector('#types p:last-of-type').appendChild(target);

	var p = Popup({
		overlay: true,
		content: ("\n\t\t\t<h2>Modal</h2>\n\t\t\t" + (ipsum({count: 1, units: 'paragraph', format: 'html'})) + "\n\t\t")
	});

	// p.show();
	target.addEventListener('click', function (e) {
		p.show(target);
	});
});


test('sidebar', function () {
	var target = document.createElement('a');
	target.href = '#sidebar';
	target.style.textDecoration = 'none';
	target.innerHTML = 'Sidebar';
	target.className = 'target';
	target.style.background = 'black';
	target.style.color = 'white';
	target.style.padding = '10px';
	document.querySelector('#types p:last-of-type').appendChild(target);

	var p = Popup({
		type: 'sidebar',
		shift: true,
		content: ("\n\t\t\t<h2>Sidebar</h2>\n\t\t\t" + (ipsum({count: 2, units: 'sentences', format: 'html'})) + "\n\t\t")
	});

	target.addEventListener('click', function () {
		p.side = ['top', 'left', 'bottom', 'right'][(Math.random() * 4)| 0]
		p.show();
	})
});


test('dropdown', function () {
	var target = document.createElement('a');
	target.href = '#dropdown';
	target.innerHTML = 'Dropdown';
	target.className = 'target';
	target.style.background = 'black';
	target.style.textDecoration = 'none';
	target.style.color = 'white';
	target.style.padding = '10px';
	document.querySelector('#types p:last-of-type').appendChild(target);

	var content = document.createElement('div');
	content.innerHTML = "<p>Dropdown content<p>";
	document.body.appendChild(content);

	var dropdown = new Popup({
		content: content,
		target: target,
		type: 'dropdown'
	});

	// dropdown.show();
});

test('tooltip', function () {
	var target = document.createElement('a');
	target.href = '#tooltip';
	target.innerHTML = 'Tooltip';
	target.className = 'target';
	target.style.textDecoration = 'none';
	target.style.background = 'black';
	target.style.color = 'white';
	target.style.padding = '10px';
	document.querySelector('#types p:last-of-type').appendChild(target);

	var content = document.createElement('div');
	content.innerHTML = "<p>Tooltip content</p>";

	var tooltip = new Popup({
		content: content,
		target: target,
		type: 'tooltip'
	});
});


test('dialog draggable', function () {
	var target = document.createElement('a');
	target.href = '#drag-resize';
	target.innerHTML = 'Draggable';
	target.className = 'target';
	target.style.textDecoration = 'none';
	target.style.background = 'black';
	target.style.color = 'white';
	target.style.padding = '10px';
	document.querySelector('#types p:last-of-type').appendChild(target);

	var p = Popup({
		target: target,
		overlay: false,
		effect: 'fade',
		side: 'bottom',
		wrap: false,
		content: "\n\t\t\t<h2>Draggable</h2>\n\t\t\t<p>Enable draggable behavior with <a href=\"https://npmjs.org/package/draggy\">draggy</a> component as so:</p>\n\t\t\t<code><pre>\nvar popup = new Popup({\n\toverlay: false,\n\teffect: 'fade'\n});\nDraggable(popup.element);\n\t\t\t</pre></code>\n\t\t\tDon’t forget to remove <code>max-width</code>.\n\t\t"
	});

	Draggable(p.element, {
		within: window
	});
	// Resizable(p.element, {
	// 	draggable: true,
	// 	// css3: false,
	// 	within: window
	// });
});


test('tall modal', function () {
	var target = document.createElement('a');
	target.href = '#tall-modal';
	target.innerHTML = 'Tall modal';
	target.className = 'target';
	target.style.textDecoration = 'none';
	target.style.background = 'black';
	target.style.color = 'white';
	target.style.padding = '10px';
	document.querySelector('#types p:last-of-type').appendChild(target);

	var p = Popup({
		overlay: true,
		content: ("\n\t\t\t<h2>Tall modal</h2>\n\t\t\t<p>\n\t\t\t\tWhen there is too much of content in modal, it is comfortable to have main scroll replaced with the scroll of modal content. That is what you see in this modal - the content of the body is placed into overlay.\n\t\t\t</p>\n\t\t\t" + (ipsum({count: 15, units: 'paragraph', format: 'html'})) + "\n\t\t")
	});

	// p.show();
	target.addEventListener('click', function (e) {
		p.show(target);
	});
});


test('Effects', function () {
	var effects = [
		'fade', 'scale',
		'slide-right', 'slide-bottom', 'slide-left', 'slide-top',
		'newspaper','super-scaled',
		// 'just-me'
	];

	effects.forEach(function (effect) {
		var target = document.createElement('a');
		target.href = '#'+effect;
		target.innerHTML = effect;
		target.className = 'target';
		target.style.textDecoration = 'none';
		target.style.background = 'black';
		target.style.color = 'white';
		target.style.padding = '10px';
		document.querySelector('#effects p:last-of-type').appendChild(target);

		var p = Popup({
			target: target,
			effect: effect,
			content: ("\n\t\t\t\t<h2 class=\"modal-effect\">effect: " + effect + "</h2>\n\t\t\t\t" + (ipsum({count: 3, units: 'paragraph', format: 'html'})) + "\n\t\t\t")
		});
	});
});
},{"./":3,"./overlay":60,"draggy":7,"insert-css":26,"lorem-ipsum":31,"resizable":53}]},{},[61]);
