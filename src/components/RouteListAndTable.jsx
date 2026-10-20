import React, { useState, useMemo } from 'react';
import {
  Heart,
  Star,
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Share2,
  ShieldCheck,
  StickyNote,
  Calendar,
  User,
  X,
} from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import {
  FRENCH_GRADE_ORDER,
  getGradeBadgeClass,
  getRockfaxHex,
} from '../data/kokkiniPistaRoutes';
import { TICK_TYPES } from '../hooks/useClimberLogbook';

export default function RouteListAndTable({
  isGr,
  userMode, // 'guest' | 'member' | 'admin'
  routes,
  selectedRoute,
  onSelectRoute,
  gradeSystem,
  viewMode,
  getEntry,
  onToggleFavourite,
  onToggleTickStatus,
  onSetStars,
  onUpdateEntry,
  onFilterBySetter,
  onFilterByYear,
}) {
  const [sortField, setSortField] = useState('order');
  const [sortDir, setSortDir] = useState('asc');
  const [copiedId, setCopiedId] = useState(null);

  const isMemberOrAdmin = userMode === 'member' || userMode === 'admin';

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'stars' ? 'desc' : 'asc');
    }
  };

  const sortedRoutes = useMemo(() => {
    const arr = [...routes];
    arr.sort((a, b) => {
      let va = a.order;
      let vb = b.order;
      if (sortField === 'grade') {
        va = FRENCH_GRADE_ORDER.indexOf(a.french);
        vb = FRENCH_GRADE_ORDER.indexOf(b.french);
      } else if (sortField === 'length') {
        va = a.length;
        vb = b.length;
      } else if (sortField === 'bolts') {
        va = a.bolts;
        vb = b.bolts;
      } else if (sortField === 'year') {
        va = a.year;
        vb = b.year;
      } else if (sortField === 'stars') {
        const ea = getEntry(a.id);
        const eb = getEntry(b.id);
        va = isMemberOrAdmin ? (ea.userStars ?? a.defaultStars) : a.defaultStars;
        vb = isMemberOrAdmin ? (eb.userStars ?? b.defaultStars) : b.defaultStars;
      }
      if (va === vb) return a.order - b.order;
      return sortDir === 'asc' ? va - vb : vb - va;
    });
    return arr;
  }, [routes, sortField, sortDir, getEntry, isMemberOrAdmin]);

  const handleShareRoute = (e, route) => {
    e.stopPropagation();
    const url = new URL(window.location.href);
    url.searchParams.set('route', route.id);
    window.history.replaceState({}, '', url.toString());
    navigator.clipboard?.writeText(url.toString());
    setCopiedId(route.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (sortedRoutes.length === 0) {
    return (
      <Card className="border border-gray-200 bg-white">
        <CardContent className="p-8 text-center text-gray-500 text-sm">
          {isGr
            ? 'Δεν βρέθηκαν διαδρομές με τα επιλεγμένα φίλτρα.'
            : 'No routes match your active filters.'}
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      {/* Compact Sort Strip for Mobile List View */}
      {viewMode === 'cards' && (
        <div className="flex items-center justify-between gap-2 mb-2 px-1 text-[11px] text-gray-600 overflow-x-auto">
          <span className="font-semibold flex-shrink-0">
            {isGr ? 'Ταξινόμηση:' : 'Sort:'}
          </span>
          <div className="flex items-center gap-1">
            {[
              { id: 'order', labelGr: 'Σειρά (#)', labelEn: 'Order (#)' },
              { id: 'grade', labelGr: 'Βαθμός', labelEn: 'Grade' },
              { id: 'length', labelGr: 'Ύψος (m)', labelEn: 'Height (m)' },
              { id: 'year', labelGr: 'Έτος', labelEn: 'Year' },
              { id: 'stars', labelGr: '★', labelEn: '★' },
            ].map((s) => {
              const active = sortField === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSort(s.id)}
                  className={`px-2 py-0.5 rounded border font-medium inline-flex items-center gap-0.5 whitespace-nowrap transition-colors ${
                    active
                      ? 'bg-[#1e3a8a] text-white border-[#1e3a8a]'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span>{isGr ? s.labelGr : s.labelEn}</span>
                  {active && (
                    <span className="text-[10px]">
                      {sortDir === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW MODE 1: COMPACT MOBILE-FIRST CRAG LIST */}
      {viewMode === 'cards' ? (
        <Card className="border border-gray-200 bg-white overflow-hidden divide-y divide-gray-150">
          {sortedRoutes.map((route) => {
            const isSelected = selectedRoute?.id === route.id;
            const entry = getEntry(route.id);
            const activeTick = isMemberOrAdmin
              ? TICK_TYPES.find((t) => t.id === entry.status)
              : null;
            const effectiveStars = isMemberOrAdmin
              ? (entry.userStars ?? route.defaultStars)
              : route.defaultStars;
            const rockfaxHex = getRockfaxHex(route.french);

            const displayName =
              route.nameGr !== '-'
                ? isGr
                  ? route.nameGr
                  : route.nameEn
                : isGr
                ? `Διαδρομή #${route.pdfNumber}`
                : `Route #${route.pdfNumber}`;

            return (
              <div
                key={route.id}
                id={`route-card-${route.id}`}
                onClick={() => onSelectRoute(isSelected ? null : route)}
                className={`transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50/60 border-l-4 border-l-[#1e3a8a]'
                    : route.isTopRopeOnly
                    ? 'bg-amber-50/25 hover:bg-amber-50/60'
                    : 'hover:bg-gray-50'
                }`}
              >
                {/* Single High-Density Row */}
                <div className="px-2.5 py-2 sm:px-3.5 sm:py-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {/* Rockfax-styled Circular Number Badge */}
                    <div
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white font-extrabold text-xs flex-shrink-0 shadow-2xs"
                      style={{
                        backgroundColor: isSelected ? '#1e3a8a' : rockfaxHex,
                      }}
                      title={`Τοίχος ${route.wall}`}
                    >
                      {route.pdfNumber || '—'}
                    </div>

                    {/* Route Title + Sub-metadata */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-gray-900 truncate">
                          {displayName}
                        </span>
                        <span
                          className="text-amber-500 text-[11px] leading-none"
                          title={`${effectiveStars}★`}
                        >
                          {'★'.repeat(effectiveStars)}
                        </span>
                        {route.isTopRopeOnly && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0 rounded bg-amber-100 text-amber-900 border border-amber-300">
                            Top rope*
                          </span>
                        )}
                        {activeTick && (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0 rounded border ${activeTick.color}`}
                          >
                            ✓ {activeTick.short}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-gray-500 truncate">
                        <span className="font-semibold text-gray-700">
                          {route.length}m
                        </span>
                        {!route.isTopRopeOnly && (
                          <>
                            <span>·</span>
                            <span>
                              {route.bolts} {isGr ? 'ασφ.' : 'bolts'}
                            </span>
                          </>
                        )}
                        <span>·</span>
                        <span className="truncate">
                          {isGr ? route.settersRawGr : route.settersRawEn}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Rockfax Grade Pill + (Member-only Fav) + Expand chevron */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-md border text-xs font-extrabold whitespace-nowrap ${getGradeBadgeClass(
                        route.french
                      )}`}
                    >
                      {gradeSystem === 'uiaa'
                        ? `${route.uiaa} · ${route.french}`
                        : `${route.french} · ${route.uiaa}`}
                    </span>

                    {isMemberOrAdmin && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavourite(route.id);
                        }}
                        className={`p-1.5 rounded-md border transition-colors ${
                          entry.favourite
                            ? 'bg-rose-50 border-rose-200 text-rose-600'
                            : 'bg-white border-gray-200 text-gray-300 hover:text-rose-500'
                        }`}
                        aria-label={isGr ? 'Αγαπημένη' : 'Favourite'}
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${
                            entry.favourite ? 'fill-rose-500 text-rose-500' : ''
                          }`}
                        />
                      </button>
                    )}

                    <div className="text-gray-400">
                      {isSelected ? (
                        <ChevronUp className="w-4 h-4 text-[#1e3a8a]" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Compact Inline Expanded Details */}
                {isSelected && (
                  <div
                    className="px-3 pb-3 pt-2 bg-white border-t border-blue-100 space-y-2 text-xs"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-gray-700 leading-relaxed flex-1">
                        {route.noteGr
                          ? isGr
                            ? route.noteGr
                            : route.noteEn
                          : ''}
                      </p>
                      <button
                        type="button"
                        onClick={() => onSelectRoute(null)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-semibold flex-shrink-0"
                      >
                        <X className="w-3 h-3" />
                        <span>{isGr ? 'Εμφάνιση όλων' : 'Un-highlight'}</span>
                      </button>
                    </div>

                    {/* Gear & Setter Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg bg-gray-50 border border-gray-200">
                      <div className="flex items-center gap-1.5 text-gray-800 font-medium">
                        {route.isTopRopeOnly ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                        ) : (
                          <ShieldCheck className="w-3.5 h-3.5 text-[#1e3a8a] flex-shrink-0" />
                        )}
                        <span>
                          {route.isTopRopeOnly
                            ? isGr
                              ? `Top-rope* (χωρίς μόνιμο ρελέ) · Σχοινί ≥${
                                  route.length * 2 + 5
                                }m`
                              : `Top-rope* (no permanent anchor) · Rope ≥${
                                  route.length * 2 + 5
                                }m`
                            : isGr
                            ? `${route.bolts}+2 σετάκια · Σχοινί ≥${
                                route.length * 2
                              }m`
                            : `${route.bolts}+2 quickdraws · Rope ≥${
                                route.length * 2
                              }m`}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {route.setters.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => onFilterBySetter(s)}
                            className="px-1.5 py-0.5 rounded bg-white border border-gray-200 text-[#1e3a8a] font-semibold hover:bg-blue-50 text-[11px]"
                          >
                            <User className="w-3 h-3 inline mr-0.5" />
                            {s}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => onFilterByYear(String(route.year))}
                          className="px-1.5 py-0.5 rounded bg-white border border-gray-200 text-[#1e3a8a] font-semibold hover:bg-blue-50 text-[11px]"
                        >
                          <Calendar className="w-3 h-3 inline mr-0.5" />
                          {route.year}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleShareRoute(e, route)}
                          className="px-1.5 py-0.5 rounded bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 text-[11px] inline-flex items-center gap-1"
                        >
                          <Share2 className="w-3 h-3" />
                          <span>
                            {copiedId === route.id
                              ? isGr
                                ? 'Αντιγράφηκε'
                                : 'Copied'
                              : isGr
                              ? 'Link'
                              : 'Link'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Member / Admin Only: Ascent Style Logging, Personal Stars & Beta Notes */}
                    {isMemberOrAdmin && (
                      <div className="pt-1 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="font-semibold text-gray-700 mr-1">
                              {isGr ? 'Καταγραφή:' : 'Log:'}
                            </span>
                            {TICK_TYPES.map((t) => {
                              const active = entry.status === t.id;
                              return (
                                <button
                                  key={t.id}
                                  type="button"
                                  onClick={() =>
                                    onToggleTickStatus(route.id, t.id)
                                  }
                                  className={`px-2 py-0.5 rounded font-bold border text-[11px] transition-colors ${
                                    active
                                      ? t.color
                                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                                  }`}
                                >
                                  {active && (
                                    <Check className="w-2.5 h-2.5 inline mr-0.5" />
                                  )}
                                  {t.short}
                                </button>
                              );
                            })}
                          </div>

                          <div className="flex items-center gap-0.5">
                            <span className="text-gray-500 text-[11px] mr-1">
                              ★:
                            </span>
                            {[1, 2, 3].map((starCount) => (
                              <button
                                key={starCount}
                                type="button"
                                onClick={() => onSetStars(route.id, starCount)}
                                className="p-0.5 rounded hover:bg-amber-50"
                              >
                                <Star
                                  className={`w-3.5 h-3.5 ${
                                    effectiveStars >= starCount
                                      ? 'fill-amber-400 text-amber-500'
                                      : 'text-gray-300'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="relative">
                          <StickyNote className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2" />
                          <input
                            type="text"
                            value={entry.notes || ''}
                            onChange={(e) =>
                              onUpdateEntry(route.id, { notes: e.target.value })
                            }
                            placeholder={
                              isGr
                                ? 'Προσωπικές σημειώσεις / beta...'
                                : 'Personal beta notes...'
                            }
                            className="w-full h-7 pl-8 pr-3 rounded border border-gray-200 bg-gray-50 focus:bg-white text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#1e3a8a]"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {/* Footnote */}
          <div className="px-3 py-2 bg-amber-50/70 text-[11px] text-amber-900">
            *{' '}
            {isGr
              ? 'ΠΡΟΣΟΧΗ: Όλες οι διαδρομές που γίνονται με σχοινί από πάνω (top rope) και ξεχωρίζουν με κίτρινο χρώμα, δεν έχουν μόνιμο ρελέ.'
              : 'WARNING: All routes climbed with a top rope and marked in yellow do not have a permanent lower-off anchor.'}
          </div>
        </Card>
      ) : (
        /* VIEW MODE 2: FULL MULTI-COLUMN TABLE */
        <Card className="border border-gray-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-gray-100/90 border-b border-gray-200 text-gray-700 font-bold">
                  <th className="py-2.5 px-3 sticky left-0 bg-gray-100 z-10">
                    <button
                      type="button"
                      onClick={() => handleSort('order')}
                      className="inline-flex items-center gap-1 hover:text-[#1e3a8a]"
                    >
                      <span>#</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-2.5 px-3">
                    {isGr ? 'Όνομα διαδρομής' : 'Route Name'}
                  </th>
                  <th className="py-2.5 px-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => handleSort('grade')}
                      className="inline-flex items-center gap-1 hover:text-[#1e3a8a]"
                    >
                      <span>UIAA</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-2.5 px-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => handleSort('grade')}
                      className="inline-flex items-center gap-1 hover:text-[#1e3a8a]"
                    >
                      <span>French</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-2.5 px-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => handleSort('length')}
                      className="inline-flex items-center gap-1 hover:text-[#1e3a8a]"
                    >
                      <span>{isGr ? 'Ανάπτυγμα' : 'Length'}</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-2.5 px-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => handleSort('bolts')}
                      className="inline-flex items-center gap-1 hover:text-[#1e3a8a]"
                    >
                      <span>{isGr ? 'Ασφάλειες' : 'Protection'}</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-2.5 px-3">
                    {isGr ? 'Ανοίξαντες' : 'Route Setters'}
                  </th>
                  <th className="py-2.5 px-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => handleSort('year')}
                      className="inline-flex items-center gap-1 hover:text-[#1e3a8a]"
                    >
                      <span>{isGr ? 'Έτος' : 'Year'}</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-2.5 px-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => handleSort('stars')}
                      className="inline-flex items-center gap-1 hover:text-[#1e3a8a]"
                    >
                      <span>★</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  {/* Favourite / Done column ONLY shown in Member / Admin mode */}
                  {isMemberOrAdmin && (
                    <th className="py-2.5 px-3 text-right">
                      {isGr ? 'Αγαπ. / Ολοκλ.' : 'Fav / Done'}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedRoutes.map((route) => {
                  const isSelected = selectedRoute?.id === route.id;
                  const entry = getEntry(route.id);
                  const effectiveStars = isMemberOrAdmin
                    ? (entry.userStars ?? route.defaultStars)
                    : route.defaultStars;
                  const rockfaxHex = getRockfaxHex(route.french);

                  return (
                    <tr
                      key={route.id}
                      onClick={() => onSelectRoute(isSelected ? null : route)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-50/80 font-medium'
                          : route.isTopRopeOnly
                          ? 'bg-amber-50/35 hover:bg-amber-50/70'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {/* # Column with Rockfax Circle */}
                      <td className="py-2 px-3 font-bold text-gray-900 sticky left-0 bg-inherit z-10">
                        <span
                          className="inline-flex items-center justify-center w-7 h-7 rounded-full text-white text-xs font-extrabold shadow-2xs"
                          style={{
                            backgroundColor: isSelected ? '#1e3a8a' : rockfaxHex,
                          }}
                        >
                          {route.pdfNumber || '—'}
                        </span>
                      </td>

                      {/* Route Name */}
                      <td className="py-2 px-3 font-semibold text-gray-900">
                        <div className="flex items-center gap-1.5">
                          <span>{isGr ? route.nameGr : route.nameEn}</span>
                          <span className="text-[10px] text-gray-400 font-normal">
                            (T{route.wall})
                          </span>
                        </div>
                      </td>

                      {/* UIAA */}
                      <td className="py-2 px-2.5 text-center font-bold text-gray-800">
                        {route.uiaa}
                      </td>

                      {/* French with Rockfax Badge */}
                      <td className="py-2 px-2.5 text-center">
                        <Badge
                          className={`${getGradeBadgeClass(
                            route.french
                          )} font-bold`}
                        >
                          {route.french}
                        </Badge>
                      </td>

                      {/* Length */}
                      <td className="py-2 px-2.5 text-center text-gray-700">
                        {route.length}m
                      </td>

                      {/* Protection */}
                      <td className="py-2 px-2.5 text-center">
                        {route.isTopRopeOnly ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-semibold text-xs border border-amber-300">
                            Top rope*
                          </span>
                        ) : (
                          <span className="font-medium text-gray-800">
                            {route.bolts}
                          </span>
                        )}
                      </td>

                      {/* Setters */}
                      <td
                        className="py-2 px-3 text-gray-700"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex flex-wrap gap-1">
                          {route.setters.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => onFilterBySetter(s)}
                              className="text-xs text-[#1e3a8a] hover:underline font-medium"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </td>

                      {/* Year */}
                      <td
                        className="py-2 px-2.5 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => onFilterByYear(String(route.year))}
                          className="text-xs font-semibold text-gray-700 hover:text-[#1e3a8a] hover:underline"
                        >
                          {route.year}
                        </button>
                      </td>

                      {/* Quality Stars (Static in Guest mode, Interactive in Member/Admin mode) */}
                      <td
                        className={`py-2 px-2.5 text-center text-amber-500 whitespace-nowrap ${
                          isMemberOrAdmin ? 'cursor-pointer' : ''
                        }`}
                        onClick={(e) => {
                          if (!isMemberOrAdmin) return;
                          e.stopPropagation();
                          onSetStars(
                            route.id,
                            effectiveStars >= 3 ? 1 : effectiveStars + 1
                          );
                        }}
                        title={
                          isMemberOrAdmin
                            ? isGr
                              ? 'Πατήστε για αλλαγή ★'
                              : 'Click to rate ★'
                            : `${effectiveStars}★`
                        }
                      >
                        {'★'.repeat(effectiveStars)}
                      </td>

                      {/* Tick / Favourite Actions (ONLY in Member / Admin mode) */}
                      {isMemberOrAdmin && (
                        <td
                          className="py-2 px-3 text-right whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onToggleFavourite(route.id)}
                              className={`p-1 rounded border ${
                                entry.favourite
                                  ? 'bg-rose-50 border-rose-200 text-rose-600'
                                  : 'bg-white border-gray-200 text-gray-300 hover:text-rose-500'
                              }`}
                            >
                              <Heart
                                className={`w-3.5 h-3.5 ${
                                  entry.favourite
                                    ? 'fill-rose-500 text-rose-500'
                                    : ''
                                }`}
                              />
                            </button>
                            {TICK_TYPES.slice(0, 3).map((t) => {
                              const active = entry.status === t.id;
                              return (
                                <button
                                  key={t.id}
                                  type="button"
                                  onClick={() =>
                                    onToggleTickStatus(route.id, t.id)
                                  }
                                  className={`px-1.5 py-0.5 rounded text-[11px] font-bold border transition-colors ${
                                    active
                                      ? t.color
                                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                                  }`}
                                  title={isGr ? t.labelGr : t.labelEn}
                                >
                                  {t.short}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Footnote from PDF */}
          <div className="px-4 py-2 bg-amber-50/70 border-t border-amber-200/70 text-xs text-amber-900">
            *{' '}
            {isGr
              ? 'ΠΡΟΣΟΧΗ: Όλες οι διαδρομές που γίνονται με σχοινί από πάνω (top rope) και ξεχωρίζουν με κίτρινο χρώμα, δεν έχουν μόνιμο ρελέ.'
              : 'WARNING: All routes climbed with a top rope and marked in yellow do not have a permanent lower-off anchor.'}
          </div>
        </Card>
      )}
    </div>
  );
}
