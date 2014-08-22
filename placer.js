/**
* Placer
* Places any element relative to any other element the way you define
*/

module.exports = place;

var win = window;

//default options
var defaults = {
	//source to align relatively to
	//element/{x,y}/[x,y]/
	relativeTo: window,

	//which side to palce element
	//t/r/b/l, 'center' ( === undefined),
	position: 'center',

	//intensity of alignment
	//left, center, right, top, bottom, 0..1
	align: .5,

	//selector/nodelist/node/[x,y]/window/function(el)
	avoid: undefined,

	//selector/nodelist/node/[x,y]/window/function(el)
	within: window
}

//set of position placers
var placeBySide = {
	'center': function(el, rect){
		var center = [(rect[1] + rect[0]) / 2, (rect[3] + rect[2]) / 2];
		var width = el.offsetWidth;
		var height = el.offsetHeight;
		el.style.top = (center[1] - height/2) + 'px';
		el.style.left = (center[0] - width/2) + 'px';
	}
}


//place element relative to the target on the side
function place(element, options){
	options = options || {};

	//get target rect to align
	var target = options.relativeTo || defaults.relativeTo;
	var targetRect;
	if (target === win) {
		targetRect = [0, win.innerWidth, 0, win.innerHeight]
	}
	else if (target instanceof Element) {
		var rect = target.getBoundingClientRect();
		targetRect = [rect.left, rect.right, rect.top, rect.bottom]
	}

	//align according to the position
	var side = options.position || defaults.position;

	placeBySide[side](element, targetRect);
}

function parseCSSValue(str){
	return ~~str.slice(0,-2);
}