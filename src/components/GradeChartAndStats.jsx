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
}) {
  // Compact on mobile: collapsed by default on small viewports (<768px), open on desktop
  const [mobileExpanded, setMobileExpanded] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );
  const [histogramOpen, setHistogramOpen] = useState(true);
  const [showCragGuideNotes, setShowCragGuideNotes] = useState(false);

  const isMemberOrAdmin = userMode === 'member' || userMode === 'admin';
  const sunStatus = useMemo(() => getHymettusSunStatus(isGr), [isGr]);

  const gradeStats = useMemo(() => {
    const map = {};
    FRENCH_GRADE_ORDER.forEach((g) => {
      map[g] = {
        french: g,
        uiaa: UIAA_BY_FRENCH[g],
        total: 0,
        completed: 0,
        tier: getGradeTier(g),
      };
    });
    routes.forEach((r) => {
      if (!map[r.french]) return;
      map[r.french].total += 1;
      if (isMemberOrAdmin) {
        const entry = getEntry(r.id);
        if (isCompletedTick(entry.status)) {
          map[r.french].completed += 1;
        }
      }
    });
    return FRENCH_GRADE_ORDER.map((g) => map[g]);
  }, [routes, getEntry, isMemberOrAdmin]);

  const maxCount = useMemo(
    () => Math.max(1, ...gradeStats.map((s) => s.total)),
    [gradeStats]
  );

  const bandCounts = useMemo(() => {
    const counts = { easy: 0, medium: 0, hard: 0, extreme: 0 };
    routes.forEach((r) => {
      const t = getGradeTier(r.french);
      counts[t] = (counts[t] || 0) + 1;
    });
    return counts;
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

  if (histogramOnly) {
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
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-gray-900">
                {isGr ? 'Κατανομή Βαθμολογιών' : 'Grade Distribution'}
              </h3>
              {!histogramOpen && (
                <p className="text-[11px] text-gray-500">
                  {routes.length} {isGr ? 'διαδρομές (5a – 7a)' : 'routes (5a – 7a)'}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mini stacked pill preview */}
            <div className="flex items-center gap-0.5 w-16 h-2 rounded-full overflow-hidden bg-gray-100">
              <div className="h-full bg-green-500" style={{ flex: bandCounts.easy }} />
              <div className="h-full bg-amber-500" style={{ flex: bandCounts.medium }} />
              <div className="h-full bg-rose-500" style={{ flex: bandCounts.hard }} />
              {bandCounts.extreme > 0 && (
                <div className="h-full bg-zinc-900" style={{ flex: bandCounts.extreme }} />
              )}
            </div>
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

            {/* Bars Grid (~15% shorter) */}
            <div className="grid grid-cols-10 gap-1 items-end h-[92px] pt-2.5 pb-1 px-0.5 border-b border-gray-100">
              {gradeStats.map((g) => {
                const isSelected = selectedGrades.includes(g.french);
                const isDimmed = selectedGrades.length > 0 && !isSelected;
                const heightPct = Math.max(
                  12,
                  Math.round((g.total / maxCount) * 100)
                );
                const sentPct =
                  isMemberOrAdmin && g.total > 0
                    ? Math.round((g.completed / g.total) * 100)
                    : 0;
                const colors = barColors[g.tier] || barColors.medium;

                return (
                  <button
                    key={g.french}
                    type="button"
                    onClick={() => onToggleGrade(g.french)}
                    className={`group flex flex-col items-center justify-end h-full focus:outline-none transition-opacity ${
                      isDimmed ? 'opacity-30 hover:opacity-75' : 'opacity-100'
                    }`}
                    title={`${g.french} (${g.uiaa}): ${g.total} ${
                      isGr ? 'διαδρομές' : 'routes'
                    }`}
                  >
                    <span
                      className={`text-[10px] font-bold mb-0.5 ${
                        isSelected ? 'text-[#1e3a8a] scale-110' : 'text-gray-700'
                      }`}
                    >
                      {isMemberOrAdmin && g.completed > 0
                        ? `${g.completed}/${g.total}`
                        : g.total}
                    </span>

                    <div
                      className={`w-full max-w-[24px] rounded-t-md relative overflow-hidden transition-all duration-200 ${
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
                  </button>
                );
              })}
            </div>

            {/* X-axis Labels (French + UIAA) */}
            <div className="grid grid-cols-10 gap-1 pt-1.5 text-center">
              {gradeStats.map((g) => {
                const isSelected = selectedGrades.includes(g.french);
                return (
                  <button
                    key={g.french}
                    type="button"
                    onClick={() => onToggleGrade(g.french)}
                    className={`flex flex-col items-center rounded py-0.5 transition-colors ${
                      isSelected
                        ? 'bg-[#1e3a8a]/10 text-[#1e3a8a]'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-gray-900 leading-tight">
                      {gradeSystem === 'uiaa' ? g.uiaa.split(' ')[0] : g.french}
                    </span>
                    <span className="text-[9px] text-gray-500 leading-tight">
                      {gradeSystem === 'uiaa' ? g.french : g.uiaa.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
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
            <Card className="xl:col-span-7 border border-gray-200 bg-white">
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

                {/* Bars Grid */}
                <div className="grid grid-cols-10 gap-1 sm:gap-2 items-end h-28 sm:h-32 pt-4 pb-1 px-0.5 border-b border-gray-100">
                  {gradeStats.map((g) => {
                    const isSelected = selectedGrades.includes(g.french);
                    const isDimmed = selectedGrades.length > 0 && !isSelected;
                    const heightPct = Math.max(
                      12,
                      Math.round((g.total / maxCount) * 100)
                    );
                    const sentPct =
                      isMemberOrAdmin && g.total > 0
                        ? Math.round((g.completed / g.total) * 100)
                        : 0;
                    const colors = barColors[g.tier] || barColors.orange;

                    return (
                      <button
                        key={g.french}
                        type="button"
                        onClick={() => onToggleGrade(g.french)}
                        className={`group flex flex-col items-center justify-end h-full focus:outline-none transition-opacity ${
                          isDimmed ? 'opacity-30 hover:opacity-75' : 'opacity-100'
                        }`}
                        title={`${g.french} (${g.uiaa}): ${g.total} ${
                          isGr ? 'διαδρομές' : 'routes'
                        }`}
                      >
                        <span
                          className={`text-[10px] sm:text-[11px] font-bold mb-0.5 ${
                            isSelected ? 'text-[#1e3a8a] scale-110' : 'text-gray-700'
                          }`}
                        >
                          {isMemberOrAdmin && g.completed > 0
                            ? `${g.completed}/${g.total}`
                            : g.total}
                        </span>

                        <div
                          className={`w-full max-w-[28px] rounded-t-md relative overflow-hidden transition-all duration-200 ${
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
                      </button>
                    );
                  })}
                </div>

                {/* X-axis Labels (French + UIAA) */}
                <div className="grid grid-cols-10 gap-1 sm:gap-2 pt-1.5 text-center">
                  {gradeStats.map((g) => {
                    const isSelected = selectedGrades.includes(g.french);
                    return (
                      <button
                        key={g.french}
                        type="button"
                        onClick={() => onToggleGrade(g.french)}
                        className={`flex flex-col items-center rounded py-0.5 transition-colors ${
                          isSelected
                            ? 'bg-[#1e3a8a]/10 text-[#1e3a8a]'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-[11px] font-bold text-gray-900 leading-tight">
                          {gradeSystem === 'uiaa' ? g.uiaa.split(' ')[0] : g.french}
                        </span>
                        <span className="text-[9px] text-gray-500 leading-tight">
                          {gradeSystem === 'uiaa' ? g.french : g.uiaa.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Right Column: Live Sun/Shade + (Member/Admin Logbook OR Guest Quick Stats) */}
            <Card className="xl:col-span-5 border border-gray-200 bg-white flex flex-col justify-between">
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
                      <div className="text-xs font-bold text-gray-900">5m – 15m</div>
                      <div className="text-[9px] text-gray-500">
                        {isGr ? 'Ανάπτυγμα' : 'Height'}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-1.5 border border-gray-100">
                      <div className="text-xs font-bold text-gray-900">≤ 9+2</div>
                      <div className="text-[9px] text-gray-500">
                        {isGr ? 'Σετάκια' : 'Quickdraws'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Gear & Helmet Safety Quick Note + Toggle for Full EOSH 2018 Guide Notes */}
                <div className="text-[11px] text-gray-700 bg-amber-50/80 border border-amber-200/80 rounded-lg p-2 space-y-1.5">
                  <div className="flex items-start gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span>
                      {isGr
                        ? 'Κράνος απαραίτητο! Οι 7 κίτρινες γραμμές (Top rope*) δεν έχουν μόνιμο ρελέ (ρελέ σε δεντράκια ή καρύδια/friends).'
                        : 'Helmet mandatory! The 7 yellow lines (Top rope*) have no permanent lower-off (rig on trees or nuts/friends).'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCragGuideNotes((v) => !v)}
                    className="w-full pt-1 border-t border-amber-200/70 flex items-center justify-between text-[11px] font-semibold text-[#1e3a8a] hover:underline"
                  >
                    <span>
                      {isGr
                        ? 'Πρόσβαση, Βράχος & Ιστορικό (Οδηγός ΕΟΣΗ 2018)'
                        : 'Approach, Rock & History (EOSH 2018 Guide)'}
                    </span>
                    {showCragGuideNotes ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Expandable Authentic EOSH 2018 Crag Guide Details (from cms_b4e1305033.pdf) */}
          {showCragGuideNotes && (
            <Card className="border border-blue-200/80 bg-blue-50/30">
              <CardContent className="p-3 sm:p-4 grid sm:grid-cols-2 gap-3 text-xs text-gray-700">
                <div className="space-y-1.5">
                  <div className="font-bold text-gray-900 flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-[#1e3a8a]" />
                    <span>
                      {isGr ? 'Πρόσβαση (10 λεπτά)' : 'Approach (10 minutes)'}
                    </span>
                  </div>
                  <p className="leading-relaxed">
                    {isGr ? CRAG_INFO_2018.approachGr : CRAG_INFO_2018.approachEn}
                  </p>
                </div>

                <div className="space-y-1.5">
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
                      ? CRAG_INFO_2018.rockAndSafetyGr
                      : CRAG_INFO_2018.rockAndSafetyEn}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="font-bold text-gray-900 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-[#1e3a8a]" />
                    <span>
                      {isGr
                        ? 'Ανακατασκευή & Συντήρηση 2017'
                        : '2017 Rebolting & Restoration'}
                    </span>
                  </div>
                  <p className="leading-relaxed text-[11px] text-gray-600">
                    {isGr ? CRAG_INFO_2018.reboltingGr : CRAG_INFO_2018.reboltingEn}
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
                      ? CRAG_INFO_2018.guidebooksGr
                      : CRAG_INFO_2018.guidebooksEn}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

