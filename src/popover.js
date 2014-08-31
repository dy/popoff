var Poppy = require('../index');
var Mod = window.Mod || require('mod-constructor');
var place = require('placer');
var SelectorObserver = require('selector-observer');

module.exports = Poppy.extend(Popover);


var name = Poppy.displayName;

//FIXME: replace Poppy.fn with Poppy.prototype
//FIXME: extension doesn't clone the object: use Object.create(Poppy);
function Popover(){
	return this.constructor.apply(this, arguments);
}
var proto = Popover.prototype;

/**
* Lifecycle
*/
proto.init = function(){
	// console.log('init popover')
};
proto.created = function(){
	// console.log('popover created')
};

//watch for the elements
new SelectorObserver(document.documentElement, '[data-popover]', function(e){
	new Popover(this);
});

//add proper class to the container
proto.$container.changed = function($container){
	$container.classList.add(name + '-popover');
};


/**
* Behaviour
*/
//hidden
proto.state._ = {
	//FIXME: get rid of defer
	'click:defer': function (e) {
		this.show();
	}
};
proto.state.visible = {
	//FIXME: replace with :not modifier
	'document click': function(e){
		if (e.target !== this.$container && !this.$container.contains(e.target)) this.hide();
	},

	//if mouse moved too far - close also
	'document mousemove': function(e){
		var rect = this.getBoundingClientRect();
		var centerX = (rect.left + rect.right) / 2;
		var centerY = (rect.top + rect.bottom) / 2;
		var xDiff = e.clientX - centerX, yDiff = e.clientY - centerY;
		var dist = Math.sqrt(xDiff*xDiff + yDiff*yDiff);
		if (dist > this.visibleDistance) this.hide();

	}
};
//distance from the place of initial click to hide the popover
proto.visibleDistance = {
	init: function(){
		return window.innerWidth * 0.4;
	}
};


/**
 * Popover is always placed over the element
 *
 * @return {[type]} [description]
 */

proto.place = function(){
	//place properly (align by center)
	place(this.$container, {
		relativeTo: this,
		align: 'center'
	});
};