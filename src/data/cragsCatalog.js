import {
  KOKKINI_PISTA_ROUTES,
  CRAG_INFO_2018 as CRAG_INFO_KOKKINI,
  KOKKINI_WALLS,
  ALL_SETTERS as KOKKINI_SETTERS,
  ALL_YEARS as KOKKINI_YEARS,
} from './kokkiniPistaRoutes';
import {
  TOICHOS_MAKI_ROUTES,
  CRAG_INFO_MAKIS,
  MAKIS_WALLS,
  MAKIS_SETTERS,
  MAKIS_YEARS,
} from './toichosMakiRoutes';
import {
  MAKRYS_TOICHOS_ROUTES,
  CRAG_INFO_MAKRYS,
  MAKRYS_WALLS,
  MAKRYS_SETTERS,
  MAKRYS_YEARS,
} from './makrysToichosRoutes';
import {
  PRASINI_PISTA_ROUTES,
  CRAG_INFO_PRASINI,
  PRASINI_WALLS,
  PRASINI_SETTERS,
  PRASINI_YEARS,
} from './prasiniPistaRoutes';
import {
  TRYPIOS_VRACHOS_ROUTES,
  CRAG_INFO_TRYPIOS,
  TRYPIOS_WALLS,
  TRYPIOS_SETTERS,
  TRYPIOS_YEARS,
} from './trypiosVrachosRoutes';
import {
  GOUVA_ROUTES,
  CRAG_INFO_GOUVA,
  GOUVA_WALLS,
  GOUVA_SETTERS,
  GOUVA_YEARS,
} from './gouvaRoutes';

export const CRAGS_REGISTRY = {
  kokkini: {
    key: 'kokkini',
    path: '/kokkini-pista',
    nameGr: 'Κόκκινη Πίστα',
    nameEn: 'Red Crag (Kokkini Pista)',
    areaGr: 'Ηλιούπολη',
    areaEn: 'Ilioupoli',
    routes: KOKKINI_PISTA_ROUTES,
    cragInfo: CRAG_INFO_KOKKINI,
    walls: KOKKINI_WALLS,
    setters: KOKKINI_SETTERS,
    years: KOKKINI_YEARS,
  },
  makis: {
    key: 'makis',
    path: '/toichos-maki',
    nameGr: 'Τοίχος του Μάκη',
    nameEn: "Makis' Wall (Toichos tou Maki)",
    areaGr: 'Καρέας',
    areaEn: 'Kareas',
    routes: TOICHOS_MAKI_ROUTES,
    cragInfo: CRAG_INFO_MAKIS,
    walls: MAKIS_WALLS,
    setters: MAKIS_SETTERS,
    years: MAKIS_YEARS,
  },
  makrys: {
    key: 'makrys',
    path: '/makrys-toichos',
    nameGr: 'Μακρύς Τοίχος',
    nameEn: 'Long Wall (Makrys Toichos)',
    areaGr: 'Καρέας',
    areaEn: 'Kareas',
    routes: MAKRYS_TOICHOS_ROUTES,
    cragInfo: CRAG_INFO_MAKRYS,
    walls: MAKRYS_WALLS,
    setters: MAKRYS_SETTERS,
    years: MAKRYS_YEARS,
  },
  prasini: {
    key: 'prasini',
    path: '/prasini-pista',
    nameGr: 'Πράσινη Πίστα',
    nameEn: 'Green Crag (Prasini Pista)',
    areaGr: 'Ηλιούπολη',
    areaEn: 'Ilioupoli',
    routes: PRASINI_PISTA_ROUTES,
    cragInfo: CRAG_INFO_PRASINI,
    walls: PRASINI_WALLS,
    setters: PRASINI_SETTERS,
    years: PRASINI_YEARS,
  },
  trypios: {
    key: 'trypios',
    path: '/trypios-vrachos',
    nameGr: 'Τρύπιος Βράχος',
    nameEn: 'Perforated Rock (Trypios Vrachos)',
    areaGr: 'Ηλιούπολη',
    areaEn: 'Ilioupoli',
    routes: TRYPIOS_VRACHOS_ROUTES,
    cragInfo: CRAG_INFO_TRYPIOS,
    walls: TRYPIOS_WALLS,
    setters: TRYPIOS_SETTERS,
    years: TRYPIOS_YEARS,
  },
  gouva: {
    key: 'gouva',
    path: '/gouva',
    nameGr: 'Γούβα',
    nameEn: 'Gouva (Pit)',
    areaGr: 'Ηλιούπολη',
    areaEn: 'Ilioupoli',
    routes: GOUVA_ROUTES,
    cragInfo: CRAG_INFO_GOUVA,
    walls: GOUVA_WALLS,
    setters: GOUVA_SETTERS,
    years: GOUVA_YEARS,
  },
};

export const ALL_SECTORS_LIST = [
  CRAGS_REGISTRY.kokkini,
  CRAGS_REGISTRY.makis,
  CRAGS_REGISTRY.makrys,
  CRAGS_REGISTRY.prasini,
  CRAGS_REGISTRY.trypios,
  CRAGS_REGISTRY.gouva,
];

export function getCragByKey(key) {
  if (!key) return CRAGS_REGISTRY.kokkini;
  const clean = key.toLowerCase().trim();
  if (CRAGS_REGISTRY[clean]) return CRAGS_REGISTRY[clean];

  // Fuzzy fallback by path / name
  if (clean.includes('maki')) return CRAGS_REGISTRY.makis;
  if (clean.includes('makry')) return CRAGS_REGISTRY.makrys;
  if (clean.includes('prasin')) return CRAGS_REGISTRY.prasini;
  if (clean.includes('trypi')) return CRAGS_REGISTRY.trypios;
  if (clean.includes('gouv')) return CRAGS_REGISTRY.gouva;
  return CRAGS_REGISTRY.kokkini;
}

export function getAllCragsSummary() {
  const summary = {};
  for (const [k, c] of Object.entries(CRAGS_REGISTRY)) {
    const total = c.routes.length;
    const topRope = c.routes.filter((r) => r.isTopRopeOnly).length;
    const sport = total - topRope;
    const multiPitch = c.routes.filter((r) => r.isMultiPitch).length;
    summary[k] = { total, sport, topRope, multiPitch };
  }
  return summary;
}
