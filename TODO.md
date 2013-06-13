* The thing is in multiple container controllers. Need to avoid bindind single container to the multiple targets.
	* First way - creating container controller class.
	* Second way - avoiding shared containers.
	* If we have container of different types — should we bind events twice or create different containers?
		* In the ideal world we should have different lightweight containers for each target due to different target types and behaviour
		* If we have shared content, we should wait till one container fully frees. So there’s sense to make indicator of bisyness and bind events on freeing event.
	* So the only way is to busy content by targets 



* Fix closing problem (outside click after close click fails)

* ? Overlays fucks up on shared content

* ? Overlay fucks up when closed through outside click

* Make window popupper

* Make autolaunched popupper

* Fix up tests
* Fix up component.json, package.json and other meta-stuff

* Make external hrefs  handling
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
* Optional tip(triangle) with a color
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
