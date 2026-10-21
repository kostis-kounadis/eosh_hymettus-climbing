import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
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
  Mountain,
} from 'lucide-react';
import { Badge } from './ui/badge';
import {
  KOKKINI_WALLS,
  getGradeBadgeClass,
  getGradeHex,
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
  onResetFilters,
  walls = KOKKINI_WALLS,
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpandedSize =
    controlledExpandedSize !== undefined ? controlledExpandedSize : internalExpanded;

  const effectiveWalls = walls && walls.length > 0 ? walls : KOKKINI_WALLS;

  const handleToggleOpen = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (!next) {
        // Collapsing resets topo selection, zoom/pan, and clears all filters
        onSelectRoute?.(null);
        setZoomLevel(1);
        setPan(clampPan(0, 0, 1));
        onResetFilters?.();
      }
      return next;
    });
  };

  const handleToggleBoxSize = () => {
    const next = !isExpandedSize;
    if (onToggleExpandedSize) {
      onToggleExpandedSize();
    } else {
      setInternalExpanded(next);
    }
    if (next) {
      // In expanded mobile mode (h-[60vh]), the photo expands naturally across width (~800px).
      // At zoom 1x, the user can immediately drag left and right to see all routes.
      // If a route is selected, zoom slightly (1.25x) and center on it.
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
      const targetZoom = isMobile
        ? (selectedRoute ? 1.25 : 1)
        : (selectedRoute ? 1.45 : 1.3);
      setZoomLevel(targetZoom);
      if (selectedRoute) {
        setTimeout(() => centerOnRoute(selectedRoute, targetZoom), 60);
      } else {
        setTimeout(() => {
          const vp = viewportRef.current;
          const layer = layerRef.current;
          if (vp && layer) {
            const vw = vp.clientWidth;
            const vh = vp.clientHeight;
            const layerW = layer.offsetWidth;
            const layerH = layer.offsetHeight;
            const midX = (vw - layerW * targetZoom) / 2;
            const midY = (vh - layerH * targetZoom) / 2;
            setPan(clampPan(midX, midY, targetZoom));
          } else {
            setPan({ x: 0, y: 0 });
          }
        }, 60);
      }
    } else {
      // Reset zoom back to 1
      setZoomLevel(1);
      setTimeout(() => {
        setPan(clampPan(0, 0, 1));
      }, 60);
    }
  };

  // Zoom & Pan state strictly inside the fixed-aspect viewport box
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [draggingPointIdx, setDraggingPointIdx] = useState(null);
  const [copiedPathNotice, setCopiedPathNotice] = useState(false);
  const [customWallImages, setCustomWallImages] = useState({});
  const [isStuck, setIsStuck] = useState(false);

  const stickyRef = useRef(null);
  const viewportRef = useRef(null);
  const layerRef = useRef(null);
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
    () => effectiveWalls.find((w) => w.id === activeWall) || effectiveWalls[0],
    [effectiveWalls, activeWall]
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
    const layer = layerRef.current;
    if (!vp) return { x: 0, y: 0 };
    const vw = vp.clientWidth;
    const vh = vp.clientHeight;
    const layerW = layer?.offsetWidth || vw;
    const layerH = layer?.offsetHeight || vh;
    const scaledW = layerW * scale;
    const scaledH = layerH * scale;

    let minX, maxX;
    if (scaledW <= vw) {
      // Content is narrower than viewport: center it horizontally
      minX = (vw - scaledW) / 2;
      maxX = minX;
    } else {
      // Content is wider than viewport: pan between vw - scaledW and 0
      minX = vw - scaledW;
      maxX = 0;
    }

    let minY, maxY;
    if (scaledH <= vh) {
      // Content is shorter than viewport: center it vertically
      minY = (vh - scaledH) / 2;
      maxY = minY;
    } else {
      minY = vh - scaledH;
      maxY = 0;
    }

    return {
      x: clamp(nextX, minX, maxX),
      y: clamp(nextY, minY, maxY),
    };
  }, []);

  // Check if content is wider or taller than the viewport and can be panned
  const canPanContent = useCallback(
    (scale = zoomRef.current) => {
      const vp = viewportRef.current;
      const layer = layerRef.current;
      if (!vp) return { x: false, y: false, any: false };
      const vw = vp.clientWidth;
      const vh = vp.clientHeight;
      const layerW = layer?.offsetWidth || vw;
      const layerH = layer?.offsetHeight || vh;
      const x = layerW * scale > vw + 1;
      const y = layerH * scale > vh + 1;
      return { x, y, any: x || y };
    },
    []
  );

  // Zoom around a specific focal point (fx, fy) in viewport coordinates
  const applyZoomAtPoint = useCallback(
    (targetScale, fx, fy) => {
      const vp = viewportRef.current;
      const layer = layerRef.current;
      const nextScale = clamp(Number(targetScale.toFixed(3)), MIN_ZOOM, MAX_ZOOM);
      const layerW = layer?.offsetWidth || vp?.clientWidth || 0;
      const layerH = layer?.offsetHeight || vp?.clientHeight || 0;
      const vw = vp?.clientWidth || 0;
      const vh = vp?.clientHeight || 0;

      if (!vp || (nextScale <= 1.001 && layerW <= vw && layerH <= vh)) {
        setZoomLevel(1);
        setPan(clampPan(0, 0, 1));
        return;
      }
      const prevScale = zoomRef.current;
      const prevPan = panRef.current;
      const focalX = fx !== undefined ? fx : vw / 2;
      const focalY = fy !== undefined ? fy : vh / 2;

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
      const layer = layerRef.current;
      if (!vp || !route) return;
      const pts = getPointsForRoute(route);
      if (!pts || !pts.length) return;
      const avgXPct = pts.reduce((acc, p) => acc + p[0], 0) / pts.length;
      const avgYPct = pts.reduce((acc, p) => acc + p[1], 0) / pts.length;
      const vw = vp.clientWidth;
      const vh = vp.clientHeight;
      const layerW = layer?.offsetWidth || vw;
      const layerH = layer?.offsetHeight || vh;
      const contentX = (avgXPct / 100) * layerW;
      const contentY = (avgYPct / 100) * layerH;
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

  // Keep layer centered on viewport resize when zoom is 1
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      if (zoomRef.current <= 1.01) {
        setPan((prev) => clampPan(prev.x, prev.y, 1));
      }
    });
    ro.observe(vp);
    return () => ro.disconnect();
  }, [clampPan]);

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

  // Pointer Down/Move/Up for: (A) Admin Waypoint Dragging OR (B) 1-finger / Mouse Drag Panning when content is pannable
  const handleViewportPointerDown = (e) => {
    pointerMovedDistRef.current = 0;
    if (editMode && isAdmin && draggingPointIdx !== null) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    const { any: canPan } = canPanContent();
    if (canPan) {
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
      setPan((prev) => clampPan(prev.x, prev.y, 1));
      return;
    }
    const vp = viewportRef.current;
    const layer = layerRef.current;
    if (selectedRoute && selectedRoute.wall === activeWall && vp) {
      const pts = getPointsForRoute(selectedRoute);
      if (pts && pts.length) {
        const avgXPct = pts.reduce((acc, p) => acc + p[0], 0) / pts.length;
        const avgYPct = pts.reduce((acc, p) => acc + p[1], 0) / pts.length;
        const vw = vp.clientWidth;
        const vh = vp.clientHeight;
        const layerW = layer?.offsetWidth || vw;
        const layerH = layer?.offsetHeight || vh;
        const desiredX = vw / 2 - (avgXPct / 100) * layerW * nextScale;
        const desiredY = vh / 2 - (avgYPct / 100) * layerH * nextScale;
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
      setPan(clampPan(0, 0, 1));
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

  const activeImageSrc =
    customWallImages[activeWall] || wallConfig.imageClean;

  const formattedZoom = `${Number(zoomLevel.toFixed(1))}×`;

  return (
    <div ref={stickyRef} className={isStuck ? 'is-stuck' : ''}>
      <div className="topo-sticky-inner bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm relative">
        {/* Collapsed Bar: strictly visible when topo is collapsed */}
        {!isOpen && (
          <div className="p-2 sm:p-2.5 flex items-center">
            <button
              type="button"
              onClick={handleToggleOpen}
              className="h-8 px-3.5 inline-flex items-center gap-1.5 font-semibold text-xs bg-white/20 hover:bg-white/30 text-white border border-white/40 backdrop-blur-xs rounded-full transition-colors shadow-sm"
              aria-expanded={false}
            >
              <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{isGr ? 'Πανοραμικό' : 'Topo'}</span>
            </button>
          </div>
        )}

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
              className={`relative mx-auto overflow-hidden transition-[height] duration-300 ${
                isExpandedSize
                  ? 'w-full h-[60vh] sm:h-auto max-w-[1140px] sm:max-h-[calc(100vh-280px)]'
                  : 'w-full max-h-[35vh]'
              } ${
                canPanContent().any
                  ? isPanning
                    ? 'cursor-grabbing'
                    : 'cursor-grab'
                  : ''
              }`}
              style={{
                aspectRatio: isExpandedSize ? undefined : `${W} / ${H}`,
                touchAction:
                  canPanContent().x && canPanContent().y
                    ? 'none'
                    : canPanContent().x
                    ? 'pan-y'
                    : canPanContent().y
                    ? 'pan-x'
                    : editMode && isAdmin
                    ? 'none'
                    : 'auto',
              }}
            >
              {/* Inner Transformed Layer (Scales & Pans strictly inside the fixed box) */}
              <div
                ref={layerRef}
                data-testid="topo-transformed-layer"
                className="relative select-none"
                style={{
                  height: '100%',
                  aspectRatio: `${W} / ${H}`,
                  transformOrigin: '0 0',
                  transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoomLevel})`,
                  transition:
                    isPanning || pinchStateRef.current || draggingPointIdx !== null
                      ? 'none'
                      : 'transform 160ms cubic-bezier(0.22, 1, 0.36, 1)',
                  willChange: 'transform',
                }}
              >
                {activeImageSrc ? (
                  <img
                    src={activeImageSrc}
                    alt={isGr ? wallConfig.titleGr : wallConfig.titleEn}
                    width={W}
                    height={H}
                    fetchpriority="high"
                    className={`w-full h-full block transition-filter duration-200 ${
                      selectedRoute ? 'brightness-[0.80] contrast-[1.05]' : 'brightness-95'
                    }`}
                    draggable={false}
                  />
                ) : (
                  <div
                    style={{ width: `${W}px`, height: `${H}px` }}
                    className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gray-50 border border-gray-200/80 select-none"
                  >
                    <Mountain className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm font-bold text-gray-800">
                      {isGr ? wallConfig.titleGr : wallConfig.titleEn}
                    </span>
                    <span className="text-xs text-gray-500 mt-1 max-w-md">
                      {isGr
                        ? 'Αναμονή σχεδίασης διανυσματικού topo (Argon). Όλες οι διαδρομές και τα αναλυτικά στοιχεία είναι διαθέσιμα στον πίνακα παρακάτω.'
                        : 'Vector topo calibration pending (Argon). Full route beta and table available below.'}
                    </span>
                  </div>
                )}

                {/* Interactive SVG Overlay in true 1:1 image pixel coordinates (W x H) */}
                <svg
                  ref={svgRef}
                  viewBox={`0 0 ${W} ${H}`}
                  preserveAspectRatio="none"
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
                      const gradeHex = getGradeHex(route.french);

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

                          {/* True 1:1 Circular Start Badge at Base of Route (Grade-colored) */}
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
                                  : gradeHex
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

              {/* Top Vignette Gradient for readability over rock photo and sky */}
              <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/60 via-black/20 to-transparent pointer-events-none z-10" />

              {/* 3.A Topo Toolbar (Floating Transparent Overlay directly above photo) */}
              <div className="absolute top-2 left-2 right-2 sm:top-2.5 sm:left-2.5 sm:right-2.5 z-20 flex items-center justify-between gap-1.5 pointer-events-none">
                {/* Element 1: Collapsible button ("Πανοραμικό" in GR / "Topo" in EN) */}
                <button
                  type="button"
                  onClick={handleToggleOpen}
                  className="h-7 px-2.5 inline-flex items-center gap-1 font-semibold text-xs bg-black/45 hover:bg-black/60 text-white border border-white/20 backdrop-blur-md rounded-lg transition-colors shadow-xs pointer-events-auto"
                  aria-expanded={true}
                >
                  <ChevronUp className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{isGr ? 'Πανοραμικό' : 'Topo'}</span>
                </button>

                {/* Element 2: Wall Tabs Switcher (Aligned right on mobile, centered/left on desktop) */}
                {effectiveWalls.length > 1 && (
                  <div className="h-7 inline-flex items-center rounded-lg border border-white/20 bg-black/45 backdrop-blur-md p-0.5 text-xs font-semibold shadow-xs pointer-events-auto ml-auto sm:ml-0">
                    {effectiveWalls.map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => onChangeWall(w.id)}
                        className={`h-6 px-2 sm:px-2.5 rounded-md inline-flex items-center justify-center transition-colors ${
                          activeWall === w.id
                            ? 'bg-white text-[#1e3a8a] font-bold shadow-xs'
                            : 'text-white/90 hover:text-white font-medium'
                        }`}
                      >
                        <span className="sm:hidden">{isGr ? `Τοίχος ${w.id}` : `Wall ${w.id}`}</span>
                        <span className="hidden sm:inline">
                          {isGr ? (w.titleGr || `Τοίχος ${w.id}`) : (w.titleEn || `Wall ${w.id}`)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Right Controls (Desktop Only): Admin edit + Expand/Compact */}
                <div className="hidden sm:flex items-center gap-1.5 pointer-events-auto sm:ml-auto">
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setEditMode((v) => !v)}
                      title={
                        isGr
                          ? 'Επεξεργασία Γραμμών Topo (Admin)'
                          : 'Edit Topo Paths (Admin)'
                      }
                      className={`h-7 px-2.5 inline-flex items-center gap-1 text-xs rounded-lg border transition-colors ${
                        editMode
                          ? 'bg-emerald-400 text-gray-950 font-bold border-emerald-300'
                          : 'bg-black/45 hover:bg-black/60 text-emerald-200 border-white/20 backdrop-blur-md'
                      }`}
                    >
                      <Wrench className="w-3 h-3" />
                      <span>Admin</span>
                    </button>
                  )}

                  {/* Desktop Expand / Compact button */}
                  <button
                    type="button"
                    onClick={handleToggleBoxSize}
                    data-testid="topo-box-size-toggle"
                    title={
                      isExpandedSize
                        ? isGr
                          ? 'Επαναφορά μεγέθους πλαισίου'
                          : 'Compact box size'
                        : isGr
                        ? 'Μεγέθυνση πλαισίου'
                        : 'Expand box size'
                    }
                    className="w-7 h-7 rounded-lg border border-white/20 bg-black/45 hover:bg-black/60 text-white backdrop-blur-md inline-flex items-center justify-center transition-colors shadow-xs"
                  >
                    {isExpandedSize ? (
                      <Minimize2 className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <Maximize2 className="w-3.5 h-3.5 text-white" />
                    )}
                  </button>
                </div>
              </div>

              {/* Mobile-Only Bottom-Right Expand / Compact button */}
              <button
                type="button"
                onClick={handleToggleBoxSize}
                data-testid="topo-box-size-toggle-mobile"
                title={
                  isExpandedSize
                    ? isGr
                      ? 'Επαναφορά μεγέθους πλαισίου'
                      : 'Compact box size'
                    : isGr
                    ? 'Μεγέθυνση πλαισίου'
                    : 'Expand box size'
                }
                className="sm:hidden absolute bottom-2 right-2 z-20 w-7 h-7 rounded-lg border border-white/20 bg-black/55 hover:bg-black/70 text-white backdrop-blur-md inline-flex items-center justify-center transition-colors shadow-md pointer-events-auto"
              >
                {isExpandedSize ? (
                  <Minimize2 className="w-3.5 h-3.5 text-white" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5 text-white" />
                )}
              </button>

              {/* Reset Zoom pill: Bottom-Left on Mobile, Bottom-Right on Desktop */}
              {zoomLevel > 1.05 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setZoomLevel(1);
                    setPan(clampPan(0, 0, 1));
                  }}
                  className="absolute bottom-2 left-2 sm:left-auto sm:right-2 z-20 h-7 px-2 rounded-lg bg-black/75 hover:bg-black text-white text-[11px] font-semibold backdrop-blur-md border border-white/20 shadow-md inline-flex items-center gap-1 pointer-events-auto"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>1× ({formattedZoom})</span>
                </button>
              )}
            </div>

            {/* 
              [DISABLED FEATURE / AI NOTICE]: The compact topo bottom legend bar is intentionally deactivated per user simplification request.
              Preserved here commented out in case re-enabling is requested in the future.
              {false && (
                <div className="px-3 py-1.5 bg-neutral-900 text-gray-300 text-[11px] flex flex-wrap items-center gap-3 border-t border-neutral-800">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#16a34a] inline-block shadow-xs" />
                    <span>{gradeSystem === 'uiaa' ? 'III–VI-' : '3–5c'}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] inline-block shadow-xs" />
                    <span>{gradeSystem === 'uiaa' ? 'VI–VII+' : '6a–6c+'}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#dc2626] inline-block shadow-xs" />
                    <span>{gradeSystem === 'uiaa' ? 'VIII-–IX+' : '7a–7c+'}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#18181b] border border-white/40 inline-block shadow-xs" />
                    <span>{gradeSystem === 'uiaa' ? '≥X-' : '≥8a'}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3.5 h-0.5 bg-yellow-400 inline-block border-b border-dashed border-yellow-300" />
                    <span className="text-yellow-300 font-medium">Top Rope*</span>
                  </span>
                </div>
              )}
            */}
          </div>
        )}
      </div>
    </div>
  );
}

