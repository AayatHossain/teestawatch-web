# TeestaWatch

**Flood maps, riverbank erosion and village risk for the Teesta River in Bangladesh, built from NASA Earth observation data.**

Team Phantom Troupe · NASA Space Apps Challenge 2026 · Rangpur, Bangladesh · Challenge: *Dancing with the SARs*

TeestaWatch shows where the Teesta has flooded, how fast it is eating its banks, where it is set to strike next year, and the chance that it reaches each village and home within 1, 3 or 5 years.

---

## How to use the website

The menu at the top switches between five pages. Everything works with a mouse or a finger. On the maps:
- **scroll** to zoom;
- **drag** to move;
- **right-click and drag** (or two-finger drag) to tilt and rotate.

### 1. Home
- The opening view is a live 3D satellite map of the Teesta that slowly turns.
- Scroll down for the key numbers and the three main features.
- **Find your village** takes you straight to the village search.

### 2. Floods — *where the water went*
1. Choose a flood at the top of the panel: **2017, 2020, 2024 or 2025**.
2. The map switches between **Before** and **During flood** by itself. Press a button to choose one, or **⏸** to stop the switching.
3. **Dark blue** is the normal river; **bright cyan** is new flood water.
4. The panel shows how much land was newly flooded, and the water area before and during the flood.
5. The small bar chart compares all four floods. Click a bar to open that flood.

### 3. Riverbank — *a river on the move*
1. Press **▶ Play** to watch the river from **2016 to 2026**, or drag the slider or click a year.
2. **Blue** is the river channel that year; **orange** is land the river has taken since 2016.
3. The panel shows the land taken that year and the total since 2016. The chart at the bottom shows every year at a glance.
4. Choose **2027** to see the forecast. The map flies to the most threatened stretch and shows next year's **high-risk (red)** and **medium-risk (yellow)** land, with the hectares at risk.

### 4. Villages — *is the river coming?*
1. Type a **village, union or upazila** name in the search box and pick a result. The map flies there.
2. Or click any dot on the map. Dot colours:
   - 🔴 **High risk**: within 400 m of the river, or the river is expected within 2 years;
   - 🟡 **Medium risk**: within 1 km, or within 5 years;
   - 🟢 **Low risk**.
3. The village card shows:
   - the **chance the river reaches it** within **1, 3 and 5 years**;
   - the number of **homes**;
   - the **distance to the river**;
   - **how many homes are within the river's reach** in 5 years.
4. Use the **High / Medium / Low** buttons to show only one risk level.
5. **Zoom in close** to see individual homes, coloured by their own risk.
6. With no village selected, the panel lists the **most exposed settlements**. Click one to jump to it. Press **✕** to go back to the whole river.

### 5. How it works
- How the satellite data becomes these maps, in four steps.
- How accurately each part was tested on real past events.

---

## Run it on your computer

You need **Node.js 18 or newer** ([nodejs.org](https://nodejs.org)).

```bash
git clone https://github.com/AayatHossain/teestawatch-web.git
cd teestawatch-web
npm install        # first time only
npm run dev        # then open the link it prints, e.g. http://localhost:5173
```

To make the finished website:

```bash
npm run build      # creates the dist/ folder
npm run preview    # check the built site locally
```

## Put it online

`dist/` is a plain static website. It uses relative paths and `#` page links, so it works from any web address with no server set-up.

- **GitHub Pages** (the repository must be public, or on a paid plan):
  1. Run `npm run build`.
  2. Publish the contents of `dist/` to a `gh-pages` branch, for example with `npx gh-pages -d dist`.
  3. In the repository go to *Settings → Pages* and choose that branch.
- **Netlify or Vercel:** import the repository with build command `npm run build` and output folder `dist`. Or drag the `dist/` folder onto [app.netlify.com/drop](https://app.netlify.com/drop).

---

## What's inside

```
public/data/          all map layers and numbers used by the site (~8 MB)
  stats.json          headline numbers, flood areas, land lost per year, forecast, accuracy
  flood/*.png         flood water overlays, before and during each flood
  river/*.png         river channel for each year, the 2027 forecast and its highlight
  villages.geojson    7,664 settlements: name, union, upazila, district, homes, risk, chances
  houses.geojson      homes with at least a 5% chance of river arrival within 5 years
  river_line.geojson  the 2026 riverbank line
src/
  pages/              Home, Floods, River (riverbank), Villages, How
  components/         map, navigation bar, animated counters and cards
  lib/                data loading and map helpers
```

The files in `public/data/` are produced by the TeestaWatch analysis pipeline (`src/s25_web_export.py` in the analysis project). To update the website, re-run that script and copy in the new files.

## Built with

React 19 · TypeScript · Vite · Tailwind CSS · Framer Motion · MapLibre GL JS · Recharts · Fuse.js

## Data sources

| Data | Source |
|---|---|
| Sentinel-1 radar | NASA ASF HyP3 |
| Landsat and Sentinel-2 optical images | NASA Harmonized Landsat Sentinel-2 (HLS) |
| Surface water reference | NASA/JPL OPERA DSWx |
| Elevation | NASADEM |
| Buildings | Google Open Buildings |
| Administrative boundaries | geoBoundaries |
| Place names | OpenStreetMap |
| Basemap imagery and labels | © Esri, Maxar, Earthstar Geographics |
