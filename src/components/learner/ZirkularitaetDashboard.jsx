import React, { useMemo, useState } from 'react';
import {
  themen,
  schluesselkompetenzen,
  sprachmodi,
  gesellschaftsinhalte,
  getSchluesselkompetenzById,
  getSprachmodusById,
  getGesellschaftsinhaltById
} from '../../data/curriculumEBA';
import {
  BarChart3,
  MessageSquare,
  Target,
  BookOpen,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

// ============================================
// FARBEN gemäss Vorgabe
// ============================================
const ZIRK_COLORS = {
  sprachmodi: {
    bg: '#E8F8E8',
    text: '#228B22',
    border: '#B8E8B8'
  },
  schluessel: {
    bg: '#FFFDE6',
    text: '#B8860B',
    border: '#FFE68A'
  },
  gesellschaft: {
    bg: '#E6F5FC',
    text: '#009EE0',
    border: '#B3E0F2'
  }
};

// Themenfarben für die Balken
const THEMA_COLORS = {
  t1: '#0EA5E9',
  t2: '#F97316',
  t3: '#22C55E',
  t4: '#8B5CF6',
  t5: '#EC4899',
  t6: '#14B8A6',
  t7: '#A16207',
  t8: '#DC2626'
};

// ============================================
// ZIRKULARITÄTS-BALKEN KOMPONENTE
// ============================================
const ZirkularitaetsBalken = ({ label, themenDaten, colorScheme }) => {
  // themenDaten ist ein Array von { themaId, runde (R1, R2, etc.), count }
  const maxRunden = 3; // R1, R2, R3

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium" style={{ color: colorScheme.text }}>
          {label}
        </span>
      </div>
      <div className="flex gap-1 h-8 rounded-lg overflow-hidden" style={{ backgroundColor: colorScheme.bg }}>
        {themen.map(thema => {
          const data = themenDaten.find(d => d.themaId === thema.id);
          if (!data) {
            return (
              <div
                key={thema.id}
                className="flex-1 flex items-center justify-center text-xs opacity-30"
                title={`${thema.title}: nicht behandelt`}
              >
                T{thema.order}
              </div>
            );
          }

          const intensity = data.count > 0 ? Math.min(1, 0.3 + (data.count * 0.2)) : 0.5;

          return (
            <div
              key={thema.id}
              className="flex-1 flex items-center justify-center text-xs font-medium text-white relative"
              style={{
                backgroundColor: THEMA_COLORS[thema.id],
                opacity: intensity
              }}
              title={`${thema.title}: ${data.runde} (${data.count}× geübt)`}
            >
              <span className="absolute inset-0 flex items-center justify-center">
                {data.runde}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex gap-1 mt-1">
        {themen.map(thema => (
          <div key={thema.id} className="flex-1 text-center text-[10px] text-gray-500">
            T{thema.order}
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================
// ACCORDION FÜR BEREICHE
// ============================================
const BereichAccordion = ({ title, icon, colorScheme, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className="border rounded-lg overflow-hidden mb-4"
      style={{ borderColor: colorScheme.border }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between"
        style={{ backgroundColor: colorScheme.bg }}
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-semibold" style={{ color: colorScheme.text }}>
            {title}
          </span>
        </div>
        {isOpen ? (
          <ChevronDown className="w-5 h-5" style={{ color: colorScheme.text }} />
        ) : (
          <ChevronRight className="w-5 h-5" style={{ color: colorScheme.text }} />
        )}
      </button>
      {isOpen && (
        <div className="p-4 bg-white">
          {children}
        </div>
      )}
    </div>
  );
};

// ============================================
// LEGENDE
// ============================================
const Legende = () => {
  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-6">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">Legende</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {themen.map(thema => (
          <div key={thema.id} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: THEMA_COLORS[thema.id] }}
            />
            <span className="text-xs text-gray-600">
              T{thema.order}: {thema.title}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-gray-200 px-2 py-0.5 rounded">R1</span>
            <span className="text-xs text-gray-600">= erste Behandlung</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-gray-200 px-2 py-0.5 rounded">R2</span>
            <span className="text-xs text-gray-600">= Wiederholung/Vertiefung</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-gray-200 px-2 py-0.5 rounded">R3</span>
            <span className="text-xs text-gray-600">= weitere Vertiefung</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// HAUPTKOMPONENTE
// ============================================
export default function ZirkularitaetDashboard({ entries = [] }) {
  // Berechne Zirkularitätsdaten aus den Einträgen und dem Curriculum
  const zirkularitaetsDaten = useMemo(() => {
    // Gesellschaftsinhalte
    const gesellschaftDaten = gesellschaftsinhalte.map(gi => {
      const themenDaten = themen.map(thema => {
        const zirk = thema.zirkularitaet?.gesellschaft?.[gi.id];
        const count = entries.filter(e =>
          e.themaId === thema.id &&
          e.type === 'kompetenz'
        ).length;
        return zirk ? { themaId: thema.id, runde: zirk, count } : null;
      }).filter(Boolean);
      return { ...gi, themenDaten };
    });

    // Sprachmodi
    const sprachmodiDaten = sprachmodi.map(sm => {
      const themenDaten = themen.map(thema => {
        const zirk = thema.zirkularitaet?.sprachmodi?.[sm.id];
        const count = entries.filter(e =>
          e.themaId === thema.id &&
          (e.type === 'kompetenz' || e.optionalSprachmodi?.includes(sm.id))
        ).length;
        return zirk ? { themaId: thema.id, runde: zirk, count } : null;
      }).filter(Boolean);
      return { ...sm, themenDaten };
    });

    // Schlüsselkompetenzen
    const schluesselDaten = schluesselkompetenzen.map(sk => {
      const themenDaten = themen.map(thema => {
        const zirk = thema.zirkularitaet?.schluessel?.[sk.id];
        const count = entries.filter(e =>
          e.themaId === thema.id &&
          e.schluesselkompetenzId === sk.id
        ).length;
        return zirk ? { themaId: thema.id, runde: zirk, count } : null;
      }).filter(Boolean);
      return { ...sk, themenDaten };
    });

    return { gesellschaftDaten, sprachmodiDaten, schluesselDaten };
  }, [entries]);

  // Statistiken
  const stats = useMemo(() => {
    const total = entries.length;
    const kompetenzEntries = entries.filter(e => e.type === 'kompetenz').length;
    const schluesselEntries = entries.filter(e => e.type === 'schluesselkompetenz').length;
    const transversalEntries = entries.filter(e => e.type === 'transversal').length;

    const themenStats = themen.map(thema => {
      const count = entries.filter(e => e.themaId === thema.id).length;
      return { ...thema, count };
    });

    return { total, kompetenzEntries, schluesselEntries, transversalEntries, themenStats };
  }, [entries]);

  return (
    <div className="space-y-6">
      {/* Übersicht */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          Zirkularitäts-Dashboard
        </h2>

        <Legende />

        {/* Statistik-Karten */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-xs text-gray-500">Einträge gesamt</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.kompetenzEntries}</div>
            <div className="text-xs text-gray-500">Kompetenzen</div>
          </div>
          <div className="bg-amber-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">{stats.schluesselEntries}</div>
            <div className="text-xs text-gray-500">Schlüsselkomp.</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.transversalEntries}</div>
            <div className="text-xs text-gray-500">Transversal</div>
          </div>
        </div>

        {/* Themen-Fortschritt */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Fortschritt pro Thema</h3>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
            {stats.themenStats.map(thema => (
              <div
                key={thema.id}
                className="rounded-lg p-3 text-center"
                style={{ backgroundColor: THEMA_COLORS[thema.id] + '20' }}
              >
                <div
                  className="text-lg font-bold"
                  style={{ color: THEMA_COLORS[thema.id] }}
                >
                  {thema.count}
                </div>
                <div className="text-[10px] text-gray-600">T{thema.order}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gesellschaftsinhalte */}
      <BereichAccordion
        title="Zirkularität der Gesellschaftsinhalte"
        icon={<BookOpen className="w-5 h-5" style={{ color: ZIRK_COLORS.gesellschaft.text }} />}
        colorScheme={ZIRK_COLORS.gesellschaft}
        defaultOpen={true}
      >
        {zirkularitaetsDaten.gesellschaftDaten.map(gi => (
          <ZirkularitaetsBalken
            key={gi.id}
            label={gi.label}
            themenDaten={gi.themenDaten}
            colorScheme={ZIRK_COLORS.gesellschaft}
          />
        ))}
      </BereichAccordion>

      {/* Sprachmodi */}
      <BereichAccordion
        title="Zirkularität der Sprachmodi"
        icon={<MessageSquare className="w-5 h-5" style={{ color: ZIRK_COLORS.sprachmodi.text }} />}
        colorScheme={ZIRK_COLORS.sprachmodi}
        defaultOpen={false}
      >
        {zirkularitaetsDaten.sprachmodiDaten.map(sm => (
          <ZirkularitaetsBalken
            key={sm.id}
            label={sm.label}
            themenDaten={sm.themenDaten}
            colorScheme={ZIRK_COLORS.sprachmodi}
          />
        ))}
      </BereichAccordion>

      {/* Schlüsselkompetenzen */}
      <BereichAccordion
        title="Zirkularität der Schlüsselkompetenzen"
        icon={<Target className="w-5 h-5" style={{ color: ZIRK_COLORS.schluessel.text }} />}
        colorScheme={ZIRK_COLORS.schluessel}
        defaultOpen={false}
      >
        {zirkularitaetsDaten.schluesselDaten.map(sk => (
          <ZirkularitaetsBalken
            key={sk.id}
            label={`${sk.code}: ${sk.label.substring(0, 50)}${sk.label.length > 50 ? '...' : ''}`}
            themenDaten={sk.themenDaten}
            colorScheme={ZIRK_COLORS.schluessel}
          />
        ))}
      </BereichAccordion>
    </div>
  );
}
