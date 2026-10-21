import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useSearchParams, useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  MapPin,
  Mountain,
  Sun,
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
import SelectedRouteDetailPanel from './SelectedRouteDetailPanel';
import LogbookModal from './LogbookModal';
import { getGradeTier, GRADE_BANDS } from '../data/kokkiniPistaRoutes';
import {
  useClimberLogbook,
  isCompletedTick,
} from '../hooks/useClimberLogbook';
import { getCragByKey, ALL_SECTORS_LIST } from '../data/cragsCatalog';

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

export default function SectorDetailPage({
  sectorKey: propSectorKey,
  isGr,
  onToggleLang,
}) {
  const { sectorKey: paramSectorKey } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentSectorKey = propSectorKey || paramSectorKey || 'kokkini';
  const crag = useMemo(() => getCragByKey(currentSectorKey), [currentSectorKey]);
  const routes = crag.routes;
  const cragInfo = crag.cragInfo;
  const walls = crag.walls;
  const setters = crag.setters;
  const years = crag.years;

  // 3 Demonstration Views: 'guest' (Public) | 'member' (Logged-in) | 'admin' (Admin)
  const [userMode, setUserMode] = useState('guest');
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [activeWall, setActiveWall] = useState(1);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [isExpandedSize, setIsExpandedSize] = useState(false);
  const [logbookModalOpen, setLogbookModalOpen] = useState(false);
  const [approachDrawerOpen, setApproachDrawerOpen] = useState(false);
  const [infoDrawerOpen, setInfoDrawerOpen] = useState(false);
  const stickyHeaderRefB = useRef(null);
  const [stickyTopOffsetB, setStickyTopOffsetB] = useState(0);

  const stickyHeaderRefA = useRef(null);
  const [stickyTopOffsetA, setStickyTopOffsetA] = useState(0);

  // Reset wall & selection when switching crag
  useEffect(() => {
    setActiveWall(1);
    setSelectedRoute(null);
    setFilters(INITIAL_FILTERS);
  }, [crag.key]);

  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return;

    let roB;
    const elB = stickyHeaderRefB.current;
    if (elB) {
      const updateB = () => setStickyTopOffsetB(elB.offsetHeight);
      updateB();
      roB = new ResizeObserver(updateB);
      roB.observe(elB);
    }

    let roA;
    const elA = stickyHeaderRefA.current;
    if (elA) {
      const updateA = () => setStickyTopOffsetA(elA.offsetHeight);
      updateA();
      roA = new ResizeObserver(updateA);
      roA.observe(elA);
    }

    return () => {
      roB?.disconnect();
      roA?.disconnect();
    };
  }, [filters, crag.key]);

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
  const sunStatus = useMemo(
    () => getHymettusSunStatus(isGr, crag.key),
    [isGr, crag.key]
  );

  const cragCounts = useMemo(() => {
    const total = routes.length;
    const topRope = routes.filter((r) => r.isTopRopeOnly).length;
    const sport = total - topRope;
    const multiPitch = routes.filter((r) => r.isMultiPitch).length;
    return { total, sport, topRope, multiPitch };
  }, [routes]);

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
      routes.forEach((r) => {
        const e = getEntry(r.id);
        if (isCompletedTick(e.status)) completed++;
        if (e.status === 'onsight') onsight++;
        if (e.status === 'flash') flash++;
        if (e.favourite) favourites++;
      });
    }
    return { completed, onsight, flash, favourites };
  }, [isMemberOrAdmin, routes, getEntry, logbook]);

  // Deep-link to route by query param ?route=id
  useEffect(() => {
    const routeParam = searchParams.get('route');
    if (routeParam) {
      const found = routes.find((r) => r.id === routeParam);
      if (found) {
        setSelectedRoute(found);
        if (found.wall && found.wall !== activeWall) {
          setActiveWall(found.wall);
        }
      }
    }
  }, [searchParams, routes]);

  // Handle route selection and synchronize URL query param
  const handleSelectRoute = (route, options = { scroll: true }) => {
    setSelectedRoute(route);
    const nextParams = new URLSearchParams(searchParams);
    if (route) {
      nextParams.set('route', route.id);
      if (route.wall && route.wall !== activeWall) {
        setActiveWall(route.wall);
      }
      if (options.scroll) {
        setTimeout(() => {
          const rowEl = document.getElementById(`route-row-${route.id}`);
          if (rowEl) {
            rowEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }, 80);
      }
    } else {
      nextParams.delete('route');
    }
    setSearchParams(nextParams, { replace: true });
  };

  // Grade selection helpers
  const handleToggleGrade = (grade) => {
    setFilters((prev) => {
      const exists = prev.selectedGrades.includes(grade);
      return {
        ...prev,
        selectedGrades: exists
          ? prev.selectedGrades.filter((g) => g !== grade)
          : [...prev.selectedGrades, grade],
      };
    });
  };

  const handleClearGrades = () => {
    setFilters((prev) => ({ ...prev, selectedGrades: [] }));
  };

  const handleResetAllFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  const handleFilterBySetter = (setterName) => {
    setFilters((prev) => ({
      ...prev,
      setter: prev.setter === setterName ? 'all' : setterName,
    }));
  };

  const handleFilterByYear = (yearStr) => {
    setFilters((prev) => ({
      ...prev,
      year: prev.year === yearStr ? 'all' : yearStr,
    }));
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.selectedGrades.length > 0) count++;
    if (filters.setter !== 'all') count++;
    if (filters.year !== 'all') count++;
    if (filters.lengthRange !== 'all') count++;
    if (filters.protectionType !== 'all') count++;
    if (filters.minStars > 0) count++;
    if (filters.onlyFavourites) count++;
    if (filters.tickFilter !== 'all') count++;
    if (filters.wallFilter !== 'all') count++;
    return count;
  }, [filters]);

  const filteredRoutes = useMemo(() => {
    return routes.filter((r) => {
      if (
        filters.selectedGrades.length > 0 &&
        !filters.selectedGrades.includes(r.french)
      ) {
        return false;
      }
      if (filters.setter !== 'all') {
        const hasSetter = (r.setters || []).includes(filters.setter);
        if (!hasSetter) return false;
      }
      if (filters.year !== 'all') {
        if (String(r.year) !== filters.year) return false;
      }
      if (filters.lengthRange !== 'all') {
        if (filters.lengthRange === 'short' && r.length > 9) return false;
        if (
          filters.lengthRange === 'medium' &&
          (r.length < 10 || r.length > 12)
        )
          return false;
        if (filters.lengthRange === 'long' && r.length < 13) return false;
      }
      if (filters.protectionType !== 'all') {
        if (filters.protectionType === 'sport' && r.isTopRopeOnly) return false;
        if (filters.protectionType === 'toprope' && !r.isTopRopeOnly)
          return false;
      }
      if (filters.minStars > 0) {
        const routeStars = r.defaultStars || 0;
        if (routeStars < filters.minStars) return false;
      }
      if (filters.onlyFavourites) {
        const e = getEntry(r.id);
        if (!e.favourite) return false;
      }
      if (filters.tickFilter !== 'all') {
        const e = getEntry(r.id);
        if (filters.tickFilter === 'completed' && !isCompletedTick(e.status)) {
          return false;
        }
        if (filters.tickFilter === 'unclimbed' && isCompletedTick(e.status)) {
          return false;
        }
        if (
          ['redpoint', 'flash', 'onsight', 'repeat', 'project'].includes(
            filters.tickFilter
          ) &&
          e.status !== filters.tickFilter
        ) {
          return false;
        }
      }
      if (filters.wallFilter !== 'all') {
        if (String(r.wall) !== filters.wallFilter) return false;
      }
      return true;
    });
  }, [routes, filters, getEntry]);

  const filteredRouteIds = useMemo(() => {
    return new Set(filteredRoutes.map((r) => r.id));
  }, [filteredRoutes]);

  const handleSelectGradeTier = (tier) => {
    const band = GRADE_BANDS.find((b) => b.id === tier);
    const tierGrades = band ? band.grades : [];
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
      {/* 1. Top Navigation & Sector Switcher Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {/* 1.A Back to Sectors Button */}
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 text-gray-600 hover:text-gray-900 -ml-2 h-8 px-2 font-semibold"
            >
              <Link to="/sectors" data-testid="back-to-sectors">
                <ChevronLeft className="w-4 h-4" />
                <span>{isGr ? 'Όλα τα Πεδία' : 'All Sectors'}</span>
              </Link>
            </Button>

            {/* 1.B Quick Sector Switcher Dropdown */}
            <div className="relative inline-flex items-center">
              <select
                aria-label={isGr ? 'Επιλογή Πεδίου' : 'Select Sector'}
                value={crag.key}
                onChange={(e) => {
                  const target = getCragByKey(e.target.value);
                  navigate(target.path || `/sector/${target.key}`);
                }}
                className="h-8 pl-2.5 pr-7 py-1 text-xs font-bold text-gray-900 bg-gray-100 hover:bg-gray-200/80 border border-gray-300 rounded-lg shadow-2xs cursor-pointer focus:ring-1 focus:ring-[#1e3a8a] focus:outline-none transition-colors"
              >
                {ALL_SECTORS_LIST.map((s) => (
                  <option key={s.key} value={s.key}>
                    {isGr ? s.nameGr : s.nameEn} ({s.routes.length})
                  </option>
                ))}
              </select>
            </div>

            {/* 1.C Wikiloc Pill — kept only in Layout A */}
            {!isLayoutB && cragInfo.wikilocUrl && (
              <a
                href={cragInfo.wikilocUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-[#1e3a8a] bg-[#1e3a8a]/5 hover:bg-[#1e3a8a]/10 border border-[#1e3a8a]/15 rounded-full px-2.5 py-1 transition-colors"
              >
                <MapPin className="w-3 h-3" />
                <span>
                  {isGr
                    ? `Πρόσβαση ${cragInfo.approachMinutes}′ (Wikiloc)`
                    : `Approach ${cragInfo.approachMinutes}′ (Wikiloc)`}
                </span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {/* Right Header Controls: Lang toggle, Layout switch, User mode, Member logbook button */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Live Side-by-Side Layout Switcher (Layout A vs Layout B) */}
            <div
              className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100/90 p-0.5 shadow-2xs"
              role="group"
              aria-label={isGr ? 'Επιλογή διάταξης' : 'Layout options'}
            >
              <button
                type="button"
                onClick={() => handleSetLayoutVariant('b')}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                  isLayoutB
                    ? 'bg-white text-[#1e3a8a] shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title={
                  isGr
                    ? 'Διάταξη B (Πλήρης προβολή Topo)'
                    : 'Layout B (Full-width topo stack)'
                }
              >
                {isGr ? 'Διάταξη B' : 'Layout B'}
              </button>
              <button
                type="button"
                onClick={() => handleSetLayoutVariant('a')}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                  !isLayoutB
                    ? 'bg-white text-[#1e3a8a] shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title={
                  isGr
                    ? 'Διάταξη A (Split προβολή)'
                    : 'Layout A (Split side-by-side)'
                }
              >
                {isGr ? 'Διάταξη A' : 'Layout A'}
              </button>
            </div>

            {/* Language Toggle */}
            <button
              type="button"
              onClick={onToggleLang}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-gray-900 bg-white border border-gray-200 rounded-full px-2.5 py-1 shadow-2xs transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-[#1e3a8a]" />
              <span>{isGr ? 'EN' : 'ΕΛ'}</span>
            </button>

            {/* User Mode Switcher (Guest / Member / Admin) */}
            <div className="inline-flex items-center rounded-lg border border-gray-200 bg-white p-0.5 text-xs shadow-2xs">
              <button
                type="button"
                onClick={() => setUserMode('guest')}
                className={`px-2 py-1 rounded font-medium transition-colors ${
                  userMode === 'guest'
                    ? 'bg-gray-100 text-gray-900 font-bold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {isGr ? 'Επισκέπτης' : 'Guest'}
              </button>
              <button
                type="button"
                onClick={() => setUserMode('member')}
                className={`px-2 py-1 rounded font-medium transition-colors ${
                  userMode === 'member'
                    ? 'bg-blue-50 text-[#1e3a8a] font-bold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {isGr ? 'Μέλος' : 'Member'}
              </button>
              <button
                type="button"
                onClick={() => setUserMode('admin')}
                className={`px-2 py-1 rounded font-medium transition-colors ${
                  userMode === 'admin'
                    ? 'bg-amber-50 text-amber-900 font-bold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Admin
              </button>
            </div>

            {/* Member/Admin Logbook Action Button */}
            {isMemberOrAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLogbookModalOpen(true)}
                className="h-8 gap-1.5 text-xs font-semibold border-blue-200 text-[#1e3a8a] bg-blue-50/50 hover:bg-blue-100/60 shadow-2xs"
              >
                <Trophy className="w-3.5 h-3.5 text-[#1e3a8a]" />
                <span className="hidden sm:inline">
                  {isGr ? 'Ημερολόγιο' : 'Logbook'}
                </span>
                <Badge className="bg-[#1e3a8a] text-white text-[10px] px-1.5 py-0 h-4">
                  {logbookSummary.completed}
                </Badge>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-4">
        {/* ========================================================================= */}
        {/* LAYOUT B: Stacked Layout */}
        {/* ========================================================================= */}
        {isLayoutB ? (
          <div className="space-y-4">
            {/* Header: Title + Specs Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-stretch">
              {/* Box 1: Sector Title & Area Badges */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-3.5 flex flex-col justify-between">
                <div className="flex flex-wrap items-center gap-1.5 pb-0.5">
                  <Badge
                    variant="outline"
                    className="text-[11px] bg-white border-gray-200 text-gray-800 font-semibold shadow-2xs"
                  >
                    <MapPin className="w-3 h-3 mr-1 text-[#1e3a8a]" />
                    {isGr ? crag.areaGr : crag.areaEn}
                  </Badge>
                  <Badge className="bg-[#1e3a8a]/10 text-[#1e3a8a] hover:bg-[#1e3a8a]/15 border-0 text-[11px] font-bold">
                    {isGr
                      ? `${cragCounts.total} διαδρομές`
                      : `${cragCounts.total} routes`}
                  </Badge>
                  {cragCounts.multiPitch > 0 && (
                    <Badge className="bg-sky-100 text-sky-800 border-sky-300 text-[11px] font-bold">
                      {isGr
                        ? `${cragCounts.multiPitch} πολυσχοινιές`
                        : `${cragCounts.multiPitch} multi-pitch`}
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className="text-[11px] bg-white text-emerald-800 border-emerald-200 font-semibold inline-flex items-center gap-1 shadow-2xs"
                  >
                    <Footprints className="w-3 h-3 text-emerald-600" />
                    <span>
                      {isGr
                        ? `${cragInfo.approachMinutes}′ Πρόσβαση`
                        : `${cragInfo.approachMinutes}′ Approach`}
                    </span>
                  </Badge>
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight pt-1 pb-0.5 sm:py-1">
                  {isGr ? crag.nameGr : crag.nameEn}
                </h1>

                <p className="text-sm sm:text-[15px] text-gray-600 leading-relaxed pt-0.5 pb-1">
                  {isGr ? cragInfo.introGr : cragInfo.introEn}
                </p>
              </div>

              {/* Box 2: 2-Row Compact Quick Specs & Seasonal Shade Box */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-2.5 space-y-2">
                <div className="grid grid-cols-5 divide-x divide-gray-200/80 rounded-lg bg-gray-50/80 border border-gray-200/70 py-1.5 px-0.5">
                  <div className="px-1 flex flex-col items-center justify-center text-center min-w-0">
                    <span className="text-[10px] font-medium text-gray-500 whitespace-nowrap leading-tight">
                      {isGr ? 'Εύρος Βαθμών' : 'Grade Span'}
                    </span>
                    <span className="text-xs font-extrabold text-gray-900 whitespace-nowrap mt-0.5 leading-tight">
                      {cragInfo.gradeSpan}
                    </span>
                  </div>

                  <div className="px-1 flex flex-col items-center justify-center text-center min-w-0">
                    <span className="text-[10px] font-medium text-gray-500 whitespace-nowrap leading-tight">
                      Sport
                    </span>
                    <span className="text-xs font-extrabold text-gray-900 whitespace-nowrap mt-0.5 leading-tight">
                      {cragCounts.sport}
                    </span>
                  </div>

                  <div className="px-1 flex flex-col items-center justify-center text-center min-w-0">
                    <span className="text-[10px] font-medium text-gray-500 whitespace-nowrap leading-tight">
                      Top Rope / Trad
                    </span>
                    <span className="text-xs font-extrabold text-gray-900 whitespace-nowrap mt-0.5 leading-tight">
                      {cragCounts.topRope}
                    </span>
                  </div>

                  <div className="px-1 flex flex-col items-center justify-center text-center min-w-0">
                    <span className="text-[10px] font-medium text-gray-500 whitespace-nowrap leading-tight">
                      {isGr ? 'Ύψος' : 'Height'}
                    </span>
                    <span className="text-xs font-extrabold text-gray-900 whitespace-nowrap mt-0.5 leading-tight">
                      {cragInfo.height}
                    </span>
                  </div>

                  <div className="px-1 flex flex-col items-center justify-center text-center min-w-0">
                    <span className="text-[10px] font-medium text-gray-500 whitespace-nowrap leading-tight">
                      {isGr ? 'Σετάκια' : 'Quickdraws'}
                    </span>
                    <span className="text-xs font-extrabold text-gray-900 whitespace-nowrap mt-0.5 leading-tight">
                      {crag.key === 'trypios' ? '≤ 12+2' : '≤ 7–9'}
                    </span>
                    <span className="text-[9px] font-medium text-gray-500 whitespace-nowrap leading-tight mt-0.5">
                      {crag.key === 'trypios'
                        ? isGr
                          ? '(σχοινί 70m)'
                          : '(70m rope)'
                        : isGr
                        ? '(σχοινί 35–40m)'
                        : '(35–40m rope)'}
                    </span>
                  </div>
                </div>

                {/* Row 2: Sun Status Badge & Modal Drawers */}
                <div className="flex items-center justify-between gap-1.5 flex-wrap pt-0.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border ${sunStatus.badgeClass}`}
                      title={sunStatus.detail}
                    >
                      <Sun className="w-3 h-3 text-amber-600 shrink-0" />
                      <span className="truncate">{sunStatus.label}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1 ml-auto">
                    <button
                      type="button"
                      onClick={() => setApproachDrawerOpen((v) => !v)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200/80 px-2.5 py-1 rounded-md transition-colors"
                    >
                      <Navigation className="w-3 h-3 text-[#1e3a8a]" />
                      <span>{isGr ? 'Πρόσβαση' : 'Approach'}</span>
                      {approachDrawerOpen ? (
                        <ChevronUp className="w-3 h-3 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-gray-500" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setInfoDrawerOpen((v) => !v)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200/80 px-2.5 py-1 rounded-md transition-colors"
                    >
                      <Info className="w-3 h-3 text-[#1e3a8a]" />
                      <span>{isGr ? 'Πληροφορίες' : 'Info'}</span>
                      {infoDrawerOpen ? (
                        <ChevronUp className="w-3 h-3 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-gray-500" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Approach Drawer */}
            {approachDrawerOpen && (
              <Card className="border border-blue-200 bg-blue-50/40 shadow-xs rounded-xl overflow-hidden animate-in fade-in duration-150">
                <CardContent className="p-3.5 sm:p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Compass className="w-4 h-4 text-[#1e3a8a]" />
                      <h3 className="text-sm font-bold text-gray-900">
                        {isGr
                          ? 'Οδηγίες Πρόσβασης & Στάθμευσης'
                          : 'Approach Directions & Parking Beta'}
                      </h3>
                      <span className="text-xs text-gray-500 font-medium">
                        ({isGr ? `${cragInfo.approachMinutes}′ πεζοπορία` : `${cragInfo.approachMinutes}′ walk`})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setApproachDrawerOpen(false)}
                      className="text-gray-400 hover:text-gray-600 p-1"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs sm:text-[13px] text-gray-700 leading-relaxed">
                    {isGr ? cragInfo.approachGr : cragInfo.approachEn}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                    {cragInfo.parkingMapsUrl && (
                      <a
                        href={cragInfo.parkingMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 font-semibold shadow-2xs transition-colors"
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <Car className="w-3.5 h-3.5 text-emerald-600" />
                          {isGr ? 'Χώρος Στάθμευσης (Google Maps)' : 'Parking Location (Google Maps)'}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                      </a>
                    )}

                    {cragInfo.cragMapsUrl && (
                      <a
                        href={cragInfo.cragMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 font-semibold shadow-2xs transition-colors"
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <Mountain className="w-3.5 h-3.5 text-[#1e3a8a]" />
                          {isGr
                            ? `Σημείο Πεδίου — ${crag.nameGr} (Google Maps)`
                            : `Actual Crag Spot — ${crag.nameEn} (Google Maps)`}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                      </a>
                    )}

                    {cragInfo.theCragUrl && (
                      <a
                        href={cragInfo.theCragUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-300 text-emerald-950 font-semibold shadow-2xs transition-colors"
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-emerald-700" />
                          {isGr ? 'Σελίδα Πεδίου στο theCrag.com' : 'Crag Page on theCrag.com'}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                      </a>
                    )}

                    {cragInfo.wikilocUrl && (
                      <a
                        href={cragInfo.wikilocUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-amber-50/60 hover:bg-amber-100/60 border border-dashed border-amber-300 text-amber-900 font-semibold transition-colors"
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <Footprints className="w-3.5 h-3.5 text-amber-700" />
                          {isGr ? 'Ίχνος Πεζοπορίας στο Wikiloc' : 'Hiking Trail Track on Wikiloc'}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Info Drawer */}
            {infoDrawerOpen && (
              <Card className="border border-gray-200 bg-white shadow-xs rounded-xl overflow-hidden animate-in fade-in duration-150">
                <CardContent className="p-3.5 sm:p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-[#1e3a8a]" />
                      <h3 className="text-sm font-bold text-gray-900">
                        {isGr ? `Τεκμηρίωση Πεδίου — ${crag.nameGr}` : `Sector Documentation — ${crag.nameEn}`}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setInfoDrawerOpen(false)}
                      className="text-gray-400 hover:text-gray-600 p-1"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-gray-700">
                    <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200/80 space-y-1">
                      <div className="font-bold text-amber-900 flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span>{isGr ? 'Ασφάλεια & Βράχος' : 'Rock & Safety'}</span>
                      </div>
                      <p className="leading-relaxed">
                        {isGr ? cragInfo.rockAndSafetyGr : cragInfo.rockAndSafetyEn}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-200/80 space-y-1">
                      <div className="font-bold text-[#1e3a8a] flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5 text-[#1e3a8a] shrink-0" />
                        <span>{isGr ? 'Συντήρηση & Υλικά' : 'Rebolting Beta'}</span>
                      </div>
                      <p className="leading-relaxed">
                        {isGr ? cragInfo.reboltingGr : cragInfo.reboltingEn}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200 space-y-1">
                      <div className="font-bold text-gray-900 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-gray-700 shrink-0" />
                        <span>{isGr ? 'Βιβλιογραφία' : 'Guidebooks'}</span>
                      </div>
                      <p className="leading-relaxed text-gray-600">
                        {isGr ? cragInfo.guidebooksGr : cragInfo.guidebooksEn}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Topo Component */}
            <InteractiveTopo
              isGr={isGr}
              userMode={userMode}
              routes={routes}
              filteredRouteIds={filteredRouteIds}
              selectedRoute={selectedRoute}
              onSelectRoute={handleSelectRoute}
              activeWall={activeWall}
              onChangeWall={setActiveWall}
              gradeSystem="french"
              getEntry={getEntry}
              customPaths={customPaths}
              onUpdateRoutePath={updateRoutePath}
              onResetRoutePath={resetRoutePath}
              onToggleFavourite={toggleFavourite}
              onToggleTickStatus={toggleTickStatus}
              isExpandedSize={isExpandedSize}
              onToggleExpandedSize={() => setIsExpandedSize((v) => !v)}
              onResetFilters={handleResetAllFilters}
              walls={walls}
            />

            {/* Grade Chart & Stats Accordion */}
            <GradeChartAndStats
              isGr={isGr}
              userMode={userMode}
              routes={routes}
              gradeSystem="french"
              selectedGrades={filters.selectedGrades}
              onToggleGrade={handleToggleGrade}
              onSelectGradeTier={handleSelectGradeTier}
              onClearGrades={handleClearGrades}
              getEntry={getEntry}
              onOpenLogbookModal={() => setLogbookModalOpen(true)}
              cragInfo={cragInfo}
              sectorKey={crag.key}
            />

            {/* Filter Bar & Route List (Docked Unified Card) */}
            <div className="space-y-0">
              <div ref={stickyHeaderRefB} className="sticky top-0 z-30">
                <RouteFilterBar
                  isGr={isGr}
                  userMode={userMode}
                  filters={filters}
                  onChangeFilters={setFilters}
                  onResetAllFilters={handleResetAllFilters}
                  onSelectGradeTier={handleSelectGradeTier}
                  activeFilterCount={activeFilterCount}
                  totalCount={routes.length}
                  filteredCount={filteredRoutes.length}
                  isDockedWithTable={true}
                  setters={setters}
                  years={years}
                  routes={routes}
                />
              </div>

              <RouteListAndTable
                stickyTopOffset={stickyTopOffsetB}
                isGr={isGr}
                userMode={userMode}
                routes={filteredRoutes}
                selectedRoute={selectedRoute}
                onSelectRoute={handleSelectRoute}
                getEntry={getEntry}
                onToggleFavourite={toggleFavourite}
                onToggleTickStatus={toggleTickStatus}
                onUpdateEntry={updateEntry}
                onFilterBySetter={handleFilterBySetter}
                onFilterByYear={handleFilterByYear}
                isDockedWithFilterBar={true}
                disableRowAccordionOnDesktop={true}
              />
            </div>

            {/* Selected Route Detail Panel */}
            <div className="pt-2">
              <SelectedRouteDetailPanel
                route={selectedRoute}
                isGr={isGr}
                userMode={userMode}
                getEntry={getEntry}
                onClose={() => handleSelectRoute(null)}
                onToggleFavourite={toggleFavourite}
                onToggleTickStatus={toggleTickStatus}
              />
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* LAYOUT A: Side-by-Side Split View */
          /* ========================================================================= */
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">
                    <MapPin className="w-3 h-3 mr-1" />
                    {isGr ? crag.areaGr : crag.areaEn}
                  </Badge>
                  <Badge className="bg-[#1e3a8a]/10 text-[#1e3a8a] text-xs border-transparent font-bold">
                    {cragCounts.total} {isGr ? 'διαδρομές' : 'routes'}
                  </Badge>
                  <span className="hidden sm:inline-flex text-xs text-gray-600 items-center gap-1 font-medium">
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    {sunStatus.label}
                  </span>
                </div>

                <h1 className="text-xl sm:text-3xl font-bold text-gray-900">
                  {isGr ? crag.nameGr : crag.nameEn}
                </h1>
              </div>

              <p className="hidden md:block text-xs text-gray-500 max-w-md text-right">
                {isGr ? cragInfo.reboltingGr : cragInfo.reboltingEn}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Column (Sticky Topo) */}
              <div className="lg:col-span-6 lg:sticky lg:top-3 z-10 space-y-3">
                <InteractiveTopo
                  isGr={isGr}
                  userMode={userMode}
                  routes={routes}
                  filteredRouteIds={filteredRouteIds}
                  selectedRoute={selectedRoute}
                  onSelectRoute={handleSelectRoute}
                  activeWall={activeWall}
                  onChangeWall={setActiveWall}
                  gradeSystem="french"
                  getEntry={getEntry}
                  customPaths={customPaths}
                  onUpdateRoutePath={updateRoutePath}
                  onResetRoutePath={resetRoutePath}
                  onToggleFavourite={toggleFavourite}
                  onToggleTickStatus={toggleTickStatus}
                  isExpandedSize={isExpandedSize}
                  onToggleExpandedSize={() => setIsExpandedSize((v) => !v)}
                  onResetFilters={handleResetAllFilters}
                  walls={walls}
                />

                <GradeChartAndStats
                  isGr={isGr}
                  userMode={userMode}
                  routes={routes}
                  gradeSystem="french"
                  selectedGrades={filters.selectedGrades}
                  onToggleGrade={handleToggleGrade}
                  onSelectGradeTier={handleSelectGradeTier}
                  onClearGrades={handleClearGrades}
                  getEntry={getEntry}
                  onOpenLogbookModal={() => setLogbookModalOpen(true)}
                  cragInfo={cragInfo}
                  sectorKey={crag.key}
                />
              </div>

              {/* Right Column (Filters + Table + Detail Panel) */}
              <div className="lg:col-span-6 space-y-4">
                <div className="space-y-0">
                  <div ref={stickyHeaderRefA} className="sticky top-0 z-30">
                    <RouteFilterBar
                      isGr={isGr}
                      userMode={userMode}
                      filters={filters}
                      onChangeFilters={setFilters}
                      onResetAllFilters={handleResetAllFilters}
                      onSelectGradeTier={handleSelectGradeTier}
                      activeFilterCount={activeFilterCount}
                      totalCount={routes.length}
                      filteredCount={filteredRoutes.length}
                      isDockedWithTable={true}
                      setters={setters}
                      years={years}
                      routes={routes}
                    />
                  </div>

                  <RouteListAndTable
                    stickyTopOffset={stickyTopOffsetA}
                    isGr={isGr}
                    userMode={userMode}
                    routes={filteredRoutes}
                    selectedRoute={selectedRoute}
                    onSelectRoute={handleSelectRoute}
                    getEntry={getEntry}
                    onToggleFavourite={toggleFavourite}
                    onToggleTickStatus={toggleTickStatus}
                    onUpdateEntry={updateEntry}
                    onFilterBySetter={handleFilterBySetter}
                    onFilterByYear={handleFilterByYear}
                    isDockedWithFilterBar={true}
                    disableRowAccordionOnDesktop={true}
                  />
                </div>

                <SelectedRouteDetailPanel
                  route={selectedRoute}
                  isGr={isGr}
                  userMode={userMode}
                  getEntry={getEntry}
                  onClose={() => handleSelectRoute(null)}
                  onToggleFavourite={toggleFavourite}
                  onToggleTickStatus={toggleTickStatus}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Climber Logbook Full Modal */}
      <LogbookModal
        isOpen={logbookModalOpen}
        onClose={() => setLogbookModalOpen(false)}
        isGr={isGr}
        userMode={userMode}
        routes={routes}
        getEntry={getEntry}
        onToggleTickStatus={toggleTickStatus}
        onToggleFavourite={toggleFavourite}
        onUpdateEntry={updateEntry}
        onClearLogbook={clearLogbook}
        onImportLogbook={importLogbookJson}
        logbookSummary={logbookSummary}
      />
    </div>
  );
}
