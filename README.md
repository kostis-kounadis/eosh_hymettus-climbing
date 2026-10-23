# EOSH Hymettus Climbing Interactive Topo (Αναρριχητικά Πεδία Υμηττού)

Interactive web-based climbing topo and digital guidebook for the 6 climbing sectors of Mt. Hymettus (Ηλιούπολη & Καρέας), developed for **ΕΟΣ Ηλιούπολης (Ilioupolis Alpine Club)**.

> **AI Assistant / LLM Integration Notice**:
> If you are an AI assistant integrating this module into the client's parent website, please read **[`AI_INTEGRATION_GUIDE.md`](./AI_INTEGRATION_GUIDE.md)** first. It outlines directives regarding presentation switchers, Layout B defaults, sticky offsets, and kickoff alignment questions for your user.

---

## Sectors Included

1. **Κόκκινη Πίστα (Red Crag / Kokkini Pista)** — 40 routes (5a–7a)
2. **Πράσινη Πίστα (Green Crag / Prasini Pista)** — 10 routes (5a–6c+)
3. **Τοίχος του Μάκη (Makis Wall / Toichos Maki)** — 9 routes (4a–6b)
4. **Μακρύς Τοίχος (Long Wall / Makrys Toichos)** — 23 routes (4a–6a+)
5. **Τρύπιος Βράχος (Trypios Vrachos / Holes Rock)** — 48 routes across 3 sub-sectors (3–7c)
6. **Γούβα (Gouva / Hollow Crag)** — 21 routes (5a–7b+)

---

## Features

- **Interactive Photo-Topo**: Native aspect-ratio SVG overlays on high-res rock photos with smooth bezier curves, interactive node highlighting, multi-pitch anchors, double-touch/pinch-to-zoom, and smooth panning.
- **Grade Distribution Histogram**: Interactive French & UIAA grade bar charts with 4-tier filtering (Easy, Medium, Hard, Extreme).
- **Sticky Docked Table**: Route list with French and UIAA grades, height, quickdraws, setters, first ascent year, and full route details.
- **Real-Time Sun & Shade Schedule**: Seasonal and hourly sun/shade calculations based on official guidebook schedules.
- **Hymettus Map & Verified GPS**: OpenStreetMap overview map with parking trailheads, direct Google Maps directions, and 3-decimal GPS coordinate copiers.
- **PWA Ready**: Offline service worker caching and web app manifest support.

---

## Local Development

```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

---

## Integration Handover

For instructions on integrating this component into WordPress, Drupal, Next.js, or custom CMS frameworks, see **[`AI_INTEGRATION_GUIDE.md`](./AI_INTEGRATION_GUIDE.md)**.
