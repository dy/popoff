/**
 * Modules declarations
 */
var _m_mucss, _m_soft_extend, _m_each_csv, _m_mustring, _m_mutype, _m_mumath, _m_matches_selector, _m_tiny_element, _m_icicle, _m_mutypes, _m_extend, _m_emmy, _m_aligner, _m_query_relative, _m_split_keys, _m_muparse, _m_placer, _m_enot, _m_st8, _m_36, _m_35, _m_poppy;



/**
 * @module _m_mucss
 * @file c:\Users\dmitry\Dropbox\Projects\poppy\node_modules\mucss\index.js 
 */

_m_mucss = css;
var _m_mucss_win = window, _m_mucss_doc = document, _m_mucss_root = _m_mucss_doc.documentElement, body = _m_mucss_doc.body;
var fakeStyle = _m_mucss_doc.createElement('div').style;
var prefix = css.prefix = function () {
    var regex = /^(webkit|moz|ms|O|khtml)[A-Z]/, prop;
    for (prop in fakeStyle) {
        if (regex.test(prop)) {
            return prop.match(regex)[1];
        }
    }
    return '';
}();
function pd(e) {
    e.preventDefault();
}
css.disableSelection = function ($el) {
    css($el, {
        'user-select': 'none',
        'user-drag': 'none',
        'touch-callout': 'none'
    });
    $el.setAttribute('unselectable', 'on');
    $el.addEventListener('selectstart', pd);
};
css.enableSelection = function ($el) {
    css($el, {
        'user-select': null,
        'user-drag': null,
        'touch-callout': null
    });
    $el.removeAttribute('unselectable');
    $el.removeEventListener('selectstart', pd);
};
css.paddings = function ($el) {
    if ($el === _m_mucss_win)
        return new Rect();
    if (!($el instanceof Element))
        throw Error('Argument is not an element');
    var style = _m_mucss_win.getComputedStyle($el);
    return new Rect(parseCSSValue(style.paddingLeft), parseCSSValue(style.paddingTop), parseCSSValue(style.paddingRight), parseCSSValue(style.paddingBottom));
};
css.margins = function ($el) {
    if ($el === _m_mucss_win)
        return new Rect();
    if (!($el instanceof Element))
        throw Error('Argument is not an element');
    var style = _m_mucss_win.getComputedStyle($el);
    return new Rect(parseCSSValue(style.marginLeft), parseCSSValue(style.marginTop), parseCSSValue(style.marginRight), parseCSSValue(style.marginBottom));
};
css.borders = function ($el) {
    if ($el === _m_mucss_win)
        return new Rect();
    if (!($el instanceof Element))
        throw Error('Argument is not an element');
    var style = _m_mucss_win.getComputedStyle($el);
    return new Rect(parseCSSValue(style.borderLeftWidth), parseCSSValue(style.borderTopWidth), parseCSSValue(style.borderRightWidth), parseCSSValue(style.borderBottomWidth));
};
function parseCSSValue(str) {
    str += '';
    return parseFloat(str.slice(0, -2)) || 0;
}
css.parseValue = parseCSSValue;
css.offsets = function (el) {
    if (!el)
        throw Error('Bad argument');
    var cRect, result;
    if (el === _m_mucss_win) {
        result = new Rect(_m_mucss_win.pageXOffset, _m_mucss_win.pageYOffset);
        result.width = _m_mucss_win.innerWidth - (css.hasScrollY() ? css.scrollbar : 0), result.height = _m_mucss_win.innerHeight - (css.hasScrollX() ? css.scrollbar : 0);
        result.right = result.left + result.width;
        result.bottom = result.top + result.height;
        return result;
    }
    try {
        cRect = el.getBoundingClientRect();
    } catch (e) {
        cRect = new Rect(el.clientLeft, el.clientTop);
    }
    var isFixed = css.isFixed(el);
    var xOffset = isFixed ? 0 : _m_mucss_win.pageXOffset;
    var yOffset = isFixed ? 0 : _m_mucss_win.pageYOffset;
    result = new Rect(cRect.left + xOffset, cRect.top + yOffset, cRect.left + xOffset + el.offsetWidth, cRect.top + yOffset + el.offsetHeight, el.offsetWidth, el.offsetHeight);
    return result;
};
css.isFixed = function (el) {
    var parentEl = el;
    if (el === _m_mucss_win)
        return true;
    if (el === _m_mucss_doc)
        return false;
    while (parentEl) {
        if (_m_mucss_win.getComputedStyle(parentEl).position === 'fixed')
            return true;
        parentEl = parentEl.offsetParent;
    }
    return false;
};
function css(el, obj) {
    if (!el || !obj)
        return;
    var name, value;
    if (typeof obj === 'string') {
        name = obj;
        if (arguments.length < 3) {
            return el.style[prefixize(name)];
        }
        value = arguments[2] || '';
        obj = {};
        obj[name] = value;
    }
    for (name in obj) {
        if (typeof obj[name] === 'number' && /left|right|bottom|top|width|height/i.test(name))
            obj[name] += 'px';
        value = obj[name] || '';
        el.style[prefixize(name)] = value;
    }
}
function prefixize(name) {
    var uName = name[0].toUpperCase() + name.slice(1);
    if (fakeStyle[name] !== undefined)
        return name;
    if (fakeStyle[prefix + uName] !== undefined)
        return prefix + uName;
    return '';
}
var scrollDiv = _m_mucss_doc.createElement('div');
css(scrollDiv, {
    width: 100,
    height: 100,
    overflow: 'scroll',
    position: 'absolute',
    top: -9999
});
_m_mucss_root.appendChild(scrollDiv);
css.scrollbar = scrollDiv.offsetWidth - scrollDiv.clientWidth;
_m_mucss_root.removeChild(scrollDiv);
css.hasScrollX = function () {
    return _m_mucss_win.innerHeight > _m_mucss_root.clientHeight;
};
css.hasScrollY = function () {
    return _m_mucss_win.innerWidth > _m_mucss_root.clientWidth;
};
function Rect(l, t, r, b, w, h) {
    this.top = t || 0;
    this.bottom = b || 0;
    this.left = l || 0;
    this.right = r || 0;
    if (w !== undefined)
        this.width = w || this.right - this.left;
    if (h !== undefined)
        this.height = h || this.bottom - this.top;
}
css.Rect = Rect;



/**
 * @module _m_soft_extend
 * @file c:\Users\dmitry\Dropbox\Projects\poppy\node_modules\placer\node_modules\soft-extend\index.js 
 */

_m_soft_extend = function () {
    var args = [].slice.call(arguments);
    var res = args[0];
    var l = args.length;
    if (typeof res !== 'object')
        throw Error('Bad argument');
    for (var i = 1, l = args.length, obj; i < l; i++) {
        obj = args[i];
        if (typeof obj === 'object') {
            for (var prop in obj) {
                if (res[prop] === undefined)
                    res[prop] = obj[prop];
            }
        }
    }
    return res;
};



/**
 * @module _m_each_csv
 * @file c:\Users\dmitry\Dropbox\Projects\poppy\node_modules\enot\node_modules\each-csv\index.js 
 */

_m_each_csv = _m_each_csv_eachCSV;
var commaMatchRe = /(,[^,]*?(?:\([^()]+\)[^,]*)?)(?=,|$)/g;
function _m_each_csv_eachCSV(str, fn) {
    if (!str)
        return;
    str += '';
    var list = (',' + str).match(commaMatchRe) || [''];
    for (var i = 0; i < list.length; i++) {
        var matchStr = list[i].trim();
        if (matchStr[0] === ',')
            matchStr = matchStr.slice(1);
        matchStr = matchStr.trim();
        fn(matchStr, i);
    }
}
;



/**
 * @module _m_mustring
 * @file c:\Users\dmitry\Dropbox\Projects\poppy\node_modules\enot\node_modules\mustring\index.js 
 */

_m_mustring = {
    camel: camel,
    dashed: dashed,
    upper: _m_mustring_upper,
    lower: lower,
    capfirst: capfirst,
    unprefixize: _m_mustring_unprefixize
};
function camel(str) {
    return str && str.replace(/-[a-z]/g, function (match, position) {
        return _m_mustring_upper(match[1]);
    });
}
function dashed(str) {
    return str && str.replace(/[A-Z]/g, function (match, position) {
        return (position ? '-' : '') + lower(match);
    });
}
function _m_mustring_upper(str) {
    return str.toUpperCase();
}
function lower(str) {
    return str.toLowerCase();
}
function capfirst(str) {
    str += '';
    if (!str)
        return str;
    return _m_mustring_upper(str[0]) + str.slice(1);
}
function _m_mustring_unprefixize(str, pf) {
    return str.slice(0, pf.length) === pf ? lower(str.slice(pf.length)) : str;
}



/**
 * @module _m_mutype
 * @file c:\Users\dmitry\Dropbox\Projects\poppy\node_modules\enot\node_modules\mutype\index.js 
 */

_m_mutype = {
    has: _m_mutype_has,
    isObject: isObject,
    isFn: isFn,
    isString: _m_mutype_isString,
    isNumber: isNumber,
    isBoolean: isBool,
    isPlain: isPlain,
    isArray: isArray,
    isArrayLike: _m_mutype_isArrayLike,
    isElement: _m_mutype_isElement,
    isPrivateName: isPrivateName,
    isRegExp: isRegExp,
    isEmpty: isEmpty
};
var _m_mutype_win = typeof window === 'undefined' ? this : window;
var _m_mutype_doc = typeof document === 'undefined' ? null : document;
function _m_mutype_has(a, b) {
    if (!a)
        return false;
    if (a[b])
        return true;
    return b in a;
}
function isObject(a) {
    var Ctor, result;
    if (isPlain(a) || isArray(a) || _m_mutype_isElement(a) || isFn(a))
        return false;
    if (!_m_mutype_has(a, 'constructor') && (Ctor = a.constructor, isFn(Ctor) && !(Ctor instanceof Ctor)) || !(typeof a === 'object')) {
        return false;
    }
    for (var key in a) {
        result = key;
    }
    ;
    return typeof result == 'undefined' || _m_mutype_has(a, result);
}
function isEmpty(a) {
    if (!a)
        return true;
    for (var k in a) {
        return false;
    }
    return true;
}
function isFn(a) {
    return !!(a && a.apply);
}
function _m_mutype_isString(a) {
    return typeof a === 'string' || a instanceof String;
}
function isNumber(a) {
    return typeof a === 'number' || a instanceof Number;
}
function isBool(a) {
    return typeof a === 'boolean' || a instanceof Boolean;
}
function isPlain(a) {
    return !a || _m_mutype_isString(a) || isNumber(a) || isBool(a);
}
function isArray(a) {
    return a instanceof Array;
}
function _m_mutype_isArrayLike(a) {
    return isArray(a) || a && !_m_mutype_isString(a) && !a.nodeType && a != _m_mutype_win && !isFn(a) && typeof a.length === 'number';
}
function _m_mutype_isElement(target) {
    return _m_mutype_doc && target instanceof HTMLElement;
}
function isPrivateName(n) {
    return n[0] === '_' && n.length > 1;
}
function isRegExp(target) {
    return target instanceof RegExp;
}



/**
 * @module _m_mumath
 * @file c:\Users\dmitry\Dropbox\Projects\poppy\node_modules\placer\node_modules\mumath\index.js 
 */

_m_mumath = {
    between: wrap(between),
    isBetween: wrap(isBetween),
    toPrecision: wrap(toPrecision),
    getPrecision: getPrecision,
    min: wrap(Math.min),
    max: wrap(Math.max),
    add: wrap(function (a, b) {
        return a + b;
    }),
    sub: wrap(function (a, b) {
        return a - b;
    }),
    div: wrap(function (a, b) {
        return a / b;
    }),
    mul: wrap(function (a, b) {
        return a * b;
    }),
    mod: wrap(function (a, b) {
        return a % b;
    }),
    floor: wrap(function (a) {
        return Math.floor(a);
    }),
    ceil: wrap(function (a) {
        return Math.ceil(a);
    }),
    round: wrap(function (a) {
        return Math.round(a);
    })
};
function wrap(fn) {
    return function (a) {
        var args = arguments;
        if (a instanceof Array) {
            var result = new Array(a.length), slice;
            for (var i = 0; i < a.length; i++) {
                slice = [];
                for (var j = 0, l = args.length, val; j < l; j++) {
                    val = args[j] instanceof Array ? args[j][i] : args[j];
                    val = val || 0;
                    slice.push(val);
                }
                result[i] = fn.apply(this, slice);
            }
            return result;
        } else if (typeof a === 'object') {
            var result = {}, slice;
            for (var i in a) {
                slice = [];
                for (var j = 0, l = args.length, val; j < l; j++) {
                    val = typeof args[j] === 'object' ? args[j][i] : args[j];
                    val = val || 0;
                    slice.push(val);
                }
                result[i] = fn.apply(this, slice);
            }
            return result;
        } else {
            return fn.apply(this, args);
        }
    };
}
function between(a, min, max) {
    return max > min ? Math.max(Math.min(a, max), min) : Math.max(Math.min(a, min), max);
}
function isBetween(a, left, right) {
    if (a <= right && a >= left)
        return true;
    return false;
}
function toPrecision(value, step) {
    step = parseFloat(step);
    if (step === 0)
        return value;
    value = Math.round(value / step) * step;
    return parseFloat(value.toFixed(getPrecision(step)));
}
function getPrecision(n) {
    var s = n + '', d = s.indexOf('.') + 1;
    return !d ? 0 : s.length - d;
}



/**
 * @module _m_matches_selector
 * @file c:\Users\dmitry\Dropbox\Projects\poppy\node_modules\enot\node_modules\query-relative\node_modules\matches-selector\index.js 
 */

'use strict';
var proto = Element.prototype;
var vendor = proto.matches || proto.matchesSelector || proto.webkitMatchesSelector || proto.mozMatchesSelector || proto.msMatchesSelector || proto.oMatchesSelector;
_m_matches_selector = match;
function match(el, selector) {
    if (vendor)
        return vendor.call(el, selector);
    var nodes = el.parentNode.querySelectorAll(selector);
    for (var i = 0; i < nodes.length; i++) {
        if (nodes[i] == el)
            return true;
    }
    return false;
}



/**
 * @module _m_tiny_element
 * @file c:\Users\dmitry\Dropbox\Projects\poppy\node_modules\enot\node_modules\query-relative\node_modules\tiny-element\index.js 
 */

var slice = [].slice;
_m_tiny_element = function (selector, multiple) {
    var ctx = this === window ? document : this;
    return typeof selector == 'string' ? multiple ? slice.call(ctx.querySelectorAll(selector), 0) : ctx.querySelector(selector) : selector instanceof Node || selector === window || !selector.length ? multiple ? [selector] : selector : slice.call(selector, 0);
};



/**
 * @module _m_icicle
 * @file c:\Users\dmitry\Dropbox\Projects\poppy\node_modules\emmy\node_modules\icicle\index.js 
 */

_m_icicle = {
    freeze: lock,
    unfreeze: unlock,
    isFrozen: isLocked
};
var lockCache = new WeakMap();
function lock(target, name) {
    var locks = lockCache.get(target);
    if (locks && locks[name])
        return false;
    if (!locks) {
        locks = {};
        lockCache.set(target, locks);
    }
    locks[name] = true;
    return true;
}
function unlock(target, name) {
    var locks = lockCache.get(target);
    if (!locks || !locks[name])
        return false;
    locks[name] = null;
    return true;
}
function isLocked(target, name) {
    var locks = lockCache.get(target);
    return locks && locks[name];
}



/**
 * @module _m_mutypes
 * @file c:\Users\dmitry\Dropbox\Projects\poppy\node_modules\muparse\node_modules\mutypes\index.js 
 */

_m_mutypes = {
    has: _m_mutypes_has,
    isObject: _m_mutypes_isObject,
    isFn: _m_mutypes_isFn,
    isString: _m_mutypes_isString,
    isNumber: _m_mutypes_isNumber,
    isBoolean: _m_mutypes_isBool,
    isPlain: _m_mutypes_isPlain,
    isArray: _m_mutypes_isArray,
    isArrayLike: _m_mutypes_isArrayLike,
    isElement: _m_mutypes_isElement,
    isPrivateName: _m_mutypes_isPrivateName,
    isRegExp: _m_mutypes_isRegExp
};
var _m_mutypes_win = typeof window === 'undefined' ? this : window;
var _m_mutypes_doc = typeof document === 'undefined' ? null : document;
function _m_mutypes_has(a, b) {
    if (!a)
        return false;
    if (a[b])
        return true;
    return b in a;
}
function _m_mutypes_isObject(a) {
    var Ctor, result;
    if (_m_mutypes_isPlain(a) || _m_mutypes_isArray(a) || _m_mutypes_isElement(a) || _m_mutypes_isFn(a))
        return false;
    if (!_m_mutypes_has(a, 'constructor') && (Ctor = a.constructor, _m_mutypes_isFn(Ctor) && !(Ctor instanceof Ctor)) || !(typeof a === 'object')) {
        return false;
    }
    for (var key in a) {
        result = key;
    }
    ;
    return typeof result == 'undefined' || _m_mutypes_has(a, result);
}
function _m_mutypes_isFn(a) {
    return !!(a && a.apply);
}
function _m_mutypes_isString(a) {
    return typeof a === 'string' || a instanceof String;
}
function _m_mutypes_isNumber(a) {
    return typeof a === 'number' || a instanceof Number;
}
function _m_mutypes_isBool(a) {
    return typeof a === 'boolean' || a instanceof Boolean;
}
function _m_mutypes_isPlain(a) {
    return !a || _m_mutypes_isString(a) || _m_mutypes_isNumber(a) || _m_mutypes_isBool(a);
}
function _m_mutypes_isArray(a) {
    return a instanceof Array;
}
function _m_mutypes_isArrayLike(a) {
    return _m_mutypes_isArray(a) || a && !_m_mutypes_isString(a) && !a.nodeType && a != _m_mutypes_win && !_m_mutypes_isFn(a) && typeof a.length === 'number';
}
function _m_mutypes_isElement(target) {
    return _m_mutypes_doc && target instanceof HTMLElement;
}
function _m_mutypes_isPrivateName(n) {
    return n[0] === '_' && n.length > 1;
}
function _m_mutypes_isRegExp(target) {
    return target instanceof RegExp;
}



/**
 * @module _m_extend
 * @file c:\Users\dmitry\Dropbox\Projects\poppy\node_modules\extend\index.js 
 */

var hasOwn = Object.prototype.hasOwnProperty;
var _m_extend_toString = Object.prototype.toString;
var undefined;
var isPlainObject = function isPlainObject(obj) {
    'use strict';
    if (!obj || _m_extend_toString.call(obj) !== '[object Object]') {
        return false;
    }
    var has_own_constructor = hasOwn.call(obj, 'constructor');
    var has_is_property_of_method = obj.constructor && obj.constructor.prototype && hasOwn.call(obj.constructor.prototype, 'isPrototypeOf');
    if (obj.constructor && !has_own_constructor && !has_is_property_of_method) {
        return false;
    }
    var key;
    for (key in obj) {
    }
    return key === undefined || hasOwn.call(obj, key);
};
_m_extend = function extend() {
    'use strict';
    var options, name, src, copy, copyIsArray, clone, target = arguments[0], i = 1, length = arguments.length, deep = false;
    if (typeof target === 'boolean') {
        deep = target;
        target = arguments[1] || {};
        i = 2;
    } else if (typeof target !== 'object' && typeof target !== 'function' || target == null) {
        target = {};
    }
    for (; i < length; ++i) {
        options = arguments[i];
        if (options != null) {
            for (name in options) {
                src = target[name];
                copy = options[name];
                if (target === copy) {
                    continue;
                }
                if (deep && copy && (isPlainObject(copy) || (copyIsArray = Array.isArray(copy)))) {
                    if (copyIsArray) {
                        copyIsArray = false;
                        clone = src && Array.isArray(src) ? src : [];
                    } else {
                        clone = src && isPlainObject(src) ? src : {};
                    }
                    target[name] = extend(deep, clone, copy);
                } else if (copy !== undefined) {
                    target[name] = copy;
                }
            }
        }
    }
    return target;
};



/**
 * @module _m_emmy
 * @file c:\Users\dmitry\Dropbox\Projects\poppy\node_modules\emmy\index.js 
 */

var icicle = _m_icicle;
var $ = typeof jQuery === 'undefined' ? undefined : jQuery;
var doc = typeof document === 'undefined' ? undefined : document;
var win = typeof window === 'undefined' ? undefined : window;
var onNames = [
    'on',
    'bind',
    'addEventListener',
    'addListener'
];
var oneNames = [
    'one',
    'once',
    'addOnceEventListener',
    'addOnceListener'
];
var offNames = [
    'off',
    'unbind',
    'removeEventListener',
    'removeListener'
];
var emitNames = [
    'emit',
    'trigger',
    'fire',
    'dispatchEvent'
];
var emitFlag = emitNames[0], onFlag = onNames[0], oneFlag = onNames[0], offFlag = offNames[0];
function Emmy(target) {
    if (!target)
        return;
    if (!getMethodOneOf(target, onNames))
        target.on = EmmyPrototype.on.bind(target);
    if (!getMethodOneOf(target, offNames))
        target.off = EmmyPrototype.off.bind(target);
    if (!getMethodOneOf(target, oneNames))
        target.one = target.once = EmmyPrototype.one.bind(target);
    if (!getMethodOneOf(target, emitNames))
        target.emit = EmmyPrototype.emit.bind(target);
    return target;
}
var EmmyPrototype = Emmy.prototype;
function getMethodOneOf(target, list) {
    var result;
    for (var i = 0, l = list.length; i < l; i++) {
        result = target[list[i]];
        if (result)
            return result;
    }
}
var targetCbCache = new WeakMap();
EmmyPrototype.on = EmmyPrototype.addEventListener = function (evt, fn) {
    var target = this;
    if (fn instanceof Array) {
        for (var i = fn.length; i--;) {
            EmmyPrototype.on.call(target, evt, fn[i]);
        }
        return target;
    }
    var onMethod = getMethodOneOf(target, onNames);
    if (onMethod && onMethod !== EmmyPrototype.on) {
        if (icicle.freeze(target, onFlag + evt)) {
            onMethod.call(target, evt, fn);
            icicle.unfreeze(target, onFlag + evt);
        } else {
            return target;
        }
    }
    saveCallback(target, evt, fn);
    return target;
};
function saveCallback(target, evt, fn) {
    if (!targetCbCache.has(target))
        targetCbCache.set(target, {});
    var targetCallbacks = targetCbCache.get(target);
    (targetCallbacks[evt] = targetCallbacks[evt] || []).push(fn);
}
EmmyPrototype.once = EmmyPrototype.one = function (evt, fn) {
    var target = this;
    if (fn instanceof Array) {
        for (var i = fn.length; i--;) {
            EmmyPrototype.one.call(target, evt, fn[i]);
        }
        return target;
    }
    var oneMethod = getMethodOneOf(target, oneNames);
    if (oneMethod && oneMethod !== EmmyPrototype.one) {
        if (icicle.freeze(target, oneFlag + evt)) {
            oneMethod.call(target, evt, fn);
            saveCallback(target, evt, fn);
            icicle.unfreeze(target, oneFlag + evt);
        } else {
            return target;
        }
    }
    function cb() {
        EmmyPrototype.off.call(target, evt, cb);
        fn.apply(target, arguments);
    }
    cb.fn = fn;
    EmmyPrototype.on.call(target, evt, cb);
    return target;
};
EmmyPrototype.off = EmmyPrototype.removeListener = EmmyPrototype.removeAllListeners = EmmyPrototype.removeEventListener = function (evt, fn) {
    var target = this;
    if (fn instanceof Array) {
        for (var i = fn.length; i--;) {
            EmmyPrototype.off.call(target, evt, fn[i]);
        }
        return target;
    }
    if (fn === undefined) {
        var callbacks = targetCbCache.get(target);
        if (!callbacks)
            return target;
        if (evt === undefined) {
            for (var evtName in callbacks) {
                EmmyPrototype.off.call(target, evtName, callbacks[evtName]);
            }
        } else if (callbacks[evt]) {
            EmmyPrototype.off.call(target, evt, callbacks[evt]);
        }
        return target;
    }
    var offMethod = getMethodOneOf(target, offNames);
    if (offMethod && offMethod !== EmmyPrototype.off) {
        if (icicle.freeze(target, offFlag + evt)) {
            offMethod.call(target, evt, fn);
            icicle.unfreeze(target, offFlag + evt);
        } else {
            return target;
        }
    }
    if (!targetCbCache.has(target))
        return target;
    var evtCallbacks = targetCbCache.get(target)[evt];
    if (!evtCallbacks)
        return target;
    for (var i = 0; i < evtCallbacks.length; i++) {
        if (evtCallbacks[i] === fn || evtCallbacks[i].fn === fn) {
            evtCallbacks.splice(i, 1);
            break;
        }
    }
    return target;
};
EmmyPrototype.emit = EmmyPrototype.dispatchEvent = function (eventName, data, bubbles) {
    var target = this, emitMethod, evt = eventName;
    if (!target)
        return;
    if (target.nodeType || target === doc || target === win) {
        if (eventName instanceof Event) {
            evt = eventName;
        } else {
            evt = document.createEvent('CustomEvent');
            evt.initCustomEvent(eventName, bubbles, true, data);
        }
        emitMethod = target.dispatchEvent;
    } else if ($ && target instanceof $) {
        var evt = $.Event(eventName, data);
        evt.detail = data;
        emitMethod = bubbles ? targte.trigger : target.triggerHandler;
    } else {
        emitMethod = getMethodOneOf(target, emitNames);
    }
    if (emitMethod && emitMethod !== EmmyPrototype.emit) {
        if (icicle.freeze(target, emitFlag + eventName)) {
            emitMethod.call(target, evt, data, bubbles);
            icicle.unfreeze(target, emitFlag + eventName);
            return target;
        }
    }
    if (!targetCbCache.has(target))
        return target;
    var evtCallbacks = targetCbCache.get(target)[evt];
    if (!evtCallbacks)
        return target;
    var fireList = evtCallbacks.slice();
    for (var i = 0; i < fireList.length; i++) {
        fireList[i] && fireList[i].call(target, {
            detail: data,
            type: eventName
        });
    }
    return target;
};
EmmyPrototype.listeners = function (evt) {
    var callbacks = targetCbCache.get(this);
    return callbacks && callbacks[evt] || [];
};
EmmyPrototype.hasListeners = function (evt) {
    return !!EmmyPrototype.listeners.call(this, evt).length;
};
Emmy.bindStaticAPI = function () {
    var self = this, proto = self.prototype;
    for (var name in proto) {
        if (proto[name])
            self[name] = createStaticBind(name);
    }
    function createStaticBind(methodName) {
        return function (a, b, c, d) {
            var res = proto[methodName].call(a, b, c, d);
            return res === a ? self : res;
        };
    }
};
Emmy.bindStaticAPI();
_m_emmy = Emmy;



/**
 * @module _m_aligner
 * @file c:\Users\dmitry\Dropbox\Projects\poppy\node_modules\placer\node_modules\aligner\index.js 
 */

var _m_aligner_css = _m_mucss;
var _m_aligner_m = _m_mumath;
_m_aligner = _m_aligner_align;
_m_aligner.numerify = numerify;
var _m_aligner_doc = document, _m_aligner_win = window, _m_aligner_root = _m_aligner_doc.documentElement;
function _m_aligner_align(els, alignment, relativeTo) {
    if (!els || els.length < 2)
        throw Error('At least one element should be passed');
    if (!alignment)
        alignment = 0;
    if (!relativeTo)
        relativeTo = els[0];
    var xAlign, yAlign;
    if (alignment instanceof Array) {
        xAlign = numerify(alignment[0]);
        yAlign = numerify(alignment[1]);
    } else if (/top|middle|bottom/.test(alignment)) {
        yAlign = numerify(alignment);
    } else {
        xAlign = numerify(alignment);
    }
    var toRect = _m_aligner_css.offsets(relativeTo);
    for (var i = els.length, el, s; i--;) {
        el = els[i];
        if (el === relativeTo)
            continue;
        s = getComputedStyle(el);
        if (s.position === 'static')
            _m_aligner_css(el, 'position', 'relative');
        var placeeMargins = _m_aligner_css.margins(el);
        var parent = el.offsetParent || _m_aligner_win;
        var parentRect = _m_aligner_css.offsets(parent);
        var parentPaddings = _m_aligner_css.paddings(parent);
        var parentBorders = _m_aligner_css.borders(parent);
        if (parent === _m_aligner_doc.body || parent === _m_aligner_root && getComputedStyle(parent).position === 'static') {
            parentRect.left = 0;
            parentRect.top = 0;
        }
        parentRect = _m_aligner_m.sub(parentRect, parentBorders);
        parentRect = _m_aligner_m.add(parentRect, placeeMargins);
        parentRect = _m_aligner_m.add(parentRect, parentPaddings);
        alignX(els[i], toRect, parentRect, xAlign);
        alignY(els[i], toRect, parentRect, yAlign);
    }
}
function alignX(placee, placerRect, parentRect, align) {
    if (typeof align !== 'number')
        return;
    var desirableLeft = placerRect.left + placerRect.width * align - placee.offsetWidth * align - parentRect.left;
    _m_aligner_css(placee, {
        left: desirableLeft,
        right: 'auto'
    });
}
function alignY(placee, placerRect, parentRect, align) {
    if (typeof align !== 'number')
        return;
    var desirableTop = placerRect.top + placerRect.height * align - placee.offsetHeight * align - parentRect.top;
    _m_aligner_css(placee, {
        top: desirableTop,
        bottom: 'auto'
    });
}
function numerify(value) {
    if (typeof value === 'string') {
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



/**
 * @module _m_query_relative
 * @file c:\Users\dmitry\Dropbox\Projects\poppy\node_modules\enot\node_modules\query-relative\index.js 
 */

var _m_query_relative_doc = document, root = _m_query_relative_doc.documentElement;
var _q = _m_tiny_element;
var _m_query_relative_matches = _m_matches_selector;
_m_query_relative = function (targets, str, multiple) {
    if (typeof targets === 'string') {
        multiple = str;
        str = targets;
        targets = _m_query_relative_doc;
    }
    var res = _m_query_relative_q(targets, str);
    return !multiple && isList(res) ? res[0] : unique(res);
};
function _m_query_relative_q(targets, str) {
    if (!targets)
        targets = this;
    if (!str) {
        return targets;
    }
    if (targets === window)
        targets === _m_query_relative_doc;
    else if (!(targets instanceof Node) && !isList(targets)) {
        return targets;
    }
    var m, result;
    if (m = /:(parent|closest|next|prev|root)(?:\(([^\)]*)\))?/.exec(str)) {
        var pseudo = m[1], idx = m.index, param = m[2], token = m[0];
        if (idx) {
            targets = queryList(targets, str.slice(0, idx), true);
        }
        result = transformSet(targets, pseudos[pseudo], param);
        if (!result) {
            return null;
        }
        if (isList(result) && !result.length)
            return result;
        var strRest = str.slice(idx + token.length).trim();
        if (strRest[0] === '>') {
            if (scopeAvail) {
                strRest = ':scope ' + strRest;
            } else {
                var id = genId();
                transformSet(result, function (el, id) {
                    el.setAttribute('data-__qr', id);
                }, id);
                strRest = '[data-__qr' + id + ']' + strRest;
            }
        }
        result = _m_query_relative_q(result, strRest);
    } else {
        result = queryList(targets, str);
    }
    return result;
}
function queryList(targets, query) {
    if (isList(targets)) {
        return transformSet(targets, function (item, query) {
            return _q.call(item, query, true);
        }, query);
    } else
        return _q.call(targets, query, true);
}
function transformSet(list, fn, arg) {
    var res = [];
    if (!isList(list))
        list = [list];
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
var scopeAvail = true;
try {
    _m_query_relative_doc.querySelector(':scope');
} catch (e) {
    scopeAvail = false;
}
var counter = Date.now() % 1000000000;
function genId(e, q) {
    return (Math.random() * 1000000000 >>> 0) + counter++;
}
var pseudos = {
    parent: function (e, q) {
        if (e === _m_query_relative_doc)
            return root;
        var res = e.parentNode;
        return res === _m_query_relative_doc ? e : res;
    },
    closest: function (e, q) {
        if (e === _m_query_relative_doc)
            return root;
        if (!q || (q instanceof Node ? e == q : _m_query_relative_matches(e, q)))
            return e;
        while ((e = e.parentNode) !== _m_query_relative_doc) {
            if (!q || (q instanceof Node ? e == q : _m_query_relative_matches(e, q)))
                return e;
        }
    },
    prev: function (e, q) {
        while (e = e.previousSibling) {
            if (e.nodeType !== 1)
                continue;
            if (!q || (q instanceof Node ? e == q : _m_query_relative_matches(e, q)))
                return e;
        }
    },
    next: function (e, q) {
        while (e = e.nextSibling) {
            if (e.nodeType !== 1)
                continue;
            if (!q || (q instanceof Node ? e == q : _m_query_relative_matches(e, q)))
                return e;
        }
    },
    root: function () {
        return root;
    }
};
function isList(a) {
    return a instanceof Array || a instanceof NodeList;
}
function unique(arr) {
    if (!(arr instanceof Array))
        return arr;
    var n = [];
    for (var i = 0; i < arr.length; i++) {
        if (n.indexOf(arr[i]) == -1)
            n.push(arr[i]);
    }
    return n;
}
_m_query_relative.closest = pseudos.closest;
_m_query_relative.parent = pseudos.parent;
_m_query_relative.next = pseudos.next;
_m_query_relative.prev = pseudos.prev;



/**
 * @module _m_split_keys
 * @file c:\Users\dmitry\Dropbox\Projects\poppy\node_modules\st8\node_modules\split-keys\index.js 
 */

var _m_split_keys_type = _m_mutype;
var _m_split_keys_extend = _m_extend;
_m_split_keys = splitKeys;
function splitKeys(obj, deep, separator) {
    if ((deep || separator) && (_m_split_keys_type.isBoolean(separator) || _m_split_keys_type.isString(deep) || _m_split_keys_type.isRegExp(deep))) {
        var tmp = deep;
        deep = separator;
        separator = tmp;
    }
    separator = separator === undefined ? splitKeys.separator : separator;
    var list, value;
    for (var keys in obj) {
        value = obj[keys];
        if (deep && _m_split_keys_type.isObject(value))
            splitKeys(value, deep, separator);
        list = keys.split(separator);
        if (list.length > 1) {
            delete obj[keys];
            list.forEach(setKey);
        }
    }
    function setKey(key) {
        if (value !== obj[key] && _m_split_keys_type.isObject(value) && _m_split_keys_type.isObject(obj[key])) {
            obj[key] = _m_split_keys_extend({}, obj[key], value);
        } else {
            obj[key] = value;
        }
    }
    return obj;
}
splitKeys.separator = /\s?,\s?/;



/**
 * @module _m_muparse
 * @file c:\Users\dmitry\Dropbox\Projects\poppy\node_modules\muparse\index.js 
 */

var _m_muparse_type = _m_mutypes;
var _m_muparse_str = _m_mustring;
var _m_muparse_eachCSV = _m_each_csv;
var _m_muparse_has = _m_muparse_type.has;
var _m_muparse_isArray = _m_muparse_type.isArray;
var _m_muparse_isString = _m_muparse_type.isString;
var _m_muparse_isFn = _m_muparse_type.isFn;
var _m_muparse_isElement = _m_muparse_type.isElement;
var _m_muparse_isNumber = _m_muparse_type.isNumber;
var _m_muparse_isObject = _m_muparse_type.isObject;
var _m_muparse_isBool = _m_muparse_type.isBool;
var _m_muparse_dashed = _m_muparse_str.dashed;
_m_muparse = {
    value: parseValue,
    attribute: parseAttr,
    typed: parseTyped,
    object: parseObject,
    list: parseList,
    stringify: stringify
};
function parseAttr(target, name, example) {
    var result;
    if (!_m_muparse_has(target, name)) {
        if (_m_muparse_has(target, 'attributes')) {
            var dashedPropName = _m_muparse_str.dashed(name);
            var attrs = target.attributes, attr = attrs[name] || attrs['data-' + name] || attrs[dashedPropName] || attrs['data-' + dashedPropName];
            if (attr) {
                var attrVal = attr.value;
                target[name] = parseTyped(attrVal, example);
            }
        }
    }
    return result;
}
function parseValue(str) {
    var v;
    if (/true/i.test(str)) {
        return true;
    } else if (/false/i.test(str)) {
        return false;
    } else if (!/[^\d\.\-]/.test(str) && !isNaN(v = parseFloat(str))) {
        return v;
    } else if (/\{/.test(str)) {
        try {
            return JSON.parse(str);
        } catch (e) {
            return str;
        }
    }
    return str;
}
function parseTyped(value, type) {
    var res;
    if (_m_muparse_isArray(type)) {
        res = parseList(value);
    } else if (_m_muparse_isNumber(type)) {
        res = parseFloat(value);
    } else if (_m_muparse_isBool(type)) {
        res = !/^(false|off|0)$/.test(value);
    } else if (_m_muparse_isFn(type)) {
        res = value;
    } else if (_m_muparse_isString(type)) {
        res = value;
    } else if (_m_muparse_isObject(type)) {
        res = parseObject(value);
    } else {
        if (_m_muparse_isString(value) && !value.length)
            res = true;
        else
            res = parseValue(value);
    }
    return res;
}
function parseObject(str) {
    if (str[0] !== '{')
        str = '{' + str + '}';
    try {
        return JSON.parse(str);
    } catch (e) {
        return {};
    }
}
function parseList(str) {
    if (!_m_muparse_isString(str))
        return [parseValue(str)];
    str = str.trim();
    if (str[0] === '[')
        str = str.slice(1);
    if (str.length > 1 && str[str.length - 1] === ']')
        str = str.slice(0, -1);
    var result = [];
    _m_muparse_eachCSV(str, function (value) {
        result.push(parseValue(value));
    });
    return result;
}
function stringify(el) {
    if (!el) {
        return '' + el;
    }
    if (_m_muparse_isArray(el)) {
        return el.join(',');
    } else if (_m_muparse_isElement(el)) {
        return el.id;
    } else if (_m_muparse_isObject(el)) {
        return JSON.stringify(el);
    } else if (_m_muparse_isFn(el)) {
        var src = el.toString();
        el.slice(src.indexOf('{') + 1, src.lastIndexOf('}'));
    } else {
        return el.toString();
    }
}



/**
 * @module _m_placer
 * @file c:\Users\dmitry\Dropbox\Projects\poppy\node_modules\placer\index.js 
 */

_m_placer = place;
var _m_placer_type = _m_mutype;
var _m_placer_css = _m_mucss;
var _m_placer_q = _m_query_relative;
var softExtend = _m_soft_extend;
var m = _m_mumath;
var align = _m_aligner;
var _m_placer_win = window, _m_placer_doc = document, _m_placer_root = _m_placer_doc.documentElement;
var defaults = {
    relativeTo: _m_placer_win,
    side: 'center',
    align: 0,
    avoid: undefined,
    within: undefined,
    findBestSide: true
};
function place(element, options) {
    element = _m_placer_q(element);
    options = softExtend(options, defaults);
    options.relativeTo = options.relativeTo && _m_placer_q(element, options.relativeTo) || _m_placer_win;
    options.within = options.within && _m_placer_q(element, options.within);
    if (_m_placer_type.isElement(options.relativeTo) && _m_placer_css.isFixed(options.relativeTo)) {
        element.style.position = 'fixed';
    } else {
        element.style.position = 'absolute';
    }
    var side = options.findBestSide && options.within ? getBestSide(element, options) : options.side;
    placeBySide[side](element, options);
    return element;
}
var placeBySide = {
    center: function (placee, opts) {
        var placerRect = _m_placer_css.offsets(opts.relativeTo);
        var parentRect = getParentRect(placee.offsetParent);
        var al = opts.align;
        if (!(al instanceof Array)) {
            if (/,/.test(al)) {
                al = al.split(/\s*,\s*/);
                al = [
                    parseFloat(al[0]),
                    parseFloat(al[1])
                ];
            } else if (/top|bottom|middle/.test(al))
                al = [
                    0.5,
                    al
                ];
            else
                al = [
                    al,
                    0.5
                ];
        }
        align([
            opts.relativeTo,
            placee
        ], al);
        if (opts.within) {
            trimPositionY(placee, opts.within, parentRect);
            trimPositionX(placee, opts.within, parentRect);
        }
        opts.side = 'center';
    },
    left: function (placee, opts) {
        var parent = placee.offsetParent;
        var placerRect = _m_placer_css.offsets(opts.relativeTo);
        var parentRect = getParentRect(parent);
        contractRect(parentRect, _m_placer_css.borders(parent));
        _m_placer_css(placee, {
            right: parentRect.right - placerRect.left,
            left: 'auto'
        });
        align([
            opts.relativeTo,
            placee
        ], [
            null,
            opts.align
        ]);
        if (opts.within)
            trimPositionY(placee, opts.within, parentRect);
        opts.side = 'left';
    },
    right: function (placee, opts) {
        var placerRect = _m_placer_css.offsets(opts.relativeTo);
        var parentRect = getParentRect(placee.offsetParent);
        contractRect(parentRect, _m_placer_css.borders(placee.offsetParent));
        _m_placer_css(placee, {
            left: placerRect.right - parentRect.left,
            right: 'auto'
        });
        align([
            opts.relativeTo,
            placee
        ], [
            null,
            opts.align
        ]);
        if (opts.within)
            trimPositionY(placee, opts.within, parentRect);
        opts.side = 'right';
    },
    top: function (placee, opts) {
        var parent = placee.offsetParent;
        var placerRect = _m_placer_css.offsets(opts.relativeTo);
        var parentRect = getParentRect(placee.offsetParent);
        contractRect(parentRect, _m_placer_css.borders(parent));
        _m_placer_css(placee, {
            bottom: parentRect.bottom - placerRect.top,
            top: 'auto'
        });
        align([
            opts.relativeTo,
            placee
        ], [opts.align]);
        if (opts.within)
            trimPositionX(placee, opts.within, parentRect);
        opts.side = 'top';
    },
    bottom: function (placee, opts) {
        var placerRect = _m_placer_css.offsets(opts.relativeTo);
        var parentRect = getParentRect(placee.offsetParent);
        contractRect(parentRect, _m_placer_css.borders(placee.offsetParent));
        _m_placer_css(placee, {
            top: placerRect.bottom - parentRect.top,
            bottom: 'auto'
        });
        align([
            opts.relativeTo,
            placee
        ], [opts.align]);
        if (opts.within)
            trimPositionX(placee, opts.within, parentRect);
        opts.side = 'bottom';
    }
};
function getBestSide(placee, opts) {
    var initSide = opts.side;
    var withinRect = _m_placer_css.offsets(opts.within), placeeRect = _m_placer_css.offsets(placee), placerRect = _m_placer_css.offsets(opts.relativeTo);
    contractRect(withinRect, _m_placer_css.borders(opts.within));
    var placeeMargins = _m_placer_css.margins(placee);
    var hotRect = {
        top: placerRect.top - withinRect.top,
        bottom: withinRect.bottom - placerRect.bottom,
        left: placerRect.left - withinRect.left,
        right: withinRect.right - placerRect.right
    };
    var availSpace = {
        top: hotRect.top - placeeRect.height - placeeMargins.top - placeeMargins.bottom,
        bottom: hotRect.bottom - placeeRect.height - placeeMargins.top - placeeMargins.bottom,
        left: hotRect.left - placeeRect.width - placeeMargins.left - placeeMargins.right,
        right: hotRect.right - placeeRect.width - placeeMargins.left - placeeMargins.right
    };
    if (availSpace[initSide] >= 0)
        return initSide;
    if (availSpace.top < 0 && availSpace.bottom < 0 && availSpace.left < 0 && availSpace.right < 0)
        return 'center';
    var maxSide = initSide, maxSpace = availSpace[maxSide];
    for (var side in availSpace) {
        if (availSpace[side] > maxSpace) {
            maxSide = side;
            maxSpace = availSpace[maxSide];
        }
    }
    return maxSide;
}
function contractRect(rect, rect2) {
    rect.left += rect2.left;
    rect.right -= rect2.right;
    rect.bottom -= rect2.bottom;
    rect.top += rect2.top;
    return rect;
}
function trimPositionY(placee, within, parentRect) {
    var placeeRect = _m_placer_css.offsets(placee);
    var withinRect = _m_placer_css.offsets(within);
    var placeeMargins = _m_placer_css.margins(placee);
    contractRect(withinRect, _m_placer_css.borders(within));
    if (withinRect.top > placeeRect.top - placeeMargins.top) {
        _m_placer_css(placee, {
            top: withinRect.top - parentRect.top,
            bottom: 'auto'
        });
    } else if (withinRect.bottom < placeeRect.bottom + placeeMargins.bottom) {
        _m_placer_css(placee, {
            top: 'auto',
            bottom: parentRect.bottom - withinRect.bottom
        });
    }
}
function trimPositionX(placee, within, parentRect) {
    var placeeRect = _m_placer_css.offsets(placee);
    var withinRect = _m_placer_css.offsets(within);
    var placeeMargins = _m_placer_css.margins(placee);
    contractRect(withinRect, _m_placer_css.borders(within));
    if (withinRect.left > placeeRect.left - placeeMargins.left) {
        _m_placer_css(placee, {
            left: withinRect.left - parentRect.left,
            right: 'auto'
        });
    } else if (withinRect.right < placeeRect.right + placeeMargins.right) {
        _m_placer_css(placee, {
            left: 'auto',
            right: parentRect.right - withinRect.right
        });
    }
}
function getParentRect(target) {
    var rect;
    if (target === _m_placer_doc.body || target === _m_placer_root && getComputedStyle(target).position === 'static') {
        rect = {
            left: 0,
            right: _m_placer_win.innerWidth - (_m_placer_css.hasScrollY() ? _m_placer_css.scrollbar : 0),
            width: _m_placer_win.innerWidth,
            top: 0,
            bottom: _m_placer_win.innerHeight - (_m_placer_css.hasScrollX() ? _m_placer_css.scrollbar : 0),
            height: _m_placer_win.innerHeight
        };
    } else {
        rect = _m_placer_css.offsets(target);
    }
    return rect;
}



/**
 * @module _m_enot
 * @file c:\Users\dmitry\Dropbox\Projects\poppy\node_modules\enot\index.js 
 */

var global = (1, eval)('this');
var _m_enot_doc = global.document;
var eachCSV = _m_each_csv;
var Emitter = _m_emmy;
var str = _m_mustring;
var type = _m_mutype;
if (_m_enot_doc) {
    var matches = _m_matches_selector;
    var q = _m_query_relative;
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
var evtSeparator = '-';
function Enot(target) {
    if (!target)
        return target;
    for (var meth in EnotPrototype) {
        target[meth] = EnotPrototype[meth];
    }
    return target;
}
var EnotPrototype = Enot.prototype = Object.create(Emitter.prototype);
EnotPrototype.addEventListener = EnotPrototype.on = function (evtRefs, fn) {
    var target = this;
    if (isString(target)) {
        fn = evtRefs;
        evtRefs = target;
        target = null;
    }
    if (!evtRefs)
        return target;
    if (type.isObject(evtRefs)) {
        for (var evtRef in evtRefs) {
            EnotPrototype.on.call(target, evtRef, evtRefs[evtRef]);
        }
        return target;
    }
    eachCSV(evtRefs, function (evtRef) {
        _on(target, evtRef, fn);
    });
    return target;
};
EnotPrototype.once = EnotPrototype.one = function (evtRefs, fn) {
    var target = this;
    var processedRefs = '';
    eachCSV(evtRefs, function (item) {
        processedRefs += item + ':one, ';
    });
    processedRefs = processedRefs.slice(0, -2);
    return EnotPrototype.on.call(target, processedRefs, fn);
};
function _on(target, evtRef, fn) {
    if (!fn)
        return target;
    var evtObj = parseReference(target, evtRef);
    var targets = evtObj.targets;
    if (!targets)
        return target;
    if (isArrayLike(targets)) {
        for (var i = targets.length; i--;) {
            Emitter.on(targets[i], evtObj.evt, getModifiedFn(target, fn, targets[i], evtObj.evt, evtObj.modifiers));
        }
        return target;
    }
    var newTarget = targets;
    Emitter.on(newTarget, evtObj.evt, getModifiedFn(target, fn, newTarget, evtObj.evt, evtObj.modifiers));
    return target;
}
EnotPrototype.removeEventListener = EnotPrototype.removeListener = EnotPrototype.removeAllListeners = EnotPrototype.off = function (evtRefs, fn) {
    var target = this;
    if (isString(target)) {
        fn = evtRefs;
        evtRefs = target;
        target = null;
    }
    if (!evtRefs) {
        Emitter.off(target);
    } else if (type.isObject(evtRefs)) {
        for (var evtRef in evtRefs) {
            EnotPrototype.off.call(target, evtRef, evtRefs[evtRef]);
        }
    } else {
        eachCSV(evtRefs, function (evtRef) {
            _off(target, evtRef, fn);
        });
    }
    return target;
};
function _off(target, evtRef, fn) {
    var evtObj = parseReference(target, evtRef);
    var targets = evtObj.targets;
    var targetFn = fn;
    if (!targets)
        return target;
    if (isArrayLike(targets)) {
        for (var i = targets.length; i--;) {
            _off(targets[i], evtObj.evt, fn, true);
        }
        return target;
    }
    var newTarget = targets;
    if (dfdCalls[evtObj.evt]) {
        for (var i = 0; i < dfdCalls[evtObj.evt].length; i++) {
            if (intervalCallbacks[dfdCalls[evtObj.evt][i]] === fn)
                Emitter.off(newTarget, evtObj.evt + evtSeparator + dfdCalls[evtObj.evt][i]);
        }
    }
    if (!fn) {
        Emitter.off(newTarget, evtObj.evt);
    } else {
        var modifiedFns = getModifiedFns(fn, newTarget, evtObj.evt);
        for (var i = modifiedFns.length, unbindCb; i--;) {
            unbindCb = modifiedFns.pop();
            Emitter.off(newTarget, evtObj.evt, unbindCb);
        }
    }
}
EnotPrototype.dispatchEvent = EnotPrototype.emit = function (evtRefs, data, bubbles) {
    var target = this;
    if (isString(target)) {
        bubbles = data;
        data = evtRefs;
        evtRefs = target;
        target = null;
    }
    if (evtRefs instanceof Event) {
        Emitter.emit(target, evtRefs, data, bubbles);
        return target;
    }
    if (!evtRefs)
        return target;
    eachCSV(evtRefs, function (evtRef) {
        var evtObj = parseReference(target, evtRef);
        if (!evtObj.evt)
            return target;
        return applyModifiers(function () {
            var target = evtObj.targets;
            if (!target)
                return target;
            if (isArrayLike(target)) {
                for (var i = target.length; i--;) {
                    Emitter.emit(target[i], evtObj.evt, data, bubbles);
                }
            } else {
                Emitter.emit(target, evtObj.evt, data, bubbles);
            }
        }, evtObj.evt, evtObj.modifiers)();
    });
    return target;
};
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
var DENY_EVT_CODE = 1;
Enot.modifiers = {};
Enot.modifiers['once'] = Enot.modifiers['one'] = function (evt, fn, emptyArg, sourceFn) {
    var cb = function (e) {
        var result = fn && fn.call(this, e);
        result !== DENY_EVT_CODE && Enot.off(this, evt, sourceFn);
        return result;
    };
    return cb;
};
Enot.modifiers['pass'] = function (evt, fn, keys) {
    keys = keys.split(commaSplitRe).map(upper);
    var cb = function (e) {
        var pass = false, key;
        for (var i = keys.length; i--;) {
            key = keys[i];
            var which = 'originalEvent' in e ? e.originalEvent.which : e.which;
            if (key in keyDict && keyDict[key] == which || which == key) {
                pass = true;
                return fn.call(this, e);
            }
        }
        return DENY_EVT_CODE;
    };
    return cb;
};
Enot.modifiers['delegate'] = function (evtName, fn, selector) {
    var cb = function (evt) {
        var el = evt.target;
        if (!isElement(el))
            return DENY_EVT_CODE;
        while (el && el !== _m_enot_doc && el !== this) {
            if (matches(el, selector)) {
                evt.delegateTarget = el;
                return fn.call(this, evt);
            }
            el = el.parentNode;
        }
        return DENY_EVT_CODE;
    };
    return cb;
};
Enot.modifiers['not'] = function (evt, fn, selector) {
    var cb = function (e) {
        var target = e.target;
        while (target) {
            if (target === _m_enot_doc || target === this) {
                return fn.call(this, e);
            }
            if (matches(target, selector))
                return DENY_EVT_CODE;
            target = target.parentNode;
        }
        return DENY_EVT_CODE;
    };
    return cb;
};
var throttleCache = new WeakMap();
Enot.modifiers['throttle'] = function (evt, fn, interval) {
    interval = parseFloat(interval);
    var cb = function (e) {
        return Enot.throttle.call(this, fn, interval, e);
    };
    return cb;
};
Enot.throttle = function (fn, interval, e) {
    var self = this;
    if (throttleCache.get(self))
        return DENY_EVT_CODE;
    else {
        var result = fn.call(self, e);
        if (result === DENY_EVT_CODE)
            return result;
        throttleCache.set(self, setTimeout(function () {
            clearInterval(throttleCache.get(self));
            throttleCache.delete(self);
        }, interval));
    }
};
var dfdCalls = {};
var intervalCallbacks = {};
Enot.modifiers['defer'] = function (evt, fn, delay, sourceFn) {
    delay = parseFloat(delay) || 0;
    var cb = function (e) {
        var self = this;
        var interval = setTimeout(function () {
            var evtName = evt + evtSeparator + interval;
            Emitter.emit(self, evtName, { sourceEvent: e });
            Emitter.off(self, evtName);
            var idx = dfdCalls[evt].indexOf(interval);
            if (idx > -1)
                dfdCalls[evt].splice(idx, 1);
            intervalCallbacks[interval] = null;
        }, delay);
        Emitter.on(self, evt + evtSeparator + interval, sourceFn);
        (dfdCalls[evt] = dfdCalls[evt] || []).push(interval);
        intervalCallbacks[interval] = sourceFn;
        return interval;
    };
    return cb;
};
var commaSplitRe = /\s*,\s*/;
function parseReference(target, string) {
    var result = {};
    var eventString = string.match(/[\w\.\:\$\-]+(?:\:[\w\.\:\-\$]+(?:\(.+\))?)*$/)[0];
    string = string.slice(0, -eventString.length).trim();
    result.targets = parseTargets(target, string);
    var eventParams = unprefixize(eventString, 'on').split(':');
    result.evt = eventParams.shift();
    result.modifiers = eventParams.sort(function (a, b) {
        return /^one/.test(a) ? 1 : a > b ? 1 : -1;
    });
    return result;
}
function parseTargets(target, str) {
    if (!target)
        target = global;
    if (!str) {
        return target;
    }
    if (str[0] === '@') {
        return getProperty(target, str.slice(1));
    } else if (str === 'window')
        return global;
    else if (str === 'document')
        return _m_enot_doc;
    else {
        return q(target, str, true);
    }
}
function getProperty(holder, propName) {
    var propParts = propName.split('.');
    var result = holder, lastPropName;
    while ((lastPropName = propParts.shift()) !== undefined) {
        if (!has(result, lastPropName))
            return undefined;
        result = result[lastPropName];
    }
    return result;
}
var targetsCache = new WeakMap();
function getModifiedFn(initialTarget, fn, target, evt, modifiers) {
    if (!fn)
        return fn;
    var targetFn = fn;
    if (!initialTarget)
        initialTarget = target;
    targetFn = getRedirector(targetFn);
    var modifierFns = getModifiedFns(targetFn, target, evt);
    var modifiedCb = applyModifiers(targetFn, evt, modifiers);
    if (initialTarget !== target) {
        modifiedCb = modifiedCb.bind(initialTarget);
    }
    modifierFns.push(modifiedCb);
    return modifiedCb;
}
function getModifiedFns(targetFn, target, evt) {
    targetFn = getRedirector(targetFn);
    var targetsDict = targetsCache.get(targetFn);
    if (!targetsDict) {
        targetsDict = new WeakMap();
        targetsCache.set(targetFn, targetsDict);
    }
    var eventsDict = targetsDict.get(target);
    if (!eventsDict) {
        eventsDict = {};
        targetsDict.set(target, eventsDict);
    }
    var modifiersList = eventsDict[evt];
    if (!modifiersList) {
        modifiersList = [];
        eventsDict[evt] = modifiersList;
    }
    return modifiersList;
}
function applyModifiers(fn, evt, modifiers) {
    var targetFn = fn;
    modifiers.forEach(function (modifier) {
        var modifierName = modifier.split('(')[0];
        var modifierParams = modifier.slice(modifierName.length + 1, -1);
        if (Enot.modifiers[modifierName]) {
            targetFn = Enot.modifiers[modifierName](evt, targetFn, modifierParams, fn);
        }
    });
    return targetFn;
}
var redirectSet = {};
function getRedirector(redirectTo) {
    if (!type.isPlain(redirectTo))
        return redirectTo;
    if (redirectSet[redirectTo])
        return redirectSet[redirectTo];
    var cb = function (e) {
        var self = this;
        eachCSV(redirectTo, function (evt) {
            if (defaultRedirectors[evt])
                defaultRedirectors[evt].call(self, e);
            Enot.emit(self, evt, e.detail, e.bubbles);
        });
    };
    redirectSet[redirectTo] = cb;
    return cb;
}
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
function noop() {
}
;
Emitter.bindStaticAPI.call(Enot);
_m_enot = Enot;



/**
 * @module _m_st8
 * @file c:\Users\dmitry\Dropbox\Projects\poppy\node_modules\st8\index.js 
 */

_m_st8 = applyState;
var enot = _m_enot;
var _m_st8_type = _m_mutype;
var _m_st8_eachCSV = _m_each_csv;
var extend = _m_extend;
var _m_st8_icicle = _m_icicle;
var flattenKeys = _m_split_keys;
var _m_st8_isObject = _m_st8_type.isObject;
var _m_st8_has = _m_st8_type.has;
var _m_st8_isFn = _m_st8_type.isFn;
var _m_st8_isPlain = _m_st8_type.isPlain;
var _m_st8_isString = _m_st8_type.isString;
var eOn = enot.on;
var eOff = enot.off;
var createdCallbackName = 'created';
var enterCallbackName = 'before';
var leaveCallbackName = 'after';
var initCallbackName = 'init';
var changedCallbackName = 'changed';
var setterName = 'set';
var getterName = 'get';
var remainderStateName = '_';
var valuesCache = new WeakMap();
var statesCache = new WeakMap();
var propsCache = new WeakMap();
var depsCache = new WeakMap();
var activeCallbacks = new WeakMap();
var ignoreCache = new WeakMap();
var settersCache = new WeakMap();
function applyState(target, props, ignoreProps) {
    if (!statesCache.has(target))
        statesCache.set(target, {});
    if (!activeCallbacks.has(target))
        activeCallbacks.set(target, {});
    if (!ignoreCache.has(target))
        ignoreCache.set(target, ignoreProps || {});
    if (!settersCache.has(target))
        settersCache.set(target, {});
    if (!propsCache.has(target))
        propsCache.set(target, {});
    flattenKeys(props, true);
    var deps = {};
    depsCache.set(target, deps);
    for (var propName in props) {
        if (_m_st8_has(Object, propName))
            continue;
        if (propName === createdCallbackName || propName === initCallbackName) {
            continue;
        }
        deps[propName] = deps[propName] || {};
        var prop = props[propName];
        if (_m_st8_isObject(prop)) {
            for (var stateName in prop) {
                var innerProps = prop[stateName];
                if (!_m_st8_isObject(innerProps))
                    continue;
                for (var innerPropName in innerProps) {
                    if (isStateTransitionName(innerPropName) || innerPropName === propName)
                        continue;
                    var innerProp = innerProps[innerPropName];
                    (deps[innerPropName] = deps[innerPropName] || {})[propName] = true;
                    if (_m_st8_isString(innerProp))
                        (deps[propName] = deps[propName] || {})[innerProp] = true;
                    if (!_m_st8_has(target, innerPropName) && !_m_st8_has(props, innerPropName)) {
                        if (_m_st8_isFn(innerProp))
                            target[innerPropName] = _m_st8_noop;
                    }
                }
            }
        }
    }
    createProps(target, props);
    for (propName in props) {
        if (!props[propName] && props[propName] !== 0) {
            initProp(target, propName);
        }
    }
    for (propName in props) {
        if (_m_st8_isPlain(props[propName])) {
            initProp(target, propName);
        }
    }
    for (propName in props) {
        if (_m_st8_isFn(props[propName])) {
            initProp(target, propName);
        }
    }
    for (propName in deps) {
        initProp(target, propName);
    }
    return target;
}
function createProps(target, props) {
    var deps = depsCache.get(target);
    var ignoreProps = ignoreCache.get(target);
    var protoValues = {}, initialStates = {};
    for (var propName in deps) {
        if (!_m_st8_isObject(props[propName])) {
            protoValues[propName] = props[propName];
        }
        if (_m_st8_has(props, propName))
            propsCache.get(target)[propName] = prop;
    }
    if (!valuesCache.has(target)) {
        valuesCache.set(target, Object.create(protoValues));
    } else {
        var values = valuesCache.get(target);
        for (propName in protoValues) {
            var valuesProto = values.__proto__;
            if (!_m_st8_has(valuesProto, propName))
                valuesProto[propName] = protoValues[propName];
        }
    }
    for (var name in deps) {
        var prop = props[name];
        statesCache.get(target)[name] = Object.create(_m_st8_isObject(prop) ? prop : null);
        _m_st8_icicle.freeze(target, initCallbackName + name);
        if (ignoreProps[name]) {
            createSetter(target, name);
            continue;
        }
        if (_m_st8_has(target, name)) {
            valuesCache.get(target)[name] = target[name];
        }
        Object.defineProperty(target, name, {
            configurable: true,
            get: function (target, name) {
                return function () {
                    var propState = statesCache.get(target)[name];
                    initProp(target, name);
                    var values = valuesCache.get(target);
                    var value = values[name];
                    var getResult = callState(target, propState[getterName], value);
                    value = getResult === undefined ? values[name] : getResult;
                    return value;
                };
            }(target, name),
            set: createSetter(target, name)
        });
    }
}
var inSetValues = new WeakMap();
function createSetter(target, name) {
    var setter = function (value) {
        var propState = statesCache.get(target)[name];
        var targetValues = valuesCache.get(target);
        initProp(target, name);
        var oldValue = targetValues[name];
        var setResult;
        if (_m_st8_icicle.freeze(target, setterName + name)) {
            if (_m_st8_icicle.freeze(target, setterName + name + value)) {
                try {
                    setResult = callState(target, propState[setterName], value, oldValue);
                } catch (e) {
                    throw e;
                }
                _m_st8_icicle.unfreeze(target, setterName + name + value);
                _m_st8_icicle.unfreeze(target, setterName + name);
                if (inSetValues.has(target)) {
                    setResult = inSetValues.get(target);
                    inSetValues.delete(target);
                }
                if (setResult !== undefined)
                    value = setResult;
                else {
                    if (targetValues[name] !== oldValue) {
                        return;
                    }
                }
            }
        } else {
            inSetValues.set(target, value);
        }
        var initLock = _m_st8_icicle.unfreeze(target, initCallbackName + name);
        if (!initLock) {
            if (value === oldValue) {
                return;
            }
            var oldState = _m_st8_has(propState, oldValue) ? propState[oldValue] : propState[remainderStateName];
            if (_m_st8_icicle.freeze(target, leaveCallbackName + oldState)) {
                var leaveResult = leaveState(target, oldState, value, oldValue);
                if (leaveResult !== undefined && leaveResult !== value) {
                    if (leaveResult === false) {
                    } else {
                        target[name] = leaveResult;
                    }
                    return _m_st8_icicle.unfreeze(target, leaveCallbackName + oldState);
                }
                _m_st8_icicle.unfreeze(target, leaveCallbackName + oldState);
                if (targetValues[name] !== oldValue) {
                    return;
                }
                unapplyProps(target, oldState);
            }
        }
        applyValue(target, name, value);
        var newStateName = _m_st8_has(propState, value) ? value : remainderStateName;
        if (_m_st8_icicle.freeze(target, name + newStateName)) {
            var newState = propState[newStateName];
            applyProps(target, newState);
            var enterResult = callState(target, newState, value, oldValue);
            if (enterResult !== undefined && enterResult !== value) {
                if (enterResult === false) {
                    target[name] = oldValue;
                } else {
                    target[name] = enterResult;
                }
                return _m_st8_icicle.unfreeze(target, name + newStateName);
            }
            _m_st8_icicle.unfreeze(target, name + newStateName);
        }
        if (value !== oldValue || initLock && value !== undefined)
            callState(target, propState[changedCallbackName], value, oldValue);
    };
    settersCache.get(target)[name] = setter;
    return setter;
}
function initProp(target, name) {
    var deps = depsCache.get(target);
    if (!deps[name])
        return;
    var propState = statesCache.get(target)[name];
    var targetValues = valuesCache.get(target);
    var propDeps = deps[name];
    deps[name] = null;
    for (var depPropName in propDeps) {
        if (propDeps[depPropName]) {
            initProp(target, depPropName);
        }
    }
    var initResult, beforeInit = targetValues[name];
    if (_m_st8_isFn(propState[initCallbackName])) {
        initResult = propState[initCallbackName].call(target, beforeInit);
    } else if (_m_st8_isObject(propState[initCallbackName]) && _m_st8_has(propState[initCallbackName], enterCallbackName)) {
        initResult = callState(target, propState[initCallbackName], beforeInit);
    } else {
        initResult = beforeInit !== undefined ? beforeInit : propState[initCallbackName];
    }
    if (initResult === undefined)
        initResult = beforeInit;
    if (targetValues[name] !== beforeInit)
        return;
    valuesCache.get(target)[name] = initResult;
    var isIgnored = ignoreCache.get(target)[name];
    if (!isIgnored) {
        target[name] = initResult;
    } else {
        settersCache.get(target)[name](initResult);
    }
}
function applyValue(target, name, value) {
    valuesCache.get(target)[name] = value;
    if (value === _m_st8_noop)
        return;
    bindValue(target, name, value);
}
function bindValue(target, name, value) {
    if (_m_st8_isString(value) || _m_st8_isFn(value)) {
        if (_m_st8_isFn(value)) {
            value = value.bind(target);
            activeCallbacks.get(target)[name] = value;
        }
        eOn(target, name, value);
    }
}
function applyProps(target, props) {
    if (!_m_st8_isObject(props))
        return;
    for (var name in props) {
        if (isStateTransitionName(name))
            continue;
        var value = props[name];
        var state = statesCache.get(target)[name];
        if (_m_st8_isObject(value)) {
            extend(state, value);
        } else {
            if (value === valuesCache.get(target)[name]) {
                bindValue(target, name, value);
            }
            if (!ignoreCache.get(target)[name]) {
                target[name] = value;
            } else {
                settersCache.get(target)[name](value);
            }
        }
    }
}
function unapplyProps(target, props) {
    if (!_m_st8_isObject(props))
        return;
    for (var name in props) {
        if (isStateTransitionName[name])
            continue;
        var propValue = props[name];
        var state = statesCache.get(target)[name];
        var values = valuesCache.get(target);
        if (_m_st8_isObject(propValue)) {
            for (var propName in propValue) {
                delete state[propName];
            }
        } else {
            if (_m_st8_isString(propValue) || _m_st8_isFn(propValue)) {
                if (_m_st8_isFn(propValue)) {
                    var callbacks = activeCallbacks.get(target);
                    if (callbacks[name]) {
                        propValue = callbacks[name];
                        callbacks[name] = null;
                    }
                }
                eOff(target, name, propValue);
            }
            if (_m_st8_has(propsCache.get(target), name) && !state.constructor)
                delete values[name];
        }
    }
}
function callState(target, state, a1, a2) {
    if (state === undefined) {
        return a1;
    } else if (_m_st8_isPlain(state)) {
        return state;
    } else if (_m_st8_isFn(state)) {
        return state.call(target, a1, a2);
    } else if (_m_st8_isObject(state)) {
        if (_m_st8_isFn(state[enterCallbackName])) {
            return state[enterCallbackName].call(target, a1, a2);
        } else {
            return state[enterCallbackName];
        }
    }
    return state;
}
function leaveState(target, state, a) {
    if (!state)
        return a;
    if (!state[leaveCallbackName]) {
        return state[leaveCallbackName];
    }
    if (_m_st8_isFn(state[leaveCallbackName])) {
        return state[leaveCallbackName].call(target, a);
    }
}
function _m_st8_noop() {
}
function isStateTransitionName(name) {
    if (name === enterCallbackName || name === leaveCallbackName)
        return true;
}
function unapplyState(target, props) {
}



/**
 * @module _m_36
 * @file c:\Users\dmitry\Dropbox\Projects\poppy\src\poppy.js 
 */

var _m_36_type = _m_mutype;
var _m_36_css = _m_mucss;
var _m_36_place = _m_placer;
var _m_36_q = _m_query_relative;
var parse = _m_muparse;
var _m_36_extend = _m_extend;
var state = _m_st8;
var _m_36_Emitter = _m_emmy;
_m_36 = _m_36_Poppy;
function _m_36_Poppy(options) {
    var self = this;
    _m_36_extend(this, options);
    this.tipEl = document.createElement('div');
    this.tipEl.className = 'poppy-tip';
    this.contentEl;
    this.closeEl = document.createElement('div');
    this.closeEl.className = 'poppy-close';
    _m_36_Emitter.on(this.closeEl, 'click', function () {
        self.hide();
    });
    state(this, this.constructor.options);
}
_m_36_Poppy.options = {
    target: {},
    align: 'left',
    container: {
        init: function () {
            var $container = document.createElement('div');
            $container.className = 'poppy-container';
            $container.className += ' ' + this.containerClass;
            $container.poppy = this;
            return $container;
        }
    },
    containerClass: '',
    tip: {
        init: false,
        _: function () {
            this.container.classList.remove('poppy-container-tip');
        },
        'true': function () {
            this.container.classList.add('poppy-container-tip');
        }
    },
    tipAlign: 0.5,
    holder: {
        init: 'body',
        get: function (value) {
            return _m_36_q(value);
        }
    },
    content: { init: '' },
    contentType: {
        init: null,
        _: {
            content: {
                changed: function (val) {
                    var el = _m_36_q(val);
                    if (el.parentNode)
                        el.parentNode.removeChild(el);
                    el.removeAttribute('hidden');
                    this.contentEl = el;
                }
            }
        },
        html: {
            content: {
                changed: function (val) {
                    var el;
                    if (!this.contentEl) {
                        el = this.contentEl = document.createElement('div');
                        this.container.appendChild(el);
                    } else {
                        el = this.contentEl;
                    }
                    el.innerHTML = val;
                    return el;
                }
            }
        }
    },
    single: false,
    close: {
        init: false,
        _: function () {
            this.container.replaceChild(this.closeEl);
            this.container.classList.remove('poppy-container-close');
        },
        'true': function () {
            this.container.appendChild(this.closeEl);
            this.container.classList.add('poppy-container-close');
        }
    },
    state: {
        init: 'hidden',
        opening: function () {
            var self = this;
            setTimeout(function () {
                self.state = 'visible';
            });
        },
        visible: {},
        hidden: {},
        disabled: {
            'show, hide': 'noop',
            after: function (a, b) {
                if (a === 'enabled')
                    return 'hidden';
                return false;
            }
        },
        changed: function (newState, oldState) {
            if (!this.$container) {
                return;
            }
            this.$container.classList.add(name + '-' + newState);
            this.$container.classList.remove(name + '-' + oldState);
        }
    }
};
var contentCache = {};
var _m_36_proto = _m_36_Poppy.prototype;
_m_36_proto.show = function (target) {
    var self = this;
    if (this.contentEl.parentNode !== this.container)
        this.container.appendChild(this.contentEl);
    self.holder.appendChild(self.container);
    if (this.tip && !this.tipEl.parentNode)
        self.holder.appendChild(this.tipEl);
    self.place(target);
    self.state = 'opening';
    return self;
};
_m_36_proto.hide = function () {
    if (this.container.parentNode)
        this.holder.removeChild(this.container);
    if (this.tipEl.parentNode)
        this.holder.removeChild(this.tipEl);
    this.state = 'hidden';
    return this;
};
_m_36_proto.place = function () {
};
_m_36_proto.placeTip = function () {
};
_m_36_proto.disable = function () {
    this.state = 'disabled';
    return this;
};
_m_36_proto.enable = function () {
    this.state = 'enabled';
    return this;
};



/**
 * @module _m_35
 * @file c:\Users\dmitry\Dropbox\Projects\poppy\src\dropdown.js 
 */

var Poppy = _m_36;
var _m_35_place = _m_placer;
var _m_35_extend = _m_extend;
_m_35 = Dropdown;
function Dropdown(options) {
    Poppy.call(this, options);
    this.container.classList.add('poppy-dropdown');
}
var _m_35_proto = Dropdown.prototype = Object.create(Poppy.prototype);
_m_35_proto.constructor = Dropdown;
var opts = Dropdown.options = Object.create(Poppy.options);
opts.state.hidden = {
    '@target click': function (e) {
        this.currentTarget = e.currentTarget;
        this.show(e.currentTarget);
    }
};
opts.state.visible = {
    'document click:not(.poppy-dropdown), @target click': function () {
        this.currentTarget = null;
        this.hide();
    },
    'window resize:throttle(50), document scroll:throttle(15)': function (e) {
        this.place(this.currentTarget);
    }
};
opts.tip.init = true;
opts.close.init = true;
opts.align = 0.5;
_m_35_proto.place = function (target) {
    var opts = {
        relativeTo: target,
        side: 'bottom',
        within: window,
        align: this.align
    };
    _m_35_place(this.container, opts);
    _m_35_place(this.tipEl, {
        relativeTo: target,
        align: this.tipAlign,
        side: opts.side
    });
    this.tipEl.setAttribute('data-side', opts.side);
    return this;
};



/**
 * @module _m_poppy
 * @file c:\Users\dmitry\Dropbox\Projects\poppy\index.js 
 */

var poppy = _m_poppy = _m_36;
poppy.Dropdown = _m_35;
