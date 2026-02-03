import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
  Timestamp
} from 'firebase/firestore';
import {
  themes,
  animalSymbols,
  generateUniqueAnimalSymbols,
  generateCode,
  allLanguageModes,
  allKeySkills,
  getThemeLanguageModes,
  getThemeKeySkills
} from '../../data/curriculum';
import { exportLearnersCSV } from '../../utils/csvExport';
import { LogOut, Users, Plus, Copy, Download, MessageSquare, Eye } from 'lucide-react';

function ymd(d) {
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toISOString().split('T')[0];
}

export default function TeacherDashboard() {
  const { signOut, currentUser, userData } = useAuth();

  const [activeTab, setActiveTab] = useState('classes');
  const [classes, setClasses] = useState([]);
  const [learnerCodes, setLearnerCodes] = useState([]); // Alle learnerCodes-Dokumente
  const [learners, setLearners] = useState([]); // Registrierte Lernende (users)

  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedLearnerId, setSelectedLearnerId] = useState('');
  const [practiceEntries, setPracticeEntries] = useState([]);

  // UI: Klasse erstellen
  const [newClassName, setNewClassName] = useState('');
  const [newLearnerCount, setNewLearnerCount] = useState(10);
  const [creatingClass, setCreatingClass] = useState(false);

  // UI: Codes anzeigen Modal
  const [showCodesModal, setShowCodesModal] = useState(false);
  const [viewClassId, setViewClassId] = useState('');

  // UI: Notiz auf Eintrag
  const [noteEntryId, setNoteEntryId] = useState('');
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Load classes + learnerCodes + learners
  useEffect(() => {
    if (!currentUser) return;

    const load = async () => {
      // Klassen laden
      const cq = query(collection(db, 'classes'), where('teacherId', '==', currentUser.uid), orderBy('createdAt', 'desc'));
      const cs = await getDocs(cq);
      const cls = cs.docs.map(d => ({ id: d.id, ...d.data() }));
      setClasses(cls);
      if (!selectedClassId && cls.length) setSelectedClassId(cls[0].id);

      // LearnerCodes laden
      const lcq = query(collection(db, 'learnerCodes'), where('teacherId', '==', currentUser.uid));
      const lcs = await getDocs(lcq);
      const codes = lcs.docs.map(d => ({ id: d.id, ...d.data() }));
      setLearnerCodes(codes);

      // Registrierte Lernende laden
      const lq = query(collection(db, 'users'), where('role', '==', 'learner'), where('teacherId', '==', currentUser.uid));
      const ls = await getDocs(lq);
      const lrn = ls.docs.map(d => ({ id: d.id, ...d.data() }));
      lrn.sort((a, b) => (a.animalName || a.name || '').localeCompare(b.animalName || b.name || ''));
      setLearners(lrn);
      if (!selectedLearnerId && lrn.length) setSelectedLearnerId(lrn[0].id);
    };

    load().catch(console.error);
  }, [currentUser]);

  // Load practice entries for selected learner
  useEffect(() => {
    if (!selectedLearnerId) {
      setPracticeEntries([]);
      return;
    }

    const load = async () => {
      const pq = query(
        collection(db, 'practiceEntries'),
        where('learnerId', '==', selectedLearnerId),
        orderBy('createdAt', 'desc')
      );
      const ps = await getDocs(pq);
      const data = ps.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate?.() ? d.data().createdAt.toDate() : null
      }));
      setPracticeEntries(data);
    };

    load().catch(console.error);
  }, [selectedLearnerId]);

  const learnerCodesByClass = useMemo(() => {
    const map = {};
    for (const lc of learnerCodes) {
      const cid = lc.classId || 'ohne-klasse';
      map[cid] = map[cid] || [];
      map[cid].push(lc);
    }
    return map;
  }, [learnerCodes]);

  const selectedLearner = useMemo(() => learners.find(l => l.id === selectedLearnerId) || null, [learners, selectedLearnerId]);

  const themeById = useMemo(() => {
    const m = {};
    for (const t of themes) m[t.id] = t;
    return m;
  }, []);

  // Klasse mit Tiersymbolen erstellen
  const createClass = async () => {
    if (!newClassName.trim() || !currentUser) return;
    if (newLearnerCount < 1 || newLearnerCount > 30) {
      alert('Bitte zwischen 1 und 30 Lernende angeben.');
      return;
    }

    setCreatingClass(true);
    try {
      // 1. Klasse erstellen
      const classRef = await addDoc(collection(db, 'classes'), {
        name: newClassName.trim(),
        teacherId: currentUser.uid,
        learnerCount: newLearnerCount,
        createdAt: Timestamp.now()
      });

      // 2. Einzigartige Tiersymbole generieren
      const animals = generateUniqueAnimalSymbols(newLearnerCount);

      // 3. Für jedes Tier einen Code erstellen
      const newCodes = [];
      for (const animal of animals) {
        const code = generateCode();
        const codeDoc = await addDoc(collection(db, 'learnerCodes'), {
          code,
          animalId: animal.id,
          animalEmoji: animal.emoji,
          animalName: animal.name,
          teacherId: currentUser.uid,
          classId: classRef.id,
          used: false,
          userId: null,
          createdAt: Timestamp.now()
        });
        newCodes.push({
          id: codeDoc.id,
          code,
          animalId: animal.id,
          animalEmoji: animal.emoji,
          animalName: animal.name,
          classId: classRef.id,
          teacherId: currentUser.uid,
          used: false
        });
      }

      // State aktualisieren
      const newClass = {
        id: classRef.id,
        name: newClassName.trim(),
        teacherId: currentUser.uid,
        learnerCount: newLearnerCount,
        createdAt: new Date()
      };
      setClasses(prev => [newClass, ...prev]);
      setLearnerCodes(prev => [...prev, ...newCodes]);
      setSelectedClassId(classRef.id);
      setNewClassName('');
      setNewLearnerCount(10);

      // Automatisch Codes anzeigen
      setViewClassId(classRef.id);
      setShowCodesModal(true);
    } finally {
      setCreatingClass(false);
    }
  };

  const viewCodes = (classId) => {
    setViewClassId(classId);
    setShowCodesModal(true);
  };

  const copyCode = async (code) => {
    await navigator.clipboard.writeText(code);
    alert('Code kopiert!');
  };

  const copyAllCodes = async () => {
    const codes = learnerCodesByClass[viewClassId] || [];
    const text = codes.map(c => `${c.animalEmoji} ${c.animalName}: ${c.code}`).join('\n');
    await navigator.clipboard.writeText(text);
    alert('Alle Codes kopiert!');
  };

  const downloadCSV = () => {
    const codes = learnerCodesByClass[viewClassId] || [];
    const cls = classes.find(c => c.id === viewClassId);
    exportLearnersCSV(codes, cls?.name || 'Klasse');
  };

  const startNote = (entry) => {
    setNoteEntryId(entry.id);
    setNoteText(entry.teacherNote || '');
  };

  const saveNote = async () => {
    if (!noteEntryId) return;
    setSavingNote(true);
    try {
      await updateDoc(doc(db, 'practiceEntries', noteEntryId), {
        teacherNote: noteText.trim() || null,
        teacherNoteAt: noteText.trim() ? Timestamp.now() : null
      });
      setPracticeEntries(prev => prev.map(e => e.id === noteEntryId ? { ...e, teacherNote: noteText.trim() || null } : e));
      setNoteEntryId('');
      setNoteText('');
    } finally {
      setSavingNote(false);
    }
  };

  const filteredLearners = useMemo(() => {
    if (!selectedClassId) return learners;
    return learners.filter(l => l.classId === selectedClassId);
  }, [learners, selectedClassId]);

  // Einträge nach Thema gruppieren
  const entriesByTheme = useMemo(() => {
    const map = {};
    for (const e of practiceEntries) {
      const tid = e.themeId || 'other';
      map[tid] = map[tid] || [];
      map[tid].push(e);
    }
    return map;
  }, [practiceEntries]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">stud-i-agency-check</h1>
            <p className="text-sm text-gray-600">ABU zirkulär kompetent · Lehrperson: {userData?.displayName || userData?.name || ''}</p>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button onClick={() => setActiveTab('classes')} className={`px-4 py-2 rounded-lg whitespace-nowrap ${activeTab === 'classes' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>
            <Users className="w-4 h-4 inline mr-1" /> Klassen
          </button>
          <button onClick={() => setActiveTab('learners')} className={`px-4 py-2 rounded-lg whitespace-nowrap ${activeTab === 'learners' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>
            Lernende
          </button>
          <button onClick={() => setActiveTab('entries')} className={`px-4 py-2 rounded-lg whitespace-nowrap ${activeTab === 'entries' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>
            Einträge
          </button>
        </div>

        {activeTab === 'classes' && (
          <div className="space-y-6">
            {/* Neue Klasse erstellen */}
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5" /> Neue Klasse erstellen
              </h2>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Klassenname</label>
                  <input
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="z.B. EBA FAZ1 2026"
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Anzahl Lernende (max. 30)</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={newLearnerCount}
                    onChange={(e) => setNewLearnerCount(parseInt(e.target.value) || 1)}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={createClass}
                    disabled={creatingClass || !newClassName.trim()}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 hover:bg-blue-700 transition"
                  >
                    {creatingClass ? 'Erstelle...' : 'Klasse + Codes erstellen'}
                  </button>
                </div>
              </div>

              <p className="mt-3 text-sm text-gray-600">
                Tiersymbole werden automatisch zugewiesen. Sie können die Liste als CSV exportieren und Namen extern zuordnen.
              </p>
            </div>

            {/* Bestehende Klassen */}
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Meine Klassen</h2>

              {classes.length === 0 ? (
                <p className="text-gray-600">Noch keine Klassen erstellt.</p>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {classes.map(c => {
                    const codes = learnerCodesByClass[c.id] || [];
                    const usedCount = codes.filter(code => code.used).length;
                    return (
                      <div
                        key={c.id}
                        className={`border rounded-xl p-4 hover:shadow-md transition ${selectedClassId === c.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-semibold text-lg">{c.name}</div>
                            <div className="text-sm text-gray-600">{codes.length} Codes · {usedCount} aktiv</div>
                          </div>
                          <button
                            onClick={() => viewCodes(c.id)}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                            title="Codes anzeigen"
                          >
                            <Eye className="w-5 h-5 text-gray-600" />
                          </button>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1">
                          {codes.slice(0, 8).map(code => (
                            <span key={code.id} className="text-lg" title={`${code.animalName}: ${code.code}`}>
                              {code.animalEmoji}
                            </span>
                          ))}
                          {codes.length > 8 && (
                            <span className="text-sm text-gray-500">+{codes.length - 8}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'learners' && (
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Lernende (registriert)</h2>

            <div className="mb-4">
              <label className="text-sm text-gray-600">Klasse auswählen</label>
              <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} className="w-full md:w-auto border rounded-lg px-3 py-2 mt-1">
                <option value="">Alle Klassen</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {filteredLearners.length === 0 ? (
              <p className="text-gray-600">Noch keine Lernenden registriert. Lernende müssen sich mit ihrem Code einloggen.</p>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredLearners.map(l => {
                  const cls = classes.find(c => c.id === l.classId);
                  return (
                    <button
                      key={l.id}
                      onClick={() => {
                        setSelectedLearnerId(l.id);
                        setActiveTab('entries');
                      }}
                      className={`text-left border rounded-xl p-4 hover:bg-gray-50 transition ${selectedLearnerId === l.id ? 'border-blue-600' : 'border-gray-200'}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{l.animalEmoji || '👤'}</span>
                        <div>
                          <div className="font-medium">{l.animalName || l.name || 'Lernende/r'}</div>
                          <div className="text-sm text-gray-600">{cls?.name || 'Keine Klasse'}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'entries' && (
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-semibold">Einträge</h2>
                <p className="text-sm text-gray-600">Übungseinträge pro Lernende (Pflicht & Freiwillig)</p>
              </div>
              <div className="flex gap-2 items-center">
                <select value={selectedLearnerId} onChange={(e) => setSelectedLearnerId(e.target.value)} className="border rounded-lg px-3 py-2">
                  <option value="">Lernende wählen...</option>
                  {learners.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.animalEmoji} {l.animalName || l.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {!selectedLearner ? (
              <p className="text-gray-600">Bitte Lernende auswählen.</p>
            ) : (
              <>
                <div className="mb-4 p-4 bg-gray-50 rounded-xl flex items-center gap-4">
                  <span className="text-4xl">{selectedLearner.animalEmoji || '👤'}</span>
                  <div>
                    <div className="font-semibold text-lg">{selectedLearner.animalName || selectedLearner.name}</div>
                    <div className="text-sm text-gray-600">
                      {classes.find(c => c.id === selectedLearner.classId)?.name || 'Keine Klasse'} · {practiceEntries.length} Einträge
                    </div>
                  </div>
                </div>

                {practiceEntries.length === 0 ? (
                  <p className="text-gray-600">Noch keine Einträge.</p>
                ) : (
                  <div className="space-y-6">
                    {themes.map(theme => {
                      const entries = entriesByTheme[theme.id] || [];
                      if (entries.length === 0) return null;
                      return (
                        <div key={theme.id}>
                          <h3 className="font-semibold text-gray-800 mb-2">{theme.order}. {theme.title}</h3>
                          <div className="space-y-3">
                            {entries.map(e => (
                              <div key={e.id} className="border rounded-xl p-4">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <div className="text-sm text-gray-500">{ymd(e.createdAt || new Date())}</div>
                                    <div className="mt-1 flex flex-wrap gap-2">
                                      {/* Pflicht-Sprachmodi */}
                                      {e.mandatoryLanguageModes?.map(modeId => {
                                        const mode = allLanguageModes.find(m => m.id === modeId);
                                        return (
                                          <span key={modeId} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                            {mode?.short || modeId}
                                          </span>
                                        );
                                      })}
                                      {/* Freiwillige Sprachmodi */}
                                      {e.additionalLanguageModes?.map(modeId => {
                                        const mode = allLanguageModes.find(m => m.id === modeId);
                                        return (
                                          <span key={modeId} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                            + {mode?.short || modeId}
                                          </span>
                                        );
                                      })}
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                      {/* Pflicht-Schlüsselkompetenzen */}
                                      {e.mandatoryKeySkills?.map(skillRef => {
                                        const skill = allKeySkills.find(s => s.id === skillRef.replace(/-R[12]$/, ''));
                                        return (
                                          <span key={skillRef} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                            {skill?.short || skillRef}
                                          </span>
                                        );
                                      })}
                                      {/* Freiwillige Schlüsselkompetenzen */}
                                      {e.additionalKeySkills?.map(skillRef => {
                                        const skill = allKeySkills.find(s => s.id === skillRef.replace(/-R[12]$/, ''));
                                        return (
                                          <span key={skillRef} className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                            + {skill?.short || skillRef}
                                          </span>
                                        );
                                      })}
                                    </div>
                                    {e.context && (
                                      <div className="mt-2 text-sm text-gray-600">Kontext: {e.context}</div>
                                    )}
                                    {e.reflection && (
                                      <div className="mt-2 p-2 bg-gray-50 rounded text-sm">{e.reflection}</div>
                                    )}
                                    {e.teacherNote && (
                                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                                        <span className="font-medium">Lehrperson:</span> {e.teacherNote}
                                      </div>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => startNote(e)}
                                    className="p-2 border rounded-lg hover:bg-gray-50"
                                    title="Notiz hinzufügen"
                                  >
                                    <MessageSquare className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>

      {/* Codes Modal */}
      {showCodesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold">Lernenden-Codes</h3>
                  <p className="text-sm text-gray-600">
                    {classes.find(c => c.id === viewClassId)?.name || 'Klasse'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={copyAllCodes}
                    className="px-3 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" /> Alle kopieren
                  </button>
                  <button
                    onClick={downloadCSV}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" /> CSV Export
                  </button>
                  <button onClick={() => setShowCodesModal(false)} className="px-3 py-2 border rounded-lg hover:bg-gray-50">
                    Schliessen
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid md:grid-cols-2 gap-3">
                {(learnerCodesByClass[viewClassId] || []).map(code => (
                  <div
                    key={code.id}
                    className={`border rounded-xl p-4 flex items-center justify-between ${code.used ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{code.animalEmoji}</span>
                      <div>
                        <div className="font-medium">{code.animalName}</div>
                        <div className="font-mono text-lg tracking-wider">{code.code}</div>
                        {code.used && (
                          <div className="text-xs text-green-600">Aktiv</div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => copyCode(code.code)}
                      className="p-2 hover:bg-white rounded-lg"
                      title="Code kopieren"
                    >
                      <Copy className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50 text-sm text-gray-600">
              Tipp: Exportieren Sie die Liste als CSV und fügen Sie die Namen der Lernenden in Excel/Sheets hinzu.
            </div>
          </div>
        </div>
      )}

      {/* Notiz Modal */}
      {noteEntryId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <h3 className="text-xl font-bold mb-2">Notiz der Lehrperson</h3>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 h-32"
              placeholder="Feedback, Hinweise, nächste Schritte..."
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => { setNoteEntryId(''); setNoteText(''); }}
                className="flex-1 px-4 py-2 border rounded-lg"
              >
                Abbrechen
              </button>
              <button
                onClick={saveNote}
                disabled={savingNote}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
