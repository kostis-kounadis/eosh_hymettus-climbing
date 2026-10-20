import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Navigation,
  MapPin,
  Footprints,
  ExternalLink,
  Copy,
  Check,
  Layers,
  Car,
  Mountain,
  Sun,
  ArrowRight,
  Compass,
} from 'lucide-react';
import {
  sectors,
  PARKING_TRAILHEADS,
  APPROACH_TRAILS,
  getGoogleMapsDirectionsUrl,
  getGoogleMapsPinUrl,
  getGoogleMapsEmbedUrl,
} from '../data/sectorsData';

const TILE_LAYERS = {
  satellite: {
    id: 'satellite',
    labelGr: 'Δορυφόρος',
    labelEn: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
    maxZoom: 19,
  },
  topo: {
    id: 'topo',
    labelGr: 'Μονοπάτια (OSM)',
    labelEn: 'Trails (OSM)',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  },
};

export default function HymettusMapCanvas({
  isGr,
  initialSectorKey = 'kokkini',
  initialAreaFilter = 'all', // 'all' | 'Ilioupoli' | 'Karea'
  selectedSectorKey: externalSectorKey,
  onSelectSector,
  onOpenSector,
  onOpenKokkiniTopo,
  compactHeight = false,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersRef = useRef({});

  const [mapMode, setMapMode] = useState('satellite'); // 'satellite' | 'topo' | 'gmaps'
  const [areaFilter, setAreaFilter] = useState(initialAreaFilter);
  const [internalSectorKey, setInternalSectorKey] = useState(initialSectorKey);
  const [copiedCoords, setCopiedCoords] = useState(false);

  const activeSectorKey = externalSectorKey !== undefined ? externalSectorKey : internalSectorKey;

  const handleSelectSector = (key) => {
    setInternalSectorKey(key);
    if (onSelectSector) {
      onSelectSector(key);
    }
  };

  const activeSector =
    sectors.find((s) => s.key === activeSectorKey) ||
    sectors.find((s) => s.key === 'kokkini') ||
    sectors[0];

  const activeParking =
    PARKING_TRAILHEADS[activeSector.parkingId] || PARKING_TRAILHEADS.ilioupoli;

  // Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialCenter =
      initialAreaFilter === 'Ilioupoli'
        ? [37.9316, 23.7732]
        : [37.9352, 23.7745];
    const initialZoom = initialAreaFilter === 'Ilioupoli' ? 16 : 14;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: false,
      scrollWheelZoom: true,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const tileCfg = TILE_LAYERS.satellite;
    tileLayerRef.current = L.tileLayer(tileCfg.url, {
      attribution: tileCfg.attribution,
      maxZoom: tileCfg.maxZoom,
    }).addTo(map);

    // Draw approach footpaths
    APPROACH_TRAILS.forEach((trail) => {
      const polyline = L.polyline(trail.coords, {
        color: trail.area === 'Ilioupoli' ? '#f59e0b' : '#38bdf8',
        weight: 3.5,
        dashArray: '7, 7',
        opacity: 0.92,
      }).addTo(map);
      polyline.bindTooltip(isGr ? trail.labelGr : trail.labelEn, {
        sticky: true,
        direction: 'top',
      });
    });

    // Draw Parking / Trailhead Gate pins
    Object.values(PARKING_TRAILHEADS).forEach((p) => {
      const parkingIcon = L.divIcon({
        className: 'custom-parking-pin',
        html: `
          <div style="
            display:flex;align-items:center;gap:4px;
            background:#1d4ed8;color:#fff;
            border:2px solid #fff;border-radius:9999px;
            padding:3px 8px;font-size:11px;font-weight:800;
            box-shadow:0 4px 12px rgba(0,0,0,0.35);
            white-space:nowrap;transform:translate(-50%,-50%);
          ">
            <span style="background:#fff;color:#1d4ed8;border-radius:4px;padding:0 4px;font-weight:900;">P</span>
            <span>${isGr ? p.shortGr : p.shortEn}</span>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([p.lat, p.lng], { icon: parkingIcon }).addTo(map);
      marker.bindPopup(`
        <div style="font-family:system-ui,sans-serif;min-width:210px;">
          <div style="font-size:11px;font-weight:700;color:#1d4ed8;text-transform:uppercase;margin-bottom:2px;">
            🚗 ${isGr ? 'Σημείο Στάθμευσης & Αφετηρία' : 'Parking & Trailhead Gate'}
          </div>
          <div style="font-size:13px;font-weight:700;color:#111827;margin-bottom:4px;">
            ${isGr ? p.nameGr : p.nameEn}
          </div>
          <div style="font-size:11px;color:#4b5563;line-height:1.35;margin-bottom:8px;">
            ${isGr ? p.noteGr : p.noteEn}
          </div>
          <a
            href="${getGoogleMapsDirectionsUrl(p.lat, p.lng, 'driving')}"
            target="_blank"
            rel="noopener noreferrer"
            style="
              display:inline-flex;align-items:center;gap:5px;
              background:#1e3a8a;color:#fff;text-decoration:none;
              padding:5px 10px;border-radius:6px;font-size:11px;font-weight:700;
            "
          >
            🚗 ${isGr ? 'Οδηγίες Google Maps (Πάρκινγκ)' : 'Google Maps Directions (Parking)'}
          </a>
        </div>
      `);
    });

    // Draw the 6 Crag Sector pins
    sectors.forEach((s) => {
      const isKokkini = s.key === 'kokkini';
      const isSelected = s.key === activeSectorKey;
      const pinBg = isKokkini
        ? '#dc2626'
        : isSelected
          ? '#1e3a8a'
          : '#0f172a';

      const cragIcon = L.divIcon({
        className: `custom-crag-pin-${s.key}`,
        html: `
          <div style="
            display:inline-flex;align-items:center;gap:5px;
            background:${pinBg};color:#fff;
            border:2px solid #fff;border-radius:9999px;
            padding:4px 9px;font-size:11px;font-weight:800;
            box-shadow:0 4px 14px rgba(0,0,0,0.42);
            white-space:nowrap;transform:translate(-50%,-50%);
            cursor:pointer;
          ">
            <span style="width:7px;height:7px;border-radius:9999px;background:${
              isKokkini ? '#fde047' : '#93c5fd'
            };"></span>
            <span>${isGr ? s.nameGr : s.nameGr}</span>
            <span style="opacity:0.85;font-weight:600;font-size:10px;">(${s.routes})</span>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([s.lat, s.lng], { icon: cragIcon }).addTo(map);
      marker.on('click', () => {
        handleSelectSector(s.key);
      });
      markersRef.current[s.key] = marker;
    });

    mapInstanceRef.current = map;

    // Ensure proper size calculation when rendered inside modals or grids
    setTimeout(() => {
      map.invalidateSize();
    }, 120);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Switch tile layer between Satellite and Topo/OSM
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || mapMode === 'gmaps') return;

    const tileCfg = TILE_LAYERS[mapMode] || TILE_LAYERS.satellite;
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }
    tileLayerRef.current = L.tileLayer(tileCfg.url, {
      attribution: tileCfg.attribution,
      maxZoom: tileCfg.maxZoom,
    }).addTo(map);

    setTimeout(() => {
      map.invalidateSize();
    }, 60);
  }, [mapMode]);

  // Fly to selected sector & update marker highlight when activeSectorKey changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !activeSector) return;

    sectors.forEach((s) => {
      const marker = markersRef.current[s.key];
      if (!marker) return;
      const isKokkini = s.key === 'kokkini';
      const isSelected = s.key === activeSectorKey;
      const pinBg = isSelected
        ? '#dc2626'
        : isKokkini
          ? '#b91c1c'
          : '#0f172a';
      const scale = isSelected ? 'scale(1.1)' : 'scale(1)';
      const ring = isSelected
        ? '0 0 0 4px rgba(220,38,38,0.35), 0 6px 16px rgba(0,0,0,0.45)'
        : '0 4px 12px rgba(0,0,0,0.38)';

      marker.setIcon(
        L.divIcon({
          className: `custom-crag-pin-${s.key}`,
          html: `
            <div style="
              display:inline-flex;align-items:center;gap:5px;
              background:${pinBg};color:#fff;
              border:2px solid ${isSelected ? '#fef08a' : '#fff'};border-radius:9999px;
              padding:4px 9px;font-size:11px;font-weight:800;
              box-shadow:${ring};
              white-space:nowrap;transform:translate(-50%,-50%) ${scale};
              transition:all 0.15s ease;cursor:pointer;
            ">
              <span style="width:7px;height:7px;border-radius:9999px;background:${
                isSelected ? '#fde047' : '#93c5fd'
              };"></span>
              <span>${isGr ? s.nameGr : s.nameEn.split(' (')[0]}</span>
              <span style="opacity:0.85;font-weight:600;font-size:10px;">(${s.routes})</span>
            </div>
          `,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        })
      );
    });
  }, [activeSectorKey, isGr]);

  const handleZoomArea = (area) => {
    setAreaFilter(area);
    const map = mapInstanceRef.current;
    if (!map) return;

    if (area === 'Ilioupoli') {
      map.flyTo([37.9316, 23.7733], 16, { duration: 0.65 });
      handleSelectSector('kokkini');
    } else if (area === 'Karea') {
      map.flyTo([37.9396, 23.776], 16, { duration: 0.65 });
      handleSelectSector('makis');
    } else {
      map.flyTo([37.935, 23.7745], 14, { duration: 0.65 });
    }
  };

  const handleFocusSectorPin = (s) => {
    handleSelectSector(s.key);
    const map = mapInstanceRef.current;
    if (map && mapMode !== 'gmaps') {
      map.flyTo([s.lat, s.lng], 17, { duration: 0.6 });
    }
  };

  const handleCopyCoords = async () => {
    const text = `${activeSector.lat}, ${activeSector.lng}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCoords(true);
      setTimeout(() => setCopiedCoords(false), 2000);
    } catch {
      // Fallback ignored
    }
  };

  const drivingToParkingUrl = getGoogleMapsDirectionsUrl(
    activeParking.lat,
    activeParking.lng,
    'driving'
  );
  const walkingToCragUrl = getGoogleMapsDirectionsUrl(
    activeSector.lat,
    activeSector.lng,
    'walking'
  );
  const cragPinGoogleUrl = getGoogleMapsPinUrl(
    activeSector.lat,
    activeSector.lng
  );
  const keylessEmbedUrl = getGoogleMapsEmbedUrl(
    activeSector.lat,
    activeSector.lng,
    16,
    'h'
  );

  return (
    <div
      className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden"
      data-testid="hymettus-map-card"
    >
      {/* Top Map Toolbar: Area Filter Pills + Layer Switcher (Satellite / OSM / Google Maps Embed) */}
      <div className="px-3 sm:px-4 py-2.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 mr-1">
            <Compass className="w-4 h-4" />
            <span>
              {isGr
                ? 'Χάρτης Πεδίων & Πρόσβασης Υμηττού'
                : 'Hymettus Crags & Approach Map'}
            </span>
          </span>

          <div
            className="inline-flex items-center rounded-lg bg-slate-800 p-0.5 border border-slate-700 text-[11px]"
            role="group"
            aria-label="Area Quick Zoom"
          >
            <button
              type="button"
              onClick={() => handleZoomArea('all')}
              className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
                areaFilter === 'all'
                  ? 'bg-[#1e3a8a] text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {isGr ? 'Όλα (6)' : 'All (6)'}
            </button>
            <button
              type="button"
              onClick={() => handleZoomArea('Ilioupoli')}
              className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
                areaFilter === 'Ilioupoli'
                  ? 'bg-[#1e3a8a] text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {isGr ? 'Ηλιούπολη (4)' : 'Ilioupoli (4)'}
            </button>
            <button
              type="button"
              onClick={() => handleZoomArea('Karea')}
              className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
                areaFilter === 'Karea'
                  ? 'bg-[#1e3a8a] text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {isGr ? 'Καρέας (2)' : 'Karea (2)'}
            </button>
          </div>
        </div>

        {/* Map Layer / Engine Switcher */}
        <div
          className="inline-flex items-center rounded-lg bg-slate-800 p-0.5 border border-slate-700 text-[11px]"
          role="group"
          aria-label="Map Layer Switcher"
          data-testid="map-layer-switcher"
        >
          <Layers className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-1 hidden sm:inline" />
          <button
            type="button"
            onClick={() => setMapMode('satellite')}
            className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
              mapMode === 'satellite'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            {isGr ? 'Δορυφόρος' : 'Satellite'}
          </button>
          <button
            type="button"
            onClick={() => setMapMode('topo')}
            className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
              mapMode === 'topo'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            {isGr ? 'Μονοπάτια' : 'Trails'}
          </button>
          <button
            type="button"
            onClick={() => setMapMode('gmaps')}
            className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
              mapMode === 'gmaps'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
            data-testid="map-mode-gmaps-btn"
          >
            Google Maps
          </button>
        </div>
      </div>

      {/* Quick Sector Selector Strip */}
      <div className="px-3 sm:px-4 py-1.5 bg-gray-50 border-b border-gray-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <span className="text-[11px] font-semibold text-gray-500 shrink-0">
          {isGr ? 'Πεδίο:' : 'Sector:'}
        </span>
        {sectors.map((s) => {
          const isSelected = s.key === activeSector.key;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => handleFocusSectorPin(s)}
              data-testid={`map-sector-pill-${s.key}`}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 transition-all ${
                isSelected
                  ? 'bg-[#1e3a8a] text-white shadow-2xs'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  s.key === 'kokkini' ? 'bg-amber-300' : 'bg-blue-300'
                }`}
              />
              <span>{isGr ? s.nameGr : s.nameEn.split(' (')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Interactive Map Viewport (Leaflet OR Keyless Google Maps Embed) */}
      <div
        className={`relative w-full ${
          compactHeight ? 'h-[260px] sm:h-[310px]' : 'h-[300px] sm:h-[380px]'
        } bg-slate-900`}
      >
        {/* Leaflet Canvas (kept mounted so tile cache persists) */}
        <div
          ref={mapContainerRef}
          data-testid="leaflet-map-canvas"
          className={`w-full h-full z-10 ${
            mapMode === 'gmaps' ? 'invisible pointer-events-none' : 'visible'
          }`}
        />

        {/* Keyless Google Maps Embed iframe when 'gmaps' tab is active */}
        {mapMode === 'gmaps' && (
          <iframe
            title={`Google Maps - ${activeSector.nameGr}`}
            src={keylessEmbedUrl}
            className="absolute inset-0 w-full h-full border-0 z-20"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            data-testid="google-maps-embed-iframe"
          />
        )}

        {/* Map Legend Overlay (Bottom-Left) */}
        {mapMode !== 'gmaps' && (
          <div className="absolute bottom-2.5 left-2.5 z-[400] bg-slate-900/90 backdrop-blur-xs text-white px-2.5 py-1.5 rounded-lg border border-white/15 text-[11px] flex flex-wrap items-center gap-3 pointer-events-none">
            <span className="inline-flex items-center gap-1">
              <span className="px-1 py-0.2 bg-blue-700 text-white rounded text-[10px] font-black">
                P
              </span>
              <span>{isGr ? 'Πάρκινγκ / Μπάρα' : 'Parking / Gate'}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-4 border-t-2 border-dashed border-amber-400 inline-block" />
              <span>{isGr ? 'Μονοπάτι (10′)' : 'Footpath (10′)'}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 border border-yellow-300 inline-block" />
              <span>{isGr ? 'Επιλεγμένο Πεδίο' : 'Selected Crag'}</span>
            </span>
          </div>
        )}
      </div>

      {/* Selected Sector Details & 1-Tap Google Maps Directions Bar */}
      <div className="p-3.5 sm:p-4 bg-white border-t border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left: Selected Sector + Parking & Trailhead Explanation */}
          <div className="space-y-1 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#1e3a8a]/10 text-[#1e3a8a]">
                <MapPin className="w-3 h-3" />
                {isGr ? activeSector.areaGr : activeSector.area}
              </span>
              <h3 className="text-base sm:text-lg font-bold text-gray-900">
                {isGr ? activeSector.nameGr : activeSector.nameEn}
              </h3>
              <span className="text-xs text-gray-500 font-medium inline-flex items-center gap-1">
                <Mountain className="w-3.5 h-3.5 text-[#1e3a8a]" />
                {activeSector.routes} {isGr ? 'διαδρομές' : 'routes'} ({activeSector.grades})
              </span>
              <span className="text-xs text-gray-500 font-medium inline-flex items-center gap-1">
                <Footprints className="w-3.5 h-3.5 text-amber-600" />
                {activeSector.approachMin}′ {isGr ? 'πεζοπορία' : 'walk'}
              </span>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              <strong className="text-gray-800">
                🚗 {isGr ? activeParking.shortGr : activeParking.shortEn}:
              </strong>{' '}
              {isGr ? activeParking.noteGr : activeParking.noteEn}
            </p>
          </div>

          {/* Right: 1-Tap Google Maps Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Primary Button: Driving Directions to Parking Gate */}
            <a
              href={drivingToParkingUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="gmaps-directions-parking-btn"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 text-white shadow-xs transition-colors"
            >
              <Car className="w-4 h-4 shrink-0" />
              <span>
                {isGr
                  ? 'Οδηγίες στο Πάρκινγκ (Google Maps)'
                  : 'Directions to Parking (Google Maps)'}
              </span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>

            {/* Secondary Button: Exact Crag Pin / Walking on Google Maps */}
            <a
              href={walkingToCragUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="gmaps-directions-crag-btn"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 transition-colors"
              title={`${activeSector.lat}, ${activeSector.lng}`}
            >
              <Navigation className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>
                {isGr ? 'Στίγμα Βράχου (Πεζοπορία)' : 'Crag Pin (Walking)'}
              </span>
              <ExternalLink className="w-3 h-3 opacity-75" />
            </a>

            {/* Wikiloc GPS Trail link if available */}
            {activeParking.wikilocUrl && (
              <a
                href={activeParking.wikilocUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-colors"
              >
                <Footprints className="w-3.5 h-3.5 text-amber-700" />
                <span>Wikiloc</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>
            )}

            {/* Copy Coordinates Button */}
            <button
              type="button"
              onClick={handleCopyCoords}
              className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
              title={isGr ? 'Αντιγραφή Συντεταγμένων GPS' : 'Copy GPS Coordinates'}
            >
              {copiedCoords ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">
                    {isGr ? 'Αντιγράφηκε' : 'Copied'}
                  </span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-gray-500" />
                  <span className="font-mono text-[11px]">
                    {activeSector.lat.toFixed(4)}, {activeSector.lng.toFixed(4)}
                  </span>
                </>
              )}
            </button>

            {/* Open Interactive Topo for any active sector */}
            {(onOpenSector || onOpenKokkiniTopo) && (
              <button
                type="button"
                onClick={() => {
                  if (onOpenSector && activeSector.path) {
                    onOpenSector(activeSector.path);
                  } else if (onOpenKokkiniTopo) {
                    onOpenKokkiniTopo();
                  }
                }}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 text-white shadow-xs transition-colors"
              >
                <span>{isGr ? 'Άνοιγμα Topo' : 'Open Topo'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
