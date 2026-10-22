import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { sectors } from '../data/sectorsData';

// Simple common SVG map pin
const createPinIcon = (isHighlighted = false) => {
  const pinColor = isHighlighted ? '#1e3a8a' : '#dc2626';
  const scale = isHighlighted ? 'scale(1.25)' : 'scale(1)';

  return L.divIcon({
    className: 'custom-common-pin',
    html: `
      <div style="
        transform: translate(-50%, -100%) ${scale};
        transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1);
        cursor: pointer;
        filter: drop-shadow(0 2px 5px rgba(0,0,0,0.35));
      ">
        <svg width="24" height="32" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 0C5.37258 0 0 5.37258 0 12C0 21 12 32 12 32C12 32 24 21 24 12C24 5.37258 18.6274 0 12 0Z" fill="${pinColor}"/>
          <circle cx="12" cy="11" r="4.5" fill="#ffffff"/>
        </svg>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    tooltipAnchor: [0, -32],
  });
};

export default function HymettusMapCanvas({
  isGr,
  hoveredSectorKey,
  onOpenSector,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});

  const [internalHoveredKey, setInternalHoveredKey] = useState(null);

  const effectiveHoveredKey = hoveredSectorKey || internalHoveredKey;

  // Initialize Leaflet Map once with OpenStreetMap
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [37.935, 23.7745],
      zoom: 14,
      zoomControl: false,
      scrollWheelZoom: true,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Only OpenStreetMap layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Add simple common pins for the 6 crags
    sectors.forEach((s) => {
      const marker = L.marker([s.lat, s.lng], {
        icon: createPinIcon(false),
      }).addTo(map);

      // Tooltip with crag name
      marker.bindTooltip(isGr ? s.nameGr : s.nameEn, {
        direction: 'top',
        offset: [0, -32],
        className: 'crag-map-tooltip',
      });

      marker.on('click', () => {
        if (onOpenSector && s.path) {
          onOpenSector(s.path);
        }
      });

      markersRef.current[s.key] = marker;
    });

    mapInstanceRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 120);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update tooltips and pin highlight when hovered (via glass button, pin, or card below)
  useEffect(() => {
    sectors.forEach((s) => {
      const marker = markersRef.current[s.key];
      if (!marker) return;

      const isHovered = effectiveHoveredKey === s.key;
      marker.setIcon(createPinIcon(isHovered));

      if (isHovered) {
        marker.setZIndexOffset(1000);
        marker.openTooltip();
      } else {
        marker.setZIndexOffset(0);
        marker.closeTooltip();
      }
    });
  }, [effectiveHoveredKey, isGr]);

  const handleCragClick = (s) => {
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo([s.lat, s.lng], 16, { duration: 0.5 });
    }
    if (onOpenSector && s.path) {
      onOpenSector(s.path);
    }
  };

  return (
    <div
      className="relative w-full h-[360px] sm:h-[420px] rounded-xl border border-gray-200 overflow-hidden shadow-xs bg-slate-100"
      data-testid="hymettus-map-canvas-container"
    >
      {/* Floating Glass Buttons for each crag */}
      <div className="absolute top-3 left-3 right-3 z-[400] pointer-events-none flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl backdrop-blur-md bg-white/70 border border-white/40 shadow-sm pointer-events-auto">
          {sectors.map((s) => {
            const isHovered = effectiveHoveredKey === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => handleCragClick(s)}
                onMouseEnter={() => setInternalHoveredKey(s.key)}
                onMouseLeave={() => setInternalHoveredKey(null)}
                data-testid={`glass-crag-btn-${s.key}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-md transition-all border ${
                  isHovered
                    ? 'bg-[#1e3a8a] text-white border-[#1e3a8a] shadow-xs scale-102'
                    : 'bg-white/80 hover:bg-white text-gray-800 border-white/60 hover:shadow-2xs'
                }`}
              >
                {isGr ? s.nameGr : s.nameEn.split(' (')[0]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Map Viewport */}
      <div
        ref={mapContainerRef}
        data-testid="leaflet-map-canvas"
        className="w-full h-full"
      />
    </div>
  );
}
