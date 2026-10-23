import React, { useState } from 'react';
import {
  X,
  Mountain,
  Cable,
  Shield,
  Calendar,
  User,
  Info,
  Heart,
  Share2,
  Check,
  Compass,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import {
  getGradeBadgeClass,
  getGradeTier,
} from '../data/kokkiniPistaRoutes';
import { TICK_TYPES } from '../hooks/useClimberLogbook';

// Two connected eighth notes (♫) for classic / historic routes
function BeamedNotesIcon({ className = 'w-3 h-3 text-amber-600' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 13a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm8-2a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
      <path
        fillRule="evenodd"
        d="M6 5v8H5V3a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v8h-1V5H6z"
      />
    </svg>
  );
}

export default function SelectedRouteDetailPanel({
  route,
  isGr = true,
  userMode = 'guest',
  getEntry,
  onClose,
  onToggleFavourite,
  onToggleTickStatus,
  onUpdateEntry,
  onFilterBySetter,
  onFilterByYear,
  cragInfo = null,
  routes = null,
}) {
  const [copied, setCopied] = useState(false);
  const isMemberOrAdmin = userMode === 'member' || userMode === 'admin';
  const entry = route && getEntry ? getEntry(route.id) : {};

  const handleShare = (e) => {
    e?.stopPropagation();
    if (!route) return;
    const url = new URL(window.location.href);
    url.searchParams.set('route', route.id);
    navigator.clipboard?.writeText(url.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ---------------------------------------------------------------------------
  // Empty State: No Route Selected
  // ---------------------------------------------------------------------------
  if (!route) {
    return (
      <Card className="border border-gray-200 bg-white shadow-2xs rounded-xl overflow-hidden">
        <CardContent className="p-3.5 sm:p-4 text-xs text-gray-600 space-y-3">
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 text-[#1e3a8a] shrink-0">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm">
                {isGr ? 'Λεπτομέρειες Διαδρομής' : 'Route Details'}
              </h4>
              <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">
                {isGr
                  ? 'Επιλέξτε μια διαδρομή από το τόπο ή τον πίνακα για να δείτε τα πλήρη τεχνικά στοιχεία, προτεινόμενο σχοινί, ανοίξαντες και σημειώσεις.'
                  : 'Select a route on the topo or table to view detailed specs, recommended rope, setters, and beta notes.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ---------------------------------------------------------------------------
  // Selected Route Details View
  // ---------------------------------------------------------------------------
  const note = isGr ? route.noteGr : route.noteEn;
  const isClassic = route.isClassic;

  return (
    <Card className="border border-blue-200 bg-white shadow-xs rounded-xl overflow-hidden transition-all">
      <CardContent className="p-3.5 sm:p-4 space-y-3">
        {/* Top Header: Route Number, Name, Wall, Classic, and Close Button */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Route Number Badge */}
            <span
              className={`inline-flex items-center justify-center min-w-[32px] h-7 px-2 rounded-md text-xs font-bold shrink-0 ${
                route.isTopRopeOnly
                  ? 'bg-amber-100 text-amber-950 border border-amber-300'
                  : 'bg-[#1e3a8a] text-white shadow-2xs'
              }`}
            >
              #{route.pdfNumber || '—'}
            </span>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                  {isGr ? route.nameGr : route.nameEn}
                </h3>
                {/* Secondary English/Greek label if different */}
                {((isGr && route.nameEn && route.nameEn !== route.nameGr) ||
                  (!isGr && route.nameGr && route.nameGr !== route.nameEn)) && (
                  <span className="text-xs text-gray-400 font-medium">
                    ({isGr ? route.nameEn : route.nameGr})
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                {route.wall && (
                  <Badge
                    variant="outline"
                    className="text-[10px] font-semibold text-gray-600 border-gray-200 py-0"
                  >
                    {isGr ? `Τμήμα ${route.wall}` : `Wall ${route.wall}`}
                  </Badge>
                )}

                {route.pitch && (
                  <Badge
                    variant="outline"
                    className="text-[10px] font-semibold text-sky-800 bg-sky-50 border-sky-200 py-0"
                  >
                    {route.pitch}
                  </Badge>
                )}

                {isClassic && (
                  <span
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-900 bg-amber-50 border border-amber-200/80 px-2 py-0.2 rounded"
                    title={
                      isGr
                        ? 'Κλασική / Ιστορική διαδρομή'
                        : 'Classic / Historic climb'
                    }
                  >
                    <BeamedNotesIcon className="w-3 h-3 text-amber-700" />
                    <span>{isGr ? 'Κλασική (♫)' : 'Classic (♫)'}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Close / Unselect Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors shrink-0"
            title={isGr ? 'Αποεπιλογή διαδρομής' : 'Deselect route'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 4-Tile Technical Specs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
          {/* Tile 1: Grade (French + UIAA) */}
          <div className="p-2 rounded-lg bg-gray-50 border border-gray-200/80 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
              {isGr ? 'Βαθμολογία' : 'Grade'}
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className={`px-1.5 py-0.5 rounded text-xs font-bold ${getGradeBadgeClass(
                  route.french
                )}`}
              >
                {route.french}
              </span>
              <span className="text-xs font-semibold text-gray-700">
                ({route.uiaa})
              </span>
            </div>
          </div>

          {/* Tile 2: Length & Recommended Rope */}
          <div className="p-2 rounded-lg bg-gray-50 border border-gray-200/80 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider flex items-center justify-between">
              <span>{isGr ? 'Ανάπτυγμα' : 'Length'}</span>
              <Cable className="w-3 h-3 text-[#1e3a8a]" />
            </span>
            <div className="mt-1">
              <span className="text-xs font-bold text-gray-900">
                {route.length}m
              </span>
              <span className="text-[10px] text-gray-500 block">
                {route.length >= 35
                  ? isGr
                    ? 'Σχοινί ≥ 70m (Πολυσχοινιά)'
                    : 'Rope ≥ 70m (Multi-pitch)'
                  : isGr
                  ? `Σχοινί ≥ ${route.length * 2}m`
                  : `Rope ≥ ${route.length * 2}m`}
              </span>
            </div>
          </div>

          {/* Tile 3: Protection (Bolts / TR) */}
          <div className="p-2 rounded-lg bg-gray-50 border border-gray-200/80 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider flex items-center justify-between">
              <span>{isGr ? 'Ασφάλιση' : 'Protection'}</span>
              <Shield className="w-3 h-3 text-emerald-700" />
            </span>
            <div className="mt-1">
              {route.protectionRaw === 'Trad' || route.protectionRaw === 'Aid' ? (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[11px] border border-amber-300">
                  {route.protectionRaw === 'Aid' ? 'Aid / Τεχνητή' : 'Trad / Παραδοσιακή'}
                </span>
              ) : route.isTopRopeOnly ? (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[11px] border border-amber-300">
                  TR* Top-Rope
                </span>
              ) : (
                <>
                  <span className="text-xs font-bold text-gray-900">
                    {route.bolts} {isGr ? 'πλακέτες' : 'bolts'}
                  </span>
                  <span className="text-[10px] text-gray-500 block">
                    Inox 316L UIAA
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Tile 4: First Ascent / Year & Setters */}
          <div className="p-2 rounded-lg bg-gray-50 border border-gray-200/80 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider flex items-center justify-between">
              <span>{isGr ? 'Άνοιγμα' : 'Opening'}</span>
              <Calendar className="w-3 h-3 text-gray-400" />
            </span>
            <div className="mt-1">
              <button
                type="button"
                onClick={() => onFilterByYear && onFilterByYear(String(route.year))}
                className="text-xs font-bold text-[#1e3a8a] hover:underline block text-left"
                title={isGr ? `Φιλτράρισμα έτους ${route.year}` : `Filter year ${route.year}`}
              >
                {route.year}
              </button>
              <span className="text-[10px] text-gray-600 truncate block">
                {route.setters.map((s, idx) => (
                  <React.Fragment key={s}>
                    {idx > 0 && ', '}
                    <button
                      type="button"
                      onClick={() => onFilterBySetter && onFilterBySetter(s)}
                      className="hover:text-[#1e3a8a] hover:underline"
                      title={isGr ? `Φιλτράρισμα: ${s}` : `Filter: ${s}`}
                    >
                      {s}
                    </button>
                  </React.Fragment>
                ))}
              </span>
            </div>
          </div>
        </div>

        {/* Spacious Beta & Information Box */}
        <div
          className={`p-3 rounded-lg border text-xs leading-relaxed space-y-1 ${
            route.isTopRopeOnly
              ? 'bg-amber-50/60 border-amber-200/80 text-amber-950'
              : 'bg-blue-50/50 border-blue-100 text-gray-800'
          }`}
        >
          <div className="flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wider text-gray-700">
            {route.isTopRopeOnly ? (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            ) : (
              <Info className="w-3.5 h-3.5 text-[#1e3a8a] shrink-0" />
            )}
            <span>{isGr ? 'Πληροφορίες & Beta' : 'Beta & Information'}</span>
          </div>
          <p className="font-normal text-xs text-gray-800">
            {note ||
              (isGr
                ? 'Δεν υπάρχουν ειδικές παρατηρήσεις για αυτή τη διαδρομή.'
                : 'No specific beta notes recorded for this route.')}
          </p>
        </div>

        {/* Member / Admin Interactive Logbook Strip */}
        {isMemberOrAdmin && (
          <div className="pt-2 border-t border-gray-100 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-gray-700">
                {isGr ? 'Προσωπική Καταγραφή (Logbook):' : 'Personal Logbook:'}
              </span>

              {/* Favourite Toggle */}
              <button
                type="button"
                onClick={() => onToggleFavourite && onToggleFavourite(route.id)}
                className={`px-2 py-1 rounded-md border text-xs font-semibold inline-flex items-center gap-1 transition-colors ${
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

            {/* Tick Status Buttons */}
            <div className="flex items-center gap-1 flex-wrap">
              {TICK_TYPES.map((t) => {
                const active = entry.status === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() =>
                      onToggleTickStatus && onToggleTickStatus(route.id, t.id)
                    }
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
            </div>

            {/* Private Beta Note */}
            <div>
              <input
                type="text"
                placeholder={
                  isGr
                    ? 'Προσωπικές σημειώσεις / beta για αυτή τη γραμμή...'
                    : 'Personal beta note for this line...'
                }
                defaultValue={entry.notes || ''}
                onBlur={(e) =>
                  onUpdateEntry &&
                  onUpdateEntry(route.id, { notes: e.target.value })
                }
                className="w-full h-8 px-2.5 text-xs rounded border border-gray-200 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#1e3a8a]"
              />
            </div>
          </div>
        )}

        {/* Bottom Utility Bar: Share Link */}
        <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">
                  {isGr ? 'Αντιγράφηκε σύνδεσμος!' : 'Link copied!'}
                </span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-gray-500" />
                <span>{isGr ? 'Κοινοποίηση διαδρομής' : 'Share route'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="text-xs text-gray-400 hover:text-gray-700 hover:underline"
          >
            {isGr ? 'Καθαρισμός επιλογής' : 'Clear selection'}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
