/**
* Placer
* Places any element relative to any other element the way you define
*/

module.exports = place;

//default options
var defaults = {
	//source to align relatively to
	//element/{x,y}/[x,y]/
	target: window,

	//which side to palce element
	//t/r/b/l, 'center' ( === undefined),
	side: 'center',

	//intensity of alignment
	//left, center, right, top, bottom, 0..1
	align: .5,

	//selector/nodelist/node/[x,y]/window/function(el)
	avoid: undefined,

	//selector/nodelist/node/[x,y]/window/function(el)
	within: window
}

//place element relative to the target on the side
function place(element, options){
	options = options || {};


}