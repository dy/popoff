var Poppy = require('poppy');
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
 * Go options after Poppy options
 */
var opts = Dropdown.options = Object.create(Poppy.options);



/**
 * Inherit from Poppy
 */
var proto = Dropdown.prototype = Object.create(Poppy.prototype);
proto.constructor = Dropdown;


/**
 * Add dropdown class to the container
 */
// proto.options.container.changed = function($container){
// 	$container.classList.add(name + '-dropdown');
// };


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
	':root click:not(.poppy-dropdown)': function(){
		//clear current target reference
		this.currentTarget = null;
		this.hide();
	},

	/** Keep container updated on resize */
	'window resize:throttle(50), :root scroll:throttle(50)': function(e){
		this.place(this.currentTarget);
	}
};



/**
* Dropdowns are usually placed below the element, except for border cases
*/
proto.alignment = 0.5;

proto.place = function(target){
	var opts = {
		relativeTo: target,
		side: 'bottom',
		within: window,
		align: this.alignment
	};

	//place by the bottom-strategy
	place(this.container, opts);

	//set tip inveted to the side (side could’ve changed in placing)
	if (opts.side === 'bottom') this.tip = 'top';
	if (opts.side === 'top') this.tip = 'bottom';
	if (opts.side === 'left') this.tip = 'right';
	if (opts.side === 'right') this.tip = 'left';

	return this;
};


// /**
//  * Show dropdown tip by default
//  */
// proto.tip.init = 'top';


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