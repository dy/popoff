[![Popov](https://raw.githubusercontent.com/dy/popoff/gh-pages/popoff.png "Popov")](https://en.wikipedia.org/wiki/Alexander_Stepanovich_Popov)

# Popoff [![unstable](http://badges.github.io/stability-badges/dist/unstable.svg)](http://github.com/badges/stability-badges)

Popoff runs modals, tooltips, popups, dropdowns, confirms, notifiers, popovers, lightboxes, balloons, dialogs, alerts, overlays, sidebars etc. **[Demo](http://dy.github.io/popoff/)**.

## Usage

[![npm install popoff](https://nodei.co/npm/popoff.png?mini=true)](https://npmjs.org/package/popoff/)


```js
import createPopup from 'popoff';

//create and show modal
var modal = createPopup({
	type: 'modal',
	content: `
		<h2>Blah</h2>
		<p>blah</p>
	`
});
modal.show();

//create and show dropdown
var dropdown = createPopup({
	target: '#menu',
	type: 'dopdown',
	content: document.querySelector('#content')
});
document.querySelector('#menu').click();
```

## API

### `let popup = new Popup({type, effect, container, ...});`

Create popup instance based on passed options.

```js
// modal, dropdown, tooltip, sidebar work out of the box. Otherwise define custom options below. See demo for examples.
type: 'modal',

// target element that enables the popup, e.g. button.
target: null,

// an element to place popup into
container: document.body || document.documentElement,

// show overlay, will be detected based off type
overlay: true,

// show close button
closable: true,

// close by escape
escapable: true,

// show tip
tip: false,

// animation effect, see effects in the demo page
effect: 'fade',

// additional style rules for popup
style: {}
```

### `popup.show(myButtonEl, () => {});`

Show popup relative to the target element, invoke callback after animation end. Target and callback are optional.

### `popup.hide(() => {});`

Hide popup, invoke callback after animation end. Callback is optional.

### `popup.update();`

Update popup position, in case of resize etc. Optionally pass an options to redefine params.

```js
popup.update({
	target: this._target || this.target,
	side: this.side,
	align: this.align,
	within: window
});
```
### `popup.on('show', () => {});`

Invoke callback on event, one of the following: `show`, `hide`, `afterShow`, `afterHide`, `update`.


## Credits

Popoff engages practices of old [overlay-component](https://github.com/component/ovelay) and [dialog-component](https://github.com/component/dialog), refined and mixed with modern ES6 and browserify component approaches.
List of effects is taken from [modal window effects](https://github.com/codrops/ModalWindowEffects) article from codrops, so big thanks to them for awesome lib.

## See also

* [prama](https://github.com/dfcreative/prama) — settings page constructor.
* [placer](https://github.com/dfcreative/placer) — place any element relative to any other element in any way.
* [aligner](https://github.com/dfcreative/aligner) — align elements set by one or other side.

## Related

* [dialogs](https://github.com/jameskyburz/dialogs) — simple dialogs: alert, confirm etc.
