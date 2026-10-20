import React, { useState } from 'react';
import { X, Download, Upload, Trash2, Check, Copy } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { TICK_TYPES, isCompletedTick } from '../hooks/useClimberLogbook';

export default function LogbookModal({
  isOpen,
  onClose,
  isGr,
  routes,
  logbook,
  customPaths,
  getEntry,
  onImportJson,
  onClearLogbook,
}) {
  const [importText, setImportText] = useState('');
  const [importStatus, setImportStatus] = useState(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  if (!isOpen) return null;

  const tickedRoutes = routes.filter((r) => {
    const e = getEntry(r.id);
    return e.status || e.favourite || e.notes;
  });

  const handleDownloadJson = () => {
    const payload = JSON.stringify(
      {
        sector: 'kokkini-pista',
        exportedAt: new Date().toISOString(),
        logbook,
        customPaths,
      },
      null,
      2
    );
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kokkini-pista-logbook-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyTextSummary = () => {
    const sent = routes.filter((r) => isCompletedTick(getEntry(r.id).status));
    const lines = sent.map((r) => {
      const e = getEntry(r.id);
      const t = TICK_TYPES.find((x) => x.id === e.status);
      const label = r.nameGr !== '-' ? r.nameGr : `#${r.pdfNumber}`;
      return `• ${label} (${r.uiaa} / ${r.french}, ${r.length}m) — ${t?.short || ''}${
        e.notes ? ` [${e.notes}]` : ''
      }`;
    });
    const text = `Κόκκινη Πίστα (Υμηττός) — ${sent.length}/${routes.length} διαδρομές:\n${
      lines.join('\n') || '-'
    }`;
    navigator.clipboard?.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const handleImport = () => {
    const ok = onImportJson(importText);
    setImportStatus(ok ? 'success' : 'error');
    if (ok) {
      setImportText('');
      setTimeout(() => setImportStatus(null), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-white border border-gray-200 shadow-xl max-h-[85vh] flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {isGr ? 'Ημερολόγιο Αναβάσεων (Logbook)' : 'Personal Climbing Logbook'}
            </h3>
            <p className="text-xs text-gray-500">
              {isGr
                ? 'Αποθηκεύεται τοπικά στη συσκευή σας (localStorage).'
                : 'Stored locally on your device (localStorage).'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <CardContent className="p-4 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* Export / Share Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={handleDownloadJson}>
              <Download className="w-3.5 h-3.5 mr-1.5" />
              {isGr ? 'Λήψη Backup (JSON)' : 'Download Backup (JSON)'}
            </Button>
            <Button size="sm" variant="outline" onClick={handleCopyTextSummary}>
              {copiedSummary ? (
                <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5 mr-1.5" />
              )}
              {copiedSummary
                ? isGr
                  ? 'Αντιγράφηκε!'
                  : 'Copied!'
                : isGr
                ? 'Αντιγραφή Λίστας Κειμένου'
                : 'Copy Text Summary'}
            </Button>
            {tickedRoutes.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={onClearLogbook}
                className="text-rose-600 border-rose-200 hover:bg-rose-50 ml-auto"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                {isGr ? 'Μηδενισμός' : 'Clear'}
              </Button>
            )}
          </div>

          {/* Logged Routes List */}
          <div>
            <h4 className="font-bold text-gray-800 mb-2">
              {isGr
                ? `Καταγεγραμμένες Διαδρομές (${tickedRoutes.length})`
                : `Logged Routes (${tickedRoutes.length})`}
            </h4>
            {tickedRoutes.length === 0 ? (
              <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100">
                {isGr
                  ? 'Δεν έχετε σημειώσει ακόμα κάποια διαδρομή. Πατήστε OS, FL, RP ή ❤️ σε οποιαδήποτε διαδρομή!'
                  : 'No routes logged yet. Tap OS, FL, RP or ❤️ on any route in the list!'}
              </p>
            ) : (
              <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                {tickedRoutes.map((r) => {
                  const e = getEntry(r.id);
                  const t = TICK_TYPES.find((x) => x.id === e.status);
                  return (
                    <div
                      key={r.id}
                      className="p-2.5 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <span className="font-bold text-gray-900">
                          {r.pdfNumber ? `#${r.pdfNumber}` : ''}{' '}
                          {r.nameGr !== '-' ? r.nameGr : ''}
                        </span>{' '}
                        <span className="text-gray-500">
                          ({r.uiaa} / {r.french})
                        </span>
                        {e.notes && (
                          <p className="text-gray-500 truncate mt-0.5">{e.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {e.favourite && <span className="text-rose-500">❤️</span>}
                        {t && <Badge className={t.color}>{t.short}</Badge>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Import JSON */}
          <div className="pt-2 border-t border-gray-100">
            <label className="block font-bold text-gray-800 mb-1 text-xs">
              {isGr ? 'Εισαγωγή από JSON Backup' : 'Restore from JSON Backup'}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={
                  isGr ? 'Επικολλήστε το JSON εδώ...' : 'Paste exported JSON here...'
                }
                className="flex-1 h-8 px-2.5 rounded-md border border-gray-200 text-xs"
              />
              <Button size="sm" variant="secondary" onClick={handleImport}>
                <Upload className="w-3.5 h-3.5 mr-1" />
                {isGr ? 'Εισαγωγή' : 'Import'}
              </Button>
            </div>
            {importStatus === 'success' && (
              <p className="text-xs text-emerald-600 mt-1">
                {isGr ? 'Επιτυχής εισαγωγή!' : 'Imported successfully!'}
              </p>
            )}
            {importStatus === 'error' && (
              <p className="text-xs text-rose-600 mt-1">
                {isGr ? 'Μη έγκυρο JSON.' : 'Invalid JSON payload.'}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
