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
  updateDoc,
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
  Trash2,
  Send,
  CheckCircle,
  Bell
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

const WHERE_OPTIONS = [
  'Im Unterricht',
  'Im Betrieb',
  'Zu Hause',
  'In einer Freistunde',
  'In der Hausaufgabenstunde',
  'Sonstige'
];

const HOW_OPTIONS = [
  'mit einem handlungskompetenzorientierten Produkt',
  'mit digitalen Lernübungen',
  'mit Medienproduktionen',
  'mit Mediengestaltung',
  'mit Reflexion',
  'Sonstige'
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
        <div className="flex items-center gap-2 flex-1">
          {icon && icon}
          <span className="font-medium text-left">{title}</span>
          {badge && (
            <div className="ml-auto mr-2">
              {typeof badge === 'string' ? (
                <span className="px-2 py-0.5 text-xs rounded-full bg-white/50">{badge}</span>
              ) : badge}
            </div>
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
const ClickableInhalt = ({ type, label, code, inhalt, bgColor, textColor, icon: Icon, onSave, entryCount = 0, recentEntries = [] }) => {
  const [showForm, setShowForm] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [formData, setFormData] = useState({
    status: 'kurz',
    howMethod: '',
    howLearned: '',
    note: ''
  });

  const handleSave = () => {
    if (!formData.howMethod) {
      alert('Bitte wähle einen Ort aus.');
      return;
    }
    if (!formData.howLearned) {
      alert('Bitte wähle aus, wie du geübt hast.');
      return;
    }
    onSave(formData);
    // Felder zurücksetzen, Form bleibt offen zur Überprüfung
    setFormData({ status: 'kurz', howMethod: '', howLearned: '', note: '' });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
    // setShowForm(false) bewusst entfernt → Form bleibt offen
  };

  // Notizen aus gespeicherten Einträgen (neueste zuerst, max. 3)
  const savedNotes = recentEntries
    .filter(e => e.note)
    .slice()
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 3);

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

        {/* Gespeicherte Notizen – immer sichtbar, auch wenn Form geschlossen */}
        {savedNotes.length > 0 && (
          <div className="mt-2 space-y-1" onClick={e => e.stopPropagation()}>
            {savedNotes.map((e, i) => (
              <div key={i} className="text-xs bg-white/80 border border-white/60 rounded px-2 py-1.5 flex items-start gap-1.5">
                <span className="shrink-0 text-gray-500">📝</span>
                <span className="flex-1 text-gray-700 italic">{e.note}</span>
                {e.createdAt instanceof Date && (
                  <span className="ml-1 text-gray-400 shrink-0">{e.createdAt.toLocaleDateString('de-CH')}</span>
                )}
              </div>
            ))}
          </div>
        )}
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

          {/* Wo & Wie geübt */}
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[150px]">
              <label className="text-xs text-gray-600 block mb-1">Wo geübt?</label>
              <select
                value={formData.howMethod}
                onChange={(e) => setFormData(prev => ({ ...prev, howMethod: e.target.value }))}
                className="w-full px-2 py-1.5 border rounded text-xs"
              >
                <option value="">— wählen —</option>
                {WHERE_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="text-xs text-gray-600 block mb-1">Wie geübt?</label>
              <select
                value={formData.howLearned}
                onChange={(e) => setFormData(prev => ({ ...prev, howLearned: e.target.value }))}
                className="w-full px-2 py-1.5 border rounded text-xs"
              >
                <option value="">— wählen —</option>
                {HOW_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Notiz pro Kompetenz */}
          <div>
            <label className="text-xs text-gray-600 block mb-1">Notiz zu dieser Kompetenz (optional)</label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
              placeholder="Was habe ich gelernt? Was war schwierig? Was nehme ich mit?"
              className="w-full px-2 py-1.5 border rounded text-xs h-16 resize-none focus:outline-none focus:ring-1 focus:ring-blue-300"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleSave(); }}
              className="px-4 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 font-medium flex items-center gap-1.5"
            >
              Speichern
            </button>
            {savedSuccess && (
              <span className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                <CheckCircle className="w-3.5 h-3.5" /> Gespeichert!
              </span>
            )}
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="ml-auto text-xs text-gray-400 hover:text-gray-600 underline"
            >
              Schliessen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Kompetenz Card mit klickbaren Einzelinhalten
const KompetenzCard = ({ kompetenz, thema, onSaveGesellschaft, onSaveSprachmodus, onSaveSchluessel, existingEntries = [] }) => {
  // Collapse state für optionale Sektionen (standardmässig eingeklappt)
  const [showOptionalSprachmodi, setShowOptionalSprachmodi] = useState(false);
  const [showSchluesselkompetenzen, setShowSchluesselkompetenzen] = useState(false);

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
            recentEntries={existingEntries.filter(e =>
              e.type === 'gesellschaft' &&
              e.kompetenzId === kompetenz.id &&
              e.bereich === g.bereich &&
              e.inhaltIdx === idx
            )}
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
            recentEntries={existingEntries.filter(e =>
              e.type === 'sprachmodus' &&
              e.kompetenzId === kompetenz.id &&
              e.modus === sp.modus &&
              e.inhaltIdx === idx
            )}
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
            <button
              onClick={() => setShowOptionalSprachmodi(!showOptionalSprachmodi)}
              className="flex items-center gap-1 text-xs text-purple-600 font-medium mb-2 hover:text-purple-800"
            >
              {showOptionalSprachmodi ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              <Sparkles className="w-3 h-3" />
              Weitere Sprachmodi (optional - {weitereSprachmodi.length} verfügbar)
            </button>
            {showOptionalSprachmodi && weitereSprachmodi.map((modus, idx) => {
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
                  recentEntries={existingEntries.filter(e =>
                    e.type === 'sprachmodus' &&
                    e.kompetenzId === kompetenz.id &&
                    e.modus === modus.id &&
                    e.isOptional === true
                  )}
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
          <button
            onClick={() => setShowSchluesselkompetenzen(!showSchluesselkompetenzen)}
            className="flex items-center gap-1 text-xs font-medium mb-2 hover:opacity-80"
            style={{ color: uiColors.schluessel.text }}
          >
            {showSchluesselkompetenzen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            <Target className="w-3 h-3" />
            Schlüsselkompetenzen (Pflicht - {thema.schluesselkompetenzen.length})
          </button>
          {showSchluesselkompetenzen && thema.schluesselkompetenzen.map(skId => {
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
                recentEntries={existingEntries.filter(e =>
                  e.type === 'schluesselkompetenz' &&
                  e.kompetenzId === kompetenz.id &&
                  e.schluesselkompetenzId === skId
                )}
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
    const data = formData[ttId] || { howMethod: '', howLearned: '', note: '' };
    if (!data.howMethod) {
      alert('Bitte wähle einen Ort aus.');
      return;
    }
    if (!data.howLearned) {
      alert('Bitte wähle aus, wie du geübt hast.');
      return;
    }
    onSave({
      type: 'transversal',
      transversalId: ttId,
      themaId: thema.id,
      ...data
    });
    setFormData(prev => ({ ...prev, [ttId]: { howMethod: '', howLearned: '', note: '' } }));
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
          const data = formData[tt.id] || { howMethod: '', note: '' };

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
                      <option value="">Wo geübt?</option>
                      {WHERE_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    <select
                      value={data.howLearned || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        [tt.id]: { ...data, howLearned: e.target.value }
                      }))}
                      className="w-full px-2 py-1.5 border rounded text-sm"
                    >
                      <option value="">Wie geübt?</option>
                      {HOW_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
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

  // Berechne Statistiken für dieses Thema
  const themaEntries = entries.filter(e => e.themaId === thema.id);
  const gesellschaftCount = themaEntries.filter(e => e.type === 'gesellschaft').length;
  const sprachCount = themaEntries.filter(e => e.type === 'sprachmodus').length;
  const schluesselCount = themaEntries.filter(e => e.type === 'schluesselkompetenz').length;
  const transversalCount = themaEntries.filter(e => e.type === 'transversal').length;
  const totalCount = themaEntries.length;

  // Stats Badge für Header
  const statsBadge = (
    <div className="flex items-center gap-1 text-xs">
      {totalCount > 0 ? (
        <>
          <span className="px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: uiColors.gesellschaft.text }}>{gesellschaftCount}</span>
          <span className="px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: uiColors.sprache.text }}>{sprachCount}</span>
          <span className="px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: uiColors.schluessel.text }}>{schluesselCount}</span>
          {transversalCount > 0 && <span className="px-1.5 py-0.5 rounded bg-purple-600 text-white">{transversalCount}</span>}
        </>
      ) : (
        <span className="text-gray-400">noch keine Einträge</span>
      )}
    </div>
  );

  return (
    <Accordion
      title={`Thema ${thema.order}: ${thema.title}`}
      headerBg=""
      icon={<div className="w-3 h-3 rounded-full" style={{ backgroundColor: thema.color }} />}
      badge={statsBadge}
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

// Kommentar-Thread für Einträge
const CommentThread = ({ entry, onReply }) => {
  if (!entry.teacherNote) return null;
  const isNew = !entry.learnerReply; // Neu = Lehrperson hat kommentiert, aber keine Antwort
  return (
    <div className="mt-3 space-y-2 pt-3 border-t">
      <div className={`text-sm rounded-lg p-3 ${isNew ? 'bg-amber-100 border-2 border-amber-400' : 'bg-amber-50 border border-amber-200'}`}>
        <div className="flex items-center gap-1.5 mb-1">
          <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
          <span className="text-xs font-semibold text-amber-700">Kommentar der Lehrperson</span>
          {isNew && (
            <span className="ml-auto text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold">Neu</span>
          )}
        </div>
        <p className="text-gray-800 text-sm">{entry.teacherNote}</p>
      </div>
      {entry.learnerReply ? (
        <div className="text-sm bg-blue-50 border border-blue-200 rounded-lg p-3 ml-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Send className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-xs font-semibold text-blue-700">Meine Antwort</span>
          </div>
          <p className="text-gray-800">{entry.learnerReply}</p>
          <button onClick={() => onReply(entry)} className="mt-1 text-xs text-blue-500 hover:text-blue-700">Bearbeiten</button>
        </div>
      ) : (
        <button onClick={() => onReply(entry)} className="ml-4 flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium">
          <Send className="w-3.5 h-3.5" /> Antworten
        </button>
      )}
    </div>
  );
};

// Eintrag-Detailansicht Komponente
const EntryDetailCard = ({ entry, onDelete, onReply }) => {
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
            {entry.note && <div className="mt-2 text-xs bg-gray-50 border rounded p-2 text-gray-700 italic">📝 {entry.note}</div>}

            <div className="mt-3 pt-3 border-t flex flex-wrap gap-3 text-xs">
              <span className="px-2 py-1 rounded" style={{ backgroundColor: statusColor }}>{statusLabel}</span>
              <span className="text-gray-600">Wo: <strong>{entry.howMethod}</strong></span>
              {entry.howLearned && <span className="text-gray-600">Wie: <strong>{entry.howLearned}</strong></span>}
              {entry.createdAt && <span className="text-gray-400">{entry.createdAt.toLocaleDateString('de-CH')}</span>}
            </div>
            <CommentThread entry={entry} onReply={onReply} />
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
            {entry.note && <div className="mt-2 text-xs bg-gray-50 border rounded p-2 text-gray-700 italic">📝 {entry.note}</div>}

            <div className="mt-3 pt-3 border-t flex flex-wrap gap-3 text-xs">
              <span className="px-2 py-1 rounded" style={{ backgroundColor: statusColor }}>{statusLabel}</span>
              <span className="text-gray-600">Wo: <strong>{entry.howMethod}</strong></span>
              {entry.howLearned && <span className="text-gray-600">Wie: <strong>{entry.howLearned}</strong></span>}
              {entry.createdAt && <span className="text-gray-400">{entry.createdAt.toLocaleDateString('de-CH')}</span>}
            </div>
            <CommentThread entry={entry} onReply={onReply} />
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
              {thema && <span className="text-xs text-gray-400">• Thema {thema.order}</span>}
            </div>
            <p className="text-xs font-mono text-gray-500">{sk?.code}</p>
            <p className="text-sm font-medium text-gray-800">{sk?.label}</p>
            {entry.note && <div className="mt-2 text-xs bg-gray-50 border rounded p-2 text-gray-700 italic">📝 {entry.note}</div>}

            <div className="mt-3 pt-3 border-t flex flex-wrap gap-3 text-xs">
              <span className="text-gray-600">Wo: <strong>{entry.howMethod}</strong></span>
              {entry.howLearned && <span className="text-gray-600">Wie: <strong>{entry.howLearned}</strong></span>}
              {entry.createdAt && <span className="text-gray-400">{entry.createdAt.toLocaleDateString('de-CH')}</span>}
            </div>
            <CommentThread entry={entry} onReply={onReply} />
          </div>
          <button onClick={() => onDelete(entry.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded">
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
              {thema && <span className="text-xs text-gray-400">• Thema {thema.order}</span>}
            </div>
            <p className="text-sm font-medium text-gray-800">{tt?.label}</p>
            {entry.note && <div className="mt-2 text-xs bg-gray-50 border rounded p-2 text-gray-700 italic">📝 {entry.note}</div>}

            <div className="mt-3 pt-3 border-t flex flex-wrap gap-3 text-xs">
              <span className="text-gray-600">Wo: <strong>{entry.howMethod}</strong></span>
              {entry.howLearned && <span className="text-gray-600">Wie: <strong>{entry.howLearned}</strong></span>}
              {entry.createdAt && <span className="text-gray-400">{entry.createdAt.toLocaleDateString('de-CH')}</span>}
            </div>
            <CommentThread entry={entry} onReply={onReply} />
          </div>
          <button onClick={() => onDelete(entry.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded">
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

  // Toast & Kommentar-Antwort
  const [saveToast, setSaveToast] = useState(false);
  const [replyEntry, setReplyEntry] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [savingReply, setSavingReply] = useState(false);

  // Filter für "Meine Einträge"
  const [entryFilter, setEntryFilter] = useState(null); // null | 'gesellschaft' | 'sprachmodus' | 'schluesselkompetenz' | 'transversal' | 'comments'

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

  // Generischer Save-Handler – kein setLoading(true), damit ThemaCards nicht unmounten
  const saveEntry = async (data) => {
    if (!currentUser) return;
    try {
      const docRef = await addDoc(collection(db, 'practiceEntriesEBA'), {
        learnerId: currentUser.uid,
        teacherId: userData?.teacherId || null,
        classId: userData?.classId || null,
        ...data,
        createdAt: Timestamp.now()
      });
      // Optimistisch hinzufügen: kein Re-Fetch, keine Akkordeon-Reset
      const newEntry = {
        id: docRef.id,
        learnerId: currentUser.uid,
        teacherId: userData?.teacherId || null,
        classId: userData?.classId || null,
        ...data,
        createdAt: new Date()
      };
      setEntries(prev => [newEntry, ...prev]);
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 2500);
    } catch (err) {
      alert('Fehler: ' + (err?.message || String(err)));
    }
  };

  // Antwort der Lernenden auf Lehrpersonen-Kommentar
  const saveReply = async () => {
    if (!replyEntry) return;
    setSavingReply(true);
    try {
      await updateDoc(doc(db, 'practiceEntriesEBA', replyEntry.id), {
        learnerReply: replyText.trim() || null,
        learnerReplyAt: replyText.trim() ? Timestamp.now() : null
      });
      setEntries(prev =>
        prev.map(e => e.id === replyEntry.id ? { ...e, learnerReply: replyText.trim() || null } : e)
      );
      setReplyEntry(null);
      setReplyText('');
    } finally {
      setSavingReply(false);
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

      {/* Erfolgs-Toast */}
      {saveToast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">Gespeichert!</span>
        </div>
      )}

      {/* Antwort-Modal */}
      {replyEntry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <h3 className="text-lg font-bold mb-1">Antwort auf Lehrpersonen-Kommentar</h3>
            <div className="mb-3 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3">
              <span className="text-xs font-semibold text-amber-700 block mb-1">Kommentar der Lehrperson</span>
              <p className="text-gray-800">{replyEntry.teacherNote}</p>
            </div>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Deine Antwort..."
              className="w-full border rounded-lg px-3 py-2 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
              autoFocus
            />
            <div className="flex gap-2 mt-4">
              <button onClick={() => { setReplyEntry(null); setReplyText(''); }} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Abbrechen</button>
              <button
                onClick={saveReply}
                disabled={savingReply || !replyText.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                {savingReply ? 'Sende…' : 'Senden'}
              </button>
            </div>
          </div>
        </div>
      )}

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
            className={`px-4 py-2 rounded-lg border flex items-center gap-2 relative transition-colors ${
              activeTab === 'eintraege'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white hover:bg-gray-50'
            }`}
          >
            <ListChecks className="w-4 h-4" />
            Meine Einträge ({entries.length})
            {entries.filter(e => e.teacherNote && !e.learnerReply).length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs rounded-full min-w-[1.25rem] h-5 flex items-center justify-center px-1 font-bold">
                {entries.filter(e => e.teacherNote && !e.learnerReply).length}
              </span>
            )}
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

            {/* Notification Banner: neue LP-Kommentare */}
            {entries.filter(e => e.teacherNote && !e.learnerReply).length > 0 && (
              <div className="mb-4 bg-amber-50 border-2 border-amber-400 rounded-xl p-3 flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-sm text-amber-800 font-medium">
                  {entries.filter(e => e.teacherNote && !e.learnerReply).length === 1
                    ? '1 neue Rückmeldung der Lehrperson – bitte antworten!'
                    : `${entries.filter(e => e.teacherNote && !e.learnerReply).length} neue Rückmeldungen der Lehrperson – bitte antworten!`}
                </span>
              </div>
            )}

            {loading ? (
              <p className="text-gray-500">Lade...</p>
            ) : entries.length === 0 ? (
              <p className="text-gray-500">Noch keine Einträge vorhanden.</p>
            ) : (
              <div className="space-y-2">
                {/* Filter-Buttons (gleichzeitig Statistik) */}
                <div className="flex flex-wrap gap-2 mb-1 pb-4 border-b items-center">
                  {[
                    { key: 'gesellschaft', label: 'Gesellschaft', bg: uiColors.gesellschaft.bg, color: uiColors.gesellschaft.text },
                    { key: 'sprachmodus', label: 'Sprachmodi', bg: uiColors.sprache.bg, color: uiColors.sprache.text },
                    { key: 'schluesselkompetenz', label: 'Schlüsselkomp.', bg: uiColors.schluessel.bg, color: uiColors.schluessel.text },
                    { key: 'transversal', label: 'Transversal', bg: '#F3E8FF', color: '#7C3AED' },
                  ].map(f => {
                    const count = entries.filter(e => e.type === f.key).length;
                    const active = entryFilter === f.key;
                    return (
                      <button
                        key={f.key}
                        onClick={() => setEntryFilter(active ? null : f.key)}
                        className={`px-2.5 py-1 text-xs rounded-lg transition-all border-2 ${active ? 'border-gray-700 font-bold shadow-sm scale-105' : 'border-transparent hover:border-gray-300 opacity-85 hover:opacity-100'}`}
                        style={{ backgroundColor: f.bg, color: f.color }}
                        title={active ? 'Filter aufheben' : `Nach ${f.label} filtern`}
                      >
                        {count} {f.label}{active && ' ✕'}
                      </button>
                    );
                  })}
                  {entries.filter(e => e.teacherNote).length > 0 && (
                    <button
                      onClick={() => setEntryFilter(entryFilter === 'comments' ? null : 'comments')}
                      className={`px-2.5 py-1 text-xs rounded-lg transition-all border-2 flex items-center gap-1 ${entryFilter === 'comments' ? 'border-gray-700 font-bold shadow-sm scale-105' : 'border-transparent hover:border-gray-300 opacity-85 hover:opacity-100'} bg-amber-100 text-amber-800`}
                      title={entryFilter === 'comments' ? 'Filter aufheben' : 'Nur Einträge mit LP-Rückmeldung'}
                    >
                      <MessageSquare className="w-3 h-3" />
                      {entries.filter(e => e.teacherNote).length} Rückmeldungen{entryFilter === 'comments' && ' ✕'}
                    </button>
                  )}
                  {entryFilter && (
                    <button
                      onClick={() => setEntryFilter(null)}
                      className="px-2.5 py-1 text-xs rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300"
                    >
                      Alle anzeigen
                    </button>
                  )}
                </div>

                {/* Einträge – gefiltert, mit Highlight für ungelesene LP-Kommentare */}
                {(() => {
                  const filtered = entryFilter === 'comments'
                    ? entries.filter(e => e.teacherNote)
                    : entryFilter
                      ? entries.filter(e => e.type === entryFilter)
                      : entries;
                  if (filtered.length === 0) {
                    return <p className="text-gray-400 text-sm py-4 text-center">Keine Einträge in dieser Kategorie.</p>;
                  }
                  return filtered.map(entry => (
                    <div key={entry.id} className={entry.teacherNote && !entry.learnerReply ? 'ring-2 ring-amber-400 rounded-lg' : ''}>
                      <EntryDetailCard
                        entry={entry}
                        onDelete={handleDeleteEntry}
                        onReply={(e) => { setReplyEntry(e); setReplyText(e.learnerReply || ''); }}
                      />
                    </div>
                  ));
                })()}
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
