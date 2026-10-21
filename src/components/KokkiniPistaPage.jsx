import React from 'react';
import SectorDetailPage from './SectorDetailPage';

export default function KokkiniPistaPage({ isGr, onToggleLang }) {
  return (
    <SectorDetailPage
      sectorKey="kokkini"
      isGr={isGr}
      onToggleLang={onToggleLang}
    />
  );
}
