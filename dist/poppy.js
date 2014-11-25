!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.poppy=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var poppy = module.exports = require('./src/poppy');
poppy.Dropdown = require('./src/dropdown');
// poppy.Tooltip = require('./src/tooltip');
},{"./src/dropdown":34,"./src/poppy":35}],2:[function(require,module,exports){
var icicle = require('icicle');


/** environment guarant */
var $ = typeof jQuery === 'undefined' ? undefined : jQuery;
var doc = typeof document === 'undefined' ? undefined : document;
var win = typeof window === 'undefined' ? undefined : window;


/** Lists of methods */
var onNames = ['on', 'bind', 'addEventListener', 'addListener'];
var oneNames = ['one', 'once', 'addOnceEventListener', 'addOnceListener'];
var offNames = ['off', 'unbind', 'removeEventListener', 'removeListener'];
var emitNames = ['emit', 'trigger', 'fire', 'dispatchEvent'];

/** Locker flags */
var emitFlag = emitNames[0], onFlag = onNames[0], oneFlag = onNames[0], offFlag = offNames[0];


/**
 * @constructor
 *
 * Main EventEmitter interface.
 * Wraps any target passed to an Emitter interface
 */
function Emmy(target){
	if (!target) return;

	//create emitter methods on target, if none
	if (!getMethodOneOf(target, onNames)) target.on = EmmyPrototype.on.bind(target);
	if (!getMethodOneOf(target, offNames)) target.off = EmmyPrototype.off.bind(target);
	if (!getMethodOneOf(target, oneNames)) target.one = target.once = EmmyPrototype.one.bind(target);
	if (!getMethodOneOf(target, emitNames)) target.emit = EmmyPrototype.emit.bind(target);

	return target;
}


/** Make DOM objects be wrapped as jQuery objects, if jQuery is enabled */
var EmmyPrototype = Emmy.prototype;


/**
 * Return target’s method one of the passed in list, if target is eventable
 * Use to detect whether target has some fn
 */
function getMethodOneOf(target, list){
	var result;
	for (var i = 0, l = list.length; i < l; i++) {
		result = target[list[i]];
		if (result) return result;
	}
}


/** Set of target callbacks, {target: [cb1, cb2, ...]} */
var targetCbCache = new WeakMap;


/**
* Bind fn to the target
* @todo  recognize jquery object
* @chainable
*/
EmmyPrototype.on =
EmmyPrototype.addEventListener = function(evt, fn){
	var target = this;

	//walk by list of instances
	if (fn instanceof Array){
		for (var i = fn.length; i--;){
			EmmyPrototype.on.call(target, evt, fn[i]);
		}
		return target;
	}

	//target events
	var onMethod = getMethodOneOf(target, onNames);

	//use target event system, if possible
	//avoid self-recursions from the outside
	if (onMethod && onMethod !== EmmyPrototype.on) {
		//if it’s frozen - ignore call
		if (icicle.freeze(target, onFlag + evt)){
			onMethod.call(target, evt, fn);
			icicle.unfreeze(target, onFlag + evt);
		}
		else {
			return target;
		}
	}

	saveCallback(target, evt, fn);

	return target;
};


/**
 * Add callback to the list of callbacks associated with target
 */
function saveCallback(target, evt, fn){
	//ensure callbacks array for target exists
	if (!targetCbCache.has(target)) targetCbCache.set(target, {});
	var targetCallbacks = targetCbCache.get(target);

	(targetCallbacks[evt] = targetCallbacks[evt] || []).push(fn);
}


/**
 * Add an event listener that will be invoked once and then removed.
 *
 * @return {Emmy}
 * @chainable
 */
EmmyPrototype.once =
EmmyPrototype.one = function(evt, fn){
	var target = this;

	//walk by list of instances
	if (fn instanceof Array){
		for (var i = fn.length; i--;){
			EmmyPrototype.one.call(target, evt, fn[i]);
		}
		return target;
	}

	//target events
	var oneMethod = getMethodOneOf(target, oneNames);

	//use target event system, if possible
	//avoid self-recursions from the outside
	if (oneMethod && oneMethod !== EmmyPrototype.one) {
		if (icicle.freeze(target, oneFlag + evt)){
			//use target event system, if possible
			oneMethod.call(target, evt, fn);
			saveCallback(target, evt, fn);
			icicle.unfreeze(target, oneFlag + evt);
		}

		else {
			return target;
		}
	}

	//wrap callback to once-call
	function cb() {
		EmmyPrototype.off.call(target, evt, cb);
		fn.apply(target, arguments);
	}

	cb.fn = fn;

	//bind wrapper default way
	EmmyPrototype.on.call(target, evt, cb);

	return target;
};


/**
* Bind fn to a target
* @chainable
*/
EmmyPrototype.off =
EmmyPrototype.removeListener =
EmmyPrototype.removeAllListeners =
EmmyPrototype.removeEventListener = function (evt, fn){
	var target = this;

	//unbind all listeners passed
	if (fn instanceof Array){
		for (var i = fn.length; i--;){
			EmmyPrototype.off.call(target, evt, fn[i]);
		}
		return target;
	}


	//unbind all listeners if no fn specified
	if (fn === undefined) {
		var callbacks = targetCbCache.get(target);
		if (!callbacks) return target;
		//unbind all if no evtRef defined
		if (evt === undefined) {
			for (var evtName in callbacks) {
				EmmyPrototype.off.call(target, evtName, callbacks[evtName]);
			}
		}
		else if (callbacks[evt]) {
			EmmyPrototype.off.call(target, evt, callbacks[evt]);
		}
		return target;
	}


	//target events
	var offMethod = getMethodOneOf(target, offNames);

	//use target event system, if possible
	//avoid self-recursion from the outside
	if (offMethod && offMethod !== EmmyPrototype.off) {
		if (icicle.freeze(target, offFlag + evt)){
			offMethod.call(target, evt, fn);
			icicle.unfreeze(target, offFlag + evt);
		}
		//if it’s frozen - ignore call
		else {
			return target;
		}
	}


	//Forget callback
	//ignore if no event specified
	if (!targetCbCache.has(target)) return target;

	var evtCallbacks = targetCbCache.get(target)[evt];

	if (!evtCallbacks) return target;

	//remove specific handler
	for (var i = 0; i < evtCallbacks.length; i++) {
		if (evtCallbacks[i] === fn || evtCallbacks[i].fn === fn) {
			evtCallbacks.splice(i, 1);
			break;
		}
	}

	return target;
};



/**
* Event trigger
* @chainable
*/
EmmyPrototype.emit =
EmmyPrototype.dispatchEvent = function(eventName, data, bubbles){
	var target = this, emitMethod, evt = eventName;
	if (!target) return;

	//Create proper event for DOM objects
	if (target.nodeType || target === doc || target === win) {
		//NOTE: this doesnot bubble on disattached elements

		if (eventName instanceof Event) {
			evt = eventName;
		} else {
			evt =  document.createEvent('CustomEvent');
			evt.initCustomEvent(eventName, bubbles, true, data);
		}

		// var evt = new CustomEvent(eventName, { detail: data, bubbles: bubbles })

		emitMethod = target.dispatchEvent;
	}

	//create event for jQuery object
	else if ($ && target instanceof $) {
		//TODO: decide how to pass data
		var evt = $.Event( eventName, data );
		evt.detail = data;
		emitMethod = bubbles ? targte.trigger : target.triggerHandler;
	}

	//Target events
	else {
		emitMethod = getMethodOneOf(target, emitNames);
	}


	//use locks to avoid self-recursion on objects wrapping this method (e. g. mod instances)
	if (emitMethod && emitMethod !== EmmyPrototype.emit) {
		if (icicle.freeze(target, emitFlag + eventName)) {
			//use target event system, if possible
			emitMethod.call(target, evt, data, bubbles);
			icicle.unfreeze(target, emitFlag + eventName);
			return target;
		}
		//if event was frozen - perform normal callback
	}


	//fall back to default event system
	//ignore if no event specified
	if (!targetCbCache.has(target)) return target;

	var evtCallbacks = targetCbCache.get(target)[evt];

	if (!evtCallbacks) return target;

	//copy callbacks to fire because list can be changed in some handler
	var fireList = evtCallbacks.slice();
	for (var i = 0; i < fireList.length; i++ ) {
		fireList[i] && fireList[i].call(target, {
			detail: data,
			type: eventName
		});
	}

	return target;
};


/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

EmmyPrototype.listeners = function(evt){
	var callbacks = targetCbCache.get(this);
	return callbacks && callbacks[evt] || [];
};


/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

EmmyPrototype.hasListeners = function(evt){
	return !!EmmyPrototype.listeners.call(this, evt).length;
};



/** Static aliases for old API compliance */
Emmy.bindStaticAPI = function(){
	var self = this, proto = self.prototype;

	for (var name in proto) {
		if (proto[name]) self[name] = createStaticBind(name);
	}

	function createStaticBind(methodName){
		return function(a, b, c, d){
			var res = proto[methodName].call(a,b,c,d);
			return res === a ? self : res;
		};
	}
};
Emmy.bindStaticAPI();


/** @module muevents */
module.exports = Emmy;
},{"icicle":3}],3:[function(require,module,exports){
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
},{}],4:[function(require,module,exports){
var global = (1, eval)('this');
//doc shorthand & DOM detector
var doc = global.document;


var eachCSV = require('each-csv');
var Emitter = require('emmy');
var str = require('mustring');
var type = require('mutype');

if (doc) {
	var matches = require('matches-selector');
	var q = require('query-relative');
} else {
	var matches = noop;
	var q = noop;
}

var isString = type.isString;
var isElement = type.isElement;
var isArrayLike = type.isArrayLike;
var has = type.has;
var unprefixize = str.unprefixize;
var upper = str.upper;




/** Separator to specify events, e.g. click-1 (means interval=1 planned callback of click) */
var evtSeparator = '-';


/* ------------------------------ C O N S T R U C T O R ------------------------------ */


/**
 * @constructor
 * @module enot
 *
 * Mixins any object passed.
 * Implements EventEmitter interface.
 * Static methods below are useful for an old API.
 */
function Enot(target){
	if (!target) return target;

	//mixin any object passed
	for (var meth in EnotPrototype){
		target[meth] = EnotPrototype[meth];
	}

	return target;
}

var EnotPrototype = Enot.prototype = Object.create(Emitter.prototype);



/* -----------------------------------  O  N  ---------------------------------------- */


/**
 * Listed reference binder (comma-separated references)
 *
 * @alias addEventListener
 * @alias bind
 * @chainable
 */
EnotPrototype.addEventListener =
EnotPrototype.on = function(evtRefs, fn){
	var target = this;

	//if no target specified
	if (isString(target)) {
		fn = evtRefs;
		evtRefs = target;
		target = null;
	}

	//no events passed
	if (!evtRefs) return target;

	//in bulk events passed
	if (type.isObject(evtRefs)){
		for (var evtRef in evtRefs){
			EnotPrototype.on.call(target, evtRef, evtRefs[evtRef]);
		}

		return target;
	}

	eachCSV(evtRefs, function(evtRef){
		_on(target, evtRef, fn);
	});

	return target;
};


/**
 * Listed ref binder with :one modifier
 *
 * @chainable
 */
EnotPrototype.once =
EnotPrototype.one = function(evtRefs, fn){
	var target = this;

	//append ':one' to each event from the references passed
	var processedRefs = '';
	eachCSV(evtRefs, function(item){
		processedRefs += item + ':one, ';
	});
	processedRefs = processedRefs.slice(0, -2);

	return EnotPrototype.on.call(target, processedRefs, fn);
};




/**
 * Bind single reference (no comma-declared references).
 *
 * @param {*} target A target to relate reference, `document` by default.
 * @param {string} evtRef Event reference, like `click:defer` etc.
 * @param {Function} fn Callback.
 */
function _on(target, evtRef, fn) {
	//ignore empty fn
	if (!fn) return target;

	var evtObj = parseReference(target, evtRef);

	var targets = evtObj.targets;

	//ignore not bindable sources
	if (!targets) return target;

	//iterate list of targets
	if (isArrayLike(targets)) {
		for (var i = targets.length; i--;){
			// _on(targets[i], evtObj.evt, fn);
			Emitter.on(targets[i], evtObj.evt, getModifiedFn(target, fn, targets[i], evtObj.evt, evtObj.modifiers));
		}

		return target;
	}

	//target is one indeed
	var newTarget = targets;
	// console.log('on', newTarget, evtObj.evt, evtObj.modifiers)
	Emitter.on(newTarget, evtObj.evt, getModifiedFn(target, fn, newTarget, evtObj.evt, evtObj.modifiers));

	return target;
}



/* -----------------------------------  O  F  F  ------------------------------------- */


/**
 * Listed reference unbinder
 *
 * @alias removeEventListener
 * @alias unbind
 * @chainable
 */
EnotPrototype.removeEventListener =
EnotPrototype.removeListener =
EnotPrototype.removeAllListeners =
EnotPrototype.off = function(evtRefs, fn){
	var target = this;

	//if no target specified
	if (isString(target)) {
		fn = evtRefs;
		evtRefs = target;
		target = null;
	}

	//unbind all events
	if(!evtRefs) {
		Emitter.off(target);
	}

	//in bulk events passed
	else if (type.isObject(evtRefs)){
		for (var evtRef in evtRefs){
			EnotPrototype.off.call(target, evtRef, evtRefs[evtRef]);
		}
	}

	else {
		eachCSV(evtRefs, function(evtRef){
			_off(target, evtRef, fn);
		});
	}

	return target;
};


/**
 * Single reference unbinder
 *
 * @param {Element} target Target to unbind event, optional
 * @param {string} evtRef Event notation
 * @param {Function} fn callback
 */
function _off(target, evtRef, fn){
	var evtObj = parseReference(target, evtRef);
	var targets = evtObj.targets;
	var targetFn = fn;

	if (!targets) return target;

	//iterate list of targets
	if (isArrayLike(targets)) {
		for (var i = targets.length; i--;){
			//FIXME: check whether it is possible to use Emitter.off straightforwardly
			_off(targets[i], evtObj.evt, fn, true);
		}

		return target;
	}

	var newTarget = targets;

	//clear planned calls for an event
	if (dfdCalls[evtObj.evt]) {
		for (var i = 0; i < dfdCalls[evtObj.evt].length; i++){
			if (intervalCallbacks[dfdCalls[evtObj.evt][i]] === fn)
				Emitter.off(newTarget, evtObj.evt + evtSeparator + dfdCalls[evtObj.evt][i]);
		}
	}

	//unbind all
	if (!fn) {
		Emitter.off(newTarget, evtObj.evt);
	}

	//unbind all callback modified variants
	else {
		var modifiedFns = getModifiedFns(fn, newTarget, evtObj.evt);
		for (var i = modifiedFns.length, unbindCb; i--;){
			unbindCb = modifiedFns.pop();
			Emitter.off(newTarget, evtObj.evt, unbindCb);
		}
	}
}


/**
 * Dispatch event to any target.
 *
 * @alias trigger
 * @alias fire
 * @alias dispatchEvent
 * @chainable
 */
EnotPrototype.dispatchEvent =
EnotPrototype.emit = function(evtRefs, data, bubbles){
	var target = this;

	//if no target specified
	if (isString(target)) {
		bubbles = data;
		data = evtRefs;
		evtRefs = target;
		target = null;
	}

	//just fire straight event passed
	if (evtRefs instanceof Event) {
		Emitter.emit(target, evtRefs, data, bubbles);
		return target;
	}

	if (!evtRefs) return target;

	eachCSV(evtRefs, function(evtRef){
		var evtObj = parseReference(target, evtRef);

		if (!evtObj.evt) return target;

		return applyModifiers(function(){
			var target = evtObj.targets;

			if (!target) return target;

			//iterate list of targets
			if (isArrayLike(target)) {
				for (var i = target.length; i--;){
					Emitter.emit(target[i], evtObj.evt, data, bubbles);
				}
			}

			//fire single target
			else {
				// console.log('emit', target, evtObj.evt)
				Emitter.emit(target, evtObj.evt, data, bubbles);
			}

		}, evtObj.evt, evtObj.modifiers)();
	});

	return target;
};



/* -------------------------------- M O D I F I E R S -------------------------------- */


/** @type {Object} Keys shortcuts */
var keyDict = {
	'ENTER': 13,
	'ESCAPE': 27,
	'TAB': 9,
	'ALT': 18,
	'CTRL': 17,
	'SHIFT': 16,
	'SPACE': 32,
	'PAGE_UP': 33,
	'PAGE_DOWN': 34,
	'END': 35,
	'HOME': 36,
	'LEFT': 37,
	'UP': 38,
	'RIGHT': 39,
	'DOWN': 40,

	'F1': 112,
	'F2': 113,
	'F3': 114,
	'F4': 115,
	'F5': 116,
	'F6': 117,
	'F7': 118,
	'F8': 119,
	'F9': 120,
	'F10': 121,
	'F11': 122,
	'F12': 123,

	'LEFT_MOUSE': 1,
	'RIGHT_MOUSE': 3,
	'MIDDLE_MOUSE': 2
};


/** Return code to stop event chain */
var DENY_EVT_CODE = 1;


/** list of available event modifiers */
Enot.modifiers = {};


/** call callback once */
//TODO: think up the way to use Emmy.one instead
Enot.modifiers['once'] =
Enot.modifiers['one'] = function(evt, fn, emptyArg, sourceFn){
	var cb = function(e){
		var result = fn && fn.call(this, e);
		//FIXME: `this` is not necessarily has `off`
		// console.log('off', fn, Emitter.listeners(this, evt)[0] === sourceFn)
		result !== DENY_EVT_CODE && Enot.off(this, evt, sourceFn);
		return result;
	};
	return cb;
};


/**
 * filter keys
 * @alias keypass
 * @alias mousepass
 * @alias filter
 */

Enot.modifiers['pass'] = function(evt, fn, keys){
	keys = keys.split(commaSplitRe).map(upper);

	var cb = function(e){
		var pass = false, key;
		for (var i = keys.length; i--;){
			key = keys[i];
			var which = 'originalEvent' in e ? e.originalEvent.which : e.which;
			if ((key in keyDict && keyDict[key] == which) || which == key){
				pass = true;
				return fn.call(this, e);
			}
		}
		return DENY_EVT_CODE;
	};
	return cb;
};


/**
 * white-filter target
 * @alias live
 * @alias on
 */
Enot.modifiers['delegate'] = function(evtName, fn, selector){
	// console.log('del', selector)
	var cb = function(evt){
		var el = evt.target;

		//filter document/object/etc
		if (!isElement(el)) return DENY_EVT_CODE;

		//intercept bubbling event by delegator
		while (el && el !== doc && el !== this) {
			if (matches(el, selector)) {
				//set proper current el
				evt.delegateTarget = el;
				// evt.currentTarget = el;
				//NOTE: PhantomJS && IE8 fails on this
				// Object.defineProperty(evt, 'currentTarget', {
				// 	get: function(){
				// 		return el;
				// 	}
				// });
				return fn.call(this, evt);
			}
			el = el.parentNode;
		}

		return DENY_EVT_CODE;
	};

	return cb;
};


/**
 * black-filter target
 */
Enot.modifiers['not'] = function(evt, fn, selector){
	var cb = function(e){
		var target = e.target;

		//traverse each node from target to holder and filter if event happened within banned element
		while (target) {
			if (target === doc || target === this) {
				return fn.call(this, e);
			}
			if (matches(target, selector)) return DENY_EVT_CODE;
			target = target.parentNode;
		}

		return DENY_EVT_CODE;
	};
	return cb;
};


var throttleCache = new WeakMap();


/**
 * throttle call
 */
Enot.modifiers['throttle'] = function(evt, fn, interval){
	interval = parseFloat(interval);
	// console.log('thro', evt, fn, interval)
	var cb = function(e){
		return Enot.throttle.call(this, fn, interval, e);
	};

	return cb;
};
Enot.throttle = function(fn, interval, e){
	var self = this;

	//FIXME: multiple throttles may interfere on target (key throttles by id)
	if (throttleCache.get(self)) return DENY_EVT_CODE;
	else {
		var result = fn.call(self, e);

		//if cb falsed, ignore
		if (result === DENY_EVT_CODE) return result;

		throttleCache.set(self, setTimeout(function(){
			clearInterval(throttleCache.get(self));
			throttleCache.delete(self);
		}, interval));
	}
};


/**
 * List of postponed calls intervals, keyed by evt name
 * @example
 * {
 * 	click: 1,
 *  track: 2
 * }
 */
var dfdCalls = {};


/**
 * List of callbacks for intervals
 * To check passed off callback
 * To avoid unbinding all
 *
 * @example
 * {
 *  1: fn,
 *  2: fnRef
 * }
 */
var intervalCallbacks = {};


/**
 * Defer call - afnet Nms after real method/event
 *
 * @alias postpone
 * @param  {string}   evt   Event name
 * @param  {Function} fn    Handler
 * @param  {number|string}   delay Number of ms to wait
 * @param  {Function|string} sourceFn Source (unmodified) callback
 *
 * @alias async
 * @alias after
 *
 * @return {Function}         Modified handler
 */
Enot.modifiers['defer'] = function(evt, fn, delay, sourceFn){
	delay = parseFloat(delay) || 0;

	var cb = function(e){
		var self = this;

		//plan fire of this event after N ms
		var interval = setTimeout(function(){
			var evtName =  evt + evtSeparator + interval;

			//fire once planned evt
			Emitter.emit(self, evtName, {sourceEvent: e});
			Emitter.off(self, evtName);

			//forget interval
			var idx = dfdCalls[evt].indexOf(interval);
			if (idx > -1) dfdCalls[evt].splice(idx, 1);
			intervalCallbacks[interval] = null;
		}, delay);

		//bind :one fire of this event
		Emitter.on(self, evt + evtSeparator + interval, sourceFn);

		//save planned interval for an evt
		(dfdCalls[evt] = dfdCalls[evt] || []).push(interval);

		//save callback for interval
		intervalCallbacks[interval] = sourceFn;

		return interval;
	};

	return cb;
};



/* -------------------------------  H  E  L  P  E  R  S ------------------------------ */


/** @type {RegExp} Use as `.split(commaSplitRe)` */
var commaSplitRe = /\s*,\s*/;


/**
 * Return parsed event object from event reference.
 *
 * @param  {Element|Object}   target   A target to parse (optional)
 * @param  {string}   string   Event notation
 * @param  {Function} callback Handler
 * @return {Object}            Result of parsing: {evt, modifiers, targets}
 */
function parseReference(target, string) {
	var result = {};

	//get event name - the first token from the end
	var eventString = string.match(/[\w\.\:\$\-]+(?:\:[\w\.\:\-\$]+(?:\(.+\))?)*$/)[0];

	//remainder is a target reference - parse target
	string = string.slice(0, -eventString.length).trim();

	result.targets = parseTargets(target, string);

	//parse modifiers
	var eventParams = unprefixize(eventString, 'on').split(':');

	//get event name
	result.evt = eventParams.shift();
	result.modifiers = eventParams.sort(function(a,b){
		//one should go last because it turns off passed event
		return /^one/.test(a) ? 1 : a > b ? 1 : -1;
	});

	return result;
}


/**
 * Retrieve source element from string
 *
 * @param  {Element|Object} target A target to relate to
 * @param  {string}         str    Target reference
 *
 * @return {*}                     Resulting target found
 */
function parseTargets(target, str) {
	// console.log('parseTarget `' + str + '`', target)

	//no target mean global target
	if (!target) target = global;

	//no string mean self evt
	if (!str){
		return target;
	}

	//return self reference
	if(str[0] === '@'){
		return getProperty(target, str.slice(1));
	}

	else if(str === 'window') return global;
	else if(str === 'document') return doc;

	//query relative selector
	else {
		return q(target, str, true);
	}
}


/**
 * Get property defined by dot notation in string.
 * @param  {Object} holder   Target object where to look property up
 * @param  {string} propName Dot notation, like 'this.a.b.c'
 * @return {[type]}          [description]
 */
function getProperty(holder, propName){
	var propParts = propName.split('.');
	var result = holder, lastPropName;
	while ((lastPropName = propParts.shift()) !== undefined) {
		if (!has(result, lastPropName)) return undefined;
		result = result[lastPropName];
	}
	return result;
}


/** Per-callback target cache */
var targetsCache = new WeakMap();


/** Get modified fn taking into account all possible specific case params
 *
 * Fn has a dict of targets
 * Target has a dict of events
 * Event has a list of modified-callbacks
 */
function getModifiedFn(initialTarget, fn, target, evt, modifiers){
	if (!fn) return fn;

	var targetFn = fn;

	if (!initialTarget) initialTarget = target;

	targetFn = getRedirector(targetFn);

	var modifierFns = getModifiedFns(targetFn, target, evt);

	//save callback
	var modifiedCb = applyModifiers(targetFn, evt, modifiers);

	//rebind context, if targets differs
	if (initialTarget !== target) {
		//FIXME: simplify bind here - it is too weighty
		modifiedCb = modifiedCb.bind(initialTarget);
	}
	modifierFns.push(modifiedCb);

	return modifiedCb;
}


/**
 * Return dict of modified fns for an fn, keyed by modifiers
 */
function getModifiedFns(targetFn, target, evt){
	targetFn = getRedirector(targetFn);

	//fn has a set of targets (contexts)
	var targetsDict = targetsCache.get(targetFn);
	if (!targetsDict) {
		//FIXME: think about flattening this
		targetsDict = new WeakMap();
		targetsCache.set(targetFn, targetsDict);
	}

	//target has a set of events (bound events)
	var eventsDict = targetsDict.get(target);
	if (!eventsDict) {
		eventsDict = {};
		targetsDict.set(target, eventsDict);
	}

	//each event bound has a list of modified cbs (not dict due to we don’t need dict cause off always for all modified cbs)
	var modifiersList = eventsDict[evt];
	if (!modifiersList) {
		modifiersList = [];
		eventsDict[evt] = modifiersList;
	}

	return modifiersList;
}


/**
 * Apply event modifiers to string.
 * Returns wrapped fn.
 *
 * @param  {Function}   fn   Source function to be transformed
 * @param  {string}   evt   Event name to pass to modifiers
 * @param  {Array}   modifiers   List of string chunks representing modifiers
 * @return {Function}   Callback with applied modifiers
 */
function applyModifiers(fn, evt, modifiers){
	var targetFn = fn;

	modifiers.forEach(function(modifier){
		//parse params to pass to modifier
		var modifierName = modifier.split('(')[0];
		var modifierParams = modifier.slice(modifierName.length + 1, -1);

		if (Enot.modifiers[modifierName]) {
			//create new context each call
			targetFn = Enot.modifiers[modifierName](evt, targetFn, modifierParams, fn);
		}
	});

	return targetFn;
}


/** set of redirect functions keyed by redirect cb
 * They’re context independent so we can keep them in memory
 */
var redirectSet = {};


/**
 * Return redirection statements handler.
 *
 * @param    {string}   redirectTo   Redirect declaration (other event notation)
 * @return   {function}   Callback which fires redirects
 */
function getRedirector(redirectTo){
	//return non-plain redirector
	if (!type.isPlain(redirectTo)) return redirectTo;

	//return redirector, if exists
	if (redirectSet[redirectTo]) return redirectSet[redirectTo];

	//create redirector
	var cb = function(e){
		var self = this;
		eachCSV(redirectTo, function(evt){
			if (defaultRedirectors[evt]) defaultRedirectors[evt].call(self, e);
			Enot.emit(self, evt, e.detail, e.bubbles);
		});
	};

	//save redirect fn to cache
	redirectSet[redirectTo] = cb;

	return cb;
}


/**
 * Utility callbacks shortcuts
 */
var defaultRedirectors = {
	preventDefault: function (e) {
		e.preventDefault && e.preventDefault();
	},
	stopPropagation: function (e) {
		e.stopPropagation && e.stopPropagation();
	},
	stopImmediatePropagation: function (e) {
		e.stopImmediatePropagation && e.stopImmediatePropagation();
	},
	noop: noop
};

function noop(){};


/** Static aliases for old API compliance */
Emitter.bindStaticAPI.call(Enot);


/** @module enot */
module.exports = Enot;
},{"each-csv":5,"emmy":2,"matches-selector":12,"mustring":6,"mutype":7,"query-relative":8}],5:[function(require,module,exports){
module.exports = eachCSV;

/** match every comma-separated element ignoring 1-level parenthesis, e.g. `1,2(3,4),5` */
var commaMatchRe = /(,[^,]*?(?:\([^()]+\)[^,]*)?)(?=,|$)/g;

/** iterate over every item in string */
function eachCSV(str, fn){
	if (!str) return;

	//force string be primitive
	str += '';

	var list = (',' + str).match(commaMatchRe) || [''];
	for (var i = 0; i < list.length; i++) {
		// console.log(matchStr)
		var matchStr = list[i].trim();
		if (matchStr[0] === ',') matchStr = matchStr.slice(1);
		matchStr = matchStr.trim();
		fn(matchStr, i);
	}
};
},{}],6:[function(require,module,exports){
module.exports = {
	camel:camel,
	dashed:dashed,
	upper:upper,
	lower:lower,
	capfirst:capfirst,
	unprefixize:unprefixize
};

//camel-case → CamelCase
function camel(str){
	return str && str.replace(/-[a-z]/g, function(match, position){
		return upper(match[1])
	})
}

//CamelCase → camel-case
function dashed(str){
	return str && str.replace(/[A-Z]/g, function(match, position){
		return (position ? '-' : '') + lower(match)
	})
}

//uppercaser
function upper(str){
	return str.toUpperCase();
}

//lowercasify
function lower(str){
	return str.toLowerCase();
}

//aaa → Aaa
function capfirst(str){
	str+='';
	if (!str) return str;
	return upper(str[0]) + str.slice(1);
}

// onEvt → envt
function unprefixize(str, pf){
	return (str.slice(0,pf.length) === pf) ? lower(str.slice(pf.length)) : str;
}
},{}],7:[function(require,module,exports){
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
},{}],8:[function(require,module,exports){
var doc = document, root = doc.documentElement;


var _q = require('tiny-element');
var matches = require('matches-selector');


//TODO: detect inner parenthesis, like :closest(:not(abc))

/**
 * @module query-relative
 */
module.exports = function(targets, str, multiple){
	var res = q(targets,str);
	return !multiple && isList(res) ? res[0] : res;
};


/**
 * Query selector including initial pseudos, return list
 *
 * @param {string} str A query string
 * @param {Element}? target A query context element
 *
 * @return {[type]} [description]
 */
function q(targets, str) {
	//no target means global target
	if (typeof targets === 'string') {
		str = targets;
		targets = doc;
	}

	//if targets is undefined, perform usual global query
	if (!targets) targets = this;

	//treat empty string as a target itself
	if (!str){
		// console.groupEnd();
		return targets;
	}

	//filter window etc non-queryable objects
	if (targets === window) targets === doc;
	else if (!(targets instanceof Node) && !isList(targets)) {
		// console.groupEnd();
		return targets;
	}


	var m, result;
	// console.group(targets, str, isList(targets))

	//detect whether query includes special pseudos
	if (m = /:(parent|closest|next|prev|root)(?:\(([^\)]*)\))?/.exec(str)) {
		var pseudo = m[1], idx = m.index, param = m[2], token = m[0];

		//1. pre-query
		if (idx) {
			targets = queryList(targets, str.slice(0, idx), true);
		}

		//2. query
		result = transformSet(targets, pseudos[pseudo], param);
		if (!result) {
			// console.groupEnd();
			return null;
		}
		if (isList(result) && !result.length) return result;

		//2.1 if rest str starts with >, add scoping
		var strRest = str.slice(idx + token.length).trim();
		if (strRest[0] === '>') {
			if (scopeAvail) {
				strRest = ':scope ' + strRest;
			}
			//fake selector via fake id on selected element
			else {
				var id = genId();
				transformSet(result, function(el, id){ el.setAttribute('data-__qr', id); }, id);

				strRest = '[data-__qr' + id + ']' + strRest;
			}
		}

		//3. Post-query or die
		result = q(result, strRest);
	}

	//make default query
	else {
		result = queryList(targets, str);
	}

	// console.groupEnd();
	return result;
}

/** Query elements from a list of targets, return list of queried items */
function queryList (targets, query) {
	if (isList(targets)) {
		return transformSet(targets, function(item, query){
			return _q.call(item, query, true);
		}, query);
	}
	//q single
	else return _q.call(targets, query, true);
}


/** Apply transformaion function on each element from a list, return resulting set */
function transformSet(list, fn, arg) {
	var res = [];
	if (!isList(list)) list = [list];
	for (var i = list.length, el, chunk; i--;) {
		el = list[i];
		if (el) {
			chunk = fn(el, arg);
			if (chunk) res = [].concat(chunk, res);
		}
	}
	return res;
}


//detect :scope
var scopeAvail = true;
try {
	doc.querySelector(':scope');
}
//scope isn’t supported
catch (e){
	scopeAvail = false;
}

/** generate unique id for selector */
var counter = Date.now() % 1e9;
function genId(e, q){
	return (Math.random() * 1e9 >>> 0) + (counter++);
}


/** Custom :pseudos */
var pseudos = {
	/** Get parent, if any */
	parent: function(e, q){
		//root el is considered the topmost
		if (e === doc) return root;
		var res = e.parentNode;
		return res === doc ? e : res;
	},

	/**
	* Get closest parent matching selector (or self)
	*/
	closest: function(e, q){
		//root el is considered the topmost
		if (e === doc) return root;
		if (!q || (q instanceof Node ? e == q : matches(e, q))) return e;
		while ((e = e.parentNode) !== doc) {
			if (!q || (q instanceof Node ? e == q : matches(e, q))) return e;
		}
	},

	/**
	 * Find the prev sibling matching selector
	 */
	prev: function(e, q){
		while (e = e.previousSibling) {
			if (e.nodeType !== 1) continue;
			if (!q || (q instanceof Node ? e == q : matches(e, q))) return e;
		}
	},

	/**
	 * Get the next sibling matching selector
	 */
	next: function(e, q){
		while (e = e.nextSibling) {
			if (e.nodeType !== 1) continue;
			if (!q || (q instanceof Node ? e == q : matches(e, q))) return e;
		}
	},

	/**
	 * Get root for any request
	 */
	root: function(){
		return root;
	}
};


/** simple list checker */
function isList(a){
	return a instanceof Array || a instanceof NodeList;
}



//export pseudos
exports.closest = pseudos.closest;
exports.parent = pseudos.parent;
exports.next = pseudos.next;
exports.prev = pseudos.prev;
},{"matches-selector":9,"tiny-element":10}],9:[function(require,module,exports){
'use strict';

var proto = Element.prototype;
var vendor = proto.matches
  || proto.matchesSelector
  || proto.webkitMatchesSelector
  || proto.mozMatchesSelector
  || proto.msMatchesSelector
  || proto.oMatchesSelector;

module.exports = match;

/**
 * Match `el` to `selector`.
 *
 * @param {Element} el
 * @param {String} selector
 * @return {Boolean}
 * @api public
 */

function match(el, selector) {
  if (vendor) return vendor.call(el, selector);
  var nodes = el.parentNode.querySelectorAll(selector);
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i] == el) return true;
  }
  return false;
}
},{}],10:[function(require,module,exports){
var slice = [].slice;

module.exports = function (selector, multiple) {
  var ctx = this === window ? document : this;

  return (typeof selector == 'string')
    ? (multiple) ? slice.call(ctx.querySelectorAll(selector), 0) : ctx.querySelector(selector)
    : (selector instanceof Node || selector === window || !selector.length) ? (multiple ? [selector] : selector) : slice.call(selector, 0);
};
},{}],11:[function(require,module,exports){
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


},{}],12:[function(require,module,exports){
module.exports=require(9)
},{"c:\\Users\\dmitry\\Dropbox\\Projects\\poppy\\node_modules\\enot\\node_modules\\query-relative\\node_modules\\matches-selector\\index.js":9}],13:[function(require,module,exports){
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
	if ($el === win) return new Rect();

	if (!($el instanceof Element)) throw Error('Argument is not an element');

	var style = win.getComputedStyle($el);

	return new Rect(
		parseCSSValue(style.paddingLeft),
		parseCSSValue(style.paddingTop),
		parseCSSValue(style.paddingRight),
		parseCSSValue(style.paddingBottom)
	);
};


/**
 * Return margins of an element.
 *
 * @param    {Element}   $el   An element which to calc margins.
 * @return   {Object}   Paddings object `{top:n, bottom:n, left:n, right:n}`.
 */

css.margins = function($el){
	if ($el === win) return new Rect();

	if (!($el instanceof Element)) throw Error('Argument is not an element');

	var style = win.getComputedStyle($el);

	return new Rect(
		parseCSSValue(style.marginLeft),
		parseCSSValue(style.marginTop),
		parseCSSValue(style.marginRight),
		parseCSSValue(style.marginBottom)
	);
};


/**
 * Return border widths of an element
 */
css.borders = function($el){
	if ($el === win) return new Rect;

	if (!($el instanceof Element)) throw Error('Argument is not an element');

	var style = win.getComputedStyle($el);

	return new Rect(
		parseCSSValue(style.borderLeftWidth),
		parseCSSValue(style.borderTopWidth),
		parseCSSValue(style.borderRightWidth),
		parseCSSValue(style.borderBottomWidth)
	);
};


/** Returns parsed css value. */
function parseCSSValue(str){
	str += '';
	return parseFloat(str.slice(0,-2)) || 0;
}
css.parseValue = parseCSSValue;


/**
 * Return absolute offsets of any target passed
 *
 * @param    {Element|window}   el   A target. Pass window to calculate viewport offsets
 * @return   {Object}   Offsets object with trbl, fromBottom, fromLeft.
 */

css.offsets = function(el){
	if (!el) throw Error('Bad argument');

	//calc client rect
	var cRect, result;

	//return vp offsets
	if (el === win) {
		result = new Rect(
			win.pageXOffset,
			win.pageYOffset
		);

		result.width = win.innerWidth - (css.hasScrollY() ? css.scrollbar : 0),
		result.height = win.innerHeight - (css.hasScrollX() ? css.scrollbar : 0)
		result.right = result.left + result.width;
		result.bottom = result.top + result.height;

		return result;
	}

	//FIXME: why not every element has getBoundingClientRect method?
	try {
		cRect = el.getBoundingClientRect();
	} catch (e) {
		cRect = new Rect(
			el.clientLeft,
			el.clientTop
		);
	}

	//whether element is or is in fixed
	var isFixed = css.isFixed(el);
	var xOffset = isFixed ? 0 : win.pageXOffset;
	var yOffset = isFixed ? 0 : win.pageYOffset;


	result = new Rect(
		cRect.left + xOffset,
		cRect.top + yOffset,
		cRect.left + xOffset + el.offsetWidth,
		cRect.top + yOffset + el.offsetHeight,
		el.offsetWidth,
		el.offsetHeight
	);

	return result;
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
		if (typeof obj[name] === 'number' && /left|right|bottom|top|width|height/i.test(name)) obj[name] += 'px';

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

/** the scrollbar width */
css.scrollbar = scrollDiv.offsetWidth - scrollDiv.clientWidth;

// Delete fake DIV
root.removeChild(scrollDiv);



/** window scrollbar detectors */
css.hasScrollX = function(){
	return win.innerHeight > root.clientHeight;
};
css.hasScrollY = function(){
	return win.innerWidth > root.clientWidth;
};


/** simple rect stub  */
function Rect(l,t,r,b,w,h){
	this.top=t||0;
	this.bottom=b||0;
	this.left=l||0;
	this.right=r||0;
	if (w!==undefined) this.width=w||this.right-this.left;
	if (h!==undefined) this.height=h||this.bottom-this.top;
}

css.Rect = Rect;
},{}],14:[function(require,module,exports){
var type = require('mutypes');
var str = require('mustring');
var eachCSV = require('each-csv');

var has = type.has;
var isArray = type.isArray;
var isString = type.isString;
var isFn = type.isFn;
var isElement = type.isElement;
var isNumber = type.isNumber;
var isObject = type.isObject;
var isBool = type.isBool;
var dashed = str.dashed;

module.exports = {
	value: parseValue,
	attribute: parseAttr,
	typed: parseTyped,
	object: parseObject,
	list: parseList,
	stringify: stringify
};

//parse attribute from the target
function parseAttr(target, name, example){
	var result;

	//parse attr value
	if (!has(target, name)) {
		if (has(target, 'attributes')) {
			var dashedPropName = str.dashed(name);

			var attrs = target.attributes,
				attr = attrs[name] || attrs['data-' + name] || attrs[dashedPropName] || attrs['data-' + dashedPropName];

			if (attr) {
				var attrVal = attr.value;
				// console.log('parseAttr', name, propType)
				//fn on-attribute
				// if (/^on/.test(name)) {
				// 	target[name] = new Function(attrVal);
				// }

				//detect based on type
				// else {
					target[name] = parseTyped(attrVal, example);
				// }
			}
		}
	}

	return result;
}

//returns value from string with correct type except for array
//TODO: write tests for this fn
function parseValue(str){
	var v;
	// console.log('parse', str)
	if (/true/i.test(str)) {
		return true;
	} else if (/false/i.test(str)) {
		return false;
	} else if (!/[^\d\.\-]/.test(str) && !isNaN(v = parseFloat(str))) {
		return v;
	} else if (/\{/.test(str)){
		try {
			return JSON.parse(str);
		} catch (e) {
			return str;
		}
	}
	return str;
}

//parse value according to the type passed
function parseTyped(value, type){
	var res;
	// console.log('parse typed', value, type)
	if (isArray(type)) {
		res = parseList(value);
	} else if (isNumber(type)) {
		res = parseFloat(value);
	} else if (isBool(type)){
		res = !/^(false|off|0)$/.test(value);
	} else if (isFn(type)){
		res = value; //new Function(value);
	} else if (isString(type)){
		res = value;
	} else if (isObject(type)) {
		res = parseObject(value);
	} else {
		if (isString(value) && !value.length) res = true;
		else res = parseValue(value);
	}

	return res;
}

function parseObject(str){
	if (str[0] !== '{') str = '{' + str + '}';
	try {
		return JSON.parse(str);
	} catch (e) {
		return {};
	}
}

//returns array parsed from string
function parseList(str){
	if (!isString(str)) return [parseValue(str)];

	//clean str from spaces/array rudiments
	str = str.trim();
	if (str[0] === '[') str = str.slice(1);
	if (str.length > 1 && str[str.length - 1] === ']') str = str.slice(0,-1);

	var result = [];
	eachCSV(str, function(value) {
		result.push(parseValue(value));
	});

	return result;
}

//stringify any element passed, useful for attribute setting
function stringify(el){
	if (!el) {
		return '' + el;
	} if (isArray(el)){
		//return comma-separated array
		return el.join(',');
	} else if (isElement(el)){
		//return id/name/proper selector
		return el.id;

		//that way is too heavy
		// return selector(el)
	} else if (isObject(el)){
		//serialize json
		return JSON.stringify(el);
	} else if (isFn(el)){
		//return fn body
		var src = el.toString();
		el.slice(src.indexOf('{') + 1, src.lastIndexOf('}'));
	} else {
		return el.toString();
	}
}
},{"each-csv":15,"mustring":16,"mutypes":17}],15:[function(require,module,exports){
module.exports=require(5)
},{"c:\\Users\\dmitry\\Dropbox\\Projects\\poppy\\node_modules\\enot\\node_modules\\each-csv\\index.js":5}],16:[function(require,module,exports){
module.exports=require(6)
},{"c:\\Users\\dmitry\\Dropbox\\Projects\\poppy\\node_modules\\enot\\node_modules\\mustring\\index.js":6}],17:[function(require,module,exports){
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
	isRegExp: isRegExp
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
},{}],18:[function(require,module,exports){
module.exports=require(7)
},{"c:\\Users\\dmitry\\Dropbox\\Projects\\poppy\\node_modules\\enot\\node_modules\\mutype\\index.js":7}],19:[function(require,module,exports){
/**
* @module  placer
*
* Places any element relative to any other element the way you define
*/
module.exports = place;

//TODO: fix draggy in safari
//TODO: fix for IE8
//TODO: fix resizable/draggable tests in firefox
//TODO: use translate3d instead of absolute repositioning (option?)
//TODO: implement avoiding strategy (graphic editors use-case when you need to avoid placing over selected elements)
//TODO: enhance best-side strategy: choose the most closest side

var type = require('mutype');
var css = require('mucss');
var q = require('query-relative');
var softExtend = require('soft-extend');
var m = require('mumath');
var align = require('aligner');


//shortcuts
var win = window, doc = document, root = doc.documentElement;


/**
 * Default options
 */
var defaults = {
	//an element to align relatively to
	//element
	relativeTo: win,

	//which side to place element
	//t/r/b/l, 'center', 'middle'
	side: 'center',

	/**
	 * An alignment trbl/0..1/center
	 *
	 * @default  0
	 * @type {(number|string|array)}
	 */
	align: 0,

	//selector/nodelist/node/[x,y]/window/function(el)
	avoid: undefined,

	//selector/nodelist/node/[x,y]/window/function(el)
	within: undefined,

	//look for better blacement, if doesn’t fit
	findBestSide: true
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
	//ensure element
	element = q(element);

	//inherit defaults
	options = softExtend(options, defaults);

	//ensure elements
	options.relativeTo = options.relativeTo && q(element, options.relativeTo) || win;
	options.within = options.within && q(element, options.within);

	//TODO: query avoidables
	// options.avoid = q(element, options.avoid, true);


	//set the same position as the target’s one or absolute
	if (type.isElement(options.relativeTo) && css.isFixed(options.relativeTo)) {
		element.style.position = 'fixed';
	}
	else {
		element.style.position = 'absolute';
	}


	//else place according to the position
	var side = options.findBestSide && options.within ? getBestSide(element, options) : options.side;

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
		// console.log('place center');

		//get relativeTo & within rectangles
		var placerRect = css.offsets(opts.relativeTo);
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

		align([opts.relativeTo, placee], al);


		//apply limits
		if (opts.within) {
			trimPositionY(placee, opts.within, parentRect);
			trimPositionX(placee, opts.within, parentRect);
		}


		//upd options
		opts.side = 'center';
	},

	left: function(placee, opts){
		// console.log('place left')

		var parent = placee.offsetParent;

		var placerRect = css.offsets(opts.relativeTo);
		var parentRect = getParentRect(parent);

		//correct borders
		contractRect(parentRect, css.borders(parent));


		//place left (set css right because placee width may change)
		css(placee, {
			right: parentRect.right - placerRect.left,
			left: 'auto'
		});

		//place vertically properly
		align([opts.relativeTo, placee], [null, opts.align]);


		//apply limits
		if (opts.within) trimPositionY(placee, opts.within, parentRect);


		//upd options
		opts.side = 'left';
	},

	right: function (placee, opts) {
		// console.log('place right')


		//get relativeTo & within rectangles
		var placerRect = css.offsets(opts.relativeTo);
		var parentRect = getParentRect(placee.offsetParent);

		//correct borders
		contractRect(parentRect, css.borders(placee.offsetParent));


		//place right
		css(placee, {
			left: placerRect.right - parentRect.left,
			right: 'auto',
		});


		//place vertically properly
		align([opts.relativeTo, placee], [null, opts.align]);


		//apply limits
		if (opts.within) trimPositionY(placee, opts.within, parentRect);


		//upd options
		opts.side = 'right';
	},

	top: function(placee, opts){
		// console.log('place top');

		var parent = placee.offsetParent;
		var placerRect = css.offsets(opts.relativeTo);
		var parentRect = getParentRect(placee.offsetParent);


		//correct borders
		contractRect(parentRect, css.borders(parent));


		//place vertically top-side
		css(placee, {
			bottom: parentRect.bottom - placerRect.top,
			top: 'auto'
		});


		//place horizontally properly
		align([opts.relativeTo, placee], [opts.align]);


		//apply limits
		if (opts.within) trimPositionX(placee, opts.within, parentRect);


		//upd options
		opts.side = 'top';
	},

	bottom: function(placee, opts){
		// console.log('place bottom');

		//get relativeTo & within rectangles
		var placerRect = css.offsets(opts.relativeTo);
		var parentRect = getParentRect(placee.offsetParent);


		//correct borders
		contractRect(parentRect, css.borders(placee.offsetParent));


		//place bottom
		css(placee, {
			top: placerRect.bottom - parentRect.top,
			bottom: 'auto',
		});


		//place horizontally properly
		align([opts.relativeTo, placee], [opts.align]);


		//apply limits
		if (opts.within) trimPositionX(placee, opts.within, parentRect);


		//upd options
		opts.side = 'bottom';
	}
};


/** Find the most appropriate side to place element */
function getBestSide(placee, opts) {
	var initSide = opts.side;

	var withinRect = css.offsets(opts.within),
		placeeRect = css.offsets(placee),
		placerRect = css.offsets(opts.relativeTo);

	contractRect(withinRect, css.borders(opts.within));

	var placeeMargins = css.margins(placee);

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

	//TODO:
	//if at least one avoidable el within the hot area
	//get specific limits for the side (besides the `within` restrictor)
	//and if limits are too tight, ignore the side


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


/** apply limits rectangle to the position of an element */
function trimPositionY(placee, within, parentRect){
	var placeeRect = css.offsets(placee);
	var withinRect = css.offsets(within);
	var placeeMargins = css.margins(placee);

	contractRect(withinRect, css.borders(within));

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
function trimPositionX(placee, within, parentRect){
	var placeeRect = css.offsets(placee);
	var withinRect = css.offsets(within);
	var placeeMargins = css.margins(placee);

	contractRect(withinRect, css.borders(within));

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
function getParentRect(target){
	var rect;

	//handle special static body case
	if (target === doc.body || target === root && getComputedStyle(target).position === 'static'){
		rect = {
			left: 0,
			right: win.innerWidth - (css.hasScrollY() ? css.scrollbar : 0),
			width: win.innerWidth,
			top: 0,
			bottom: win.innerHeight - (css.hasScrollX() ? css.scrollbar : 0),
			height: win.innerHeight
		};
	}
	else {
		rect = css.offsets(target);
	}

	return rect;
}
},{"aligner":20,"mucss":13,"mumath":21,"mutype":22,"query-relative":23,"soft-extend":24}],20:[function(require,module,exports){
var css = require('mucss');
var m = require('mumath');

/**
 * @module
 */
module.exports = align;
module.exports.numerify = numerify;


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
		xAlign = numerify(alignment[0]);
		yAlign = numerify(alignment[1]);
	}
	//catch y values
	else if (/top|middle|bottom/.test(alignment)) {
		yAlign = numerify(alignment);
	}
	else {
		xAlign = numerify(alignment);
	}


	//apply alignment
	var toRect = css.offsets(relativeTo);
	for (var i = els.length, el, s; i--;){
		el = els[i];

		//ignore self
		if (el === relativeTo) continue;

		s = getComputedStyle(el);

		//ensure element is at least relative, if it is static
		if (s.position === 'static') css(el, 'position', 'relative');


		//include margins
		var placeeMargins = css.margins(el);

		//get relativeTo & parent rectangles
		var parent = el.offsetParent || win;
		var parentRect = css.offsets(parent);
		var parentPaddings = css.paddings(parent);
		var parentBorders = css.borders(parent);

		//correct parentRect
		if (parent === doc.body || parent === root && getComputedStyle(parent).position === 'static') {
			parentRect.left = 0;
			parentRect.top = 0;
		}
		parentRect = m.sub(parentRect, parentBorders);
		parentRect = m.add(parentRect, placeeMargins);
		parentRect = m.add(parentRect, parentPaddings);


		alignX(els[i], toRect, parentRect, xAlign);
		alignY(els[i], toRect, parentRect, yAlign);
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
function numerify(value){
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
		return parseFloat(value);
	}

	return value;
}
},{"mucss":13,"mumath":21}],21:[function(require,module,exports){
/**
 * Simple math utils.
 * @module  mumath
 */

module.exports = {
	between: wrap(between),
	isBetween: wrap(isBetween),
	toPrecision: wrap(toPrecision),
	getPrecision: getPrecision,
	min: wrap(Math.min),
	max: wrap(Math.max),
	add: wrap(function(a,b){return a+b}),
	sub: wrap(function(a,b){return a-b}),
	div: wrap(function(a,b){return a/b}),
	mul: wrap(function(a,b){return a*b}),
	mod: wrap(function(a,b){return a%b}),
	floor: wrap(function(a){return Math.floor(a)}),
	ceil: wrap(function(a){return Math.ceil(a)}),
	round: wrap(function(a){return Math.round(a)})
};


/**
 * Get fn wrapped with array/object attrs recognition
 *
 * @return {Function} Target function
 */
function wrap(fn){
	return function(a){
		var args = arguments;
		if (a instanceof Array) {
			var result = new Array(a.length), slice;
			for (var i = 0; i < a.length; i++){
				slice = [];
				for (var j = 0, l = args.length, val; j < l; j++){
					val = args[j] instanceof Array ? args[j][i] : args[j];
					val = val || 0;
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
					val = val || 0;
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
}


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

function between(a, min, max){
	return max > min ? Math.max(Math.min(a,max),min) : Math.max(Math.min(a,min),max);
}


/**
 * Whether element is between left & right including
 *
 * @param {number} a
 * @param {number} left
 * @param {number} right
 *
 * @return {Boolean}
 */

function isBetween(a, left, right){
	if (a <= right && a >= left) return true;
	return false;
}



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

function toPrecision(value, step) {
	step = parseFloat(step);
	if (step === 0) return value;
	value = Math.round(value / step) * step;
	return parseFloat(value.toFixed(getPrecision(step)));
}


/**
 * Get precision from float:
 *
 * @example
 * 1.1 → 1, 1234 → 0, .1234 → 4
 *
 * @param {number} n
 *
 * @return {number} decimap places
 */

function getPrecision(n){
	var s = n + '',
		d = s.indexOf('.') + 1;

	return !d ? 0 : s.length - d;
}

},{}],22:[function(require,module,exports){
module.exports=require(7)
},{"c:\\Users\\dmitry\\Dropbox\\Projects\\poppy\\node_modules\\enot\\node_modules\\mutype\\index.js":7}],23:[function(require,module,exports){
module.exports=require(8)
},{"c:\\Users\\dmitry\\Dropbox\\Projects\\poppy\\node_modules\\enot\\node_modules\\query-relative\\index.js":8,"matches-selector":12,"tiny-element":25}],24:[function(require,module,exports){
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
module.exports=require(10)
},{"c:\\Users\\dmitry\\Dropbox\\Projects\\poppy\\node_modules\\enot\\node_modules\\query-relative\\node_modules\\tiny-element\\index.js":10}],26:[function(require,module,exports){
var doc = document, root = doc.documentElement;


var _q = require('tiny-element');
var matches = require('matches-selector');


//TODO: detect inner parenthesis, like :closest(:not(abc))

/**
 * @module query-relative
 */
module.exports = function(targets, str, multiple){
	//no target means global target
	if (typeof targets === 'string') {
		multiple = str;
		str = targets;
		targets = doc;
	}

	var res = q(targets,str);

	return !multiple && isList(res) ? res[0] : unique(res);
};


/**
 * Query selector including initial pseudos, return list
 *
 * @param {string} str A query string
 * @param {Element}? target A query context element
 *
 * @return {[type]} [description]
 */
function q(targets, str) {
	//if targets is undefined, perform usual global query
	if (!targets) targets = this;


	//treat empty string as a target itself
	if (!str){
		// console.groupEnd();
		return targets;
	}

	//filter window etc non-queryable objects
	if (targets === window) targets === doc;
	else if (!(targets instanceof Node) && !isList(targets)) {
		// console.groupEnd();
		return targets;
	}


	var m, result;
	// console.group(targets, str, isList(targets))

	//detect whether query includes special pseudos
	if (m = /:(parent|closest|next|prev|root)(?:\(([^\)]*)\))?/.exec(str)) {
		var pseudo = m[1], idx = m.index, param = m[2], token = m[0];

		//1. pre-query
		if (idx) {
			targets = queryList(targets, str.slice(0, idx), true);
		}

		//2. query
		result = transformSet(targets, pseudos[pseudo], param);

		if (!result) {
			// console.groupEnd();
			return null;
		}
		if (isList(result) && !result.length) return result;

		//2.1 if rest str starts with >, add scoping
		var strRest = str.slice(idx + token.length).trim();
		if (strRest[0] === '>') {
			if (scopeAvail) {
				strRest = ':scope ' + strRest;
			}
			//fake selector via fake id on selected element
			else {
				var id = genId();
				transformSet(result, function(el, id){ el.setAttribute('data-__qr', id); }, id);

				strRest = '[data-__qr' + id + ']' + strRest;
			}
		}

		//3. Post-query or die
		result = q(result, strRest);
	}

	//make default query
	else {
		result = queryList(targets, str);
	}

	// console.groupEnd();
	return result;
}

/** Query elements from a list of targets, return list of queried items */
function queryList (targets, query) {
	if (isList(targets)) {
		return transformSet(targets, function(item, query){
			return _q.call(item, query, true);
		}, query);
	}
	//q single
	else return _q.call(targets, query, true);
}


/** Apply transformaion function on each element from a list, return resulting set */
function transformSet(list, fn, arg) {
	var res = [];
	if (!isList(list)) list = [list];
	for (var i = list.length, el, chunk; i--;) {
		el = list[i];
		if (el) {
			chunk = fn(el, arg);
			if (chunk) {
				res = [].concat(chunk, res);
			}
		}
	}
	return res;
}


//detect :scope
var scopeAvail = true;
try {
	doc.querySelector(':scope');
}
//scope isn’t supported
catch (e){
	scopeAvail = false;
}

/** generate unique id for selector */
var counter = Date.now() % 1e9;
function genId(e, q){
	return (Math.random() * 1e9 >>> 0) + (counter++);
}


/** Custom :pseudos */
var pseudos = {
	/** Get parent, if any */
	parent: function(e, q){
		//root el is considered the topmost
		if (e === doc) return root;
		var res = e.parentNode;
		return res === doc ? e : res;
	},

	/**
	* Get closest parent matching selector (or self)
	*/
	closest: function(e, q){
		//root el is considered the topmost
		if (e === doc) return root;
		if (!q || (q instanceof Node ? e == q : matches(e, q))) return e;
		while ((e = e.parentNode) !== doc) {
			if (!q || (q instanceof Node ? e == q : matches(e, q))) return e;
		}
	},

	/**
	 * Find the prev sibling matching selector
	 */
	prev: function(e, q){
		while (e = e.previousSibling) {
			if (e.nodeType !== 1) continue;
			if (!q || (q instanceof Node ? e == q : matches(e, q))) return e;
		}
	},

	/**
	 * Get the next sibling matching selector
	 */
	next: function(e, q){
		while (e = e.nextSibling) {
			if (e.nodeType !== 1) continue;
			if (!q || (q instanceof Node ? e == q : matches(e, q))) return e;
		}
	},

	/**
	 * Get root for any request
	 */
	root: function(){
		return root;
	}
};


/** simple list checker */
function isList(a){
	return a instanceof Array || a instanceof NodeList;
}


/**
 * uniquify an array
 * http://jszen.com/best-way-to-get-unique-values-of-an-array-in-javascript.7.html
 */
function unique(arr){
	if (!(arr instanceof Array)) return arr;

	var n = [];
	for(var i = 0; i < arr.length; i++)
	{
		if (n.indexOf(arr[i]) == -1) n.push(arr[i]);
	}
	return n;
}


//export pseudos
exports.closest = pseudos.closest;
exports.parent = pseudos.parent;
exports.next = pseudos.next;
exports.prev = pseudos.prev;
},{"matches-selector":12,"tiny-element":27}],27:[function(require,module,exports){
module.exports=require(10)
},{"c:\\Users\\dmitry\\Dropbox\\Projects\\poppy\\node_modules\\enot\\node_modules\\query-relative\\node_modules\\tiny-element\\index.js":10}],28:[function(require,module,exports){
/** @module  st8 */
module.exports = applyState;

//TODO: ensure no memory leaks
//TODO: group props to objects instead of sets of weakmaps
//TODO: add proper destroyer


var enot = require('enot');
var type = require('mutype');
var eachCSV = require('each-csv');
var extend = require('extend');
var icicle = require('icicle');
var flattenKeys = require('split-keys');

//externs
var isObject = type.isObject;
var has = type.has;
var isFn = type.isFn;
var isPlain = type.isPlain;
var isString = type.isString;

var eOn = enot.on;
var eOff = enot.off;


//tech names
var createdCallbackName = 'created';
var enterCallbackName = 'before';
var leaveCallbackName = 'after';
var initCallbackName = 'init';
var changedCallbackName = 'changed';
var setterName = 'set';
var getterName = 'get';
var remainderStateName = '_';


/** values keyed by target */
var valuesCache = new WeakMap();

/** As far properties can change it’s behaviour dynamically, we have to keep actual states somewhere */
var statesCache = new WeakMap();

/** initial (root) prop values - we need it in resetting value */
var propsCache = new WeakMap();

/** dependencies for the right init order */
var depsCache = new WeakMap();

/** actual callbacks */
var activeCallbacks = new WeakMap();

/** native properties per target */
var ignoreCache = new WeakMap();

/** target prop setters */
var settersCache = new WeakMap();



/** per-property storage objects, keyed by target */
// var propsCache = new WeakMap();

/** property class */
// function Property(){
// }
/*
Property.prototype = {
	constructor: Property,

	//current value for property
	value: undefined,

	//actual (result) state
	state: undefined,

	//dependencies
	deps: undefined,

	//actual callback (value bound)
	callback: fn,

	//
	ignore: false,

	//actual setter for the property
	set: fn
}
*/



/**
 * Apply state to a target
 *
 * @property {*} target Any object to apply state descriptor
 * @property {object} props An object - set of properties
 * @property {(object|undefined)} ignoreProps Native properties or alike -
 *                                            blacklisted items which should be ignored
 */
function applyState(target, props, ignoreProps){
	// console.group('applyState', props)

	//create target private storage
	if (!statesCache.has(target)) statesCache.set(target, {});
	if (!activeCallbacks.has(target)) activeCallbacks.set(target, {});
	if (!ignoreCache.has(target)) ignoreCache.set(target, ignoreProps || {});
	if (!settersCache.has(target)) settersCache.set(target, {});
	if (!propsCache.has(target)) propsCache.set(target, {});

	flattenKeys(props, true);

	//calc dependencies, e.g. b depends on a = {b: {a: true}, a: {}}
	var deps = {};
	depsCache.set(target, deps);

	for (var propName in props){
		//ignore native props
		if (has(Object, propName)) continue;

		//ignore lc props
		if (propName === createdCallbackName || propName === initCallbackName){
			continue;
		}

		deps[propName] = deps[propName] || {};

		var prop = props[propName];
		if (isObject(prop)) {
			for (var stateName in prop){
				var innerProps = prop[stateName];
				//pass non-object inner props
				if (!isObject(innerProps)) continue;

				for (var innerPropName in innerProps){
					if (isStateTransitionName(innerPropName) || innerPropName === propName) continue;

					var innerProp = innerProps[innerPropName];

					//save parent prop as a dependency for inner prop
					(deps[innerPropName] = deps[innerPropName] || {})[propName] = true;

					//save stringy inner prop as a dependece for the prop
					if (isString(innerProp)) (deps[propName] = deps[propName] || {})[innerProp] = true;

					//stub property on target with proper type (avoid uninited calls of inner methods)
					if (!has(target, innerPropName) && !has(props, innerPropName)) {
						if (isFn(innerProp)) target[innerPropName] = noop;
					}

				}
			}
		}
	}

	//create accessors
	createProps(target, props);


	//init values
	//init plain props first
	for (propName in props){
		if (!props[propName] && props[propName] !== 0) {
			initProp(target, propName);
		}
	}
	for (propName in props){
		if (isPlain(props[propName])) {
			initProp(target, propName);
		}
	}
	//init fns second
	for (propName in props){
		if (isFn(props[propName])) {
			initProp(target, propName);
		}
	}
	//init descriptors props last
	for(propName in deps){
		initProp(target, propName);
	}
	// console.groupEnd();
	return target;
}


/** create accessor on target for every stateful property */
//TODO: getect init fact via existing value in storage (throw away storage objects)
function createProps(target, props){
	var deps = depsCache.get(target);
	var ignoreProps = ignoreCache.get(target);

	//create prototypal values
	var protoValues = {}, initialStates = {};
	for (var propName in deps){
		//set proto value - property value, if it is not descriptor
		if (!isObject(props[propName])){
			protoValues[propName] = props[propName];
		}

		//save initial property
		if (has(props, propName)) propsCache.get(target)[propName] = prop;
	}


	//if new values - set prototypes
	if (!valuesCache.has(target)) {
		valuesCache.set(target, Object.create(protoValues));
	}

	//if existing values - just set new values, appending new prototypes
	else {
		var values = valuesCache.get(target);

		//append new value to the prototypes
		for (propName in protoValues){
			//FIXME: get proto in a more reliable way
			var valuesProto = values.__proto__;
			if (!has(valuesProto, propName)) valuesProto[propName] = protoValues[propName];
		}
	}


	for (var name in deps) {
		var prop = props[name];

		//set initial property states as prototypes
		statesCache.get(target)[name] = Object.create(isObject(prop) ? prop : null);


		//set initialization lock in order to detect first set call
		icicle.freeze(target, initCallbackName + name);

		//create fake setters for ignored props
		if (ignoreProps[name]) {
			createSetter(target, name);
			continue;
		}

		//save initial value
		if (has(target, name)/* && !has(valuesCache.get(target),name)*/) {
			valuesCache.get(target)[name] = target[name];
		}

		//set accessors for all props, not the object ones only: some plain property may be dependent on other property’s state, so it has to be intercepted in getter and the stateful property inited beforehead
		Object.defineProperty(target, name, {
			configurable: true,
			get: (function(target, name){
				return function(){
					// console.group('get ', name)
					var propState = statesCache.get(target)[name];
					//init, if is not
					initProp(target, name);

					var values = valuesCache.get(target);
					var value = values[name];


					//getting prop value just returns it’s real value
					var getResult = callState(target, propState[getterName], value);
					value = getResult === undefined ? values[name] : getResult;

					// console.groupEnd();
					return value;
				};
			})(target, name),

			set: createSetter(target, name)
		});
	}
}


/**
 * create & save setter on target
 * @todo optimize setter create for diffirent kind of descriptor
 */
var inSetValues = new WeakMap();
function createSetter(target, name){
	var setter = function(value){
		// console.group('set', name, value)
		// console.log('set', name, value)
		var propState = statesCache.get(target)[name];
		var targetValues = valuesCache.get(target);

		//init, if is not
		initProp(target, name);
		var oldValue = targetValues[name];

		//1. apply setter to value
		var setResult;

		if (icicle.freeze(target, setterName + name)) {
			if (icicle.freeze(target, setterName + name + value)) {
				// console.log('set', name, value)

				try {
					setResult = callState(target, propState[setterName], value, oldValue);
				} catch (e){
					throw e;
				}

				icicle.unfreeze(target, setterName + name + value);
				icicle.unfreeze(target, setterName + name);

				//self.value could've changed here because of inner set calls
				if (inSetValues.has(target)) {
					setResult = inSetValues.get(target);
					// console.log('redirected value', setResult)
					inSetValues.delete(target);
				}

				if (setResult !== undefined) value = setResult;

				else {
					//redirect in set
					if (targetValues[name] !== oldValue) {
						// console.groupEnd();
						return;
					}
				}

			}
		}
		else {
			inSetValues.set(target, value);
		}


		//ignore leaving absent initial state
		var initLock = icicle.unfreeze(target, initCallbackName + name);
		if (!initLock) {
			//Ignore not changed value
			if (value === oldValue) {
				// console.groupEnd()
				return;
			}

			//leaving an old state unbinds all events of the old state
			var oldState = has(propState, oldValue) ? propState[oldValue] : propState[remainderStateName];

			if (icicle.freeze(target, leaveCallbackName + oldState)) {
				//try to enter new state (if redirect happens)
				var leaveResult = leaveState(target, oldState, value, oldValue);

				//redirect mod, if returned any but self
				if (leaveResult !== undefined && leaveResult !== value) {
					//ignore entering falsy state
					if (leaveResult === false) {
					}
					//enter new result
					else {
						target[name] = leaveResult;
					}

					// console.groupEnd()
					return icicle.unfreeze(target, leaveCallbackName + oldState);
				}

				icicle.unfreeze(target, leaveCallbackName + oldState);

				//ignore redirect
				if (targetValues[name] !== oldValue) {
					// console.groupEnd()
					return;
				}

				unapplyProps(target, oldState);
			}

		}

		//save new self value
		// targetValues[name] = value;
		applyValue(target, name, value);
		// console.log('set succeeded', name, value)

		var newStateName = has(propState, value) ? value : remainderStateName;
		if (icicle.freeze(target, name + newStateName)) {
			//new state applies new props: binds events, sets values
			var newState = propState[newStateName];

			applyProps(target, newState);

			//try to enter new state (if redirect happens)
			var enterResult = callState(target, newState, value, oldValue);

			//redirect mod, if returned any but self
			if (enterResult !== undefined && enterResult !== value) {
				//ignore entering falsy state
				if (enterResult === false) {
					target[name] = oldValue;
				}
				//enter new result
				else {
					target[name] = enterResult;
				}

				// console.groupEnd()
				return icicle.unfreeze(target, name + newStateName);
			}

			icicle.unfreeze(target, name + newStateName);
		}


		//4. call changed
		if (value !== oldValue || (initLock && value !== undefined))
			callState(target, propState[changedCallbackName], value, oldValue);

		// console.groupEnd()
	};

	//save setter
	settersCache.get(target)[name] = setter;

	return setter;
}


/** property initializer */
function initProp(target, name){
	var deps = depsCache.get(target);
	if (!deps[name]) return;

	var propState = statesCache.get(target)[name];

	var targetValues = valuesCache.get(target);
	// console.log('init', name, 'dependent on', deps[name]);

	//mark dependency as resolved (ignore next init calls)
	var propDeps = deps[name];
	deps[name] = null;

	//init dependens things beforehead
	for (var depPropName in propDeps){
		if (propDeps[depPropName]) {
			// console.log('redirect init to', depPropName)
			initProp(target, depPropName);
		}
	}

	//handle init procedure
	var initResult, beforeInit = targetValues[name];


	//run initialize procedure
	if (isFn(propState[initCallbackName])) {
		initResult = propState[initCallbackName].call(target, beforeInit);
	}
	else if (isObject(propState[initCallbackName]) && has(propState[initCallbackName],enterCallbackName)) {
		initResult = callState(target, propState[initCallbackName], beforeInit);
	}
	else {
		initResult = beforeInit !== undefined ? beforeInit : propState[initCallbackName];
	}

	//if result is undefined - keep initial value
	if (initResult === undefined) initResult = beforeInit;

	//handle init redirect
	if (targetValues[name] !== beforeInit) return;

	//presave target value (someone wants to get it beforehead)
	valuesCache.get(target)[name] = initResult;

	var isIgnored = ignoreCache.get(target)[name];

	if (!isIgnored)	{
		target[name] = initResult;
	} else {
		//call fake ignored setter
		settersCache.get(target)[name](initResult);
	}
}


/** set value on target */
function applyValue(target, name, value){
	valuesCache.get(target)[name] = value;

	//don't bind noop values
	//FIXME: write test for this (dropdown.js use-case) - there’s still extra-binding or redundant noop
	if (value === noop) return;

	bindValue(target, name, value);
}

function bindValue(target, name, value){
	if (isString(value) || isFn(value)) {
		// console.log('assign', name, value)
		//make sure context is kept bound to the target
		if (isFn(value)) {
			value = value.bind(target);
			activeCallbacks.get(target)[name] = value;
		}

		eOn(target, name, value);
	}
}


/** take over properties by target */
function applyProps(target, props){
	if (!isObject(props)) return;

	for (var name in props){
		// console.group('apply prop', name)
		if (isStateTransitionName(name)) continue;

		var value = props[name];
		var state = statesCache.get(target)[name];

		//extendify descriptor value
		if (isObject(value)){
			extend(state, value);
		}

		else {
			//if some fn was unbound but is going to be rebind
			if (value === valuesCache.get(target)[name]){
				bindValue(target, name, value);
			}

			//FIXME: merge with the same condition in init
			if (!ignoreCache.get(target)[name])	{
				target[name] = value;
			} else {
				//call fake ignored setter
				settersCache.get(target)[name](value);
			}
		}
		// console.groupEnd();
	}
}

/** unbind state declared props */
function unapplyProps(target, props){
	if (!isObject(props)) return;

	for (var name in props){
		// console.log('unbind', name)
		if (isStateTransitionName[name]) continue;

		var propValue = props[name];
		var state = statesCache.get(target)[name];
		var values = valuesCache.get(target);

		//delete extended descriptor
		if (isObject(propValue)){
			for (var propName in propValue){
				delete state[propName];
			}
		}

		else {
			if (isString(propValue) || isFn(propValue)) {
				//unbind fn value
				// console.log('off', name)
				if (isFn(propValue)) {
					var callbacks = activeCallbacks.get(target);
					if (callbacks[name]) {
						propValue = callbacks[name];
						callbacks[name] = null;
					}
				}
				eOff(target, name, propValue);
			}

			//set value to the root initial one, if such
			if (has(propsCache.get(target), name) && !state.constructor)
				delete values[name];
		}
	}
}


/** try to enter a state property, like set/get/init/etc */
function callState(target, state, a1, a2) {
	//undefined state (like no init meth)
	if (state === undefined) {
		return a1;
	}

	//init: 123
	else if (isPlain(state)) {
		//FIXME: this guy is questionable (return state)
		return state;
	}

	//init: function(){}
	else if (isFn(state)) {
		return state.call(target, a1, a2);
	}

	else if (isObject(state)) {
		//init: {before: function(){}}
		if (isFn(state[enterCallbackName])) {
			return state[enterCallbackName].call(target, a1, a2);
		}
		//init: {before: 123}
		else {
			return state[enterCallbackName];
		}
	}

	//init: document.createElement('div')
	return state;
}


/** try to leave state: call after with new state name passed */
function leaveState(target, state, a){
	// console.log('leave', state)
	if (!state) return a;

	if (!state[leaveCallbackName]) {
		return state[leaveCallbackName];
	}

	if (isFn(state[leaveCallbackName])) {
		return state[leaveCallbackName].call(target, a)
	}
}

function noop(){}

function isStateTransitionName(name){
	if (name === enterCallbackName || name === leaveCallbackName) return true;
}


/** make sure there’re no references to the target, so there’re no memory leaks */
function unapplyState(target, props){
	//TODO
}
},{"each-csv":29,"enot":4,"extend":30,"icicle":31,"mutype":18,"split-keys":32}],29:[function(require,module,exports){
module.exports=require(5)
},{"c:\\Users\\dmitry\\Dropbox\\Projects\\poppy\\node_modules\\enot\\node_modules\\each-csv\\index.js":5}],30:[function(require,module,exports){
var hasOwn = Object.prototype.hasOwnProperty;
var toString = Object.prototype.toString;
var undefined;

var isPlainObject = function isPlainObject(obj) {
	'use strict';
	if (!obj || toString.call(obj) !== '[object Object]') {
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
	'use strict';
	var options, name, src, copy, copyIsArray, clone,
		target = arguments[0],
		i = 1,
		length = arguments.length,
		deep = false;

	// Handle a deep copy situation
	if (typeof target === 'boolean') {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	} else if ((typeof target !== 'object' && typeof target !== 'function') || target == null) {
		target = {};
	}

	for (; i < length; ++i) {
		options = arguments[i];
		// Only deal with non-null/undefined values
		if (options != null) {
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


},{}],31:[function(require,module,exports){
module.exports=require(3)
},{"c:\\Users\\dmitry\\Dropbox\\Projects\\poppy\\node_modules\\emmy\\node_modules\\icicle\\index.js":3}],32:[function(require,module,exports){
var type = require('mutype');
var extend = require('extend');

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
},{"extend":33,"mutype":18}],33:[function(require,module,exports){
module.exports=require(30)
},{"c:\\Users\\dmitry\\Dropbox\\Projects\\poppy\\node_modules\\st8\\node_modules\\extend\\index.js":30}],34:[function(require,module,exports){
var Poppy = require('./poppy');
var place = require('placer');
var extend = require('extend');


/**
 * @module dropdown
 */
module.exports = Dropdown;


/**
 * Dropdown component - as you used to know it
 *
 * @constructor
 * @extends {Poppy}
 */
function Dropdown(options){
	//take over dropdown options
	Poppy.call(this, options);

	//append dropdown class
	this.container.classList.add('poppy-dropdown');
}


/**
 * Inherit from Poppy
 */
var proto = Dropdown.prototype = Object.create(Poppy.prototype);
proto.constructor = Dropdown;



/**
 * Go options after Poppy options
 */
var opts = Dropdown.options = Object.create(Poppy.options);



/**
 * Behaviour
 */
opts.state.hidden = {
	'@target click': function(e){
		//save current target reference (to use in resize)
		this.currentTarget = e.currentTarget;

		this.show(e.currentTarget);
	}
	//TODO: preventDefault
};
opts.state.visible = {
	/** Hide on click outside the container */
	'document click:not(.poppy-dropdown), @target click': function(){
		//clear current target reference
		this.currentTarget = null;
		this.hide();
	},

	/** Keep container updated on resize/scroll */
	'window resize:throttle(50), document scroll:throttle(15)': function(e){
		this.place(this.currentTarget);
	}
};



/**
 * Show dropdown tip by default
 */
opts.tip.init = true;


/**
 * Show close cross by default
 */
opts.close.init = true;



/**
* Dropdowns are usually placed below the element, except for border cases
*/
opts.align = 0.5;

proto.place = function(target){
	var opts = {
		relativeTo: target,
		side: 'bottom',
		within: window,
		align: this.align
	};

	//place by the bottom-strategy
	place(this.container, opts);


	//place tip
	place(this.tipEl, {
		relativeTo: target,
		align: this.tipAlign,
		side: opts.side
	});
	this.tipEl.setAttribute('data-side', opts.side);

	return this;
};



// /**
//  * Autoinit instances.
//  *
//  * @see Use [selector-observer]{@link https://www.npmjs.org/package/selector-observer}
//  *      if you want to init items dynamically. *
//  */
// document.addEventListener("DOMContentLoaded", function() {
// 	var items = document.querySelectorAll('[data-dropdown]');
// 	for(var i = items.length; i--;){
// 		new Dropdown(items[i]);
// 	}
// });
},{"./poppy":35,"extend":11,"placer":19}],35:[function(require,module,exports){
var type = require('mutype');
var css = require('mucss');
var place = require('placer');
var q = require('query-relative');
var parse = require('muparse');
var extend = require('extend');
var state = require('st8');
var Emitter = require('emmy');


//TODO: add close setting
//TODO: build & min
//TODO: bower, component
//TODO: replace kudago dropdowns
//TODO: tests page
//TODO: demo page
//TODO: fix tip position on dropdown edges (re-place container not including margins)
//TODO: fix :root trouble


/**
 * Poppy is a base class for building any kind of popupping stuff.
 *
 * These things might be:
 * overlay
 * tooltip
 * dropdown
 * notifier
 * popover
 * slide-screen
 * modal
 * balloon
 * etc.
 *
 * @module Poppy
 */
module.exports = Poppy;


/* ---------------------------------- I N I T ---------------------------------------- */


/**
 * @constructor
 */
function Poppy(options){
	var self = this;

	//take over all props
	extend(this, options);


	//create tip element
	this.tipEl = document.createElement('div');
	this.tipEl.className = 'poppy-tip';

	//create content element
	this.contentEl;

	//close button
	this.closeEl = document.createElement('div');
	this.closeEl.className = 'poppy-close';
	Emitter.on(this.closeEl, 'click', function(){
		self.hide();
	});

	//apply params
	state(this, this.constructor.options);
}


/**
 * Defaults & behaviour
 */
Poppy.options = {
	/**
	 * An element causing popup to show.
	 * Redefine in exact instance of poppy.
	 */
	target: {},


	/** Align container left by default */
	align: 'left',

	/**
	 * A container instance.
	 * Unique per poppy.
	 *
	 * @type {Element}
	 */
	container: {
		init: function(){
			// create poppy container
			var $container = document.createElement('div');
			$container.className = 'poppy-container';
			$container.className += ' ' + this.containerClass;

			// set reference to this
			$container.poppy = this;

			return $container;
		}
	},


	/**
	 * Class to append to {@link container}
	 */
	containerClass: '',




	/**
	 * Small arrow aside the container.
	 * Tip is a tip container indeed, but user shouldn’t care.
	 *
	 * @todo Think of placing tip via placer and placing to the holder
	 *       The way container is placed.
	 *       It will allow to encapsulate tip placing logic.
	 *       Or try to pass relativeTo attribute to the placer for the tip.
	 *       So try to use placer for tips anyway.
	 */
	tip: {
		init: false,
		//by default - hide link
		_: function(){
			this.container.classList.remove('poppy-container-tip');
		},
		'true': function(){
			this.container.classList.add('poppy-container-tip');
		}
	},


	/** Side to align tip relative to the target but within the container
	 *
	 * @enum {string|number}
	 * @default .5
	 */
	tipAlign: 0.5,


	/**
	 * Where to place container
	 *
	 * @type {Element}
	 */
	holder: {
		init: 'body',
		get: function(value){
			return q(value);
		}
	},


	/**
	 * Content to show in the container.
	 *
	 * @type {(string|Node|selector)}
	 */
	content: {
		init: ''
	},


	/**
	 * Type of content to show
	 *
	 * @enum {string}
	 * @default null
	 *
	 * null		Other element on the page
	 * 'html'	Insert content as innerHTML
	 * 'image'	An image will be loaded
	 * 'ajax'	Request an URL, insert as an HTML
	 * 'iframe'	Insert an iframe with URL passed
	 * 'swf'
	 * 'text'	Insert content as a plain text
	 */
	contentType: {
		init: null,

		//some external element/selector
		_:{
			content: {
				changed: function(val){
					var el = q(val);

					//remove from doc
					if (el.parentNode) el.parentNode.removeChild(el);
					el.removeAttribute('hidden');

					this.contentEl = el;
				}
			}
		},

		//innerHTML
		html: {
			content: {
				changed: function(val){
					var el;
					//ensure content holder exists
					if (!this.contentEl) {
						el = this.contentEl = document.createElement('div');
						this.container.appendChild(el);
					}
					else {
						el = this.contentEl;
					}
					el.innerHTML = val;
					return el;
				}
			}
		}
	},


	/** Instantly close other dropdowns when the one shows */
	single: false,


	/** Show close button or not */
	close: {
		init: false,
		//don’t show close
		_: function(){
			this.container.replaceChild(this.closeEl);
			this.container.classList.remove('poppy-container-close');
		},
		//show close
		'true': function(){
			this.container.appendChild(this.closeEl);
			this.container.classList.add('poppy-container-close');
		}
	},


	/**
	 * Visibility state of popup.
	 *
	 * @enum {string}
	 * @default 'hidden'
	 * @abstract
	 */
	state: {
		init: 'hidden',

		/** Do open animation or whatever */
		opening: function(){
			var self = this;
			setTimeout(function(){
				self.state = 'visible';
			});
		},

		/** Visible state */
		visible: {},

		/** Hidden state */
		hidden: {},

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
	}
};


/**
 * Content selector ←→ poppy-instance
 * To share content between poppies
 */
var contentCache = {};


/* ----------------------------------- A P I ----------------------------------------- */


var proto = Poppy.prototype;


/**
 * Show the container
 * @chainable
 * @return {Target} Chaining
 */
proto.show = function(target){
	var self = this;

	//append content element to the container
	if (this.contentEl.parentNode !== this.container)
		this.container.appendChild(this.contentEl);

	//append container to the holder
	self.holder.appendChild(self.container);

	//append tip, if needed
	if (this.tip && !this.tipEl.parentNode) self.holder.appendChild(this.tipEl)

	//place
	self.place(target);

	//switch state
	self.state = 'opening';

	return self;
};


/**
 * Close the container
 * @chainable
 * @return {Target} Chaining
 */
proto.hide = function(){
	// console.log('hide');

	//remove container from the holder, if it is still there
	if (this.container.parentNode)
		this.holder.removeChild(this.container);

	//remove tip
	if (this.tipEl.parentNode)
		this.holder.removeChild(this.tipEl);

	//switch state
	this.state = 'hidden';

	return this;
};


/**
 * Automatically called after show.
 * Override this behaviour in instances, if needed.
 *
 * @abstract
 */
proto.place = function(){};


/** Correct the tip according to the tipAlign value.
 * Defined in tip state.
 * @abstract
 */
proto.placeTip = function(){};


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
},{"emmy":2,"extend":11,"mucss":13,"muparse":14,"mutype":18,"placer":19,"query-relative":26,"st8":28}]},{},[1])(1)
});