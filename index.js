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
      listeners[i].apply(this, args);
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
      this.removeAllListeners(key);
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
      this.removeListener(type, listeners[listeners.length - 1]);
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
// shim for using process in browser

var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

(function () {
  try {
    cachedSetTimeout = setTimeout;
  } catch (e) {
    cachedSetTimeout = function () {
      throw new Error('setTimeout is not defined');
    }
  }
  try {
    cachedClearTimeout = clearTimeout;
  } catch (e) {
    cachedClearTimeout = function () {
      throw new Error('clearTimeout is not defined');
    }
  }
} ())
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = cachedSetTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    cachedClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        cachedSetTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],4:[function(require,module,exports){
/**
 * @module  popup
 */

'use strict';

var Emitter = require('events');
var place = require('placer');
var extend = require('xtend/mutable');
var uid = require('get-uid');
var inherits = require('inherits');
var createOverlay = require('./overlay');
var insertCss = require('insert-css');


insertCss(".popoff-overlay {\r\n\tposition: fixed;\r\n\ttop: 0;\r\n\tleft: 0;\r\n\tbottom: 0;\r\n\tright: 0;\r\n\topacity: 1;\r\n\tbackground-color: rgba(85,85,85,.85);\r\n\tbackground: linear-gradient(160deg, rgba(103, 98, 105, 0.85), rgba(73, 70, 82, 0.85));\r\n\t-webkit-transition: opacity .25s;\r\n\t-moz-transition: opacity .25s;\r\n\ttransition: opacity .25s;\r\n\tz-index: 5;\r\n}\r\n\r\n.popoff-popup {\r\n\tz-index: 9;\r\n\tposition: absolute;\r\n\toverflow: hidden;\r\n\tmargin: auto;\r\n\tmin-width: 4rem;\r\n\tmin-height: 1rem;\r\n\tbackground: white;\r\n\topacity: 1;\r\n\tvisibility: visible;\r\n\tbackface-visibility: hidden;\r\n\tbox-sizing: border-box;\r\n\t-webkit-transform-origin: center center;\r\n\t-moz-transform-origin: center center;\r\n\ttransform-origin: center center;\r\n\t-webkit-transform: scale(1) rotate(0deg);\r\n\t-moz-transform: scale(1) rotate(0deg);\r\n\t-ms-transform: scale(1) rotate(0deg);\r\n\ttransform: scale(1) rotate(0deg);\r\n}\r\n\r\n.popoff-animate {\r\n\t-webkit-transition: opacity .333s, transform .25s ease-out;\r\n\t-moz-transition: opacity .333s, transform .25s ease-out;\r\n\ttransition: opacity .333s, transform .25s ease-out;\r\n}\r\n\r\n.popoff-popup-tip {\r\n\tmargin: 1rem;\r\n}\r\n\r\n.popoff-closable {\r\n\tcursor: pointer;\r\n}\r\n\r\n.popoff-hidden {\r\n\topacity: 0;\r\n\tdisplay: none;\r\n\tpointer-events: none;\r\n\tvisibility: hidden;\r\n}\r\n\r\n.popoff-container {\r\n\toverflow: hidden;\r\n\theight: 100%;\r\n}\r\n\r\n.popoff-overflow {\r\n\tposition: fixed;\r\n\toverflow: auto;\r\n\ttop: 0;\r\n\tleft: 0;\r\n\tright: 0;\r\n\tbottom: 0;\r\n\tz-index: 10;\r\n}\r\n\r\n.popoff-overflow .popoff-popup {\r\n\tposition: absolute;\r\n\tmargin: 4rem auto;\r\n\tleft: 0;\r\n\tright: 0;\r\n}\r\n\r\n\r\n/* Types */\r\n.popoff-modal,\r\n.popoff-dialog,\r\n.popoff-confirm,\r\n.popoff-alert,\r\n.popoff-sidebar {\r\n\tposition: fixed;\r\n\tmax-width: 660px;\r\n\tmin-width: 320px;\r\n\tpadding: 1.6rem 2rem;\r\n\tbox-shadow: 0 .666vh 3.333vw -.333vh rgba(19, 16, 27, 0.45);\r\n}\r\n@media (max-width: 640px) {\r\n\t.popoff-modal,\r\n\t.popoff-dialog,\r\n\t.popoff-confirm,\r\n\t.popoff-alert {\r\n\t\tmax-width: 80%;\r\n\t}\r\n}\r\n.popoff-dropdown,\r\n.popoff-tooltip {\r\n\tmax-width: 320px;\r\n\tpadding: 1rem 1.2rem;\r\n\tbox-shadow: 0 1px 4px rgba(19, 16, 27, 0.25);\r\n}\r\n\r\n.popoff-sidebar {\r\n\tmargin: 0;\r\n\tmax-width: none;\r\n\tmin-width: 0;\r\n\tmax-height: none;\r\n\toverflow: auto;\r\n}\r\n.popoff-sidebar[data-side=\"top\"] {\r\n\ttop: 0;\r\n\tleft: 0;\r\n\tright: 0;\r\n\tbottom: auto;\r\n\tmax-height: 20%;\r\n}\r\n.popoff-sidebar[data-side=\"bottom\"] {\r\n\tbottom: 0;\r\n\tleft: 0;\r\n\tright: 0;\r\n\ttop: auto;\r\n\tmax-height: 20%;\r\n}\r\n.popoff-sidebar[data-side=\"right\"] {\r\n\tbottom: 0;\r\n\ttop: 0;\r\n\tright: 0;\r\n\tleft: auto;\r\n\tmax-width: 20%;\r\n}\r\n.popoff-sidebar[data-side=\"left\"] {\r\n\tbottom: 0;\r\n\ttop: 0;\r\n\tleft: 0;\r\n\tright: auto;\r\n\tmax-width: 20%;\r\n}\r\n\r\n\r\n/* Tip */\r\n.popoff-tip{\r\n\twidth: 1.5rem;\r\n\theight: 1.5rem;\r\n\tposition: absolute;\r\n\tz-index: 10;\r\n\toverflow: hidden;\r\n}\r\n.popoff-tip:after{\r\n\tcontent: '';\r\n\tborder-top-left-radius: 1px;\r\n\tposition: absolute;\r\n\tbackground: white;\r\n\tbox-shadow: 0 0px 3px rgba(19, 16, 27, 0.25);\r\n\t-webkit-transform-origin: center;\r\n\t-moz-transform-origin: center;\r\n\ttransform-origin: center;\r\n\t-webkit-transform: rotate(45deg);\r\n\t-moz-transform: rotate(45deg);\r\n\ttransform: rotate(45deg);\r\n\twidth: 1.5rem;\r\n\theight: 1.5rem;\r\n}\r\n.popoff-tip[data-side=\"top\"],\r\n.popoff-tip[data-side=\"bottom\"] {\r\n\theight: 1rem;\r\n}\r\n.popoff-tip[data-side=\"top\"]:after{\r\n\tbottom: auto;\r\n\ttop: .65rem;\r\n}\r\n.popoff-tip[data-side=\"bottom\"]:after{\r\n\tbottom: .65rem;\r\n\ttop: auto;\r\n}\r\n.popoff-tip[data-side=\"left\"],\r\n.popoff-tip[data-side=\"right\"] {\r\n\twidth: 1rem;\r\n}\r\n.popoff-tip[data-side=\"left\"]:after{\r\n\tleft: .65rem;\r\n\tright: auto;\r\n}\r\n.popoff-tip[data-side=\"right\"]:after{\r\n\tleft: auto;\r\n\tright: .65rem;\r\n}\r\n\r\n\r\n/* Close button */\r\n.popoff-close {\r\n\tposition: absolute;\r\n\tright: 0;\r\n\ttop: 0;\r\n\twidth: 3.333rem;\r\n\theight: 3.333rem;\r\n\tcursor: pointer;\r\n\tline-height: 3.333rem;\r\n\ttext-align: center;\r\n\tfont-size: 1.333rem;\r\n\tcolor: rgb(40,40,40);\r\n\tbackground: transparent;\r\n}\r\n.popoff-close:after {\r\n\tcontent: '✕';\r\n}\r\n.popoff-close:hover{\r\n\tbackground: black;\r\n\tcolor: white;\r\n}\r\n\r\n\r\n/* Effects */\r\n/* Basic effects */\r\n.popoff-effect-fade {\r\n\topacity: 0;\r\n\t-webkit-transition: all 0.3s;\r\n\t-moz-transition: all 0.3s;\r\n\ttransition: all 0.3s;\r\n}\r\n\r\n/* Effect 1: Fade in and scale up */\r\n.popoff-effect-scale {\r\n\t-webkit-transform: scale(0.7);\r\n\t-moz-transform: scale(0.7);\r\n\t-ms-transform: scale(0.7);\r\n\ttransform: scale(0.7);\r\n\topacity: 0;\r\n\t-webkit-transition: all 0.3s;\r\n\t-moz-transition: all 0.3s;\r\n\ttransition: all 0.3s;\r\n}\r\n\r\n/* Effect 2: Slide from the right */\r\n.popoff-effect-slide-right {\r\n\t-webkit-transform: translateX(20%);\r\n\t-moz-transform: translateX(20%);\r\n\t-ms-transform: translateX(20%);\r\n\ttransform: translateX(20%);\r\n\topacity: 0;\r\n\t-webkit-transition: all 0.3s cubic-bezier(0.25, 0.5, 0.5, 0.9);\r\n\t-moz-transition: all 0.3s cubic-bezier(0.25, 0.5, 0.5, 0.9);\r\n\ttransition: all 0.3s cubic-bezier(0.25, 0.5, 0.5, 0.9);\r\n}\r\n.popoff-effect-slide-bottom {\r\n\t-webkit-transform: translateY(20%);\r\n\t-moz-transform: translateY(20%);\r\n\t-ms-transform: translateY(20%);\r\n\ttransform: translateY(20%);\r\n\topacity: 0;\r\n\t-webkit-transition: all 0.3s;\r\n\t-moz-transition: all 0.3s;\r\n\ttransition: all 0.3s;\r\n}\r\n.popoff-effect-slide-left {\r\n\t-webkit-transform: translateX(-20%);\r\n\t-moz-transform: translateX(-20%);\r\n\t-ms-transform: translateX(-20%);\r\n\ttransform: translateX(-20%);\r\n\topacity: 0;\r\n\t-webkit-transition: all 0.3s;\r\n\t-moz-transition: all 0.3s;\r\n\ttransition: all 0.3s;\r\n}\r\n.popoff-effect-slide-top {\r\n\t-webkit-transform: translateY(-20%);\r\n\t-moz-transform: translateY(-20%);\r\n\t-ms-transform: translateY(-20%);\r\n\ttransform: translateY(-20%);\r\n\topacity: 0;\r\n\t-webkit-transition: all 0.3s;\r\n\t-moz-transition: all 0.3s;\r\n\ttransition: all 0.3s;\r\n}\r\n\r\n\r\n/* Effect 4: Newspaper */\r\n.popoff-effect-newspaper {\r\n\t-webkit-transform: scale(0) rotate(720deg);\r\n\t-moz-transform: scale(0) rotate(720deg);\r\n\t-ms-transform: scale(0) rotate(720deg);\r\n\ttransform: scale(0) rotate(720deg);\r\n\t-webkit-transition: all 0.5s;\r\n\t-moz-transition: all 0.5s;\r\n\ttransition: all 0.5s;\r\n\topacity: 0;\r\n}\r\n\r\n\r\n/* Effect 11: Super scaled */\r\n.popoff-effect-super-scaled {\r\n\t-webkit-transform: scale(2);\r\n\t-moz-transform: scale(2);\r\n\t-ms-transform: scale(2);\r\n\ttransform: scale(2);\r\n\topacity: 0;\r\n\t-webkit-transition: all 0.3s;\r\n\t-moz-transition: all 0.3s;\r\n\ttransition: all 0.3s;\r\n}\r\n");

module.exports = Popup;

//FIXME: demo

/**
 * @class  Popup
 *
 * @constructor
 *
 * @param {Element} el An element to take as a content
 * @param {Object} options Showing options
 *
 * @return {Popup} A popup controller
 */
function Popup(opts) {
	var _this = this;

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

	//take over type’s options
	extend(this, typeOpts, opts);

	//generate unique id
	this.id = uid();

	//FIXME: :'(
	this.update = this.update.bind(this);

	//take over a target first
	if (!this.container) {
		this.container = document.body || document.documentElement;
	}

	//ensure element
	if (!this.element) this.element = document.createElement('div');
	this.element.classList.add('popoff-popup');
	this.element.classList.add('popoff-hidden');
	this.element.classList.add('popoff-' + this.type);

	if (this.content instanceof HTMLElement) {
		this.element.appendChild(this.content);
	} else if (typeof this.content === 'string') {
		this.element.innerHTML = this.content;
	}

	//create close element
	this.closeElement = document.createElement('div');
	this.closeElement.classList.add('popoff-close');
	if (this.closable) {
		this.closeElement.addEventListener('click', function (e) {
			_this.hide();
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
			var value = this.style[name];
			if (typeof value === 'number' && !/z/.test(name)) value += 'px';
			this.element.style[name] = value;
		}
	}

	//create overflow for tall content
	this.overflowElement = document.createElement('div');
	this.overflowElement.classList.add('popoff-overflow');

	this.container.appendChild(this.element);

	if (this.escapable) {
		document.addEventListener('keyup', function (e) {
			if (!_this.isVisible) return;
			if (e.which === 27) {
				_this.hide();
			}
		});
	}

	//init proper target
	if (typeof this.target === 'string') {
		this.target = document.querySelector(this.target);
	}

	//update on resize
	window.addEventListener('resize', function () {
		_this.update();
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
	tall: false
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
		tall: true,
		effect: ['fade', 'zoom', 'slide'],
		onInit: function onInit() {
			var _this2 = this;

			if (this.target) {
				this.target.addEventListener('click', function (e) {
					if (_this2.isVisible) return;

					return _this2.show();
				});
			} else {
				this.target = window;
			}
		},
		onShow: function onShow() {
			//FIXME: maybe not really good pattern, but the modal is always placed relative to window viewport. Easies than managing alignTo property.
			this.currentTarget = window;
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
		effect: ['fade'],
		onInit: function onInit() {
			var _this3 = this;

			if (this.target) {
				this.target.addEventListener('click', function (e) {
					if (_this3.isVisible) return _this3.hide();else return _this3.show();
				});
			}

			//hide on unfocus
			document.addEventListener('click', function (e) {
				if (!_this3.isVisible) {
					return;
				}

				//ignore contain clicks
				if (_this3.element.contains(e.target)) {
					return;
				}

				//ignore self clicks
				_this3.hide();
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
		effect: ['fade'],
		timeout: 500,
		onInit: function onInit() {
			var _this4 = this;

			var that = this;

			if (this.target) {
				this.target.addEventListener('mouseenter', function (e) {
					_this4._leave && clearTimeout(_this4._leave);
					if (_this4.isVisible) return;
					_this4.show();
				});
				this.target.addEventListener('mouseleave', function (e) {
					if (!_this4.isVisible) return;
					_this4._leave = setTimeout(function () {
						_this4.hide();
					}, _this4.timeout);
				});
			}

			this.element.addEventListener('mouseenter', function (e) {
				if (!_this4.isVisible) return;
				_this4._leave && clearTimeout(_this4._leave);
			});
			this.element.addEventListener('mouseleave', function (e) {
				if (!_this4.isVisible) return;
				_this4._leave = setTimeout(function () {
					_this4.hide();
				}, _this4.timeout);
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
		effect: ['fade', 'zoom', 'slide'],
		update: function update() {},
		onInit: function onInit() {
			var _this5 = this;

			if (this.target) {
				this.target.addEventListener('click', function (e) {
					if (_this5.isVisible) return;

					return _this5.show();
				});
			} else {
				this.target = window;
			}
		},
		onShow: function onShow() {
			if (!/top|left|bottom|right/.test(this.side)) this.side = this.types.sidebar.side;
			this.element.setAttribute('data-side', this.side);
		}
	}
};

/**
 * Show popup near to the target
 */
Popup.prototype.show = function (target) {
	var _this6 = this;

	if (this.isVisible) return this;

	//ensure effects classes
	var effects = Array.isArray(this.effect) ? this.effect : [this.effect];
	effects.forEach(function (effect) {
		_this6.element.classList.add('popoff-effect-' + effect);
		_this6.tipElement.classList.add('popoff-effect-' + effect);
	});

	this.currentTarget = target || this.target;
	this.currentTarget && this.currentTarget.classList && this.currentTarget.classList.add('popoff-active');
	this.element.classList.remove('popoff-hidden');
	this.tipElement.classList.remove('popoff-hidden');

	var elHeight = this.element.offsetHeight;

	//apply overflow on body for tall content
	if (this.tall && elHeight > window.innerHeight) {
		this.isTall = true;
		this.element.style.left = null;
		this.element.style.right = null;
		this.container.classList.add('popoff-container');
		this.container.appendChild(this.overflowElement);
		this.overflowElement.appendChild(this.element);
	}

	this.tipElement.classList.add('popoff-animate');
	this.element.classList.add('popoff-animate');

	this.emit('show', this.currentTarget);

	//in some way it needs to be called in timeout with some delay, otherwise animation fails
	setTimeout(function () {
		var effects = Array.isArray(_this6.effect) ? _this6.effect : [_this6.effect];
		effects.forEach(function (effect) {
			_this6.element.classList.remove('popoff-effect-' + effect);
			_this6.tipElement.classList.remove('popoff-effect-' + effect);
		});
		_this6.isVisible = true;
		_this6.update();
	}, 10);

	if (this.overlay) {
		this._overlay = createOverlay({
			closable: true,
			container: this.isTall ? this.overflowElement : this.container
		}).on('hide', function (e) {
			_this6._overlay = null;
			_this6.hide();
		}).show();
	}

	this.isAnimating = true;
	this.animend(function (e) {
		//in case if something happened with content during the animation
		// this.update();
		_this6.isAnimating = false;
		_this6.emit('afterShow');

		_this6.tipElement.classList.remove('popoff-animate');
		_this6.element.classList.remove('popoff-animate');
	});

	return this;
};

/**
 * Hide popup
 */
Popup.prototype.hide = function () {
	var _this7 = this;

	//overlay recurrently calls this.hide, so just drop it here
	if (this._overlay) return this._overlay.hide();

	this.currentTarget && this.currentTarget.classList && this.currentTarget.classList.remove('popoff-active');

	this.emit('hide');

	var effects = Array.isArray(this.effect) ? this.effect : [this.effect];
	effects.forEach(function (effect) {
		_this7.element.classList.add('popoff-effect-' + effect);
		_this7.tipElement.classList.add('popoff-effect-' + effect);
	});

	this.isAnimating = true;

	this.tipElement.classList.add('popoff-animate');
	this.element.classList.add('popoff-animate');

	this.animend(function () {
		_this7.isVisible = false;
		_this7.isAnimating = false;
		_this7._overlay = null;
		_this7.tipElement.classList.remove('popoff-animate');
		_this7.element.classList.remove('popoff-animate');
		_this7.element.classList.add('popoff-hidden');
		_this7.tipElement.classList.add('popoff-hidden');

		effects.forEach(function (effect) {
			_this7.element.classList.remove('popoff-effect-' + effect);
			_this7.tipElement.classList.remove('popoff-effect-' + effect);
		});

		if (_this7.isTall) {
			_this7.isTall = false;
			_this7.container.classList.remove('popoff-container');
			_this7.container.removeChild(_this7.overflowElement);
			_this7.container.appendChild(_this7.element);
		}

		_this7.emit('afterHide');
	});

	return this;
};

/** Place popup next to the target */
Popup.prototype.update = function (how) {
	if (!this.isVisible) return this;

	//tall modals are placed via css
	if (this.isTall) return this;

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
};

/** Trigger callback once on anim end */
Popup.prototype.animend = function (cb) {
	var _this8 = this;

	var to = setTimeout(function () {
		cb.call(_this8);
	}, this.animTimeout);

	this.element.addEventListener('transitionend', end);
	this.element.addEventListener('webkitTransitionEnd', end);
	this.element.addEventListener('otransitionend', end);
	this.element.addEventListener('oTransitionEnd', end);
	this.element.addEventListener('msTransitionEnd', end);

	var that = this;
	function end() {
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
};

},{"./overlay":123,"events":1,"get-uid":61,"inherits":64,"insert-css":65,"placer":98,"xtend/mutable":122}],5:[function(require,module,exports){
var m = require('mumath');
var margins = require('mucss/margin');
var paddings = require('mucss/padding');
var offsets = require('mucss/offset');
var borders = require('mucss/border');
var css = require('mucss/css');
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
		if (s.position === 'static') css(el, 'position', 'relative');


		//include margins
		var placeeMargins = margins(el);

		//get relativeTo & parent rectangles
		if (isFixed(el)) {
			var parent = win;
		}
		else {
			var parent = el.offsetParent || win;
		}
		var parentRect = offsets(parent);
		var parentPaddings = paddings(parent);
		var parentBorders = borders(parent);

		//correct parentRect
		if (parent === window || (parent === doc.body && getComputedStyle(parent).position === 'static') || parent === root) {
			parentRect.left = 0;
			parentRect.top = 0;
		}
		parentRect = m.sub(parentRect, parentBorders);
		parentRect = m.add(parentRect, placeeMargins);

		// parentRect = m.add(parentRect, parentPaddings);

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

	css(placee, {
		left: desirableLeft,
		right: 'auto'
	});
}


/**
 * Place vertically
 */
function alignY ( placee, placerRect, parentRect, align ){
	if (typeof align !== 'number') return;

	//desirable absolute top
	var desirableTop = placerRect.top + placerRect.height*align - placee.offsetHeight*align - parentRect.top;

	css(placee, {
		top: desirableTop,
		bottom: 'auto'
	});
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
},{"mucss/border":73,"mucss/css":74,"mucss/is-fixed":77,"mucss/margin":78,"mucss/offset":79,"mucss/padding":80,"mumath":14}],6:[function(require,module,exports){
/**
 * @module  mumath/add
 */
module.exports = require('./wrap')(function () {
	var result = arguments[0];
	for (var i = 1, l = arguments.length; i < l; i++) {
		result += arguments[i];
	}
	return result;
});
},{"./wrap":29}],7:[function(require,module,exports){
/**
 * Clamper.
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
},{"./wrap":29}],8:[function(require,module,exports){

},{}],9:[function(require,module,exports){
/**
 * @module mumath/div
 */
module.exports = require('./wrap')(function () {
	var result = arguments[0];
	for (var i = 1, l = arguments.length; i < l; i++) {
		result /= arguments[i];
	}
	return result;
});
},{"./wrap":29}],10:[function(require,module,exports){
/**
 * @module mumath/eq
 */
module.exports = require('./wrap')(function (a, b) {
	return a === b;
});
},{"./wrap":29}],11:[function(require,module,exports){
arguments[4][8][0].apply(exports,arguments)
},{"dup":8}],12:[function(require,module,exports){
/**
 * @module mumath/gt
 */
module.exports = require('./wrap')(function (a, b) {
	return a > b;
});
},{"./wrap":29}],13:[function(require,module,exports){
/**
 * @module mumath/gte
 */
module.exports = require('./wrap')(function (a, b) {
	return a >= b;
});
},{"./wrap":29}],14:[function(require,module,exports){
/**
 * Composed set of all math utils
 *
 * @module  mumath
 */
module.exports = {
	between: require('./between'),
	isBetween: require('./is-between'),
	round: require('./round'),
	precision: require('./precision'),
	loop: require('./loop'),
	add: require('./add'),
	sub: require('./sub'),
	min: require('./min'),
	max: require('./max'),
	div: require('./div'),
	lg: require('./lg'),
	log: require('./log'),
	mult: require('./mult'),
	mod: require('./mod'),
	floor: require('./floor'),
	ceil: require('./ceil'),

	gt: require('./gt'),
	gte: require('./gte'),
	lt: require('./lt'),
	lte: require('./lte'),
	eq: require('./eq'),
	ne: require('./ne'),
};
},{"./add":6,"./between":7,"./ceil":8,"./div":9,"./eq":10,"./floor":11,"./gt":12,"./gte":13,"./is-between":15,"./lg":16,"./log":17,"./loop":18,"./lt":19,"./lte":20,"./max":21,"./min":22,"./mod":23,"./mult":24,"./ne":25,"./precision":26,"./round":27,"./sub":28}],15:[function(require,module,exports){
/**
 * Whether element is between left & right including
 *
 * @param {number} a
 * @param {number} left
 * @param {number} right
 *
 * @return {Boolean}
 */
module.exports = require('./wrap')(function(a, left, right){
	if (a <= right && a >= left) return true;
	return false;
});
},{"./wrap":29}],16:[function(require,module,exports){
/**
 * Base 10 logarithm
 *
 * @module mumath/lg
 */
module.exports = require('./wrap')(function (a) {
	return Math.log(a) / Math.log(10);
});
},{"./wrap":29}],17:[function(require,module,exports){
/**
 * Natural logarithm
 *
 * @module mumath/log
 */
module.exports = require('./wrap')(function (a) {
	return Math.log(a);
});
},{"./wrap":29}],18:[function(require,module,exports){
/**
 * @module  mumath/loop
 *
 * Looping function for any framesize
 */

module.exports = require('./wrap')(function (value, left, right) {
	//detect single-arg case, like mod-loop
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
},{"./wrap":29}],19:[function(require,module,exports){
/**
 * @module mumath/lt
 */
module.exports = require('./wrap')(function (a, b) {
	return a < b;
});
},{"./wrap":29}],20:[function(require,module,exports){
/**
 * @module mumath/lte
 */
module.exports = require('./wrap')(function (a, b) {
	return a <= b;
});
},{"./wrap":29}],21:[function(require,module,exports){
/** @module mumath/max */
module.exports = require('./wrap')(Math.max);
},{"./wrap":29}],22:[function(require,module,exports){
/**
 * @module mumath/min
 */
module.exports = require('./wrap')(Math.min);
},{"./wrap":29}],23:[function(require,module,exports){
/**
 * @module mumath/mod
 */
module.exports = require('./wrap')(function () {
	var result = arguments[0];
	for (var i = 1, l = arguments.length; i < l; i++) {
		result %= arguments[i];
	}
	return result;
});
},{"./wrap":29}],24:[function(require,module,exports){
/**
 * @module mumath/mult
 */
module.exports = require('./wrap')(function () {
	var result = arguments[0];
	for (var i = 1, l = arguments.length; i < l; i++) {
		result *= arguments[i];
	}
	return result;
});
},{"./wrap":29}],25:[function(require,module,exports){
/**
 * @module mumath/ne
 */
module.exports = require('./wrap')(function (a, b) {
	return a !== b;
});
},{"./wrap":29}],26:[function(require,module,exports){
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
},{"./wrap":29}],27:[function(require,module,exports){
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
},{"./precision":26,"./wrap":29}],28:[function(require,module,exports){
/**
 * @module mumath/sub
 */
module.exports = require('./wrap')(function () {
	var result = arguments[0];
	for (var i = 1, l = arguments.length; i < l; i++) {
		result -= arguments[i];
	}
	return result;
});
},{"./wrap":29}],29:[function(require,module,exports){
/**
 * Get fn wrapped with array/object attrs recognition
 *
 * @return {Function} Target function
 */
module.exports = function(fn){
	return function(a){
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
				result[i] = fn.apply(this, slice);
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
				result[i] = fn.apply(this, slice);
			}
			return result;
		}
		else {
			return fn.apply(this, args);
		}
	};
};
},{}],30:[function(require,module,exports){
(function (process){
'use strict';
var ESC = '\u001b[';
var x = module.exports;

x.cursorTo = function (x, y) {
	if (arguments.length === 0) {
		return ESC + 'H';
	}

	if (arguments.length === 1) {
		return ESC + (x + 1) + 'G';
	}

	return ESC + (y + 1) + ';' + (x + 1) + 'H';
};

x.cursorMove = function (x, y) {
	var ret = '';

	if (x < 0) {
		ret += ESC + (-x) + 'D';
	} else if (x > 0) {
		ret += ESC + x + 'C';
	}

	if (y < 0) {
		ret += ESC + (-y) + 'A';
	} else if (y > 0) {
		ret += ESC + y + 'B';
	}

	return ret;
};

x.cursorUp = function (count) {
	return ESC + (typeof count === 'number' ? count : 1) + 'A';
};

x.cursorDown = function (count) {
	return ESC + (typeof count === 'number' ? count : 1) + 'B';
};

x.cursorForward = function (count) {
	return ESC + (typeof count === 'number' ? count : 1) + 'C';
};

x.cursorBackward = function (count) {
	return ESC + (typeof count === 'number' ? count : 1) + 'D';
};

x.cursorLeft = ESC + '1000D';
x.cursorSavePosition = ESC + 's';
x.cursorRestorePosition = ESC + 'u';
x.cursorGetPosition = ESC + '6n';
x.cursorNextLine = ESC + 'E';
x.cursorPrevLine = ESC + 'F';
x.cursorHide = ESC + '?25l';
x.cursorShow = ESC + '?25h';

x.eraseLines = function (count) {
	var clear = '';

	for (var i = 0; i < count; i++) {
		clear += x.cursorLeft + x.eraseEndLine + (i < count - 1 ? x.cursorUp() : '');
	}

	return clear;
};

x.eraseEndLine = ESC + 'K';
x.eraseStartLine = ESC + '1K';
x.eraseLine = ESC + '2K';
x.eraseDown = ESC + 'J';
x.eraseUp = ESC + '1J';
x.eraseScreen = ESC + '2J';
x.scrollUp = ESC + 'S';
x.scrollDown = ESC + 'T';

x.clearScreen = '\u001bc';
x.beep = '\u0007';

x.image = function (buf, opts) {
	opts = opts || {};

	var ret = '\u001b]1337;File=inline=1';

	if (opts.width) {
		ret += ';width=' + opts.width;
	}

	if (opts.height) {
		ret += ';height=' + opts.height;
	}

	if (opts.preserveAspectRatio === false) {
		ret += ';preserveAspectRatio=0';
	}

	return ret + ':' + buf.toString('base64') + '\u0007';
};

x.iTerm = {};

x.iTerm.setCwd = function (cwd) {
	return '\u001b]50;CurrentDir=' + (cwd || process.cwd()) + '\u0007';
};

}).call(this,require('_process'))
},{"_process":3}],31:[function(require,module,exports){
'use strict';
module.exports = function () {
	return /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
};

},{}],32:[function(require,module,exports){
'use strict';

function assembleStyles () {
	var styles = {
		modifiers: {
			reset: [0, 0],
			bold: [1, 22], // 21 isn't widely supported and 22 does the same thing
			dim: [2, 22],
			italic: [3, 23],
			underline: [4, 24],
			inverse: [7, 27],
			hidden: [8, 28],
			strikethrough: [9, 29]
		},
		colors: {
			black: [30, 39],
			red: [31, 39],
			green: [32, 39],
			yellow: [33, 39],
			blue: [34, 39],
			magenta: [35, 39],
			cyan: [36, 39],
			white: [37, 39],
			gray: [90, 39]
		},
		bgColors: {
			bgBlack: [40, 49],
			bgRed: [41, 49],
			bgGreen: [42, 49],
			bgYellow: [43, 49],
			bgBlue: [44, 49],
			bgMagenta: [45, 49],
			bgCyan: [46, 49],
			bgWhite: [47, 49]
		}
	};

	// fix humans
	styles.colors.grey = styles.colors.gray;

	Object.keys(styles).forEach(function (groupName) {
		var group = styles[groupName];

		Object.keys(group).forEach(function (styleName) {
			var style = group[styleName];

			styles[styleName] = group[styleName] = {
				open: '\u001b[' + style[0] + 'm',
				close: '\u001b[' + style[1] + 'm'
			};
		});

		Object.defineProperty(styles, groupName, {
			value: group,
			enumerable: false
		});
	});

	return styles;
}

Object.defineProperty(module, 'exports', {
	enumerable: true,
	get: assembleStyles
});

},{}],33:[function(require,module,exports){
'use strict'

/**
 * Expose `arrayFlatten`.
 */
module.exports = flatten
module.exports.from = flattenFrom
module.exports.depth = flattenDepth
module.exports.fromDepth = flattenFromDepth

/**
 * Flatten an array.
 *
 * @param  {Array} array
 * @return {Array}
 */
function flatten (array) {
  if (!Array.isArray(array)) {
    throw new TypeError('Expected value to be an array')
  }

  return flattenFrom(array)
}

/**
 * Flatten an array-like structure.
 *
 * @param  {Array} array
 * @return {Array}
 */
function flattenFrom (array) {
  return flattenDown(array, [], Infinity)
}

/**
 * Flatten an array-like structure with depth.
 *
 * @param  {Array}  array
 * @param  {number} depth
 * @return {Array}
 */
function flattenDepth (array, depth) {
  if (!Array.isArray(array)) {
    throw new TypeError('Expected value to be an array')
  }

  return flattenFromDepth(array, depth)
}

/**
 * Flatten an array-like structure with depth.
 *
 * @param  {Array}  array
 * @param  {number} depth
 * @return {Array}
 */
function flattenFromDepth (array, depth) {
  if (typeof depth !== 'number') {
    throw new TypeError('Expected the depth to be a number')
  }

  return flattenDownDepth(array, [], depth)
}

/**
 * Flatten an array indefinitely.
 *
 * @param  {Array} array
 * @param  {Array} result
 * @return {Array}
 */
function flattenDown (array, result) {
  for (var i = 0; i < array.length; i++) {
    var value = array[i]

    if (Array.isArray(value)) {
      flattenDown(value, result)
    } else {
      result.push(value)
    }
  }

  return result
}

/**
 * Flatten an array with depth.
 *
 * @param  {Array}  array
 * @param  {Array}  result
 * @param  {number} depth
 * @return {Array}
 */
function flattenDownDepth (array, result, depth) {
  depth--

  for (var i = 0; i < array.length; i++) {
    var value = array[i]

    if (depth > -1 && Array.isArray(value)) {
      flattenDownDepth(value, result, depth)
    } else {
      result.push(value)
    }
  }

  return result
}

},{}],34:[function(require,module,exports){
/*!
 * array-unique <https://github.com/jonschlinkert/array-unique>
 *
 * Copyright (c) 2014 Jon Schlinkert, contributors.
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function unique(arr) {
  if (!Array.isArray(arr)) {
    throw new TypeError('array-unique expects an array.');
  }

  var len = arr.length;
  var i = -1;

  while (i++ < len) {
    var j = i + 1;

    for (; j < arr.length; ++j) {
      if (arr[i] === arr[j]) {
        arr.splice(j--, 1);
      }
    }
  }
  return arr;
};

},{}],35:[function(require,module,exports){
/*!
 * arrayify-compact <https://github.com/jonschlinkert/arrayify-compact>
 *
 * Copyright (c) 2014 Jon Schlinkert, contributors.
 * Licensed under the MIT License
 */

'use strict';

var flatten = require('array-flatten');

module.exports = function(arr) {
  return flatten(!Array.isArray(arr) ? [arr] : arr)
    .filter(Boolean);
};

},{"array-flatten":33}],36:[function(require,module,exports){
(function (process){
'use strict';
var escapeStringRegexp = require('escape-string-regexp');
var ansiStyles = require('ansi-styles');
var stripAnsi = require('strip-ansi');
var hasAnsi = require('has-ansi');
var supportsColor = require('supports-color');
var defineProps = Object.defineProperties;
var isSimpleWindowsTerm = process.platform === 'win32' && !/^xterm/i.test(process.env.TERM);

function Chalk(options) {
	// detect mode if not set manually
	this.enabled = !options || options.enabled === undefined ? supportsColor : options.enabled;
}

// use bright blue on Windows as the normal blue color is illegible
if (isSimpleWindowsTerm) {
	ansiStyles.blue.open = '\u001b[94m';
}

var styles = (function () {
	var ret = {};

	Object.keys(ansiStyles).forEach(function (key) {
		ansiStyles[key].closeRe = new RegExp(escapeStringRegexp(ansiStyles[key].close), 'g');

		ret[key] = {
			get: function () {
				return build.call(this, this._styles.concat(key));
			}
		};
	});

	return ret;
})();

var proto = defineProps(function chalk() {}, styles);

function build(_styles) {
	var builder = function () {
		return applyStyle.apply(builder, arguments);
	};

	builder._styles = _styles;
	builder.enabled = this.enabled;
	// __proto__ is used because we must return a function, but there is
	// no way to create a function with a different prototype.
	/* eslint-disable no-proto */
	builder.__proto__ = proto;

	return builder;
}

function applyStyle() {
	// support varags, but simply cast to string in case there's only one arg
	var args = arguments;
	var argsLen = args.length;
	var str = argsLen !== 0 && String(arguments[0]);

	if (argsLen > 1) {
		// don't slice `arguments`, it prevents v8 optimizations
		for (var a = 1; a < argsLen; a++) {
			str += ' ' + args[a];
		}
	}

	if (!this.enabled || !str) {
		return str;
	}

	var nestedStyles = this._styles;
	var i = nestedStyles.length;

	// Turns out that on Windows dimmed gray text becomes invisible in cmd.exe,
	// see https://github.com/chalk/chalk/issues/58
	// If we're on Windows and we're dealing with a gray color, temporarily make 'dim' a noop.
	var originalDim = ansiStyles.dim.open;
	if (isSimpleWindowsTerm && (nestedStyles.indexOf('gray') !== -1 || nestedStyles.indexOf('grey') !== -1)) {
		ansiStyles.dim.open = '';
	}

	while (i--) {
		var code = ansiStyles[nestedStyles[i]];

		// Replace any instances already present with a re-opening code
		// otherwise only the part of the string until said closing code
		// will be colored, and the rest will simply be 'plain'.
		str = code.open + str.replace(code.closeRe, code.open) + code.close;
	}

	// Reset the original 'dim' if we changed it to work around the Windows dimmed gray issue.
	ansiStyles.dim.open = originalDim;

	return str;
}

function init() {
	var ret = {};

	Object.keys(styles).forEach(function (name) {
		ret[name] = {
			get: function () {
				return build.call(this, [name]);
			}
		};
	});

	return ret;
}

defineProps(Chalk.prototype, init());

module.exports = new Chalk();
module.exports.styles = ansiStyles;
module.exports.hasColor = hasAnsi;
module.exports.stripColor = stripAnsi;
module.exports.supportsColor = supportsColor;

}).call(this,require('_process'))
},{"_process":3,"ansi-styles":32,"escape-string-regexp":57,"has-ansi":62,"strip-ansi":119,"supports-color":120}],37:[function(require,module,exports){
(function (process){
'use strict';
var restoreCursor = require('restore-cursor');
var hidden = false;

exports.show = function () {
	hidden = false;
	process.stdout.write('\u001b[?25h');
};

exports.hide = function () {
	restoreCursor();
	hidden = true;
	process.stdout.write('\u001b[?25l');
};

exports.toggle = function (force) {
	if (force !== undefined) {
		hidden = force;
	}

	if (hidden) {
		exports.show();
	} else {
		exports.hide();
	}
};

}).call(this,require('_process'))
},{"_process":3,"restore-cursor":114}],38:[function(require,module,exports){
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
},{"st8":39}],39:[function(require,module,exports){
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
},{"events":1,"is-plain-object":68}],40:[function(require,module,exports){
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
var q = require('queried');


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

	//define mode of drag
	defineState(self, 'css3', self.css3);
	self.css3 = true;

	//define state behaviour
	defineState(self, 'state', self.state);

	//define axis behaviour
	defineState(self, 'axis', self.axis);
	self.axis = null;

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
var proto = Draggable.prototype = Object.create(Emitter.prototype);


/** Init droppable "plugin" */
proto.initDroppable = function () {
	var self = this;

	on(self, 'dragstart', function () {
		var self = this;
		self.dropTargets = q.all(self.droppable);
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
proto.state = {
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

	destroy: function () {
		var self = this;
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
proto.drag = function (e) {
	var self = this;

	e.preventDefault();

	var mouseX = getClientX(e, self.touchIdx),
		mouseY = getClientY(e, self.touchIdx);

	//calc mouse movement diff
	var diffMouseX = mouseX - self.prevMouseX,
		diffMouseY = mouseY - self.prevMouseY;

	//absolute mouse coordinate
	var mouseAbsX = mouseX + win.pageXOffset,
		mouseAbsY = mouseY + win.pageYOffset;

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
proto.setTouch = function (e) {
	if (!e.touches || this.isTouched()) return this;

	//current touch index
	this.touchIdx = touches;
	touches++;

	return this;
};
proto.resetTouch = function () {
	touches = 0;
	this.touchIdx = null;

	return this;
};
proto.isTouched = function () {
	return this.touchIdx !== null;
};


/** Index to fetch touch number from event */
proto.touchIdx = null;


/**
 * Update movement limits.
 * Refresh self.withinOffsets and self.limits.
 */
proto.update = function (e) {
	var self = this;

	//update handles
	self.currentHandles.forEach(function (handle) {
		off(handle, self._ns);
	});

	var cancelEls = q.all(self.cancel);

	self.currentHandles = q.all(self.handle);

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
proto.updateLimits = function () {
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
proto.updateInfo = function (x, y) {
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
 * - position === false (slower but more precise and cross-browser)
 * - translate3d === true (faster but may cause blurs on linux systems)
 */
proto.css3 = {
	_: function () {
		css(this.element, 'position', 'absolute');
		this.getCoords = function () {
			// return [this.element.offsetLeft, this.element.offsetTop];
			return [parseCSSValue(css(this.element,'left')), parseCSSValue(css(this.element, 'top'))];
		};

		this.setCoords = function (x, y) {
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
		};
	},

	//undefined placing is treated as translate3d
	true: function () {
		this.getCoords  = function () {
			return getTranslate(this.element).slice(0, 2) || [0,0];
		};

		this.setCoords = function (x, y) {
			if (x == null) x = this.prevX;
			if (y == null) y = this.prevY;

			x = round(x, this.precision);
			y = round(y, this.precision);

			css(this.element, 'transform', ['translate3d(', x, 'px,', y, 'px, 0)'].join(''));

			this.updateInfo(x, y);
		};
	}
};


/**
 * Restricting container
 * @type {Element|object}
 * @default doc.documentElement
 */
proto.within = doc;


/** Handle to drag */
proto.handle;


Object.defineProperties(proto, {
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
proto.release = false;
proto.releaseDuration = 500;
proto.velocity = 1000;
proto.maxSpeed = 250;
proto.framerate = 50;


/** To what extent round position */
proto.precision = 1;


/** Droppable params */
proto.droppable = null;
proto.droppableTolerance = 0.5;
proto.droppableClass = null;


/** Slow down movement by pressing ctrl/cmd */
proto.sniper = true;


/** How much to slow sniper drag */
proto.sniperSlowdown = .85;


/**
 * Restrict movement by axis
 *
 * @default undefined
 * @enum {string}
 */
proto.axis = {
	_: function () {
		this.move = function (x, y) {
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
		};
	},
	x: function () {
		this.move = function (x, y) {
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
		};
	},
	y: function () {
		this.move = function (x, y) {
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
		};
	}
};


/** Repeat movement by one of axises */
proto.repeat = false;


/** Check whether arr is filled with zeros */
function isZeroArray(arr) {
	if (!arr[0] && !arr[1] && !arr[2] && !arr[3]) return true;
}



/** Clean all memory-related things */
proto.destroy = function () {
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



module.exports = Draggable;
},{"define-state":38,"emmy/emit":46,"emmy/off":55,"emmy/on":56,"events":1,"get-client-xy":59,"get-uid":61,"intersects":66,"mucss/css":74,"mucss/offset":79,"mucss/parse-value":81,"mucss/selection":85,"mucss/translate":86,"mumath/clamp":87,"mumath/mod":88,"mumath/round":90,"mutype/is-array":41,"mutype/is-fn":42,"mutype/is-number":43,"mutype/is-string":44,"queried":99,"xtend/mutable":122}],41:[function(require,module,exports){
module.exports = function(a){
	return a instanceof Array;
}
},{}],42:[function(require,module,exports){
module.exports = function(a){
	return !!(a && a.apply);
}
},{}],43:[function(require,module,exports){
module.exports = function(a){
	return typeof a === 'number' || a instanceof Number;
}
},{}],44:[function(require,module,exports){
module.exports = function(a){
	return typeof a === 'string' || a instanceof String;
}
},{}],45:[function(require,module,exports){
(function (process){
'use strict';

var frames = process.platform === 'win32' ?
	['-', '\\', '|', '/'] :
	['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

module.exports = function () {
	var i = 0;

	return function () {
		return frames[i = ++i % frames.length];
	};
};

module.exports.frames = frames;

}).call(this,require('_process'))
},{"_process":3}],46:[function(require,module,exports){
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
},{"./listeners":47,"icicle":48,"mutype/is-event":50,"mutype/is-node":51,"mutype/is-string":53,"sliced":54}],47:[function(require,module,exports){
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
},{}],48:[function(require,module,exports){
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
},{}],49:[function(require,module,exports){
arguments[4][41][0].apply(exports,arguments)
},{"dup":41}],50:[function(require,module,exports){
module.exports = function(target){
	return typeof Event !== 'undefined' && target instanceof Event;
};
},{}],51:[function(require,module,exports){
module.exports = function(target){
	return typeof document !== 'undefined' && target instanceof Node;
};
},{}],52:[function(require,module,exports){
/**
 * @module mutype/is-object
 */

//TODO: add st8 tests

//isPlainObject indeed
module.exports = function(o){
	// return obj === Object(obj);
	return !!o && typeof o === 'object' && o.constructor === Object;
};

},{}],53:[function(require,module,exports){
arguments[4][44][0].apply(exports,arguments)
},{"dup":44}],54:[function(require,module,exports){

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


},{}],55:[function(require,module,exports){
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
},{"./listeners":47,"icicle":48,"mutype/is-array":49,"sliced":54}],56:[function(require,module,exports){
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
},{"./listeners":47,"icicle":48,"mutype/is-object":52}],57:[function(require,module,exports){
'use strict';

var matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;

module.exports = function (str) {
	if (typeof str !== 'string') {
		throw new TypeError('Expected a string');
	}

	return str.replace(matchOperatorsRe, '\\$&');
};

},{}],58:[function(require,module,exports){
(function (process){
'use strict';

var cbs = [];
var called = false;

function exit(exit, signal) {
	if (called) {
		return;
	}

	called = true;

	cbs.forEach(function (el) {
		el();
	});

	if (exit === true) {
		process.exit(128 + signal);
	}
};

module.exports = function (cb) {
	cbs.push(cb);

	if (cbs.length === 1) {
		process.once('exit', exit);
		process.once('SIGINT', exit.bind(null, true, 2));
		process.once('SIGTERM', exit.bind(null, true, 15));
	}
};

}).call(this,require('_process'))
},{"_process":3}],59:[function(require,module,exports){
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
},{}],60:[function(require,module,exports){
/**
 * @module  get-doc
 */

var hasDom = require('has-dom');

module.exports = hasDom() ? document : null;
},{"has-dom":63}],61:[function(require,module,exports){
/** generate unique id for selector */
var counter = Date.now() % 1e9;

module.exports = function getUid(){
	return (Math.random() * 1e9 >>> 0) + (counter++);
};
},{}],62:[function(require,module,exports){
'use strict';
var ansiRegex = require('ansi-regex');
var re = new RegExp(ansiRegex().source); // remove the `g` flag
module.exports = re.test.bind(re);

},{"ansi-regex":31}],63:[function(require,module,exports){
'use strict';
module.exports = function () {
	return typeof window !== 'undefined'
		&& typeof document !== 'undefined'
		&& typeof document.createElement === 'function';
};

},{}],64:[function(require,module,exports){
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

},{}],65:[function(require,module,exports){
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

},{}],66:[function(require,module,exports){
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
},{}],67:[function(require,module,exports){
module.exports = true;
},{}],68:[function(require,module,exports){
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

},{"isobject":69}],69:[function(require,module,exports){
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

},{}],70:[function(require,module,exports){
(function (process){
'use strict';
var ansiEscapes = require('ansi-escapes');
var cliCursor = require('cli-cursor');

function main(stream) {
	var prevLineCount = 0;

	var render = function () {
		cliCursor.hide();
		var out = [].join.call(arguments, ' ') + '\n';
		stream.write(ansiEscapes.eraseLines(prevLineCount) + out);
		prevLineCount = out.split('\n').length;
	};

	render.clear = function () {
		stream.write(ansiEscapes.eraseLines(prevLineCount));
		prevLineCount = 0;
	};

	render.done = function () {
		prevLineCount = 0;
		cliCursor.show();
	};

	return render;
}

module.exports = main(process.stdout);
module.exports.stderr = main(process.stderr);
module.exports.create = main;

}).call(this,require('_process'))
},{"_process":3,"ansi-escapes":30,"cli-cursor":37}],71:[function(require,module,exports){
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
},{}],72:[function(require,module,exports){
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

},{"./dictionary":71,"os":2}],73:[function(require,module,exports){
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
},{"./parse-value":81,"./rect":83}],74:[function(require,module,exports){
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

},{"./fake-element":75,"./prefix":82}],75:[function(require,module,exports){
/** Just a fake element to test styles
 * @module mucss/fake-element
 */

module.exports = document.createElement('div');
},{}],76:[function(require,module,exports){
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
},{}],77:[function(require,module,exports){
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
},{}],78:[function(require,module,exports){
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

},{"./parse-value":81,"./rect":83}],79:[function(require,module,exports){
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
},{"./has-scroll":76,"./is-fixed":77,"./rect":83,"./scrollbar":84,"./translate":86}],80:[function(require,module,exports){
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
},{"./parse-value":81,"./rect":83}],81:[function(require,module,exports){
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
},{}],82:[function(require,module,exports){
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

},{}],83:[function(require,module,exports){
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
},{}],84:[function(require,module,exports){
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
},{}],85:[function(require,module,exports){
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
},{"./css":74}],86:[function(require,module,exports){
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
},{"./css":74,"./parse-value":81}],87:[function(require,module,exports){
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
},{"./wrap":91}],88:[function(require,module,exports){
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
},{"./wrap":91}],89:[function(require,module,exports){
arguments[4][26][0].apply(exports,arguments)
},{"./wrap":91,"dup":26}],90:[function(require,module,exports){
arguments[4][27][0].apply(exports,arguments)
},{"./precision":89,"./wrap":91,"dup":27}],91:[function(require,module,exports){
/**
 * Get fn wrapped with array/object attrs recognition
 *
 * @return {Function} Target function
 */
module.exports = function(fn){
	return function (a) {
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
				result[i] = fn.apply(this, slice);
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
				result[i] = fn.apply(this, slice);
			}
			return result;
		}
		else {
			return fn.apply(this, args);
		}
	};
};
},{}],92:[function(require,module,exports){
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
},{}],93:[function(require,module,exports){
'use strict';
module.exports = function (fn, errMsg) {
	if (typeof fn !== 'function') {
		throw new TypeError('Expected a function');
	}

	var ret;
	var called = false;
	var fnName = fn.displayName || fn.name || (/function ([^\(]+)/.exec(fn.toString()) || [])[1];

	var onetime = function () {
		if (called) {
			if (errMsg === true) {
				fnName = fnName ? fnName + '()' : 'Function';
				throw new Error(fnName + ' can only be called once.');
			}

			return ret;
		}

		called = true;
		ret = fn.apply(this, arguments);
		fn = null;

		return ret;
	};

	onetime.displayName = fnName;

	return onetime;
};

},{}],94:[function(require,module,exports){
/**
 * @module parenthesis
 */

var parse = require('./parse');
var stringify = require('./stringify');
parse.parse = parse;
parse.stringify = stringify;

module.exports = parse;
},{"./parse":95,"./stringify":96}],95:[function(require,module,exports){
/**
 * @module  parenthesis/parse
 *
 * Parse a string with parenthesis.
 *
 * @param {string} str A string with parenthesis
 *
 * @return {Array} A list with parsed parens, where 0 is initial string.
 */

//TODO: implement sequential parser of this algorithm, compare performance.
module.exports = function(str, bracket){
	//pretend non-string parsed per-se
	if (typeof str !== 'string') return [str];

	var res = [], prevStr;

	bracket = bracket || '()';

	//create parenthesis regex
	var pRE = new RegExp(['\\', bracket[0], '[^\\', bracket[0], '\\', bracket[1], ']*\\', bracket[1]].join(''));

	function replaceToken(token, idx, str){
		//save token to res
		var refId = res.push(token.slice(1,-1));

		return '\\' + refId;
	}

	//replace paren tokens till there’s none
	while (str != prevStr) {
		prevStr = str;
		str = str.replace(pRE, replaceToken);
	}

	//save resulting str
	res.unshift(str);

	return res;
};
},{}],96:[function(require,module,exports){
/**
 * @module parenthesis/stringify
 *
 * Stringify an array/object with parenthesis references
 *
 * @param {Array|Object} arr An array or object where 0 is initial string
 *                           and every other key/value is reference id/value to replace
 *
 * @return {string} A string with inserted regex references
 */

//FIXME: circular references cause recursions here
//TODO: there’s possible a recursive version of this algorithm, so test it & compare
module.exports = function (str, refs, bracket){
	var prevStr;

	//pretend bad string stringified with no parentheses
	if (!str) return '';

	if (typeof str !== 'string') {
		bracket = refs;
		refs = str;
		str = refs[0];
	}

	bracket = bracket || '()';

	function replaceRef(token, idx, str){
		return bracket[0] + refs[token.slice(1)] + bracket[1];
	}

	while (str != prevStr) {
		prevStr = str;
		str = str.replace(/\\[0-9]+/, replaceRef);
	}

	return str;
};
},{}],97:[function(require,module,exports){
(function (process){
// Generated by CoffeeScript 1.7.1
(function() {
  var getNanoSeconds, hrtime, loadTime;

  if ((typeof performance !== "undefined" && performance !== null) && performance.now) {
    module.exports = function() {
      return performance.now();
    };
  } else if ((typeof process !== "undefined" && process !== null) && process.hrtime) {
    module.exports = function() {
      return (getNanoSeconds() - loadTime) / 1e6;
    };
    hrtime = process.hrtime;
    getNanoSeconds = function() {
      var hr;
      hr = hrtime();
      return hr[0] * 1e9 + hr[1];
    };
    loadTime = getNanoSeconds();
  } else if (Date.now) {
    module.exports = function() {
      return Date.now() - loadTime;
    };
    loadTime = Date.now();
  } else {
    module.exports = function() {
      return new Date().getTime() - loadTime;
    };
    loadTime = new Date().getTime();
  }

}).call(this);

}).call(this,require('_process'))
},{"_process":3}],98:[function(require,module,exports){
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
		var placerRect = offsets(opts.target);
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

		var placerRect = offsets(opts.target);
		var parentRect = getParentRect(parent);

		//correct borders
		contractRect(parentRect, borders(parent));


		//place left (set css right because placee width may change)
		css(placee, {
			right: parentRect.right - placerRect.left,
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
		//get to & within rectangles
		var placerRect = offsets(opts.target);
		var parentRect = getParentRect(placee.offsetParent);

		//correct borders
		contractRect(parentRect, borders(placee.offsetParent));


		//place right
		css(placee, {
			left: placerRect.right - parentRect.left,
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
		var placerRect = offsets(opts.target);
		var parentRect = getParentRect(placee.offsetParent);

		//correct borders
		contractRect(parentRect, borders(parent));


		//place vertically top-side
		css(placee, {
			bottom: parentRect.bottom - placerRect.top,
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
		//get to & within rectangles
		var placerRect = offsets(opts.target);
		var parentRect = getParentRect(placee.offsetParent);


		//correct borders
		contractRect(parentRect, borders(placee.offsetParent));


		//place bottom
		css(placee, {
			top: placerRect.bottom - parentRect.top,
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
		placerRect = offsets(opts.target);

	contractRect(withinRect, borders(opts.within));

	var placeeMargins = margins(placee);

	//rect of "hot" area (available spaces from placer to container)
	var hotRect = {
		top: placerRect.top - withinRect.top,
		bottom: withinRect.bottom - placerRect.bottom,
		left: placerRect.left - withinRect.left,
		right: withinRect.right - placerRect.right
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
	if (target == null || target === window || (target === doc.body && getComputedStyle(target).position === 'static') || target === root) {
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
},{"aligner":5,"mucss/border":73,"mucss/css":74,"mucss/has-scroll":76,"mucss/is-fixed":77,"mucss/margin":78,"mucss/offset":79,"mucss/parse-value":81,"mucss/scrollbar":84,"soft-extend":117}],99:[function(require,module,exports){
/**
 * @module  queried
 */


var doc = require('get-doc');
var q = require('./lib/');


/**
 * Detect unsupported css4 features, polyfill them
 */

//detect `:scope`
try {
	doc.querySelector(':scope');
}
catch (e) {
	q.registerFilter('scope', require('./lib/pseudos/scope'));
}


//detect `:has`
try {
	doc.querySelector(':has');
}
catch (e) {
	q.registerFilter('has', require('./lib/pseudos/has'));

	//polyfilled :has requires artificial :not to make `:not(:has(...))`.
	q.registerFilter('not', require('./lib/pseudos/not'));
}


//detect `:root`
try {
	doc.querySelector(':root');
}
catch (e) {
	q.registerFilter('root', require('./lib/pseudos/root'));
}


//detect `:matches`
try {
	doc.querySelector(':matches');
}
catch (e) {
	q.registerFilter('matches', require('./lib/pseudos/matches'));
}


/** Helper methods */
q.matches = require('./lib/pseudos/matches');


module.exports = q;
},{"./lib/":100,"./lib/pseudos/has":101,"./lib/pseudos/matches":102,"./lib/pseudos/not":103,"./lib/pseudos/root":104,"./lib/pseudos/scope":105,"get-doc":60}],100:[function(require,module,exports){
/**
 * @module queried/lib/index
 */


var slice = require('sliced');
var unique = require('array-unique');
var getUid = require('get-uid');
var paren = require('parenthesis');
var isString = require('mutype/is-string');
var isArray = require('mutype/is-array');
var isArrayLike = require('mutype/is-array-like');
var arrayify = require('arrayify-compact');
var doc = require('get-doc');


/**
 * Query wrapper - main method to query elements.
 */
function queryMultiple(selector, el) {
	//ignore bad selector
	if (!selector) return [];

	//return elements passed as a selector unchanged (cover params case)
	if (!isString(selector)) {
		if (isArray(selector)) {
			return unique(arrayify(selector.map(function (sel) {
				return queryMultiple(sel, el);
			})));
		} else {
			return [selector];
		}
	}

	//catch polyfillable first `:scope` selector - just erase it, works just fine
	if (pseudos.scope) {
		selector = selector.replace(/^\s*:scope/, '');
	}

	//ignore non-queryable containers
	if (!el) {
		el = [querySingle.document];
	}

	//treat passed list
	else if (isArrayLike(el)) {
		el = arrayify(el);
	}

	//if element isn’t a node - make it q.document
	else if (!el.querySelector) {
		el = [querySingle.document];
	}

	//make any ok element a list
	else {
		el = [el];
	}

	return qPseudos(el, selector);
}


/** Query single element - no way better than return first of multiple selector */
function querySingle(selector, el){
	return queryMultiple(selector, el)[0];
}


/**
 * Return query result based off target list.
 * Parse and apply polyfilled pseudos
 */
function qPseudos(list, selector) {
	//ignore empty selector
	selector = selector.trim();
	if (!selector) return list;

	// console.group(selector);

	//scopify immediate children selector
	if (selector[0] === '>') {
		if (!pseudos.scope) {
			//scope as the first element in selector scopifies current element just ok
			selector = ':scope' + selector;
		}
		else {
			var id = getUid();
			list.forEach(function(el){el.setAttribute('__scoped', id);});
			selector = '[__scoped="' + id + '"]' + selector;
		}
	}

	var pseudo, pseudoFn, pseudoParam, pseudoParamId;

	//catch pseudo
	var parts = paren.parse(selector);
	var match = parts[0].match(pseudoRE);

	//if pseudo found
	if (match) {
		//grab pseudo details
		pseudo = match[1];
		pseudoParamId = match[2];

		if (pseudoParamId) {
			pseudoParam = paren.stringify(parts[pseudoParamId.slice(1)], parts);
		}

		//pre-select elements before pseudo
		var preSelector = paren.stringify(parts[0].slice(0, match.index), parts);

		//fix for query-relative
		if (!preSelector && !mappers[pseudo]) preSelector = '*';
		if (preSelector) list = qList(list, preSelector);


		//apply pseudo filter/mapper on the list
		pseudoFn = function(el) {return pseudos[pseudo](el, pseudoParam); };
		if (filters[pseudo]) {
			list = list.filter(pseudoFn);
		}
		else if (mappers[pseudo]) {
			list = unique(arrayify(list.map(pseudoFn)));
		}

		//shorten selector
		selector = parts[0].slice(match.index + match[0].length);

		// console.groupEnd();

		//query once again
		return qPseudos(list, paren.stringify(selector, parts));
	}

	//just query list
	else {
		// console.groupEnd();
		return qList(list, selector);
	}
}


/** Apply selector on a list of elements, no polyfilled pseudos */
function qList(list, selector){
	return unique(arrayify(list.map(function(el){
		return slice(el.querySelectorAll(selector));
	})));
}


/** Registered pseudos */
var pseudos = {};
var filters = {};
var mappers = {};


/** Regexp to grab pseudos with params */
var pseudoRE;


/**
 * Append a new filtering (classic) pseudo
 *
 * @param {string} name Pseudo name
 * @param {Function} filter A filtering function
 */
function registerFilter(name, filter, incSelf){
	if (pseudos[name]) return;

	//save pseudo filter
	pseudos[name] = filter;
	pseudos[name].includeSelf = incSelf;
	filters[name] = true;

	regenerateRegExp();
}


/**
 * Append a new mapping (relative-like) pseudo
 *
 * @param {string} name pseudo name
 * @param {Function} mapper map function
 */
function registerMapper(name, mapper, incSelf){
	if (pseudos[name]) return;

	pseudos[name] = mapper;
	pseudos[name].includeSelf = incSelf;
	mappers[name] = true;

	regenerateRegExp();
}


/** Update regexp catching pseudos */
function regenerateRegExp(){
	pseudoRE = new RegExp('::?(' + Object.keys(pseudos).join('|') + ')(\\\\[0-9]+)?');
}



/** Exports */
querySingle.all = queryMultiple;
querySingle.registerFilter = registerFilter;
querySingle.registerMapper = registerMapper;

/** Default document representative to use for DOM */
querySingle.document = doc;


module.exports = querySingle;
},{"array-unique":34,"arrayify-compact":35,"get-doc":60,"get-uid":61,"mutype/is-array":107,"mutype/is-array-like":106,"mutype/is-string":109,"parenthesis":94,"sliced":115}],101:[function(require,module,exports){
var q = require('..');

function has(el, subSelector){
	return !!q(subSelector, el);
}

module.exports = has;
},{"..":100}],102:[function(require,module,exports){
/** :matches pseudo */

var q = require('..');

function matches(el, selector){
	if (!el.parentNode) {
		var fragment = q.document.createDocumentFragment();
		fragment.appendChild(el);
	}

	return q.all(selector, el.parentNode).indexOf(el) > -1;
}

module.exports = matches;
},{"..":100}],103:[function(require,module,exports){
var matches = require('./matches');

function not(el, selector){
	return !matches(el, selector);
}

module.exports = not;
},{"./matches":102}],104:[function(require,module,exports){
var q = require('..');

module.exports = function root(el){
	return el === q.document.documentElement;
};
},{"..":100}],105:[function(require,module,exports){
/**
 * :scope pseudo
 * Return element if it has `scoped` attribute.
 *
 * @link http://dev.w3.org/csswg/selectors-4/#the-scope-pseudo
 */

module.exports = function scope(el){
	return el.hasAttribute('scoped');
};
},{}],106:[function(require,module,exports){
var isString = require('./is-string');
var isArray = require('./is-array');
var isFn = require('./is-fn');

//FIXME: add tests from http://jsfiddle.net/ku9LS/1/
module.exports = function (a){
	return isArray(a) || (a && !isString(a) && !a.nodeType && (typeof window != 'undefined' ? a != window : true) && !isFn(a) && typeof a.length === 'number');
}
},{"./is-array":107,"./is-fn":108,"./is-string":109}],107:[function(require,module,exports){
arguments[4][41][0].apply(exports,arguments)
},{"dup":41}],108:[function(require,module,exports){
arguments[4][42][0].apply(exports,arguments)
},{"dup":42}],109:[function(require,module,exports){
arguments[4][44][0].apply(exports,arguments)
},{"dup":44}],110:[function(require,module,exports){
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
	//remove all handles
	for (var hName in this.handles){
		this.element.removeChild(this.handles[hName]);
		Draggable.cache.get(this.handles[hName]).destroy();
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
},{"draggy":40,"emmy/emit":46,"emmy/on":56,"events":1,"inherits":64,"mucss/border":73,"mucss/css":74,"mucss/margin":78,"mucss/offset":79,"mucss/padding":80,"mumath/clamp":87,"mutype/is-array":111,"mutype/is-object":112,"mutype/is-string":113,"split-keys":118,"xtend/mutable":122}],111:[function(require,module,exports){
arguments[4][41][0].apply(exports,arguments)
},{"dup":41}],112:[function(require,module,exports){
arguments[4][52][0].apply(exports,arguments)
},{"dup":52}],113:[function(require,module,exports){
arguments[4][44][0].apply(exports,arguments)
},{"dup":44}],114:[function(require,module,exports){
(function (process){
'use strict';
var onetime = require('onetime');
var exitHook = require('exit-hook');

module.exports = onetime(function () {
	exitHook(function () {
		process.stdout.write('\u001b[?25h');
	});
});

}).call(this,require('_process'))
},{"_process":3,"exit-hook":58,"onetime":93}],115:[function(require,module,exports){
module.exports = exports = require('./lib/sliced');

},{"./lib/sliced":116}],116:[function(require,module,exports){
arguments[4][54][0].apply(exports,arguments)
},{"dup":54}],117:[function(require,module,exports){
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
},{}],118:[function(require,module,exports){
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
},{"mutype":92,"xtend/mutable":122}],119:[function(require,module,exports){
'use strict';
var ansiRegex = require('ansi-regex')();

module.exports = function (str) {
	return typeof str === 'string' ? str.replace(ansiRegex, '') : str;
};

},{"ansi-regex":31}],120:[function(require,module,exports){
(function (process){
'use strict';
var argv = process.argv;

var terminator = argv.indexOf('--');
var hasFlag = function (flag) {
	flag = '--' + flag;
	var pos = argv.indexOf(flag);
	return pos !== -1 && (terminator !== -1 ? pos < terminator : true);
};

module.exports = (function () {
	if ('FORCE_COLOR' in process.env) {
		return true;
	}

	if (hasFlag('no-color') ||
		hasFlag('no-colors') ||
		hasFlag('color=false')) {
		return false;
	}

	if (hasFlag('color') ||
		hasFlag('colors') ||
		hasFlag('color=true') ||
		hasFlag('color=always')) {
		return true;
	}

	if (process.stdout && !process.stdout.isTTY) {
		return false;
	}

	if (process.platform === 'win32') {
		return true;
	}

	if ('COLORTERM' in process.env) {
		return true;
	}

	if (process.env.TERM === 'dumb') {
		return false;
	}

	if (/^screen|^xterm|^vt100|color|ansi|cygwin|linux/i.test(process.env.TERM)) {
		return true;
	}

	return false;
})();

}).call(this,require('_process'))
},{"_process":3}],121:[function(require,module,exports){
(function (process){
/**
 * Simple node/browser test runner
 *
 * @module tst
 */

var chalk = require('chalk');
var isBrowser = require('is-browser');
var now = require('performance-now');
var elegantSpinner = require('elegant-spinner');
var logUpdate = require('log-update');
var ansi = require('ansi-escapes');
var inherits = require('inherits');
var Emitter = require('events');
var extend = require('xtend/mutable');


// Error.stackTraceLimit = 10;


//default indentation
test.INDENT = '  ';

//whether we run the only test, forcefully
test.ONLY_MODE = false;

//default timeout for async tests
test.TIMEOUT = 2000;

//max timeout
test.MAX_TIMEOUT = 10e5;

//chain of nested test calls
var tests = [];
var testCount = 0;

//planned tests to run
var testQueue = [];

//flag indicating that since some time tests are run in deferred fashion
//i.e. lost their stack in browser :(
var DEFERRED = false;

//indicate whether we are in only-detection mode (tests are just planned, not run)
//or we are in a forced full-bundle run. Unlikely user will ever touch this flag.
test.DETECT_ONLY = true;

//detect whether at least one test failed
test.ERROR = false;


//end with error, if any
process.on('exit', function () {
    if (test.ERROR) process.exit(1);
});


//run execution after all sync tests are registered
if (test.DETECT_ONLY) {
    setTimeout(function () {
        //if only detection mode wasn’t changed by user
        //which means sync tests are run already - run the thing
        if (test.DETECT_ONLY) {
            run();
        }
    });
}


/**
 * Test enqueuer
 */
function test (message, fn, only) {
    //if run in exclusive mode - allow only `test.only` calls
    if (test.ONLY_MODE && !only) {
        //but if test is run within the parent - allow it
        if (!tests.length) return test;
    }

    //ignore bad args
    if (!message) return test;

    //init test object params
    var testObj = new Test({
        id: testCount++,
        title: message,

        //pending, success, error, group
        status: null,

        //test function
        fn: fn,

        //nested tests
        children: [],

        //whether test should be resolved
        async: undefined,

        //whether the test is last child within the group
        last: false,

        //timeout for the async
        _timeout: test.TIMEOUT,

        //whether the test is the only to run (launched via .only method)
        only: !!only,

        //whether the test was started in deferred fashion
        //it can be sync, but launched after async
        deferred: DEFERRED
    });

    //handle args
    if (!fn) {
        //if only message passed - do skip
        if (!fn && typeof message === 'string') {
            testObj.status = 'skip';
        }
        else {
            //detect test name
            testObj.fn = message;
            message = message.name;
            if (!message) message = 'Test #' + testObj.id;

            //update test title
            testObj.title = message;
        }
    }

    //detect async as at least one function argument
    //NOTE: tests returning promise will set async flag here
    if (testObj.async == null) {
        testObj.async = !!(testObj.fn && testObj.fn.length);
    }

    //also detect promise, if passed one
    if (testObj.fn && testObj.fn.then) {
        //also that means that the test is run already
        //and tests within the promise executor are already detected it’s parent wrongly
        //nothing we can do. Redefining parent is not an option -
        //we don’t know which tests were of this parent, which were not.
        testObj.promise = testObj.fn;
        testObj.async = true;
        testObj.time = now();
    }

    //nested tests are detected here
    //because calls to `.test` from children happen only when some test is active
    testObj.parent = tests[tests.length - 1];

    //register children - supposed that parent will run all the children after fin
    if (testObj.parent) {
        testObj.parent.children.push(testObj);
    }
    //if test has no parent - plan it's separate run
    else {
        testQueue.push(testObj);
    }

    //if detecion only mode - ignore execution
    //if ONLY_MODE - execute it at instant
    if (!test.DETECT_ONLY || test.ONLY_MODE) {
        run();
    }

    return testObj;
}

/**
 * Tests queue runner
 */
var currentTest;
function run () {
    //ignore active run
    if (currentTest) return;

    //get the planned test
    currentTest = testQueue.shift();

    //if the queue is empty - return
    if (!currentTest) return;

    //ignore test if it is not the only run
    if (test.ONLY_MODE && !currentTest.only) {
        return planRun();
    }

    //exec it, the promise will be formed
    currentTest.exec();

    //at the moment test is run, we know all it’s children
    //push all the children to the queue, after the current test
    //FIXME: this guy erases good stacktrace :< Maybe call asyncs last?
    var children = currentTest.children;

    //mind the case if no only children test is selected - run them all instead of none
    if (children.every(function (child) {return !child.only})) {
        children.forEach(function (child) {
            child.only = true;
        });
    }

    for (var i = children.length; i--;){
        testQueue.unshift(children[i]);
    }

    //mark last kid
    if (children.length) {
        children[children.length - 1].last = true;
    }

    //if test is not async - run results at instant to avoid losing stacktrace
    if (!currentTest.async) {
        currentTest = null;
        run();
    }
    //plan running next test after the promise
    else {
        DEFERRED = true;
        currentTest.promise.then(planRun, planRun);
    }

    function planRun () {
        currentTest = null;
        run();
    }
}



/**
 * A test object constructor
 */
function Test (opts) {
    extend(this, opts);
}

inherits(Test, Emitter);


/**
 * Call before exec
 */
Test.prototype.after = function (cb) {
    this.once('after', cb);
    return this;
};

/**
 * Call after exec
 */
Test.prototype.before = function (cb) {
    this.once('before', cb);
    return this;
};

/**
 * Bind promise-like
 */
Test.prototype.then = function (resolve, reject) {
    this.once('success', resolve);
    this.once('error', reject);
    return this;
};

/**
 * Mocha-compat timeout setter
 */
Test.prototype.timeout = function (value) {
    if (value == null) return this._timeout;
    if (value === false) this._timeout = test.MAX_TIMEOUT;
    else if (value === Infinity) this._timeout = test.MAX_TIMEOUT;
    else this._timeout = value;
    return this;
}

/**
 * Prototype props
 *
 * @True {[type]}
 */
extend(Test.prototype, {
    id: testCount,
    title: 'Undefined test',

    //pending, success, error, group
    status: null,

    //test function
    fn: null,

    //nested tests
    children: [],

    //whether test should be resolved
    async: undefined,

    //whether the test is last child within the group
    last: false,

    //timeout for the async
    _timeout: test.TIMEOUT,

    //whether the test is the only to run (launched via .only method)
    only: false,

    //whether the test was started in deferred fashion
    //it can be sync, but launched after async
    deferred: DEFERRED
});

/**
 * Execute main test function
 */
Test.prototype.exec = function () {
    var self = this;

    //ignore skipping test
    if (self.status === 'skip') {
        self.promise = Promise.resolve();
        self.print();
        return self;
    }

    //save test to the chain
    tests.push(self);

    //display title of the test
    self.printTitle();

    //timeout promise timeout id
    var toId;

    //prepare test
    self.emit('before');

    //exec sync test
    if (!self.async) {
        self.promise = Promise.resolve();

        var time;
        try {

            self.time = now();
            var result = self.fn.call(self);
            time = now() - self.time;

        } catch (e) {
            self.fail(e);
        }

        //if the result is promise - whoops, we need to run async
        if (result && result.then) {
            self.async = true;
            self.promise = result;
            //FIXME: this guy violates the order of nesting
            //because so far it was thought as sync
            self.execAsync();
        }

        //if result is not error - do finish
        else {
            self.time = time;
            self.emit('after');

            if (!self.error) {
                if (!self.status !== 'group') self.status = 'success';

                self.emit('success');
                self.print();
            }
        }

    }
    else {
        self.execAsync();
    }

    //after promise’s executor, but before promise then’s
    //so user can’t create tests asynchronously, they should be created at once
    tests.pop();

    return self;
};


/*
 * Exec async test - it should be run in promise
 * sorry about the stacktrace, nothing I can do...
 */
Test.prototype.execAsync = function () {
    var self = this;

    //if promise is already created (by user) - race with timeout
    //FIXME: add time measure
    if (self.promise) {
        self.promise = Promise.race([
            self.promise,
            new Promise(execTimeout)
        ]);
    }
    //else - invoke function
    else {
        self.promise = Promise.race([
            new Promise(function (resolve, reject) {
                self.status = 'pending';
                self.time = now();
                return self.fn.call(self, resolve);
            }),
            new Promise(execTimeout)
        ])
    }

    self.promise.then(function () {
        self.time = now() - self.time;

        clearTimeout(toId);
        if (self.status !== 'group') self.status = 'success';

        self.emit('after');
        self.emit('success');

        self.print();
    }, function (e) {
        self.fail(e)
    });

    function execTimeout (resolve, reject) {
        toId = setTimeout(function () {
            reject(new Error('Timeout ' + self._timeout + 'ms reached. Please fix the test or set `this.timeout(' + (self._timeout + 1000) + ');`.'));
        }, self._timeout);
    }
};


/**
 * Resolve to error (error handler)
 */
Test.prototype.fail = function (e) {
    var self = this;

    if (typeof e !== 'object') e = Error(e);

    //grab stack (the most actual is here, further is mystically lost)
    self.stack = e.stack;

    //set flag that bundle is failed
    test.ERROR = true;

    var parent = self.parent;
    while (parent) {
        parent.status = 'group';
        parent = parent.parent;
    }

    //update test status
    self.status = 'error';
    self.error = e;

    self.emit('fail', e);

    self.print();
};


Test.prototype.printTitle = function () {
    var self = this;

    if (!isBrowser) {
        var frame = elegantSpinner();

        //print title (indicator of started, now current test)
        updateTitle();
        self.titleInterval = setInterval(updateTitle, 50);

        //update title frame
        function updateTitle () {
            //FIXME: this is the most undestructive for logs way of rendering, but crappy
            process.stdout.write(ansi.cursorLeft);
            process.stdout.write(ansi.eraseEndLine);
            process.stdout.write(chalk.white(indent(self) + ' ' + frame() + ' ' + self.title) + test.INDENT);
            // logUpdate(chalk.white(indent(test.indent) + ' ' + frame() + ' ' + test.title));
        }
    }
}
//clear printed title (node)
Test.prototype.clearTitle = function () {
    if (!isBrowser && this.titleInterval) {
        clearInterval(this.titleInterval);
        process.stdout.write(ansi.cursorLeft);
        process.stdout.write(ansi.eraseEndLine);
    }
}

//universal printer dependent on resolved test
Test.prototype.print = function () {
    var self = this;

    this.clearTitle();

    var single = self.children && self.children.length ? false : true;

    if (self.status === 'error') {
        self.printError();
    }
    else if (self.status === 'group') {
        self.printGroup(single);
    }
    else if (self.status === 'success') {
        self.printSuccess(single);
    }
    else if (self.status === 'skip') {
        self.printSkip(single);
    }

    //last child should close parent’s group in browser
    if (self.last) {
        if (isBrowser) {
            //if truly last - create as many groups as many last parents
            if (!self.children.length) {
                console.groupEnd();
                var parent = self.parent;
                while (parent && parent.last) {
                    console.groupEnd();
                    parent = parent.parent;
                }
            }
        } else {
            //create padding
            if (!self.children.length) console.log();
        }
    }
}

//print pure red error
Test.prototype.printError = function () {
    var self = this;

    //browser shows errors better
    if (isBrowser) {
        console.group('%c× ' + self.title, 'color: red; font-weight: normal');
        if (self.error) {
            if (self.error.name === 'AssertionError') {
                if (typeof self.error.expected !== 'object') {
                    var msg = '%cAssertionError:\n%c' + self.error.expected + '\n' + '%c' + self.error.operator + '\n' + '%c' + self.error.actual;
                    console.groupCollapsed(msg, 'color: red; font-weight: normal', 'color: green; font-weight: normal', 'color: gray; font-weight: normal', 'color: red; font-weight: normal');
                }
                else {
                    var msg = '%cAssertionError: ' + self.error.message;
                    console.groupCollapsed(msg, 'color: red; font-weight: normal');
                }
                console.error(self.stack);
                console.groupEnd();
            }
            else {
                var msg = typeof self.error === 'string' ? self.error : self.error.message;
                console.groupCollapsed('%c' + msg, 'color: red; font-weight: normal');
                console.error(self.stack);
                console.groupEnd();
            }
        }
        console.groupEnd();
    }
    else {
        console.log(chalk.red(indent(self) + ' × ') + chalk.red(self.title));

        if (self.error.stack) {
            if (self.error.name === 'AssertionError') {
                console.error(chalk.gray('AssertionError: ') + chalk.green(self.error.expected) + '\n' + chalk.gray(self.error.operator) + '\n' + chalk.red(self.error.actual));
            } else {
                //NOTE: node prints e.stack along with e.message
                var stack = self.error.stack.replace(/^\s*/gm, indent(self) + '   ');
                console.error(chalk.gray(stack));
            }
        }
    }
}

//print green success
Test.prototype.printSuccess = function (single) {
    var self = this;

    if (isBrowser) {
        if (single) {
            console.log('%c√ ' + self.title + '%c  ' + self.time.toFixed(2) + 'ms', 'color: green; font-weight: normal', 'color:rgb(150,150,150); font-size:0.9em');
        } else {
            self.printGroup();
        }
    }
    else {
        if (!single) {
            self.printGroup();
        }
        else {
            console.log(chalk.green(indent(self) + ' √ ') + chalk.green.dim(self.title) + chalk.gray(' ' + self.time.toFixed(2) + 'ms'));
        }
    }
}

//print yellow warning (not all tests are passed or it is container)
Test.prototype.printGroup = function () {
    var self = this;

    if (isBrowser) {
        console.group('%c+ ' + self.title + '%c  ' + self.time.toFixed(2) + 'ms', 'color: orange; font-weight: normal', 'color:rgb(150,150,150); font-size:0.9em');
    }
    else {
        console.log();
        console.log(indent(self) +' ' + chalk.yellow('+') + ' ' + chalk.yellow(self.title) + chalk.gray(' ' + self.time.toFixed(2) + 'ms'));
    }
}

//print blue skip
Test.prototype.printSkip = function (single) {
    var self = this;

    if (isBrowser) {
        console[single ? 'log' : 'group']('%c- ' + self.title, 'color: blue');
    }
    else {
        console.log(chalk.cyan(indent(self) + ' - ') + chalk.cyan.dim(self.title));
    }
}


//return indentation of for a test, based on nestedness
function indent (testObj) {
    var parent = testObj.parent;
    var str = '';
    while (parent) {
        str += test.INDENT;
        parent = parent.parent;
    }
    return str;
}




//skip alias
test.skip = function skip (message) {
   return test(message);
};

//only alias
test.only = function only (message, fn) {
    //indicate that only is detected, except for the case of intentional run
    if (fn) test.DETECT_ONLY = false;
    //change only mode to true
    test.ONLY_MODE = true;

    var result = test(message, fn, true);
    return result;
}

//more obvious chain
test.test = test;


module.exports = test;
}).call(this,require('_process'))
},{"_process":3,"ansi-escapes":30,"chalk":36,"elegant-spinner":45,"events":1,"inherits":64,"is-browser":67,"log-update":70,"performance-now":97,"xtend/mutable":122}],122:[function(require,module,exports){
module.exports = extend

var hasOwnProperty = Object.prototype.hasOwnProperty;

function extend(target) {
    for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i]

        for (var key in source) {
            if (hasOwnProperty.call(source, key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}

},{}],123:[function(require,module,exports){
/**
 * @module  popoff/overlay
 *
 * Because overlay-component is hopelessly out of date.
 * This is modern rewrite.
 */

'use strict';

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
	var _this = this;

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
			_this.hide();
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
	var _this2 = this;

	this.emit('show');

	this.container.appendChild(this.element);
	this.element.classList.add('popoff-animate');
	this.element.classList.add('popoff-effect-fade');

	//class removed in a timeout to save animation
	setTimeout(function () {
		_this2.element.classList.remove('popoff-animate');
		_this2.element.classList.remove('popoff-effect-fade');
		_this2.emit('afterShow');
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

	this.element.classList.add('popoff-animate');
	this.element.classList.add('popoff-effect-fade');

	this.element.addEventListener('transitionend', end);
	this.element.addEventListener('webkitTransitionEnd', end);
	this.element.addEventListener('otransitionend', end);
	this.element.addEventListener('oTransitionEnd', end);
	this.element.addEventListener('msTransitionEnd', end);
	var to = setTimeout(end, 1000);

	var that = this;
	function end() {
		that.element.removeEventListener('transitionend', end);
		that.element.removeEventListener('webkitTransitionEnd', end);
		that.element.removeEventListener('otransitionend', end);
		that.element.removeEventListener('oTransitionEnd', end);
		that.element.removeEventListener('msTransitionEnd', end);
		clearInterval(to);

		that.element.classList.remove('popoff-animate');
		that.element.classList.remove('popoff-effect-fade');

		that.container.removeChild(that.element);
		that.emit('afterHide');
	}

	return this;
};

},{"events":1,"inherits":64,"xtend/mutable":122}],124:[function(require,module,exports){
'use strict';

var ipsum = require('lorem-ipsum');
var Draggable = require('draggy');
var Resizable = require('resizable');
var test = require('tst');
var Overlay = require('./overlay');
var Popup = require('./');
var insertCSS = require('insert-css');

var body = document.body,
    doc = document,
    root = doc.documentElement;

insertCSS('\n\thtml {\n\t\tbackground-color: rgb(255,254,252);\n\t\tbackground: url(http://subtlepatterns2015.subtlepatterns.netdna-cdn.com/patterns/lightpaperfibers.png), rgb(255,254,252);\n\t\t/* box-shadow: inset 8vw -8vw 50vw rgba(153, 158, 167, 0.35); */\n\t}\n\n\tbody {\n\t\tposition: relative;\n\t\tmin-height: 100vh;\n\t\tpadding: 6rem 2rem 6rem;\n\t\tmax-width: 660px;\n\t\tmargin: auto;\n\t\tline-height: 1.5;\n\t\tfont-family: sans-serif;\n\t}\n\n\th1,h2,h3,h4,h5,h6 {\n\t\tmargin: 4rem 0rem 2rem 0;\n\t}\n\n\t.popoff-popup h1,\n\t.popoff-popup h2,\n\t.popoff-popup h3,\n\t.popoff-popup h4,\n\t.popoff-popup h5,\n\t.popoff-popup h6 {\n\t\tmargin-top: 1rem;\n\t}\n\n\t.target {\n\t\twhite-space: nowrap;\n\t\tmargin-right: .5rem;\n\t\ttext-transform: uppercase;\n\t\tletter-spacing: .25ex;\n\t\tfont-size: .75rem;\n\t\tdisplay: inline-block;\n\t\tmargin-bottom: .5rem;\n\t}\n\n\t.popoff-dropdown p, .popoff-tooltip p {\n\t\tmargin: 0;\n\t}\n\n\t.popoff-overlay {\n\t\tbackground-color: rgba(85,85,85,.15);\n\t\tbackground: linear-gradient(160deg, rgba(103, 98, 105, .55), rgba(73, 70, 82, .55));\n\t}\n\n\t.popoff-overlay:before,\n\t.popoff-overlay:after {\n\t\tcontent: \'\';\n\t\tposition: absolute;\n\t\ttop: -100vw;\n\t\tleft: -100vw;\n\t\tright: -100vw;\n\t\tbottom: -100vw;\n\t\tbackground: url(./lines.png);\n\t\ttransform: rotate(-12.5deg) scale(1.5, 1.51);\n\t\ttransition: transform 50s ease-in;\n\t\topacity: .05;\n\t}\n\t.popoff-overlay:after {\n\t\ttransform: rotate(-12.4deg) scale(1.51, 1.5);\n\t\ttransition: transform 50s ease-out;\n\t}\n\t.popoff-overlay.popoff-fade-in:before {\n\t\ttransform: rotate(12.4deg) scale(1.51, 1.5);\n\t}\n\t.popoff-overlay.popoff-fade-in:after {\n\t\ttransform: rotate(12.5deg) scale(1.5, 1.51);\n\t}\n');

body.innerHTML = '\n<a href="https://en.wikipedia.org/wiki/Alexander_Stepanovich_Popov" style="text-decoration: none"><img id="popoff" src=\'./popoff.png\' alt="Señor Popov. Попов Александр Степанович, портрет гравюра." style="display: block; margin: auto;"/></a>\n<h1 style="text-align:center;">Señor Popoff</h1>\n<p style="text-align: center">Popoff provides every and each sort of popup: dialog, modal, tooltip, dropdown, confirm, notifier, popover, lightbox, balloon, dialog, alert, overlay, sidebar etc.</p>\n<section id="types">\n<h2 style="text-align:center;">Cases</h2>\n<p>These are available types of popups. Use them as <code>type: \'type-name\'</code> option.</p>\n<p style="text-align: center"></p>\n</section>\n<section id="effects">\n<h2 style="text-align:center;">Effects</h2>\n<p style="text-align: center">Use the following effects as <code>effect: \'effect-name\'</code> option.</p>\n<p style="text-align: center"></p>\n</section>\n<a href="https://github.com/dfcreative/popoff" style="display: block; margin-top: 3rem; text-align: center; text-decoration: none; color: black;"><svg style="width: 3rem; height: 3rem;" xmlns="http://www.w3.org/2000/svg" width="784" height="1024" viewBox="0 0 784 1024"><path d="M4.168 480.005q0 107.053 52.114 194.314 52.114 90.085 141.399 141.799t194.314 51.714q105.441 0 195.126-51.714 89.685-52.114 141.199-141.599t51.514-194.514q0-106.652-51.714-195.126-52.114-89.685-141.599-141.199T392.007 92.166q-107.053 0-194.314 52.114-90.085 52.114-141.799 141.399T4.18 479.993zm64.634 0q0-64.634 25.451-124.832t69.482-103.828q44.031-44.031 103.828-69.282t124.432-25.251 124.832 25.251 104.229 69.282q43.631 43.631 68.882 103.828t25.251 124.832q0 69.482-28.487 132.504t-79.989 108.876-117.76 66.458V673.919q0-42.419-34.747-66.257 85.238-7.672 124.632-43.23t39.383-112.712q0-59.786-36.759-100.593 7.272-21.815 7.272-42.018 0-29.899-13.732-54.939-27.063 0-48.478 8.884t-52.515 30.699q-37.571-8.484-77.565-8.484-45.654 0-85.238 9.295-30.299-22.216-52.314-31.311t-49.891-9.084q-13.332 25.451-13.332 54.939 0 21.004 6.871 42.419-36.759 39.594-36.759 100.192 0 77.165 39.183 112.312t125.644 43.23q-23.027 15.355-31.911 44.843-19.792 6.871-41.207 6.871-16.156 0-27.875-7.272-3.636-2.024-6.66-4.236t-6.26-5.448-5.248-5.048-5.248-6.26-4.236-5.659-4.848-6.46-4.236-5.659q-18.991-25.051-45.243-25.051-14.143 0-14.143 6.06 0 2.424 6.871 8.083 12.931 11.308 13.732 12.12 9.696 7.672 10.908 9.696 11.719 14.544 17.779 31.911 22.627 50.502 77.565 50.502 8.884 0 34.747-4.036v85.649q-66.257-20.603-117.76-66.458T97.346 612.533 68.859 480.029z"/></svg></a>\n';

var p = Popup({
	type: 'tooltip',
	target: '#popoff',
	side: 'right',
	content: 'Hello my friend!',
	style: {
		borderRadius: 15,
		marginLeft: -25
	},
	onShow: function onShow() {
		var quote = ['I don\'t dream about actors and actresses; they dream about me. I am reality, they are not.', 'I respect everyone. I even respect journalists.', 'The emission and reception of signals by Marconi by means of electric oscillations is nothing new. In America, the famous engineer Nikola Tesla carried the same experiments in 1893.'][Math.random() * 3 | 0];

		this.element.innerHTML = '<p>' + quote + '</p>';
	}
});

test.skip('overlay', function () {
	var target = document.createElement('a');
	target.href = '#overlay';
	target.innerHTML = 'Overlay';
	target.className = 'target';
	target.style.textDecoration = 'none';
	target.style.background = 'black';
	target.style.color = 'white';
	target.style.padding = '10px';
	document.querySelector('#types p:last-of-type').appendChild(target);

	var o = Overlay();

	target.addEventListener('click', function () {
		o.show();
	});
});

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
		content: '\n\t\t\t<h2>Modal</h2>\n\t\t\t' + ipsum({ count: 3, units: 'paragraph', format: 'html' }) + '\n\t\t'
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
		content: '\n\t\t\t<h2>Sidebar</h2>\n\t\t\t' + ipsum({ count: 1, units: 'paragraph', format: 'html' }) + '\n\t\t'
	});

	target.addEventListener('click', function () {
		p.side = ['top', 'left', 'bottom', 'right'][Math.random() * 4 | 0];
		p.show();
	});
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
	content.innerHTML = '<p>Dropdown content<p>';
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
	content.innerHTML = '<p>Tooltip content</p>';

	var tooltip = new Popup({
		content: content,
		target: target,
		type: 'tooltip'
	});
});

test('dialog draggable & resizable', function () {
	var target = document.createElement('a');
	target.href = '#drag-resize';
	target.innerHTML = 'Drag & resize';
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
		content: '\n\t\t\t<h2>Draggable & resizable</h2>\n\t\t\t<p>Enable draggable and resizable behavior with <a href="https://npmjs.org/package/resizable">resizable</a> components as so:</p>\n\t\t\t<code><pre>\nvar popup = new Popup({\n\toverlay: false,\n\teffect: \'fade\'\n});\nResizable(popup.element, {\n\tdraggable: true,\n\tcss3: false //important\n});\n\t\t\t</pre></code>\n\t\t\tDon’t forget to remove <code>max-width</code>.\n\t\t'
	});

	// Draggable(p.element, {
	// 	css3: false,
	// 	within: window
	// });
	Resizable(p.element, {
		draggable: true,
		css3: false,
		within: window
	});
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
		content: '\n\t\t\t<h2>Tall modal</h2>\n\t\t\t<p>\n\t\t\t\tWhen there is too much of content in modal, it is comfortable to have main scroll replaced with the scroll of modal content. That is what you see in this modal - the content of the body is placed into overlay.\n\t\t\t</p>\n\t\t\t' + ipsum({ count: 15, units: 'paragraph', format: 'html' }) + '\n\t\t'
	});

	// p.show();
	target.addEventListener('click', function (e) {
		p.show(target);
	});
});

test('Effects', function () {
	var effects = ['fade', 'scale', 'slide-right', 'slide-bottom', 'slide-left', 'slide-top', 'newspaper', 'super-scaled'];

	// 'just-me'
	effects.forEach(function (effect) {
		var target = document.createElement('a');
		target.href = '#' + effect;
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
			content: '\n\t\t\t\t<h2 class="modal-effect">effect: ' + effect + '</h2>\n\t\t\t\t' + ipsum({ count: 3, units: 'paragraph', format: 'html' }) + '\n\t\t\t'
		});
	});
});

},{"./":4,"./overlay":123,"draggy":40,"insert-css":65,"lorem-ipsum":72,"resizable":110,"tst":121}]},{},[124]);
