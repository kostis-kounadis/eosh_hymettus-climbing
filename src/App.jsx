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
          element={<Navigate to="/kokkini-pista" replace />}
        />
        <Route
          path="/sectors"
          element={<SectorsSectionPage isGr={isGr} onToggleLang={toggleLang} />}
        />
        <Route
          path="/kokkini-pista"
          element={<KokkiniPistaPage isGr={isGr} onToggleLang={toggleLang} />}
        />
      </Routes>
    </HashRouter>
  );
}
