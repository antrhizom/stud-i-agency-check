import React, { useMemo, useState } from 'react';
import {
  themen,
  schluesselkompetenzen,
  sprachmodi,
  gesellschaftsinhalte,
  getSchluesselkompetenzById,
  getSprachmodusById,
  getGesellschaftsinhaltById,
  uiColors
} from '../../data/curriculumEBA';
import {
  BarChart3,
  MessageSquare,
  Target,
  BookOpen,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  AlertCircle,
  Users
} from 'lucide-react';

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
// KOMPETENZ STATUS BADGE
// ============================================
const StatusBadge = ({ count, required = 1 }) => {
  if (count >= required) {
    return (
      <span className="flex items-center gap-1 text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
        <CheckCircle2 className="w-3 h-3" />
        {count}× geübt
      </span>
    );
  }
  if (count > 0) {
    return (
      <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
        <AlertCircle className="w-3 h-3" />
        {count}× (noch üben)
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
      <Circle className="w-3 h-3" />
      offen
    </span>
  );
};

// ============================================
// THEMA DETAIL CARD
// ============================================
const ThemaDetailCard = ({ thema, entries }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Berechne Statistiken für dieses Thema
  const themaStats = useMemo(() => {
    const themaEntries = entries.filter(e => e.themaId === thema.id);

    // Gesellschaft
    const gesellschaftStats = [];
    thema.lebensbezuege.forEach(lb => {
      lb.kompetenzen.forEach(komp => {
        komp.gesellschaft.forEach((g, idx) => {
          const count = themaEntries.filter(e =>
            e.type === 'gesellschaft' &&
            e.kompetenzId === komp.id &&
            e.bereich === g.bereich
          ).length;
          gesellschaftStats.push({
            kompetenzId: komp.id,
            kompetenzText: komp.text,
            lebensbezug: lb.title,
            bereich: g.bereich,
            bereichLabel: getGesellschaftsinhaltById(g.bereich)?.label || g.bereich,
            inhalt: g.inhalt,
            count
          });
        });
      });
    });

    // Sprachmodi
    const sprachmodiStats = [];
    thema.lebensbezuege.forEach(lb => {
      lb.kompetenzen.forEach(komp => {
        // Pflicht-Sprachmodi
        komp.sprachmpiPflicht.forEach((sp, idx) => {
          const count = themaEntries.filter(e =>
            e.type === 'sprachmodus' &&
            e.kompetenzId === komp.id &&
            e.modus === sp.modus
          ).length;
          sprachmodiStats.push({
            kompetenzId: komp.id,
            kompetenzText: komp.text,
            lebensbezug: lb.title,
            modus: sp.modus,
            modusLabel: getSprachmodusById(sp.modus)?.label || sp.modus,
            modusCode: getSprachmodusById(sp.modus)?.code,
            inhalt: sp.inhalt,
            isPflicht: true,
            count
          });
        });
        // Optionale Sprachmodi
        if (komp.sprachmodiOptional) {
          komp.sprachmodiOptional.forEach(modusId => {
            const count = themaEntries.filter(e =>
              e.type === 'sprachmodus' &&
              e.kompetenzId === komp.id &&
              e.modus === modusId &&
              e.isOptional === true
            ).length;
            sprachmodiStats.push({
              kompetenzId: komp.id,
              kompetenzText: komp.text,
              lebensbezug: lb.title,
              modus: modusId,
              modusLabel: getSprachmodusById(modusId)?.label || modusId,
              modusCode: getSprachmodusById(modusId)?.code,
              inhalt: '(Optional)',
              isPflicht: false,
              count
            });
          });
        }
      });
    });

    // Schlüsselkompetenzen
    const schluesselStats = thema.schluesselkompetenzen.map(skId => {
      const sk = getSchluesselkompetenzById(skId);
      const count = themaEntries.filter(e =>
        e.type === 'schluesselkompetenz' &&
        e.schluesselkompetenzId === skId
      ).length;
      return {
        id: skId,
        code: sk?.code,
        label: sk?.label,
        count
      };
    });

    // Zusammenfassung
    const totalGesellschaft = gesellschaftStats.length;
    const doneGesellschaft = gesellschaftStats.filter(s => s.count > 0).length;
    const totalSprachmodi = sprachmodiStats.filter(s => s.isPflicht).length;
    const doneSprachmodi = sprachmodiStats.filter(s => s.isPflicht && s.count > 0).length;
    const totalSchluessel = schluesselStats.length;
    const doneSchluessel = schluesselStats.filter(s => s.count > 0).length;

    return {
      gesellschaftStats,
      sprachmodiStats,
      schluesselStats,
      summary: {
        gesellschaft: { done: doneGesellschaft, total: totalGesellschaft },
        sprachmodi: { done: doneSprachmodi, total: totalSprachmodi },
        schluessel: { done: doneSchluessel, total: totalSchluessel }
      }
    };
  }, [thema, entries]);

  const totalDone = themaStats.summary.gesellschaft.done +
                    themaStats.summary.sprachmodi.done +
                    themaStats.summary.schluessel.done;
  const totalRequired = themaStats.summary.gesellschaft.total +
                        themaStats.summary.sprachmodi.total +
                        themaStats.summary.schluessel.total;
  const percentage = totalRequired > 0 ? Math.round((totalDone / totalRequired) * 100) : 0;

  return (
    <div className="border rounded-lg overflow-hidden mb-3">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
        style={{ backgroundColor: THEMA_COLORS[thema.id] + '10' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: THEMA_COLORS[thema.id] }}
          />
          <div className="text-left">
            <span className="font-medium text-gray-900">
              Thema {thema.order}: {thema.title}
            </span>
            <div className="text-xs text-gray-500 mt-0.5">
              {themaStats.summary.gesellschaft.done}/{themaStats.summary.gesellschaft.total} Gesellschaft •
              {themaStats.summary.sprachmodi.done}/{themaStats.summary.sprachmodi.total} Sprache •
              {themaStats.summary.schluessel.done}/{themaStats.summary.schluessel.total} Schlüssel
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span
              className="text-lg font-bold"
              style={{ color: THEMA_COLORS[thema.id] }}
            >
              {percentage}%
            </span>
          </div>
          {isOpen ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Details */}
      {isOpen && (
        <div className="p-4 bg-white border-t space-y-4">
          {/* Gesellschaftsinhalte */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2" style={{ color: uiColors.gesellschaft.text }}>
              <BookOpen className="w-4 h-4" />
              Gesellschaftsinhalte ({themaStats.summary.gesellschaft.done}/{themaStats.summary.gesellschaft.total})
            </h4>
            <div className="space-y-1">
              {themaStats.gesellschaftStats.map((g, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between gap-2 p-2 rounded text-xs"
                  style={{ backgroundColor: g.count > 0 ? '#DCFCE7' : uiColors.gesellschaft.bg }}
                >
                  <div className="flex-1">
                    <span className="font-medium" style={{ color: uiColors.gesellschaft.text }}>
                      {g.bereichLabel}
                    </span>
                    <p className="text-gray-600 mt-0.5">{g.inhalt}</p>
                  </div>
                  <StatusBadge count={g.count} />
                </div>
              ))}
            </div>
          </div>

          {/* Sprachmodi */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2" style={{ color: uiColors.sprache.text }}>
              <MessageSquare className="w-4 h-4" />
              Sprachmodi ({themaStats.summary.sprachmodi.done}/{themaStats.summary.sprachmodi.total} Pflicht)
            </h4>
            <div className="space-y-1">
              {themaStats.sprachmodiStats.map((sp, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between gap-2 p-2 rounded text-xs"
                  style={{
                    backgroundColor: sp.count > 0 ? '#DCFCE7' : (sp.isPflicht ? uiColors.sprache.bg : '#F3E8FF'),
                    opacity: sp.isPflicht ? 1 : 0.8
                  }}
                >
                  <div className="flex-1">
                    <span className="font-medium" style={{ color: sp.isPflicht ? uiColors.sprache.text : '#7C3AED' }}>
                      {sp.modusLabel} {sp.modusCode && `(${sp.modusCode})`}
                      {!sp.isPflicht && <span className="ml-1 text-purple-400">[optional]</span>}
                    </span>
                    <p className="text-gray-600 mt-0.5">{sp.inhalt}</p>
                  </div>
                  <StatusBadge count={sp.count} />
                </div>
              ))}
            </div>
          </div>

          {/* Schlüsselkompetenzen */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2" style={{ color: uiColors.schluessel.text }}>
              <Target className="w-4 h-4" />
              Schlüsselkompetenzen ({themaStats.summary.schluessel.done}/{themaStats.summary.schluessel.total})
            </h4>
            <div className="space-y-1">
              {themaStats.schluesselStats.map((sk, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between gap-2 p-2 rounded text-xs"
                  style={{ backgroundColor: sk.count > 0 ? '#DCFCE7' : uiColors.schluessel.bg }}
                >
                  <div className="flex-1">
                    <span className="font-medium text-gray-500">{sk.code}</span>
                    <p className="text-gray-800">{sk.label}</p>
                  </div>
                  <StatusBadge count={sk.count} />
                </div>
              ))}
            </div>
          </div>
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
      <div className="mt-4 pt-4 border-t flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
          </span>
          <span className="text-xs text-gray-600">= erfüllt</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
            <AlertCircle className="w-3 h-3" />
          </span>
          <span className="text-xs text-gray-600">= in Arbeit</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            <Circle className="w-3 h-3" />
          </span>
          <span className="text-xs text-gray-600">= offen</span>
        </div>
      </div>
    </div>
  );
};

// ============================================
// HAUPTKOMPONENTE
// ============================================
export default function ZirkularitaetDashboard({ entries = [] }) {
  // Statistiken
  const stats = useMemo(() => {
    const total = entries.length;
    const gesellschaftEntries = entries.filter(e => e.type === 'gesellschaft').length;
    const sprachmodiEntries = entries.filter(e => e.type === 'sprachmodus').length;
    const schluesselEntries = entries.filter(e => e.type === 'schluesselkompetenz').length;
    const transversalEntries = entries.filter(e => e.type === 'transversal').length;

    const themenStats = themen.map(thema => {
      const count = entries.filter(e => e.themaId === thema.id).length;
      return { ...thema, count };
    });

    return { total, gesellschaftEntries, sprachmodiEntries, schluesselEntries, transversalEntries, themenStats };
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-xs text-gray-500">Einträge gesamt</div>
          </div>
          <div className="rounded-lg p-4 text-center" style={{ backgroundColor: uiColors.gesellschaft.bg }}>
            <div className="text-2xl font-bold" style={{ color: uiColors.gesellschaft.text }}>{stats.gesellschaftEntries}</div>
            <div className="text-xs text-gray-500">Gesellschaft</div>
          </div>
          <div className="rounded-lg p-4 text-center" style={{ backgroundColor: uiColors.sprache.bg }}>
            <div className="text-2xl font-bold" style={{ color: uiColors.sprache.text }}>{stats.sprachmodiEntries}</div>
            <div className="text-xs text-gray-500">Sprachmodi</div>
          </div>
          <div className="rounded-lg p-4 text-center" style={{ backgroundColor: uiColors.schluessel.bg }}>
            <div className="text-2xl font-bold" style={{ color: uiColors.schluessel.text }}>{stats.schluesselEntries}</div>
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

      {/* Detailansicht pro Thema */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-600" />
          Kompetenzen pro Thema
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Klicke auf ein Thema um zu sehen, welche Kompetenzen erfüllt sind und wo du noch üben kannst.
        </p>

        {themen.map(thema => (
          <ThemaDetailCard
            key={thema.id}
            thema={thema}
            entries={entries}
          />
        ))}
      </div>
    </div>
  );
}
