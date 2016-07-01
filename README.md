[![Popov](https://raw.githubusercontent.com/dfcreative/popoff/gh-pages/popoff.png "Popov")](https://en.wikipedia.org/wiki/Alexander_Stepanovich_Popov)

# Popoff [![stable](http://badges.github.io/stability-badges/dist/stable.svg)](http://github.com/badges/stability-badges)

Popoff runs modals, tooltips, popups, dropdowns, confirms, notifiers, popovers, lightboxes, balloons, dialogs, alerts, overlays, sidebars etc. **[Demo](http://dfcreative.github.io/popoff/)**.

## Usage

[![npm install popoff](https://nodei.co/npm/popoff.png?mini=true)](https://npmjs.org/package/popoff/)


```js
var createPopup = require('popoff');

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

```js
var popup = new Popup({
	// modal, dropdown, tooltip, sidebar work out of the box. Otherwise define custom options below.
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

	// exclusive mode
	single: true,

	// animation effect, can be a list or a single
	effect: ['fade', 'scale', 'slide'],

	// additional style rules for popup
	style: {},

	// placing settings relative to the target, see placer module
	side: 'center',
	align: 'center',

	// apply overflow to tall content, useful for modals with much of content
	tall: false
});

//show popup relative to the target
popup.show(target?);

//hide popup
popup.hide();

//update popup position, in case of resize etc.
popup.update({
	target: this._target || this.target,
	side: this.side,
	align: this.align,
	within: window
});

//events
popup.on('show', () => {});
popup.on('afterShow', () => {});
popup.on('hide', () => {});
popup.on('afterHide', () => {});
popup.on('update', () => {});
```

## Credits

Popoff engages practices of old [overlay-component](https://github.com/component/ovelay) and [dialog-component](https://github.com/component/dialog), refined and mixed with modern ES6 and browserify component approaches.
List of effects is taken from [modal window effects](https://github.com/codrops/ModalWindowEffects) article from codrops, so big thanks to them for awesome lib.

## Related

* [placer](https://github.com/dfcreative/placer) - place any element relative to any other element in any way.
* [aligner](https://github.com/dfcreative/aligner) - align elements set by one or other side.