import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  deleteDoc,
  doc,
  Timestamp
} from 'firebase/firestore';
import {
  themen,
  getThemenByLehrjahr,
  schluesselkompetenzen,
  sprachmodi,
  gesellschaftsinhalte,
  transversaleThemen,
  getSchluesselkompetenzById,
  getSprachmodusById,
  getGesellschaftsinhaltById,
  uiColors,
  themenFarben
} from '../../data/curriculumEBA';
import {
  LogOut,
  ChevronDown,
  ChevronRight,
  BookOpen,
  MessageSquare,
  Users,
  Target,
  Sparkles,
  BarChart3,
  Calendar,
  Check,
  Plus,
  Minus,
  Info,
  ListChecks,
  Trash2
} from 'lucide-react';
import ZirkularitaetDashboard from './ZirkularitaetDashboard';

// ============================================
// STATUS OPTIONS (Gewichtete Stufen)
// ============================================
const STATUS_OPTIONS = [
  { id: 'kurz', label: 'kurz geübt', color: '#FEF3C7', weight: 1 },
  { id: 'mittel', label: 'mittel geübt', color: '#FED7AA', weight: 2 },
  { id: 'stark', label: 'stark geübt', color: '#DCFCE7', weight: 3 }
];

const HOW_OPTIONS = [
  'Fallbeispiel',
  'Gespräch/Diskussion',
  'Recherche',
  'Rollenspiel',
  'Reflexion',
  'Präsentation',
  'Schriftliche Arbeit',
  'Gruppenarbeit',
  'KI-gestützt',
  'Projekt',
  'Praxis/Betrieb',
  'Anderes'
];

// ============================================
// HELPER COMPONENTS
// ============================================

// Accordion Component
const Accordion = ({ title, children, defaultOpen = false, headerBg = 'bg-gray-100', icon, badge }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border rounded-lg overflow-hidden mb-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 flex items-center justify-between ${headerBg} hover:opacity-90 transition-opacity`}
      >
        <div className="flex items-center gap-2">
          {icon && icon}
          <span className="font-medium text-left">{title}</span>
          {badge && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-white/50">
              {badge}
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronDown className="w-5 h-5 text-gray-600" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-600" />
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

// Counter Component für "Wie oft"
const Counter = ({ value, onChange, min = 0, max = 99 }) => {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-100"
        disabled={value <= min}
      >
        <Minus className="w-4 h-4" />
      </button>
      <span className="w-8 text-center font-medium">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-100"
        disabled={value >= max}
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
};

// Einzelner klickbarer Inhalt mit Erfassungs-Popup
const ClickableInhalt = ({ type, label, code, inhalt, bgColor, textColor, icon: Icon, onSave, entryCount = 0 }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    status: 'kurz',
    howMethod: '',
    howCount: 1,
    note: ''
  });

  const handleSave = () => {
    if (!formData.howMethod) {
      alert('Bitte wähle eine Methode aus.');
      return;
    }
    onSave(formData);
    setFormData({ status: 'kurz', howMethod: '', howCount: 1, note: '' });
    setShowForm(false);
  };

  return (
    <div className="mt-2">
      <div
        onClick={() => setShowForm(!showForm)}
        className="p-3 rounded-lg text-sm cursor-pointer hover:opacity-90 transition-opacity border-2 border-transparent hover:border-gray-300"
        style={{ backgroundColor: bgColor }}
      >
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4" style={{ color: textColor }} />
            <span className="font-medium" style={{ color: textColor }}>
              {label} {code && <span className="text-xs opacity-70">({code})</span>}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {entryCount > 0 && (
              <span className="px-2 py-0.5 bg-white/70 text-xs rounded-full font-medium" style={{ color: textColor }}>
                {entryCount}×
              </span>
            )}
            <span className="text-xs px-2 py-1 rounded bg-white/50" style={{ color: textColor }}>
              {showForm ? '−' : '+'}
            </span>
          </div>
        </div>
        <p className="text-gray-700 text-xs">{inhalt}</p>
      </div>

      {/* Inline Erfassungs-Formular */}
      {showForm && (
        <div className="mt-2 p-3 bg-gray-50 rounded-lg border space-y-3">
          {/* Status */}
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, status: opt.id }))}
                className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
                  formData.status === opt.id ? 'ring-2 ring-blue-300' : ''
                }`}
                style={{ backgroundColor: opt.color }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Wie & Wie oft */}
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[150px]">
              <label className="text-xs text-gray-600 block mb-1">Wie geübt?</label>
              <select
                value={formData.howMethod}
                onChange={(e) => setFormData(prev => ({ ...prev, howMethod: e.target.value }))}
                className="w-full px-2 py-1.5 border rounded text-xs"
              >
                <option value="">— wählen —</option>
                {HOW_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600 block mb-1">Wie oft?</label>
              <Counter
                value={formData.howCount}
                onChange={(val) => setFormData(prev => ({ ...prev, howCount: val }))}
                min={1}
                max={10}
              />
            </div>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 font-medium"
            >
              Speichern
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Kompetenz Card mit klickbaren Einzelinhalten
const KompetenzCard = ({ kompetenz, thema, onSaveGesellschaft, onSaveSprachmodus, onSaveSchluessel, existingEntries = [] }) => {
  // Zähle Einträge pro Inhalt
  const getGesellschaftCount = (bereich, inhaltIdx) => {
    return existingEntries.filter(e =>
      e.type === 'gesellschaft' &&
      e.kompetenzId === kompetenz.id &&
      e.bereich === bereich &&
      e.inhaltIdx === inhaltIdx
    ).length;
  };

  const getSprachmodusCount = (modus, inhaltIdx) => {
    return existingEntries.filter(e =>
      e.type === 'sprachmodus' &&
      e.kompetenzId === kompetenz.id &&
      e.modus === modus &&
      e.inhaltIdx === inhaltIdx
    ).length;
  };

  const getSchluesselCount = (skId) => {
    return existingEntries.filter(e =>
      e.type === 'schluesselkompetenz' &&
      e.kompetenzId === kompetenz.id &&
      e.schluesselkompetenzId === skId
    ).length;
  };

  return (
    <div className="border rounded-lg p-4 mb-3 bg-white shadow-sm">
      {/* Kompetenz-Text */}
      <p className="text-sm text-gray-800 font-medium mb-3">{kompetenz.text}</p>

      {/* Gesellschaftliche Inhalte - klickbar */}
      {kompetenz.gesellschaft.map((g, idx) => {
        const bereichInfo = getGesellschaftsinhaltById(g.bereich);
        return (
          <ClickableInhalt
            key={`gesellschaft-${idx}`}
            type="gesellschaft"
            label={bereichInfo?.label || g.bereich}
            inhalt={g.inhalt}
            bgColor={uiColors.gesellschaft.bg}
            textColor={uiColors.gesellschaft.text}
            icon={BookOpen}
            entryCount={getGesellschaftCount(g.bereich, idx)}
            onSave={(formData) => onSaveGesellschaft({
              kompetenzId: kompetenz.id,
              themaId: thema.id,
              bereich: g.bereich,
              inhalt: g.inhalt,
              inhaltIdx: idx,
              ...formData
            })}
          />
        );
      })}

      {/* Sprachmodi Pflicht - klickbar */}
      {kompetenz.sprachmpiPflicht.map((sp, idx) => {
        const modusInfo = getSprachmodusById(sp.modus);
        return (
          <ClickableInhalt
            key={`sprache-${idx}`}
            type="sprachmodus"
            label={modusInfo?.label || sp.modus}
            code={modusInfo?.code}
            inhalt={sp.inhalt}
            bgColor={uiColors.sprache.bg}
            textColor={uiColors.sprache.text}
            icon={MessageSquare}
            entryCount={getSprachmodusCount(sp.modus, idx)}
            onSave={(formData) => onSaveSprachmodus({
              kompetenzId: kompetenz.id,
              themaId: thema.id,
              modus: sp.modus,
              inhalt: sp.inhalt,
              inhaltIdx: idx,
              ...formData
            })}
          />
        );
      })}

      {/* Alle weiteren Sprachmodi (die nicht als Pflicht definiert sind) */}
      {(() => {
        // IDs der Pflicht-Sprachmodi für diese Kompetenz
        const pflichtModusIds = kompetenz.sprachmpiPflicht.map(sp => sp.modus);
        // Alle 9 Sprachmodi, die NICHT Pflicht sind
        const weitereSprachmodi = sprachmodi.filter(sm => !pflichtModusIds.includes(sm.id));

        if (weitereSprachmodi.length === 0) return null;

        return (
          <div className="mt-3">
            <p className="text-xs text-purple-600 font-medium mb-2">
              <Sparkles className="w-3 h-3 inline mr-1" />
              Weitere Sprachmodi (optional - {weitereSprachmodi.length} verfügbar):
            </p>
            {weitereSprachmodi.map((modus, idx) => {
              const optionalCount = existingEntries.filter(e =>
                e.type === 'sprachmodus' &&
                e.kompetenzId === kompetenz.id &&
                e.modus === modus.id &&
                e.isOptional === true
              ).length;
              return (
                <ClickableInhalt
                  key={`sprache-opt-${modus.id}`}
                  type="sprachmodus"
                  label={modus.label}
                  code={modus.code}
                  inhalt="(Zusätzlicher Sprachmodus - freiwillig)"
                  bgColor="#F3E8FF"
                  textColor="#7C3AED"
                  icon={MessageSquare}
                  entryCount={optionalCount}
                  onSave={(formData) => onSaveSprachmodus({
                    kompetenzId: kompetenz.id,
                    themaId: thema.id,
                    modus: modus.id,
                    inhalt: `Zusätzlicher Sprachmodus: ${modus.label}`,
                    inhaltIdx: idx,
                    isOptional: true,
                    ...formData
                  })}
                />
              );
            })}
          </div>
        );
      })()}

      {/* Schlüsselkompetenzen des Themas - klickbar */}
      {thema.schluesselkompetenzen && thema.schluesselkompetenzen.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium mb-2" style={{ color: uiColors.schluessel.text }}>
            <Target className="w-3 h-3 inline mr-1" />
            Schlüsselkompetenzen (Pflicht):
          </p>
          {thema.schluesselkompetenzen.map(skId => {
            const sk = getSchluesselkompetenzById(skId);
            return (
              <ClickableInhalt
                key={`schluessel-${skId}`}
                type="schluesselkompetenz"
                label={sk?.code || skId}
                inhalt={sk?.label || ''}
                bgColor={uiColors.schluessel.bg}
                textColor={uiColors.schluessel.text}
                icon={Target}
                entryCount={getSchluesselCount(skId)}
                onSave={(formData) => onSaveSchluessel({
                  kompetenzId: kompetenz.id,
                  themaId: thema.id,
                  schluesselkompetenzId: skId,
                  ...formData
                })}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

// Transversale Themen Section
const TransversaleThemenSection = ({ thema, entries, onSave }) => {
  const [expanded, setExpanded] = useState({});
  const [formData, setFormData] = useState({});

  const toggleExpand = (ttId) => {
    setExpanded(prev => ({ ...prev, [ttId]: !prev[ttId] }));
  };

  const handleSave = (ttId) => {
    const data = formData[ttId] || { howMethod: '', howCount: 1, note: '' };
    if (!data.howMethod) {
      alert('Bitte wähle eine Methode aus.');
      return;
    }
    onSave({
      type: 'transversal',
      transversalId: ttId,
      themaId: thema.id,
      ...data
    });
    setFormData(prev => ({ ...prev, [ttId]: { howMethod: '', howCount: 1, note: '' } }));
    setExpanded(prev => ({ ...prev, [ttId]: false }));
  };

  return (
    <div
      className="p-4 rounded-lg mt-4"
      style={{ backgroundColor: uiColors.transversal.bg, borderColor: uiColors.transversal.border, borderWidth: 1 }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5" style={{ color: uiColors.transversal.text }} />
        <h4 className="font-semibold" style={{ color: uiColors.transversal.text }}>
          Transversale Themen (Freiwillig)
        </h4>
      </div>

      <div className="flex flex-wrap gap-2">
        {transversaleThemen.map(tt => {
          const ttEntries = entries.filter(e => e.transversalId === tt.id && e.themaId === thema.id);
          const isExpanded = expanded[tt.id];
          const data = formData[tt.id] || { howMethod: '', howCount: 1, note: '' };

          return (
            <div key={tt.id} className="flex-1 min-w-[200px]">
              <div
                className="bg-white rounded-lg border p-3"
                style={{ borderColor: tt.color + '40' }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: tt.color }}
                    />
                    <span className="text-sm font-medium">{tt.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {ttEntries.length > 0 && (
                      <span
                        className="px-2 py-0.5 text-xs rounded-full"
                        style={{ backgroundColor: tt.color + '20', color: tt.color }}
                      >
                        {ttEntries.length}×
                      </span>
                    )}
                    <button
                      onClick={() => toggleExpand(tt.id)}
                      className="px-2 py-1 text-white text-xs rounded"
                      style={{ backgroundColor: tt.color }}
                    >
                      {isExpanded ? '−' : '+'}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t space-y-2">
                    <select
                      value={data.howMethod}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        [tt.id]: { ...data, howMethod: e.target.value }
                      }))}
                      className="w-full px-2 py-1.5 border rounded text-sm"
                    >
                      <option value="">Wie?</option>
                      {HOW_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Wie oft?</span>
                      <Counter
                        value={data.howCount}
                        onChange={(val) => setFormData(prev => ({
                          ...prev,
                          [tt.id]: { ...data, howCount: val }
                        }))}
                        min={1}
                        max={10}
                      />
                    </div>
                    <button
                      onClick={() => handleSave(tt.id)}
                      className="w-full py-1.5 text-white text-sm rounded"
                      style={{ backgroundColor: tt.color }}
                    >
                      Speichern
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Thema Card
const ThemaCard = ({ thema, entries, onSaveGesellschaft, onSaveSprachmodus, onSaveSchluessel, onSaveTransversal }) => {
  const farben = themenFarben[thema.id] || { bg: '#F3F4F6', text: '#374151' };

  return (
    <Accordion
      title={`Thema ${thema.order}: ${thema.title}`}
      headerBg=""
      icon={<div className="w-3 h-3 rounded-full" style={{ backgroundColor: thema.color }} />}
      badge={`${thema.lektionen} Lekt.`}
      defaultOpen={false}
    >
      <div style={{ borderLeft: `4px solid ${thema.color}`, paddingLeft: '1rem' }}>
        {/* Lebensbezüge */}
        {thema.lebensbezuege.map((lb, lbIdx) => (
          <Accordion
            key={lb.id}
            title={lb.title}
            headerBg="bg-gray-50"
            icon={<Users className="w-4 h-4 text-gray-500" />}
            defaultOpen={false}
          >
            {/* Kompetenzen */}
            {lb.kompetenzen.map(komp => (
              <KompetenzCard
                key={komp.id}
                kompetenz={komp}
                thema={thema}
                existingEntries={entries}
                onSaveGesellschaft={onSaveGesellschaft}
                onSaveSprachmodus={onSaveSprachmodus}
                onSaveSchluessel={onSaveSchluessel}
              />
            ))}
          </Accordion>
        ))}

        {/* Transversale Themen */}
        <TransversaleThemenSection
          thema={thema}
          entries={entries}
          onSave={onSaveTransversal}
        />
      </div>
    </Accordion>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
// Helper: Finde Kompetenz nach ID
const findKompetenzById = (kompetenzId) => {
  for (const thema of themen) {
    for (const lb of thema.lebensbezuege) {
      for (const komp of lb.kompetenzen) {
        if (komp.id === kompetenzId) {
          return { kompetenz: komp, thema, lebensbezug: lb };
        }
      }
    }
  }
  return null;
};

// Eintrag-Detailansicht Komponente
const EntryDetailCard = ({ entry, onDelete }) => {
  const statusLabel = STATUS_OPTIONS.find(s => s.id === entry.status)?.label || entry.status;
  const statusColor = STATUS_OPTIONS.find(s => s.id === entry.status)?.color || '#F3F4F6';
  const thema = themen.find(t => t.id === entry.themaId);

  // Gesellschaft-Eintrag
  if (entry.type === 'gesellschaft' && entry.kompetenzId) {
    const found = findKompetenzById(entry.kompetenzId);
    const bereichInfo = getGesellschaftsinhaltById(entry.bereich);

    return (
      <div className="bg-white border rounded-lg p-4 mb-3 shadow-sm" style={{ borderLeftColor: uiColors.gesellschaft.text, borderLeftWidth: 4 }}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4" style={{ color: uiColors.gesellschaft.text }} />
              <span className="text-xs font-medium" style={{ color: uiColors.gesellschaft.text }}>Gesellschaftsinhalt</span>
              {thema && <span className="text-xs text-gray-400">• Thema {thema.order}</span>}
            </div>
            <p className="text-xs font-medium" style={{ color: uiColors.gesellschaft.text }}>{bereichInfo?.label || entry.bereich}</p>
            <p className="text-sm text-gray-800 mt-1">{entry.inhalt}</p>
            {found && <p className="text-xs text-gray-400 mt-2">Kompetenz: {found.kompetenz.text.substring(0, 80)}...</p>}

            <div className="mt-3 pt-3 border-t flex flex-wrap gap-3 text-xs">
              <span className="px-2 py-1 rounded" style={{ backgroundColor: statusColor }}>{statusLabel}</span>
              <span className="text-gray-600">Wie: <strong>{entry.howMethod}</strong></span>
              <span className="text-gray-600">Anzahl: <strong>{entry.howCount}×</strong></span>
              {entry.createdAt && <span className="text-gray-400">{entry.createdAt.toLocaleDateString('de-CH')}</span>}
            </div>
          </div>
          <button onClick={() => onDelete(entry.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Sprachmodus-Eintrag
  if (entry.type === 'sprachmodus' && entry.kompetenzId) {
    const found = findKompetenzById(entry.kompetenzId);
    const modusInfo = getSprachmodusById(entry.modus);

    return (
      <div className="bg-white border rounded-lg p-4 mb-3 shadow-sm" style={{ borderLeftColor: uiColors.sprache.text, borderLeftWidth: 4 }}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4" style={{ color: uiColors.sprache.text }} />
              <span className="text-xs font-medium" style={{ color: uiColors.sprache.text }}>Sprachmodus</span>
              {thema && <span className="text-xs text-gray-400">• Thema {thema.order}</span>}
            </div>
            <p className="text-xs font-medium" style={{ color: uiColors.sprache.text }}>
              {modusInfo?.label || entry.modus} {modusInfo?.code && `(${modusInfo.code})`}
            </p>
            <p className="text-sm text-gray-800 mt-1">{entry.inhalt}</p>
            {found && <p className="text-xs text-gray-400 mt-2">Kompetenz: {found.kompetenz.text.substring(0, 80)}...</p>}

            <div className="mt-3 pt-3 border-t flex flex-wrap gap-3 text-xs">
              <span className="px-2 py-1 rounded" style={{ backgroundColor: statusColor }}>{statusLabel}</span>
              <span className="text-gray-600">Wie: <strong>{entry.howMethod}</strong></span>
              <span className="text-gray-600">Anzahl: <strong>{entry.howCount}×</strong></span>
              {entry.createdAt && <span className="text-gray-400">{entry.createdAt.toLocaleDateString('de-CH')}</span>}
            </div>
          </div>
          <button onClick={() => onDelete(entry.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Schlüsselkompetenz-Eintrag
  if (entry.type === 'schluesselkompetenz' && entry.schluesselkompetenzId) {
    const sk = getSchluesselkompetenzById(entry.schluesselkompetenzId);
    const thema = themen.find(t => t.id === entry.themaId);

    return (
      <div className="bg-white border rounded-lg p-4 mb-3 shadow-sm" style={{ borderLeftColor: uiColors.schluessel.text, borderLeftWidth: 4 }}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4" style={{ color: uiColors.schluessel.text }} />
              <span className="text-xs font-medium" style={{ color: uiColors.schluessel.text }}>Schlüsselkompetenz</span>
              {thema && (
                <span className="text-xs text-gray-400">• Thema {thema.order}</span>
              )}
            </div>
            <p className="text-xs font-mono text-gray-500">{sk?.code}</p>
            <p className="text-sm font-medium text-gray-800">{sk?.label}</p>

            <div className="mt-3 pt-3 border-t flex flex-wrap gap-3 text-xs">
              <span className="text-gray-600">Wie: <strong>{entry.howMethod}</strong></span>
              <span className="text-gray-600">Anzahl: <strong>{entry.howCount}×</strong></span>
              {entry.createdAt && (
                <span className="text-gray-400">
                  {entry.createdAt.toLocaleDateString('de-CH')}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => onDelete(entry.id)}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Transversales Thema-Eintrag
  if (entry.type === 'transversal' && entry.transversalId) {
    const tt = transversaleThemen.find(t => t.id === entry.transversalId);
    const thema = themen.find(t => t.id === entry.themaId);

    return (
      <div className="bg-white border rounded-lg p-4 mb-3 shadow-sm" style={{ borderLeftColor: tt?.color || '#7C3AED', borderLeftWidth: 4 }}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4" style={{ color: tt?.color || '#7C3AED' }} />
              <span className="text-xs font-medium" style={{ color: tt?.color || '#7C3AED' }}>Transversales Thema</span>
              {thema && (
                <span className="text-xs text-gray-400">• Thema {thema.order}</span>
              )}
            </div>
            <p className="text-sm font-medium text-gray-800">{tt?.label}</p>

            <div className="mt-3 pt-3 border-t flex flex-wrap gap-3 text-xs">
              <span className="text-gray-600">Wie: <strong>{entry.howMethod}</strong></span>
              <span className="text-gray-600">Anzahl: <strong>{entry.howCount}×</strong></span>
              {entry.createdAt && (
                <span className="text-gray-400">
                  {entry.createdAt.toLocaleDateString('de-CH')}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => onDelete(entry.id)}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default function LearnerPracticeEBA() {
  const { signOut, userData, currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('ueben'); // ueben | eintraege | zirkularitaet
  const [activeLehrjahr, setActiveLehrjahr] = useState(1);
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState([]);

  // Load entries - ohne orderBy um Index-Fehler zu vermeiden
  const loadEntries = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'practiceEntriesEBA'),
        where('learnerId', '==', currentUser.uid)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate?.() || null
      }));
      // Sortiere lokal nach createdAt (neueste zuerst)
      data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setEntries(data);
    } catch (err) {
      console.error('Error loading entries:', err);
    } finally {
      setLoading(false);
    }
  };

  // Delete entry
  const handleDeleteEntry = async (entryId) => {
    if (!confirm('Eintrag wirklich löschen?')) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'practiceEntriesEBA', entryId));
      await loadEntries();
    } catch (err) {
      alert('Fehler: ' + (err?.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, [currentUser]);

  // Generischer Save-Handler
  const saveEntry = async (data) => {
    if (!currentUser) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'practiceEntriesEBA'), {
        learnerId: currentUser.uid,
        teacherId: userData?.teacherId || null,
        classId: userData?.classId || null,
        ...data,
        createdAt: Timestamp.now()
      });
      await loadEntries();
    } catch (err) {
      alert('Fehler: ' + (err?.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  // Save handlers für verschiedene Typen
  const handleSaveGesellschaft = async (data) => {
    await saveEntry({ type: 'gesellschaft', ...data });
  };

  const handleSaveSprachmodus = async (data) => {
    await saveEntry({ type: 'sprachmodus', ...data });
  };

  const handleSaveSchluessel = async (data) => {
    await saveEntry({ type: 'schluesselkompetenz', ...data });
  };

  const handleSaveTransversal = async (data) => {
    await saveEntry({ type: 'transversal', ...data });
  };

  // Get themes for current Lehrjahr
  const currentThemen = getThemenByLehrjahr(activeLehrjahr);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/LogoABU_DNA.png" alt="ABU Logo" className="h-10 w-10 object-contain" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">stud-i-agency · ABU EBA</h1>
              <p className="text-sm text-gray-600">
                {userData?.name || userData?.displayName || 'Lernende:r'}
              </p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
          >
            <LogOut className="w-4 h-4" />
            Abmelden
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Hauptnavigation */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveTab('ueben')}
            className={`px-4 py-2 rounded-lg border flex items-center gap-2 transition-colors ${
              activeTab === 'ueben'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white hover:bg-gray-50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Üben erfassen
          </button>
          <button
            onClick={() => setActiveTab('eintraege')}
            className={`px-4 py-2 rounded-lg border flex items-center gap-2 transition-colors ${
              activeTab === 'eintraege'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white hover:bg-gray-50'
            }`}
          >
            <ListChecks className="w-4 h-4" />
            Meine Einträge ({entries.length})
          </button>
          <button
            onClick={() => setActiveTab('zirkularitaet')}
            className={`px-4 py-2 rounded-lg border flex items-center gap-2 transition-colors ${
              activeTab === 'zirkularitaet'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white hover:bg-gray-50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Zirkularität
          </button>
        </div>

        {/* Üben Tab */}
        {activeTab === 'ueben' && (
          <>
            {/* Lehrjahr Tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setActiveLehrjahr(1)}
                className={`flex-1 py-3 rounded-lg border font-medium transition-colors ${
                  activeLehrjahr === 1
                    ? 'bg-cyan-600 text-white border-cyan-600'
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
                1. Lehrjahr (Themen 1–4)
              </button>
              <button
                onClick={() => setActiveLehrjahr(2)}
                className={`flex-1 py-3 rounded-lg border font-medium transition-colors ${
                  activeLehrjahr === 2
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
                2. Lehrjahr (Themen 5–8)
              </button>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Wie funktioniert das Erfassen?</p>
                  <ul className="list-disc ml-4 space-y-1 text-blue-700">
                    <li>Öffne ein <strong>Thema</strong> und dann einen <strong>Lebensbezug</strong></li>
                    <li>Klicke auf jeden einzelnen Inhalt (<span style={{ color: uiColors.gesellschaft.text }}>Gesellschaft</span>, <span style={{ color: uiColors.sprache.text }}>Sprache</span>, <span style={{ color: uiColors.schluessel.text }}>Schlüsselkompetenz</span>) um ihn zu erfassen</li>
                    <li><strong>Transversale Themen</strong> (Digitalisierung, Nachhaltigkeit, Chancengerechtigkeit) sind am Ende jedes Themas</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Themen */}
            {loading ? (
              <div className="text-center py-12 text-gray-500">Lade...</div>
            ) : (
              <div className="space-y-3">
                {currentThemen.map(thema => (
                  <ThemaCard
                    key={thema.id}
                    thema={thema}
                    entries={entries}
                    onSaveGesellschaft={handleSaveGesellschaft}
                    onSaveSprachmodus={handleSaveSprachmodus}
                    onSaveSchluessel={handleSaveSchluessel}
                    onSaveTransversal={handleSaveTransversal}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Meine Einträge Tab */}
        {activeTab === 'eintraege' && (
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h2 className="text-lg font-bold mb-4">Meine Einträge</h2>

            {loading ? (
              <p className="text-gray-500">Lade...</p>
            ) : entries.length === 0 ? (
              <p className="text-gray-500">Noch keine Einträge vorhanden.</p>
            ) : (
              <div className="space-y-2">
                {/* Statistik */}
                <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b">
                  <span className="px-2 py-1 text-xs rounded" style={{ backgroundColor: uiColors.gesellschaft.bg, color: uiColors.gesellschaft.text }}>
                    {entries.filter(e => e.type === 'gesellschaft').length} Gesellschaft
                  </span>
                  <span className="px-2 py-1 text-xs rounded" style={{ backgroundColor: uiColors.sprache.bg, color: uiColors.sprache.text }}>
                    {entries.filter(e => e.type === 'sprachmodus').length} Sprachmodi
                  </span>
                  <span className="px-2 py-1 text-xs rounded" style={{ backgroundColor: uiColors.schluessel.bg, color: uiColors.schluessel.text }}>
                    {entries.filter(e => e.type === 'schluesselkompetenz').length} Schlüsselkomp.
                  </span>
                  <span className="px-2 py-1 text-xs rounded bg-purple-100 text-purple-700">
                    {entries.filter(e => e.type === 'transversal').length} Transversal
                  </span>
                </div>

                {/* Einträge */}
                {entries.map(entry => (
                  <EntryDetailCard
                    key={entry.id}
                    entry={entry}
                    onDelete={handleDeleteEntry}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Zirkularität Tab */}
        {activeTab === 'zirkularitaet' && (
          <ZirkularitaetDashboard entries={entries} />
        )}
      </div>
    </div>
  );
}
