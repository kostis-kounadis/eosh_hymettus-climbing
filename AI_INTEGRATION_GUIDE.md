# AI Integration & Handover Guide for eosh.gr

> **Context for the AI Assistant / LLM**:
> This repository is a dedicated, production-ready interactive climbing topo proposal built specifically for the official website of **Ε.Ο.Σ. Ηλιούπολης (EOSH)** at **`https://eosh.gr/`**, to be integrated into the existing subpage:
> **`https://eosh.gr/hymettus/climbing`** *(«Αναρρίχηση στον Υμηττό»)*.
>
> This is **not** a generic CMS plugin or standalone concept. It shares the same React + Tailwind CSS technology stack as `eosh.gr`. As the AI maintaining or integrating into `eosh.gr`, you have direct access to the parent site codebase and can execute the following architectural directives immediately without asking the user redundant alignment questions.

---

## 1. Direct Integration Decisions (No User Interview Needed)

### 1.1 Remove Demo Presentation Bars
The sticky container at the top of sector pages containing:
- `DEMO ΠΑΡΟΥΣΙΑΣΗΣ` pill
- `Layout A / Layout B` toggle
- `Επισκέπτης / Μέλος / Admin` toggle

was built strictly for the club review and demonstration meetings.
- **Action**: Comment out or delete this entire presentation bar in [`src/components/SectorDetailPage.jsx`](file:///Users/kkounadi/Desktop/antigravity-projects/_eosh_climbing/src/components/SectorDetailPage.jsx).

### 1.2 Layout B is the Approved Production Layout
- **Decision**: **Layout B** is the permanent, final design.
- **Desktop**: 4/8 column split (crag metadata, sun/shade schedule, grade distribution histogram, and collapsible access/approach drawer on the left; sticky interactive topo, filter bar, and route table on the right).
- **Mobile**: Clean vertical stack where the topo and filter bar dock together below the header.
- **Action**: In `SectorDetailPage.jsx`, enforce `isLayoutB = true` permanently. Layout A was an exploratory alternative and can be retired.

### 1.3 User Mode: Lock to Public Guest (`Επισκέπτης`)
- **Decision**: All visitors see the **Guest view (`Επισκέπτης`)**.
- **Reason**: The parent site's member database, auth tokens, and session handling belong to `eosh.gr`. Until EOSH decides to build an authenticated member tick-list sync, the climbing guide is a public informational service.
- **Action**: Lock `userMode = 'guest'` and omit mock client-side auth switches.

### 1.4 Decommission the In-Browser Admin Panel
- **Decision**: Completely remove the front-end `Admin · Edit Topo` interface (draggable waypoint nodes, local photo file picker).
- **Reason**: Route calibration, topo lines, and guidebook descriptions will be maintained at the code/version control level by chatting with AI assistants, not through public browser controls.

### 1.5 Global Language Switcher Alignment
- **Decision**: Remove the local `EN / ΕΛ` toggle button from this module's headers.
- **Reason**: `https://eosh.gr/` already provides a global language switcher in its main header (`data-testid="header-lang-toggle"`).
- **Action**: Bind the climbing module's `isGr` boolean directly to the parent `eosh.gr` language context or URL locale state (`el` / `en`).

### 1.6 Sticky Navigation & Header Offset
- **Decision**: Offset the climbing sticky components by the height of `eosh.gr`'s sticky header.
- **Reason**: `https://eosh.gr/` uses a sticky `<header class="bg-white shadow-sm sticky top-0 z-50 ...">` (height ~72px when scrolled, ~118px at top of page).
- **Action**: In [`src/index.css`](file:///Users/kkounadi/Desktop/antigravity-projects/_eosh_climbing/src/index.css) and `SectorDetailPage.jsx`, set the topo sticky container offset to match `eosh.gr`'s header:
  ```css
  .topo-sticky-container {
    position: sticky;
    top: var(--eosh-header-height, 72px); /* Docks cleanly below eosh.gr sticky header */
    z-index: 30;
  }
  ```
  This guarantees that neither the interactive topo nor the route filter bar slides behind the club's main navigation menu.

---

## 2. Page & Sub-Route Hierarchy on `eosh.gr/hymettus/climbing`

On `https://eosh.gr/hymettus/climbing`:

1. **Overview ("Τα Πεδία" Section)**:
   - Mounts [`src/components/SectorsSectionPage.jsx`](file:///Users/kkounadi/Desktop/antigravity-projects/_eosh_climbing/src/components/SectorsSectionPage.jsx), rendering:
     - The interactive Leaflet crag overview map ([`src/components/HymettusMapCanvas.jsx`](file:///Users/kkounadi/Desktop/antigravity-projects/_eosh_climbing/src/components/HymettusMapCanvas.jsx)) with accurate GPS parking trailheads, crag pins, and mobile 2-touch navigation.
     - The 6 crag summary cards linking to each sector's detailed topo.

2. **Crag Detail Pages**:
   - Handled universally by [`src/components/SectorDetailPage.jsx`](file:///Users/kkounadi/Desktop/antigravity-projects/_eosh_climbing/src/components/SectorDetailPage.jsx).
   - Routes can either match the existing standalone paths or subpaths:
     - `/hymettus/climbing/kokkini-pista` (or `sectorKey="kokkini"`)
     - `/hymettus/climbing/toichos-maki` (or `sectorKey="makis"`)
     - `/hymettus/climbing/makrys-toichos` (or `sectorKey="makrys"`)
     - `/hymettus/climbing/prasini-pista` (or `sectorKey="prasini"`)
     - `/hymettus/climbing/trypios-vrachos` (or `sectorKey="trypios"`)
     - `/hymettus/climbing/gouva` (or `sectorKey="gouva"`)
     - Parameterized route: `/hymettus/climbing/:sectorKey`

---

## 3. Human Editorial Verification Required

The climb data, route names, grades, and historical setters in `src/data/` were populated from authentic historical guidebooks:
- *«Αναρρίχηση δίπλα στο σπίτι σας»* (1991)
- *«Attica Rock»* (1996)
- *«Αναρριχητικός Οδηγός Υμηττού — ΕΟΣ Ηλιούπολης»* (2018)
- theCrag community records & modern rebolting logs (2017–2020)

Before formal publication on `eosh.gr`, remind the EOSH climbing committee to review:
1. **Star Quality Ratings** (`★★` / `★★★` classic lines) — ensure they reflect club consensus.
2. **Route Descriptions & Beta Notes** — ensure warnings, protection notes, and access instructions remain current.
3. **Anchor Configurations & Multi-pitch notes** — verify that permanent lower-offs and belay stances match current on-rock reality.

---

## 4. Key File Architecture Quick Reference

- **Crag Catalog & Routes**:
  - `src/data/cragsCatalog.js`: Master registry of all 6 sectors.
  - `src/data/kokkiniPistaRoutes.js`: Kokkini Pista route dataset.
  - `src/data/prasiniPistaRoutes.js`: Prasini Pista route dataset.
  - `src/data/toichosMakiRoutes.js`: Toichos Maki route dataset.
  - `src/data/makrysToichosRoutes.js`: Makrys Toichos route dataset.
  - `src/data/trypiosVrachosRoutes.js`: Trypios Vrachos route dataset (Sectors 1, 2, 3).
  - `src/data/gouvaRoutes.js`: Gouva route dataset.
  - `src/data/sectorsData.js`: Verified GPS coordinates, parking trailheads, and Google Maps pin generators.
- **Components**:
  - [`src/components/SectorDetailPage.jsx`](file:///Users/kkounadi/Desktop/antigravity-projects/_eosh_climbing/src/components/SectorDetailPage.jsx): Universal sector detail controller (Layout B, crag info drawer, GPS buttons, sun chart, topo canvas, route table).
  - [`src/components/InteractiveTopo.jsx`](file:///Users/kkounadi/Desktop/antigravity-projects/_eosh_climbing/src/components/InteractiveTopo.jsx): SVG interactive photo-topo canvas (touch-action aware mobile pinch/zoom, pan, route path highlighting).
  - [`src/components/RouteFilterBar.jsx`](file:///Users/kkounadi/Desktop/antigravity-projects/_eosh_climbing/src/components/RouteFilterBar.jsx): Grade tier, setter, year, and search filter bar.
  - [`src/components/RouteListAndTable.jsx`](file:///Users/kkounadi/Desktop/antigravity-projects/_eosh_climbing/src/components/RouteListAndTable.jsx): Full route list with French/UIAA grades, specs, and expandable details.
  - [`src/components/GradeChartAndStats.jsx`](file:///Users/kkounadi/Desktop/antigravity-projects/_eosh_climbing/src/components/GradeChartAndStats.jsx): Interactive grade distribution histogram and sun/shade schedule.
  - [`src/components/HymettusMapCanvas.jsx`](file:///Users/kkounadi/Desktop/antigravity-projects/_eosh_climbing/src/components/HymettusMapCanvas.jsx): OpenStreetMap Leaflet overview map with GPS pins and 2-touch mobile navigation.
  - [`src/components/SectorsSectionPage.jsx`](file:///Users/kkounadi/Desktop/antigravity-projects/_eosh_climbing/src/components/SectorsSectionPage.jsx): Sectors overview directory with crag summary cards.
