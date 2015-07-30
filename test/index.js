var Poppy = require('poppy');
var ipsum = require('lorem-ipsum');
var Draggable = require('draggy');
var Resizable = require('resizable');


var body = document.body,
	doc = document,
	root = doc.documentElement,
	p = doc.querySelector('#playground');


describe('type', function(){
	it('dropdown', function(){
		var target = document.createElement('div');
		target.innerHTML = this.test.title;
		target.className = 'target';
		p.appendChild(target);

		var poppy = new Poppy(ipsum({count: 3, units: 'paragraph', format: 'html'}), {
			target: target,
			type: 'dropdown'
		});
	});

	it('tooltip', function(){
		var target = document.createElement('div');
		target.innerHTML = this.test.title;
		target.className = 'target';
		p.appendChild(target);

		var poppy = new Poppy(ipsum({count: 3, units: 'paragraph', format: 'html'}), {
			target: target,
			type: 'tooltip'
		});
	});

	it('dialog', function(){
		var target = document.createElement('div');
		target.innerHTML = this.test.title;
		target.className = 'target';
		p.appendChild(target);

		var el = document.createElement('div');
		el.innerHTML = ipsum({count: 3, units: 'paragraph', format: 'html'});

		var poppy = new Poppy(el, {
			closable: true,
			escapable: true
		});

		target.onclick = function () {
			poppy.show();
		}

		Draggable(el);
		Resizable(el);
	});
});