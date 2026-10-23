import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Sun,
  CloudSun,
  Trophy,
  Heart,
  ShieldAlert,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Compass,
  BookOpen,
  Wrench,
  Car,
  Mountain,
  Copy,
  Check,
  ExternalLink,
  Footprints,
} from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import {
  FRENCH_GRADE_ORDER,
  UIAA_BY_FRENCH,
  GRADE_BANDS,
  CRAG_INFO_2018,
  getGradeTier,
} from '../data/kokkiniPistaRoutes';
import { isCompletedTick } from '../hooks/useClimberLogbook';
import {
  sectors,
  PARKING_TRAILHEADS,
  getGoogleMapsPinUrl,
} from '../data/sectorsData';

// Exact seasonal & hourly sun/shade schedule from cms_b4e1305033.pdf (Page 4):
// "Στην «ΚΟΚΚΙΝΗ ΠΙΣΤΑ» το καλοκαίρι έχει σκιά από το πρωί μέχρι τις 10.00 και από τις 11.00 και μετά μέχρι το βράδυ.
//  Το χειμώνα και οι δυο πίστες είναι στην σκιά όλη την ημέρα..."
export function getHymettusSunStatus(isGr) {
  let athensHour = 12;
  let athensMonth = 6; // 1..12
  try {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Athens',
      hour: 'numeric',
      month: 'numeric',
      hour12: false,
    }).formatToParts(now);
    const h = parts.find((p) => p.type === 'hour')?.value;
    const m = parts.find((p) => p.type === 'month')?.value;
    if (h !== undefined) athensHour = parseInt(h, 10);
    if (m !== undefined) athensMonth = parseInt(m, 10);
  } catch {
    const now = new Date();
    athensHour = now.getHours();
    athensMonth = now.getMonth() + 1;
  }

  const isWinter = athensMonth >= 11 || athensMonth <= 3;

  if (athensHour < 7 || athensHour >= 20) {
    return {
      state: 'night',
      badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
      label: isGr ? 'Νύχτα στον Υμηττό' : 'Night hours',
      detail: isGr
        ? 'Καλοκαίρι: Σκιά έως 10:00 & 11:00–βράδυ · Χειμώνας: Σκιά όλη μέρα'
        : 'Summer: Shade until 10:00 & 11:00–dusk · Winter: Shade all day',
    };
  }

  if (isWinter) {
    return {
      state: 'shade',
      badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      label: isGr ? 'Σε Σκιά τώρα (Χειμερινή περίοδος)' : 'In Shade now (Winter)',
      detail: isGr
        ? `Ώρα Αθήνας ~${athensHour}:00 · Το χειμώνα η Κόκκινη Πίστα βρίσκεται σε σκιά όλη την ημέρα.`
        : `Athens ~${athensHour}:00 · In winter Kokkini Pista stays in the shade all day.`,
    };
  }

  if (athensHour < 10 || athensHour >= 11) {
    return {
      state: 'shade',
      badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      label: isGr ? 'Σε Σκιά τώρα' : 'In Shade now',
      detail: isGr
        ? `Ώρα Αθήνας ~${athensHour}:00 · Σκιά πρωί έως 10:00 & από 11:00 μέχρι το βράδυ.`
        : `Athens ~${athensHour}:00 · Shaded morning until 10:00 & from 11:00 until dusk.`,
    };
  }

  return {
    state: 'sun',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    label: isGr ? 'Ήλιος τώρα (10:00–11:00)' : 'In Sun now (10:00–11:00)',
    detail: isGr
      ? `Ώρα Αθήνας ~${athensHour}:00 · Σύντομο παράθυρο ήλιου 10:00–11:00 (ξανά σε σκιά από 11:00 έως το βράδυ).`
      : `Athens ~${athensHour}:00 · Brief sun window 10:00–11:00 (returns to shade from 11:00 until dusk).`,
  };
}

const HYMETTUS_ALL_GRADES = [
  '4a',
  '4b',
  '4c',
  '5a',
  '5b',
  '5c',
  '6a',
  '6a+',
  '6b',
  '6b+',
  '6c',
  '6c+',
  '7a',
  '7a+',
  '7b',
  '7b+',
  '7c',
  '8a',
];

const HYMETTUS_UIAA_MAP = {
  ...UIAA_BY_FRENCH,
  '4a': 'IV',
  '4b': 'IV+',
  '4c': 'IV+',
  '7a+': 'VIII+',
  '7b': 'VIII+',
  '7b+': 'IX-',
  '7c': 'IX',
  '8a': 'IX+',
};

export default function GradeChartAndStats({
  isGr,
  userMode, // 'guest' | 'member' | 'admin'
  routes,
  gradeSystem,
  selectedGrades,
  onToggleGrade,
  onSelectGradeTier,
  onClearGrades,
  getEntry,
  onOpenLogbookModal,
  histogramOnly = false,
  alwaysOpen = false,
  cragInfo = CRAG_INFO_2018,
}) {
  // Compact on mobile: collapsed by default on small viewports (<768px), open on desktop
  const [mobileExpanded, setMobileExpanded] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );
  const [histogramOpen, setHistogramOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : false
  );
  const [showCragGuideNotes, setShowCragGuideNotes] = useState(false);
  const [copiedParkingCoords, setCopiedParkingCoords] = useState(false);
  const [copiedCragCoords, setCopiedCragCoords] = useState(false);

  const sectorMeta = useMemo(() => {
    const k = cragInfo?.key || cragInfo?.id || 'kokkini';
    return sectors.find((s) => s.key === k) || sectors[0];
  }, [cragInfo]);

  const parkingMeta = useMemo(() => {
    return (
      PARKING_TRAILHEADS[sectorMeta?.parkingId] ||
      PARKING_TRAILHEADS.ilioupoli
    );
  }, [sectorMeta]);

  const handleCopyParking = async () => {
    const text = `${parkingMeta.lat}, ${parkingMeta.lng}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedParkingCoords(true);
      setTimeout(() => setCopiedParkingCoords(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleCopyCrag = async () => {
    const text = `${sectorMeta.lat}, ${sectorMeta.lng}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCragCoords(true);
      setTimeout(() => setCopiedCragCoords(false), 2000);
    } catch {
      // fallback
    }
  };

  const parkingGoogleUrl = useMemo(
    () => getGoogleMapsPinUrl(parkingMeta.lat, parkingMeta.lng, parkingMeta.nameEn),
    [parkingMeta]
  );
  const cragGoogleUrl = useMemo(
    () => getGoogleMapsPinUrl(sectorMeta.lat, sectorMeta.lng, sectorMeta.nameEn),
    [sectorMeta]
  );

  const isMemberOrAdmin = userMode === 'member' || userMode === 'admin';
  const sunStatus = useMemo(() => getHymettusSunStatus(isGr), [isGr]);

  const gradeColumns = useMemo(() => {
    const present = new Set(routes.map((r) => r.french).filter(Boolean));
    const indices = Array.from(present)
      .map((g) => HYMETTUS_ALL_GRADES.indexOf(g))
      .filter((i) => i >= 0);
    if (indices.length === 0) return [];
    const minIdx = Math.min(...indices);
    const maxIdx = Math.max(...indices);
    const fullSpan = HYMETTUS_ALL_GRADES.slice(minIdx, maxIdx + 1);

    const rawStats = {};
    fullSpan.forEach((g) => {
      rawStats[g] = {
        french: g,
        uiaa: HYMETTUS_UIAA_MAP[g] || UIAA_BY_FRENCH[g] || '—',
        total: 0,
        completed: 0,
        tier: getGradeTier(g),
        isGap: false,
      };
    });

    routes.forEach((r) => {
      if (!rawStats[r.french]) return;
      rawStats[r.french].total += 1;
      if (isMemberOrAdmin) {
        const entry = getEntry(r.id);
        if (isCompletedTick(entry.status)) {
          rawStats[r.french].completed += 1;
        }
      }
    });

    // Group 2 or more consecutive 0-count grades into a single compact gap column
    const columns = [];
    let zeroRun = [];

    const flushZeroRun = () => {
      if (zeroRun.length === 0) return;
      if (zeroRun.length === 1) {
        columns.push(rawStats[zeroRun[0]]);
      } else {
        const first = zeroRun[0];
        const last = zeroRun[zeroRun.length - 1];
        columns.push({
          isGap: true,
          french: `${first}–${last}`,
          uiaa: `${rawStats[first].uiaa}–${rawStats[last].uiaa}`,
          total: 0,
          completed: 0,
          tier: 'gap',
          grades: [...zeroRun],
        });
      }
      zeroRun = [];
    };

    fullSpan.forEach((g) => {
      if (rawStats[g].total === 0) {
        zeroRun.push(g);
      } else {
        flushZeroRun();
        columns.push(rawStats[g]);
      }
    });
    flushZeroRun();

    return columns;
  }, [routes, isMemberOrAdmin, getEntry]);

  const maxCount = useMemo(
    () => Math.max(1, ...gradeColumns.map((s) => s.total)),
    [gradeColumns]
  );

  const bandCounts = useMemo(() => {
    const counts = { easy: 0, medium: 0, hard: 0, extreme: 0 };
    routes.forEach((r) => {
      const t = getGradeTier(r.french);
      if (counts[t] !== undefined) {
        counts[t] += 1;
      }
    });
    return counts;
  }, [routes]);

  const derivedLengths = useMemo(() => {
    const lens = routes
      .map((r) => r.length)
      .filter((l) => typeof l === 'number' && l > 0);
    if (lens.length === 0) return '—';
    const min = Math.min(...lens);
    const max = Math.max(...lens);
    return min === max ? `${min}m` : `${min}m – ${max}m`;
  }, [routes]);

  const derivedQuickdraws = useMemo(() => {
    const boltsList = routes
      .map((r) => r.bolts)
      .filter((b) => typeof b === 'number' && b > 0);
    if (boltsList.length === 0) return '—';
    const max = Math.max(...boltsList);
    return `≤ ${max + 2}`;
  }, [routes]);

  const summary = useMemo(() => {
    let completed = 0;
    let onsight = 0;
    let flash = 0;
    let redpoint = 0;
    let favourites = 0;
    if (isMemberOrAdmin) {
      routes.forEach((r) => {
        const e = getEntry(r.id);
        if (isCompletedTick(e.status)) completed += 1;
        if (e.status === 'onsight') onsight += 1;
        if (e.status === 'flash') flash += 1;
        if (e.status === 'redpoint') redpoint += 1;
        if (e.favourite) favourites += 1;
      });
    }
    return { completed, onsight, flash, redpoint, favourites };
  }, [routes, getEntry, isMemberOrAdmin]);

  // Grade tier colors: Green (Easy), Orangy (Medium), Red (Hard), Black (Very Hard)
  const barColors = {
    easy: {
      base: 'bg-green-500/85 hover:bg-green-600',
      active: 'bg-green-600 ring-2 ring-green-800 ring-offset-1',
      sent: 'bg-green-950/40',
    },
    medium: {
      base: 'bg-amber-500/85 hover:bg-amber-600',
      active: 'bg-amber-600 ring-2 ring-amber-800 ring-offset-1',
      sent: 'bg-amber-950/40',
    },
    hard: {
      base: 'bg-rose-500/85 hover:bg-rose-600',
      active: 'bg-rose-600 ring-2 ring-rose-800 ring-offset-1',
      sent: 'bg-rose-950/40',
    },
    extreme: {
      base: 'bg-zinc-800/90 hover:bg-black',
      active: 'bg-black ring-2 ring-zinc-900 ring-offset-1',
      sent: 'bg-zinc-950/60',
    },
  };

  const renderGradeColumns = (isCompact = false) => (
    <div
      tabIndex={0}
      aria-label={isGr ? 'Κατανομή βαθμολογιών' : 'Grade distribution'}
      className="flex items-end justify-between gap-0.5 sm:gap-1 w-full pt-2.5 pb-1 border-b border-gray-100 overflow-x-auto sm:overflow-x-visible focus:outline-none"
    >
      {gradeColumns.map((col) => {
        const isSelected = selectedGrades.includes(col.french);
        const isDimmed = selectedGrades.length > 0 && !isSelected;
        const heightPct =
          col.total > 0
            ? Math.max(12, Math.round((col.total / maxCount) * 100))
            : 0;
        const sentPct =
          isMemberOrAdmin && col.total > 0
            ? Math.round((col.completed / col.total) * 100)
            : 0;
        const colors = barColors[col.tier] || barColors.medium;
        const isClickable = !col.isGap && col.total > 0;

        return (
          <div
            key={col.french}
            className={`flex flex-col items-center justify-end flex-1 min-w-[18px] sm:min-w-[20px] max-w-[34px] group transition-opacity ${
              col.isGap || col.total === 0
                ? 'opacity-40'
                : isDimmed
                ? 'opacity-30 hover:opacity-80'
                : 'opacity-100'
            }`}
          >
            {/* Top Count */}
            <span
              className={`text-[9px] sm:text-[10px] font-bold mb-0.5 tabular-nums leading-none ${
                isSelected
                  ? 'text-[#1e3a8a] scale-110 font-extrabold'
                  : col.isGap || col.total === 0
                  ? 'text-gray-300'
                  : 'text-gray-700'
              }`}
            >
              {col.isGap
                ? '—'
                : isMemberOrAdmin && col.completed > 0
                ? `${col.completed}/${col.total}`
                : col.total}
            </span>

            {/* Bar Section */}
            <button
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onToggleGrade(col.french)}
              className={`w-full flex flex-col justify-end items-center ${
                isCompact ? 'h-[72px] sm:h-20' : 'h-24 sm:h-28'
              } focus:outline-none ${
                isClickable ? 'cursor-pointer' : 'cursor-default'
              }`}
              title={
                col.isGap
                  ? `${col.french}: ${isGr ? 'Χωρίς διαδρομές' : 'No routes'}`
                  : `${col.french} (${col.uiaa}): ${col.total} ${
                      isGr ? 'διαδρομές' : 'routes'
                    }`
              }
            >
              {col.isGap ? (
                <div className="w-full h-0.5 border-b border-dashed border-gray-400 my-0.5" />
              ) : col.total === 0 ? (
                <div className="w-full max-w-[14px] sm:max-w-[18px] h-0.5 bg-gray-300 rounded-xs" />
              ) : (
                <div
                  className={`w-full max-w-[14px] sm:max-w-[18px] rounded-t-xs relative overflow-hidden transition-all duration-200 ${
                    isSelected ? colors.active : colors.base
                  }`}
                  style={{ height: `${heightPct}%` }}
                >
                  {sentPct > 0 && (
                    <div
                      className={`absolute bottom-0 inset-x-0 ${colors.sent} transition-all`}
                      style={{ height: `${sentPct}%` }}
                    />
                  )}
                </div>
              )}
            </button>

            {/* Connected Grade Legend Directly Below */}
            <button
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onToggleGrade(col.french)}
              className={`w-full flex flex-col items-center mt-1 pt-1 border-t border-gray-100 transition-colors ${
                !isClickable
                  ? 'cursor-default'
                  : isSelected
                  ? 'bg-[#1e3a8a]/10 text-[#1e3a8a] rounded'
                  : 'hover:bg-gray-100/70 rounded cursor-pointer'
              }`}
            >
              <span className="text-[10px] sm:text-[11px] font-bold text-gray-900 leading-tight truncate max-w-full">
                {gradeSystem === 'uiaa'
                  ? col.isGap
                    ? '—'
                    : col.uiaa.split(' ')[0]
                  : col.french}
              </span>
              <span className="text-[8px] sm:text-[9px] text-gray-500 leading-tight truncate max-w-full">
                {gradeSystem === 'uiaa'
                  ? col.french
                  : col.isGap
                  ? '—'
                  : col.uiaa.split(' ')[0]}
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );

  if (histogramOnly) {
    if (alwaysOpen) {
      return (
        <Card className="border border-gray-200 bg-white overflow-hidden shadow-2xs">
          <CardContent className="p-3 sm:p-3.5 space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-4 h-4 text-[#1e3a8a] flex-shrink-0" />
              <h3 className="text-xs sm:text-sm font-bold text-gray-900">
                {isGr ? 'Κατανομή Βαθμολογιών' : 'Grade Distribution'}
              </h3>
            </div>

            {/* 4-Band Filter Pills */}
            <div className="flex flex-wrap items-center gap-1 mb-2">
              {GRADE_BANDS.map((band) => {
                const count = bandCounts[band.id] || 0;
                const disabled = count === 0;
                return (
                  <button
                    key={band.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => onSelectGradeTier(band.id)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-opacity ${
                      band.bgSolid
                    } ${
                      disabled
                        ? 'opacity-35 cursor-not-allowed'
                        : 'hover:opacity-90 cursor-pointer'
                    }`}
                    title={`${isGr ? band.nameGr : band.nameEn}: ${
                      gradeSystem === 'uiaa' ? band.labelUiaa : band.labelFr
                    }`}
                  >
                    {gradeSystem === 'uiaa' ? band.labelUiaa : band.labelFr} ({count})
                  </button>
                );
              })}
              {selectedGrades.length > 0 && (
                <button
                  type="button"
                  onClick={onClearGrades}
                  className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  {isGr ? 'Όλες' : 'Reset'}
                </button>
              )}
            </div>

            {/* Connected Grade Columns: Bars + Labels together */}
            {renderGradeColumns(true)}
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="border border-gray-200 bg-white overflow-hidden shadow-2xs">
        <button
          type="button"
          onClick={() => setHistogramOpen((v) => !v)}
          className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-gray-50/70 transition-colors"
          aria-expanded={histogramOpen}
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#1e3a8a] flex-shrink-0" />
            <h3 className="text-xs sm:text-sm font-bold text-gray-900">
              {isGr ? 'Κατανομή Βαθμολογιών' : 'Grade Distribution'}
            </h3>
          </div>

          <div className="flex items-center">
            {histogramOpen ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </div>
        </button>

        {histogramOpen && (
          <CardContent className="px-3.5 pb-2.5 pt-2 border-t border-gray-100">
            {/* 4-Band Filter Pills */}
            <div className="flex flex-wrap items-center gap-1 mb-2">
              {GRADE_BANDS.map((band) => {
                const count = bandCounts[band.id] || 0;
                const disabled = count === 0;
                return (
                  <button
                    key={band.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => onSelectGradeTier(band.id)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-opacity ${
                      band.bgSolid
                    } ${
                      disabled
                        ? 'opacity-35 cursor-not-allowed'
                        : 'hover:opacity-90 cursor-pointer'
                    }`}
                    title={`${isGr ? band.nameGr : band.nameEn}: ${
                      gradeSystem === 'uiaa' ? band.labelUiaa : band.labelFr
                    }`}
                  >
                    {gradeSystem === 'uiaa' ? band.labelUiaa : band.labelFr} ({count})
                  </button>
                );
              })}
              {selectedGrades.length > 0 && (
                <button
                  type="button"
                  onClick={onClearGrades}
                  className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  {isGr ? 'Όλες' : 'Reset'}
                </button>
              )}
            </div>

            {/* Connected Grade Columns: Bars + Labels together */}
            {renderGradeColumns(true)}
          </CardContent>
        )}
      </Card>
    );
  }

  return (
    <div className="mb-3">
      {/* Compact Mobile Toggle Header */}
      <div className="md:hidden mb-2">
        <button
          type="button"
          onClick={() => setMobileExpanded((v) => !v)}
          className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 shadow-2xs flex items-center justify-between text-xs font-semibold text-gray-800"
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#1e3a8a]" />
            <span>
              {isGr
                ? 'Γράφημα Βαθμών & Πληροφορίες'
                : 'Grade Chart & Crag Info'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Mini stacked pill preview */}
            <div className="flex items-center gap-0.5 w-16 h-2 rounded-full overflow-hidden bg-gray-100">
              <div className="h-full bg-green-500" style={{ flex: bandCounts.easy }} />
              <div className="h-full bg-amber-500" style={{ flex: bandCounts.medium }} />
              <div className="h-full bg-rose-500" style={{ flex: bandCounts.hard }} />
              {bandCounts.extreme > 0 && (
                <div className="h-full bg-zinc-900" style={{ flex: bandCounts.extreme }} />
              )}
            </div>
            {mobileExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </div>
        </button>
      </div>

      {mobileExpanded && (
        <div className="space-y-3">
          <div className="grid xl:grid-cols-12 gap-3">
            {/* Interactive Grade Distribution Bar Chart */}
            <Card className="xl:col-span-6 border border-gray-200 bg-white">
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#1e3a8a]" />
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-gray-900">
                        {isGr
                          ? 'Κατανομή Βαθμολογιών'
                          : 'Grade Distribution'}
                      </h3>
                      <p className="text-[11px] text-gray-500">
                        {isGr
                          ? 'Πατήστε μπάρα ή ζώνη για φιλτράρισμα'
                          : 'Tap any grade bar or band to filter'}
                      </p>
                    </div>
                  </div>

                  {/* 4-Band Filter Pills */}
                  <div className="flex flex-wrap items-center gap-1">
                    {GRADE_BANDS.map((band) => {
                      const count = bandCounts[band.id] || 0;
                      const disabled = count === 0;
                      return (
                        <button
                          key={band.id}
                          type="button"
                          disabled={disabled}
                          onClick={() => onSelectGradeTier(band.id)}
                          className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full border transition-opacity ${
                            band.bgSolid
                          } ${
                            disabled
                              ? 'opacity-35 cursor-not-allowed'
                              : 'hover:opacity-90 cursor-pointer'
                          }`}
                          title={`${isGr ? band.nameGr : band.nameEn}: ${
                            gradeSystem === 'uiaa' ? band.labelUiaa : band.labelFr
                          }`}
                        >
                          {gradeSystem === 'uiaa' ? band.labelUiaa : band.labelFr} ({count})
                        </button>
                      );
                    })}
                    {selectedGrades.length > 0 && (
                      <button
                        type="button"
                        onClick={onClearGrades}
                        className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        {isGr ? 'Όλες' : 'Reset'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Connected Grade Columns: Bars + Labels together */}
                {renderGradeColumns(false)}
              </CardContent>
            </Card>

            {/* Right Column: Live Sun/Shade + (Member/Admin Logbook OR Guest Quick Stats) */}
            <Card className="xl:col-span-6 border border-gray-200 bg-white flex flex-col justify-between">
              <CardContent className="p-3 sm:p-4 space-y-2.5">
                {/* Live Sun/Shade Indicator */}
                <div className="p-2.5 rounded-lg border bg-gray-50/80 border-gray-200/80">
                  <div className="flex items-center gap-2">
                    {sunStatus.state === 'shade' ? (
                      <CloudSun className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <Sun className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    )}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                        {isGr ? 'Σκιά / Ήλιος:' : 'Shade / Sun:'}
                      </span>
                      <Badge className={`${sunStatus.badgeClass} border text-[11px] font-semibold`}>
                        {sunStatus.label}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-600 mt-1 leading-snug">
                    {sunStatus.detail}
                  </p>
                </div>

                {isMemberOrAdmin ? (
                  /* Logged-in Member / Admin View: Personal Logbook Summary */
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-gray-800 uppercase tracking-wide flex items-center gap-1">
                        <Trophy className="w-3.5 h-3.5 text-[#1e3a8a]" />
                        {isGr ? 'Το Ημερολόγιό μου' : 'My Crag Logbook'}
                      </span>
                      <button
                        type="button"
                        onClick={onOpenLogbookModal}
                        className="text-[11px] font-semibold text-[#1e3a8a] hover:underline"
                      >
                        {isGr ? 'Backup / Λίστα →' : 'Backup / List →'}
                      </button>
                    </div>

                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2 border border-gray-200">
                      <div
                        className="h-full bg-gradient-to-r from-[#1e3a8a] to-emerald-500 transition-all duration-300"
                        style={{
                          width: `${Math.round(
                            (summary.completed / routes.length) * 100
                          )}%`,
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-4 gap-1 text-center">
                      <div className="bg-gray-50 rounded-md p-1 border border-gray-100">
                        <div className="text-xs font-bold text-gray-900">
                          {summary.completed}/{routes.length}
                        </div>
                        <div className="text-[9px] text-gray-500">
                          {isGr ? 'Σύνολο' : 'Sent'}
                        </div>
                      </div>
                      <div className="bg-emerald-50/70 rounded-md p-1 border border-emerald-100">
                        <div className="text-xs font-bold text-emerald-800">
                          {summary.onsight}
                        </div>
                        <div className="text-[9px] text-emerald-700">OS</div>
                      </div>
                      <div className="bg-amber-50/70 rounded-md p-1 border border-amber-100">
                        <div className="text-xs font-bold text-amber-800">
                          {summary.flash}
                        </div>
                        <div className="text-[9px] text-amber-700">Flash</div>
                      </div>
                      <div className="bg-rose-50/70 rounded-md p-1 border border-rose-100">
                        <div className="text-xs font-bold text-rose-800 flex items-center justify-center gap-0.5">
                          <Heart className="w-2.5 h-2.5 fill-rose-500 text-rose-500" />
                          {summary.favourites}
                        </div>
                        <div className="text-[9px] text-rose-700">
                          {isGr ? 'Αγαπ.' : 'Favs'}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Public Guest View: Purely informative crag summary */
                  <div className="grid grid-cols-3 gap-1.5 text-center">
                    <div className="bg-gray-50 rounded-lg p-1.5 border border-gray-100">
                      <div className="text-xs font-bold text-gray-900">{routes.length}</div>
                      <div className="text-[9px] text-gray-500">
                        {isGr ? 'Διαδρομές' : 'Routes'}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-1.5 border border-gray-100">
                      <div className="text-xs font-bold text-gray-900">{derivedLengths}</div>
                      <div className="text-[9px] text-gray-500">
                        {isGr ? 'Ανάπτυγμα' : 'Height'}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-1.5 border border-gray-100">
                      <div className="text-xs font-bold text-gray-900">{derivedQuickdraws}</div>
                      <div className="text-[9px] text-gray-500">
                        {isGr ? 'Σετάκια' : 'Quickdraws'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Gear & Helmet Safety Alert (Yellow warning box only) */}
                <div className="text-[11px] text-gray-700 bg-amber-50/80 border border-amber-200/80 rounded-lg p-2">
                  <div className="flex items-start gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span>
                      {isGr
                        ? cragInfo?.key === 'kokkini' || cragInfo?.id === 'kokkini'
                          ? 'Κράνος απαραίτητο! Οι 7 κίτρινες γραμμές (Top Rope*) δεν έχουν μόνιμο ρελέ (ρελέ σε δεντράκια ή καρύδια/friends).'
                          : 'Χρήση κράνους απαραίτητη πάντα και παντού για αναρριχητές και ασφαλιστές!'
                        : cragInfo?.key === 'kokkini' || cragInfo?.id === 'kokkini'
                        ? 'Helmet mandatory! The 7 yellow lines (Top Rope*) have no permanent lower-off (rig on trees or nuts/friends).'
                        : 'Wearing a helmet is mandatory at all times for both climbers and belayers!'}
                    </span>
                  </div>
                </div>

                {/* Normal Information Toggle Button (outside yellow warning box) */}
                <button
                  type="button"
                  onClick={() => setShowCragGuideNotes((v) => !v)}
                  className="w-full py-1.5 px-2.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-[11px] font-semibold text-[#1e3a8a] transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5" />
                    {isGr ? 'Πρόσβαση, Βράχος & Ιστορικό' : 'Approach, Rock & History'}
                  </span>
                  {showCragGuideNotes ? (
                    <ChevronUp className="w-3.5 h-3.5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                  )}
                </button>
              </CardContent>
            </Card>
          </div>

          {/* Expandable Crag Guide Details: Approach, Rock & History */}
          {showCragGuideNotes && (
            <Card className="border border-blue-200/80 bg-blue-50/30 shadow-2xs">
              <CardContent className="p-3.5 sm:p-4 space-y-3 text-xs text-gray-700">
                {/* Crag Intro Description (Matching Layout B under H1) */}
                {(cragInfo?.introGr || cragInfo?.introEn) && (
                  <p className="text-xs sm:text-[13px] text-gray-700 leading-relaxed pb-2.5 border-b border-blue-200/60 font-medium">
                    {isGr ? cragInfo.introGr : cragInfo.introEn}
                  </p>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Left Column: Approach + Parking/Crag GPS Buttons + GMaps Links */}
                  <div className="space-y-2">
                    <div className="font-bold text-gray-900 flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-[#1e3a8a]" />
                      <span>
                        {isGr
                          ? `Πρόσβαση (${(cragInfo || CRAG_INFO_2018).approachMinutes || 10} λεπτά)`
                          : `Approach (${(cragInfo || CRAG_INFO_2018).approachMinutes || 10} minutes)`}
                      </span>
                    </div>
                    <p className="leading-relaxed">
                      {isGr
                        ? (cragInfo || CRAG_INFO_2018).approachGr
                        : (cragInfo || CRAG_INFO_2018).approachEn}
                    </p>

                    {/* Action Links: Parking GPS + Google Maps, Crag GPS + Google Maps, Trail */}
                    <div className="flex flex-col gap-1.5 pt-1">
                      {/* Parking Row */}
                      <div className="flex flex-wrap items-center justify-between gap-1.5 p-2 rounded-lg bg-white border border-blue-200/80 shadow-2xs">
                        <div className="flex items-center gap-1.5">
                          <Car className="w-3.5 h-3.5 text-[#1e3a8a] shrink-0" />
                          <span className="font-semibold text-gray-800 text-[11px]">
                            {isGr ? 'Στάθμευση:' : 'Parking:'}
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyParking}
                            title={isGr ? 'Αντιγραφή συντεταγμένων GPS' : 'Copy GPS coordinates'}
                            data-testid="copy-parking-coords-btn-layout-a"
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-50 hover:bg-gray-100 border border-gray-300 text-gray-700 font-mono text-[11px] transition-colors"
                          >
                            {copiedParkingCoords ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-700 font-sans font-bold text-[10px]">
                                  {isGr ? 'Αντιγράφηκε' : 'Copied'}
                                </span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-gray-500" />
                                <span>
                                  {parkingMeta.lat.toFixed(3)}, {parkingMeta.lng.toFixed(3)}
                                </span>
                              </>
                            )}
                          </button>
                        </div>

                        <a
                          href={parkingGoogleUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          data-testid="parking-gmaps-link-layout-a"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1e3a8a] hover:text-[#1e3a8a]/80 transition-colors"
                        >
                          <span>Google Maps</span>
                          <ExternalLink className="w-3 h-3 opacity-70" />
                        </a>
                      </div>

                      {/* Actual Crag Coordinates Row */}
                      <div className="flex flex-wrap items-center justify-between gap-1.5 p-2 rounded-lg bg-white border border-blue-200/80 shadow-2xs">
                        <div className="flex items-center gap-1.5">
                          <Mountain className="w-3.5 h-3.5 text-[#1e3a8a] shrink-0" />
                          <span className="font-semibold text-gray-800 text-[11px]">
                            {isGr ? 'Βράχος:' : 'Crag:'}
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyCrag}
                            title={isGr ? 'Αντιγραφή συντεταγμένων GPS' : 'Copy GPS coordinates'}
                            data-testid="copy-crag-coords-btn-layout-a"
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-50 hover:bg-gray-100 border border-gray-300 text-gray-700 font-mono text-[11px] transition-colors"
                          >
                            {copiedCragCoords ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-700 font-sans font-bold text-[10px]">
                                  {isGr ? 'Αντιγράφηκε' : 'Copied'}
                                </span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-gray-500" />
                                <span>
                                  {sectorMeta.lat.toFixed(3)}, {sectorMeta.lng.toFixed(3)}
                                </span>
                              </>
                            )}
                          </button>
                        </div>

                        <a
                          href={cragGoogleUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          data-testid="crag-gmaps-link-layout-a"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1e3a8a] hover:text-[#1e3a8a]/80 transition-colors"
                        >
                          <span>Google Maps</span>
                          <ExternalLink className="w-3 h-3 opacity-70" />
                        </a>
                      </div>

                      {/* Monopati Line (No mention of Wikiloc) */}
                      {cragInfo?.wikilocUrl && (
                        <a
                          href={cragInfo.wikilocUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          data-testid="crag-trail-link-layout-a"
                          className="inline-flex items-center justify-between gap-2 p-2 rounded-lg bg-white hover:bg-[#1e3a8a]/5 border border-blue-200/80 text-gray-800 hover:text-[#1e3a8a] font-semibold text-[11px] transition-colors shadow-2xs"
                        >
                          <span className="inline-flex items-center gap-1.5">
                            <Footprints className="w-3.5 h-3.5 text-amber-700" />
                            {isGr ? 'Μονοπάτι' : 'Trail'}
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Rock Character, Rebolting, Guidebooks */}
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="font-bold text-gray-900 flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-amber-600" />
                        <span>
                          {isGr
                            ? 'Χαρακτήρας Βράχου & Ασφάλεια'
                            : 'Rock Character & Safety'}
                        </span>
                      </div>
                      <p className="leading-relaxed">
                        {isGr
                          ? (cragInfo || CRAG_INFO_2018).rockAndSafetyGr
                          : (cragInfo || CRAG_INFO_2018).rockAndSafetyEn}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="font-bold text-gray-900 flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5 text-[#1e3a8a]" />
                        <span>
                          {isGr
                            ? 'Ανακατασκευή & Συντήρηση'
                            : 'Rebolting & Restoration'}
                        </span>
                      </div>
                      <p className="leading-relaxed text-[11px] text-gray-600">
                        {isGr
                          ? (cragInfo || CRAG_INFO_2018).reboltingGr
                          : (cragInfo || CRAG_INFO_2018).reboltingEn}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="font-bold text-gray-900 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-[#1e3a8a]" />
                        <span>
                          {isGr ? 'Ιστορικοί Οδηγοί' : 'Historical Guidebooks'}
                        </span>
                      </div>
                      <p className="leading-relaxed text-[11px] text-gray-600">
                        {isGr
                          ? (cragInfo || CRAG_INFO_2018).guidebooksGr
                          : (cragInfo || CRAG_INFO_2018).guidebooksEn}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

