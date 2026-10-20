import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ChevronLeft,
  MapPin,
  Mountain,
  Sun,
  Globe,
  ExternalLink,
  Trophy,
  Users,
  UserCheck,
  Shield,
} from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import InteractiveTopo from './InteractiveTopo';
import GradeChartAndStats from './GradeChartAndStats';
import RouteFilterBar from './RouteFilterBar';
import RouteListAndTable from './RouteListAndTable';
import LogbookModal from './LogbookModal';
import {
  KOKKINI_PISTA_ROUTES,
  getGradeTier,
} from '../data/kokkiniPistaRoutes';
import {
  useClimberLogbook,
  isCompletedTick,
} from '../hooks/useClimberLogbook';

const INITIAL_FILTERS = {
  search: '',
  selectedGrades: [],
  setter: 'all',
  year: 'all',
  lengthRange: 'all',
  protectionType: 'all',
  minStars: 0,
  onlyFavourites: false,
  tickFilter: 'all',
  wallFilter: 'all',
};

export default function KokkiniPistaPage({ isGr, onToggleLang }) {
  const [searchParams, setSearchParams] = useSearchParams();
  // 3 Demonstration Views: 'guest' (Public) | 'member' (Logged-in) | 'admin' (Admin)
  const [userMode, setUserMode] = useState('member');
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [activeWall, setActiveWall] = useState(1);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [gradeSystem, setGradeSystem] = useState('french'); // 'french' | 'uiaa'
  const [viewMode, setViewMode] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth >= 960 ? 'table' : 'cards'
  );
  const [isExpandedSize, setIsExpandedSize] = useState(false);
  const [logbookModalOpen, setLogbookModalOpen] = useState(false);

  const isMemberOrAdmin = userMode === 'member' || userMode === 'admin';

  const {
    logbook,
    customPaths,
    getEntry,
    updateEntry,
    toggleTickStatus,
    toggleFavourite,
    setStars,
    updateRoutePath,
    resetRoutePath,
    importLogbookJson,
    clearLogbook,
  } = useClimberLogbook();

  // Deep-link support (?route=kp-5a-roof)
  useEffect(() => {
    const routeParam = searchParams.get('route');
    if (routeParam) {
      const found = KOKKINI_PISTA_ROUTES.find((r) => r.id === routeParam);
      if (found) {
        setSelectedRoute(found);
        setActiveWall(found.wall);
      }
    }
  }, []);

  // Clear member-only filters when switching to Guest mode
  useEffect(() => {
    if (userMode === 'guest') {
      setFilters((prev) => ({
        ...prev,
        onlyFavourites: false,
        tickFilter: 'all',
      }));
    }
  }, [userMode]);

  const handleSelectRoute = (route) => {
    setSelectedRoute(route);
    if (route) {
      if (route.wall !== activeWall) {
        setActiveWall(route.wall);
      }
      setSearchParams({ route: route.id }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  // Compute filtered routes
  const filteredRoutes = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return KOKKINI_PISTA_ROUTES.filter((r) => {
      const entry = getEntry(r.id);

      // Search query
      if (q) {
        const haystack = [
          r.pdfNumber,
          r.displayCode,
          r.nameGr,
          r.nameEn,
          r.uiaa,
          r.french,
          r.settersRawGr,
          r.settersRawEn,
          r.noteGr,
          r.noteEn,
          isMemberOrAdmin ? entry.notes : '',
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      // Wall filter
      if (filters.wallFilter !== 'all' && String(r.wall) !== filters.wallFilter) {
        return false;
      }

      // Selected grades
      if (
        filters.selectedGrades.length > 0 &&
        !filters.selectedGrades.includes(r.french)
      ) {
        return false;
      }

      // Setter filter
      if (filters.setter !== 'all' && !r.setters.includes(filters.setter)) {
        return false;
      }

      // Year filter
      if (filters.year !== 'all' && String(r.year) !== filters.year) {
        return false;
      }

      // Length filter
      if (filters.lengthRange === 'short' && r.length > 8) return false;
      if (
        filters.lengthRange === 'medium' &&
        (r.length < 9 || r.length > 11)
      ) {
        return false;
      }
      if (filters.lengthRange === 'long' && r.length < 12) return false;

      // Protection type
      if (filters.protectionType === 'sport' && r.isTopRopeOnly) return false;
      if (filters.protectionType === 'toprope' && !r.isTopRopeOnly) return false;

      // Quality stars
      const effectiveStars = isMemberOrAdmin
        ? (entry.userStars ?? r.defaultStars)
        : r.defaultStars;
      if (filters.minStars > 0 && effectiveStars < filters.minStars) {
        return false;
      }

      // Member-only filters
      if (isMemberOrAdmin) {
        if (filters.onlyFavourites && !entry.favourite) {
          return false;
        }
        if (
          filters.tickFilter === 'completed' &&
          !isCompletedTick(entry.status)
        ) {
          return false;
        }
        if (filters.tickFilter === 'todo' && isCompletedTick(entry.status)) {
          return false;
        }
        if (
          !['all', 'completed', 'todo'].includes(filters.tickFilter) &&
          entry.status !== filters.tickFilter
        ) {
          return false;
        }
      }

      return true;
    });
  }, [filters, getEntry, isMemberOrAdmin]);

  const filteredRouteIds = useMemo(
    () => new Set(filteredRoutes.map((r) => r.id)),
    [filteredRoutes]
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search.trim()) count += 1;
    if (filters.selectedGrades.length > 0) count += 1;
    if (filters.setter !== 'all') count += 1;
    if (filters.year !== 'all') count += 1;
    if (filters.lengthRange !== 'all') count += 1;
    if (filters.protectionType !== 'all') count += 1;
    if (filters.minStars > 0) count += 1;
    if (isMemberOrAdmin && filters.onlyFavourites) count += 1;
    if (isMemberOrAdmin && filters.tickFilter !== 'all') count += 1;
    if (filters.wallFilter !== 'all') count += 1;
    return count;
  }, [filters, isMemberOrAdmin]);

  const handleToggleGrade = (frenchGrade) => {
    setFilters((prev) => {
      const exists = prev.selectedGrades.includes(frenchGrade);
      const next = exists
        ? prev.selectedGrades.filter((g) => g !== frenchGrade)
        : [...prev.selectedGrades, frenchGrade];
      return { ...prev, selectedGrades: next };
    });
  };

  const handleSelectGradeTier = (tier) => {
    const tierGrades = [
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
    ].filter((g) => getGradeTier(g) === tier);
    if (tierGrades.length === 0) return;
    setFilters((prev) => {
      const allSelected = tierGrades.every((g) =>
        prev.selectedGrades.includes(g)
      );
      return {
        ...prev,
        selectedGrades: allSelected ? [] : tierGrades,
      };
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-14">
      {/* Top Navigation & Demo View Switcher Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 text-gray-600 hover:text-gray-900 -ml-2 h-8 px-2"
            >
              <Link to="/sectors" data-testid="back-to-sectors">
                <ChevronLeft className="w-4 h-4" />
                <span>{isGr ? 'Τα Πεδία' : 'The Sectors'}</span>
              </Link>
            </Button>

            <a
              href="https://loc.wiki/t/166954682?wa=sc"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-[#1e3a8a] bg-[#1e3a8a]/5 hover:bg-[#1e3a8a]/10 border border-[#1e3a8a]/15 rounded-full px-2.5 py-1 transition-colors"
            >
              <MapPin className="w-3 h-3" />
              <span>{isGr ? 'Πρόσβαση 10′ (Wikiloc)' : 'Approach 10′ (Wikiloc)'}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Right Side: 3 Demo Mode Toggle Buttons + Logbook + Language */}
          <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
            {/* 3-Mode Demonstration Switcher (Guest / Logged-in / Admin) */}
            <div
              className="inline-flex items-center rounded-lg bg-gray-100 p-0.5 border border-gray-200 text-xs"
              role="group"
              aria-label="Demo View Mode"
            >
              <button
                type="button"
                onClick={() => setUserMode('guest')}
                className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-md font-semibold transition-all ${
                  userMode === 'guest'
                    ? 'bg-white text-[#1e3a8a] shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title={
                  isGr
                    ? 'Δημόσια Προβολή (Επισκέπτης — χωρίς Αγαπημένα/Ολοκληρωμένες)'
                    : 'Public View (Guest — no Favourite/Done columns)'
                }
              >
                <Users className="w-3.5 h-3.5" />
                <span>{isGr ? 'Επισκέπτης' : 'Guest'}</span>
              </button>

              <button
                type="button"
                onClick={() => setUserMode('member')}
                className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-md font-semibold transition-all ${
                  userMode === 'member'
                    ? 'bg-[#1e3a8a] text-white shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title={
                  isGr
                    ? 'Συνδεδεμένο Μέλος (Αγαπημένα, Ολοκληρωμένες, Σημειώσεις)'
                    : 'Logged-in Member (Favourites, Completed ticks, Notes)'
                }
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>{isGr ? 'Μέλος' : 'Logged-in'}</span>
              </button>

              <button
                type="button"
                onClick={() => setUserMode('admin')}
                className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-md font-semibold transition-all ${
                  userMode === 'admin'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title={
                  isGr
                    ? 'Διαχειριστής (Προσθήκη λειτουργίας Edit Topo)'
                    : 'Admin (Unlocks Edit Topo path calibration)'
                }
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            </div>

            {isMemberOrAdmin && (
              <button
                type="button"
                onClick={() => setLogbookModalOpen(true)}
                className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-gray-700 hover:text-[#1e3a8a] bg-gray-100 hover:bg-gray-200/70 rounded-lg px-2.5 py-1.5 transition-colors"
                title="Logbook Backup"
              >
                <Trophy className="w-3.5 h-3.5 text-[#1e3a8a]" />
              </button>
            )}

            <button
              type="button"
              onClick={onToggleLang}
              className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700 hover:text-gray-900 bg-white border border-gray-200 rounded-lg px-2 py-1 transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-[#1e3a8a]" />
              <span>{isGr ? 'EN' : 'ΕΛ'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div
        className="max-w-[1440px] mx-auto px-2.5 sm:px-6 lg:px-8 pt-3 sm:pt-4"
        style={{ overflowAnchor: 'none' }}
      >
        {/* Compact Sector Header */}
        <div className="mb-2.5 sm:mb-3.5 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <Badge variant="outline" className="text-[11px] bg-white">
                <MapPin className="w-3 h-3 mr-1 text-[#1e3a8a]" />
                {isGr ? 'Ηλιούπολη' : 'Ilioupoli'}
              </Badge>
              <Badge className="bg-[#1e3a8a]/10 text-[#1e3a8a] text-[11px]">
                {isGr ? '33 διαδρομές (40 γραμμές)' : '33 routes (40 lines)'}
              </Badge>
              <span className="text-xs text-gray-600 inline-flex items-center gap-1 font-medium">
                <Mountain className="w-3.5 h-3.5 text-[#1e3a8a]" /> V – VIII (5a – 7a)
              </span>
              <span className="hidden sm:inline-flex text-xs text-gray-600 items-center gap-1 font-medium">
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                {isGr
                  ? 'Σκιά έως 10:00 & 11:00–βράδυ (Χειμώνας: όλη μέρα)'
                  : 'Shade <10:00 & 11:00–dusk (Winter: all day)'}
              </span>
            </div>

            <h1 className="text-xl sm:text-3xl font-bold text-gray-900">
              {isGr ? 'Κόκκινη Πίστα' : 'Red Crag (Kokkini Pista)'}
            </h1>
          </div>

          <p className="hidden md:block text-xs text-gray-500 max-w-md text-right">
            {isGr
              ? 'Ανακατασκευή & συντήρηση 2017 (Δ. Τιτόπουλος · ΣΠΑΥ / Δήμος Ηλιούπολης / ΕΟΣΗ) με Inox 316L UIAA.'
              : 'Restored in 2017 (D. Titopoulos · SPAY / Ilioupoli / EOSH) with Inox 316L UIAA bolts & anchors.'}
          </p>
        </div>

        {/* Responsive Layout:
            - Mobile (<1024px): Single column with truly sticky top-0 Photo-Topo directly inside the tall container
            - Desktop (>=1024px): 2-Column Split Layout (Sticky Photo-Topo on left, Histogram + Filters + Table on right),
              or 12-column expanded box when "Μεγάλο" (isExpandedSize) is active */}
        <div
          className="lg:grid lg:grid-cols-12 lg:gap-5 lg:items-start"
          style={{ overflowAnchor: 'none' }}
        >
          {/* Column 1: Sticky Interactive Photo-Topo (Direct child of tall grid/section so CSS position:sticky stays stuck!) */}
          <div
            data-testid="topo-sticky-wrapper"
            className={`topo-sticky-container mb-3 lg:mb-0 ${
              isExpandedSize
                ? 'lg:col-span-12 topo-expanded-desktop lg:mb-4'
                : 'lg:col-span-5 xl:col-span-5 topo-split-desktop'
            }`}
          >
            <InteractiveTopo
              isGr={isGr}
              userMode={userMode}
              routes={KOKKINI_PISTA_ROUTES}
              filteredRouteIds={filteredRouteIds}
              selectedRoute={selectedRoute}
              onSelectRoute={handleSelectRoute}
              activeWall={activeWall}
              onChangeWall={setActiveWall}
              gradeSystem={gradeSystem}
              getEntry={getEntry}
              customPaths={customPaths}
              onUpdateRoutePath={updateRoutePath}
              onResetRoutePath={resetRoutePath}
              onToggleFavourite={toggleFavourite}
              onToggleTickStatus={toggleTickStatus}
              isExpandedSize={isExpandedSize}
              onToggleExpandedSize={() => setIsExpandedSize((v) => !v)}
            />
          </div>

          {/* Column 2: Filter Bar + Grade Histogram & Crag Stats + Route List/Table */}
          <div
            className={`min-w-0 ${
              isExpandedSize ? 'lg:col-span-12' : 'lg:col-span-7 xl:col-span-7'
            }`}
          >
            {/* Compact Filter Bar */}
            <RouteFilterBar
              isGr={isGr}
              userMode={userMode}
              filters={filters}
              onChangeFilters={setFilters}
              onResetAllFilters={() => setFilters(INITIAL_FILTERS)}
              onSelectGradeTier={handleSelectGradeTier}
              activeFilterCount={activeFilterCount}
              totalCount={KOKKINI_PISTA_ROUTES.length}
              filteredCount={filteredRoutes.length}
              gradeSystem={gradeSystem}
              onToggleGradeSystem={() =>
                setGradeSystem((g) => (g === 'french' ? 'uiaa' : 'french'))
              }
              viewMode={viewMode}
              onChangeViewMode={setViewMode}
            />

            {/* Rockfax Grade Distribution Bar Chart & Crag Info (Collapsible on mobile, open on desktop) */}
            <GradeChartAndStats
              isGr={isGr}
              userMode={userMode}
              routes={KOKKINI_PISTA_ROUTES}
              gradeSystem={gradeSystem}
              selectedGrades={filters.selectedGrades}
              onToggleGrade={handleToggleGrade}
              onSelectGradeTier={handleSelectGradeTier}
              onClearGrades={() =>
                setFilters((p) => ({ ...p, selectedGrades: [] }))
              }
              getEntry={getEntry}
              onOpenLogbookModal={() => setLogbookModalOpen(true)}
            />

            {/* Compact Mobile Route List / Full Sortable Desktop Table */}
            <RouteListAndTable
              isGr={isGr}
              userMode={userMode}
              routes={filteredRoutes}
              selectedRoute={selectedRoute}
              onSelectRoute={handleSelectRoute}
              gradeSystem={gradeSystem}
              viewMode={viewMode}
              getEntry={getEntry}
              onToggleFavourite={toggleFavourite}
              onToggleTickStatus={toggleTickStatus}
              onSetStars={setStars}
              onUpdateEntry={updateEntry}
              onFilterBySetter={(setter) =>
                setFilters((p) => ({
                  ...p,
                  setter: p.setter === setter ? 'all' : setter,
                }))
              }
              onFilterByYear={(year) =>
                setFilters((p) => ({
                  ...p,
                  year: p.year === year ? 'all' : year,
                }))
              }
            />
          </div>
        </div>
      </div>

      {/* Personal Logbook Backup / Summary Modal */}
      {isMemberOrAdmin && (
        <LogbookModal
          isOpen={logbookModalOpen}
          onClose={() => setLogbookModalOpen(false)}
          isGr={isGr}
          routes={KOKKINI_PISTA_ROUTES}
          logbook={logbook}
          customPaths={customPaths}
          getEntry={getEntry}
          onImportJson={importLogbookJson}
          onClearLogbook={clearLogbook}
        />
      )}
    </div>
  );
}

