* Think how to implement hover on dropdown target after being showed

* Name plugin jquery.popup and init as data-popup="dropdown", data-popup-content="#link". Feel not comfortable with popupper.

* Fluid-fixed hiding element behaviour (kudago-pagination-like)

* BUG: dropdown sometimes excessively hides after show (kudago search). Why?

* BUG: dropdown fucks up on outer click

* Precisely-positioned element instant overlay, as lebedev makes. `position: [-10, -10]`, probably.

* Suggester behaviour

* Think of getting rid of overlay, animating it by css

* Change class init to data-popup init: better naming (avoid popupper class), no class-clattering.

* Form error/warning/success styles of balloons

* Test title along with balloon

* Make lightbox slider test page.
* Make zoomer test page.
* Make balloon with remote html-content test page (as for single post page)

* Bug: top offscreen doesn’t work. Fix clipping positions of tooltips.

* Make lightbox work. Connect some slider, make centrizing API method.

* Make .popupper return popupped object. To call API without difficulties in Zepto.

* Test href along with title on a

* Fix page auto-displacing on anchor link with popupper autolaunch (if element somewhere below in the content)

* Make order of popups to show, like tutorial

* Notify if content passed is null, like 0-selector

* Make window popupper: assign popupper to the window as target

* Fix up tests
* Fix up component.json, package.json and other meta-stuff

* Make external hrefs handling
	* Fonts
	* Images
	* Iframes
	* Documents

* Handle http as content

* Make default styles

* handle case when the container is outside the viewport

* Zones to avoid when place

* Animations throught anim-3d.less.
* Event callbacks
* Lightbox, dropdown, tooltip, balloon, dialog and popup in one.

* Handle out-of-screen, out-of-size

* Aside-menu-popup (like on phones)

* Test custom behaviour

* Test calling methods from outside, like $(thing).popupper("method");

* Test position:center when the position is absolute, not fixed

* Centrize when window resized

* Rewrite without jquery