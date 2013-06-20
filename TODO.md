* Autolaunch for zepto (instanceof Zepto) 

* Test href along with title on a

* Fix page auto-displacing on anchor link with popupper autolaunch (if element somewhere below in the content)

* Make order of popups to show, like tutorial

* Get rid of non-blocking notation (+): there’s no sense in that, cause you cant call hide not stopping show

* Notify if content passed is null, like 0-selector

* Make window popupper: assign popupper to the window as target

* Fix up tests
* Fix up component.json, package.json and other meta-stuff

* Make external hrefs handling
	* Fonts
	* Images
	* Iframes
	* Documents

* Handle https as content

* Make default styles

* handle case when the container is outside the viewport

* Find bug on shared content popups. Sometimes it stops to hide.

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

* Aside-menu-popup (like on phones)

* Test custom behaviour

* Test calling methods from outside, like $(thing).popupper("method");

* Test position:center when the position is absolute, not fixed
