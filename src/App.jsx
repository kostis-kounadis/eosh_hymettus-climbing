import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import SectorsSectionPage from './components/SectorsSectionPage';
import SectorDetailPage from './components/SectorDetailPage';

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
          element={
            <SectorDetailPage
              sectorKey="kokkini"
              isGr={isGr}
              onToggleLang={toggleLang}
            />
          }
        />
        <Route
          path="/toichos-maki"
          element={
            <SectorDetailPage
              sectorKey="makis"
              isGr={isGr}
              onToggleLang={toggleLang}
            />
          }
        />
        <Route
          path="/makrys-toichos"
          element={
            <SectorDetailPage
              sectorKey="makrys"
              isGr={isGr}
              onToggleLang={toggleLang}
            />
          }
        />
        <Route
          path="/prasini-pista"
          element={
            <SectorDetailPage
              sectorKey="prasini"
              isGr={isGr}
              onToggleLang={toggleLang}
            />
          }
        />
        <Route
          path="/trypios-vrachos"
          element={
            <SectorDetailPage
              sectorKey="trypios"
              isGr={isGr}
              onToggleLang={toggleLang}
            />
          }
        />
        <Route
          path="/gouva"
          element={
            <SectorDetailPage
              sectorKey="gouva"
              isGr={isGr}
              onToggleLang={toggleLang}
            />
          }
        />
        <Route
          path="/sector/:sectorKey"
          element={
            <SectorDetailPage isGr={isGr} onToggleLang={toggleLang} />
          }
        />
        <Route
          path="*"
          element={<Navigate to="/sectors" replace />}
        />
      </Routes>
    </HashRouter>
  );
}
