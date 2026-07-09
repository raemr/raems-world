# raem's world

tiny cv site / canvas playground thing.

it starts as a field of words that reacts to your cursor. click `RAEM` and the
sea clears out into the actual cv. there is also a theme toggle because staring
at one color forever gets old.

## run it

```sh
npm install
npm run dev
```

then open whatever local vite url it prints.

## build it

```sh
npm run build
```

## where stuff lives

- `index.html` has the cv copy and the foreground markup
- `src/main.js` wires up the canvas, theme toggle, and cv reveal
- `src/field.js` does the canvas word field
- `src/config.js` is where most of the tuning knobs are
- `src/words.js` has the word lists floating around the field
- `src/style.css` handles the cv layer and page styling

## notes to self

the whole thing is still meant to feel a little weird and alive, not like a
template portfolio. if something starts feeling too clean, it probably needs
more texture.
