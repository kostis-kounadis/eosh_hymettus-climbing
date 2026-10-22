import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  sectors,
  PARKING_TRAILHEADS,
  getGoogleMapsDirectionsUrl,
} from '../data/sectorsData';

// Simple common SVG map pin for climbing crags
const createPinIcon = (isHighlighted = false) => {
  const pinColor = isHighlighted ? '#1e3a8a' : '#dc2626';
  const scale = isHighlighted ? 'scale(1.2)' : 'scale(1)';

  return L.divIcon({
    className: 'custom-common-pin',
    html: `
      <div style="
        width: 24px;
        height: 32px;
        transform-origin: 12px 32px;
        transform: ${scale};
        transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1);
        cursor: pointer;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.35));
      ">
        <svg width="24" height="32" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 0C5.37258 0 0 5.37258 0 12C0 21 12 32 12 32C12 32 24 21 24 12C24 5.37258 18.6274 0 12 0Z" fill="${pinColor}"/>
          <circle cx="12" cy="11" r="4.5" fill="#ffffff"/>
        </svg>
      </div>
    `,
    iconSize: [24, 32],
    iconAnchor: [12, 32],
    tooltipAnchor: [0, -32],
  });
};

// Parking pin (Blue pin with white circle and 'P')
const createParkingIcon = () => {
  return L.divIcon({
    className: 'custom-parking-pin',
    html: `
      <div style="
        width: 24px;
        height: 32px;
        cursor: pointer;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.35));
      ">
        <svg width="24" height="32" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 0C5.37258 0 0 5.37258 0 12C0 21 12 32 12 32C12 32 24 21 24 12C24 5.37258 18.6274 0 12 0Z" fill="#1d4ed8"/>
          <circle cx="12" cy="11" r="7" fill="#ffffff"/>
          <text x="12" y="14.5" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="10.5" fill="#1d4ed8">P</text>
        </svg>
      </div>
    `,
    iconSize: [24, 32],
    iconAnchor: [12, 32],
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
      center: [37.9363, 23.7741],
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

    // Add Parking Pins (Ilioupoli & Kareas)
    Object.values(PARKING_TRAILHEADS).forEach((p) => {
      const parkingMarker = L.marker([p.lat, p.lng], {
        icon: createParkingIcon(),
      }).addTo(map);

      parkingMarker.bindTooltip(
        isGr ? p.shortGr || p.nameGr : p.shortEn || p.nameEn,
        {
          direction: 'top',
          offset: [0, -2],
          className: 'parking-map-tooltip',
        }
      );

      parkingMarker.on('click', () => {
        window.open(
          getGoogleMapsDirectionsUrl(p.lat, p.lng, 'driving'),
          '_blank'
        );
      });
    });

    // Add simple common pins for the 6 crags
    sectors.forEach((s) => {
      const marker = L.marker([s.lat, s.lng], {
        icon: createPinIcon(false),
      }).addTo(map);

      // Tooltip with crag name sits just above the pin and centered
      marker.bindTooltip(isGr ? s.nameGr : s.nameEn, {
        direction: 'top',
        offset: [0, -2],
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
