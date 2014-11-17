var Poppy = require('../index');
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

proto.state.hidden = {
	'click': 'show'
	//TODO: preventDefault
};
extend(proto.state.visible, {
	'document click:not(.poppy-dropdown)': 'hide'
});


/**
* Dropdowns are usually placed below the element, except for border cases
*/

proto.alignment.init = 0.5;

proto.place = function(){
	var opts = {
		relativeTo: this,
		side: 'bottom',
		within: window,
		align: this.alignment
	};

	//place by the bottom-strategy
	place(this.$container, opts);

	//set tip inveted to the side (side could’ve changed in placing)
	if (opts.side === 'bottom') this.tip = 'top';
	if (opts.side === 'top') this.tip = 'bottom';
	if (opts.side === 'left') this.tip = 'right';
	if (opts.side === 'right') this.tip = 'left';

	return this;
};


/**
 * Show dropdown tip by default
 */

proto.tip.init = 'top';


/**
 * Autoinit instances.
 *
 * @see Use [selector-observer]{@link https://www.npmjs.org/package/selector-observer}
 *      if you want to init items dynamically. *
 */

document.addEventListener("DOMContentLoaded", function() {
	var items = document.querySelectorAll('[data-dropdown]');
	for(var i = items.length; i--;){
		new Dropdown(items[i]);
	}
});