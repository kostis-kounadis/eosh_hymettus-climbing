import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Eye,
  Wrench,
  AlertTriangle,
  Heart,
  Check,
  RotateCcw,
  Copy,
  Upload,
  Plus,
  Minus,
  Trash2,
  Maximize2,
  Minimize2,
  X,
} from 'lucide-react';
import { Badge } from './ui/badge';
import {
  KOKKINI_WALLS,
  getGradeBadgeClass,
  getRockfaxHex,
} from '../data/kokkiniPistaRoutes';
import { TICK_TYPES, isCompletedTick } from '../hooks/useClimberLogbook';

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

// Convert array of [xPx, yPx] pixel points into a smooth SVG path string
function pointsToSmoothSvgPath(pts) {
  if (!pts || pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0][0]} ${pts[0][1]}`;
  if (pts.length === 2) {
    return `M ${pts[0][0]} ${pts[0][1]} L ${pts[1][0]} ${pts[1][1]}`;
  }
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i === 0 ? 0 : i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];

    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

export default function InteractiveTopo({
  isGr,
  userMode, // 'guest' | 'member' | 'admin'
  routes,
  filteredRouteIds,
  selectedRoute,
  onSelectRoute,
  activeWall,
  onChangeWall,
  gradeSystem,
  getEntry,
  customPaths,
  onUpdateRoutePath,
  onResetRoutePath,
  onToggleFavourite,
  onToggleTickStatus,
  isExpandedSize: controlledExpandedSize,
  onToggleExpandedSize,
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpandedSize =
    controlledExpandedSize !== undefined ? controlledExpandedSize : internalExpanded;

  const handleToggleBoxSize = () => {
    if (onToggleExpandedSize) {
      onToggleExpandedSize();
    } else {
      setInternalExpanded((v) => !v);
    }
  };

  // Zoom & Pan state strictly inside the fixed-aspect viewport box
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  const [showOriginalPdfPhoto, setShowOriginalPdfPhoto] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [draggingPointIdx, setDraggingPointIdx] = useState(null);
  const [copiedPathNotice, setCopiedPathNotice] = useState(false);
  const [customWallImages, setCustomWallImages] = useState({});
  const [isStuck, setIsStuck] = useState(false);

  const stickyRef = useRef(null);
  const viewportRef = useRef(null);
  const svgRef = useRef(null);
  const fileInputRef = useRef(null);

  // Refs for gesture tracking without stale closures
  const zoomRef = useRef(zoomLevel);
  const panRef = useRef(pan);
  zoomRef.current = zoomLevel;
  panRef.current = pan;

  const dragStartRef = useRef(null);
  const pointerMovedDistRef = useRef(0);
  const pinchStateRef = useRef(null);
  const safariGestureStartScaleRef = useRef(1);

  const isMemberOrAdmin = userMode === 'member' || userMode === 'admin';
  const isAdmin = userMode === 'admin';

  // Turn off editMode automatically if switching out of admin mode
  useEffect(() => {
    if (!isAdmin && editMode) {
      setEditMode(false);
    }
  }, [isAdmin, editMode]);

  const wallConfig = useMemo(
    () => KOKKINI_WALLS.find((w) => w.id === activeWall) || KOKKINI_WALLS[0],
    [activeWall]
  );

  const W = wallConfig.width;
  const H = wallConfig.height;

  const wallRoutes = useMemo(
    () => routes.filter((r) => r.wall === activeWall),
    [routes, activeWall]
  );

  const getPointsForRoute = useCallback(
    (route) => {
      return customPaths[route.id] || route.svgPath;
    },
    [customPaths]
  );

  // Clamp pan offset so the scaled image always covers the viewport box with zero black void
  const clampPan = useCallback((nextX, nextY, scale) => {
    const vp = viewportRef.current;
    if (!vp || scale <= 1.001) return { x: 0, y: 0 };
    const vw = vp.clientWidth;
    const vh = vp.clientHeight;
    const minX = vw * (1 - scale);
    const minY = vh * (1 - scale);
    return {
      x: clamp(nextX, minX, 0),
      y: clamp(nextY, minY, 0),
    };
  }, []);

  // Zoom around a specific focal point (fx, fy) in viewport coordinates
  const applyZoomAtPoint = useCallback(
    (targetScale, fx, fy) => {
      const vp = viewportRef.current;
      const nextScale = clamp(Number(targetScale.toFixed(3)), MIN_ZOOM, MAX_ZOOM);
      if (!vp || nextScale <= 1.001) {
        setZoomLevel(1);
        setPan({ x: 0, y: 0 });
        return;
      }
      const prevScale = zoomRef.current;
      const prevPan = panRef.current;
      const focalX = fx !== undefined ? fx : vp.clientWidth / 2;
      const focalY = fy !== undefined ? fy : vp.clientHeight / 2;

      // Unscaled coordinate under the focal point
      const contentX = (focalX - prevPan.x) / prevScale;
      const contentY = (focalY - prevPan.y) / prevScale;

      const rawX = focalX - contentX * nextScale;
      const rawY = focalY - contentY * nextScale;

      setZoomLevel(nextScale);
      setPan(clampPan(rawX, rawY, nextScale));
    },
    [clampPan]
  );

  // Center pan on a specific route's midpoint at a given scale
  const centerOnRoute = useCallback(
    (route, targetScale = zoomRef.current) => {
      const vp = viewportRef.current;
      if (!vp || !route || targetScale <= 1.001) return;
      const pts = getPointsForRoute(route);
      if (!pts || !pts.length) return;
      const avgXPct = pts.reduce((acc, p) => acc + p[0], 0) / pts.length;
      const avgYPct = pts.reduce((acc, p) => acc + p[1], 0) / pts.length;
      const vw = vp.clientWidth;
      const vh = vp.clientHeight;
      const contentX = (avgXPct / 100) * vw;
      const contentY = (avgYPct / 100) * vh;
      const desiredX = vw / 2 - contentX * targetScale;
      const desiredY = vh / 2 - contentY * targetScale;
      setPan(clampPan(desiredX, desiredY, targetScale));
    },
    [clampPan, getPointsForRoute]
  );

  // Re-clamp pan if box size (isExpandedSize) or wall changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (zoomRef.current > 1) {
        if (selectedRoute && selectedRoute.wall === activeWall) {
          centerOnRoute(selectedRoute, zoomRef.current);
        } else {
          setPan((prev) => clampPan(prev.x, prev.y, zoomRef.current));
        }
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [isExpandedSize, activeWall, selectedRoute, centerOnRoute, clampPan]);

  // Detect stuck state using IntersectionObserver fallback (Modern Web Guidance: state-aware-sticky-headers)
  useEffect(() => {
    const node = stickyRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsStuck(entry.intersectionRatio < 1);
      },
      { threshold: [1], rootMargin: '-1px 0px 0px 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Native non-passive Wheel + Trackpad Pinch/Pan listener on the viewport box
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp || !isOpen) return;

    const onWheel = (e) => {
      const rect = vp.getBoundingClientRect();
      const fx = e.clientX - rect.left;
      const fy = e.clientY - rect.top;
      const currentScale = zoomRef.current;

      // 1. Trackpad pinch-to-zoom (ctrlKey is set by macOS/Windows browsers on trackpad pinch)
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const factor = Math.exp(-e.deltaY * 0.012);
        applyZoomAtPoint(currentScale * factor, fx, fy);
        return;
      }

      // 2. Two-finger trackpad pan when already zoomed in and horizontal delta or Shift key is active
      if (currentScale > 1.01 && (Math.abs(e.deltaX) > 2 || e.shiftKey)) {
        e.preventDefault();
        const dx = e.shiftKey && e.deltaX === 0 ? e.deltaY : e.deltaX;
        const dy = e.shiftKey && e.deltaX === 0 ? 0 : e.deltaY;
        const next = clampPan(
          panRef.current.x - dx,
          panRef.current.y - dy,
          currentScale
        );
        setPan(next);
        return;
      }

      // 3. Mouse wheel or vertical trackpad gesture over the topo zooms in/out around cursor
      e.preventDefault();
      const factor = Math.exp(-e.deltaY * 0.0032);
      applyZoomAtPoint(currentScale * factor, fx, fy);
    };

    // Safari macOS trackpad gesture events fallback
    const onGestureStart = (e) => {
      e.preventDefault();
      safariGestureStartScaleRef.current = zoomRef.current;
    };
    const onGestureChange = (e) => {
      e.preventDefault();
      const rect = vp.getBoundingClientRect();
      const fx = (e.clientX || rect.left + rect.width / 2) - rect.left;
      const fy = (e.clientY || rect.top + rect.height / 2) - rect.top;
      applyZoomAtPoint(safariGestureStartScaleRef.current * e.scale, fx, fy);
    };

    vp.addEventListener('wheel', onWheel, { passive: false });
    vp.addEventListener('gesturestart', onGestureStart, { passive: false });
    vp.addEventListener('gesturechange', onGestureChange, { passive: false });
    return () => {
      vp.removeEventListener('wheel', onWheel);
      vp.removeEventListener('gesturestart', onGestureStart);
      vp.removeEventListener('gesturechange', onGestureChange);
    };
  }, [isOpen, applyZoomAtPoint, clampPan]);

  // Touch Pinch-to-Zoom & 2-Finger Pan on Mobile
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const vp = viewportRef.current;
      if (!vp) return;
      const rect = vp.getBoundingClientRect();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const midX = (t1.clientX + t2.clientX) / 2 - rect.left;
      const midY = (t1.clientY + t2.clientY) / 2 - rect.top;
      pinchStateRef.current = {
        startDist: Math.max(10, dist),
        startScale: zoomRef.current,
        startPan: { ...panRef.current },
        startMidX: midX,
        startMidY: midY,
      };
      pointerMovedDistRef.current = 99; // suppress tap selection after pinch
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && pinchStateRef.current) {
      const vp = viewportRef.current;
      if (!vp) return;
      const rect = vp.getBoundingClientRect();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const midX = (t1.clientX + t2.clientX) / 2 - rect.left;
      const midY = (t1.clientY + t2.clientY) / 2 - rect.top;

      const { startDist, startScale, startPan, startMidX, startMidY } =
        pinchStateRef.current;
      const nextScale = clamp(
        Number((startScale * (dist / startDist)).toFixed(3)),
        MIN_ZOOM,
        MAX_ZOOM
      );

      // Content point that was under startMid at start of pinch
      const contentX = (startMidX - startPan.x) / startScale;
      const contentY = (startMidY - startPan.y) / startScale;

      // Place that content point under current midX, midY
      const rawX = midX - contentX * nextScale;
      const rawY = midY - contentY * nextScale;

      setZoomLevel(nextScale);
      setPan(clampPan(rawX, rawY, nextScale));
    }
  };

  const handleTouchEnd = (e) => {
    if (e.touches.length < 2) {
      pinchStateRef.current = null;
    }
  };

  // Pointer Down/Move/Up for: (A) Admin Waypoint Dragging OR (B) 1-finger / Mouse Drag Panning when zoomed
  const handleViewportPointerDown = (e) => {
    pointerMovedDistRef.current = 0;
    if (editMode && isAdmin && draggingPointIdx !== null) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    if (zoomRef.current > 1.01) {
      dragStartRef.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        startPanX: panRef.current.x,
        startPanY: panRef.current.y,
      };
      setIsPanning(true);
    }
  };

  const handleViewportPointerMove = (e) => {
    // Case A: Admin dragging a route waypoint node
    if (
      editMode &&
      isAdmin &&
      draggingPointIdx !== null &&
      selectedRoute &&
      svgRef.current
    ) {
      const rect = svgRef.current.getBoundingClientRect();
      const xPct = clamp(((e.clientX - rect.left) / rect.width) * 100, 0.5, 99.5);
      const yPct = clamp(((e.clientY - rect.top) / rect.height) * 100, 0.5, 99.5);
      const pts = [...getPointsForRoute(selectedRoute)];
      pts[draggingPointIdx] = [Number(xPct.toFixed(1)), Number(yPct.toFixed(1))];
      onUpdateRoutePath(selectedRoute.id, pts);
      pointerMovedDistRef.current = 99;
      return;
    }

    // Case B: Panning the zoomed photo inside the box
    if (dragStartRef.current && !pinchStateRef.current) {
      const dx = e.clientX - dragStartRef.current.clientX;
      const dy = e.clientY - dragStartRef.current.clientY;
      pointerMovedDistRef.current = Math.hypot(dx, dy);
      if (pointerMovedDistRef.current > 2) {
        const next = clampPan(
          dragStartRef.current.startPanX + dx,
          dragStartRef.current.startPanY + dy,
          zoomRef.current
        );
        setPan(next);
      }
    }
  };

  const handleViewportPointerUp = () => {
    if (draggingPointIdx !== null) {
      setDraggingPointIdx(null);
    }
    if (dragStartRef.current) {
      dragStartRef.current = null;
      setIsPanning(false);
    }
  };

  // Top-right Zoom Toggle button: cycles 1× -> 1.6× -> 2.2× -> 1× (resizing ONLY the photo/topo inside the box)
  const handleCycleZoomButton = () => {
    const cur = zoomRef.current;
    const nextScale = cur < 1.3 ? 1.6 : cur < 2.0 ? 2.2 : 1;
    if (nextScale === 1) {
      setZoomLevel(1);
      setPan({ x: 0, y: 0 });
      return;
    }
    const vp = viewportRef.current;
    if (selectedRoute && selectedRoute.wall === activeWall && vp) {
      const pts = getPointsForRoute(selectedRoute);
      if (pts && pts.length) {
        const avgXPct = pts.reduce((acc, p) => acc + p[0], 0) / pts.length;
        const avgYPct = pts.reduce((acc, p) => acc + p[1], 0) / pts.length;
        const vw = vp.clientWidth;
        const vh = vp.clientHeight;
        const desiredX = vw / 2 - (avgXPct / 100) * vw * nextScale;
        const desiredY = vh / 2 - (avgYPct / 100) * vh * nextScale;
        setZoomLevel(nextScale);
        setPan(clampPan(desiredX, desiredY, nextScale));
        return;
      }
    }
    applyZoomAtPoint(nextScale);
  };

  const handleStepZoom = (delta) => {
    const nextScale = clamp(
      Number((zoomRef.current + delta).toFixed(2)),
      MIN_ZOOM,
      MAX_ZOOM
    );
    applyZoomAtPoint(nextScale);
  };

  const handleDoubleClick = (e) => {
    if (editMode) return;
    const vp = viewportRef.current;
    if (!vp) return;
    const rect = vp.getBoundingClientRect();
    const fx = e.clientX - rect.left;
    const fy = e.clientY - rect.top;
    if (zoomRef.current > 1.2) {
      setZoomLevel(1);
      setPan({ x: 0, y: 0 });
    } else {
      applyZoomAtPoint(2.2, fx, fy);
    }
  };

  const handleAddWaypoint = () => {
    if (!selectedRoute) return;
    const pts = [...getPointsForRoute(selectedRoute)];
    if (pts.length < 2) return;
    const last = pts[pts.length - 1];
    const prev = pts[pts.length - 2];
    const mid = [
      Number(((last[0] + prev[0]) / 2).toFixed(1)),
      Number(((last[1] + prev[1]) / 2).toFixed(1)),
    ];
    pts.splice(pts.length - 1, 0, mid);
    onUpdateRoutePath(selectedRoute.id, pts);
  };

  const handleRemoveWaypoint = () => {
    if (!selectedRoute) return;
    const pts = [...getPointsForRoute(selectedRoute)];
    if (pts.length <= 2) return;
    pts.splice(pts.length - 2, 1);
    onUpdateRoutePath(selectedRoute.id, pts);
  };

  const handleCopyPathJson = () => {
    if (!selectedRoute) return;
    const pts = getPointsForRoute(selectedRoute);
    navigator.clipboard?.writeText(JSON.stringify(pts));
    setCopiedPathNotice(true);
    setTimeout(() => setCopiedPathNotice(false), 2000);
  };

  const handleCustomPhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCustomWallImages((prev) => ({
      ...prev,
      [activeWall]: url,
    }));
  };

  const handleStepRoute = (delta) => {
    if (!routes.length) return;
    const currentIndex = selectedRoute
      ? routes.findIndex((r) => r.id === selectedRoute.id)
      : -1;
    const nextIdx =
      currentIndex === -1
        ? 0
        : (currentIndex + delta + routes.length) % routes.length;
    const nextRoute = routes[nextIdx];
    if (nextRoute) {
      onSelectRoute(nextRoute);
    }
  };

  const activeImageSrc =
    customWallImages[activeWall] ||
    (showOriginalPdfPhoto ? wallConfig.imageOriginal : wallConfig.imageClean);

  const selectedEntry = selectedRoute ? getEntry(selectedRoute.id) : null;
  const formattedZoom = `${Number(zoomLevel.toFixed(1))}×`;

  return (
    <div ref={stickyRef} className={isStuck ? 'is-stuck' : ''}>
      <div className="topo-sticky-inner bg-white/95 backdrop-blur-md border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {/* Compact Top Control Bar */}
        <div className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] text-white flex items-center justify-between gap-1.5 flex-wrap">
          <div className="flex items-center gap-1.5 min-w-0">
            <button
              type="button"
              onClick={() => setIsOpen((v) => !v)}
              className="inline-flex items-center gap-1 font-semibold text-xs bg-white/15 hover:bg-white/25 px-2 py-1 rounded-md transition-colors"
              aria-expanded={isOpen}
            >
              {isOpen ? (
                <ChevronUp className="w-3.5 h-3.5 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" />
              )}
              <span>{isGr ? 'Φωτο-Τοπό' : 'Photo-Topo'}</span>
              {!isOpen && selectedRoute && (
                <span className="ml-0.5 px-1.5 py-0 rounded bg-amber-400 text-gray-950 font-extrabold text-[10px]">
                  #{selectedRoute.topoLabel}
                </span>
              )}
            </button>

            {/* Wall Switcher Pills */}
            <div className="inline-flex rounded-md bg-black/25 p-0.5 text-[11px] sm:text-xs">
              <button
                type="button"
                onClick={() => {
                  onChangeWall(1);
                  if (!isOpen) setIsOpen(true);
                }}
                className={`px-2 py-0.5 rounded font-medium transition-colors ${
                  activeWall === 1
                    ? 'bg-white text-[#1e3a8a] shadow-2xs font-bold'
                    : 'text-white/85 hover:text-white'
                }`}
              >
                {isGr ? 'Τοίχος 1 (#1–12)' : 'Wall 1 (#1–12)'}
              </button>
              <button
                type="button"
                onClick={() => {
                  onChangeWall(2);
                  if (!isOpen) setIsOpen(true);
                }}
                className={`px-2 py-0.5 rounded font-medium transition-colors ${
                  activeWall === 2
                    ? 'bg-white text-[#1e3a8a] shadow-2xs font-bold'
                    : 'text-white/85 hover:text-white'
                }`}
              >
                {isGr ? 'Τοίχος 2 (#13–33)' : 'Wall 2 (#13–33)'}
              </button>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1">
            {/* Prominent Un-highlight ("Show All") button whenever a route is highlighted */}
            {selectedRoute && (
              <button
                type="button"
                onClick={() => onSelectRoute(null)}
                className="inline-flex items-center gap-1 text-[11px] sm:text-xs bg-amber-400 hover:bg-amber-300 text-gray-950 font-bold px-2 py-1 rounded-md shadow-2xs transition-colors"
                title={
                  isGr
                    ? 'Εμφάνιση όλων των διαδρομών (καθαρισμός επιλογής)'
                    : 'Show all routes (un-highlight)'
                }
              >
                <X className="w-3.5 h-3.5" />
                <span>
                  {isGr
                    ? `Όλες (#${selectedRoute.topoLabel})`
                    : `Show All (#${selectedRoute.topoLabel})`}
                </span>
              </button>
            )}

            {isOpen && (
              <>
                {/* Zoom Controls: resizes ONLY the photo/topo inside the fixed box */}
                <div className="inline-flex items-center rounded-md bg-white/15 overflow-hidden">
                  {zoomLevel > 1.05 && (
                    <button
                      type="button"
                      onClick={() => handleStepZoom(-0.4)}
                      title={isGr ? 'Σμίκρυνση' : 'Zoom Out'}
                      className="px-1.5 py-1 hover:bg-white/20 text-white transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleCycleZoomButton}
                    data-testid="topo-zoom-toggle"
                    title={
                      isGr
                        ? 'Μεγέθυνση φωτογραφίας εντός πλαισίου (ή ροδέλα / pinch)'
                        : 'Zoom photo inside box (or mouse wheel / pinch)'
                    }
                    className={`inline-flex items-center gap-1 text-xs px-2 py-1 transition-colors ${
                      zoomLevel > 1.05
                        ? 'bg-sky-400 text-gray-950 font-bold'
                        : 'hover:bg-white/25 text-white'
                    }`}
                  >
                    {zoomLevel > 1.05 ? (
                      <ZoomOut className="w-3.5 h-3.5" />
                    ) : (
                      <ZoomIn className="w-3.5 h-3.5" />
                    )}
                    <span>{formattedZoom}</span>
                  </button>
                  {zoomLevel < MAX_ZOOM && (
                    <button
                      type="button"
                      onClick={() => handleStepZoom(0.4)}
                      title={isGr ? 'Μεγέθυνση +' : 'Zoom In +'}
                      className="px-1.5 py-1 hover:bg-white/20 text-white transition-colors hidden sm:inline-flex"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Box Size Toggle (Μεγάλο / Κανονικό): ONLY control that resizes the outer box */}
                <button
                  type="button"
                  onClick={handleToggleBoxSize}
                  data-testid="topo-box-size-toggle"
                  title={isGr ? 'Μέγεθος Πλαισίου (Μεγάλο / Κανονικό)' : 'Toggle Box Size'}
                  className={`hidden sm:inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors ${
                    isExpandedSize
                      ? 'bg-white text-[#1e3a8a] font-bold shadow-2xs'
                      : 'bg-white/15 hover:bg-white/25 text-white'
                  }`}
                >
                  {isExpandedSize ? (
                    <Minimize2 className="w-3.5 h-3.5" />
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden md:inline">
                    {isExpandedSize
                      ? isGr
                        ? 'Κανονικό'
                        : 'Compact'
                      : isGr
                      ? 'Μεγάλο'
                      : 'Expand'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowOriginalPdfPhoto((v) => !v)}
                  title={
                    isGr
                      ? 'Εναλλαγή Καθαρής Φωτογραφίας / Πρωτότυπου PDF'
                      : 'Toggle Clean Photo vs Original PDF Lines'
                  }
                  className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors ${
                    showOriginalPdfPhoto
                      ? 'bg-amber-300 text-gray-950 font-semibold'
                      : 'bg-white/15 hover:bg-white/25 text-white'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline">
                    {showOriginalPdfPhoto
                      ? isGr
                        ? 'Φωτό PDF'
                        : 'PDF Photo'
                      : isGr
                      ? 'Καθαρή Φωτό'
                      : 'Clean Photo'}
                  </span>
                </button>

                {/* Admin-only Topo Path Editor toggle */}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setEditMode((v) => !v)}
                    title={
                      isGr
                        ? 'Επεξεργασία Γραμμών Topo (Admin)'
                        : 'Edit Topo Paths (Admin)'
                    }
                    className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors ${
                      editMode
                        ? 'bg-emerald-400 text-gray-950 font-bold'
                        : 'bg-emerald-500/30 hover:bg-emerald-500/45 text-emerald-100 border border-emerald-400/40'
                    }`}
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Edit Topo</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Admin Topo Editor Toolbar (Only visible in Admin Mode when Edit Topo is active) */}
        {isOpen && isAdmin && editMode && (
          <div className="px-3 py-1.5 bg-emerald-950 text-emerald-100 text-xs flex flex-wrap items-center justify-between gap-2 border-b border-emerald-800">
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-400 text-gray-950 font-bold">
                Admin · Edit Topo
              </Badge>
              <span>
                {selectedRoute
                  ? isGr
                    ? `Σύρετε τους κόμβους της διαδρομής #${selectedRoute.topoLabel} πάνω στη φωτογραφία.`
                    : `Drag the nodes of route #${selectedRoute.topoLabel} directly on the photo.`
                  : isGr
                  ? 'Επιλέξτε μια διαδρομή για να επεξεργαστείτε τη γραμμή της.'
                  : 'Select a route to edit its line waypoints.'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleCustomPhotoUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-white"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isGr ? 'Δοκιμή Νέας Φωτό' : 'Test New Photo'}</span>
              </button>
              {selectedRoute && (
                <>
                  <button
                    type="button"
                    onClick={handleAddWaypoint}
                    className="inline-flex items-center gap-1 bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-white"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isGr ? '+ Κόμβος' : '+ Node'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveWaypoint}
                    className="inline-flex items-center gap-1 bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-white"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isGr ? '- Κόμβος' : '- Node'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onResetRoutePath(selectedRoute.id)}
                    className="inline-flex items-center gap-1 bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-white"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isGr ? 'Επαναφορά' : 'Reset'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyPathJson}
                    className="inline-flex items-center gap-1 bg-emerald-400 hover:bg-emerald-300 text-gray-950 font-semibold px-2 py-1 rounded"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>
                      {copiedPathNotice
                        ? isGr
                          ? 'Αντιγράφηκε!'
                          : 'Copied!'
                        : isGr
                        ? 'Αντιγραφή JSON'
                        : 'Copy JSON'}
                    </span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Collapsible Photo + 1:1 Native Aspect-Ratio SVG Topo Canvas */}
        {isOpen && (
          <div className="bg-neutral-900 select-none">
            {/* Fixed-size outer viewport box: ONLY resized by isExpandedSize (Μεγάλο), NEVER by zoomLevel */}
            <div
              ref={viewportRef}
              data-testid="topo-viewport-box"
              onPointerDown={handleViewportPointerDown}
              onPointerMove={handleViewportPointerMove}
              onPointerUp={handleViewportPointerUp}
              onPointerCancel={handleViewportPointerUp}
              onPointerLeave={handleViewportPointerUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onDoubleClick={handleDoubleClick}
              className={`relative mx-auto overflow-hidden ${
                isExpandedSize
                  ? 'w-full max-w-[1140px]'
                  : 'w-full sm:max-w-[560px] lg:max-w-full'
              } ${
                zoomLevel > 1.01
                  ? isPanning
                    ? 'cursor-grabbing'
                    : 'cursor-grab'
                  : ''
              }`}
              style={{
                aspectRatio: `${W} / ${H}`,
                touchAction:
                  zoomLevel > 1.01 || (editMode && isAdmin) ? 'none' : 'pan-y',
              }}
            >
              {/* Inner Transformed Layer (Scales & Pans strictly inside the fixed box) */}
              <div
                data-testid="topo-transformed-layer"
                className="w-full h-full relative"
                style={{
                  transformOrigin: '0 0',
                  transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoomLevel})`,
                  transition:
                    isPanning || pinchStateRef.current || draggingPointIdx !== null
                      ? 'none'
                      : 'transform 160ms cubic-bezier(0.22, 1, 0.36, 1)',
                  willChange: 'transform',
                }}
              >
                <img
                  src={activeImageSrc}
                  alt={isGr ? wallConfig.titleGr : wallConfig.titleEn}
                  width={W}
                  height={H}
                  fetchPriority="high"
                  className={`w-full h-full object-contain block transition-filter duration-200 ${
                    selectedRoute ? 'brightness-[0.80] contrast-[1.05]' : 'brightness-95'
                  }`}
                  draggable={false}
                />

                {/* Interactive SVG Overlay in true 1:1 image pixel coordinates (W x H) */}
                <svg
                  ref={svgRef}
                  viewBox={`0 0 ${W} ${H}`}
                  preserveAspectRatio="xMidYMid meet"
                  className="absolute inset-0 w-full h-full"
                  onClick={(e) => {
                    if (pointerMovedDistRef.current > 5) return;
                    if (e.target === svgRef.current && !editMode) {
                      onSelectRoute(null);
                    }
                  }}
                >
                  {/* Render non-selected routes first, then the selected route on top */}
                  {[...wallRoutes]
                    .sort((a, b) => {
                      if (selectedRoute?.id === a.id) return 1;
                      if (selectedRoute?.id === b.id) return -1;
                      return 0;
                    })
                    .map((route) => {
                      const pctPts = getPointsForRoute(route);
                      if (!pctPts || pctPts.length < 2) return null;

                      // Convert percentage coordinates [0..100] to true pixel coordinates [0..W, 0..H]
                      const pxPts = pctPts.map(([x, y]) => [
                        (x / 100) * W,
                        (y / 100) * H,
                      ]);
                      const d = pointsToSmoothSvgPath(pxPts);
                      const isSelected = selectedRoute?.id === route.id;
                      const isInFilter = filteredRouteIds.has(route.id);
                      const entry = getEntry(route.id);
                      const isSent =
                        isMemberOrAdmin && isCompletedTick(entry.status);

                      // Base stroke color: Yellow for Top-rope only, Red for bolted sport
                      const baseColor = route.isTopRopeOnly ? '#facc15' : '#ef4444';
                      const activeColor = route.isTopRopeOnly ? '#fde047' : '#38bdf8';

                      // Dim unselected routes when a route is selected or filtered out
                      const opacity = isSelected
                        ? 1
                        : !isInFilter
                        ? 0.14
                        : selectedRoute
                        ? 0.42
                        : 0.9;

                      const startPt = pxPts[0];
                      const endPt = pxPts[pxPts.length - 1];
                      const badgeRadius = isSelected ? 22 : 16.5;
                      const badgeY = Math.min(H - badgeRadius - 4, startPt[1] + 22);
                      const rockfaxHex = getRockfaxHex(route.french);

                      return (
                        <g
                          key={route.id}
                          style={{ opacity }}
                          className="cursor-pointer transition-opacity duration-150"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (pointerMovedDistRef.current > 5) return;
                            onSelectRoute(isSelected && !editMode ? null : route);
                          }}
                        >
                          {/* Wide transparent hit target for easy tapping */}
                          <path
                            d={d}
                            fill="none"
                            stroke="transparent"
                            strokeWidth="36"
                          />

                          {/* White outer highlight glow when selected */}
                          {isSelected && (
                            <path
                              d={d}
                              fill="none"
                              stroke="#ffffff"
                              strokeWidth="12"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              opacity="0.92"
                            />
                          )}

                          {/* Dark shadow casing for contrast over light limestone */}
                          <path
                            d={d}
                            fill="none"
                            stroke="rgba(0,0,0,0.72)"
                            strokeWidth={isSelected ? '7.5' : '5.2'}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />

                          {/* Main route line */}
                          <path
                            d={d}
                            fill="none"
                            stroke={isSelected ? activeColor : baseColor}
                            strokeWidth={isSelected ? '5.2' : '3.4'}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeDasharray={
                              route.isTopRopeOnly && !isSelected ? '12,7' : undefined
                            }
                          />

                          {/* Top Anchor / Belay Station marker */}
                          <circle
                            cx={endPt[0]}
                            cy={endPt[1]}
                            r={isSelected ? 10 : 7}
                            fill={route.isTopRopeOnly ? '#facc15' : '#ffffff'}
                            stroke={isSelected ? '#0284c7' : '#111827'}
                            strokeWidth="3"
                          />

                          {/* Draggable Waypoint Handles in Admin Edit Mode */}
                          {isAdmin &&
                            editMode &&
                            isSelected &&
                            pxPts.map((pt, idx) => (
                              <circle
                                key={idx}
                                cx={pt[0]}
                                cy={pt[1]}
                                r="14"
                                fill={
                                  idx === 0
                                    ? '#22c55e'
                                    : idx === pxPts.length - 1
                                    ? '#f59e0b'
                                    : '#38bdf8'
                                }
                                stroke="#ffffff"
                                strokeWidth="3.5"
                                className="cursor-move"
                                onPointerDown={(e) => {
                                  e.stopPropagation();
                                  e.target.setPointerCapture?.(e.pointerId);
                                  setDraggingPointIdx(idx);
                                }}
                              />
                            ))}

                          {/* True 1:1 Circular Start Badge at Base of Route (Rockfax-colored) */}
                          <g transform={`translate(${startPt[0]}, ${badgeY})`}>
                            <circle
                              cx="0"
                              cy="0"
                              r={badgeRadius}
                              fill={
                                isSelected
                                  ? '#1e3a8a'
                                  : isSent
                                  ? '#059669'
                                  : rockfaxHex
                              }
                              stroke={
                                isSelected
                                  ? '#38bdf8'
                                  : route.isTopRopeOnly
                                  ? '#facc15'
                                  : '#ffffff'
                              }
                              strokeWidth={isSelected ? '4' : '2.5'}
                            />
                            <text
                              x="0"
                              y="5.5"
                              textAnchor="middle"
                              fill="#ffffff"
                              fontSize={
                                (route.pdfNumber || route.topoLabel).length > 2
                                  ? isSelected
                                    ? '14'
                                    : '11.5'
                                  : isSelected
                                  ? '18'
                                  : '14.5'
                              }
                              fontWeight="800"
                              style={{ pointerEvents: 'none' }}
                            >
                              {route.pdfNumber || route.topoLabel.slice(0, 3)}
                            </text>
                          </g>
                        </g>
                      );
                    })}
                </svg>
              </div>

              {/* Floating Reset Zoom pill inside viewport corner when zoomed in */}
              {zoomLevel > 1.05 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setZoomLevel(1);
                    setPan({ x: 0, y: 0 });
                  }}
                  className="absolute bottom-2 right-2 z-10 px-2 py-1 rounded-md bg-black/75 hover:bg-black text-white text-[11px] font-semibold backdrop-blur-xs border border-white/20 shadow-md inline-flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>1× ({formattedZoom})</span>
                </button>
              )}
            </div>

            {/* Compact Legend Bar */}
            <div className="px-3 py-1 bg-neutral-900 text-gray-300 text-[11px] flex flex-wrap items-center justify-between gap-2 border-t border-neutral-800">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#bc813a] inline-block" />
                  <span>5a–6a+</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#b83a45] inline-block" />
                  <span>6b–7a</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-yellow-400 inline-block border-b border-dashed border-yellow-300" />
                  <span className="text-yellow-300">
                    {isGr ? 'Κίτρινη: Top-rope*' : 'Yellow: Top-rope*'}
                  </span>
                </span>
              </div>
              <span className="text-gray-400 hidden sm:inline">
                {zoomLevel > 1.05
                  ? isGr
                    ? 'Σύρετε για μετακίνηση · Ροδέλα/Pinch για zoom'
                    : 'Drag to pan · Wheel/Pinch to zoom'
                  : selectedRoute
                  ? isGr
                    ? 'Πατήστε στο φόντο ή «Όλες» για επαναφορά'
                    : 'Tap background or "Show All" to un-highlight'
                  : isGr
                  ? 'Ροδέλα/Pinch για zoom · Πατήστε γραμμή για επιλογή'
                  : 'Wheel/Pinch to zoom · Tap line to select'}
              </span>
            </div>

            {/* Selected Route Quick HUD Bar attached to bottom of Topo */}
            {selectedRoute && (
              <div className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 bg-white border-t border-gray-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => handleStepRoute(-1)}
                      className="p-1 rounded hover:bg-gray-100 text-gray-600"
                      title={isGr ? 'Προηγούμενη' : 'Previous'}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStepRoute(1)}
                      className="p-1 rounded hover:bg-gray-100 text-gray-600"
                      title={isGr ? 'Επόμενη' : 'Next'}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <span
                    className="inline-flex items-center justify-center min-w-[26px] h-6 px-1.5 rounded-full text-white font-bold text-xs flex-shrink-0"
                    style={{ backgroundColor: getRockfaxHex(selectedRoute.french) }}
                  >
                    {selectedRoute.pdfNumber || '—'}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-xs sm:text-sm text-gray-900 truncate">
                        {selectedRoute.nameGr !== '-'
                          ? isGr
                            ? selectedRoute.nameGr
                            : selectedRoute.nameEn
                          : isGr
                          ? `Διαδρομή #${selectedRoute.pdfNumber}`
                          : `Route #${selectedRoute.pdfNumber}`}
                      </span>
                      <Badge
                        className={`${getGradeBadgeClass(
                          selectedRoute.french
                        )} text-[11px] px-1.5 py-0 font-bold`}
                      >
                        {gradeSystem === 'uiaa'
                          ? `${selectedRoute.uiaa} (${selectedRoute.french})`
                          : `${selectedRoute.french} (${selectedRoute.uiaa})`}
                      </Badge>
                      <span className="text-xs text-gray-600 font-medium">
                        {selectedRoute.length}m ·{' '}
                        {selectedRoute.isTopRopeOnly ? (
                          <span className="text-amber-700 font-semibold inline-flex items-center gap-0.5">
                            <AlertTriangle className="w-3 h-3" /> Top rope*
                          </span>
                        ) : (
                          `${selectedRoute.bolts} ${isGr ? 'ασφ.' : 'bolts'}`
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right side of HUD: Member Fav/Tick buttons + Un-highlight X button */}
                <div className="flex items-center gap-1">
                  {isMemberOrAdmin && (
                    <>
                      <button
                        type="button"
                        onClick={() => onToggleFavourite(selectedRoute.id)}
                        className={`p-1 rounded border transition-colors ${
                          selectedEntry?.favourite
                            ? 'bg-rose-50 border-rose-200 text-rose-600'
                            : 'bg-white border-gray-200 text-gray-400 hover:text-rose-500'
                        }`}
                        title={isGr ? 'Αγαπημένη' : 'Favourite'}
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${
                            selectedEntry?.favourite
                              ? 'fill-rose-500 text-rose-500'
                              : ''
                          }`}
                        />
                      </button>
                      {TICK_TYPES.slice(0, 3).map((t) => {
                        const active = selectedEntry?.status === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() =>
                              onToggleTickStatus(selectedRoute.id, t.id)
                            }
                            className={`px-1.5 py-0.5 rounded text-[11px] font-bold border transition-colors ${
                              active
                                ? t.color
                                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                            }`}
                            title={isGr ? t.labelGr : t.labelEn}
                          >
                            {active && <Check className="w-2.5 h-2.5 inline mr-0.5" />}
                            {t.short}
                          </button>
                        );
                      })}
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => onSelectRoute(null)}
                    className="ml-1 px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold inline-flex items-center gap-0.5"
                    title={isGr ? 'Εμφάνιση όλων' : 'Show all'}
                  >
                    <X className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">
                      {isGr ? 'Όλες' : 'All'}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

