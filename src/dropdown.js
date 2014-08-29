var Poppy = require('../index');
var Mod = window.Mod || require('mod-constructor');
var place = require('placer');
var SelectorObserver = require('selector-observer');


var Dropdown = module.exports = Poppy.extend();


var name = Poppy.displayName;


//observe instances
new SelectorObserver(document.documentElement, '[data-dropdown]', function(){
	new Dropdown(this);
});


var proto = Dropdown.prototype;



proto.created = function(){
	console.log('dropdown created');
};


/**
 * Add proper class to the container
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
proto.state.visible = {
	'document click:not(.poppy-dropdown)': 'hide'
};


/**
* Dropdowns are usually placed below the element.
* @return {Dropdown} For chaining methods
*/
proto.place = function(){
	place(this.$container, {
		relativeTo: this,
		side: 'bottom'
	});

	return this;
};