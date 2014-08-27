(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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


},{}],2:[function(require,module,exports){
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
},{}],3:[function(require,module,exports){
(function (global){
//requirements
var enot = require('enot');
var id = require('object-id');
var eachCSV = require('each-csv');
var extend = require('extend');
var matchSelector = require('matches-selector');


/**
* ----------- Env detection
*/
//prefix detector
var win = window, doc = document, root = doc.documentElement, body = document.body, head = doc && doc.querySelector('head');

var prefix = (function () {
	var pre;
	if (win.getComputedStyle) {
		var styles = win.getComputedStyle(root, '');
		pre = (Array.prototype.slice
			.call(styles)
			.join('')
			.match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o'])
		)[1];
	} else pre = 'ms'
	return {
		dom: pre == 'ms' ? 'MS' : pre,
		css: '-' + pre + '-',
		lowercase: pre,
		js: pre == 'ms' ? pre : capfirst(pre)
	};
})();


var MO = win.MutationObserver || win[prefix.js + 'MutationObserver'];


//object shortcuts
var defineProperty = Object.defineProperty;


/**
* ------------ Utils
*/
function deepExtend(a){
	var l = arguments.length;
	if (!isObject(a) && !isFn(a)) a = {};

	for (var i = 1; i<l; i++){
		var b = arguments[i], clone;

		if (!isObject(b)) continue;

		for (var key in b) {
			if (!has(b, key)) continue;

			var src = a[key];
			var val = b[key];

			if (!isObject(val)) {
				a[key] = val;
				continue;
			}

			if (isObject(src)) {
				clone = src;
			} else if (isArray(val)) {
				clone = (isArray(src)) ? src : [];
			} else {
				clone = {};
			}

			a[key] = deepExtend(clone, val);
		}
	}

	return a;
}

//speedy implementation of `in`
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

	if (isPlain(a) || isArray(a) || isElement(a)) return false;

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
	return typeof a === 'string'
}

function isNumber(a){
	return typeof a === 'number'
}

function isBool(a){
	return typeof a === 'boolean'
}

function isPlain(a){
	return !a || isString(a) || isNumber(a) || isBool(a);
}

function isArray(a){
	return a instanceof Array;
}

function isElement(target){
	return target instanceof HTMLElement
}

//Tests whether name is private
function isPrivateName(n){
	return n[0] === '_' && n.length > 1
}


/**
* ------------ Scopes
*/
//set of object's scopes, keyed by id
var scopes = {};

//get any object-associated scope
//TODO: rewrite it using maps
function getScope(obj){
	var objId = id(obj);

	//ensure scope
	if (!scopes[objId]) scopes[objId] = {};

	return scopes[objId];
}

//removes element scope
function deleteScope(obj){
	scopes[id(obj)] = null;
}



/**
* ------------ Events
*/
function preventDefault(e){
	e.preventDefault()
}

//no operation
function noop(){}





/**
* ------------- Strings
*/
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
			return JSON.parse(str)
		} catch (e) {
			return str
		}
	}
	return str;
}

//parse value according to the type passed
function parseTyped(value, type){
	var res;
	// console.log('parse typed', value, type)
	if (type instanceof Array) {
		res = parseArray(value);
	} else if (isNumber(type)) {
		res = parseFloat(value)
	} else if (isBool(type)){
		res = !/^(false|off|0)$/.test(value);
	} else if (isFn(type)){
		res = new Function(value);
	} else if (isString(type)){
		res = value;
	} else if (isObject(type)) {
		res = parseObject(value)
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
		return {}
	}
}

//returns array parsed from string
function parseArray(str){
	if (!isString(str)) return [parseValue(str)]

	//clean str from spaces/array rudiments
	str = str.trim();
	if (str[0] === '[') str = str.slice(1);
	if (str.length > 1 && str[str.length - 1] === ']') str = str.slice(0,-1);

	var result = [];
	eachCSV(str, function(value) {
		result.push(parseValue(value))
	})

	return result;
}

//camel-case → CamelCase
function toCamelCase(str){
	return str && str.replace(/-[a-z]/g, function(match, position){
		return upper(match[1])
	})
}

//CamelCase → camel-case
function toDashedCase(str){
	return str && str.replace(/[A-Z]/g, function(match, position){
		return (position ? '-' : '') + match.toLowerCase()
	})
}

//simple uppercaser
function upper(str){
	return str.toUpperCase();
}

//aaa → Aaa
function capfirst(str){
	str+='';
	if (!str) return str;
	return upper(str[0]) + str.slice(1);
}

// onEvt → envt
function unprefixize(str, pf){
	return (str.slice(0,pf.length) === pf) ? str.slice(pf.length).toLowerCase() : str;
}

//stringify any element passed, useful for attribute setting
function stringify(el){
	if (!el) {
		return '' + el
	} if (el instanceof Array){
		//return comma-separated array
		return el.join(',')
	} else if (el instanceof HTMLElement){
		//return id/name/proper selector
		return el.id

		//that way is too heavy
		// return selector(el)
	} else if (isObject(el)){
		//serialize json
		return JSON.stringify(el);
	} else if (isFn(el)){
		//return function body
		var src = el.toString();
		el.slice(src.indexOf('{') + 1, src.lastIndexOf('}'));
	} else {
		return el.toString();
	}
}


//Disentangle listed keys
function flattenKeys(set, deep){
	//TODO: deal with existing set[key] - extend them?

	for(var keys in set){
		var value = set[keys];

		if (deep && isObject(value)) flattenKeys(value, deep);

		if (/,/.test(keys)){
			delete set[keys];

			eachCSV(keys, function(key){
				set[key] = value;
			});
		}
	}

	return set;
}


//sinple clone of any value passed
function clone(a){
	if (isArray(a)) {
		return a.slice();
	}
	if (isObject(a)){
		return deepExtend({}, a);
	}
	return a;
}/**
* Mod constructor - creates a custom mod class
*/

module.exports = Mod;

//provide Mod on window (src/*.js are going to be concatenated)
if (doc) global['Mod'] = Mod;

//TODO: think to separate `State` class instead of Mod
var globalModId = 0;
function Mod(a, b, options){
	var props, target;

	//just properties passed
	if (arguments.length < 2 || isMod(b)){
		//props can be set as function prototype
		if (isFn(a)) {
			props = a.prototype
		} else {
			props = a;
		}
	}
	//target + properties passed
	else {
		target = a;
		props = b;
	}


	//create mod class
	//NOTE: this is the fastest way to clone an fn
	function mod(target, options){
		//list of targets passed - init every target
		if (!isElement(target)) {
			if (target && target.length) {
				var l = target.length;
				for (var i = 0; i < l; i++){
					mod(target[i], options);
				}
				return target;
			}
		}
		return ModInstance(target, mod, options);
	};

	//create constructor for properties (if fn has been passed)
	if (isFn(a)) {
		props.constructor = mod;
	}

	//set prototype things
	extend(mod, Mod.fn);

	//keep track mod instances
	mod.instances = {}

	//keep track mods created
	Mod.list.push(mod);

	//ensure references are properly covered
	flattenKeys(props, true);

	//ensure mod prototype
	mod.fn = props === undefined ? {} : props;

	//create Properties from other mixins on the mod
	if (isObject(props)){
		if (mod.fn.mixins) {
			//NOTE: it may create some properties before them being created in mod constructor, so they’ll be ignored
			for (var i = 0; i < props.mixins.length; i++) {
				instillProps(mod.fn, props.mixins[i].fn);
			}
		}

		//stub lc
		mod.fn.init = mod.fn.init || noop;
		mod.fn.attached = mod.fn.attached || noop;
		mod.fn.created = mod.fn.created || noop;

		//ensure selector for element
		var selector = mod.fn.selector;
		defineProperty(mod.fn, 'selector', {
			get: function(){
				return mod.fn._selector;
			},
			set: function(selector){
				mod.fn._selector = selector;

				//query every element in DOM, init it as a ModInstance
				if (!selector) return;
				var targets = doc.querySelectorAll(selector);
				for (var i = 0; i < targets.length; i++) {
					mod(targets[i]);
				}
			}
		});
		mod.fn.selector = selector;
	}


	//TODO: transport(mod, props);

	//apply anonymous mod
	if (target) {
		return mod(target, options);
	}

	// console.groupEnd();

	return mod;
};

/**
* List of mods to observe
*/
Mod.list = [];


/**
* Check whether the constructor passed is mod
*/
function isMod(mod){
	return isFn(mod) && mod.isMod;
}

/**
* Prototype of every mod instance
*/
Mod.fn = {
	//marker
	isMod: true,

	//tests whether el is instance of the mod
	isInstance: function(target){
		if (isPlain(target)) return false;

		if (!this.instances[id(target)]) return false;
		return true;
	},

	'extends': null,

	toJSON: function (){
		return this.fn;
	},

	/**
	* Apply the mod as a first mixin
	*/
	extend: function(props){
		return Mod(instillProps(props, this.fn));
	},

	/**
	* Default target constructor
	*/
	constructor: function(target){
		// console.log("createDefaultModInstance", mod)
		var mod = this, proto = mod.fn, newTarget, baseTag = proto['extends']

		//no DOM - return target or empty
		if (!doc) {
			return target || {};
		}

		//nothing to extend - return target or empty
		if (!baseTag) {
			return target || {};
		}

		//baseTag is set + DOM is available
		if (target) {
			//make non-element target an element
			if (!isElement(target)) {
				var newTarget = baseTag ? doc.createElement(baseTag) : {};
				extend(newTarget, target);
				return newTarget;
			}
			//don’t touch element passed
			else {
				return target;
			}
		}

		//create a new element
		return baseTag ? doc.createElement(baseTag) : {};
	},

	/**
	* Properties iterator - iterate each mod property in proper order, including inner properties.
	*/
	eachProp: function(fn, ctx){
		var mod = this, propsStack = [];

		propsStack.push( { props: mod.fn, name: undefined } );

		while (propsStack.length) {
			var propsObj = propsStack.shift();

			flattenKeys(propsObj.props);

			eachProp(propsObj.props, function(name, prop){
				var result = fn(name, prop, propsObj.name);

				if (result === false) return;

				//save further iteration
				if (isObject(prop)) {
					for (var stateName in prop) {
						propsStack.push({ props: prop[stateName], name: name });
					}
				}
			}, mod);
		}
	}
}

//properties list iterator
//FIXME: make context callable, not passable
function eachProp(props, fn, ctx){
	ctx = ctx || this;

	if (!isObject(props)) return;

	var names = Object.keys(props)
	.filter(isOkName)
	.sort(function(a,b){
		//lc things go first


		//inned mods go last - they can include prop-references inide so they should go after refs
		if (isObject(props[a])) return 1;

		//references go before last
		if (a[0] === '@') return 1;
		if (b[0] === '@') return -1;

		//inner fn references go before last
		if (isString(props[a])) return 1;


		return -1;
	});

	// console.log(names)

	names.forEach(function(name){
		var result = fn.call(ctx, name, props[name]);
		if (result === false) return false;
	});
}


/**
* List of reserved properties
*/
var reservedNames = {
	'before': true,
	'after': true,

	//lifecycle
	// 'init': true,
	// 'created': true,
	// 'attached': true,

	//eventSource
	'on': true,
	'off': true,
	'fire': true,
	'extends': true
}


//whether name should be ignored
function isOkName(name){
	return !reservedNames[name] && !isPrivateName(name) //&& !(Mod.fn[name] !== undefined);
}


//append new props to target props; extend [cloned] new props matching target props with target props
function instillProps(targetProps, newProps){
	if (isPlain(newProps)) return targetProps;
	if (isPlain(targetProps)) return newProps;

	newProps = clone(newProps);

	for (var name in newProps){
		targetProps[name] = mergeProperty(newProps[name], targetProps[name]);
	}

	return targetProps
}

/**
* Return new property, merging both old and new descriptors
*/
function mergeProperty(oldProp, newProp){
	if (newProp === undefined) return oldProp;
	if (oldProp === undefined) return newProp;

	//supposation that natural behaviour is extension of all oldProps
	// console.log(oldProp, newProp, isObject(oldProp), isObject(newProp))
	if (isObject(newProp)){
		if (isObject(oldProp)){
			// var resProp = clone(oldProp);
			return deepExtend(oldProp, newProp);
		} else {
			return extend({init: oldProp}, newProp);
		}
	} else {
		if (isObject(oldProp)){
			//TODO: are you sure don’t want to extend old property’s `init` value?
			return newProp
		} else {
			return newProp
		}
	}
}/**
* Instantiates target with mod passed
*/
function ModInstance (target, mod, options) {
	//ignore double instantiation
	if (mod.isInstance(target)) return target;

	// console.group("ModInstance");

	//create target & init callback
	var initResult;

	//if no props defined - return fn
	if (!isObject(mod.fn)) return mod.fn;

	//ensure proper target
	//FIXME: optimize this
	var constructor = mod.fn.hasOwnProperty('constructor') && mod.fn.constructor !== mod ? mod.fn.constructor : mod.constructor;
	target = constructor.call(mod, target);

	//ignore plain target
	if (isPlain(target)) {
		return target;
	}

	//take over options passed
	extend(target, options);

	//init callback
	var init = target.init || mod.fn.init;
	if (isFn(init)) {
		init.call(target, target);
		enot.fire(target, 'init');
		target.init = noop;
	}


	//track instances
	var scope = getScope(target);
	var targetId = id(target);
	if (mod.instances) mod.instances[targetId] = target;



	//create prototype methods on target
	if (!target.isModInstance) {
		//soft extend
		for (var propName in ModInstance.fn){
			if (!has(target, propName)) target[propName] = ModInstance.fn[propName];
		}

		//save target clean clone in order to distinguish preset values
		if (isElement(target)){
			target._clone = target.cloneNode();
		}
	}

	//create properties controllers
	//NOTE: getters have to be defined before values are inited - in order to intercept dependent initializations
	mod.eachProp(function(name, desc, parentName){
		var prop;

		//ignore prototype methods
		if (has(ModInstance.fn, name)) return;

		//ensure referenced property created before reference (bad sorting of props)
		if (name[0] === '@') {
			var refName = name.split(/\s/)[0].slice(1);

			if (!scope[refName]) scope[refName] = createProperty(target, refName, mod.fn[refName]);
		}

		//if property hasn’t been created on the top level, create it with an empty descriptor
		if (!scope[name] && !has(mod.fn, name)) {
			prop = createProperty(target, name, isFn(desc) ? noop : undefined);
			prop.initBeforehead = parentName;
		}

		//create top-level property normally
		else {
			prop = createProperty(target, name, desc);
		}

		//save created property to the scope
		scope[name] = prop;

	}, mod);

	//set properties initial values - in order to avoid late-initialization from inner states
	eachProp(scope, function(name, prop){
		prop.initValue && prop.initValue();
	})

	//created callback (can’t be called on nested mods)
	enot.fire(target,'created');

	//turn off lc methods
	target.created = noop;

	//fire attached
	// console.log(target, mod['displayName'], root.contains(target))
	if (isElement(target) && root.contains(target)){
		fireAttached(target);
	}

	// console.groupEnd()

	return target;
}

/**
* Prototype things
*/
//FIXME: ensure it’s right
ModInstance.fn = {};

//marker
ModInstance.fn.isModInstance = true;

/**
* Get object representation of a mod target
*/
ModInstance.fn.toJSON = function(){
	var scope = getScope(this), result = {};

	for (var propName in scope) {
		var prop = scope[propName];
		if (prop instanceof Property && !isFn(prop.value) && !has(ModInstance.fn, propName)) result[propName] = prop.value;
	}

	return result;
}

/**
* EventSource interface
*/
ModInstance.fn.on = function(a,b){
	enot.on(this, a,b);
}
ModInstance.fn.off = function(a,b){
	enot.off(this,a,b);
}
ModInstance.fn.fire = function(e, d, b){
	enot.fire(this, e,d,b)
}


//Property constructor
function createProperty(target, name, desc){
	var prop, scope = getScope(target);

	//return existing property
	if (scope[name]) {
		return scope[name];
	}

	//create top-level property normally
	return new Property(target, name, desc);
}//TODO: use enot fully instead of own iteration

/**
* Property controller on instance
*/
function Property(target, name, desc) {
	var scope = getScope(target);
	var self = this;

	//save prop params
	self.displayName = name;
	self.modInstance = target;
	self.descriptor = desc;

	//set states applied counter
	self.appliedStates = 0;

	//set storage for events applied through states
	self.eventHandlers = {};

	//FIXME: accord with target creation selfProp detection
	//replace with events
	if (name[0] === '@') {
		var refName = name.split(/\s/)[0].slice(1);
		self.referenceEvt = name.slice(refName.length + 1).trim();

		// console.log('`' + refName + '`')

		self.reference = scope[refName];

		//keep referrers list
		//FIXME: sometimes there’s an error of absent reference (look for pornorama.js)
		if (!self.reference.referrers) self.reference.referrers = [];
		self.reference.referrers.push(self);
	}

	//parse preset value in order to avoid it from being redefined in initialization of adjacent props
	self.presetValue = self.parseInitialValue();

	//set self value caller
	self.callValue = self.callValue.bind(self);

	//ignore native property, just keep method inited
	if (has(target._clone, name)){
		self.isNative = true;
	}

	//declare property on the target
	else {
		defineProperty(target, name, {
			configurable: false,
			enumerable: true,
			//FIXME: get rid of these binds
			get: self.getValue.bind(self),
			set: self.setValue.bind(self)
		});
	}

	//extend prop descriptor
	self.states = {};
	extend(self.states, desc);

	// console.groupEnd();
	return self;
}

//NOTE: constructor reference misses in prototype redefinition
extend(Property.prototype, {
	//whether property has been inited already
	isInited: null,

	//inner reference stuff
	reference: null,
	referenceEvt: null,

	//main prop value keeper
	value: undefined,

	//return type of descriptor (example of value)
	getType: function(){
		var self = this;
		return isObject(self.descriptor) ? (isFn(self.descriptor.init) ? undefined : self.descriptor.init ) : self.descriptor;
	},

	//parse option from the target
	parseInitialValue: function(){
		var self = this, propName = self.displayName, target = self.modInstance,
			result;

		//preset value - parse it
		if (has(target, propName)) {
			//don’t redefine fns - keep them native
			if (isFn(target[propName])) return target[propName];

			result = target[propName]
			// console.log('PARSED', self.displayName, result)
		}

		//attribute value - parse it
		else {
			if (has(target, 'attributes')) {
				var dashedPropName = toDashedCase(propName);

				var attr = target.attributes[propName] || target.attributes['data-' + propName] || target.attributes[dashedPropName] || target.attributes['data-' + dashedPropName];

				if (attr) {
					// console.log('parseAttr', propName, propType)
					//function on-attribute
					if (/^on/.test(propName)) {
						result = new Function(attr.value);
					}

					//detect based on type
					else {
						result = parseTyped(attr.value, self.getType());
					}
				}
			}
		}

		return result;
	},

	//self value caller
	callValue: function(e){
		var self = this, value = self.value, target = self.modInstance;

		// console.group('callValue', self.displayName, value)

		//call fn
		if (isFn(value)) {
			value.call(target, e);
		}
		//call fn refs (redirect)
		else if (isString(value)){
			eachCSV(value, function(item){
				// console.log('fire', target, item)
				enot.fire(target, item);
			})
		}

		// console.groupEnd();
	},

	//get event handler specific for target and value
	getEventHandler: function(target, value){
		// console.log('get handler', this.displayName, value)
		return function(e){
			// console.log('eventHandler', value)
			//call fn
			if (isFn(value)) {
				value.call(target, e);
			}
			//call fn refs (redirect)
			else if (isString(value)){
				eachCSV(value, function(item){
					// console.log(item)
					enot.fire(target, item);
				})
			}
		}
	},

	//bind self.value
	bindValue: function(value){
		var self = this, target = self.modInstance, scope = getScope(target), fn;

		value = value || self.value;

		// console.log('bind', self.displayName, value)
		//FIXME: a property may have lots of referrers, whereas a referrer may have only one reference

		//bind fnref
		if (((isString(value) && isPossiblyFnRef(value)) || isFn(value)) && (!self.reference && !self.referrers)) {
			// console.log('bind fn', self.displayName, value, target);
			return enot.on(target, self.displayName, value);
		}
	},

	//bind evt
	bindReference: function(){
		var self = this, value = self.value;

		// console.log('bind reference', self.displayName)

		//bind inner reference pointer
		if (self.referrers) {
			if (value) {
				//FIXME: get rid of that hack
				for (var i = 0; i < self.referrers.length; i++){
					var referrer = self.referrers[i];
					enot.on(value, referrer.referenceEvt, referrer.callValue);
				}
			}
		}
		//bind inner reference
		else if (self.reference) {
			if (value){
				//native values may be updated, so bind to a real value - the property one
				// on(self.reference.value, self.referenceEvt, self.callValue);
				enot.on(self.modInstance[self.reference.displayName], self.referenceEvt, self.callValue);
			}
		}
	},

	//unbind self.value
	unbindValue: function(value){
		var self = this, target = self.modInstance, scope = getScope(target);

		// console.log('unbindValue', self.displayName, value)

		value = value || self.value;

		//unbind fn/fnref
		if ((isString(value) && isPossiblyFnRef(value) || isFn(value)) && (!self.reference && !self.referrers)) {
			// console.log('off')
			//TODO: there cb reference is of the new state one
			return enot.off(target, self.displayName, value);
		}
	},

	//unbind reference event, if any
	unbindReference: function(){
		var self = this, value = self.value;

		// console.log('unbind reference', self.displayName, value)

		//unbind inner ref pointer
		if (self.referrers) {
			// console.log('rebind inner ref target', self.referrer.value)
			if (value) {
				for (var i = 0; i < self.referrers.length; i++){
					var referrer = self.referrers[i];
					// enot.off(value, referrer.referenceEvt, referrer.referenceFn);
					enot.off(value, referrer.referenceEvt, referrer.callValue);
				}
			}
		}
		//unbind inner reference
		else if (self.reference) {
			// console.log('unbind-inner-ref-fn', self.refProp, '`' + self.refEvt + '`', target[self.refProp])
			if (value){
				// enot.off(self.reference.value, self.referenceEvt, self.callValue);
				enot.off(self.modInstance[self.reference.displayName], self.referenceEvt, self.callValue);
			}
		}
	},

	//getter & setter
	getValue: function(){
		//init, if not inited
		if (!this.isInited) this.initValue();

		var getResult = this.enterState('get', this.value);

		return getResult === undefined ? this.value : getResult;
	},

	//call this fn once in order to init uninited value
	initValue: function(){
		var self = this;


		// console.log('init', self.displayName, self.descriptor)
		if (self.initBeforehead) {
			getScope(self.modInstance)[self.initBeforehead].initValue();
			self.initBeforehead = undefined;
		}

		if (self.isInited) return;
		self.isInited = true;


		//resolve init value
		var value, initResult;

		//if descriptor isn’t an object - apply descriptor’s value
		if (!isObject(self.descriptor)) {
			//set preset value, if any
			if (self.presetValue !== undefined && !self.isNative) {
				value = self.presetValue;
			}

			//set default value
			else {
				value = self.descriptor;
			}
		}

		//if init isn’t a function and preset exists - return preset
		else if (!isFn(self.states.init) && self.presetValue !== undefined) {
			value = self.presetValue
		}

		//else infer initResult from the `init`
		else {
			var before = self.value;

			initResult = self.enterState('init', self.presetValue);


			//catch value changed fromwithin init
			if (self.value !== before) {
				return;
			}

			//redirect state, if returned any
			if (initResult !== undefined) {
				value = initResult;
			}

			//nothing returned
			else {
				//if preset existed - go to preset
				if (self.presetValue !== undefined){
					value = self.presetValue;
				}

				//else value is undefined
				else {
					value = undefined;
				}
			}
		}

		// console.log('init', self.displayName, value)

		//bind initial fns
		//FIXME: bind it more carefully
		self.bindInitialValue();

		self.setValue(value, true);
	},

	//initial value binder
	bindInitialValue: function(){
		var self = this;
		if (isFn(self.descriptor) || (isString(self.descriptor) && isPossiblyFnRef(self.descriptor))) {
			self.bindValue(self.callValue);
		}
	},

	//try to enter mod
	enterState: function(name, value, oldValue){
		var self = this, state = self.states[name];

		//undefined/false state
		if (!state) {
			return state;
		}

		//init: 123
		else if (isPlain(state)) {
			return state;
		}

		//init: function(){}
		else if (isFn(state)) {
			return state.call(self.modInstance, value, oldValue);
		}

		//init: {before: function(){}}
		else if (isObject(state)) {
			if (isFn(state['before'])) {
				return state['before'].call(self.modInstance, value, oldValue);
			} else {
				return state['before'];
			}
		}

		//init: document.createElement('div')
		return state
	},

	//apply extraneous state descriptor
	applyDesc: function(stateName, desc){
		var self = this;

		// console.group('applyDesc', stateName, self.displayName, desc);

		//set plain desc passed
		if (!isObject(desc)) {
			var setResult = self.setValue(desc);

			//bind state-dependent listeners
			//FIXME: fnref descriptors and selfRef descriptors are not being bound
			//save event to set of events applied by states
			// console.log('apply handler', stateName, self.displayName)
			if (!self.eventHandlers[stateName]) self.eventHandlers[stateName] = self.getEventHandler(self.modInstance, setResult);

			self.bindValue(self.eventHandlers[stateName]);
		}

		//extend self with specific descriptor passed
		else {
			extend(self.states, desc);
		}

		//TODO unbind initial event/value
		if (self.appliedStates === 0) {
			// console.log('unbind initial')
			self.unbindValue(self.callValue);
		};

		//save applied state
		self.appliedStates++;

		// console.groupEnd();
	},

	//unapply extraneous state descriptor
	unapplyDesc: function(stateName, desc) {
		var self = this;

		// console.group('unapplyDesc', stateName, self.displayName)

		//forget applied state
		self.appliedStates--;

		//unbind state-dependent listeners
		self.unbindValue(self.eventHandlers[stateName]);

		//if no states left - reset values & event to initial descriptors
		if (self.appliedStates === 0){
			// console.log('bind initial')
			self.bindInitialValue();
		}

		var src = self.descriptor;
		if (src !== undefined) {
			if (!isObject(src)) {
				self.setValue(src)
			}

			else {
				//FIXME: unapply applied states here
				extend(self.states, src);
			}
		}


		// console.groupEnd();
	},

	setValue: function(value, initialCall){
		var self = this, target = self.modInstance, oldValue = self.value, scope = getScope(target),
			stateName, state, oldStateName, oldState, firstCall, initResult;

		//passing no arguments will cause initial call
		// console.group('set', '`' + self.displayName + '`', value, 'from', oldValue);
		// console.log('set', self.displayName, value, 'from', oldValue);

		if (!self.isInited) {
			firstCall = true;
			// console.log('init via set', self.displayName)
			initResult = self.initValue();
		}


		//FIXME: make sure it’s the best decision to detect inner sets (too much of code duplication)
		if (!self.isInSet) {
			//call set
			var isSetLock = 'isSet' + value
			if (!self[isSetLock]) {
				self[isSetLock] = true;

				self.isInSet = true;

				//FIXME: make sure error thrown has proper stacktrace
				try {
					//TODO: make set/get/init/changed mod calls be proper
					var setResult = self.enterState('set', value, oldValue);
				} catch (e){
					self.isInSet = null;
					self[isSetLock] = null;
					throw e;
				}

				//self.value could've changed here because of inner set calls
				if (self.inSetValue !== undefined) {
					setResult = self.inSetValue;
					// console.log('redirected value', setResult)
					self.inSetValue = undefined;
				}

				self.isInSet = null;
				self[isSetLock] = null;

				//catch redirect
				if (!firstCall && self.value !== oldValue) {
					// console.groupEnd();
					return;
				}

				//redirect state, if returned any
				if (setResult !== undefined) {
					value = setResult;
				}
			}
		} else {
			// console.log('isSet', value)
			self.inSetValue = value;
			// console.groupEnd();
			return;
		}

		//ignore not changed value
		if (!firstCall && !initialCall && value === self.value) {
			// console.log('ignore absense of change', self.value)
			// console.groupEnd();
			return;
		}

		//handle leaving state routine
		oldStateName = has(self.states, oldValue) ? oldValue : '_';
		oldState = self.states[oldStateName];

		if (!initialCall && has(self.states, oldStateName)){
			//after callback
			var isAfterLock = 'isAfter' + oldStateName
			if (!self[isAfterLock]) {
				self[isAfterLock] = true;

				var afterResult;

				if (isObject(oldState)) {
					if (isFn(oldState['after'])) {
						afterResult = oldState['after'].call(target, value, oldValue);
					} else {
						afterResult = oldState['after'];
					}
				}


				//ignore leaving state
				if (afterResult === false) {
					// console.groupEnd()
					self[isAfterLock] = null;
					return;
				}

				//redirect state, if returned any
				if (afterResult !== undefined) {
					self.setValue(afterResult);
					// console.groupEnd()
					self[isAfterLock] = null;
					return;
				}

				//catch redirect
				if (self.value !== oldValue) {
					// console.groupEnd();
					self[isAfterLock] = null;
					return;
				}

				self[isAfterLock] = null;
			}

			//leave an old mod - unapply old props
			eachProp(oldState, function(name, desc){
				scope[name].unapplyDesc(self.displayName + oldStateName, desc);
			})
		}


		self.unbindReference();

		self.value = value;

		// console.log('set succeeded', self.displayName, self.value)

		self.bindReference();

		//FIXME: avoid unapply-apply action for properties, make straight transition
		stateName = has(self.states, value) ? value : '_';

		//enter the new state
		if (has(self.states, stateName)) {
			state = self.states[stateName];

			//before callback
			var beforeResult;
			var isBeforeLock = 'isBefore' + stateName;
			if (!self[isBeforeLock]){
				self[isBeforeLock] = true;

				//apply new state props (used to be known as applyProps)
				eachProp(state, function(name, desc){
					scope[name].applyDesc(self.displayName + stateName, desc);
				})

				beforeResult = self.enterState(stateName, value, oldValue);


				//ignore entering state, if before returned false
				if (beforeResult === false) {
					self.setValue(oldValue);
					// console.groupEnd()
					self[isBeforeLock] = null;
					return;
				}

				//redirect mod, if returned any
				if (beforeResult !== undefined) {
					self.setValue(beforeResult);
					// console.groupEnd()
					self[isBeforeLock] = null;
					return;
				}

				//catch redirect within before
				if (self.value !== value) {
					// console.groupEnd();
					self[isBeforeLock] = null;
					return;
				}

				self[isBeforeLock] = null;
			}
		}

		//changed callback
		//TODO: refuse changed callback to change self value by returning anything
		var isChangedLock = 'isChangedTo' + value;
		if (self.states.changed && !self[isChangedLock] && value !== oldValue) {
			self[isChangedLock] = true;

			self.enterState('changed', value, oldValue);

			//TODO: there have to be a covering test, because kudago.slideshow failed
			self[isChangedLock] = null;
		}

		//update attribute
		self.setAttribute();
		// console.groupEnd();

		return value;
	},

	//reflect self value as attribute
	setAttribute: function(){
		var self = this, target = self.modInstance;

		if (!self.attribute) return;
		if (!target.setAttribute) return;
		if (isFn(self.value)) return;

		if (!self.value) {
			//hide falsy attributes
			target.removeAttribute(self.displayName);
		} else {
			//avoid target attr-observer catch this attr changing
			target.setAttribute(self.displayName, stringify(self.value));
		}

		enot.fire(target, 'attributeChanged');
	}
});


/**
* tests string on possible mthod reference (no newlines, looks like a method name)
*/
function isPossiblyFnRef(str){
	return !(str.length > 80 || /\n/.test(str)) ;
}/**
* Observe DOM changes
*/
if (MO) {
	var docObserver = new MO(function(mutations) {
		mutations.forEach(function(mutation){
			// console.log(mutation, mutation.type)
			//TODO: Update list of data-listeners
			if (mutation.type === 'attributes') {
				//console.log('doc', mutation)
				//TODO: check whether classes were added to the elements
			}

			//check whether appended elements are Mods
			else if (mutation.type === 'childList') {
				var l = mutation.addedNodes.length;

				for (var i = 0; i < l; i++) {
					var el = mutation.addedNodes[i];

					if (el.nodeType !== 1) continue;

					//check whether element added is mod
					// console.log(el, isModInstance(el))
					// every mod is registered - so don’t check undefined mods
					// if (isModInstance(el)) {
					// 	fireAttached(el);
					// }

					for (var k = Mod.list.length; k--;) {
						var mod = Mod.list[k];

						//FIXME: match selector
						//autoinit top-level registered mods
						if (mod.fn.selector && matchSelector(el, mod.fn.selector)) {
							// console.log('autoinit parent', modName, el['isAttached']);
							mod(el);
						}

						if (mod.isInstance(el, mod)) {
							fireAttached(el);
						}

						//FIXME: autoinit low-level registered mods
						var targets = el.querySelectorAll(mod.fn.selector);

						for (var j = 0; j < targets.length; j++){
							var innerEl = targets[j];
							// console.log('autoinit child', modName, el['isAttached'])

							fireAttached(mod(innerEl));
						}
					}
					//NOTE: noname mods within elements wont fire `attached`
				}

				//TODO: engage new data to update
			}
		})
	});

	docObserver.observe(document, {
		attributes: true,
		childList: true,
		subtree: true,
		characterData: true
	});
}

function fireAttached(target){
	if (!target['isAttached']){
		target['isAttached'] = true;
		enot.fire(target, 'attached');
	}
}
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"each-csv":4,"enot":5,"extend":1,"matches-selector":2,"object-id":7}],4:[function(require,module,exports){
module.exports = eachCSV;

//match every comma-separated element ignoring 1-level parenthesis, like `1,2(3,4),5`
var commaMatchRe = /(,[^,]*?(?:\([^()]+\)[^,]*)?)(?=,|$)/g

//iterate over every item in string
function eachCSV(str, fn){
	if (typeof str !== 'string') return;

	var list = (',' + str).match(commaMatchRe) || [''];
	for (var i = 0; i < list.length; i++) {
		// console.log(matchStr)
		var matchStr = list[i].trim();
		if (matchStr[0] === ',') matchStr = matchStr.slice(1);
		matchStr = matchStr.trim();
		fn(matchStr, i);
	}
};
},{}],5:[function(require,module,exports){
//TODO: unbind all callbacks
//TODO: enhance keys detection
//TODO: detect sequence events notation

var enot = module['exports'] = {};

var matches = require('matches-selector');
var eachCSV = require('each-csv');
var _ = require('mutypes');
var isString = _['isString'];
var isElement = _['isElement'];
var isPlain = _['isPlain'];
var has = _['has'];


var global = (1,eval)('this');
var doc = global.document;


//:pass shortcuts
var keyDict = {
	//kbd keys
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

	//mouse keys
	'LEFT_MOUSE': 1,
	'RIGHT_MOUSE': 3,
	'MIDDLE_MOUSE': 2
};

//jquery guarant
var $ = global.jQuery;

var commaSplitRe = /\s*,\s*/;

//target callbacks storage
var callbacks = {};

/**
* Returns parsed event object from event reference
*/
function parse(target, string, callback) {
	// console.group('parse reference', '`' + string + '`')
	var result = {};

	//get event name - the first token from the end
	var eventString = string.match(/\w+(?:\:\w+(?:\(.+\))?)*$/)[0];

	//remainder is a target reference - parse target
	string = string.slice(0, -eventString.length).trim();
	result.targets = parseTarget(target, string);

	//parse modifiers
	var eventParams = unprefixize(eventString, 'on').split(':');

	//get event name
	result.evt = eventParams.shift();
	result.modifiers = eventParams;

	//save resulting handler
	if (callback) {
		result.handler = applyModifiers(callback, result);
	}


	// console.groupEnd();
	return result;
}


/**
* Retrieve source element from string
*/
var selfReference = '@';
function parseTarget(target, str) {
	if (!str){
		return target
	}

	//try to query selector in DOM environment
	if (/^[.#[]/.test(str) && doc) {
		return doc.querySelectorAll(str);
	}

	//return self reference
	else if (/^this\./.test(str)){
		return getProperty(target, str.slice(5));
	}
	else if(str[0] === selfReference){
		return getProperty(target, str.slice(1));
	}

	else if(str === 'this') return target;
	else if(str === selfReference) return target;

	else if(str === 'body') return document.body;
	else if(str === 'root') return document.documentElement;

	//return global variable
	else {
		return getProperty(global, str);
	}
}

//get dot property by string
function getProperty(holder, propName){
	var propParts = propName.split('.');
	var result = holder, lastPropName;
	while ((lastPropName = propParts.shift()) !== undefined) {
		if (!has(result, lastPropName)) return undefined;
		result = result[lastPropName];
	}
	return result;
}


/**
* Apply event modifiers to string.
* Returns wrapped fn.
*/
function applyModifiers(fn, evtObj){
	var targetFn = fn;

	//:one modifier should be the last one
	evtObj.modifiers.sort(function(a,b){
		return /^one/.test(a) ? 1 : -1
	})
	.forEach(function(modifier){
		//parse params to pass to modifier
		var modifierName = modifier.split('(')[0];
		var modifierParams = modifier.slice(modifierName.length + 1, -1);

		if (enot.modifiers[modifierName]) {
			targetFn = enot.modifiers[modifierName](evtObj.evt, targetFn, modifierParams);
		}
	});

	return targetFn;
}


//set of modified callbacks associated with fns, {fn: {evtRef: modifiedFn, evtRef: modifiedFn}}
var modifiedCbCache = new WeakMap;

//set of target callbacks, {target: [cb1, cb2, ...]}
var targetCbCache = new WeakMap;


/**
* Listed reference binder
*/
// enot['addEventListener'] =
// enot['bind'] =
enot['on'] = function(target, evtRefs, fn){
	//if no target specified
	if (isString(target)) {
		fn = evtRefs;
		evtRefs = target;
		target = null;
	}

	if (!evtRefs) return false;

	eachCSV(evtRefs, function(evtRef){
		on(target, evtRef, fn);
	});
}

//cache of redirectors
var redirectCbCache = new WeakMap;

//single reference binder
function on(target, evtRef, fn) {
	//ignore empty fn
	if (fn === undefined) return;

	var evtObj = parse(target, evtRef, fn);

	var newTarget = evtObj.targets;
	var targetFn = evtObj.handler;

	//ignore not bindable sources
	if (!newTarget) return false;

	//iterate list of targets
	if (newTarget.length && !isElement(newTarget)) {
		for (var i = newTarget.length; i--;){
			on(newTarget[i], evtObj.evt, targetFn);
		}

		return;
	}


	//catch redirect (stringy callback)
	else if (isPlain(fn)) {
		fn += '';
		//FIXME: make sure it's ok that parsed targetFn looses here
		//create fake redirector callback for stringy fn
		targetFn = enot.modifiers.fire(evtRef, null, fn);

		//save redirect fn to cache
		if (!redirectCbCache.has(newTarget)) redirectCbCache.set(newTarget, {});
		var redirectSet = redirectCbCache.get(newTarget);

		//ignore existing binding
		if (redirectSet[evtObj.evt]) return false;

		//bind to old target
		if (target) targetFn = targetFn.bind(target);

		redirectSet[evtObj.evt] = targetFn;
	}

	//if fn has been modified - save modified fn (in order to unbind it properly)
	else if (targetFn !== fn) {
		//bind new event
		if (!modifiedCbCache.has(fn)) modifiedCbCache.set(fn, {});
		var modifiedCbs = modifiedCbCache.get(fn);

		//ignore bound event
		if (modifiedCbs[evtObj.evt]) return false;

		//bind to old target
		// if (target) targetFn = targetFn.bind(target);

		//save modified callback
		modifiedCbs[evtObj.evt] = targetFn;
	}

	bind(newTarget, evtObj.evt, targetFn);
}
//immediate bind
function bind(target, evt, fn){
	//DOM events
	if (isEventTarget(target)) {
		//bind target fn
		if ($){
			//delegate to jquery
			$(target).on(evt, fn);
		} else {
			//listen element
			target.addEventListener(evt, fn)
		}
	}

	//Non-DOM events
	else {
		//ensure callbacks array for target exist
		if (!targetCbCache.has(target)) targetCbCache.set(target, {});
		var targetCallbacks = targetCbCache.get(target);

		//save callback
		(targetCallbacks[evt] = targetCallbacks[evt] || []).push(fn);
	}
}


/**
* Listed reference unbinder
*/
// enot['removeEventListener'] =
// enot['unbind'] =
enot['off'] = function(target, evtRefs, fn){
	//if no target specified
	if (isString(target)) {
		fn = evtRefs;
		evtRefs = target;
		target = null;
	}

	//FIXME: remove all listeners?
	if (!evtRefs) return;

	eachCSV(evtRefs, function(evtRef){
		off(target, evtRef, fn);
	});
}

//single reference unbinder
function off(target, evtRef, fn){
	//ignore empty fn
	if (fn === undefined) return

	var evtObj = parse(target, evtRef);
	var newTarget = evtObj.targets;
	var targetFn = fn;

	if (!newTarget) return;

	//iterate list of targets
	if (newTarget.length && !isElement(newTarget)) {
		for (var i = newTarget.length; i--;){
			off(newTarget[i], evtObj.evt, targetFn);
		}

		return;
	}

	//catch redirect (stringy callback)
	if (isPlain(fn)) {
		fn += '';
		var redirectSet = redirectCbCache.get(newTarget);
		if (!redirectSet) return;

		targetFn = redirectSet[evtObj.evt];

		redirectSet[evtObj.evt] = null;
	}

	//try to clean cached modified callback
	else if (modifiedCbCache.has(fn)) {
		var modifiedCbs = modifiedCbCache.get(fn);
		if (modifiedCbs[evtObj.evt]) {
			targetFn = modifiedCbs[evtObj.evt];
			//clear reference
			modifiedCbs[evtObj.evt] = null;
		}
	}

	//unbind single target
	unbind(newTarget, evtObj.evt, targetFn);
}

//immediate unbinder
function unbind(target, evt, fn){
	//DOM events on elements
	if (isEventTarget(target)) {
		//delegate to jquery
		if ($){
			$(target).off(evt, fn);
		}

		//listen element
		else {
			target.removeEventListener(evt, fn)
		}
	}

	//non-DOM events
	else {
		//ignore if no event specified
		if (!targetCbCache.has(target)) return;
		var evtCallbacks = targetCbCache.get(target)[evt];

		if (!evtCallbacks) return;

		//remove specific handler
		for (var i = 0; i < evtCallbacks.length; i++) {
			if (evtCallbacks[i] === fn) {
				evtCallbacks.splice(i, 1);
				break;
			}
		}
	}
}

/**
* Dispatch event to any target
*/
// enot['trigger'] =
// enot['emit'] =
// enot['dispatchEvent'] =
enot['fire'] = function(target, evtRefs, data, bubbles){
	//if no target specified
	if (isString(target)) {
		bubbles = data;
		data = evtRefs;
		evtRefs = target;
		target = null;
	}

	if (evtRefs instanceof Event) {
		return fire(target, evtRefs);
	}

	if (!evtRefs) return false;

	eachCSV(evtRefs, function(evtRef){
		var evtObj = parse(target, evtRef);

		if (!evtObj.evt) return false;

		return applyModifiers(function(){
			var target = evtObj.targets;

			if (!target) return target;

			//iterate list of targets
			if (target.length && !isElement(target)) {
				for (var i = target.length; i--;){
					fire(target[i], evtObj.evt, data, bubbles);
				}
			}

			//fire single target
			else {
				fire(target, evtObj.evt, data, bubbles);
			}

		}, evtObj)();
	});
}


/**
* Event trigger
*/
function fire(target, eventName, data, bubbles){
	//DOM events
	if (isEventTarget(target)) {
		if ($){
			//TODO: decide how to pass data
			var evt = $.Event( eventName, data );
			evt.detail = data;
			bubbles ? $(target).trigger(evt) : $(target).triggerHandler(evt);
		} else {
			//NOTE: this doesnot bubble on disattached elements
			var evt;

			if (eventName instanceof Event) {
				evt = eventName;
			} else {
				evt =  doc.createEvent('CustomEvent');
				evt.initCustomEvent(eventName, bubbles, null, data)
			}

			// var evt = new CustomEvent(eventName, { detail: data, bubbles: bubbles })

			target.dispatchEvent(evt);
		}
	}

	//no-DOM events
	else {
		//ignore if no event specified
		if (!targetCbCache.has(target)) return;
		var evtCallbacks = targetCbCache.get(target)[eventName];

		if (!evtCallbacks) return;

		for (var i = 0, len = evtCallbacks.length; i < len; i++) {
			evtCallbacks[i] && evtCallbacks[i].call(target, {
				detail: data,
				type: eventName
			});
		}
	}
}



//list of available event modifiers
var DENY_EVT_CODE = 1;
enot.modifiers = {};

//call callback once
// enot.modifiers['once'] =
enot.modifiers['one'] = function(evt, fn){
	var cb = function(e){
		// console.log('once cb', fn)
		var result = fn && fn.call(this, e);
		//FIXME: `this` is not necessarily has `off`
		result !== DENY_EVT_CODE && enot.off(this, evt, cb);
		return result;
	}
	return cb;
}

//filter keys
// enot.modifiers['keypass'] =
// enot.modifiers['mousepass'] =
// enot.modifiers['filter'] =
enot.modifiers['pass'] = function(evt, fn, keys){
	keys = keys.split(commaSplitRe).map(upper);

	var cb = function(e){
		var pass = false, key;
		for (var i = keys.length; i--;){
			key = keys[i]
			var which = 'originalEvent' in e ? e.originalEvent.which : e.which;
			if ((key in keyDict && keyDict[key] == which) || which == key){
				pass = true;
				return fn.call(this, e);
			}
		};
		return DENY_EVT_CODE;
	}
	return cb
}

//white-filter target
// enot.modifiers['live'] =
// enot.modifiers['on'] =
enot.modifiers['delegate'] = function(evt, fn, selector){
	var cb = function(e){
		var target = e.target;

		// console.log('delegate cb', e, selector)
		//filter document/object/etc
		if (!isElement(target)) return DENY_EVT_CODE;

		//intercept bubbling event by delegator
		while (target && target !== this) {
			if (matches(target, selector)) {
				//set proper current target
				e.delegateTarget = target;
				Object.defineProperty(e, 'currentTarget', {
					get: function(){
						return target
					}
				})
				return fn.call(this, e);
			}
			target = target.parentNode;
		}

		return DENY_EVT_CODE;
	}
	return cb;
}

//black-filter target
enot.modifiers['not'] = function(evt, fn, selector){
	var cb = function(e){
		// console.log('not cb', e, selector)
		var target = e.target;

		//traverse each node from target to holder and filter if event happened within banned element
		while (target && target !== this) {
			if (matches(target, selector)) return DENY_EVT_CODE;
			target = target.parentNode;
		}

		return fn.call(this, e);
	}
	return cb;
}

//throttle call
var throttleCache = new WeakMap;
enot.modifiers['throttle'] = function(evt, fn, interval){
	interval = parseFloat(interval)
	// console.log('thro', evt, fn, interval)
	var cb = function(e){
		// console.log('thro cb')
		var self = this;

		if (throttleCache.get(self)) return DENY_EVT_CODE;
		else {
			var result = fn.call(self, e);
			if (result === DENY_EVT_CODE) return result;
			throttleCache.set(self, setTimeout(function(){
				clearInterval(throttleCache.throttleKey);
				throttleCache.delete(self);
			}, interval));
		}
	}

	return cb
}

//defer call - call Nms later invoking method/event
// enot.modifiers['after'] =
// enot.modifiers['async'] =
enot.modifiers['defer'] = function(evt, fn, delay){
	delay = parseFloat(delay)
	// console.log('defer', evt, delay)
	var cb = function(e){
		// console.log('defer cb')
		var self = this;
		setTimeout(function(){
			return fn.call(self, e);
		}, delay);
	}

	return cb
}

//redirector
// enot.modifiers['redirect'] =
enot.modifiers['fire'] = function(evt, fn, evtRef){
	var evts = evtRef + '';
	var cb = function(e){
		var self = this;
		eachCSV(evts, function(evt){
			// console.log('fire', evt, self)
			fire(self, evt, e.detail);
		});
	}

	return cb
}


//detects whether element is able to emit/dispatch events
//TODO: detect eventful objects in a more wide way
function isEventTarget (target){
	return target && !!target.addEventListener;
}


// onEvt → Evt
function unprefixize(str, pf){
	return (str.slice(0,pf.length) === pf) ? str.slice(pf.length) : str;
}

//simple uppercaser
function upper(str){
	return str.toUpperCase();
}
},{"each-csv":4,"matches-selector":2,"mutypes":6}],6:[function(require,module,exports){
/**
* Trivial types checkers.
* Because there’re no common lib for that ( lodash_ is a fatguy)
*/
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
		return target instanceof HTMLElement
	},

	isPrivateName: function(n){
		return n[0] === '_' && n.length > 1
	}
}
},{}],7:[function(require,module,exports){
(function(){

/**
 * Check if we need to do an IE hack.
 */

var bug = !Object.defineProperty;

/**
 * If we need to do an IE hack, see if we
 * really can by seeing if we can override `toLocaleString`.
 *
 * @see http://stackoverflow.com/questions/17934888/how-to-add-non-enumerable-property-in-javascript-for-ie8/17935125#17935125
 */

if (bug) {
  for (var k in { toLocaleString: 3 }) {
    if (k === 'toLocaleString') {
      bug = false;
    }
  }
}

/**
 * get/set id.
 */

if (bug) {
  var get = function get(obj){
    return obj.toLocaleString || set(obj);
  };

  var set = function set(obj){
    return obj.toLocaleString = get.id++;
  };
} else {
  var get = function get(obj){
    return obj.__id__ || set(obj);
  };

  var set = function set(obj){
    return Object.defineProperty(obj, '__id__', { enumerable: false, value: get.id++ }) && obj.__id__;
  };
}

/**
 * Incremented `id`.
 */

get.id = 1;

/**
 * Get id from object.
 */

if ('undefined' === typeof module) {
  this.objectId = get;
} else {
  module.exports = get;
}

})();
},{}],8:[function(require,module,exports){
/**
* Extend poppy with popup behaviour
*/

var Poppy = require('poppy');
var Mod = window.Mod || require('mod-constructor');
var extend = require('extend');
var place = require('placer');


module.exports = Popup;



/**
* Popup constructor
*/
function Popup(){
	return this.constructor.apply(this, arguments);
}

//take over poppy properties
extend(Popup.prototype, Poppy.fn);

var proto = Popup.prototype;

proto.selector = '[data-popup]';


/**
* Lifecycle
*/
proto.init = function(){
	console.log('init popup')
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
	false: {

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
	false: {

	},
	true: {

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
	false : {

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
Mod(Popup);
},{"extend":1,"mod-constructor":3,"placer":undefined,"poppy":undefined}]},{},[8]);
