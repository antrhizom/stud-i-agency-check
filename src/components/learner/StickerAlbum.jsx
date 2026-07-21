import React, { useMemo } from 'react';
import {
  getGesellschaftsinhaltById,
  getSprachmodusById,
  getSchluesselkompetenzById,
  uiColors
} from '../../data/curriculumEBA';
import { getRStufe, getSchluesselForThema } from '../../data/zirkularitaet';
import { Sparkles } from 'lucide-react';

// ============================================
// KOMPETENZ-SAMMELALBUM (Manga-Sammelkarten, SLP-Zirkularität)
// Aufbau exakt nach SLP:
//   Pro Thema die zugewiesenen Schlüsselkompetenzen (mit R-Stufe),
//   pro Kompetenz die gesellschaftlichen Inhalte und Sprachmodi (mit R-Stufe).
// Jede Karte trägt ihre im SLP festgelegte Zirkularitätsstufe (R1, R2, …).
// Alle Karten sind grau vorerzeugt und werden bei Durchführung eingefärbt;
// die Farbintensität zeigt, wie intensiv geübt wurde.
// ============================================

const STATUS_WEIGHT = {
  kurz: 1, mittel: 2, stark: 3,
  nichtVerstanden: 1, teilweiseVerstanden: 2, verstanden: 3
};

// R-Stufe → Niveau-Bezeichnung (R1 Beginner, R2 Advanced, R3+ Expert)
const rNiveau = (r) => {
  if (!r) return '';
  const n = parseInt(r.slice(1), 10);
  return n <= 1 ? 'Beginner' : n === 2 ? 'Advanced' : 'Expert';
};

const SYMBOLE = [
  '⚡', '🔥', '💫', '⭐', '✨', '🎯', '🚀', '🛡️', '⚔️', '👑',
  '💎', '🏆', '🐉', '🦅', '🦁', '🐺', '🦊', '🌊', '🌪️', '❄️',
  '☄️', '🔮', '🧭', '⚙️', '🔋', '💥', '🌟', '🎖️', '🗡️', '🏅'
];
function symbolFor(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return SYMBOLE[h % SYMBOLE.length];
}

const GEBIET_COLORS = {
  'Betriebliche Prozesse': '#0EA5E9', 'Elektrotechnik': '#F59E0B',
  'Elektro- und Alternativantrieb': '#10B981', 'Fahrwerk': '#8B5CF6',
  'Antrieb': '#EC4899', 'Motor': '#DC2626', 'Stoffkunde': '#14B8A6'
};

const kompetenzCode = (id) => (id || '').replace(/^k/, '').split('-').join('.');

// Füllung nach Übungs-Status (0 = grau/nicht erfasst)
function fill(color, statusW) {
  if (!statusW) return { style: {}, cls: 'border-2 border-dashed border-gray-300 bg-white/70', text: 'text-gray-400', done: false };
  if (statusW === 1) return { style: { backgroundColor: color + '2E', borderColor: color + '99' }, cls: 'border-2', text: '', textColor: color, done: true };
  if (statusW === 2) return { style: { backgroundColor: color + 'BF', borderColor: color }, cls: 'border-2', text: 'text-white', done: true };
  return { style: { backgroundColor: color, borderColor: color }, cls: 'border-2 shadow-md', text: 'text-white', done: true, holo: true };
}

// ============================================
// Baustein-Karte (Gesellschaftsinhalt / Sprachmodus / Schlüsselkompetenz)
// ============================================
function Karte({ symbol, code, label, color, r, statusW, big = false }) {
  const f = fill(color, statusW);
  const niveau = rNiveau(r);
  const textColor = f.textColor;
  return (
    <div
      className={`relative rounded-xl flex flex-col overflow-hidden ${f.cls}`}
      style={f.style}
      title={`${code ? code + ' · ' : ''}${label}${r ? ` – ${r} ${niveau}` : ''}${f.done ? '' : ' (noch offen)'}`}
    >
      {/* R-Badge (feste SLP-Stufe), immer sichtbar */}
      {r && (
        <span
          className="absolute top-1 right-1 z-10 text-[0.58rem] font-extrabold rounded px-1 leading-tight border"
          style={f.done
            ? { backgroundColor: '#ffffffcc', color: color, borderColor: '#ffffff' }
            : { backgroundColor: '#F3F4F6', color: '#9CA3AF', borderColor: '#E5E7EB' }}
        >
          {r}
        </span>
      )}
      <div className={`flex items-center justify-center ${big ? 'h-10' : 'h-8'}`}>
        <span className={`${big ? 'text-2xl' : 'text-xl'} leading-none ${f.done ? '' : 'grayscale opacity-40'}`}>{symbol}</span>
        {f.holo && <span className="absolute top-0 left-0 right-0 h-10 pointer-events-none" style={{ background: 'linear-gradient(115deg,transparent 35%,#ffffff55 50%,transparent 65%)' }} />}
      </div>
      <div className="px-1 pb-1 flex flex-col items-center text-center gap-0.5">
        {code && <span className={`text-[0.62rem] font-bold leading-none ${f.text || ''}`} style={!f.text && textColor ? { color: textColor } : {}}>{code}</span>}
        <span className={`text-[0.55rem] leading-tight line-clamp-2 ${f.done ? (f.text || 'text-gray-600') : 'text-gray-400'}`} style={!f.text && f.done && textColor ? { color: textColor } : {}}>{label}</span>
        {r && <span className={`text-[0.5rem] leading-none ${f.done ? (f.text ? 'opacity-90' : '') : 'text-gray-400'}`} style={!f.text && f.done && textColor ? { color: textColor } : {}}>{niveau}</span>}
      </div>
    </div>
  );
}

// ============================================
// ABU: Album nach SLP-Zirkularität
// ============================================
function AbuAlbum({ subject, entries }) {
  const sid = subject.id;
  const themen = subject.curriculum?.themen || [];

  const gesW = (kid, ber) => {
    let w = 0;
    for (const e of entries) if (e.type === 'gesellschaft' && e.kompetenzId === kid && e.bereich === ber) w = Math.max(w, STATUS_WEIGHT[e.status] || 1);
    return w;
  };
  const sprW = (kid, modus) => {
    let w = 0;
    for (const e of entries) if (e.type === 'sprachmodus' && e.kompetenzId === kid && e.modus === modus) w = Math.max(w, STATUS_WEIGHT[e.status] || 1);
    return w;
  };
  // Schlüsselkompetenz zählt nur im Thema, in dem sie erfasst wurde
  const skW = (skId, themaId) => {
    let w = 0;
    for (const e of entries) if (e.type === 'schluesselkompetenz' && e.schluesselkompetenzId === skId && e.themaId === themaId) w = Math.max(w, STATUS_WEIGHT[e.status] || 1);
    return w;
  };

  // Statistik über alle Bausteine
  const stats = useMemo(() => {
    let total = 0, done = 0;
    for (const t of themen) {
      for (const { skId } of getSchluesselForThema(sid, t.order)) { total++; if (skW(skId, t.id)) done++; }
      for (const lb of t.lebensbezuege) for (const k of lb.kompetenzen) {
        for (const g of (k.gesellschaft || [])) { total++; if (gesW(k.id, g.bereich)) done++; }
        for (const s of (k.sprachmpiPflicht || [])) { total++; if (sprW(k.id, s.modus)) done++; }
      }
    }
    return { total, done };
  }, [themen, entries, sid]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6">
      <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-blue-600" />
        Mein Kompetenz-Sammelalbum
      </h2>
      <p className="text-sm text-gray-600 mb-1">
        Aufbau nach Schullehrplan: pro Thema die <strong>Schlüsselkompetenzen</strong>, pro Kompetenz die
        <strong> gesellschaftlichen Inhalte</strong> und <strong>Sprachmodi</strong>. Jede Karte trägt ihre
        SLP-Zirkularitätsstufe (R1 Beginner, R2 Advanced, R3+ Expert).
      </p>
      <p className="text-sm font-semibold text-blue-700 mb-6">{stats.done} / {stats.total} Karten freigespielt</p>

      <div className="space-y-8">
        {themen.map(t => {
          const sks = getSchluesselForThema(sid, t.order);
          return (
            <div key={t.id}>
              <div className="flex items-center gap-2 mb-3 pb-1.5 border-b-2" style={{ borderColor: t.color }}>
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.color }} />
                <h3 className="font-bold text-gray-900">Thema {t.order}: {t.title}</h3>
              </div>

              {/* Schlüsselkompetenzen des Themas */}
              {sks.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: uiColors.schluessel.text }}>
                    Schlüsselkompetenzen
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {sks.map(({ skId, r }) => {
                      const sk = getSchluesselkompetenzById(skId);
                      return (
                        <Karte key={skId} symbol={symbolFor(skId)} code={sk?.code}
                          label={sk?.label || skId} color={uiColors.schluessel.text} r={r} statusW={skW(skId, t.id)} big />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Lebensbezüge → Kompetenzen → Bausteine */}
              <div className="space-y-4">
                {t.lebensbezuege.map(lb => (
                  <div key={lb.id}>
                    <div className="text-sm font-medium text-gray-700 mb-2 flex items-start gap-1.5">
                      <span className="text-gray-400 shrink-0">▸</span><span>{lb.title}</span>
                    </div>
                    <div className="space-y-3 pl-4">
                      {lb.kompetenzen.map(k => {
                        const bausteine = [
                          ...(k.gesellschaft || []).map((g, i) => {
                            const info = getGesellschaftsinhaltById(g.bereich);
                            return { key: `g${i}`, typ: 'gesellschaft', symbol: symbolFor(k.id + g.bereich),
                              code: null, label: info?.label || g.bereich, color: info?.color || uiColors.gesellschaft.text,
                              r: getRStufe(sid, 'gesellschaft', g.bereich, t.order), statusW: gesW(k.id, g.bereich) };
                          }),
                          ...(k.sprachmpiPflicht || []).map((s, i) => {
                            const info = getSprachmodusById(s.modus);
                            return { key: `s${i}`, typ: 'sprache', symbol: symbolFor(k.id + s.modus),
                              code: info?.code, label: info?.label || s.modus, color: uiColors.sprache.text,
                              r: getRStufe(sid, 'sprache', s.modus, t.order), statusW: sprW(k.id, s.modus) };
                          })
                        ];
                        return (
                          <div key={k.id}>
                            <div className="text-xs text-gray-500 mb-1">
                              <span className="font-semibold text-gray-700">{kompetenzCode(k.id)}</span> {k.text}
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                              {bausteine.map(b => (
                                <Karte key={b.key} symbol={b.symbol} code={b.code} label={b.label}
                                  color={b.color} r={b.r} statusW={b.statusW} />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {stats.done === 0 && (
        <p className="text-sm text-gray-500 mt-4 text-center">
          Noch keine Karte freigespielt – erfasse deine erste Kompetenz, um dein Album zu starten!
        </p>
      )}
    </div>
  );
}

// ============================================
// Berufskunde: Sammelalbum nach Semester → Gebiet (Niveau aus Status)
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
    id: `sem-${sem.semester}`, title: `${sem.semester}. Semester`,
    gebiete: sem.gebiete.map(g => ({
      name: g.name, color: GEBIET_COLORS[g.name] || '#6B7280',
      karten: g.ziele.map(z => ({ key: `s${sem.semester}-${z.lnr.replace(/\./g, '')}`, code: z.lnr, label: z.thema, symbol: symbolFor(z.lnr) }))
    }))
  })), [subject]);

  const alle = sections.flatMap(s => s.gebiete.flatMap(g => g.karten));
  const done = alle.filter(k => levelByKey.has(k.key)).length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6">
      <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
        <Sparkles className="w-5 h-5" style={{ color: subject.color }} />
        Mein Kompetenz-Sammelalbum
      </h2>
      <p className="text-sm text-gray-600 mb-1">
        Für jedes Leistungsziel eine Sammelkarte – sie färbt sich bei Durchführung. Niveau nach Übungsintensität
        (R1 Beginner, R2 Advanced, R3 Expert).
      </p>
      <p className="text-sm font-semibold mb-6" style={{ color: subject.color }}>{done} / {alle.length} Karten freigespielt</p>

      <div className="space-y-8">
        {sections.map(sec => (
          <div key={sec.id}>
            <div className="flex items-center gap-2 mb-3 pb-1.5 border-b-2" style={{ borderColor: subject.color }}>
              <h3 className="font-bold text-gray-900">{sec.title}</h3>
            </div>
            <div className="space-y-4">
              {sec.gebiete.map(g => (
                <div key={g.name}>
                  <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: g.color }} />{g.name}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {g.karten.map(k => {
                      const w = levelByKey.get(k.key) || 0;
                      return <Karte key={k.key} symbol={k.symbol} code={k.code} label={k.label} color={g.color} r={w ? 'R' + w : null} statusW={w} />;
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AlbumView({ subject, entries = [] }) {
  if (subject.kind === 'bk') return <BkAlbum subject={subject} entries={entries} />;
  return <AbuAlbum subject={subject} entries={entries} />;
}
