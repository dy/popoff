var Mod = require('mod-constructor');
var Poppy = require('poppy');
var extend = require('extend');
var place = require('placer');

module.exports = Popover;


function Popover(){
	return this.constructor.apply(this, arguments);
}

//FIXME: replace Poppy.fn with Poppy.prototype
//FIXME: extension doesn't clone the object: use Object.create(Poppy);
var proto = extend(Popover.prototype, Poppy.extend({}).fn);

//autoinit
//FIXME: replace with observe-selector
proto.selector = '[data-popover]';



/**
* Lifecycle
*/
proto.init = function(){
}
proto.created = function(){
	console.log('popover created')
}


//add proper class to the container
proto.$container.changed = function($container){
	$container.classList.add(name + '-popover');
}


/**
* Behaviour
*/
//hidden
proto.state._ = {
	//FIXME: get rid of defer
	'click:defer': function (e) {
		//save position of click
		this._xPos = e.clientX;
		this._yPos = e.clientY;

		this.show();
	}
}
proto.state.visible = {
	//FIXME: replace with :not modifier
	'document click': function(e){
		if (e.target !== this.$container && !this.$container.contains(e.target)) this.hide();
	},

	//if mouse moved too far - close also
	'document mousemove': function(e){
		var xDiff = e.clientX - this._xPos, yDiff = e.clientY - this._yPos;
		var dist = Math.sqrt(xDiff*xDiff + yDiff*yDiff);
		if (dist > this.visibleDistance) this.hide();

	}
}
//distance from the place of initial click to hide the popover
proto.visibleDistance = {
	init: function(){
		return window.innerWidth * .4;
	}
}

proto.place = function(){
	//place properly (align by center)
	place(this.$container, {
		relativeTo: this,
		align: 'center'
	})
}



//handle popup as a mod
Mod(Popover);