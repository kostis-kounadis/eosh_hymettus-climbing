import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  MapPin,
  Mountain,
  Sun,
  CloudSun,
  Globe,
  ExternalLink,
  Trophy,
  Users,
  UserCheck,
  Shield,
  ShieldAlert,
  Compass,
  BookOpen,
  Wrench,
  Footprints,
  Heart,
  Layers,
  Car,
  Navigation,
  AlertTriangle,
  Ruler,
  Info,
} from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import InteractiveTopo from './InteractiveTopo';
import GradeChartAndStats, { getHymettusSunStatus } from './GradeChartAndStats';
import RouteFilterBar from './RouteFilterBar';
import RouteListAndTable from './RouteListAndTable';
import LogbookModal from './LogbookModal';
import {
  KOKKINI_PISTA_ROUTES,
  CRAG_INFO_2018,
  getGradeTier,
} from '../data/kokkiniPistaRoutes';
import {
  useClimberLogbook,
  isCompletedTick,
} from '../hooks/useClimberLogbook';

const INITIAL_FILTERS = {
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
  const [userMode, setUserMode] = useState('guest');
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [activeWall, setActiveWall] = useState(1);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [gradeSystem, setGradeSystem] = useState('french'); // 'french' | 'uiaa'
  const [viewMode, setViewMode] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth >= 960 ? 'table' : 'cards'
  );
  const [isExpandedSize, setIsExpandedSize] = useState(false);
  const [logbookModalOpen, setLogbookModalOpen] = useState(false);
  const [approachDrawerOpen, setApproachDrawerOpen] = useState(false);
  const [infoDrawerOpen, setInfoDrawerOpen] = useState(false);

  // Live Side-by-Side Layout Switcher (Default Layout B, or ?layout=a)
  const layoutVariant = searchParams.get('layout') === 'a' ? 'a' : 'b';
  const isLayoutB = layoutVariant === 'b';

  const handleSetLayoutVariant = (nextVariant) => {
    const nextParams = new URLSearchParams(searchParams);
    if (nextVariant === 'a') {
      nextParams.set('layout', 'a');
    } else {
      nextParams.delete('layout');
    }
    setSearchParams(nextParams, { replace: true });
  };

  const isMemberOrAdmin = userMode === 'member' || userMode === 'admin';
  const sunStatus = useMemo(() => getHymettusSunStatus(isGr), [isGr]);

  const cragCounts = useMemo(() => {
    const total = KOKKINI_PISTA_ROUTES.length;
    const topRope = KOKKINI_PISTA_ROUTES.filter((r) => r.isTopRopeOnly).length;
    const sport = total - topRope;
    return { total, sport, topRope };
  }, []);

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

  const logbookSummary = useMemo(() => {
    let completed = 0;
    let onsight = 0;
    let flash = 0;
    let favourites = 0;
    if (isMemberOrAdmin) {
      KOKKINI_PISTA_ROUTES.forEach((r) => {
        const e = getEntry(r.id);
        if (isCompletedTick(e.status)) completed += 1;
        if (e.status === 'onsight') onsight += 1;
        if (e.status === 'flash') flash += 1;
        if (e.favourite) favourites += 1;
      });
    }
    return { completed, onsight, flash, favourites };
  }, [getEntry, isMemberOrAdmin]);

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

  const handleResetAllFilters = () => {
    setFilters(INITIAL_FILTERS);
    setSelectedRoute(null);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('route');
    setSearchParams(nextParams, { replace: true });
  };

  const handleSelectRoute = (route) => {
    setSelectedRoute(route);
    const nextParams = new URLSearchParams(searchParams);
    if (route) {
      if (route.wall !== activeWall) {
        setActiveWall(route.wall);
      }
      nextParams.set('route', route.id);
    } else {
      nextParams.delete('route');
    }
    setSearchParams(nextParams, { replace: true });
  };

  // Compute filtered routes
  const filteredRoutes = useMemo(() => {
    return KOKKINI_PISTA_ROUTES.filter((r) => {
      const entry = getEntry(r.id);

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
      {/* 1. Top Navigation & Presentation Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {/* 1.A Back Button */}
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

            {/* 1.B Wikiloc Pill — kept only in Layout A (removed in Layout B, moved to Πρόσβαση drawer) */}
            {!isLayoutB && (
              <a
                href={CRAG_INFO_2018.wikilocUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-[#1e3a8a] bg-[#1e3a8a]/5 hover:bg-[#1e3a8a]/10 border border-[#1e3a8a]/15 rounded-full px-2.5 py-1 transition-colors"
              >
                <MapPin className="w-3 h-3" />
                <span>{isGr ? 'Πρόσβαση 10′ (Wikiloc)' : 'Approach 10′ (Wikiloc)'}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {/* Right Side: Temporary Presentation Controls (1.C + Layout Switcher) + (1.D in Layout A) + 1.E Language */}
          <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
            {/* 1.C Temporary Presentation Container (for Club Presentation) */}
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50/70 border border-dashed border-amber-300/90 px-1.5 py-0.5">
              <span
                className="hidden md:inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-800 px-1"
                title={
                  isGr
                    ? 'Προσωρινό πάνελ επίδειξης για την παρουσίαση στον Σύλλογο'
                    : 'Temporary demo controls for the Club presentation'
                }
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                {isGr ? 'Demo Παρουσίασης' : 'Presentation Demo'}
              </span>

              {/* Layout A / Layout B Switcher */}
              <div
                className="inline-flex items-center rounded-md bg-white/90 p-0.5 border border-amber-200 text-[11px]"
                role="group"
                aria-label="Layout Variant Switcher"
              >
                <button
                  type="button"
                  onClick={() => handleSetLayoutVariant('a')}
                  className={`px-2 py-0.5 rounded font-semibold transition-all ${
                    !isLayoutB
                      ? 'bg-[#1e3a8a] text-white shadow-2xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title={isGr ? 'Τρέχον Layout (A)' : 'Current Layout (A)'}
                >
                  Layout A
                </button>
                <button
                  type="button"
                  onClick={() => handleSetLayoutVariant('b')}
                  className={`px-2 py-0.5 rounded font-semibold transition-all ${
                    isLayoutB
                      ? 'bg-[#1e3a8a] text-white shadow-2xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title={isGr ? 'Εναλλακτικό Layout (B)' : 'Alternate Layout (B)'}
                >
                  Layout B
                </button>
              </div>

              {/* 1.C 3-Mode Demonstration Switcher (Guest / Logged-in / Admin) */}
              <div
                className="inline-flex items-center rounded-md bg-white/90 p-0.5 border border-amber-200 text-xs"
                role="group"
                aria-label="Demo View Mode"
              >
                <button
                  type="button"
                  onClick={() => setUserMode('guest')}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold transition-all ${
                    userMode === 'guest'
                      ? 'bg-gray-900 text-white shadow-2xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title={
                    isGr
                      ? 'Δημόσια Προβολή (Επισκέπτης — χωρίς Αγαπημένα/Ολοκληρωμένες)'
                      : 'Public View (Guest — no Favourite/Done columns)'
                  }
                >
                  <Users className="w-3 h-3" />
                  <span className="hidden sm:inline">{isGr ? 'Επισκέπτης' : 'Guest'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setUserMode('member')}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold transition-all ${
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
                  <UserCheck className="w-3 h-3" />
                  <span className="hidden sm:inline">{isGr ? 'Μέλος' : 'Logged-in'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setUserMode('admin')}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold transition-all ${
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
                  <Shield className="w-3 h-3" />
                  <span className="hidden sm:inline">Admin</span>
                </button>
              </div>

              {/* 1.D Logbook Trophy Button inside temporary Demo bar when Member/Admin */}
              {isMemberOrAdmin && (
                <button
                  type="button"
                  onClick={() => setLogbookModalOpen(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1e3a8a] bg-white hover:bg-gray-50 border border-amber-200 rounded-md px-2 py-0.5 transition-colors"
                  title="Logbook Backup"
                >
                  <Trophy className="w-3 h-3 text-[#1e3a8a]" />
                  <span className="hidden xl:inline">
                    {logbookSummary.completed}/{cragCounts.total}
                  </span>
                </button>
              )}
            </div>

            {/* 1.E Language Switcher */}
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
        {isLayoutB ? (
          /* ============================================================================
             LAYOUT B (Alternate Layout: 12-column grid starts immediately below Top Bar)
             Left Column (4 cols): Single Crag Intro/Header/Safety Box, 2-Row Quick Specs & Shade Box,
                                   Collapsible 4.B1 Histogram, Πρόσβαση & Πληροφορίες Drawers
             Right Column (8 cols): 3 (Topo) -> 4.A (Filter Bar) -> 4.C (Table)
             ============================================================================ */
          <div
            className="lg:grid lg:grid-cols-12 lg:gap-5 lg:items-start"
            style={{ overflowAnchor: 'none' }}
          >
            {/* LEFT COLUMN (4 cols width) */}
            <div className="lg:col-span-4 space-y-2.5 mb-3 lg:mb-0">
              {/* Box 1: Single Combined Box for Badges + Title + Crag Intro + Restoration + Helmet (Wildfire) Warning */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-3.5 space-y-2.5">
                <div>
                  {/* Line 1: 2.A Sector Badge + 2.B Route Count + Dynamic Approach Indicator */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                    <Badge variant="outline" className="text-[11px] bg-gray-50/80 border-gray-200 text-gray-800 font-semibold">
                      <MapPin className="w-3 h-3 mr-1 text-[#1e3a8a]" />
                      {isGr ? 'Ηλιούπολη' : 'Ilioupoli'}
                    </Badge>
                    <Badge className="bg-[#1e3a8a]/10 text-[#1e3a8a] hover:bg-[#1e3a8a]/15 border-0 text-[11px] font-bold">
                      {isGr
                        ? `${cragCounts.total} διαδρομές`
                        : `${cragCounts.total} routes`}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-[11px] bg-emerald-50/70 text-emerald-800 border-emerald-200 font-semibold inline-flex items-center gap-1"
                    >
                      <Footprints className="w-3 h-3 text-emerald-600" />
                      <span>
                        {isGr
                          ? `${CRAG_INFO_2018.approachMinutes}′ Πρόσβαση`
                          : `${CRAG_INFO_2018.approachMinutes}′ Approach`}
                      </span>
                    </Badge>
                  </div>

                  {/* Line 2: 2.E Main Title */}
                  <h1 className="text-2xl sm:text-[26px] font-extrabold text-gray-900 tracking-tight leading-tight">
                    {isGr ? 'Κόκκινη Πίστα' : 'Red Crag (Kokkini Pista)'}
                  </h1>
                </div>

                {/* Crag Intro Description */}
                <p className="text-xs text-gray-700 leading-relaxed">
                  {isGr ? CRAG_INFO_2018.introGr : CRAG_INFO_2018.introEn}
                </p>

                {/* 2.F Restoration note */}
                <div className="flex items-start gap-2 pt-2 border-t border-gray-100 text-[11px] text-gray-500 leading-snug">
                  <Wrench className="w-3.5 h-3.5 text-[#1e3a8a] shrink-0 mt-0.5" />
                  <span>
                    {isGr
                      ? CRAG_INFO_2018.restorationShortGr
                      : CRAG_INFO_2018.restorationShortEn}
                  </span>
                </div>
              </div>

              {/* Box 2: 2-Row Compact Quick Specs & Seasonal Shade Box */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-2.5 space-y-2">
                {/* Row 1: Single-line 5 Specs (Εύρος Βαθμών | Sport | Top Rope / Trad | Ύψος | Σετάκια) */}
                <div className="grid grid-cols-5 divide-x divide-gray-200/80 rounded-lg bg-gray-50/80 border border-gray-200/70 py-1.5 px-0.5">
                  {/* 1. Εύρος Βαθμών */}
                  <div className="px-1 flex flex-col items-center justify-center text-center min-w-0">
                    <span className="text-[10px] font-medium text-gray-500 whitespace-nowrap leading-tight">
                      {isGr ? 'Εύρος Βαθμών' : 'Grade Span'}
                    </span>
                    <span className="text-xs font-extrabold text-gray-900 whitespace-nowrap mt-0.5 leading-tight">
                      5a–7a
                    </span>
                  </div>

                  {/* 2. Sport */}
                  <div className="px-1 flex flex-col items-center justify-center text-center min-w-0">
                    <span className="text-[10px] font-medium text-gray-500 whitespace-nowrap leading-tight">
                      Sport
                    </span>
                    <span className="text-xs font-extrabold text-gray-900 whitespace-nowrap mt-0.5 leading-tight">
                      {cragCounts.sport}
                    </span>
                  </div>

                  {/* 3. Top Rope / Trad */}
                  <div className="px-1 flex flex-col items-center justify-center text-center min-w-0">
                    <span className="text-[10px] font-medium text-gray-500 whitespace-nowrap leading-tight">
                      Top Rope
                    </span>
                    <span className="text-[10px] font-medium text-gray-500 whitespace-nowrap leading-tight">
                      Trad
                    </span>
                    <span className="text-xs font-extrabold text-gray-900 whitespace-nowrap mt-0.5 leading-tight">
                      {cragCounts.topRope}
                    </span>
                  </div>

                  {/* 4. Ύψος */}
                  <div className="px-1 flex flex-col items-center justify-center text-center min-w-0">
                    <span className="text-[10px] font-medium text-gray-500 whitespace-nowrap leading-tight">
                      {isGr ? 'Ύψος' : 'Height'}
                    </span>
                    <span className="text-xs font-extrabold text-gray-900 whitespace-nowrap mt-0.5 leading-tight">
                      5–15m
                    </span>
                  </div>

                  {/* 5. Σετάκια */}
                  <div className="px-1 flex flex-col items-center justify-center text-center min-w-0">
                    <span className="text-[10px] font-medium text-gray-500 whitespace-nowrap leading-tight">
                      {isGr ? 'Σετάκια' : 'Quickdraws'}
                    </span>
                    <span className="text-xs font-extrabold text-gray-900 whitespace-nowrap mt-0.5 leading-tight">
                      ≤ 9+2
                    </span>
                    <span className="text-[9px] font-medium text-gray-500 whitespace-nowrap leading-tight mt-0.5">
                      {isGr ? '(σχοινί 40m)' : '(40m rope)'}
                    </span>
                  </div>
                </div>

                {/* Row 2: Summer & Winter Shade Info (from 2018 PDF) + Live Sun/Shade Indicator */}
                <div
                  className={`rounded-lg border px-2.5 py-1.5 flex items-center gap-2 ${
                    sunStatus.state === 'shade'
                      ? 'bg-sky-50/60 border-sky-200/80 text-sky-950'
                      : 'bg-amber-50/60 border-amber-200/80 text-amber-950'
                  }`}
                >
                  <Sun
                    className={`w-3.5 h-3.5 shrink-0 ${
                      sunStatus.state === 'shade' ? 'text-sky-600' : 'text-amber-500'
                    }`}
                  />
                  <div className="text-[11px] leading-snug min-w-0">
                    <span className="font-bold">
                      {isGr ? 'Σκιά (ΒΔ): ' : 'Shade (NW): '}
                    </span>
                    <span>
                      {isGr
                        ? 'Καλοκαίρι έως 10:00 & 11:00–βράδυ · Χειμώνας όλη μέρα'
                        : 'Summer <10:00 & 11:00–dusk · Winter all day'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Box 3: 4.B1 Collapsible Interactive Grade Distribution Histogram */}
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
                histogramOnly={true}
              />

              {/* Box 4: Collapsible «Πρόσβαση» (Approach) Drawer */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
                <button
                  type="button"
                  onClick={() => setApproachDrawerOpen((v) => !v)}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-gray-50/80 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-[#1e3a8a]" />
                    <span className="text-xs font-bold text-gray-900">
                      {isGr ? 'Πρόσβαση' : 'Approach'}
                    </span>
                    <span className="text-[11px] text-gray-500 font-medium">
                      ({isGr ? `${CRAG_INFO_2018.approachMinutes}′ πεζοπορία` : `${CRAG_INFO_2018.approachMinutes}′ walk`})
                    </span>
                  </div>
                  {approachDrawerOpen ? (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  )}
                </button>

                {approachDrawerOpen && (
                  <div className="px-3.5 pb-3.5 pt-2 border-t border-gray-100 space-y-2.5 text-xs text-gray-600 leading-relaxed">
                    <p>
                      {isGr ? CRAG_INFO_2018.approachGr : CRAG_INFO_2018.approachEn}
                    </p>

                    {/* Action Links: Parking Google Maps + Actual Crag Spot Google Maps + Temporary Wikiloc */}
                    <div className="flex flex-col gap-1.5 pt-1">
                      <a
                        href={CRAG_INFO_2018.parkingMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-gray-50 hover:bg-[#1e3a8a]/5 border border-gray-200 hover:border-[#1e3a8a]/30 text-gray-800 hover:text-[#1e3a8a] font-semibold transition-colors"
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#1e3a8a]" />
                          {isGr
                            ? 'Σημείο Στάθμευσης (Google Maps)'
                            : 'Parking Spot (Google Maps)'}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                      </a>

                      <a
                        href={CRAG_INFO_2018.cragMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-gray-50 hover:bg-[#1e3a8a]/5 border border-gray-200 hover:border-[#1e3a8a]/30 text-gray-800 hover:text-[#1e3a8a] font-semibold transition-colors"
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <Mountain className="w-3.5 h-3.5 text-[#1e3a8a]" />
                          {isGr
                            ? 'Σημείο Πεδίου — Κόκκινη Πίστα (Google Maps)'
                            : 'Actual Crag Spot — Kokkini Pista (Google Maps)'}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                      </a>

                      <a
                        href={CRAG_INFO_2018.wikilocUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-amber-50/60 hover:bg-amber-100/60 border border-dashed border-amber-300 text-amber-900 font-semibold transition-colors"
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <Footprints className="w-3.5 h-3.5 text-amber-700" />
                          {isGr
                            ? 'Μονοπάτι στο Wikiloc (προσωρινό)'
                            : 'Wikiloc Trail (temporary)'}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Box 5: Collapsible «Πληροφορίες» (Info & History) Drawer */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
                <button
                  type="button"
                  onClick={() => setInfoDrawerOpen((v) => !v)}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-gray-50/80 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-[#1e3a8a]" />
                    <span className="text-xs font-bold text-gray-900">
                      {isGr ? 'Πληροφορίες' : 'Crag Information'}
                    </span>
                    <span className="text-[11px] text-gray-500 font-medium">
                      ({isGr ? 'Βράχος, Συντήρηση & Ιστορικό' : 'Rock, Rebolting & History'})
                    </span>
                  </div>
                  {infoDrawerOpen ? (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  )}
                </button>

                {infoDrawerOpen && (
                  <div className="px-3.5 pb-3.5 pt-2 border-t border-gray-100 space-y-3 text-xs text-gray-600 leading-relaxed">
                    <div>
                      <div className="font-bold text-gray-900 mb-0.5 flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-amber-600" />
                        <span>
                          {isGr ? 'Χαρακτήρας Βράχου & Ασφάλεια' : 'Rock Character & Safety'}
                        </span>
                      </div>
                      <p>
                        {isGr
                          ? CRAG_INFO_2018.rockAndSafetyGr
                          : CRAG_INFO_2018.rockAndSafetyEn}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-gray-100">
                      <div className="font-bold text-gray-900 mb-0.5 flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5 text-emerald-700" />
                        <span>
                          {isGr
                            ? 'Ανακατασκευή & Συντήρηση 2017'
                            : '2017 Rebolting & Restoration'}
                        </span>
                      </div>
                      <p>{isGr ? CRAG_INFO_2018.reboltingGr : CRAG_INFO_2018.reboltingEn}</p>
                    </div>

                    <div className="pt-2 border-t border-gray-100">
                      <div className="font-bold text-gray-900 mb-0.5 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-[#1e3a8a]" />
                        <span>
                          {isGr ? 'Ιστορικοί Οδηγοί Πεδίου' : 'Historical Guidebooks'}
                        </span>
                      </div>
                      <p>{isGr ? CRAG_INFO_2018.guidebooksGr : CRAG_INFO_2018.guidebooksEn}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN (8 cols width): 3 (Topo) -> 4.A (Filter Bar) -> 4.C (Table) */}
            <div className="lg:col-span-8 min-w-0 space-y-3">
              {/* 3. Interactive Photo-Topo (Sticky on mobile <1024px, standard flow on desktop inside 8-col right pane) */}
              <div
                data-testid="topo-sticky-wrapper"
                className="topo-sticky-container topo-expanded-desktop"
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
                  onResetFilters={handleResetAllFilters}
                />
              </div>

              {/* 4.A Filter Bar */}
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

              {/* 4.C Route Table */}
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
        ) : (
          /* ============================================================================
             LAYOUT A (Current Layout)
             ============================================================================ */
          <>
            {/* Compact Sector Header */}
            <div className="mb-2.5 sm:mb-3.5 flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  <Badge variant="outline" className="text-[11px] bg-white">
                    <MapPin className="w-3 h-3 mr-1 text-[#1e3a8a]" />
                    {isGr ? 'Ηλιούπολη' : 'Ilioupoli'}
                  </Badge>
                  <Badge className="bg-[#1e3a8a]/10 text-[#1e3a8a] text-[11px]">
                    {isGr
                      ? `${cragCounts.total} διαδρομές`
                      : `${cragCounts.total} routes`}
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

            <div
              className="lg:grid lg:grid-cols-12 lg:gap-5 lg:items-start"
              style={{ overflowAnchor: 'none' }}
            >
              {/* Column 1: Sticky Interactive Photo-Topo */}
              <div
                data-testid="topo-sticky-wrapper"
                className={`topo-sticky-container mb-3 lg:mb-0 ${
                  isExpandedSize
                    ? 'lg:col-span-12 topo-expanded-desktop lg:mb-4'
                    : 'lg:col-span-4 xl:col-span-4 topo-split-desktop'
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
                  onResetFilters={handleResetAllFilters}
                />
              </div>

              {/* Column 2: Filter Bar + Grade Histogram & Crag Stats + Route List/Table */}
              <div
                className={`min-w-0 ${
                  isExpandedSize ? 'lg:col-span-12' : 'lg:col-span-8 xl:col-span-8'
                }`}
              >
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
          </>
        )}
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

