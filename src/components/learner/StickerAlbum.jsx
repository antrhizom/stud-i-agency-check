import React, { useMemo } from 'react';
import { Lock, Sparkles, Plus } from 'lucide-react';
import { getSprachmodusById } from '../../data/curriculumEBA';

// ============================================
// KOMPETENZ-SAMMELALBUM (Manga-Sammelkarten)
// Pro Thema → individueller Lebensbezug gibt es für jede Kompetenz eine
// vordefinierte, graue Sammelkarte. Sie wird bei Durchführung in der
// Themenfarbe eingefärbt und trägt eine R-Stufe (Zirkularität):
//   R1 = Beginner · R2 = Advanced · R3 = Expert
// Unter jedem Lebensbezug erscheinen zusätzlich freiwillig durchgeführte
// Kompetenzen (z.B. optionale Sprachmodi) als Bonus-Marken.
// ============================================

const STATUS_WEIGHT = {
  kurz: 1, mittel: 2, stark: 3,
  nichtVerstanden: 1, teilweiseVerstanden: 2, verstanden: 3
};

export const R_STUFEN = [
  { r: 1, label: 'Beginner' },
  { r: 2, label: 'Advanced' },
  { r: 3, label: 'Expert' }
];
const rLabel = (r) => R_STUFEN.find(x => x.r === r)?.label || '';

// Manga-/Anime-artige Symbole, deterministisch pro Kompetenz zugewiesen
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
  'Betriebliche Prozesse': '#0EA5E9',
  'Elektrotechnik': '#F59E0B',
  'Elektro- und Alternativantrieb': '#10B981',
  'Fahrwerk': '#8B5CF6',
  'Antrieb': '#EC4899',
  'Motor': '#DC2626',
  'Stoffkunde': '#14B8A6'
};

// k1-2-3 → «1.2.3»
const kompetenzCode = (id) => (id || '').replace(/^k/, '').split('-').join('.');

// ============================================
// Sammelkarte (Manga-Style)
// ============================================
function Sammelkarte({ symbol, code, title, color, r, plus = 0 }) {
  const filled = !!r;
  const rInfo = filled ? rLabel(r) : '';

  // Farbabstufung nach R-Stufe
  let cardStyle, headStyle, textCls, holo = false;
  if (!filled) {
    cardStyle = { borderColor: '#D1D5DB' };
    headStyle = { background: 'repeating-linear-gradient(45deg,#F3F4F6,#F3F4F6 6px,#E5E7EB 6px,#E5E7EB 12px)' };
    textCls = 'text-gray-400';
  } else if (r === 1) {
    cardStyle = { borderColor: color + '88', backgroundColor: color + '10' };
    headStyle = { backgroundColor: color + '33' };
    textCls = 'text-gray-800';
  } else if (r === 2) {
    cardStyle = { borderColor: color, backgroundColor: color + '22' };
    headStyle = { backgroundColor: color + 'CC' };
    textCls = 'text-gray-900';
  } else {
    holo = true;
    cardStyle = { borderColor: color, backgroundColor: color + '22' };
    headStyle = { background: `linear-gradient(135deg, ${color}, #ffffff88 45%, ${color})` };
    textCls = 'text-gray-900';
  }

  return (
    <div
      className="relative rounded-xl border-2 overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow"
      style={cardStyle}
      title={`${code} · ${title}${filled ? ` – R${r} ${rInfo}` : ' – noch offen'}${plus ? ` · +${plus} freiwillig` : ''}`}
    >
      {/* Plus-Auszeichnung */}
      {plus > 0 && (
        <span className="absolute top-1 right-1 z-10 bg-amber-400 text-amber-900 text-[0.6rem] font-extrabold rounded-full px-1.5 leading-tight shadow border border-white flex items-center">
          <Plus className="w-2.5 h-2.5" strokeWidth={3} />{plus}
        </span>
      )}

      {/* Symbol-Kopf */}
      <div className="relative h-14 flex items-center justify-center" style={headStyle}>
        <span className={`text-3xl leading-none ${filled ? '' : 'grayscale opacity-40'}`}>{symbol}</span>
        {holo && <span className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(115deg, transparent 30%, #ffffff66 50%, transparent 70%)' }} />}
        {!filled && (
          <span className="absolute inset-0 flex items-center justify-center">
            <Lock className="w-5 h-5 text-gray-400" />
          </span>
        )}
      </div>

      {/* Karten-Körper */}
      <div className="flex-1 px-1.5 py-1.5 flex flex-col items-center text-center gap-0.5">
        <span className={`text-[0.7rem] font-extrabold leading-none ${textCls}`}>{code}</span>
        <span className={`text-[0.58rem] leading-tight line-clamp-3 ${filled ? 'text-gray-600' : 'text-gray-400'}`}>{title}</span>
      </div>

      {/* R-Stufen-Fuss */}
      <div className="px-1.5 py-1 flex items-center justify-center border-t" style={{ borderColor: filled ? color + '44' : '#E5E7EB' }}>
        {filled ? (
          <span className="text-[0.62rem] font-bold flex items-center gap-1" style={{ color }}>
            <span className="px-1.5 py-0.5 rounded text-white text-[0.58rem]" style={{ backgroundColor: color }}>R{r}</span>
            {rInfo}
          </span>
        ) : (
          <span className="text-[0.58rem] text-gray-400">noch offen</span>
        )}
      </div>
    </div>
  );
}

// R-Stufe einer ABU-Kompetenz = höchstes erreichtes Niveau über alle ihre
// (Pflicht-)Bestandteile: Gesellschaftsinhalte, Sprachmodi, Schlüsselkompetenzen.
//   R1 = Beginner (kurz / noch nicht verstanden)
//   R2 = Advanced (mittel / teilweise verstanden)
//   R3 = Expert (stark / verstanden)
function kompetenzProgress(k, entries) {
  const ms = entries.filter(e => e.kompetenzId === k.id && !e.isOptional);
  let r = 0;
  for (const e of ms) r = Math.max(r, STATUS_WEIGHT[e.status] || 1);
  const plus = Math.min(3, entries.filter(e => e.kompetenzId === k.id && e.isOptional).length);
  return { r, plus };
}

// ============================================
// ABU: Sammelalbum nach Thema → Lebensbezug
// ============================================
function AbuAlbum({ subject, entries }) {
  const themen = subject.curriculum?.themen || [];

  const data = useMemo(() => themen.map(t => ({
    thema: t,
    lebensbezuege: t.lebensbezuege.map(lb => {
      const karten = lb.kompetenzen.map(k => ({
        id: k.id,
        code: kompetenzCode(k.id),
        title: k.text,
        symbol: symbolFor(k.id),
        ...kompetenzProgress(k, entries)
      }));
      // Zusätzlich (freiwillig) durchgeführte Sprachmodi in diesem Lebensbezug
      const kompIds = new Set(lb.kompetenzen.map(k => k.id));
      const bonusMap = new Map();
      for (const e of entries) {
        if (!e.isOptional || !kompIds.has(e.kompetenzId)) continue;
        const modus = getSprachmodusById(e.modus);
        const key = e.modus;
        if (!bonusMap.has(key)) bonusMap.set(key, { label: modus?.label || e.modus, code: modus?.code, count: 0 });
        bonusMap.get(key).count++;
      }
      return { lb, karten, bonus: [...bonusMap.values()] };
    })
  })), [themen, entries]);

  const alleKarten = data.flatMap(t => t.lebensbezuege.flatMap(l => l.karten));
  const total = alleKarten.length;
  const erreicht = alleKarten.filter(k => k.r > 0).length;
  const countByR = R_STUFEN.map(n => ({ ...n, count: alleKarten.filter(k => k.r === n.r).length }));
  const plusTotal = alleKarten.reduce((a, k) => a + k.plus, 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6">
      <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-blue-600" />
        Mein Kompetenz-Sammelalbum
      </h2>
      <p className="text-sm text-gray-600 mb-3">
        Für jede Kompetenz gibt es eine Sammelkarte. Sie startet grau und färbt sich, sobald du daran
        arbeitest – deine Zirkularitätsstufe steigt von <strong>R1 Beginner</strong> über
        <strong> R2 Advanced</strong> bis <strong>R3 Expert</strong>. Freiwillig zusätzlich geübte Kompetenzen
        erscheinen als <span className="text-amber-600 font-semibold">Bonus</span> unter dem Lebensbezug.
      </p>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="text-sm font-semibold text-blue-700">{erreicht} / {total} Karten freigespielt</span>
        {countByR.map(n => (
          <span key={n.r} className="text-xs px-2 py-1 rounded-full bg-gray-100 border">R{n.r} {n.label}: <strong>{n.count}</strong></span>
        ))}
        {plusTotal > 0 && (
          <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-semibold">＋{plusTotal} Bonus</span>
        )}
      </div>

      <div className="space-y-8">
        {data.map(({ thema, lebensbezuege }) => (
          <div key={thema.id}>
            {/* Thema-Kopf */}
            <div className="flex items-center gap-2 mb-3 pb-1.5 border-b-2" style={{ borderColor: thema.color }}>
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: thema.color }} />
              <h3 className="font-bold text-gray-900">Thema {thema.order}: {thema.title}</h3>
            </div>

            <div className="space-y-5">
              {lebensbezuege.map(({ lb, karten, bonus }) => (
                <div key={lb.id}>
                  <div className="text-sm font-medium text-gray-700 mb-2 flex items-start gap-1.5">
                    <span className="text-gray-400 shrink-0">▸</span>
                    <span>{lb.title}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                    {karten.map(k => (
                      <Sammelkarte key={k.id} symbol={k.symbol} code={k.code} title={k.title} color={thema.color} r={k.r} plus={k.plus} />
                    ))}
                  </div>
                  {bonus.length > 0 && (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="text-xs text-amber-700 font-medium flex items-center gap-0.5">
                        <Plus className="w-3 h-3" strokeWidth={3} /> Zusätzlich geübt:
                      </span>
                      {bonus.map(b => (
                        <span key={b.code || b.label} className="text-[0.65rem] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                          {b.label}{b.code ? ` (${b.code})` : ''}{b.count > 1 ? ` ×${b.count}` : ''}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {erreicht === 0 && (
        <p className="text-sm text-gray-500 mt-4 text-center">
          Noch keine Karte freigespielt – erfasse deine erste Kompetenz, um dein Album zu starten!
        </p>
      )}
    </div>
  );
}

// ============================================
// Berufskunde: Sammelalbum nach Semester → Gebiet
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
    gebiete: sem.gebiete.map(g => ({
      name: g.name,
      color: GEBIET_COLORS[g.name] || '#6B7280',
      karten: g.ziele.map(z => ({
        key: `s${sem.semester}-${z.lnr.replace(/\./g, '')}`,
        code: z.lnr,
        title: z.thema,
        symbol: symbolFor(z.lnr)
      }))
    }))
  })), [subject]);

  const alle = sections.flatMap(s => s.gebiete.flatMap(g => g.karten));
  const erreicht = alle.filter(k => levelByKey.has(k.key)).length;
  const countByR = R_STUFEN.map(n => ({ ...n, count: alle.filter(k => levelByKey.get(k.key) === n.r).length }));

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6">
      <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
        <Sparkles className="w-5 h-5" style={{ color: subject.color }} />
        Mein Kompetenz-Sammelalbum
      </h2>
      <p className="text-sm text-gray-600 mb-3">
        Für jedes Leistungsziel gibt es eine Sammelkarte. Sie färbt sich bei Durchführung –
        dein Niveau steigt von <strong>R1 Beginner</strong> über <strong>R2 Advanced</strong> bis <strong>R3 Expert</strong>.
      </p>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="text-sm font-semibold" style={{ color: subject.color }}>{erreicht} / {alle.length} Karten freigespielt</span>
        {countByR.map(n => (
          <span key={n.r} className="text-xs px-2 py-1 rounded-full bg-gray-100 border">R{n.r} {n.label}: <strong>{n.count}</strong></span>
        ))}
      </div>

      <div className="space-y-8">
        {sections.map(sec => (
          <div key={sec.id}>
            <div className="flex items-center gap-2 mb-3 pb-1.5 border-b-2" style={{ borderColor: subject.color }}>
              <h3 className="font-bold text-gray-900">{sec.title}</h3>
            </div>
            <div className="space-y-5">
              {sec.gebiete.map(g => (
                <div key={g.name}>
                  <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: g.color }} />
                    {g.name}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                    {g.karten.map(k => (
                      <Sammelkarte key={k.key} symbol={k.symbol} code={k.code} title={k.title} color={g.color} r={levelByKey.get(k.key) || 0} />
                    ))}
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
