import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import SectorsSectionPage from './components/SectorsSectionPage';
import SectorDetailPage from './components/SectorDetailPage';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Reset window scroll when navigating between distinct pages/sectors
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    const rafId = requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    });
    return () => cancelAnimationFrame(rafId);
  }, [pathname]);

  return null;
}

export default function App() {
  const [lang, setLang] = useState('gr');
  const isGr = lang === 'gr';

  const toggleLang = () => {
    setLang((l) => (l === 'gr' ? 'en' : 'gr'));
  };

  return (
    <HashRouter>
      <ScrollToTop />
      <Routes>
        <Route
          path="/"
          element={<Navigate to="/sectors" replace />}
        />
        <Route
          path="/sectors"
          element={<SectorsSectionPage isGr={isGr} onToggleLang={toggleLang} />}
        />
        <Route
          path="/kokkini-pista"
          element={<SectorDetailPage isGr={isGr} onToggleLang={toggleLang} sectorKey="kokkini" />}
        />
        <Route
          path="/toichos-maki"
          element={<SectorDetailPage isGr={isGr} onToggleLang={toggleLang} sectorKey="makis" />}
        />
        <Route
          path="/makrys-toichos"
          element={<SectorDetailPage isGr={isGr} onToggleLang={toggleLang} sectorKey="makrys" />}
        />
        <Route
          path="/prasini-pista"
          element={<SectorDetailPage isGr={isGr} onToggleLang={toggleLang} sectorKey="prasini" />}
        />
        <Route
          path="/trypios-vrachos"
          element={<SectorDetailPage isGr={isGr} onToggleLang={toggleLang} sectorKey="trypios" />}
        />
        <Route
          path="/gouva"
          element={<SectorDetailPage isGr={isGr} onToggleLang={toggleLang} sectorKey="gouva" />}
        />
        <Route
          path="/sector/:sectorKey"
          element={<SectorDetailPage isGr={isGr} onToggleLang={toggleLang} />}
        />
        <Route
          path="*"
          element={<Navigate to="/sectors" replace />}
        />
      </Routes>
    </HashRouter>
  );
}
