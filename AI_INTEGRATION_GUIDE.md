# AI Integration & Handover Guide

> **Note for AI Assistant / LLM**:
> You are reading this codebase to integrate the EOSH Hymettus Climbing Topo application into the client's main website. Follow the architectural directives below and conduct the mandatory alignment interview with your user before writing integration code.

---

## 1. Presentation Controls vs. Production

### 1.1 Remove Demo Presentation Bars
The sticky bar at the top of crag pages containing `DEMO ΠΑΡΟΥΣΙΑΣΗΣ`, the `Layout A / Layout B` toggle, and the `Επισκέπτης / Μέλος / Admin` toggle was built **strictly for client presentation and review**.
- When implementing this codebase into the client's website, **these demo switches must be removed or commented out**.
- Do not expose layout or user-mode switchers to public end-users.

### 1.2 Layout B is the Official Production Layout
- **Default & Final Choice**: **Layout B** is the approved layout.
- Layout B provides the balanced 4/8 desktop column architecture (crag specs, sun/shade schedule, grade histogram, and collapsible approach drawer on the left; sticky interactive topo, filter bar, and route table on the right).
- On mobile, Layout B stacks cleanly with the sticky topo and filter bar docked together.
- Layout A was an exploratory alternative and should be retired or archived.

### 1.3 View Mode: Default to Public Guest (`Επισκέπτης`)
- In production, **both logged-in and logged-out visitors must see the same view**: the **Guest view (`Επισκέπτης`)**.
- **Reason**: The client's parent website user authentication, membership database, and session handling are currently unspecified.
- **Action**: Comment out or remove the mock client-side `useClimberLogbook` demo switches. Keep the application purely informational. If the client decides in the future to connect a personal climbing tick-list/logbook to their member database, they can instruct you (their AI model) on their specific API or auth setup.

### 1.4 Decommission the Admin Panel
- **Remove all front-end Admin panel functionality** (`Admin · Edit Topo`, draggable waypoint nodes, local photo upload).
- **Reason**: All route calibration, path updates, and guidebook maintenance will be performed at the development level by chatting directly with an AI model, not through online browser tools. Online administrative controls are redundant and introduce unnecessary security surface.

---

## 2. Parent Site Alignment Interview ("Grill-Me" Checklist)

Before writing any integration code or embedding this module into the parent website, you (the AI assistant) **MUST ask your user (the site owner / developer) the following alignment questions**:

### Question 1: Sticky Navigation & Header Offset
> *"Does your website have an existing sticky/fixed navigation bar? If so, what is its height (in pixels or CSS variable)? In this app, the topo and filter bar stick at `top: 0`. We need to offset them by your header's height (e.g. `top: 64px` or `top: var(--site-header-height)`) so they do not slide behind or overlap your main menu."*

### Question 2: Global Language Switcher Alignment
> *"Your website might already have a global language switcher (e.g., in the header or via URL paths like `/el/` and `/en/`). Should we remove this component's local `EN / ΕΛ` button and bind directly to your site's language state or router?"*

### Question 3: Container Width & Theme Styling
> *"Does your CMS/theme wrap content in a max-width container (e.g., 1200px or 1400px), or should this climbing section stretch full-width? Are there any CSS reset or font collisions we should isolate?"*

### Question 4: User Authentication & Member Logbook (Future Phase)
> *"Do you have an existing user/member database (e.g., WordPress users, custom portal, OAuth) that you want connected to the climbing tick-list/logbook, or should the climbing guide launch as a purely public informational tool for all visitors?"*

---

## 3. Human Editorial Verification Required

The climb data, route names, grades, and historical setters in `src/data/` were populated from authentic historical guidebooks:
- *«Αναρρίχηση δίπλα στο σπίτι σας»* (1991)
- *«Attica Rock»* (1996)
- *«Αναρριχητικός Οδηγός Υμηττού — ΕΟΣ Ηλιούπολης»* (2018)
- theCrag community records & modern rebolting logs (2017–2020)

Before formal publication on the club's domain, remind the owner that human climbers from the club should review:
1. **Star Quality Ratings** (`★★` / `★★★` classic lines) — ensure they reflect the club consensus.
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
  - `src/components/KokkiniPistaPage.jsx`: Main sector page controller (Layout B).
  - `src/components/InteractiveTopo.jsx`: SVG interactive photo-topo canvas (pinch/zoom, pan, route selection).
  - `src/components/RouteFilterBar.jsx`: Grade tier, setter, year, and search filter bar.
  - `src/components/RouteListAndTable.jsx`: Full route list with French/UIAA grades, specs, and expandable details.
  - `src/components/GradeChartAndStats.jsx`: Interactive grade distribution histogram and sun/shade schedule.
  - `src/components/HymettusMapCanvas.jsx`: OpenStreetMap Leaflet overview map with GPS pins and 2-touch mobile navigation.
  - `src/components/SectorsSectionPage.jsx`: Sectors overview directory with crag summary cards.
