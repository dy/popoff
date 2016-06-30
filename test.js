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
body.style.minHeight = '100vh';
body.style.padding = '3rem 2rem 6rem';
body.style.maxWidth = '80vw';
body.style.margin = 'auto';
body.style.lineHeight = 1.5;
body.style.fontFamily = 'sans-serif';
body.innerHTML = `
<img src='./popoff.png' alt="Señor Popov. Попов Александр Степанович, портрет гравюра." style="display: block; margin: auto;"/>
<h1 style="text-align:center">Señor Popoff</h1>
${ipsum({count: 15, units: 'paragraph', format: 'html'})}
<a href="https://github.com/dfcreative/popoff" style="display: block; text-align: center; text-decoration: none; color: black;"><svg style="width: 3rem; height: 3rem;" xmlns="http://www.w3.org/2000/svg" width="784" height="1024" viewBox="0 0 784 1024"><path d="M4.168 480.005q0 107.053 52.114 194.314 52.114 90.085 141.399 141.799t194.314 51.714q105.441 0 195.126-51.714 89.685-52.114 141.199-141.599t51.514-194.514q0-106.652-51.714-195.126-52.114-89.685-141.599-141.199T392.007 92.166q-107.053 0-194.314 52.114-90.085 52.114-141.799 141.399T4.18 479.993zm64.634 0q0-64.634 25.451-124.832t69.482-103.828q44.031-44.031 103.828-69.282t124.432-25.251 124.832 25.251 104.229 69.282q43.631 43.631 68.882 103.828t25.251 124.832q0 69.482-28.487 132.504t-79.989 108.876-117.76 66.458V673.919q0-42.419-34.747-66.257 85.238-7.672 124.632-43.23t39.383-112.712q0-59.786-36.759-100.593 7.272-21.815 7.272-42.018 0-29.899-13.732-54.939-27.063 0-48.478 8.884t-52.515 30.699q-37.571-8.484-77.565-8.484-45.654 0-85.238 9.295-30.299-22.216-52.314-31.311t-49.891-9.084q-13.332 25.451-13.332 54.939 0 21.004 6.871 42.419-36.759 39.594-36.759 100.192 0 77.165 39.183 112.312t125.644 43.23q-23.027 15.355-31.911 44.843-19.792 6.871-41.207 6.871-16.156 0-27.875-7.272-3.636-2.024-6.66-4.236t-6.26-5.448-5.248-5.048-5.248-6.26-4.236-5.659-4.848-6.46-4.236-5.659q-18.991-25.051-45.243-25.051-14.143 0-14.143 6.06 0 2.424 6.871 8.083 12.931 11.308 13.732 12.12 9.696 7.672 10.908 9.696 11.719 14.544 17.779 31.911 22.627 50.502 77.565 50.502 8.884 0 34.747-4.036v85.649q-66.257-20.603-117.76-66.458T97.346 612.533 68.859 480.029z"/></svg></a>
`;


test.skip('overlay', function (done) {
	this.timeout(Infinity);

	var o = Overlay();

	o.show();

	// setTimeout(() => {
		o.on('hide', done);
	// }, 1000);
});


test('modal', function () {
	var target = document.createElement('span');
	target.innerHTML = 'Modal';
	target.className = 'target';
	target.style.background = 'black';
	target.style.color = 'white';
	target.style.padding = '10px';
	document.querySelectorAll('p')[1].appendChild(target);

	var p = Popup({
		overlay: true,
		content: `
			<h2>Modal</h2>
			<br/>
			${ipsum({count: 3, units: 'paragraph', format: 'html'})}
		`
	});

	// p.show();
	target.addEventListener('click', e => {
		p.show(target);
	});
});


test('sidebar', function () {
	var target = document.createElement('span');
	target.innerHTML = 'Sidebar';
	target.className = 'target';
	target.style.background = 'black';
	target.style.color = 'white';
	target.style.padding = '10px';
	document.querySelectorAll('p')[2].appendChild(target);

	var p = Popup({
		type: 'sidebar',
		content: `
			<h2>Settings</h2>
			<br/>
			${ipsum({count: 3, units: 'paragraph', format: 'html'})}
		`
	});

	// p.show();
});


test('dropdown', () => {
	var target = document.createElement('span');
	target.innerHTML = 'Dropdown';
	target.className = 'target';
	target.style.background = 'black';
	target.style.color = 'white';
	target.style.padding = '10px';
	document.querySelectorAll('p')[3].appendChild(target);

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
	var target = document.createElement('span');
	target.innerHTML = 'Tooltip';
	target.className = 'target';
	target.style.background = 'black';
	target.style.color = 'white';
	target.style.padding = '10px';
	document.querySelectorAll('p')[4].appendChild(target);

	var content = document.createElement('div');
	content.innerHTML = ipsum({count: 1, units: 'paragraph', format: 'html'});

	var tooltip = new Popup({
		content: content,
		target: target,
		type: 'tooltip'
	});
});


test.skip('dialog draggable & resizable', () => {
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