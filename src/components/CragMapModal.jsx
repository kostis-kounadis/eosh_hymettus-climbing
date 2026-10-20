import React, { useEffect, useRef } from 'react';
import {
  X,
  Car,
  Footprints,
  Navigation,
  ExternalLink,
  MapPin,
  Info,
} from 'lucide-react';
import HymettusMapCanvas from './HymettusMapCanvas';
import {
  PARKING_TRAILHEADS,
  getGoogleMapsDirectionsUrl,
  getGoogleMapsPinUrl,
} from '../data/sectorsData';

export default function CragMapModal({
  isOpen,
  onClose,
  isGr,
  initialSectorKey = 'kokkini',
}) {
  const dialogRef = useRef(null);

  // Sync open/close with native <dialog>.showModal()
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  // Modern Web Guidance: light-dismiss-a-dialog fallback for browsers without native closedby="any"
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCloseEvent = () => {
      onClose?.();
    };
    dialog.addEventListener('close', handleCloseEvent);

    const handleBackdropClick = (e) => {
      if (!('closedBy' in HTMLDialogElement.prototype)) {
        const rect = dialog.getBoundingClientRect();
        const isInDialog =
          rect.top <= e.clientY &&
          e.clientY <= rect.top + rect.height &&
          rect.left <= e.clientX &&
          e.clientX <= rect.left + rect.width;
        if (!isInDialog) {
          dialog.close();
        }
      }
    };
    dialog.addEventListener('click', handleBackdropClick);

    return () => {
      dialog.removeEventListener('close', handleCloseEvent);
      dialog.removeEventListener('click', handleBackdropClick);
    };
  }, [onClose]);

  const ilioupoliParking = PARKING_TRAILHEADS.ilioupoli;
  const kokkiniLat = 37.932795;
  const kokkiniLng = 23.773192;

  return (
    <dialog
      ref={dialogRef}
      closedby="any"
      aria-labelledby="crag-map-modal-title"
      data-testid="crag-map-modal"
      className="w-[calc(100vw-1.25rem)] max-w-4xl rounded-2xl bg-white p-0 shadow-2xl border border-gray-200 text-left m-auto open:flex open:flex-col max-h-[92vh]"
    >
      {/* Modal Header */}
      <div className="px-4 sm:px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#1e3a8a] flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <h2
              id="crag-map-modal-title"
              className="text-sm sm:text-base font-bold text-white leading-tight"
            >
              {isGr
                ? 'Χάρτης & Οδηγίες Πρόσβασης — Κόκκινη Πίστα (Ηλιούπολη)'
                : 'Map & Approach Directions — Red Crag (Kokkini Pista)'}
            </h2>
            <p className="text-[11px] text-slate-300">
              {isGr
                ? '10′ πεζοπορία από το τέρμα της Λεωφ. Σοφοκλή Βενιζέλου (Πυροφυλάκιο Ηλιούπολης)'
                : '10′ walk from the top of Sofokli Venizelou Ave. (Ilioupoli Fire Lookout)'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          data-testid="close-crag-map-modal"
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label={isGr ? 'Κλείσιμο' : 'Close'}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Modal Scrollable Body */}
      <div className="p-3.5 sm:p-5 overflow-y-auto space-y-4">
        {/* Top 1-Tap Google Maps Quick Action Cards */}
        <div className="grid sm:grid-cols-2 gap-3">
          {/* Step 1: Drive to Parking Gate */}
          <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 flex flex-col justify-between gap-2.5">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wide text-[#1e3a8a]">
                  <Car className="w-3.5 h-3.5" />
                  {isGr ? 'Βήμα 1 · Οδήγηση & Στάθμευση' : 'Step 1 · Drive & Park'}
                </span>
                <span className="font-mono text-[10px] text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded">
                  37.9297, 23.7717
                </span>
              </div>
              <h3 className="text-sm font-bold text-gray-900">
                {isGr
                  ? 'Τέρμα Λ. Σοφοκλή Βενιζέλου (Μεταλλική Μπάρα)'
                  : 'End of Sofokli Venizelou Ave. (Metal Gate)'}
              </h3>
              <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                {isGr
                  ? 'Πατήστε παρακάτω για να ανοίξει το Google Maps με προορισμό ακριβώς το σημείο στάθμευσης πριν την μπάρα του Πυροφυλακίου.'
                  : 'Tap below to open Google Maps Directions directly to the parking spot in front of the fire lookout gate.'}
              </p>
            </div>

            <a
              href={getGoogleMapsDirectionsUrl(
                ilioupoliParking.lat,
                ilioupoliParking.lng,
                'driving'
              )}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="modal-gmaps-driving-btn"
              className="inline-flex items-center justify-center gap-2 w-full px-3.5 py-2.5 rounded-lg text-xs font-bold bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 text-white shadow-xs transition-colors"
            >
              <Car className="w-4 h-4 shrink-0" />
              <span>
                {isGr
                  ? 'Άνοιγμα στο Google Maps → Οδηγίες Πάρκινγκ'
                  : 'Open in Google Maps → Parking Directions'}
              </span>
              <ExternalLink className="w-3.5 h-3.5 opacity-85" />
            </a>
          </div>

          {/* Step 2: 10' Footpath to Crag Pin */}
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-col justify-between gap-2.5">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wide text-emerald-800">
                  <Footprints className="w-3.5 h-3.5" />
                  {isGr ? 'Βήμα 2 · Μονοπάτι 10′ προς Βράχο' : 'Step 2 · 10′ Footpath to Crag'}
                </span>
                <span className="font-mono text-[10px] text-emerald-900 bg-emerald-100 px-1.5 py-0.5 rounded">
                  37.9328, 23.7732
                </span>
              </div>
              <h3 className="text-sm font-bold text-gray-900">
                {isGr
                  ? 'Στίγμα Κόκκινης Πίστας (Google Maps & Wikiloc)'
                  : 'Kokkini Pista Exact Crag Pin (Google Maps & Wikiloc)'}
              </h3>
              <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                {isGr
                  ? '150μ χωματόδρομος μετά την μπάρα → ευθεία στο σηματοδοτημένο μονοπάτι του ρέματος (10′). Η Κόκκινη Πίστα φαίνεται δεξιά σας.'
                  : '150m up the dirt road past the gate → straight into the marked gully footpath (10′). Kokkini Pista appears on your right.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={getGoogleMapsDirectionsUrl(kokkiniLat, kokkiniLng, 'walking')}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="modal-gmaps-walking-btn"
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors"
              >
                <Navigation className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {isGr ? 'Στίγμα στο Google Maps' : 'Crag Pin on Google Maps'}
                </span>
                <ExternalLink className="w-3 h-3 opacity-85" />
              </a>

              <a
                href={ilioupoliParking.wikilocUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1 px-3 py-2.5 rounded-lg text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 transition-colors"
              >
                <Footprints className="w-3.5 h-3.5 text-amber-800" />
                <span>Wikiloc</span>
                <ExternalLink className="w-3 h-3 opacity-75" />
              </a>
            </div>
          </div>
        </div>

        {/* Interactive Map Canvas (Satellite / Trails / Keyless Google Maps Embed) */}
        {isOpen && (
          <HymettusMapCanvas
            isGr={isGr}
            initialSectorKey={initialSectorKey}
            initialAreaFilter="Ilioupoli"
            compactHeight
          />
        )}

        {/* EOSH 2018 Guide Approach Notes Footer */}
        <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-600 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-[#1e3a8a] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-gray-800">
              {isGr
                ? 'Οδηγίες από το Ενημερωτικό Φυλλάδιο ΕΟΣ Ηλιούπολης (2018):'
                : 'Directions from the EOSH Introductory Guide (2018):'}
            </span>{' '}
            <span>
              {isGr
                ? 'Η Πράσινη Πίστα βρίσκεται ακριβώς απέναντι (αριστερά του ρέματος), ενώ συνεχίζοντας το μονοπάτι αριστερά της Κόκκινης Πίστας για άλλα 10′ (με σύντομο πέρασμα σταθερού σχοινιού) φτάνετε στον Τρύπιο Βράχο.'
                : 'Prasini Pista sits directly opposite (left of the gully), while continuing up the trail left of Kokkini Pista for another 10′ (via a short fixed-rope scramble) leads to Trypios Vrachos.'}
            </span>
          </div>
        </div>
      </div>
    </dialog>
  );
}
