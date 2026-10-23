import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import SectorsSectionPage from './components/SectorsSectionPage';
import KokkiniPistaPage from './components/KokkiniPistaPage';

export default function App() {
  const [lang, setLang] = useState('gr');
  const isGr = lang === 'gr';

  const toggleLang = () => {
    setLang((l) => (l === 'gr' ? 'en' : 'gr'));
  };

  return (
    <HashRouter>
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
          element={<KokkiniPistaPage isGr={isGr} onToggleLang={toggleLang} sectorKey="kokkini" />}
        />
        <Route
          path="/toichos-maki"
          element={<KokkiniPistaPage isGr={isGr} onToggleLang={toggleLang} sectorKey="makis" />}
        />
        <Route
          path="/makrys-toichos"
          element={<KokkiniPistaPage isGr={isGr} onToggleLang={toggleLang} sectorKey="makrys" />}
        />
        <Route
          path="/prasini-pista"
          element={<KokkiniPistaPage isGr={isGr} onToggleLang={toggleLang} sectorKey="prasini" />}
        />
        <Route
          path="/trypios-vrachos"
          element={<KokkiniPistaPage isGr={isGr} onToggleLang={toggleLang} sectorKey="trypios" />}
        />
        <Route
          path="/gouva"
          element={<KokkiniPistaPage isGr={isGr} onToggleLang={toggleLang} sectorKey="gouva" />}
        />
        <Route
          path="/sector/:sectorKey"
          element={<KokkiniPistaPage isGr={isGr} onToggleLang={toggleLang} />}
        />
        <Route
          path="*"
          element={<Navigate to="/sectors" replace />}
        />
      </Routes>
    </HashRouter>
  );
}
