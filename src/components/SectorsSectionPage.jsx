import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Mountain, ArrowRight, Globe } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import HymettusMapCanvas from './HymettusMapCanvas';
import { sectors } from '../data/sectorsData';

export default function SectorsSectionPage({ isGr, onToggleLang }) {
  const navigate = useNavigate();
  const [hoveredSectorKey, setHoveredSectorKey] = useState(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Sectors Section */}
        <section className="mb-16">
          <div className="flex items-center justify-between gap-4 mb-6">
            <h2 className="text-3xl font-bold text-gray-900">
              {isGr ? 'Τα Πεδία' : 'The Sectors'}
            </h2>

            <button
              type="button"
              onClick={onToggleLang}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-full px-3 py-1.5 shadow-2xs transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-[#1e3a8a]" />
              <span>{isGr ? 'EN' : 'ΕΛ'}</span>
            </button>
          </div>

          {/* Interactive Hymettus Map */}
          <div className="mb-8">
            <HymettusMapCanvas
              isGr={isGr}
              hoveredSectorKey={hoveredSectorKey}
              onOpenSector={(path) => navigate(path)}
            />
          </div>

          {/* 6 Sector Cards Grid */}
          <div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            data-testid="climbing-sectors-grid"
          >
            {sectors.map((s) => {
              return (
                <Card
                  key={s.key}
                  onMouseEnter={() => setHoveredSectorKey(s.key)}
                  onMouseLeave={() => setHoveredSectorKey(null)}
                  onClick={() => {
                    navigate(s.path || `/sector/${s.key}`);
                  }}
                  className="border bg-white transition-all border-[#1e3a8a]/40 hover:border-[#1e3a8a] hover:shadow-lg cursor-pointer ring-1 ring-[#1e3a8a]/15 group"
                  data-testid={`sector-card-${s.key}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          <MapPin className="w-3 h-3 mr-1" />{' '}
                          {isGr ? s.areaGr || s.area : s.area}
                        </Badge>
                        <Badge className="bg-[#1e3a8a]/10 text-[#1e3a8a] text-xs border-transparent">
                          {s.routes} {isGr ? 'διαδρομές' : 'routes'}
                        </Badge>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#1e3a8a] group-hover:translate-x-0.5 transition-transform">
                        {isGr ? 'Πανοραμικό' : 'Topo'}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {isGr ? s.nameGr : s.nameEn}
                    </h3>

                    <div className="text-sm text-gray-500 mb-3 flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Mountain className="w-3.5 h-3.5" /> {s.grades}
                      </span>
                    </div>

                    <p className="text-sm text-gray-700 leading-relaxed">
                      {isGr ? s.descGr : s.descEn}
                    </p>
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
