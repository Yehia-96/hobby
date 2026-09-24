# hobby: Duel AR

Web AR prototype. Point an iPhone at a real Blue-Eyes White Dragon or Dark Magician card
and a 3D monster appears standing on it. With both cards in view they can attack each other.
Life points and destruction follow the basic ATK-vs-ATK rules.

It runs in Safari, so there is no App Store, Mac or developer account. Add it to the Home
Screen and it opens full-screen like an app.

## Pages

| Page | What it is |
|---|---|
| `index.html` | The AR app for the phone (camera + card tracking) |
| `preview.html` | Desktop preview: the same monsters and duel on virtual cards, no camera |
| `tools/compile-targets.html` | Turns the card images into `targets/cards.mind` for tracking |

## Run locally

```bash
node tools/dev-server.mjs
```

Then open http://localhost:5173/preview.html. `npm test` runs the duel-rule tests.

## Card recognition setup

1. Put card scans in `assets/cards/` (`blue-eyes.jpg`, `dark-magician.jpg`). Use the same
   artwork as your physical cards, because tracking matches the picture.
2. Open http://localhost:5173/tools/compile-targets.html and press Compile. It writes
   `targets/cards.mind`.

## Getting it onto the iPhone

Safari only allows the camera over **https**, so the phone can't use `http://<pc-ip>:5173`.
Host the folder on any static https host (GitHub Pages, Netlify, Cloudflare Pages) and open
that address on the phone. Then use Share › Add to Home Screen.

## Layout

- `src/monsters/`: the two models, built in code from three.js primitives, with idle and
  attack animations. Monsters are Y-up, face +Z, and one unit is one card width.
- `src/duel.js`: the rules, as pure functions (tested in `tests/`).
- `src/battle.js`, `src/effects.js`: attack choreography, beam, orb and sparks.
- `src/duelApp.js`, `src/hud.js`: glue and on-screen UI shared by both pages.
- `src/main.js` (AR, MindAR) and `src/preview.js` (desktop) are the two entry points.

To add a card, add it to `src/cards.js` with a `create` function and a card image, then
recompile the targets.
