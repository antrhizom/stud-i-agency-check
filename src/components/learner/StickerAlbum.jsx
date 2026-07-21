import React, { useMemo } from 'react';
import { Lock, Sparkles } from 'lucide-react';
import {
  gesellschaftsinhalte,
  sprachmodi,
  schluesselkompetenzen,
  uiColors
} from '../../data/curriculumEBA';

// ============================================
// ZIRKULARITÄTS-ALBUM (Panini-Prinzip)
// Bildet die Zirkularität der Kompetenzen ab: Für jede Kompetenz aus den
// drei Bereichen (Gesellschaftliche Inhalte, Sprachmodi, Schlüssel-
// kompetenzen) gibt es ein festes Feld. Jedes Feld hat die Grundfarbe
// seiner Hauptkompetenz; die R-Stufe (Abstufung) zeigt das Niveau:
//   R1 = Beginner · R2 = Advanced · R3 = Expert
// Freiwillige Vertiefung (Wiederholung / zusätzlich geübte Sprachmodi)
// bringt Plus-Auszeichnungen (+1 … +3).
//
// Für die Berufskunde (kind === 'bk') gibt es keine Zirkularität – dort
// zeigt das Album ein Leistungsziel-Feld pro Semester/Gebiet.
// ============================================

const STATUS_WEIGHT = {
  // Üben-Skala (Sprachmodi, Schlüsselkompetenzen, BK)
  kurz: 1, mittel: 2, stark: 3,
  // Verständnis-Skala (Gesellschaftsinhalte)
  nichtVerstanden: 1, teilweiseVerstanden: 2, verstanden: 3
};

export const R_STUFEN = [
  { r: 1, label: 'Beginner' },
  { r: 2, label: 'Advanced' },
  { r: 3, label: 'Expert' }
];
const rLabel = (r) => R_STUFEN.find(x => x.r === r)?.label || '';

const GEBIET_COLORS = {
  'Betriebliche Prozesse': '#0EA5E9',
  'Elektrotechnik': '#F59E0B',
  'Elektro- und Alternativantrieb': '#10B981',
  'Fahrwerk': '#8B5CF6',
  'Antrieb': '#EC4899',
  'Motor': '#DC2626',
  'Stoffkunde': '#14B8A6'
};

// Farbabstufung eines Feldes nach R-Stufe (0 = noch offen)
function feldStyle(color, r) {
  if (!r) return { style: {}, cls: 'border-2 border-dashed border-gray-300 bg-white/70 text-gray-400' };
  if (r === 1) return { style: { backgroundColor: color + '26', borderColor: color + '77', color }, cls: 'border-2' };
  if (r === 2) return { style: { backgroundColor: color + 'B3', borderColor: color, color: '#fff' }, cls: 'border-2' };
  return { style: { backgroundColor: color, borderColor: color, color: '#fff' }, cls: 'border-2 shadow-md' };
}

// Aggregiert die Einträge, die auf ein Feld passen
function aggregate(entries, matchFn) {
  const ms = entries.filter(matchFn);
  let w = 0, opt = 0;
  for (const e of ms) {
    w = Math.max(w, STATUS_WEIGHT[e.status] || 1);
    if (e.isOptional) opt++;
  }
  const pflicht = ms.length - opt;
  const plus = Math.min(3, opt + Math.max(0, pflicht - 1));
  return { r: w, plus, count: ms.length };
}

// ============================================
// Einzelnes Album-Feld
// ============================================
function AlbumFeld({ code, label, color, r, plus = 0 }) {
  const { style, cls } = feldStyle(color, r);
  const filled = !!r;
  const titleParts = [label];
  if (filled) titleParts.push(`R${r} · ${rLabel(r)}`);
  else titleParts.push('noch offen');
  if (plus > 0) titleParts.push(`+${plus} freiwillige Vertiefung`);

  return (
    <div
      className={`relative aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 p-1 text-center overflow-hidden ${cls}`}
      style={style}
      title={titleParts.join(' – ')}
    >
      {plus > 0 && (
        <span className="absolute top-0.5 right-0.5 bg-amber-400 text-amber-900 text-[0.58rem] font-extrabold rounded-full px-1 leading-tight shadow border border-white">
          +{plus}
        </span>
      )}
      {filled ? (
        <>
          <span className="text-sm font-extrabold leading-none">R{r}</span>
          <span className="text-[0.6rem] font-semibold leading-tight line-clamp-2">{code || label}</span>
          <span className="text-[0.5rem] leading-none opacity-90">{rLabel(r)}</span>
        </>
      ) : (
        <>
          <Lock className="w-3.5 h-3.5 text-gray-300" />
          <span className="text-[0.58rem] font-medium text-gray-400 leading-tight line-clamp-2">{code || label}</span>
        </>
      )}
    </div>
  );
}

// ============================================
// ABU: Zirkularitäts-Album (3 Bereiche)
// ============================================
function ZirkAlbum({ entries }) {
  const sections = useMemo(() => [
    {
      key: 'gesellschaft',
      title: 'Gesellschaftliche Inhalte',
      base: uiColors.gesellschaft.text,
      felder: gesellschaftsinhalte.map(g => ({
        id: g.id, label: g.label, code: null, color: g.color,
        match: e => e.type === 'gesellschaft' && e.bereich === g.id
      }))
    },
    {
      key: 'sprache',
      title: 'Sprachmodi',
      base: uiColors.sprache.text,
      felder: sprachmodi.map(s => ({
        id: s.id, label: `${s.label} (${s.code})`, code: s.label, color: uiColors.sprache.text,
        match: e => e.type === 'sprachmodus' && e.modus === s.id
      }))
    },
    {
      key: 'schluessel',
      title: 'Schlüsselkompetenzen',
      base: uiColors.schluessel.text,
      felder: schluesselkompetenzen.map(sk => ({
        id: sk.id, label: `${sk.code}: ${sk.label}`, code: sk.code, color: uiColors.schluessel.text,
        match: e => e.type === 'schluesselkompetenz' && e.schluesselkompetenzId === sk.id
      }))
    }
  ], []);

  // Aggregate pro Feld berechnen
  const computed = useMemo(() => sections.map(sec => ({
    ...sec,
    felder: sec.felder.map(f => ({ ...f, ...aggregate(entries, f.match) }))
  })), [sections, entries]);

  const alleFelder = computed.flatMap(s => s.felder);
  const total = alleFelder.length;
  const erreicht = alleFelder.filter(f => f.r > 0).length;
  const plusTotal = alleFelder.reduce((acc, f) => acc + f.plus, 0);
  const countByR = R_STUFEN.map(n => ({ ...n, count: alleFelder.filter(f => f.r === n.r).length }));

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6">
      <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-blue-600" />
        Mein Zirkularitäts-Album
      </h2>
      <p className="text-sm text-gray-600 mb-3">
        Jede Kompetenz hat ihr festes Feld in der Grundfarbe ihres Bereichs. Je nach deinem Niveau
        färbt sich das Feld dunkler – von <strong>R1 Beginner</strong> über <strong>R2 Advanced</strong> bis <strong>R3 Expert</strong>.
        Für freiwillige Vertiefung (Wiederholung oder zusätzlich geübte Modi) gibt es <span className="text-amber-600 font-semibold">＋-Auszeichnungen</span>.
      </p>

      {/* Fortschritt + Niveau-Übersicht */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="text-sm font-semibold text-blue-700">{erreicht} / {total} Feldern erreicht</span>
        {countByR.map(n => (
          <span key={n.r} className="text-xs px-2 py-1 rounded-full bg-gray-100 border">
            R{n.r} {n.label}: <strong>{n.count}</strong>
          </span>
        ))}
        {plusTotal > 0 && (
          <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-semibold">
            ＋{plusTotal} freiwillig
          </span>
        )}
      </div>

      <div className="space-y-6">
        {computed.map(sec => {
          const secErreicht = sec.felder.filter(f => f.r > 0).length;
          return (
            <div key={sec.key}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sec.base }} />
                <h3 className="font-semibold text-sm text-gray-800">{sec.title}</h3>
                <span className="text-xs text-gray-400">{secErreicht}/{sec.felder.length}</span>
              </div>
              <div
                className="rounded-xl border-2 border-dashed p-3"
                style={{ borderColor: sec.base + '40', backgroundColor: sec.base + '08' }}
              >
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                  {sec.felder.map(f => (
                    <AlbumFeld key={f.id} code={f.code} label={f.label} color={f.color} r={f.r} plus={f.plus} />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {erreicht === 0 && (
        <p className="text-sm text-gray-500 mt-4 text-center">
          Noch keine Felder erreicht – erfasse deine erste Kompetenz, um dein Album zu starten!
        </p>
      )}
    </div>
  );
}

// ============================================
// Berufskunde: Leistungsziel-Album (Semester/Gebiet)
// ============================================
function BkAlbum({ subject, entries }) {
  const levelByKey = useMemo(() => {
    const map = new Map();
    for (const e of entries) {
      if (!e.zielId) continue;
      const w = STATUS_WEIGHT[e.status] || 1;
      if (!map.has(e.zielId) || map.get(e.zielId) < w) map.set(e.zielId, w);
    }
    return map;
  }, [entries]);

  const sections = useMemo(() => (subject.bk?.semester || []).map(sem => ({
    id: `sem-${sem.semester}`,
    title: `${sem.semester}. Semester`,
    felder: sem.gebiete.flatMap(g =>
      g.ziele.map(z => ({
        key: `s${sem.semester}-${z.lnr.replace(/\./g, '')}`,
        code: z.lnr,
        label: `${g.name} · ${z.thema}`,
        color: GEBIET_COLORS[g.name] || '#6B7280'
      }))
    )
  })), [subject]);

  const alle = sections.flatMap(s => s.felder);
  const erreicht = alle.filter(f => levelByKey.has(f.key)).length;
  const countByR = R_STUFEN.map(n => ({
    ...n, count: alle.filter(f => levelByKey.get(f.key) === n.r).length
  }));

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6">
      <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
        <Sparkles className="w-5 h-5" style={{ color: subject.color }} />
        Mein Kompetenz-Album
      </h2>
      <p className="text-sm text-gray-600 mb-3">
        Jedes Leistungsziel hat sein Feld in der Farbe seines Gebiets. Dein Niveau steigt von
        <strong> R1 Beginner</strong> über <strong>R2 Advanced</strong> bis <strong>R3 Expert</strong>.
      </p>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="text-sm font-semibold" style={{ color: subject.color }}>{erreicht} / {alle.length} Feldern erreicht</span>
        {countByR.map(n => (
          <span key={n.r} className="text-xs px-2 py-1 rounded-full bg-gray-100 border">
            R{n.r} {n.label}: <strong>{n.count}</strong>
          </span>
        ))}
      </div>

      <div className="space-y-6">
        {sections.map(sec => {
          const secErreicht = sec.felder.filter(f => levelByKey.has(f.key)).length;
          return (
            <div key={sec.id}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subject.color }} />
                <h3 className="font-semibold text-sm text-gray-800">{sec.title}</h3>
                <span className="text-xs text-gray-400">{secErreicht}/{sec.felder.length}</span>
              </div>
              <div
                className="rounded-xl border-2 border-dashed p-3"
                style={{ borderColor: subject.color + '40', backgroundColor: subject.color + '08' }}
              >
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                  {sec.felder.map(f => (
                    <AlbumFeld key={f.key} code={f.code} label={f.label} color={f.color} r={levelByKey.get(f.key) || 0} />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// Öffentliche Album-Komponente
// ============================================
export function AlbumView({ subject, entries = [] }) {
  if (subject.kind === 'bk') return <BkAlbum subject={subject} entries={entries} />;
  return <ZirkAlbum entries={entries} />;
}
