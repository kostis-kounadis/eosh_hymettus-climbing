import React, { useState } from 'react';
import {
  Search,
  SlidersHorizontal,
  Heart,
  Star,
  RotateCcw,
  LayoutList,
  Table as TableIcon,
  X,
} from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import {
  ALL_SETTERS,
  ALL_YEARS,
  FRENCH_GRADE_ORDER,
} from '../data/kokkiniPistaRoutes';
import { TICK_TYPES } from '../hooks/useClimberLogbook';

export default function RouteFilterBar({
  isGr,
  userMode, // 'guest' | 'member' | 'admin'
  filters,
  onChangeFilters,
  onResetAllFilters,
  onSelectGradeTier,
  activeFilterCount,
  totalCount,
  filteredCount,
  gradeSystem,
  onToggleGradeSystem,
  viewMode,
  onChangeViewMode,
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const isMemberOrAdmin = userMode === 'member' || userMode === 'admin';

  const update = (patch) => {
    onChangeFilters({ ...filters, ...patch });
  };

  return (
    <Card className="border border-gray-200 bg-white mb-3">
      <CardContent className="p-2.5 sm:p-3.5 space-y-2.5">
        {/* Compact Top Row: Search + Quick Filters + Filter Drawer Toggle + View Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[155px]">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => update({ search: e.target.value })}
              placeholder={
                isGr
                  ? 'Αναζήτηση #, ονόματος, ανοίξαντα...'
                  : 'Search #, route name, setter...'
              }
              className="w-full h-8 pl-8 pr-7 text-xs rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] transition-colors"
            />
            {filters.search && (
              <button
                type="button"
                onClick={() => update({ search: '' })}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Rockfax Band Pills (visible on mobile right in the compact bar) */}
          <button
            type="button"
            onClick={() => onSelectGradeTier('orange')}
            className="h-8 px-2.5 rounded-lg text-[11px] font-bold bg-[#bc813a] text-white hover:opacity-90 transition-opacity"
            title={isGr ? 'Μέτριες (5a – 6a+)' : 'Moderate (5a – 6a+)'}
          >
            {gradeSystem === 'uiaa' ? 'V-–VI+' : '5a–6a+'}
          </button>

          <button
            type="button"
            onClick={() => onSelectGradeTier('red')}
            className="h-8 px-2.5 rounded-lg text-[11px] font-bold bg-[#b83a45] text-white hover:opacity-90 transition-opacity"
            title={isGr ? 'Δύσκολες (6b – 7a)' : 'Hard (6b – 7a)'}
          >
            {gradeSystem === 'uiaa' ? 'VII-–VIII' : '6b–7a'}
          </button>

          {/* Favourite Chip (ONLY for Logged-In Member / Admin) */}
          {isMemberOrAdmin && (
            <button
              type="button"
              onClick={() => update({ onlyFavourites: !filters.onlyFavourites })}
              className={`h-8 px-2.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1 transition-colors ${
                filters.onlyFavourites
                  ? 'bg-rose-50 border-rose-300 text-rose-700'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
              title={isGr ? 'Αγαπημένες' : 'Favourites'}
            >
              <Heart
                className={`w-3.5 h-3.5 ${
                  filters.onlyFavourites
                    ? 'fill-rose-500 text-rose-500'
                    : 'text-gray-400'
                }`}
              />
              <span className="hidden sm:inline">
                {isGr ? 'Αγαπημένες' : 'Favs'}
              </span>
            </button>
          )}

          {/* Expand/Collapse All Filters button */}
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className={`h-8 px-2.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
              showAdvanced || activeFilterCount > 0
                ? 'bg-[#1e3a8a] text-white border-[#1e3a8a]'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{isGr ? 'Φίλτρα' : 'Filters'}</span>
            {activeFilterCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-white text-[#1e3a8a] text-[10px] font-extrabold">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Primary Grade System Switcher (UIAA vs French) */}
          <button
            type="button"
            onClick={onToggleGradeSystem}
            className="h-8 px-2 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-[11px] font-bold text-gray-700"
            title={
              isGr
                ? 'Εναλλαγή κύριας βαθμολογίας (French / UIAA)'
                : 'Toggle primary grade system (French / UIAA)'
            }
          >
            {gradeSystem === 'french' ? 'FR/UIAA' : 'UIAA/FR'}
          </button>

          {/* View Mode Switcher (Compact List vs Full Table) */}
          <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
            <button
              type="button"
              onClick={() => onChangeViewMode('cards')}
              className={`px-2 py-1 rounded-md text-xs font-medium inline-flex items-center gap-1 transition-colors ${
                viewMode === 'cards'
                  ? 'bg-white text-[#1e3a8a] shadow-2xs font-semibold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title={isGr ? 'Συμπαγής Λίστα (Κινητό)' : 'Compact List (Mobile)'}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{isGr ? 'Λίστα' : 'List'}</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeViewMode('table')}
              className={`px-2 py-1 rounded-md text-xs font-medium inline-flex items-center gap-1 transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-[#1e3a8a] shadow-2xs font-semibold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title={isGr ? 'Πλήρης Πίνακας' : 'Full Table'}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{isGr ? 'Πίνακας' : 'Table'}</span>
            </button>
          </div>
        </div>

        {/* Expandable Multi-Facet Filter Grid */}
        {showAdvanced && (
          <div className="pt-2.5 border-t border-gray-100 space-y-2.5 text-xs">
            {/* Grade Checkboxes Row */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-gray-700">
                  {isGr ? 'Βαθμολογία:' : 'Grades:'}
                </span>
                {filters.selectedGrades.length > 0 && (
                  <button
                    type="button"
                    onClick={() => update({ selectedGrades: [] })}
                    className="text-[11px] text-[#1e3a8a] hover:underline"
                  >
                    {isGr ? 'Επιλογή όλων' : 'Select all'}
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {FRENCH_GRADE_ORDER.map((g) => {
                  const active = filters.selectedGrades.includes(g);
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => {
                        const next = active
                          ? filters.selectedGrades.filter((x) => x !== g)
                          : [...filters.selectedGrades, g];
                        update({ selectedGrades: next });
                      }}
                      className={`px-2 py-0.5 rounded border text-xs font-bold transition-colors ${
                        active
                          ? 'bg-[#1e3a8a] text-white border-[#1e3a8a]'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {/* Route Setter Filter */}
              <div>
                <label className="block font-semibold text-gray-600 mb-0.5 text-[11px]">
                  {isGr ? 'Ανοίξαντες' : 'Route Setter'}
                </label>
                <select
                  value={filters.setter}
                  onChange={(e) => update({ setter: e.target.value })}
                  className="w-full h-7 px-2 rounded border border-gray-200 bg-white text-gray-800 text-xs"
                >
                  <option value="all">{isGr ? 'Όλοι' : 'All setters'}</option>
                  {ALL_SETTERS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year Opened Filter */}
              <div>
                <label className="block font-semibold text-gray-600 mb-0.5 text-[11px]">
                  {isGr ? 'Έτος' : 'Year'}
                </label>
                <select
                  value={filters.year}
                  onChange={(e) => update({ year: e.target.value })}
                  className="w-full h-7 px-2 rounded border border-gray-200 bg-white text-gray-800 text-xs"
                >
                  <option value="all">{isGr ? 'Όλα (1960–2017)' : 'All years'}</option>
                  {ALL_YEARS.map((y) => (
                    <option key={y} value={String(y)}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              {/* Length Filter */}
              <div>
                <label className="block font-semibold text-gray-600 mb-0.5 text-[11px]">
                  {isGr ? 'Ανάπτυγμα (m)' : 'Length (m)'}
                </label>
                <select
                  value={filters.lengthRange}
                  onChange={(e) => update({ lengthRange: e.target.value })}
                  className="w-full h-7 px-2 rounded border border-gray-200 bg-white text-gray-800 text-xs"
                >
                  <option value="all">{isGr ? 'Όλα (5–15m)' : 'All (5–15m)'}</option>
                  <option value="short">5m – 8m</option>
                  <option value="medium">9m – 11m</option>
                  <option value="long">12m – 15m</option>
                </select>
              </div>

              {/* Protection / Quality Filter */}
              <div>
                <label className="block font-semibold text-gray-600 mb-0.5 text-[11px]">
                  {isGr ? 'Ασφάλειες / ★' : 'Protection / ★'}
                </label>
                <div className="flex gap-1">
                  <select
                    value={filters.protectionType}
                    onChange={(e) => update({ protectionType: e.target.value })}
                    className="w-full h-7 px-1.5 rounded border border-gray-200 bg-white text-gray-800 text-xs"
                  >
                    <option value="all">{isGr ? 'Όλες' : 'All'}</option>
                    <option value="sport">{isGr ? 'Σπορ (33)' : 'Sport (33)'}</option>
                    <option value="toprope">Top-rope* (7)</option>
                  </select>
                  <select
                    value={filters.minStars}
                    onChange={(e) => update({ minStars: Number(e.target.value) })}
                    className="w-20 h-7 px-1 rounded border border-gray-200 bg-white text-gray-800 text-xs"
                  >
                    <option value={0}>★ All</option>
                    <option value={2}>★★+</option>
                    <option value={3}>★★★</option>
                  </select>
                </div>
              </div>

              {/* Completed Filter (ONLY for Member / Admin) or Wall Section */}
              {isMemberOrAdmin ? (
                <div>
                  <label className="block font-semibold text-gray-600 mb-0.5 text-[11px]">
                    {isGr ? 'Κατάσταση (Logbook)' : 'Completed Status'}
                  </label>
                  <select
                    value={filters.tickFilter}
                    onChange={(e) => update({ tickFilter: e.target.value })}
                    className="w-full h-7 px-2 rounded border border-gray-200 bg-white text-gray-800 text-xs"
                  >
                    <option value="all">{isGr ? 'Όλες' : 'All'}</option>
                    <option value="completed">
                      {isGr ? '✓ Ολοκληρωμένες' : '✓ Completed'}
                    </option>
                    <option value="todo">
                      {isGr ? '○ Μη ολοκληρωμένες' : '○ Unticked'}
                    </option>
                    {TICK_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.short} ({isGr ? t.labelGr : t.labelEn})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block font-semibold text-gray-600 mb-0.5 text-[11px]">
                    {isGr ? 'Τοίχος' : 'Wall'}
                  </label>
                  <select
                    value={filters.wallFilter}
                    onChange={(e) => update({ wallFilter: e.target.value })}
                    className="w-full h-7 px-2 rounded border border-gray-200 bg-white text-gray-800 text-xs"
                  >
                    <option value="all">{isGr ? 'Και οι 2 (40)' : 'Both (40)'}</option>
                    <option value="1">{isGr ? 'Τοίχος 1 (18)' : 'Wall 1 (18)'}</option>
                    <option value="2">{isGr ? 'Τοίχος 2 (22)' : 'Wall 2 (22)'}</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Active Filter Summary Strip */}
        {(activeFilterCount > 0 || filteredCount < totalCount) && (
          <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-semibold text-gray-700">
                {isGr
                  ? `${filteredCount} από ${totalCount} διαδρομές`
                  : `${filteredCount} of ${totalCount} routes`}
              </span>
              {filters.selectedGrades.length > 0 && (
                <Badge variant="secondary" className="text-[11px]">
                  {filters.selectedGrades.join(', ')}
                </Badge>
              )}
              {filters.setter !== 'all' && (
                <Badge variant="secondary" className="text-[11px]">
                  {filters.setter}
                </Badge>
              )}
              {filters.year !== 'all' && (
                <Badge variant="secondary" className="text-[11px]">
                  {filters.year}
                </Badge>
              )}
            </div>
            <button
              type="button"
              onClick={onResetAllFilters}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#1e3a8a] hover:underline"
            >
              <RotateCcw className="w-3 h-3" />
              {isGr ? 'Καθαρισμός' : 'Clear'}
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
