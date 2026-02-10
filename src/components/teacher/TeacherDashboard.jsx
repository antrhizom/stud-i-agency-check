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
import { themes, competencies } from '../../data/curriculum';
import { LogOut, Users, Plus, Copy, Search, MessageSquare, Download } from 'lucide-react';

const CODE_EMAIL_DOMAIN = 'studiagency-check.ch';

// Tier-Namen für anonyme Lernenden-Codes
const TIER_NAMEN = [
  'Adler', 'Bär', 'Dachs', 'Eichhörnchen', 'Fuchs', 'Giraffe', 'Hase', 'Igel',
  'Jaguar', 'Koala', 'Löwe', 'Maus', 'Nashorn', 'Otter', 'Pinguin', 'Qualle',
  'Reh', 'Schwan', 'Tiger', 'Uhu', 'Vogel', 'Wolf', 'Yak', 'Zebra',
  'Affe', 'Biber', 'Delfin', 'Elefant', 'Flamingo', 'Gepard', 'Hirsch', 'Kamel',
  'Leopard', 'Marder', 'Nilpferd', 'Ozelot', 'Papagei', 'Robbe', 'Storch', 'Tukan'
];

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

function ymd(d) {
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toISOString().split('T')[0];
}

export default function TeacherDashboard() {
  const { signOut, currentUser, userData } = useAuth();

  const [activeTab, setActiveTab] = useState('classes');
  const [classes, setClasses] = useState([]);
  const [learners, setLearners] = useState([]);

  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedLearnerId, setSelectedLearnerId] = useState('');
  const [practiceEntries, setPracticeEntries] = useState([]);

  // UI: Klasse erstellen
  const [newClassName, setNewClassName] = useState('');
  const [creatingClass, setCreatingClass] = useState(false);

  // UI: Codes
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [codeAnzahl, setCodeAnzahl] = useState(10);
  const [generated, setGenerated] = useState([]); // [{tier, code}]

  // UI: Notiz auf Eintrag
  const [noteEntryId, setNoteEntryId] = useState('');
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Load classes + learners (aus users UND learnerCodes zusammenführen)
  useEffect(() => {
    if (!currentUser) return;

    const load = async () => {
      // 1) Klassen laden
      const cq = query(collection(db, 'classes'), where('teacherId', '==', currentUser.uid), orderBy('createdAt', 'desc'));
      const cs = await getDocs(cq);
      const cls = cs.docs.map(d => ({ id: d.id, ...d.data() }));
      setClasses(cls);
      if (!selectedClassId && cls.length) setSelectedClassId(cls[0].id);

      // 2) Eingeloggte Lernende aus users-Collection
      const lq = query(collection(db, 'users'), where('role', '==', 'learner'), where('teacherId', '==', currentUser.uid));
      const ls = await getDocs(lq);
      const existingUsers = ls.docs.map(d => ({ id: d.id, ...d.data() }));

      // 3) Alle learnerCodes dieser Lehrperson laden (auch nicht-benutzte)
      const codesQuery = query(collection(db, 'learnerCodes'), where('teacherId', '==', currentUser.uid));
      const codesSnap = await getDocs(codesQuery);
      const allCodes = codesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // 4) Zusammenführen: existierende User + nicht-eingeloggte Codes
      const userIdSet = new Set(existingUsers.map(u => u.id));
      const codeUserIds = new Set(allCodes.filter(c => c.userId).map(c => c.userId));

      const combined = [...existingUsers];

      // Codes ohne User-Eintrag als Platzhalter hinzufügen
      for (const code of allCodes) {
        if (!code.userId || !userIdSet.has(code.userId)) {
          // Noch nicht eingeloggt - als Platzhalter anzeigen
          combined.push({
            id: `code-${code.id}`, // Prefix um Kollisionen zu vermeiden
            _isCodeOnly: true, // Markierung: nur Code, kein User
            _codeDocId: code.id,
            name: code.name || '(ohne Name)',
            classId: code.classId,
            teacherId: code.teacherId,
            code: code.code,
            used: code.used || false
          });
        }
      }

      // Stabil sortieren
      combined.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setLearners(combined);
      if (!selectedLearnerId && combined.length) setSelectedLearnerId(combined[0].id);
    };

    load().catch(console.error);
  }, [currentUser]);

  // Load practice entries for selected learner (aus practiceEntriesEBA)
  useEffect(() => {
    if (!selectedLearnerId || selectedLearnerId.startsWith('code-')) {
      // Code-only Lernende haben noch keine Einträge
      setPracticeEntries([]);
      return;
    }

    const load = async () => {
      const pq = query(
        collection(db, 'practiceEntriesEBA'),
        where('learnerId', '==', selectedLearnerId)
      );
      const ps = await getDocs(pq);
      const data = ps.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate?.() || null
      }));
      // Sortiere lokal nach createdAt (neueste zuerst)
      data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setPracticeEntries(data);
    };

    load().catch(console.error);
  }, [selectedLearnerId]);

  const learnersByClass = useMemo(() => {
    const map = {};
    for (const l of learners) {
      const cid = l.classId || 'ohne-klasse';
      map[cid] = map[cid] || [];
      map[cid].push(l);
    }
    return map;
  }, [learners]);

  const selectedLearner = useMemo(() => learners.find(l => l.id === selectedLearnerId) || null, [learners, selectedLearnerId]);

  const competencyById = useMemo(() => {
    const m = {};
    for (const c of competencies) m[c.id] = c;
    return m;
  }, []);

  const themeById = useMemo(() => {
    const m = {};
    for (const t of themes) m[t.id] = t;
    return m;
  }, []);

  const createClass = async () => {
    if (!newClassName.trim() || !currentUser) return;
    setCreatingClass(true);
    try {
      const ref = await addDoc(collection(db, 'classes'), {
        name: newClassName.trim(),
        teacherId: currentUser.uid,
        createdAt: Timestamp.now()
      });
      const newClass = { id: ref.id, name: newClassName.trim(), teacherId: currentUser.uid, createdAt: new Date() };
      setClasses(prev => [newClass, ...prev]);
      setSelectedClassId(ref.id);
      setNewClassName('');
    } finally {
      setCreatingClass(false);
    }
  };

  const openCodeModal = () => {
    if (!classes.length) {
      alert('Bitte zuerst eine Klasse anlegen.');
      return;
    }
    setShowCodeModal(true);
    setGenerated([]);
    setCodeAnzahl(10);
  };

  const createCodes = async () => {
    if (!currentUser) return;
    if (!selectedClassId) {
      alert('Bitte Klasse wählen.');
      return;
    }

    const anzahl = Math.min(Math.max(1, codeAnzahl), TIER_NAMEN.length);

    // Shuffle Tier-Namen und nimm die ersten X
    const shuffledTiere = [...TIER_NAMEN].sort(() => Math.random() - 0.5);
    const ausgewaehlteTiere = shuffledTiere.slice(0, anzahl);

    const out = [];
    for (const tier of ausgewaehlteTiere) {
      const code = generateCode();
      await addDoc(collection(db, 'learnerCodes'), {
        code,
        name: tier, // Tier als Pseudonym
        teacherId: currentUser.uid,
        classId: selectedClassId,
        used: false,
        userId: null,
        createdAt: Timestamp.now()
      });
      out.push({ tier, code });
    }
    setGenerated(out);
  };

  const downloadCSV = () => {
    if (!generated.length) return;

    const className = classes.find(c => c.id === selectedClassId)?.name || 'Klasse';
    const header = 'Tier;Code;Name (ausfüllen)';
    const rows = generated.map(g => `${g.tier};${g.code};`);
    const csv = [header, ...rows].join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Lernenden-Codes_${className}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyCode = async (code) => {
    await navigator.clipboard.writeText(code);
    alert('Code kopiert!');
  };

  const startNote = (entry) => {
    setNoteEntryId(entry.id);
    setNoteText(entry.teacherNote || '');
  };

  const saveNote = async () => {
    if (!noteEntryId) return;
    setSavingNote(true);
    try {
      await updateDoc(doc(db, 'practiceEntriesEBA', noteEntryId), {
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

  // Wenn Klasse wechselt: selectedLearnerId auf ersten Lernenden der neuen Klasse setzen
  useEffect(() => {
    if (filteredLearners.length > 0) {
      // Nur wechseln, wenn der aktuelle Lernende nicht in der gefilterten Liste ist
      if (!filteredLearners.find(l => l.id === selectedLearnerId)) {
        setSelectedLearnerId(filteredLearners[0].id);
      }
    } else {
      setSelectedLearnerId('');
    }
  }, [selectedClassId, filteredLearners]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/LogoABU_DNA.png" alt="ABU Logo" className="h-10 w-10 object-contain" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">stud-i-agency-chek</h1>
              <p className="text-sm text-gray-600">Lehrperson ABU · {userData?.displayName || userData?.name || ''}</p>
            </div>
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
        <div className="flex gap-2 mb-6">
          <button onClick={() => setActiveTab('classes')} className={`px-4 py-2 rounded-lg ${activeTab==='classes' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>Klassen</button>
          <button onClick={() => setActiveTab('learners')} className={`px-4 py-2 rounded-lg ${activeTab==='learners' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>Lernende</button>
          <button onClick={() => setActiveTab('entries')} className={`px-4 py-2 rounded-lg ${activeTab==='entries' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>Einträge</button>
        </div>

        {activeTab === 'classes' && (
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Users className="w-5 h-5" /> Klassen</h2>

            <div className="flex gap-3 mb-6">
              <input
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                placeholder="z.B. EBA FAZ1 2026"
                className="flex-1 border rounded-lg px-3 py-2"
              />
              <button
                onClick={createClass}
                disabled={creatingClass || !newClassName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
              >
                <Plus className="w-4 h-4 inline mr-1" />
                Erstellen
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {classes.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedClassId(c.id)}
                  className={`text-left border rounded-xl p-4 hover:bg-gray-50 ${selectedClassId===c.id ? 'border-blue-600' : 'border-gray-200'}`}
                >
                  <div className="font-medium">{c.name}</div>
                  <div className="text-sm text-gray-600">{(learnersByClass[c.id] || []).length} Lernende</div>
                </button>
              ))}
            </div>

            <div className="mt-6">
              <button
                onClick={openCodeModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black"
              >
                <Plus className="w-4 h-4" /> Lernenden-Codes erstellen
              </button>
            </div>
          </div>
        )}

        {activeTab === 'learners' && (
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Lernende</h2>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="md:w-1/3 space-y-3">
                <label className="text-sm text-gray-600">Klasse</label>
                <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} className="w-full border rounded-lg px-3 py-2">
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>

                <label className="text-sm text-gray-600">Lernende auswählen</label>
                <select value={selectedLearnerId} onChange={(e) => setSelectedLearnerId(e.target.value)} className="w-full border rounded-lg px-3 py-2">
                  {filteredLearners.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.name || l.displayName || l.email}{l._isCodeOnly ? ' (nicht eingeloggt)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:flex-1">
                {selectedLearner ? (
                  <div className="border rounded-xl p-4">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold">{selectedLearner.name || selectedLearner.displayName}</div>
                      {selectedLearner._isCodeOnly ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-300">noch nicht eingeloggt</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 border border-green-300">aktiv</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">Klasse: {classes.find(c => c.id === selectedLearner.classId)?.name || '—'}</div>
                    {selectedLearner.code && <div className="text-sm text-gray-600">Code: <span className="font-mono">{selectedLearner.code}</span></div>}
                    {!selectedLearner._isCodeOnly && (
                      <div className="text-sm text-gray-600">Einträge: {practiceEntries.length}</div>
                    )}
                    {selectedLearner._isCodeOnly && (
                      <div className="text-sm text-yellow-700 mt-2">Diese:r Lernende hat sich noch nicht eingeloggt. Erst nach dem ersten Login werden Einträge sichtbar.</div>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-600">Keine Lernenden gefunden.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'entries' && (
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-semibold">Einträge</h2>
                <p className="text-sm text-gray-600">Übungen/Kompetenzen (Pflichtprogramm & frei) pro Lernende</p>
              </div>
              <div className="flex gap-2">
                <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} className="border rounded-lg px-3 py-2">
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select value={selectedLearnerId} onChange={(e) => setSelectedLearnerId(e.target.value)} className="border rounded-lg px-3 py-2">
                  {filteredLearners.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.name || l.displayName || l.email}{l._isCodeOnly ? ' (nicht eingeloggt)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {practiceEntries.length === 0 ? (
              <p className="text-gray-600">Noch keine Einträge.</p>
            ) : (
              <div className="space-y-3">
                {practiceEntries.map(e => {
                  // Typ-Label und Farbe
                  const typeLabels = {
                    gesellschaft: { label: 'Gesellschaftsinhalt', color: 'bg-emerald-100 text-emerald-800' },
                    sprachmodus: { label: 'Sprachmodus', color: 'bg-blue-100 text-blue-800' },
                    schluesselkompetenz: { label: 'Schlüsselkompetenz', color: 'bg-amber-100 text-amber-800' },
                    transversal: { label: 'Transversales Thema', color: 'bg-purple-100 text-purple-800' }
                  };
                  const typeInfo = typeLabels[e.type] || { label: e.type || '—', color: 'bg-gray-100 text-gray-800' };

                  return (
                    <div key={e.id} className="border rounded-xl p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeInfo.color}`}>{typeInfo.label}</span>
                            {e.status && <span className="text-xs text-gray-500">{e.status}</span>}
                          </div>
                          {e.inhalt && <div className="text-sm text-gray-800">{e.inhalt}</div>}
                          <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-600">
                            {e.howMethod && <span>Wo: <strong>{e.howMethod}</strong></span>}
                            {e.howLearned && <span>Wie: <strong>{e.howLearned}</strong></span>}
                            {e.createdAt && <span className="text-gray-400">{e.createdAt.toLocaleDateString('de-CH')}</span>}
                          </div>
                        </div>
                        <button onClick={() => startNote(e)} className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50">
                          <MessageSquare className="w-4 h-4" />
                          Notiz
                        </button>
                      </div>
                      {e.teacherNote && (
                        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                          <span className="font-medium">Lehrperson:</span> {e.teacherNote}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {showCodeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold">Lernenden-Codes erstellen</h3>
                <p className="text-sm text-gray-600">Codes werden mit Tier-Pseudonymen generiert. Namen können Sie in der CSV-Datei ergänzen.</p>
              </div>
              <button onClick={() => setShowCodeModal(false)} className="px-3 py-1 border rounded-lg">Schliessen</button>
            </div>

            <div className="mt-4 grid md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600">Klasse</label>
                  <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} className="w-full border rounded-lg px-3 py-2">
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-gray-600">Anzahl Lernende</label>
                  <input
                    type="number"
                    min="1"
                    max={TIER_NAMEN.length}
                    value={codeAnzahl}
                    onChange={(e) => setCodeAnzahl(parseInt(e.target.value) || 1)}
                    className="w-full border rounded-lg px-3 py-2 text-lg font-medium"
                  />
                  <p className="text-xs text-gray-500 mt-1">Max. {TIER_NAMEN.length} (ein Tier pro Lernende:r)</p>
                </div>

                <button onClick={createCodes} className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black">
                  <Plus className="w-4 h-4 inline mr-1" /> {codeAnzahl} Codes generieren
                </button>

                {generated.length > 0 && (
                  <button onClick={downloadCSV} className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    <Download className="w-4 h-4 inline mr-1" /> CSV herunterladen
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <div className="text-sm text-gray-600">Ergebnis ({generated.length} Codes)</div>
                {generated.length === 0 ? (
                  <div className="text-gray-600 border rounded-xl p-4">Noch keine Codes generiert.</div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {generated.map(g => (
                      <div key={g.code} className="border rounded-xl p-3 flex items-center justify-between">
                        <div>
                          <div className="font-medium">{g.tier}</div>
                          <div className="font-mono text-sm text-gray-600">{g.code}</div>
                        </div>
                        <button onClick={() => copyCode(g.code)} className="px-3 py-2 border rounded-lg hover:bg-gray-50">
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {noteEntryId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <h3 className="text-xl font-bold mb-2">Notiz der Lehrperson</h3>
            <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} className="w-full border rounded-lg px-3 py-2 h-32" placeholder="Feedback, Hinweise, nächste Schritte..." />
            <div className="flex gap-2 mt-4">
              <button onClick={() => { setNoteEntryId(''); setNoteText(''); }} className="flex-1 px-4 py-2 border rounded-lg">Abbrechen</button>
              <button onClick={saveNote} disabled={savingNote} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">Speichern</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
