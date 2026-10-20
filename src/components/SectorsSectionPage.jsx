import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Mountain,
  Sun,
  ArrowRight,
  Globe,
  Car,
  Navigation,
  Map,
  Footprints,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import HymettusMapCanvas from './HymettusMapCanvas';
import {
  sectors,
  PARKING_TRAILHEADS,
  getGoogleMapsDirectionsUrl,
} from '../data/sectorsData';

export default function SectorsSectionPage({ isGr, onToggleLang }) {
  const navigate = useNavigate();
  const [selectedSectorKey, setSelectedSectorKey] = useState('kokkini');
  const [showOverviewMap, setShowOverviewMap] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Sectors Section */}
        <section className="mb-16">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                {isGr ? 'Τα Πεδία' : 'The Sectors'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {isGr
                  ? '6 αναρριχητικά πεδία στον Υμηττό (Ηλιούπολη & Καρέας) · Επιλέξτε πεδίο για το διαδραστικό topo ή δείτε τις οδηγίες πρόσβασης στον χάρτη.'
                  : '6 climbing sectors on Mt. Hymettus (Ilioupoli & Karea) · Select a crag for the interactive topo or check access directions on the map.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowOverviewMap((v) => !v)}
                data-testid="toggle-overview-map-btn"
                className={`inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-3.5 py-1.5 border transition-colors ${
                  showOverviewMap
                    ? 'bg-[#1e3a8a] text-white border-[#1e3a8a]'
                    : 'bg-white text-gray-700 hover:text-gray-900 border-gray-200'
                }`}
              >
                <Map className="w-3.5 h-3.5" />
                <span>
                  {showOverviewMap
                    ? isGr
                      ? 'Απόκρυψη Χάρτη'
                      : 'Hide Map'
                    : isGr
                    ? 'Χάρτης Πεδίων & Οδηγίες'
                    : 'Crags Map & Directions'}
                </span>
              </button>

              <button
                type="button"
                onClick={onToggleLang}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-full px-3 py-1.5 shadow-2xs transition-colors"
              >
                <Globe className="w-3.5 h-3.5 text-[#1e3a8a]" />
                <span>{isGr ? 'EN' : 'ΕΛ'}</span>
              </button>
            </div>
          </div>

          {/* Interactive Hymettus Sectors & Parking Map */}
          {showOverviewMap && (
            <div className="mb-8">
              <HymettusMapCanvas
                isGr={isGr}
                selectedSectorKey={selectedSectorKey}
                onSelectSector={setSelectedSectorKey}
                onOpenSector={(path) => navigate(path)}
              />
            </div>
          )}

          {/* 6 Sector Cards Grid */}
          <div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            data-testid="climbing-sectors-grid"
          >
            {sectors.map((s) => {
              const isSelectedOnMap = s.key === selectedSectorKey;
              const parking =
                PARKING_TRAILHEADS[s.parkingId] || PARKING_TRAILHEADS.ilioupoli;
              const parkingDirUrl = getGoogleMapsDirectionsUrl(
                parking.lat,
                parking.lng,
                'driving'
              );
              const cragPinUrl = getGoogleMapsDirectionsUrl(
                s.lat,
                s.lng,
                'walking'
              );

              return (
                <Card
                  key={s.key}
                  onMouseEnter={() => setSelectedSectorKey(s.key)}
                  onClick={() => {
                    navigate(s.path || `/sector/${s.key}`);
                  }}
                  className={`border bg-white transition-all cursor-pointer group ${
                    isSelectedOnMap
                      ? 'border-[#1e3a8a] shadow-lg ring-2 ring-[#1e3a8a]/30'
                      : 'border-[#1e3a8a]/40 hover:border-[#1e3a8a] hover:shadow-lg ring-1 ring-[#1e3a8a]/15'
                  }`}
                  data-testid={`sector-card-${s.key}`}
                >
                  <CardContent className="p-6 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            <MapPin className="w-3 h-3 mr-1" />{' '}
                            {isGr ? s.areaGr : s.area}
                          </Badge>
                          <Badge className="bg-[#1e3a8a]/10 text-[#1e3a8a] text-xs border-transparent">
                            {s.routes} {isGr ? 'διαδρομές' : 'routes'}
                          </Badge>
                        </div>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#1e3a8a] group-hover:translate-x-0.5 transition-transform">
                          {isGr ? 'Άνοιγμα Topo' : 'Open Topo'}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {isGr ? s.nameGr : s.nameEn}
                      </h3>

                      <div className="text-sm text-gray-500 mb-3 flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Mountain className="w-3.5 h-3.5" /> {s.grades}
                        </span>
                        <span className="flex items-center gap-1">
                          <Sun className="w-3.5 h-3.5" />{' '}
                          {isGr ? s.shadeGr : s.shadeEn}
                        </span>
                        {s.approachMin && (
                          <span className="flex items-center gap-1 text-amber-700 font-medium text-xs">
                            <Footprints className="w-3.5 h-3.5" /> {s.approachMin}′
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-700 leading-relaxed mb-4">
                        {isGr ? s.descGr : s.descEn}
                      </p>
                    </div>

                    {/* Bottom 1-Tap Google Maps Links on Every Sector Card */}
                    <div
                      className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <a
                        href={parkingDirUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-testid={`sector-gmaps-parking-${s.key}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1e3a8a] hover:text-[#1e3a8a]/80 bg-[#1e3a8a]/5 hover:bg-[#1e3a8a]/10 px-2.5 py-1.5 rounded-lg transition-colors"
                        title={
                          isGr
                            ? `Οδηγίες οδήγησης προς ${parking.shortGr}`
                            : `Driving directions to ${parking.shortEn}`
                        }
                      >
                        <Car className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {isGr ? 'Οδηγίες Πάρκινγκ' : 'Parking Directions'}
                        </span>
                        <ExternalLink className="w-3 h-3 opacity-75" />
                      </a>

                      <a
                        href={cragPinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-testid={`sector-gmaps-pin-${s.key}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors"
                        title={`${s.lat}, ${s.lng}`}
                      >
                        <Navigation className="w-3 h-3 text-emerald-700 shrink-0" />
                        <span>{isGr ? 'Στίγμα Βράχου' : 'Crag Pin'}</span>
                      </a>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
