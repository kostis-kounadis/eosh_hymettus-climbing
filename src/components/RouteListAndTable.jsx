import React, { useState, useMemo } from 'react';
import {
  Heart,
  AlertTriangle,
  ArrowUpDown,
  Share2,
  Info,
  Cable,
} from 'lucide-react';
import { Card, CardContent } from './ui/card';
import {
  FRENCH_GRADE_ORDER,
  getGradeBadgeClass,
} from '../data/kokkiniPistaRoutes';
import { TICK_TYPES } from '../hooks/useClimberLogbook';

// Two connected eighth notes (♫) for classic / historic routes
function BeamedNotesIcon({ className = 'w-3 h-3 text-gray-400' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 13c0 1.105-1.12 2-2.5 2S1 14.105 1 13s1.12-2 2.5-2 2.5.895 2.5 2zm9-2c0 1.105-1.12 2-2.5 2s-2.5-.895-2.5-2 1.12-2 2.5-2 2.5.895 2.5 2z" />
      <path fillRule="evenodd" d="M14 11V2h1v9h-1zM6 3v10H5V3h1z" />
      <path d="M5 2.905a1 1 0 0 1 .9-.995l8-.8a1 1 0 0 1 1.1.995V3L5 4V2.905z" />
    </svg>
  );
}

export default function RouteListAndTable({
  stickyTopOffset = 0,
  isGr,
  userMode, // 'guest' | 'member' | 'admin'
  routes,
  selectedRoute,
  onSelectRoute,
  getEntry,
  onToggleFavourite,
  onToggleTickStatus,
  onUpdateEntry,
  onFilterBySetter,
  onFilterByYear,
  isDockedWithFilterBar = false,
  disableRowAccordionOnDesktop = false,
}) {
  const [sortField, setSortField] = useState('order');
  const [sortDir, setSortDir] = useState('asc');
  const [copiedId, setCopiedId] = useState(null);

  const isMemberOrAdmin = userMode === 'member' || userMode === 'admin';
  const hasMultipleWalls = useMemo(
    () => routes.some((r) => r.wall && r.wall > 1),
    [routes]
  );

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
        va = a.isClassic ? 4 : (a.defaultStars || 1);
        vb = b.isClassic ? 4 : (b.defaultStars || 1);
      } else if (sortField === 'name') {
        va = isGr ? a.nameGr : a.nameEn;
        vb = isGr ? b.nameGr : b.nameEn;
        return sortDir === 'asc'
          ? String(va).localeCompare(String(vb))
          : String(vb).localeCompare(String(va));
      }
      if (va === vb) return a.order - b.order;
      return sortDir === 'asc' ? va - vb : vb - va;
    });
    return arr;
  }, [routes, sortField, sortDir, isGr]);

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
            ? 'Δεν βρέθηκαν διαδρομές με αυτά τα κριτήρια.'
            : 'No routes match the selected filters.'}
        </CardContent>
      </Card>
    );
  }

  const colSpanTotal = isMemberOrAdmin ? 8 : 7;

  return (
    <Card
      className={`border border-gray-200 bg-white shadow-2xs ${
        isDockedWithFilterBar
          ? 'rounded-t-none rounded-b-xl border-t-0'
          : 'rounded-xl'
      }`}
    >
      <div className="w-full">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-gray-100/95 text-gray-700 font-bold">
              {/* # Column */}
              <th
                style={{ top: stickyTopOffset ? `${stickyTopOffset}px` : undefined }}
                className="sticky z-20 bg-gray-100 border-b border-gray-200 py-2 sm:py-2.5 px-2 sm:px-3 text-center w-[36px] sm:w-[44px]"
              >
                <button
                  type="button"
                  onClick={() => handleSort('order')}
                  className="inline-flex items-center gap-1 hover:text-[#1e3a8a]"
                  title={isGr ? 'Ταξινόμηση ανά αριθμό' : 'Sort by number'}
                >
                  <span>#</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>

              {/* Route Name Column (Click to sort by Name or Stars) */}
              <th
                style={{ top: stickyTopOffset ? `${stickyTopOffset}px` : undefined }}
                className="sticky z-20 bg-gray-100 border-b border-gray-200 py-2 sm:py-2.5 px-2.5 sm:px-3 min-w-[130px]"
              >
                <button
                  type="button"
                  onClick={() => handleSort('name')}
                  className="inline-flex items-center gap-1 hover:text-[#1e3a8a]"
                  title={isGr ? 'Ταξινόμηση ανά όνομα' : 'Sort by name'}
                >
                  <span>{isGr ? 'Διαδρομή' : 'Route'}</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>

              {/* Combined Grade Column */}
              <th
                style={{ top: stickyTopOffset ? `${stickyTopOffset}px` : undefined }}
                className="sticky z-20 bg-gray-100 border-b border-gray-200 py-2 sm:py-2.5 px-1 sm:px-2 text-center whitespace-nowrap w-[88px] sm:w-[100px]"
              >
                <button
                  type="button"
                  onClick={() => handleSort('grade')}
                  className="inline-flex items-center gap-1 hover:text-[#1e3a8a]"
                  title={isGr ? 'Ταξινόμηση ανά βαθμό' : 'Sort by grade'}
                >
                  <span>{isGr ? 'Βαθμός' : 'Grade'}</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>

              {/* Length (Ανάπτ.) Column - Hidden on mobile, visible from sm (640px) */}
              <th
                style={{ top: stickyTopOffset ? `${stickyTopOffset}px` : undefined }}
                className="hidden sm:table-cell sticky z-20 bg-gray-100 border-b border-gray-200 py-2 sm:py-2.5 px-1.5 text-center whitespace-nowrap w-[60px]"
              >
                <button
                  type="button"
                  onClick={() => handleSort('length')}
                  className="inline-flex items-center gap-1 hover:text-[#1e3a8a]"
                  title={
                    isGr
                      ? 'Ανάπτυγμα (μήκος / ύψος διαδρομής σε μέτρα)'
                      : 'Route Length (in meters)'
                  }
                >
                  <abbr
                    className="no-underline cursor-help"
                    title={
                      isGr
                        ? 'Ανάπτυγμα (μήκος / ύψος διαδρομής σε μέτρα)'
                        : 'Route Length (in meters)'
                    }
                  >
                    {isGr ? 'Ανάπτ.' : 'Length'}
                  </abbr>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>

              {/* Protection / Bolts (Ασφ.) Column - Hidden on mobile, visible from sm (640px) */}
              <th
                style={{ top: stickyTopOffset ? `${stickyTopOffset}px` : undefined }}
                className="hidden sm:table-cell sticky z-20 bg-gray-100 border-b border-gray-200 py-2 sm:py-2.5 px-1.5 text-center whitespace-nowrap w-[64px]"
              >
                <button
                  type="button"
                  onClick={() => handleSort('bolts')}
                  className="inline-flex items-center gap-1 hover:text-[#1e3a8a]"
                  title={
                    isGr
                      ? 'Ασφάλειες (αριθμός πλακετών / Top Rope)'
                      : 'Protection (bolts count / Top Rope)'
                  }
                >
                  <abbr
                    className="no-underline cursor-help"
                    title={
                      isGr
                        ? 'Ασφάλειες (αριθμός πλακετών / Top Rope)'
                        : 'Protection / Bolts'
                    }
                  >
                    {isGr ? 'Ασφ.' : 'Bolts'}
                  </abbr>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>

              {/* Route Setters Column - Hidden on mobile & small tablet, visible from md (768px) */}
              <th
                style={{ top: stickyTopOffset ? `${stickyTopOffset}px` : undefined }}
                className="hidden md:table-cell sticky z-20 bg-gray-100 border-b border-gray-200 py-2 sm:py-2.5 px-3 text-center min-w-[130px]"
                title={isGr ? 'Ανοίξαντες διαδρομής' : 'Route Setters'}
              >
                {isGr ? 'Ανοίξαντες' : 'Route Setters'}
              </th>

              {/* Year Column - Hidden on mobile, visible from sm (640px) */}
              <th
                style={{ top: stickyTopOffset ? `${stickyTopOffset}px` : undefined }}
                className="hidden sm:table-cell sticky z-20 bg-gray-100 border-b border-gray-200 py-2 sm:py-2.5 px-2 text-center whitespace-nowrap w-[60px]"
              >
                <button
                  type="button"
                  onClick={() => handleSort('year')}
                  className="inline-flex items-center gap-1 hover:text-[#1e3a8a]"
                  title={isGr ? 'Ταξινόμηση ανά έτος' : 'Sort by year'}
                >
                  <span>{isGr ? 'Έτος' : 'Year'}</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>

              {/* Member/Admin Status Column - Hidden on mobile & small tablet, visible from md (768px) */}
              {isMemberOrAdmin && (
                <th
                  style={{ top: stickyTopOffset ? `${stickyTopOffset}px` : undefined }}
                  className="hidden md:table-cell sticky z-20 bg-gray-100 border-b border-gray-200 py-2 sm:py-2.5 px-2 text-center whitespace-nowrap w-[70px]"
                >
                  <span>{isGr ? 'Logbook' : 'Logbook'}</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedRoutes.map((route) => {
              const isSelected = selectedRoute?.id === route.id;
              const entry = getEntry(route.id);
              const isClassic = route.isClassic || route.defaultStars >= 4;

              return (
                <React.Fragment key={route.id}>
                  {/* Master Route Row */}
                  <tr
                    id={`route-row-${route.id}`}
                    onClick={() => onSelectRoute(isSelected ? null : route, { scroll: false })}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-100/75 font-medium ring-1 ring-inset ring-[#1e3a8a]/30'
                        : route.isTopRopeOnly
                        ? 'bg-amber-50/30 hover:bg-amber-50/60'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {/* # Column */}
                    <td className="py-2 px-3 font-bold text-gray-900 sticky left-0 bg-inherit z-[2]">
                      <span
                        className={`inline-flex items-center justify-center w-[30px] h-6 rounded text-xs font-bold ${
                          isSelected
                            ? 'bg-[#1e3a8a] text-white shadow-2xs'
                            : route.isTopRopeOnly
                            ? 'bg-amber-100 text-amber-950 border border-amber-300/80'
                            : 'bg-gray-100 text-gray-800 border border-gray-200/70'
                        }`}
                      >
                        {route.pdfNumber || '—'}
                      </span>
                    </td>

                    {/* Route Name + Wall + Pitch + ♫ / ★ */}
                    <td className="py-2 px-3 font-semibold text-gray-900">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>{isGr ? route.nameGr : route.nameEn}</span>
                        {hasMultipleWalls && route.wall && (
                          <span className="text-[10px] text-gray-400 font-normal">
                            (T{route.wall})
                          </span>
                        )}

                        {/* Multi-Pitch badge if applicable */}
                        {route.pitch && (
                          <span className="text-[10px] font-semibold text-sky-800 bg-sky-50 border border-sky-200 px-1.5 py-0.2 rounded leading-tight">
                            {route.pitch}
                          </span>
                        )}

                        {/* Musical Note (♫) for Classics, or Small Grey Stars for Regular Routes */}
                        {isClassic ? (
                          <span
                            className="inline-flex items-center text-gray-400 ml-1 cursor-help"
                            title={
                              isGr
                                ? 'Κλασική / Ιστορική διαδρομή (♫)'
                                : 'Classic / Historic climb (♫)'
                            }
                          >
                            <BeamedNotesIcon className="w-3 h-3 text-gray-400" />
                          </span>
                        ) : route.defaultStars > 0 ? (
                          <span
                            className="text-gray-400 text-[10px] tracking-tight leading-none ml-1 cursor-help"
                            title={
                              isGr
                                ? `Αξιολόγηση Συλλόγου: ${route.defaultStars}★`
                                : `Club Rating: ${route.defaultStars}★`
                            }
                          >
                            {'★'.repeat(route.defaultStars)}
                          </span>
                        ) : null}
                      </div>
                    </td>

                    {/* Combined Grade: French first / UIAA second */}
                    <td className="py-2 px-2 text-center whitespace-nowrap">
                      <div className="inline-flex items-center justify-center gap-1.5">
                        <span
                          className={`inline-flex items-center justify-center w-[38px] h-6 rounded text-xs font-bold leading-none shadow-2xs ${getGradeBadgeClass(
                            route.french
                          )}`}
                        >
                          {route.french}
                        </span>
                        <span className="inline-flex items-center justify-center w-[46px] h-6 rounded text-xs font-semibold leading-none border border-gray-300 text-gray-700 bg-transparent">
                          {route.uiaa}
                        </span>
                      </div>
                    </td>

                    {/* Length (Ανάπτ.) - Hidden on mobile */}
                    <td
                      className="hidden sm:table-cell py-2 px-1.5 text-center text-gray-700 whitespace-nowrap"
                      title={
                        isGr
                          ? `Ανάπτυγμα: ${route.length}m`
                          : `Length: ${route.length}m`
                      }
                    >
                      {route.length}m
                    </td>

                    {/* Protection / Bolts (Ασφ.) - Hidden on mobile */}
                    <td className="hidden sm:table-cell py-2 px-1.5 text-center whitespace-nowrap">
                      {route.isTopRopeOnly ? (
                        <span
                          className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[11px] border border-amber-300 cursor-help"
                          title={
                            isGr
                              ? 'Top Rope* (χωρίς ενδιάμεσες ασφάλειες και χωρίς μόνιμο ρελέ)'
                              : 'Top Rope* (no intermediate bolts, no fixed anchor)'
                          }
                        >
                          TR*
                        </span>
                      ) : (
                        <span
                          className="font-medium text-gray-800"
                          title={
                            isGr
                              ? `Ασφάλειες: ${route.bolts} πλακέτες`
                              : `Protection: ${route.bolts} bolts`
                          }
                        >
                          {route.bolts}
                        </span>
                      )}
                    </td>

                    {/* Setters - Hidden on mobile & small tablet, visible from md (768px) */}
                    <td
                      className="hidden md:table-cell py-2 px-3 text-center text-gray-700"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex flex-col items-center justify-center gap-0.5 leading-snug">
                        {(route.setters || []).map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => onFilterBySetter(s)}
                            className="text-xs text-[#1e3a8a] hover:underline font-medium text-center whitespace-nowrap"
                            title={
                              isGr
                                ? `Φιλτράρισμα ανά ανοίξαντα: ${s}`
                                : `Filter by setter: ${s}`
                            }
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </td>

                    {/* Year - Hidden on mobile */}
                    <td
                      className="hidden sm:table-cell py-2 px-2 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {route.year ? (
                        <button
                          type="button"
                          onClick={() => onFilterByYear(String(route.year))}
                          className="text-xs font-semibold text-gray-700 hover:text-[#1e3a8a] hover:underline"
                          title={
                            isGr
                              ? `Φιλτράρισμα ανά έτος: ${route.year}`
                              : `Filter by year: ${route.year}`
                          }
                        >
                          {route.year}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>

                    {/* Member Logbook Mini Status Pill - Hidden on mobile & small tablet, visible from md (768px) */}
                    {isMemberOrAdmin && (
                      <td
                        className="hidden md:table-cell py-2 px-2 text-center whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center justify-center gap-1">
                          {entry.favourite && (
                            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                          )}
                          {entry.status && entry.status !== 'todo' && (
                            <span
                              className="text-[10px] font-extrabold px-1 rounded bg-emerald-100 text-emerald-800 border border-emerald-300"
                              title={isGr ? 'Ολοκληρωμένη' : 'Completed'}
                            >
                              ✓ {entry.status.toUpperCase()}
                            </span>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>

                  {/* Expandable Accordion Drawer Row */}
                  {isSelected && (
                    <tr
                      className={`${
                        disableRowAccordionOnDesktop ? 'table-row lg:hidden ' : ''
                      }bg-blue-50/50 border-b border-blue-200/60`}
                    >
                      <td colSpan={colSpanTotal} className="p-3 sm:p-4 text-xs">
                        <div className="space-y-3">
                          {/* Mobile Route Specs Strip (Hidden on desktop since already in table columns) */}
                          <div className="sm:hidden flex flex-wrap items-center gap-x-3 gap-y-1.5 p-2 bg-white/85 rounded-lg border border-blue-100 text-[11px] text-gray-700">
                            <div className="inline-flex items-center gap-1">
                              <span className="font-semibold text-gray-500">{isGr ? 'Ανάπτ:' : 'Length:'}</span>
                              <span className="font-bold text-gray-900">{route.length}m</span>
                            </div>

                            <div className="inline-flex items-center gap-1">
                              <span className="font-semibold text-gray-500">{isGr ? 'Ασφ:' : 'Bolts:'}</span>
                              {route.isTopRopeOnly ? (
                                <span className="px-1 py-0.5 rounded bg-amber-100 text-amber-900 font-bold border border-amber-300">
                                  TR*
                                </span>
                              ) : (
                                <span className="font-bold text-gray-900">{route.bolts}</span>
                              )}
                            </div>

                            <div className="inline-flex items-center gap-1">
                              <span className="font-semibold text-gray-500">{isGr ? 'Έτος:' : 'Year:'}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onFilterByYear(String(route.year));
                                }}
                                className="font-bold text-[#1e3a8a] underline"
                              >
                                {route.year}
                              </button>
                            </div>

                            <div className="inline-flex items-center gap-1 flex-wrap">
                              <span className="font-semibold text-gray-500">{isGr ? 'Ανοίξαντες:' : 'Setters:'}</span>
                              <span className="inline-flex items-center gap-1 flex-wrap">
                                {route.setters.map((s, idx) => (
                                  <React.Fragment key={s}>
                                    {idx > 0 && <span className="text-gray-400">·</span>}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onFilterBySetter(s);
                                      }}
                                      className="font-medium text-[#1e3a8a] hover:underline"
                                    >
                                      {s}
                                    </button>
                                  </React.Fragment>
                                ))}
                              </span>
                            </div>
                          </div>
                          {/* Row 1: Beta Note & Rope Length Recommendation */}
                          <div className="flex flex-wrap items-start justify-between gap-2.5">
                            <div className="flex items-start gap-2 max-w-2xl">
                              <Info className="w-4 h-4 text-[#1e3a8a] shrink-0 mt-0.5" />
                              <p className="text-xs text-gray-700 leading-relaxed font-normal">
                                {(isGr ? route.noteGr : route.noteEn) ||
                                  (isGr
                                    ? 'Δεν υπάρχουν επιπλέον πληροφορίες.'
                                    : 'No additional beta available.')}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {/* Rope Length Badge */}
                              <span
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-100 text-[#1e3a8a] font-bold text-xs border border-blue-200"
                                title={
                                  isGr
                                    ? route.length >= 35
                                      ? 'Προτεινόμενο σχοινί: τουλάχιστον 70m ή διπλά σχοινιά για πολυσχοινιά'
                                      : `Προτεινόμενο μήκος σχοινιού: τουλάχιστον ${route.length * 2}m`
                                    : route.length >= 35
                                    ? 'Recommended rope: at least 70m or half ropes for multi-pitch'
                                    : `Recommended rope length: at least ${route.length * 2}m`
                                }
                              >
                                <Cable className="w-3 h-3 text-[#1e3a8a]" />
                                <span>
                                  {route.length >= 35
                                    ? isGr
                                      ? 'Σχοινί ≥ 70m (Πολυσχοινιά)'
                                      : 'Rope ≥ 70m (Multi-pitch)'
                                    : isGr
                                    ? `Σχοινί ≥ ${route.length * 2}m`
                                    : `Rope ≥ ${route.length * 2}m`}
                                </span>
                              </span>

                              {/* Share Direct Link */}
                              <button
                                type="button"
                                onClick={(e) => handleShareRoute(e, route)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold text-gray-600 hover:text-gray-900 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                                title={
                                  isGr
                                    ? 'Αντιγραφή συνδέσμου διαδρομής'
                                    : 'Copy link to route'
                                }
                              >
                                <Share2 className="w-3 h-3 text-gray-500" />
                                <span>
                                  {copiedId === route.id
                                    ? isGr
                                      ? 'Αντιγράφηκε!'
                                      : 'Copied!'
                                    : isGr
                                    ? 'Κοινοποίηση'
                                    : 'Share'}
                                </span>
                              </button>
                            </div>
                          </div>

                          {/* Row 2 (Member/Admin ONLY): Personal Logbook Actions & Notes */}
                          {isMemberOrAdmin && (
                            <div className="pt-2.5 border-t border-blue-200/60 flex flex-wrap items-center justify-between gap-2 bg-white/80 p-2.5 rounded-lg border border-blue-100">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[11px] font-bold text-gray-700 mr-1">
                                  {isGr ? 'Καταγραφή:' : 'Log tick:'}
                                </span>
                                {TICK_TYPES.map((t) => {
                                  const active = entry.status === t.id;
                                  return (
                                    <button
                                      key={t.id}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleTickStatus(route.id, t.id);
                                      }}
                                      className={`px-2 py-1 rounded-md text-xs font-bold border transition-colors ${
                                        active
                                          ? t.color
                                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                                      }`}
                                      title={isGr ? t.labelGr : t.labelEn}
                                    >
                                      {t.short} ({isGr ? t.labelGr : t.labelEn})
                                    </button>
                                  );
                                })}

                                {/* Favourite Heart Toggle */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleFavourite(route.id);
                                  }}
                                  className={`ml-1 px-2 py-1 rounded-md border text-xs font-semibold inline-flex items-center gap-1 transition-colors ${
                                    entry.favourite
                                      ? 'bg-rose-50 border-rose-300 text-rose-700'
                                      : 'bg-white border-gray-200 text-gray-600 hover:text-rose-600'
                                  }`}
                                  title={isGr ? 'Αγαπημένη' : 'Favourite'}
                                >
                                  <Heart
                                    className={`w-3.5 h-3.5 ${
                                      entry.favourite
                                        ? 'fill-rose-500 text-rose-500'
                                        : 'text-gray-400'
                                    }`}
                                  />
                                  <span>{isGr ? 'Αγαπημένη' : 'Fav'}</span>
                                </button>
                              </div>

                              {/* Private Note Input */}
                              <div className="w-full sm:w-auto flex-1 sm:max-w-xs">
                                <input
                                  type="text"
                                  placeholder={
                                    isGr
                                      ? 'Προσωπικές σημειώσεις (beta)...'
                                      : 'Personal beta note...'
                                  }
                                  defaultValue={entry.notes || ''}
                                  onClick={(e) => e.stopPropagation()}
                                  onBlur={(e) =>
                                    onUpdateEntry(route.id, { notes: e.target.value })
                                  }
                                  className="w-full h-7 px-2 text-xs rounded border border-gray-200 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#1e3a8a]"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footnote from PDF */}
      <div className="px-4 py-3 bg-amber-50/80 border-t border-amber-200/80 text-xs text-amber-950 leading-relaxed space-y-1.5">
        <div>
          <span className="font-bold">
            * {isGr ? 'ΠΡΟΣΟΧΗ:' : 'WARNING:'}
          </span>{' '}
          {isGr
            ? 'Οι 7 κίτρινες γραμμές (Α1–Α4, Δ1–Δ3) είναι αποκλειστικά Top Rope ή Trad (χωρίς ενδιάμεσες ασφάλειες) και δεν έχουν μόνιμο ρελέ (δημιουργία ρελέ σε δεντράκια ψηλά ή με καρύδια/friends).'
            : 'The 7 yellow lines (A1–A4, D1–D3) are strictly Top Rope or Trad (no intermediate bolts) and do not have a permanent lower-off anchor (anchor on trees above or with nuts/cams).'}
        </div>
        <div className="pt-1.5 border-t border-amber-200/60 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">
              {isGr ? 'Κράνος απαραίτητο!' : 'Helmet mandatory!'}
            </span>{' '}
            {isGr
              ? 'Λόγω των πυρκαγιών (1999 & 2015) είχαν αποκολληθεί φλοίδες βράχου — παρά τον εκτεταμένο καθαρισμό σαθρών το 2017, η χρήση κράνους είναι απαραίτητη πάντα και παντού.'
              : 'Due to the 1999 & 2015 wildfires, rock flakes had detached — despite extensive loose-rock cleaning in 2017, wearing a helmet is mandatory at all times.'}
          </div>
        </div>
      </div>
    </Card>
  );
}
