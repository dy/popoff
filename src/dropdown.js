var Poppy = require('../index');
var Mod = window.Mod || require('mod-constructor');
var place = require('placer');
var extend = require('extend');


/**
 * Dropdown component - as you used to know it
 *
 * @constructor
 * @extends {Poppy}
 * @module dropdown
 */

var Dropdown = module.exports = Poppy.extend();

/** Parent component name to use as class identifier */
var name = Poppy.displayName;


var proto = Dropdown.prototype;


proto.created = function(){
	// console.log('dropdown created');
};


/**
 * Add dropdown class to the container
 */

proto.$container.changed = function($container){
	$container.classList.add(name + '-dropdown');
};


/**
 * Behaviour
 */

proto.state._ = {
	'click:defer': 'show'
};
extend(proto.state.visible, {
	'document click:not(.poppy-dropdown)': 'hide'
});


/**
* Dropdowns are usually placed below the element, except for border cases
*
* @return {Dropdown} For chaining methods
*/

proto.place = function(){
	var result = place(this.$container, {
		relativeTo: this,
		side: 'bottom'
	});

	//set tip according to the side
	if (result){
		this.tip = 'top';
	} else {
		this.tip = 'bottom';
	}

	return this;
};


/**
 * Show dropdown tip by default
 */

proto.tip.init = true;


/**
 * Autoinit instances.
 *
 * @see Use [selector-observer]{@link https://www.npmjs.org/package/selector-observer}
 *      if you want to init items dynamically. *
 */

var items = document.querySelectorAll('[data-dropdown]');
for(var i = items.length; i--;){
	new Dropdown(items[i]);
}