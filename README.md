[![Popov](https://raw.githubusercontent.com/dy/popoff/gh-pages/popoff.png "Popov")](https://en.wikipedia.org/wiki/Alexander_Stepanovich_Popov)

# Popoff [![npm](https://img.shields.io/npm/v/popoff)](https://npmjs.org/package/popoff) [![size](https://img.shields.io/bundlejs/size/popoff)](https://bundlejs.com/?q=popoff)

Tooltips, dropdowns, hover cards and modals, done one way, on the platform's own `popover` and `<dialog>`. **[Demo](https://dy.github.io/popoff/)**.

The markup says what is what. Popoff adds only what browsers leave to each page:

| Markup | Popoff adds |
|---|---|
| `title="Undo (⌘Z)"` | A tooltip: the name, the keys, a line of what it does, a tip pointing at the control |
| `popover data-place="bottom start"` | The popover placed by what opened it: CSS anchor positioning, measured where the browser lacks it |
| `interestfor="card"` | A hover card: the popover shows while its invoker is pointed at or focused |
| `<dialog closedby="any">` | A click on the backdrop closes it, where the browser doesn't do it yet |

Delegated listeners on one root, nothing per element; a position is measured only when something shows. No dependencies, 3.6 kB gzipped.

## Usage

```html
<script type="module" src="https://unpkg.com/popoff/start.js"></script>

<button title="Undo (⌘Z)">↶</button>
<button title="Play (Space)&#10;Hold and drag to rewind">▶</button>

<button popovertarget="menu">File</button>
<div id="menu" popover data-place="bottom start">…</div>

<a href="/dy" interestfor="profile">@dy</a>
<div id="profile" popover="hint" data-place="top">…</div>

<dialog closedby="any">…</dialog>
```

Or as a module:

```js
import popoff from 'popoff'

const stop = popoff(document, { delay: 500 })
// stop() takes it all away, the titles left as they were
```

## Tooltips

Any element's `title` becomes a tooltip. The title stays the source: the browser's own tooltip never shows, and the
`title` attribute is back once the pointer leaves, so assistive tech and other scripts still read it.

The title is read this way:

* the first line, or the text before `: `, is the **name**;
* `(⌘K)`, `(Ctrl+K)`, `(Space)`, `(B)` at the end is the **shortcut**, set softer after the name;
* the rest is **what it does**.

```
Play (Space)
Hold and drag to rewind
```

It shows `delay` ms after the pointer settles. The next one waits the same `delay`, so a pointer crossing a toolbar
opens nothing. It doesn't show:

* after a press, until the pointer leaves;
* for a control whose menu or popover is open (`aria-expanded`, `popovertarget`, `interestfor`), or for a menubar
  item while another of its menus is open;
* on touch.

It sits under the control, over it near the bottom of the window, and beside a menu's rows (`role="menu"`,
`role="listbox"`). A title changed while it shows (Play turning Pause) shows at once.

## Placed popovers

`data-place="side align"` puts a popover next to whatever opened it. `side` is `top`, `bottom`, `left` or `right`;
`align` is `start`, `center` or `end` (default `bottom start`: a dropdown's left edge under its button's).

Browsers with CSS anchor positioning get it in CSS (`position-anchor`, `position-area`, `position-try-fallbacks:
flip-block, flip-inline`) and keep it in place themselves. Elsewhere popoff measures it on opening, on scroll and on
resize, flips it when there's no room, and keeps it inside the window.

Without `data-place`, a popover is left alone: style it with `position-area` yourself.

## Hover cards

`interestfor="id"` shows the popover `id` after its invoker has been pointed at or focused for `delay` ms. It hides
`hide` ms after the pointer or focus has left both the invoker and the card. This follows the
[interest invokers](https://open-ui.org/components/interest-invokers.explainer/) proposal and steps aside where the
browser has them.

## Modals

`<dialog closedby="any">`, opened with `showModal()`, closes on a click on its backdrop.

## API

### `popoff(root = document, options) → stop`

| Option | Default | |
|---|---|---|
| `delay` | `500` | ms a pointer rests before a tooltip or a hover card shows |
| `hide` | `300` | ms a hover card stays once left |
| `gap` | `8` | px between a control and what it shows |
| `edge` | `8` | px kept clear of the window's edge |
| `tips` | `true` | titles as tooltips |
| `style` | `true` | the default look; `false`: style `.popoff-tip` yourself |

### `parse(title) → { name, keys, body }`

A title read the way the tooltip reads it.

### `place(el, anchor, { side, align, gap, edge }) → side`

Puts a fixed element by an element or a rect, flipped and kept inside the window. Sets `data-side` and
`--popoff-arrow` (the anchor's middle along that side) for drawing a tip. Returns the side it took.

## Style

The look is set by variables. Its rules are specific enough (`[popover].popoff-tip`) that a page's own `[popover]`
styles don't reach the tooltip; restyle it through the variables, or pass `style: false` and style it all yourself:

```css
:root {
  --popoff-bg: #1e1e1e;      /* the tag */
  --popoff-ink: #fff;        /* the name */
  --popoff-soft: #ffffffb3;  /* what it does */
  --popoff-muted: #ffffff80; /* the keys */
  --popoff-keys-font: inherit;
  --popoff-font: 11.5px/16px system-ui, sans-serif;
  --popoff-radius: 6px;
  --popoff-shadow: drop-shadow(0 0 .5px #0006) drop-shadow(0 3px 8px #0004);
  --popoff-fade: 90ms;
}
```

The parts: `.popoff-tip` (with `data-side`), `.popoff-tip-head`, `.popoff-tip-name`, `.popoff-tip-keys`,
`.popoff-tip-body`.

## Before 3

Popoff 2 drew its own modals, overlays and effects (2016, browserify). Browsers now have `popover`, `<dialog>` and
anchor positioning, so 3 keeps only what they leave out. 2.x stays on npm as `popoff@2`.

## See also

* [sprae](https://github.com/dy/sprae): reactive HTML attributes, the same markup-first way.

<p align="center"><a href="./LICENSE">MIT</a> · <a href="https://krishnized.github.io/license">ॐ</a></p>
