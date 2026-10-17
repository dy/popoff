export interface Options {
  /** ms a pointer rests before a tooltip or a hover card shows (500) */
  delay?: number
  /** ms a hover card stays once the pointer or focus has left (300) */
  hide?: number
  /** px between a thing and what it shows (8) */
  gap?: number
  /** px kept clear of the window's edge (8) */
  edge?: number
  /** titles as tooltips (true) */
  tips?: boolean
  /** the default look (true); false: the page styles .popoff-tip itself */
  style?: boolean
}
/** Starts popoff on `root` (document); returns what stops it. */
export default function popoff(root?: Document | Element, options?: Options): () => void
/** A title read as a tooltip says it: its name, its keys, what it does. */
export function parse(title: string): { name: string, keys: string, body: string }
/** Puts `el` by `anchor` on `side`, flipped and kept in the window; returns the side taken. */
export function place(el: HTMLElement, anchor: Element | DOMRect, options?: { side?: 'top' | 'bottom' | 'left' | 'right', align?: 'start' | 'center' | 'end', gap?: number, edge?: number }): 'top' | 'bottom' | 'left' | 'right'
