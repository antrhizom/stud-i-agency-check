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
// STATUS OPTIONS
// ============================================
const STATUS_OPTIONS = [
  { id: 'geuebt', label: 'geübt', color: '#FEF3C7' },
  { id: 'verbessert', label: 'verbessert', color: '#DBEAFE' },
  { id: 'erreicht', label: 'erreicht', color: '#DCFCE7' }
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

// Kompetenz Card mit Erfassung
const KompetenzCard = ({ kompetenz, themaId, onSave, existingEntries = [] }) => {
  const [expanded, setExpanded] = useState(false);
  const [formData, setFormData] = useState({
    status: 'geuebt',
    howMethod: '',
    howCount: 1,
    note: '',
    optionalSprachmodi: []
  });

  const totalEntries = existingEntries.filter(e => e.kompetenzId === kompetenz.id).length;

  const handleSubmit = () => {
    if (!formData.howMethod) {
      alert('Bitte wähle eine Methode aus.');
      return;
    }
    onSave({
      kompetenzId: kompetenz.id,
      themaId,
      ...formData
    });
    setFormData({
      status: 'geuebt',
      howMethod: '',
      howCount: 1,
      note: '',
      optionalSprachmodi: []
    });
    setExpanded(false);
  };

  const toggleOptionalModus = (modusId) => {
    setFormData(prev => ({
      ...prev,
      optionalSprachmodi: prev.optionalSprachmodi.includes(modusId)
        ? prev.optionalSprachmodi.filter(id => id !== modusId)
        : [...prev.optionalSprachmodi, modusId]
    }));
  };

  return (
    <div className="border rounded-lg p-4 mb-3 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-sm text-gray-800 font-medium">{kompetenz.text}</p>

          {/* Gesellschaftliche Inhalte */}
          <div className="mt-3">
            {kompetenz.gesellschaft.map((g, idx) => {
              const bereichInfo = getGesellschaftsinhaltById(g.bereich);
              return (
                <div
                  key={idx}
                  className="mt-2 p-2 rounded-lg text-sm"
                  style={{ backgroundColor: uiColors.gesellschaft.bg }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen className="w-4 h-4" style={{ color: uiColors.gesellschaft.text }} />
                    <span className="font-medium" style={{ color: uiColors.gesellschaft.text }}>
                      {bereichInfo?.label || g.bereich}
                    </span>
                  </div>
                  <p className="text-gray-700 text-xs">{g.inhalt}</p>
                </div>
              );
            })}
          </div>

          {/* Sprachmodi Pflicht */}
          <div className="mt-2">
            {kompetenz.sprachmpiPflicht.map((sp, idx) => {
              const modusInfo = getSprachmodusById(sp.modus);
              return (
                <div
                  key={idx}
                  className="mt-2 p-2 rounded-lg text-sm"
                  style={{ backgroundColor: uiColors.sprache.bg }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="w-4 h-4" style={{ color: uiColors.sprache.text }} />
                    <span className="font-medium" style={{ color: uiColors.sprache.text }}>
                      {modusInfo?.label || sp.modus}
                    </span>
                  </div>
                  <p className="text-gray-700 text-xs">{sp.inhalt}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {totalEntries > 0 && (
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
              {totalEntries}× geübt
            </span>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            {expanded ? 'Schliessen' : 'Erfassen'}
          </button>
        </div>
      </div>

      {/* Erfassungs-Formular */}
      {expanded && (
        <div className="mt-4 pt-4 border-t space-y-4">
          {/* Optionale Sprachmodi */}
          {kompetenz.sprachmodiOptional && kompetenz.sprachmodiOptional.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                Zusätzliche Sprachmodi (freiwillig)
              </label>
              <div className="flex flex-wrap gap-2">
                {kompetenz.sprachmodiOptional.map(modusId => {
                  const modus = getSprachmodusById(modusId);
                  const isSelected = formData.optionalSprachmodi.includes(modusId);
                  return (
                    <button
                      key={modusId}
                      type="button"
                      onClick={() => toggleOptionalModus(modusId)}
                      className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                        isSelected
                          ? 'bg-green-100 border-green-400 text-green-700'
                          : 'bg-white border-gray-300 text-gray-600 hover:border-green-300'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                      {modus?.label || modusId}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Status */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Status</label>
            <div className="flex gap-2">
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, status: opt.id }))}
                  className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                    formData.status === opt.id
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: opt.color }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Wie geübt */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Wie geübt?</label>
              <select
                value={formData.howMethod}
                onChange={(e) => setFormData(prev => ({ ...prev, howMethod: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="">— auswählen —</option>
                {HOW_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Wie oft?</label>
              <Counter
                value={formData.howCount}
                onChange={(val) => setFormData(prev => ({ ...prev, howCount: val }))}
                min={1}
                max={20}
              />
            </div>
          </div>

          {/* Notiz */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Notiz (optional)</label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              rows={2}
              placeholder="Was war schwierig? Was habe ich gelernt?"
            />
          </div>

          {/* Speichern */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
            >
              Eintrag speichern
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Schlüsselkompetenzen Section
const SchluesselkompetenzenSection = ({ thema, entries, onSave }) => {
  const [expanded, setExpanded] = useState({});
  const [formData, setFormData] = useState({});

  const toggleExpand = (skId) => {
    setExpanded(prev => ({ ...prev, [skId]: !prev[skId] }));
  };

  const handleSave = (skId) => {
    const data = formData[skId] || { howMethod: '', howCount: 1, note: '' };
    if (!data.howMethod) {
      alert('Bitte wähle eine Methode aus.');
      return;
    }
    onSave({
      type: 'schluesselkompetenz',
      schluesselkompetenzId: skId,
      themaId: thema.id,
      ...data
    });
    setFormData(prev => ({ ...prev, [skId]: { howMethod: '', howCount: 1, note: '' } }));
    setExpanded(prev => ({ ...prev, [skId]: false }));
  };

  return (
    <div
      className="p-4 rounded-lg mt-4"
      style={{ backgroundColor: uiColors.schluessel.bg, borderColor: uiColors.schluessel.border, borderWidth: 1 }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-5 h-5" style={{ color: uiColors.schluessel.text }} />
        <h4 className="font-semibold" style={{ color: uiColors.schluessel.text }}>
          Schlüsselkompetenzen (Pflicht)
        </h4>
      </div>

      <div className="space-y-2">
        {thema.schluesselkompetenzen.map(skId => {
          const sk = getSchluesselkompetenzById(skId);
          const skEntries = entries.filter(e => e.schluesselkompetenzId === skId && e.themaId === thema.id);
          const isExpanded = expanded[skId];
          const data = formData[skId] || { howMethod: '', howCount: 1, note: '' };

          return (
            <div key={skId} className="bg-white rounded-lg border p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <span className="text-xs font-mono text-gray-500">{sk?.code}</span>
                  <p className="text-sm text-gray-800">{sk?.label}</p>
                </div>
                <div className="flex items-center gap-2">
                  {skEntries.length > 0 && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                      {skEntries.length}×
                    </span>
                  )}
                  <button
                    onClick={() => toggleExpand(skId)}
                    className="px-2 py-1 bg-amber-600 text-white text-xs rounded hover:bg-amber-700"
                  >
                    {isExpanded ? '−' : '+'}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-3 pt-3 border-t space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600">Wie?</label>
                      <select
                        value={data.howMethod}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          [skId]: { ...data, howMethod: e.target.value }
                        }))}
                        className="w-full mt-1 px-2 py-1.5 border rounded text-sm"
                      >
                        <option value="">— wählen —</option>
                        {HOW_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600">Wie oft?</label>
                      <div className="mt-1">
                        <Counter
                          value={data.howCount}
                          onChange={(val) => setFormData(prev => ({
                            ...prev,
                            [skId]: { ...data, howCount: val }
                          }))}
                          min={1}
                          max={10}
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSave(skId)}
                    className="w-full py-1.5 bg-amber-600 text-white text-sm rounded hover:bg-amber-700"
                  >
                    Speichern
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
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
const ThemaCard = ({ thema, entries, onSaveKompetenz, onSaveSchluessel, onSaveTransversal }) => {
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
                themaId={thema.id}
                existingEntries={entries}
                onSave={onSaveKompetenz}
              />
            ))}
          </Accordion>
        ))}

        {/* Schlüsselkompetenzen */}
        <SchluesselkompetenzenSection
          thema={thema}
          entries={entries}
          onSave={onSaveSchluessel}
        />

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

  // Kompetenz-Eintrag
  if (entry.type === 'kompetenz' && entry.kompetenzId) {
    const found = findKompetenzById(entry.kompetenzId);
    if (!found) return null;
    const { kompetenz, thema, lebensbezug } = found;

    return (
      <div className="bg-white border rounded-lg p-4 mb-3 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            {/* Thema & Lebensbezug */}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: thema.color }} />
              <span className="text-xs font-medium text-gray-500">
                Thema {thema.order}: {thema.title}
              </span>
            </div>
            <p className="text-xs text-gray-400 mb-2">{lebensbezug.title}</p>

            {/* Kompetenz */}
            <p className="text-sm font-medium text-gray-800 mb-3">{kompetenz.text}</p>

            {/* Gesellschaftliche Inhalte */}
            {kompetenz.gesellschaft.map((g, idx) => {
              const bereichInfo = getGesellschaftsinhaltById(g.bereich);
              return (
                <div key={idx} className="p-2 rounded-lg text-xs mb-2" style={{ backgroundColor: uiColors.gesellschaft.bg }}>
                  <div className="flex items-center gap-1 mb-1">
                    <BookOpen className="w-3 h-3" style={{ color: uiColors.gesellschaft.text }} />
                    <span className="font-medium" style={{ color: uiColors.gesellschaft.text }}>
                      {bereichInfo?.label || g.bereich}
                    </span>
                  </div>
                  <p className="text-gray-700">{g.inhalt}</p>
                </div>
              );
            })}

            {/* Sprachmodi Pflicht */}
            {kompetenz.sprachmpiPflicht.map((sp, idx) => {
              const modusInfo = getSprachmodusById(sp.modus);
              return (
                <div key={idx} className="p-2 rounded-lg text-xs mb-2" style={{ backgroundColor: uiColors.sprache.bg }}>
                  <div className="flex items-center gap-1 mb-1">
                    <MessageSquare className="w-3 h-3" style={{ color: uiColors.sprache.text }} />
                    <span className="font-medium" style={{ color: uiColors.sprache.text }}>
                      {modusInfo?.label || sp.modus} ({modusInfo?.code})
                    </span>
                  </div>
                  <p className="text-gray-700">{sp.inhalt}</p>
                </div>
              );
            })}

            {/* Optionale Sprachmodi falls gewählt */}
            {entry.optionalSprachmodi && entry.optionalSprachmodi.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                <span className="text-xs text-gray-500">+ Zusätzlich:</span>
                {entry.optionalSprachmodi.map(modusId => {
                  const modus = getSprachmodusById(modusId);
                  return (
                    <span key={modusId} className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700">
                      {modus?.label || modusId}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Erfassungsdetails */}
            <div className="mt-3 pt-3 border-t flex flex-wrap gap-3 text-xs">
              <span className="px-2 py-1 rounded" style={{ backgroundColor: statusColor }}>{statusLabel}</span>
              <span className="text-gray-600">Wie: <strong>{entry.howMethod}</strong></span>
              <span className="text-gray-600">Anzahl: <strong>{entry.howCount}×</strong></span>
              {entry.createdAt && (
                <span className="text-gray-400">
                  {entry.createdAt.toLocaleDateString('de-CH')}
                </span>
              )}
            </div>

            {entry.note && (
              <p className="mt-2 text-xs text-gray-600 italic bg-gray-50 p-2 rounded">{entry.note}</p>
            )}
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

  // Save handlers
  const handleSaveKompetenz = async (data) => {
    if (!currentUser) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'practiceEntriesEBA'), {
        learnerId: currentUser.uid,
        teacherId: userData?.teacherId || null,
        classId: userData?.classId || null,
        type: 'kompetenz',
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

  const handleSaveSchluessel = async (data) => {
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

  const handleSaveTransversal = async (data) => {
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

  // Get themes for current Lehrjahr
  const currentThemen = getThemenByLehrjahr(activeLehrjahr);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">stud-i-agency · ABU EBA</h1>
            <p className="text-sm text-gray-600">
              {userData?.name || userData?.displayName || 'Lernende:r'}
            </p>
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
                    <li>Bei jeder Kompetenz siehst du <span style={{ color: uiColors.gesellschaft.text }}>Gesellschaftsinhalte</span> und <span style={{ color: uiColors.sprache.text }}>Sprachmodi</span></li>
                    <li>Klicke auf "Erfassen" um deine Übung zu dokumentieren</li>
                    <li><strong>Schlüsselkompetenzen</strong> sind Pflicht pro Thema</li>
                    <li><strong>Transversale Themen</strong> (Digitalisierung, Nachhaltigkeit, Chancengerechtigkeit) sind freiwillig</li>
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
                    onSaveKompetenz={handleSaveKompetenz}
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
                {/* Filter */}
                <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b">
                  <span className="text-sm text-gray-500">
                    {entries.filter(e => e.type === 'kompetenz').length} Kompetenzen •{' '}
                    {entries.filter(e => e.type === 'schluesselkompetenz').length} Schlüsselkompetenzen •{' '}
                    {entries.filter(e => e.type === 'transversal').length} Transversale
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
