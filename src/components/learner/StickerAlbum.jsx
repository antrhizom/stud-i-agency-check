import React, { useMemo } from 'react';
import { Sticker, Lock } from 'lucide-react';

// ============================================
// KOMPETENZ-ALBUM (Panini-Prinzip)
// Alle Felder sind durch den Lehrplan vordefiniert – ein Feld pro
// Kompetenz (ABU) bzw. Leistungsziel (Berufskunde). Die Felder füllen
// sich automatisch mit der Farbe des Themas/Gebiets, sobald daran
// gearbeitet wurde, und zeigen das erreichte Niveau:
//   Starter (1× kurz geübt / noch nicht verstanden)
//   Advanced (mittel geübt / teilweise verstanden)
//   Expert (stark geübt / verstanden)
// ============================================

export const NIVEAUS = [
  { id: 'starter', label: 'Starter', weight: 1, badge: '🥉', ring: '#B45309' },
  { id: 'advanced', label: 'Advanced', weight: 2, badge: '🥈', ring: '#64748B' },
  { id: 'expert', label: 'Expert', weight: 3, badge: '🥇', ring: '#D97706' }
];

const STATUS_WEIGHT = {
  // Üben-Skala (Sprachmodi, Schlüsselkompetenzen, BK)
  kurz: 1, mittel: 2, stark: 3,
  // Verständnis-Skala (Gesellschaftsinhalte)
  nichtVerstanden: 1, teilweiseVerstanden: 2, verstanden: 3
};

const GEBIET_COLORS = {
  'Betriebliche Prozesse': '#0EA5E9',
  'Elektrotechnik': '#F59E0B',
  'Elektro- und Alternativantrieb': '#10B981',
  'Fahrwerk': '#8B5CF6',
  'Antrieb': '#EC4899',
  'Motor': '#DC2626',
  'Stoffkunde': '#14B8A6'
};

const niveauForWeight = (w) => NIVEAUS.find(n => n.weight === Math.min(3, Math.max(1, w))) || NIVEAUS[0];

// Kürzel für die Feldbeschriftung: k1-2-3 → «1.2.3»
const kompetenzKurz = (id) => (id || '').replace(/^k/, '').split('-').join('.');

// ============================================
// Einzelnes Album-Feld
// ============================================
function AlbumFeld({ code, title, color, niveau }) {
  const filled = !!niveau;
  return (
    <div
      className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 relative p-1 transition ${
        filled ? 'shadow-md text-white' : 'border-2 border-dashed border-gray-300 bg-white/70'
      }`}
      style={filled ? { backgroundColor: color, border: `2px solid ${color}` } : {}}
      title={filled ? `${code} · ${title} – Niveau ${niveau.label}` : `${code} · ${title} – noch offen`}
    >
      {filled ? (
        <>
          <span className="text-xl leading-none drop-shadow">{niveau.badge}</span>
          <span className="text-[0.65rem] font-bold leading-none">{code}</span>
          <span className="text-[0.55rem] font-medium leading-none opacity-90">{niveau.label}</span>
        </>
      ) : (
        <>
          <Lock className="w-3.5 h-3.5 text-gray-300" />
          <span className="text-[0.65rem] font-semibold text-gray-400 leading-none">{code}</span>
        </>
      )}
    </div>
  );
}

// ============================================
// Album-Ansicht
// subject: Fach aus der Registry · entries: Einträge der/des Lernenden
// ============================================
export function AlbumView({ subject, entries = [] }) {
  // Höchstes erreichtes Niveau pro Kompetenz/Leistungsziel
  const levelByKey = useMemo(() => {
    const map = new Map();
    for (const e of entries) {
      const key = subject.kind === 'bk' ? e.zielId : e.kompetenzId;
      if (!key) continue;
      const w = STATUS_WEIGHT[e.status] || 1;
      if (!map.has(key) || map.get(key) < w) map.set(key, w);
    }
    return map;
  }, [entries, subject.kind]);

  // Vordefinierte Felder aus dem Lehrplan aufbauen
  const sections = useMemo(() => {
    if (subject.kind === 'bk') {
      return (subject.bk?.semester || []).map(sem => ({
        id: `sem-${sem.semester}`,
        title: `${sem.semester}. Semester`,
        color: '#475569',
        felder: sem.gebiete.flatMap(g =>
          g.ziele.map(z => ({
            key: `s${sem.semester}-${z.lnr.replace(/\./g, '')}`,
            code: z.lnr,
            title: `${g.name} · ${z.thema}`,
            color: GEBIET_COLORS[g.name] || '#6B7280'
          }))
        )
      }));
    }
    return (subject.curriculum?.themen || []).map(t => ({
      id: t.id,
      title: `Thema ${t.order}: ${t.title}`,
      color: t.color,
      felder: t.lebensbezuege.flatMap(lb =>
        lb.kompetenzen.map(k => ({
          key: k.id,
          code: kompetenzKurz(k.id),
          title: k.text,
          color: t.color
        }))
      )
    })).filter(sec => sec.felder.length > 0);
  }, [subject]);

  const totalFelder = sections.reduce((acc, sec) => acc + sec.felder.length, 0);
  const gefuellt = sections.reduce(
    (acc, sec) => acc + sec.felder.filter(f => levelByKey.has(f.key)).length, 0
  );
  const countByNiveau = NIVEAUS.map(n => ({
    ...n,
    count: sections.reduce(
      (acc, sec) => acc + sec.felder.filter(f => levelByKey.get(f.key) === n.weight).length, 0
    )
  }));

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6">
      <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
        <Sticker className="w-5 h-5" style={{ color: subject.color }} />
        Mein Kompetenz-Album
      </h2>
      <p className="text-sm text-gray-600 mb-3">
        Jede Kompetenz hat ihr festes Feld in der Farbe ihres {subject.kind === 'bk' ? 'Gebiets' : 'Themas'}.
        Sobald du daran arbeitest, füllt sich das Feld – dein Niveau steigt von Starter über Advanced bis Expert.
      </p>

      {/* Fortschritt + Legende */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <span className="text-sm font-semibold" style={{ color: subject.color }}>
          {gefuellt} / {totalFelder} Feldern gefüllt
        </span>
        <div className="flex flex-wrap gap-2">
          {countByNiveau.map(n => (
            <span key={n.id} className="text-xs px-2 py-1 rounded-full bg-gray-100 border flex items-center gap-1">
              {n.badge} {n.label}: <strong>{n.count}</strong>
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {sections.map(sec => {
          const secFilled = sec.felder.filter(f => levelByKey.has(f.key)).length;
          return (
            <div key={sec.id}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sec.color }} />
                <h3 className="font-semibold text-sm text-gray-800">{sec.title}</h3>
                <span className="text-xs text-gray-400">{secFilled}/{sec.felder.length}</span>
              </div>
              <div
                className="rounded-xl border-2 border-dashed p-3"
                style={{ borderColor: sec.color + '40', backgroundColor: sec.color + '08' }}
              >
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5">
                  {sec.felder.map(f => {
                    const w = levelByKey.get(f.key);
                    return (
                      <AlbumFeld
                        key={f.key}
                        code={f.code}
                        title={f.title}
                        color={f.color}
                        niveau={w ? niveauForWeight(w) : null}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {gefuellt === 0 && (
        <p className="text-sm text-gray-500 mt-4 text-center">
          Noch keine Felder gefüllt – erfasse deine erste Kompetenz, um das Album zu starten!
        </p>
      )}
    </div>
  );
}
