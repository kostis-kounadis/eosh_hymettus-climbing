import { useState, useEffect, useCallback } from 'react';

const LOGBOOK_STORAGE_KEY = 'hymettus_climbing_logbook_v1';
const CUSTOM_PATHS_STORAGE_KEY = 'hymettus_climbing_custom_paths_v1';

export const TICK_TYPES = [
  {
    id: 'onsight',
    labelGr: 'On-Sight (OS)',
    labelEn: 'On-Sight (OS)',
    short: 'OS',
    color: 'bg-emerald-600 text-white border-emerald-700',
    badgeLight: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    dotColor: '#059669',
  },
  {
    id: 'flash',
    labelGr: 'Flash (FL)',
    labelEn: 'Flash (FL)',
    short: 'FL',
    color: 'bg-amber-500 text-white border-amber-600',
    badgeLight: 'bg-amber-50 text-amber-800 border-amber-300',
    dotColor: '#f59e0b',
  },
  {
    id: 'redpoint',
    labelGr: 'Redpoint (RP)',
    labelEn: 'Redpoint (RP)',
    short: 'RP',
    color: 'bg-rose-600 text-white border-rose-700',
    badgeLight: 'bg-rose-50 text-rose-800 border-rose-300',
    dotColor: '#e11d48',
  },
  {
    id: 'toprope',
    labelGr: 'Top-Rope (TR)',
    labelEn: 'Top-Rope (TR)',
    short: 'TR',
    color: 'bg-sky-600 text-white border-sky-700',
    badgeLight: 'bg-sky-50 text-sky-800 border-sky-300',
    dotColor: '#0284c7',
  },
  {
    id: 'project',
    labelGr: 'Project (Στόχος)',
    labelEn: 'Project (Todo)',
    short: 'PRJ',
    color: 'bg-purple-600 text-white border-purple-700',
    badgeLight: 'bg-purple-50 text-purple-800 border-purple-300',
    dotColor: '#9333ea',
  },
];

export const isCompletedTick = (status) =>
  ['onsight', 'flash', 'redpoint', 'toprope'].includes(status);

export function useClimberLogbook() {
  const [logbook, setLogbook] = useState(() => {
    try {
      const raw = localStorage.getItem(LOGBOOK_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const [customPaths, setCustomPaths] = useState(() => {
    try {
      const raw = localStorage.getItem(CUSTOM_PATHS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(LOGBOOK_STORAGE_KEY, JSON.stringify(logbook));
    } catch {
      // Ignore storage quota errors
    }
  }, [logbook]);

  useEffect(() => {
    try {
      localStorage.setItem(CUSTOM_PATHS_STORAGE_KEY, JSON.stringify(customPaths));
    } catch {
      // Ignore storage quota errors
    }
  }, [customPaths]);

  const getEntry = useCallback(
    (routeId) =>
      logbook[routeId] || {
        status: null,
        favourite: false,
        userStars: null,
        notes: '',
        updatedAt: null,
      },
    [logbook]
  );

  const updateEntry = useCallback((routeId, patch) => {
    setLogbook((prev) => {
      const current = prev[routeId] || {
        status: null,
        favourite: false,
        userStars: null,
        notes: '',
      };
      const updated = {
        ...current,
        ...patch,
        updatedAt: new Date().toISOString(),
      };
      return {
        ...prev,
        [routeId]: updated,
      };
    });
  }, []);

  const toggleTickStatus = useCallback((routeId, status) => {
    setLogbook((prev) => {
      const current = prev[routeId] || {
        status: null,
        favourite: false,
        userStars: null,
        notes: '',
      };
      const nextStatus = current.status === status ? null : status;
      return {
        ...prev,
        [routeId]: {
          ...current,
          status: nextStatus,
          updatedAt: new Date().toISOString(),
        },
      };
    });
  }, []);

  const toggleFavourite = useCallback((routeId) => {
    setLogbook((prev) => {
      const current = prev[routeId] || {
        status: null,
        favourite: false,
        userStars: null,
        notes: '',
      };
      return {
        ...prev,
        [routeId]: {
          ...current,
          favourite: !current.favourite,
          updatedAt: new Date().toISOString(),
        },
      };
    });
  }, []);

  const setStars = useCallback((routeId, stars) => {
    setLogbook((prev) => {
      const current = prev[routeId] || {
        status: null,
        favourite: false,
        userStars: null,
        notes: '',
      };
      const nextStars = current.userStars === stars ? null : stars;
      return {
        ...prev,
        [routeId]: {
          ...current,
          userStars: nextStars,
          updatedAt: new Date().toISOString(),
        },
      };
    });
  }, []);

  const updateRoutePath = useCallback((routeId, newPoints) => {
    setCustomPaths((prev) => ({
      ...prev,
      [routeId]: newPoints,
    }));
  }, []);

  const resetRoutePath = useCallback((routeId) => {
    setCustomPaths((prev) => {
      const next = { ...prev };
      delete next[routeId];
      return next;
    });
  }, []);

  const resetAllPaths = useCallback(() => {
    setCustomPaths({});
  }, []);

  const importLogbookJson = useCallback((jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && typeof parsed === 'object') {
        if (parsed.logbook) {
          setLogbook(parsed.logbook);
        } else {
          setLogbook(parsed);
        }
        if (parsed.customPaths) {
          setCustomPaths(parsed.customPaths);
        }
        return true;
      }
    } catch {
      return false;
    }
    return false;
  }, []);

  const clearLogbook = useCallback(() => {
    setLogbook({});
  }, []);

  return {
    logbook,
    customPaths,
    getEntry,
    updateEntry,
    toggleTickStatus,
    toggleFavourite,
    setStars,
    updateRoutePath,
    resetRoutePath,
    resetAllPaths,
    importLogbookJson,
    clearLogbook,
  };
}
