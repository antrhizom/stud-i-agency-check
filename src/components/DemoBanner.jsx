import React, { useState } from 'react';
import { Info, X, Sparkles } from 'lucide-react';

// ============================================
// DEMO-INFO
// Beim Einstieg in die Demo poppt einmal pro Sitzung ein Info-Fenster auf.
// Danach bleibt eine schmale Leiste sichtbar (Info jederzeit wieder öffnbar).
// ============================================
export default function DemoBanner({ role = 'learner' }) {
  const [showModal, setShowModal] = useState(() => {
    try { return sessionStorage.getItem('demo-info-gesehen') !== '1'; } catch { return true; }
  });

  const close = () => {
    try { sessionStorage.setItem('demo-info-gesehen', '1'); } catch { /* egal */ }
    setShowModal(false);
  };

  return (
    <>
      {/* Schmale Demo-Leiste, immer sichtbar */}
      <div className="bg-emerald-600 text-white text-xs px-4 py-1.5 flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5" />
        <span className="font-medium">Demo-Modus</span>
        <span className="hidden sm:inline">– alles ausprobierbar, nichts wird dauerhaft gespeichert</span>
        <button onClick={() => setShowModal(true)} className="underline hover:no-underline flex items-center gap-1">
          <Info className="w-3 h-3" /> Info
        </button>
      </div>

      {/* Info-Popup beim Start */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Info className="w-6 h-6 text-emerald-600" />
                Willkommen in der Demo!
              </h3>
              <button onClick={close} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm text-gray-700">
              <p>
                Hier kannst du <strong>alle Funktionen frei ausprobieren</strong> – es werden aber
                <strong> keine Daten dauerhaft gespeichert</strong>.
              </p>
              {role === 'teacher' ? (
                <>
                  <p>
                    Es können also keine echten Klassen oder Lernenden aufgenommen werden. Dafür siehst du eine
                    <strong> Beispielklasse (3-jährige Grundbildung)</strong> mit <strong>zwei Lernenden</strong>,
                    die über die ganze Lehre verteilt an <strong>vier Lernorten</strong> aktiv waren –
                    Unterricht, Betrieb, ÜK und Zuhause.
                  </p>
                  <p>
                    Beide haben bereits je <strong>vier Einträge</strong> erfasst (Allgemeinbildung und Berufskunde),
                    inkl. Notizen im Aktivitäts-Feed. Du kannst kommentieren, Klassen anlegen oder Codes
                    generieren – alles verschwindet beim Neuladen wieder.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    Du siehst die Einträge einer <strong>Beispiel-Lernenden-Person</strong> aus einer
                    3-jährigen Grundbildung: <strong>vier Einträge</strong>, verteilt über die ganze Lehre
                    und <strong>vier Lernorte</strong> (Unterricht, Betrieb, ÜK/Hausaufgabenstunde, Zuhause).
                  </p>
                  <p>
                    Du kannst neue Einträge erfassen, Abziehbilder sammeln und alles anschauen –
                    beim Neuladen ist wieder der Ausgangszustand da.
                  </p>
                </>
              )}
            </div>

            <button
              onClick={close}
              className="mt-5 w-full py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition"
            >
              Alles klar – Demo starten
            </button>
          </div>
        </div>
      )}
    </>
  );
}
