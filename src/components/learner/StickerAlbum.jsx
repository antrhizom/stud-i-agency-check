import React from 'react';
import { Sticker, X, Sparkles } from 'lucide-react';

// ============================================
// STICKER-ALBUM
// Wer eine Kompetenz erreicht (oberste Stufe «stark geübt» bzw.
// «verstanden»), darf ein Abziehbild auswählen – es wird ins Album geklebt.
// ============================================

export const STICKER_POOL = [
  { id: 'loewe', emoji: '🦁', label: 'Löwe', color: '#F59E0B' },
  { id: 'drache', emoji: '🐉', label: 'Drache', color: '#10B981' },
  { id: 'adler', emoji: '🦅', label: 'Adler', color: '#78716C' },
  { id: 'fuchs', emoji: '🦊', label: 'Fuchs', color: '#EA580C' },
  { id: 'wolf', emoji: '🐺', label: 'Wolf', color: '#64748B' },
  { id: 'schildkroete', emoji: '🐢', label: 'Schildkröte', color: '#22C55E' },
  { id: 'oktopus', emoji: '🐙', label: 'Oktopus', color: '#EC4899' },
  { id: 'pinguin', emoji: '🐧', label: 'Pinguin', color: '#0EA5E9' },
  { id: 'rennauto', emoji: '🏎️', label: 'Rennauto', color: '#DC2626' },
  { id: 'auto', emoji: '🚗', label: 'Auto', color: '#2563EB' },
  { id: 'rad', emoji: '🛞', label: 'Rad', color: '#525252' },
  { id: 'schraubschluessel', emoji: '🔧', label: 'Schraubenschlüssel', color: '#6B7280' },
  { id: 'zahnrad', emoji: '⚙️', label: 'Zahnrad', color: '#71717A' },
  { id: 'batterie', emoji: '🔋', label: 'Batterie', color: '#16A34A' },
  { id: 'blitz', emoji: '⚡', label: 'Blitz', color: '#EAB308' },
  { id: 'magnet', emoji: '🧲', label: 'Magnet', color: '#EF4444' },
  { id: 'pflanze', emoji: '🌱', label: 'Pflanze', color: '#15803D' },
  { id: 'erde', emoji: '🌍', label: 'Erde', color: '#0D9488' },
  { id: 'rakete', emoji: '🚀', label: 'Rakete', color: '#7C3AED' },
  { id: 'stern', emoji: '🌟', label: 'Stern', color: '#F59E0B' },
  { id: 'diamant', emoji: '💎', label: 'Diamant', color: '#06B6D4' },
  { id: 'pokal', emoji: '🏆', label: 'Pokal', color: '#D97706' },
  { id: 'medaille', emoji: '🥇', label: 'Goldmedaille', color: '#CA8A04' },
  { id: 'zielscheibe', emoji: '🎯', label: 'Zielscheibe', color: '#B91C1C' }
];

export const getStickerById = (id) => STICKER_POOL.find(s => s.id === id) || null;

// ============================================
// Auswahl-Modal: erscheint nach dem Erreichen einer Kompetenz
// ============================================
export function StickerPickerModal({ open, ownedStickerIds = [], sourceText, onPick, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 mb-1">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-500" />
            Kompetenz erreicht!
          </h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg" title="Später auswählen">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-1">
          Super gemacht! Wähle ein Abziehbild als Belohnung – es wird in dein Album geklebt.
        </p>
        {sourceText && <p className="text-xs text-gray-400 italic mb-4">{sourceText}</p>}

        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
          {STICKER_POOL.map(st => {
            const owned = ownedStickerIds.includes(st.id);
            return (
              <button
                key={st.id}
                disabled={owned}
                onClick={() => onPick(st)}
                className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition transform ${
                  owned
                    ? 'opacity-35 border-gray-200 cursor-not-allowed'
                    : 'hover:scale-110 hover:shadow-lg cursor-pointer'
                }`}
                style={owned ? {} : { borderColor: st.color + '60', backgroundColor: st.color + '10' }}
                title={owned ? `${st.label} – schon im Album` : st.label}
              >
                <span className="text-3xl leading-none">{st.emoji}</span>
                <span className="text-[0.6rem] text-gray-500 leading-none px-1 text-center">{st.label}</span>
              </button>
            );
          })}
        </div>

        <p className="text-xs text-gray-400 mt-4 text-center">
          Bereits gesammelte Abziehbilder sind ausgegraut – jedes gibt es nur einmal.
        </p>
      </div>
    </div>
  );
}

// ============================================
// Album-Ansicht: Panini-Feld mit allen Slots
// ============================================
export function AlbumView({ stickers = [], accentColor = '#2563EB' }) {
  const ownedById = new Map(stickers.map(s => [s.stickerId, s]));

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6">
      <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
        <Sticker className="w-5 h-5" style={{ color: accentColor }} />
        Mein Abziehbilder-Album
      </h2>
      <p className="text-sm text-gray-600 mb-5">
        Für jede erreichte Kompetenz («verstanden» oder «stark geübt») darfst du ein Abziehbild auswählen.
        <span className="ml-2 font-medium" style={{ color: accentColor }}>{stickers.length} / {STICKER_POOL.length} gesammelt</span>
      </p>

      <div
        className="rounded-2xl border-4 border-dashed p-5"
        style={{ borderColor: accentColor + '30', backgroundColor: accentColor + '06' }}
      >
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
          {STICKER_POOL.map(st => {
            const owned = ownedById.get(st.id);
            return (
              <div
                key={st.id}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-1 relative ${
                  owned ? 'shadow-md rotate-0' : 'border-2 border-dashed border-gray-300 bg-white/60'
                }`}
                style={owned ? { backgroundColor: st.color + '15', border: `2px solid ${st.color}55`, transform: `rotate(${((st.id.length % 5) - 2) * 2}deg)` } : {}}
                title={owned ? `${st.label} – ${owned.sourceText || 'Kompetenz erreicht'}` : 'Noch nicht freigeschaltet'}
              >
                {owned ? (
                  <>
                    <span className="text-4xl leading-none drop-shadow-sm">{st.emoji}</span>
                    <span className="text-[0.6rem] font-medium text-gray-600 leading-none">{st.label}</span>
                  </>
                ) : (
                  <span className="text-2xl text-gray-300 font-bold">?</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {stickers.length === 0 && (
        <p className="text-sm text-gray-500 mt-4 text-center">
          Noch keine Abziehbilder – erfasse eine Kompetenz mit «verstanden» oder «stark geübt», um dein erstes Bild freizuschalten!
        </p>
      )}
    </div>
  );
}
