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

var sb = require('mucss/scrollbar');

insertCss(".popoff-overlay {\r\n\tposition: fixed;\r\n\ttop: 0;\r\n\tleft: 0;\r\n\tbottom: 0;\r\n\tright: 0;\r\n\topacity: 0;\r\n\tbackground-color: rgba(85,85,85,.85);\r\n\tbackground: linear-gradient(160deg, rgba(103, 98, 105, 0.85), rgba(73, 70, 82, 0.85));\r\n\t-webkit-transition: opacity .33s;\r\n\t-moz-transition: opacity .33s;\r\n\ttransition: opacity .33s;\r\n\tz-index: 5;\r\n}\r\n.popoff-closable {\r\n\tcursor: pointer;\r\n}\r\n\r\n.popoff-popup {\r\n\tz-index: 9;\r\n\tposition: absolute;\r\n\toverflow: hidden;\r\n\tmargin: auto;\r\n\tmin-width: 4rem;\r\n\tmin-height: 1rem;\r\n\tbackground: white;\r\n\topacity: 1;\r\n\tvisibility: visible;\r\n\tbackface-visibility: hidden;\r\n\tbox-sizing: border-box;\r\n\t-webkit-transform-origin: center center;\r\n\t-moz-transform-origin: center center;\r\n\ttransform-origin: center center;\r\n\t-webkit-transform: scale(1) rotate(0deg);\r\n\t-moz-transform: scale(1) rotate(0deg);\r\n\t-ms-transform: scale(1) rotate(0deg);\r\n\ttransform: scale(1) rotate(0deg);\r\n}\r\n.popoff-popup-tip {\r\n\tmargin: 1rem;\r\n}\r\n\r\n.popoff-animate {\r\n\t-webkit-transition: opacity .333s, transform .25s ease-out;\r\n\t-moz-transition: opacity .333s, transform .25s ease-out;\r\n\ttransition: opacity .333s, transform .25s ease-out;\r\n}\r\n.popoff-hidden {\r\n\topacity: 0;\r\n\tdisplay: none;\r\n\tpointer-events: none;\r\n\tvisibility: hidden;\r\n}\r\n.popoff-visible {\r\n\topacity: 1;\r\n}\r\n\r\n\r\n.popoff-container {\r\n}\r\n.popoff-container-overflow {\r\n\toverflow: hidden;\r\n\theight: 100%;\r\n}\r\n\r\n.popoff-overflow {\r\n\tposition: fixed;\r\n\toverflow: hidden;\r\n\ttop: 0;\r\n\tleft: 0;\r\n\tright: 0;\r\n\tbottom: 0;\r\n\tz-index: 10;\r\n\tdisplay: flex;\r\n\tjustify-content: center;\r\n\talign-items: center;\r\n}\r\n.popoff-overflow.popoff-overflow-tall {\r\n\toverflow-y: scroll;\r\n\tdisplay: block;\r\n}\r\n.popoff-overflow .popoff-popup {\r\n\tposition: relative;\r\n}\r\n\r\n.popoff-overflow-tall .popoff-popup {\r\n\tmargin: 2rem auto;\r\n}\r\n@media (max-width: 42rem) {\r\n\t.popoff-overflow-tall .popoff-popup {\r\n\t\tmargin: 0 auto;\r\n\t}\r\n}\r\n\r\n/* Close button */\r\n.popoff-close {\r\n\tposition: absolute;\r\n\tright: 0;\r\n\ttop: 0;\r\n\twidth: 3.333rem;\r\n\theight: 3.333rem;\r\n\tcursor: pointer;\r\n\tline-height: 3.333rem;\r\n\ttext-align: center;\r\n\tfont-size: 1.333rem;\r\n\tcolor: rgb(40,40,40);\r\n\tbackground: transparent;\r\n}\r\n.popoff-close:after {\r\n\tcontent: '✕';\r\n}\r\n.popoff-close:hover{\r\n\tbackground: black;\r\n\tcolor: white;\r\n}\r\n\r\n\r\n/* Types */\r\n.popoff-modal,\r\n.popoff-dialog,\r\n.popoff-confirm,\r\n.popoff-alert,\r\n.popoff-sidebar {\r\n\tposition: fixed;\r\n\tmax-width: 660px;\r\n\tmin-width: 320px;\r\n\tpadding: 1.6rem 2rem;\r\n\tbox-shadow: 0 .666vh 3.333vw -.333vh rgba(19, 16, 27, 0.45);\r\n}\r\n@media (max-width: 42rem) {\r\n\t.popoff-modal,\r\n\t.popoff-dialog,\r\n\t.popoff-confirm,\r\n\t.popoff-alert {\r\n\t\tmax-width: 80%;\r\n\t}\r\n}\r\n.popoff-dropdown,\r\n.popoff-tooltip {\r\n\tmax-width: 320px;\r\n\tpadding: 1rem 1.2rem;\r\n\tbox-shadow: 0 1px 4px rgba(19, 16, 27, 0.25);\r\n}\r\n\r\n\r\n\r\n/** Special sidebar settings */\r\n.popoff-sidebar {\r\n\tmargin: 0;\r\n\tmax-width: none;\r\n\tmin-width: 0;\r\n\tmax-height: none;\r\n\toverflow: hidden;\r\n}\r\n.popoff-sidebar[data-side=\"top\"] {\r\n\ttop: 0;\r\n\tleft: 0;\r\n\tright: 0;\r\n\tbottom: auto;\r\n\theight: 160px;\r\n}\r\n.popoff-sidebar[data-side=\"bottom\"] {\r\n\tbottom: 0;\r\n\tleft: 0;\r\n\tright: 0;\r\n\ttop: auto;\r\n\theight: 160px;\r\n}\r\n.popoff-sidebar[data-side=\"right\"] {\r\n\tbottom: 0;\r\n\ttop: 0;\r\n\tright: 0;\r\n\tleft: auto;\r\n\twidth: 240px;\r\n}\r\n.popoff-sidebar[data-side=\"left\"] {\r\n\tbottom: 0;\r\n\ttop: 0;\r\n\tleft: 0;\r\n\tright: auto;\r\n\twidth: 240px;\r\n}\r\n.popoff-container-sidebar {\r\n\t-webkit-transition: all 0.25s;\r\n\t-moz-transition: all 0.25s;\r\n\ttransition: all 0.25s;\r\n}\r\n.popoff-container-slide-top {\r\n\t-webkit-transform: translateY(160px);\r\n\t-moz-transform: translateY(160px);\r\n\t-ms-transform: translateY(160px);\r\n\ttransform: translateY(160px);\r\n}\r\n.popoff-container-slide-bottom {\r\n\t-webkit-transform: translateY(-160px);\r\n\t-moz-transform: translateY(-160px);\r\n\t-ms-transform: translateY(-160px);\r\n\ttransform: translateY(-160px);\r\n}\r\n/* left sidebar does not work on mobile properly */\r\n/*.popoff-container-slide-left {\r\n\t-webkit-transform: translateX(240px);\r\n\t-moz-transform: translateX(240px);\r\n\t-ms-transform: translateX(240px);\r\n\ttransform: translateX(240px);\r\n}\r\n*/\r\n.popoff-container-slide-right {\r\n\t-webkit-transform: translateX(-240px);\r\n\t-moz-transform: translateX(-240px);\r\n\t-ms-transform: translateX(-240px);\r\n\ttransform: translateX(-240px);\r\n}\r\n\r\n\r\n\r\n/* Tip */\r\n.popoff-tip {\r\n\twidth: 30px;\r\n\theight: 30px;\r\n\tposition: absolute;\r\n\tz-index: 10;\r\n\toverflow: hidden;\r\n}\r\n.popoff-tip:after {\r\n\tcontent: '';\r\n\tborder-top-left-radius: 1px;\r\n\tposition: absolute;\r\n\tbackground: white;\r\n\tbox-shadow: 0 0px 3px rgba(19, 16, 27, 0.25);\r\n\t-webkit-transform-origin: center;\r\n\t-moz-transform-origin: center;\r\n\ttransform-origin: center;\r\n\t-webkit-transform: rotate(45deg);\r\n\t-moz-transform: rotate(45deg);\r\n\ttransform: rotate(45deg);\r\n\twidth: 30px;\r\n\theight: 30px;\r\n}\r\n.popoff-tip[data-side=\"top\"],\r\n.popoff-tip[data-side=\"bottom\"] {\r\n\theight: 20px;\r\n}\r\n.popoff-tip[data-side=\"top\"]:after {\r\n\tbottom: auto;\r\n\ttop: 17px;\r\n}\r\n.popoff-tip[data-side=\"bottom\"]:after {\r\n\tbottom: 17px;\r\n\ttop: auto;\r\n}\r\n.popoff-tip[data-side=\"left\"],\r\n.popoff-tip[data-side=\"right\"] {\r\n\twidth: 20px;\r\n}\r\n.popoff-tip[data-side=\"left\"]:after {\r\n\tleft: 17px;\r\n\tright: auto;\r\n}\r\n.popoff-tip[data-side=\"right\"]:after {\r\n\tleft: auto;\r\n\tright: 17px;\r\n}\r\n\r\n\r\n\r\n/* Basic fade */\r\n.popoff-effect-fade {\r\n\topacity: 0;\r\n\t-webkit-transition: all 0.3s;\r\n\t-moz-transition: all 0.3s;\r\n\ttransition: all 0.3s;\r\n}\r\n\r\n/* Effect 1: Fade in and scale up */\r\n.popoff-effect-scale {\r\n\t-webkit-transform: scale(0.7);\r\n\t-moz-transform: scale(0.7);\r\n\t-ms-transform: scale(0.7);\r\n\ttransform: scale(0.7);\r\n\topacity: 0;\r\n\t-webkit-transition: all 0.3s;\r\n\t-moz-transition: all 0.3s;\r\n\ttransition: all 0.3s;\r\n}\r\n\r\n\r\n/* Effect 2: Slide from the right */\r\n.popoff-effect-slide {\r\n\t-webkit-transform: translateY(20%);\r\n\t-moz-transform: translateY(20%);\r\n\t-ms-transform: translateY(20%);\r\n\ttransform: translateY(20%);\r\n\topacity: 0;\r\n\t-webkit-transition: all 0.3s;\r\n\t-moz-transition: all 0.3s;\r\n\ttransition: all 0.3s;\r\n}\r\n.popoff-effect-slide-right {\r\n\t-webkit-transform: translateX(20%);\r\n\t-moz-transform: translateX(20%);\r\n\t-ms-transform: translateX(20%);\r\n\ttransform: translateX(20%);\r\n\topacity: 0;\r\n\t-webkit-transition: all 0.3s;\r\n\t-moz-transition: all 0.3s;\r\n\ttransition: all 0.3s;\r\n}\r\n.popoff-effect-slide-bottom {\r\n\t-webkit-transform: translateY(20%);\r\n\t-moz-transform: translateY(20%);\r\n\t-ms-transform: translateY(20%);\r\n\ttransform: translateY(20%);\r\n\topacity: 0;\r\n\t-webkit-transition: all 0.3s;\r\n\t-moz-transition: all 0.3s;\r\n\ttransition: all 0.3s;\r\n}\r\n.popoff-effect-slide-left {\r\n\t-webkit-transform: translateX(-20%);\r\n\t-moz-transform: translateX(-20%);\r\n\t-ms-transform: translateX(-20%);\r\n\ttransform: translateX(-20%);\r\n\topacity: 0;\r\n\t-webkit-transition: all 0.3s;\r\n\t-moz-transition: all 0.3s;\r\n\ttransition: all 0.3s;\r\n}\r\n.popoff-effect-slide-top {\r\n\t-webkit-transform: translateY(-20%);\r\n\t-moz-transform: translateY(-20%);\r\n\t-ms-transform: translateY(-20%);\r\n\ttransform: translateY(-20%);\r\n\topacity: 0;\r\n\t-webkit-transition: all 0.3s;\r\n\t-moz-transition: all 0.3s;\r\n\ttransition: all 0.3s;\r\n}\r\n\r\n\r\n/* Effect 4: Newspaper */\r\n.popoff-effect-newspaper {\r\n\t-webkit-transform: scale(0) rotate(720deg);\r\n\t-moz-transform: scale(0) rotate(720deg);\r\n\t-ms-transform: scale(0) rotate(720deg);\r\n\ttransform: scale(0) rotate(720deg);\r\n\t-webkit-transition: all 0.5s;\r\n\t-moz-transition: all 0.5s;\r\n\ttransition: all 0.5s;\r\n\topacity: 0;\r\n}\r\n\r\n\r\n/* Effect 11: Super scaled */\r\n.popoff-effect-super-scaled {\r\n\t-webkit-transform: scale(2);\r\n\t-moz-transform: scale(2);\r\n\t-ms-transform: scale(2);\r\n\ttransform: scale(2);\r\n\topacity: 0;\r\n\t-webkit-transition: all 0.3s;\r\n\t-moz-transition: all 0.3s;\r\n\ttransition: all 0.3s;\r\n}\r\n");

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

	this.element.classList.add('popoff-' + this.type);

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
	wrap: false
});

//FIXME: hope it will not crash safari
Object.defineProperties(Popup.prototype, {
	content: {
		get: function get() {
			return this.element;
		},
		set: function set(content) {
			if (!this.element) throw Error('Content element is undefined');

			if (this.closeElement) this.element.removeChild(this.closeElement);

			if (content instanceof HTMLElement) {
				this.element.innerHTML = '';
				this.element.appendChild(content);
			} else if (typeof content === 'string') {
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
		update: function update() {},
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
		effect: 'fade',
		timeout: 500,
		onInit: function onInit() {
			var _this4 = this;

			var that = this;

			if (this.target) {
				this.target.addEventListener('mouseenter', function (e) {
					if (_this4._leave) {
						clearTimeout(_this4._leave);
						_this4._leave = null;
					}
					if (_this4.isVisible) return;
					_this4.show();
					setTimeout(function () {
						_this4._leave = setTimeout(function () {
							_this4.hide();
						}, _this4.timeout + 1000);
					});
				});
				this.target.addEventListener('mousemove', function (e) {
					if (_this4._leave) {
						clearTimeout(_this4._leave);
						_this4._leave = null;
					}
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
		effect: 'slide',
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
			this.container.parentNode.appendChild(this.element);
		},
		onShow: function onShow() {
			if (!/top|left|bottom|right/.test(this.side)) this.side = this.types.sidebar.side;
			this.element.setAttribute('data-side', this.side);
			this.effect = 'slide-' + this.side;
			// this.container.parentNode.classList.add('popoff-container-sidebar-container')
			this.container.classList.add('popoff-container-sidebar');
			this.container.classList.add('popoff-container-slide-' + this.side);
		},
		onHide: function onHide() {
			this.container.classList.remove('popoff-container-slide-' + this.side);
		},
		onAfterHide: function onAfterHide() {
			this.container.classList.remove('popoff-container-sidebar');
			// this.container.parentNode.classList.remove('popoff-container-sidebar-container');
		}
	}
};

/**
 * Show popup near to the target
 */
Popup.prototype.show = function (target, cb) {
	var _this6 = this;

	if (this.isVisible) return this;

	if (target instanceof Function) {
		this.currentTarget = this.target;
		cb = target;
	} else {
		this.currentTarget = target || this.target;
	}

	this.currentTarget && this.currentTarget.classList && this.currentTarget.classList.add('popoff-active');
	this.element.classList.remove('popoff-hidden');
	this.tipElement.classList.remove('popoff-hidden');

	this.emit('show', this.currentTarget);

	//ensure effects classes
	this.element.classList.add('popoff-effect-' + this.effect);
	this.tipElement.classList.add('popoff-effect-' + this.effect);

	var elHeight = this.element.offsetHeight;

	//apply overflow on body for tall content
	if (this.wrap) {
		if (elHeight > window.innerHeight) {
			this.isTall = true;
			this.overflowElement.classList.add('popoff-overflow-tall');
		}
		this.container.classList.add('popoff-container-overflow');
		this._border = this.container.style.borderRight;
		this.container.style.borderRight = sb + 'px solid transparent';
		this.container.appendChild(this.overflowElement);
		this.overflowElement.appendChild(this.element);
	}

	this.tipElement.classList.add('popoff-animate');
	this.element.classList.add('popoff-animate');

	//in some way it needs to be called in timeout with some delay, otherwise animation fails
	setTimeout(function () {
		_this6.element.classList.remove('popoff-effect-' + _this6.effect);
		_this6.tipElement.classList.remove('popoff-effect-' + _this6.effect);
		_this6.isVisible = true;
		_this6.update();
	}, 10);

	if (this.overlay) {
		this._overlay = createOverlay({
			closable: true,
			container: this.wrap ? this.overflowElement : this.container
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
		_this6.tipElement.classList.remove('popoff-animate');
		_this6.element.classList.remove('popoff-animate');
		_this6.element.classList.add('popoff-visible');
		_this6.tipElement.classList.add('popoff-visible');

		_this6.emit('afterShow');
		cb && cb.call(_this6);
	});

	return this;
};

/**
 * Hide popup
 */
Popup.prototype.hide = function (cb) {
	var _this7 = this;

	//overlay recurrently calls this.hide, so just drop it here
	if (this._overlay) return this._overlay.hide();

	this.currentTarget && this.currentTarget.classList && this.currentTarget.classList.remove('popoff-active');

	this.emit('hide');

	this.element.classList.add('popoff-effect-' + this.effect);
	this.tipElement.classList.add('popoff-effect-' + this.effect);

	this.isAnimating = true;

	this.tipElement.classList.add('popoff-animate');
	this.element.classList.add('popoff-animate');
	this.element.classList.remove('popoff-visible');
	this.tipElement.classList.remove('popoff-visible');

	this.animend(function () {
		_this7.isVisible = false;
		_this7.isAnimating = false;
		_this7._overlay = null;
		_this7.tipElement.classList.remove('popoff-animate');
		_this7.element.classList.remove('popoff-animate');
		_this7.element.classList.add('popoff-hidden');
		_this7.tipElement.classList.add('popoff-hidden');

		_this7.element.classList.remove('popoff-effect-' + _this7.effect);
		_this7.tipElement.classList.remove('popoff-effect-' + _this7.effect);

		if (_this7.wrap) {
			_this7.isTall = false;
			_this7.overflowElement.classList.remove('popoff-overflow-tall');
			_this7.container.classList.remove('popoff-container-overflow');
			_this7.container.style.borderRight = _this7._border || null;
			_this7._border = null;
			_this7.container.removeChild(_this7.overflowElement);
			_this7.container.appendChild(_this7.element);
		}

		_this7.emit('afterHide');
		cb && cb.call(_this7);
	});

	return this;
};

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

},{"./overlay":26,"events":1,"get-uid":5,"inherits":6,"insert-css":7,"mucss/scrollbar":21,"placer":23,"xtend/mutable":25}],4:[function(require,module,exports){
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
		if (parent === window || (parent === doc.body && getComputedStyle(parent).position === 'static') || parent === root) {
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
},{"mucss/border":10,"mucss/is-fixed":14,"mucss/margin":15,"mucss/offset":16,"mucss/padding":17}],5:[function(require,module,exports){
/** generate unique id for selector */
var counter = Date.now() % 1e9;

module.exports = function getUid(){
	return (Math.random() * 1e9 >>> 0) + (counter++);
};
},{}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
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
},{}],9:[function(require,module,exports){
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

},{"./dictionary":8,"os":2}],10:[function(require,module,exports){
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
},{"./parse-value":18,"./rect":20}],11:[function(require,module,exports){
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

},{"./fake-element":12,"./prefix":19}],12:[function(require,module,exports){
/** Just a fake element to test styles
 * @module mucss/fake-element
 */

module.exports = document.createElement('div');
},{}],13:[function(require,module,exports){
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
},{}],14:[function(require,module,exports){
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
},{}],15:[function(require,module,exports){
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

},{"./parse-value":18,"./rect":20}],16:[function(require,module,exports){
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
},{"./has-scroll":13,"./is-fixed":14,"./rect":20,"./scrollbar":21,"./translate":22}],17:[function(require,module,exports){
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
},{"./parse-value":18,"./rect":20}],18:[function(require,module,exports){
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
},{}],19:[function(require,module,exports){
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

},{}],20:[function(require,module,exports){
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
},{}],21:[function(require,module,exports){
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
},{}],22:[function(require,module,exports){
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
},{"./css":11,"./parse-value":18}],23:[function(require,module,exports){
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
},{"aligner":4,"mucss/border":10,"mucss/css":11,"mucss/has-scroll":13,"mucss/is-fixed":14,"mucss/margin":15,"mucss/offset":16,"mucss/parse-value":18,"mucss/scrollbar":21,"soft-extend":24}],24:[function(require,module,exports){
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
},{}],25:[function(require,module,exports){
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

},{}],26:[function(require,module,exports){
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

	//class removed in a timeout to save animation
	setTimeout(function () {
		_this2.element.classList.add('popoff-visible');
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

	this.element.classList.remove('popoff-visible');

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

		that.container.removeChild(that.element);
		that.emit('afterHide');
	}

	return this;
};

},{"events":1,"inherits":6,"xtend/mutable":25}],27:[function(require,module,exports){
'use strict';

var ipsum = require('lorem-ipsum');
// var Draggable = require('draggy');
// var Resizable = require('resizable');
var Overlay = require('./overlay');
var Popup = require('./');
var insertCSS = require('insert-css');
// var test = require('tst');
var test = function test(a, b) {
	b();
};

var body = document.body,
    doc = document,
    root = doc.documentElement;

insertCSS('\n\thtml {\n\t\tbackground-color: rgb(255,254,252);\n\t\tbackground: url(http://subtlepatterns2015.subtlepatterns.netdna-cdn.com/patterns/lightpaperfibers.png), rgb(255,254,252);\n\t\tfont-family: sans-serif;\n\t\t/* box-shadow: inset 8vw -8vw 50vw rgba(153, 158, 167, 0.35); */\n\t\tline-height: 1.5;\n\t}\n\n\tbody {\n\t\tposition: relative;\n\t\tmin-height: 100vh;\n\t\tpadding: 6rem 2rem 6rem;\n\t\tmax-width: 660px;\n\t\tmargin: auto;\n\t}\n\n\timg {\n\t\tmax-width: 60%;\n\t}\n\n\th1,h2,h3,h4,h5,h6 {\n\t\tmargin: 4rem 0rem 2rem 0;\n\t}\n\n\t.popoff-popup h1,\n\t.popoff-popup h2,\n\t.popoff-popup h3,\n\t.popoff-popup h4,\n\t.popoff-popup h5,\n\t.popoff-popup h6 {\n\t\tmargin-top: 1rem;\n\t}\n\n\t.target {\n\t\twhite-space: nowrap;\n\t\tmargin-right: .5rem;\n\t\ttext-transform: uppercase;\n\t\tletter-spacing: .25ex;\n\t\tfont-size: .75rem;\n\t\tdisplay: inline-block;\n\t\tmargin-bottom: .5rem;\n\t}\n\n\t.popoff-dropdown p,\n\t.popoff-sidebar p,\n\t.popoff-tooltip p {\n\t\tmargin: 0;\n\t}\n\n\t.popoff-sidebar h2 {\n\t\tmargin: 0 0 .66rem;\n\t}\n\n\t.popoff-overlay {\n\t\tbackground-color: rgba(85,85,85,.15);\n\t\tbackground: linear-gradient(160deg, rgba(103, 98, 105, .55), rgba(73, 70, 82, .55));\n\t}\n\n\t.popoff-overlay:before,\n\t.popoff-overlay:after {\n\t\tcontent: \'\';\n\t\tposition: absolute;\n\t\ttop: -100vw;\n\t\tleft: -100vw;\n\t\tright: -100vw;\n\t\tbottom: -100vw;\n\t\tbackground: url(./lines.png);\n\t\ttransform: rotate(-12.5deg) scale(1.5, 1.51);\n\t\ttransition: transform 50s ease-in;\n\t\topacity: .05;\n\t}\n\t.popoff-overlay:after {\n\t\ttransform: rotate(-12.4deg) scale(1.51, 1.5);\n\t\ttransition: transform 50s ease-out;\n\t}\n\t.popoff-overlay.popoff-fade-in:before {\n\t\ttransform: rotate(12.4deg) scale(1.51, 1.5);\n\t}\n\t.popoff-overlay.popoff-fade-in:after {\n\t\ttransform: rotate(12.5deg) scale(1.5, 1.51);\n\t}\n');

var meta = document.createElement('meta');
meta.setAttribute('name', 'viewport');
meta.setAttribute('content', 'width=device-width, initial-scale=1, shrink-to-fit=no');
document.head.appendChild(meta);
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
		content: '\n\t\t\t<h2>Modal</h2>\n\t\t\t' + ipsum({ count: 1, units: 'paragraph', format: 'html' }) + '\n\t\t'
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
		content: '\n\t\t\t<h2>Sidebar</h2>\n\t\t\t' + ipsum({ count: 2, units: 'sentences', format: 'html' }) + '\n\t\t'
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
	return;
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
		// css3: false,
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

},{"./":3,"./overlay":26,"insert-css":7,"lorem-ipsum":9}]},{},[27]);
