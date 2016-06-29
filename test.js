var ipsum = require('lorem-ipsum');
var Draggable = require('draggy');
var Resizable = require('resizable');
var test = require('tst');
var Overlay = require('./overlay');
var Popup = require('./');

var body = document.body,
	doc = document,
	root = doc.documentElement;

body.style.position = 'relative';
body.style.margin = 0;
body.style.minHeight = '100vh';
body.style.fontFamily = 'sans-serif';
body.innerHTML = `${ipsum({count: 15, units: 'paragraph', format: 'html'})}`;


test('overlay', function (done) {
	this.timeout(Infinity);

	var o = Overlay();

	o.show();

	// setTimeout(() => {
		o.on('hide', done);
	// }, 1000);
});


test('modal', function () {
	this.timeout(Infinity);

	var p = Popup({
		overlay: true,
		content: `
			<h2>Settings</h2>
			<br/>
			${ipsum({count: 3, units: 'paragraph', format: 'html'})}
		`
	});
	p.show();

});


test('sidebar', function () {
	this.timeout(Infinity);

	var p = Popup({
		overlay: true,
		type: 'sidebar',
		content: `
			<h2>Settings</h2>
			<br/>
			${ipsum({count: 3, units: 'paragraph', format: 'html'})}
		`
	});
	p.show();

});


test.only('dropdown', () => {
	var target = document.createElement('span');
	target.innerHTML = 'Dropdown';
	target.className = 'target';
	target.style.background = 'black';
	target.style.color = 'white';
	target.style.padding = '10px';
	document.querySelectorAll('p')[2].appendChild(target);

	var content = document.createElement('div');
	content.innerHTML = ipsum({count: 1, units: 'paragraph', format: 'html'});
	document.body.appendChild(content);

	var dropdown = new Popup({
		content: content,
		target: target,
		type: 'dropdown'
	});

	// dropdown.show();
});

test('tooltip', () => {
	var target = document.createElement('div');
	target.innerHTML = this.test.title;
	target.className = 'target';
	p.appendChild(target);

	var popoff = new Popup(ipsum({count: 3, units: 'paragraph', format: 'html'}), {
		target: target,
		type: 'tooltip'
	});
});


test('dialog draggable & resizable', () => {
	var target = document.createElement('div');
	target.innerHTML = this.test.title;
	target.className = 'target';
	p.appendChild(target);

	var el = document.createElement('div');
	el.innerHTML = ipsum({count: 3, units: 'paragraph', format: 'html'});

	var popoff = new Popup(el, {
		closable: true,
		escapable: true
	});

	target.onclick = function () {
		popoff.show();
	}

	Draggable(el);
	Resizable(el);
});