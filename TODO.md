* Autolaunch for zepto (instanceof Zepto) 

* Test href along with title on a

* Fix page auto-displacing on anchor link with popupper autolaunch (if element somewhere below in the content)

* Make order of popups to show, like tutorial

* Get rid of non-blocking notation (+): there’s no sense in that, cause you cant call hide not stopping show

* Optional tip(triangle) with a color
	* Tip could be any: svg, border, rotated square. 
	* My goal is only to place tip relative to the target, rest is due to css settings.

* Notify if content passed is null, like 0-selector

* Think how to avoid dropdown triggering when tried to hide

* Make window popupper: assign popupper to the body

* Fix up tests
* Fix up component.json, package.json and other meta-stuff

* Make external hrefs handling
	* Fonts
	* Images
	* Iframes
	* Documents

* Handle https as content

* Fix doc height

* Make default styles

* handle case when the container is outside the viewport

* Find bug on shared content popups. Sometimes it stops to hide.

* zepto shared content bug

* Tooltip centrized relative to target position (not as dropdown)

* Zones to avoid when place
* Vertical/Horizontal placing strategy
* + Multiple or single tooltips (number of tooltips)
	* Container for every target element otherwise it’s fuck onerous.
* Escape-keystroke handling
* Event to show it up on
* + Preinit, post-init
* Animations throught anim-3d.less.
* Event callbacks
* Lightbox, dropdown, tooltip, balloon, dialog and popup in one.

* Handle out-of-screen, out-of-size

* Count tip size when placing

* Aside-menu-popup (like on phones)

* Test custom behaviour (custom type)

* Test calling methods from outside, like $(thing).popupper("method");

* Test position:center when the position is absolute, not fixed
