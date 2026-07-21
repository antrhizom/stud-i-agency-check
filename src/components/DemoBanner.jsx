import React, { useState } from 'react';
import { Info, X } from 'lucide-react';

// Hinweis-Banner für Demo-Konten (Lernende und Lehrpersonen)
export default function DemoBanner({ role = 'learner' }) {
  const [open, setOpen] = useState(true);
  if (!open) {
    return (
      <div className="bg-emerald-600 text-white text-xs px-4 py-1 flex items-center justify-center gap-2">
        <Info className="w-3.5 h-3.5" /> Demo-Modus aktiv
        <button onClick={() => setOpen(true)} className="underline hover:no-underline">Info anzeigen</button>
      </div>
    );
  }
  return (
    <div className="bg-emerald-50 border-b-2 border-emerald-300">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-start gap-3">
        <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="flex-1 text-sm text-emerald-900">
          <span className="font-semibold">Demo-Modus:</span>{' '}
          Alle Funktionen können frei ausprobiert werden – es werden aber <strong>keine Daten gespeichert</strong>.
          {role === 'teacher' ? (
            <> Neue Klassen, Lernenden-Codes und Kommentare werden nicht angelegt. Du siehst eine <strong>Beispielklasse mit zwei Lernenden</strong>, die über die ganze Lehre an vier Lernorten aktiv waren (je vier Einträge – ABU und Berufskunde).</>
          ) : (
            <> Neue Einträge und Antworten werden nicht gespeichert. Du siehst die <strong>Beispiel-Einträge</strong> einer/eines Lernenden: vier Einträge, verteilt über die ganze Lehre und vier Lernorte.</>
          )}
        </div>
        <button onClick={() => setOpen(false)} className="p-1 text-emerald-600 hover:bg-emerald-100 rounded shrink-0" title="Einklappen">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
