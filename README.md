# What's Above Me?
> 
> A new tab page for your web browser showing the Earth and the ISS, along with live position details! Powered by Three.js and Vite. Check out a preview [here](https://ronakbuilds.tech/whats-above-me)

<img src="previews/preview.gif" alt="preview" width="600">

## Installation

Install **What's Above Me?** from the Chrome Web Store: TBA

Then open a new tab. You should see the Earth, the ISS and the clock.

### Install manually
1. Download or clone this repository.
2. In Chrome, open `chrome://extensions` and turn on **Developer mode** (top-right toggle).
3. Click **Load unpacked** and choose the `dist` folder.

When Chrome asks, accept the permissions:
- **Favicons:** shows each shortcut's icon from Chrome's own favicon cache.
- **Read data on `api.wheretheiss.at`:** fetches the ISS's live position.

## Features
- **3D Earth** that rotates slowly and switches to the night map (city lights) between 7:00pm and 5:00am.
- **ISS on a glowing orbit.** Hover over the ISS to see its live latitude, longitude, altitude and velocity, refreshed every 5 seconds.
- **Clock** in the top-left corner.
- **Shortcut tiles** under the clock:
  - Click **+** to add a website.
  - Right-click a tile to remove it.
  - Shortcuts are saved in your browser.

## Development

Requirements: [Node.js](https://nodejs.org/) 20 or newer.

```bash
npm install
npm run dev     # local dev server at http://localhost:5173
npm run build   # production build into dist/
```

To test the extension from source:
1. Run `npm run build`.
2. In `chrome://extensions`, click **Load unpacked** and select the `dist` folder.
3. After making changes, run `npm run build` again and click the reload ↻ icon on the extension's card.

## Project structure
```
index.html              Page layout: clock, shortcuts, links, ISS info box
src/main.js             Three.js scene, ISS data, shortcuts logic
src/style.css           Styles
public/manifest.json    Chrome extension manifest (new tab override)
public/textures/        Earth day and night textures
```

## Credits
- ISS position data: [Where the ISS at?](https://wheretheiss.at/) API
- Earth textures: [Solar System Scope](https://www.solarsystemscope.com/textures/)
- Built with [Three.js](https://threejs.org/) and [Vite](https://vite.dev/)

Made for Stardance | Hackclub 2026

