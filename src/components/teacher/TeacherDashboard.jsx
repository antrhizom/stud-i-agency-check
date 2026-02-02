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
import { LogOut, Users, Plus, Copy, Search, MessageSquare } from 'lucide-react';

const CODE_EMAIL_DOMAIN = 'studiagency-check.ch';

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
  const [codeMode, setCodeMode] = useState('single'); // single | batch
  const [learnerName, setLearnerName] = useState('');
  const [batchNames, setBatchNames] = useState('');
  const [generated, setGenerated] = useState([]); // [{name, code}]
  const [copyInfoName, setCopyInfoName] = useState('');

  // UI: Notiz auf Eintrag
  const [noteEntryId, setNoteEntryId] = useState('');
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Load classes + learners
  useEffect(() => {
    if (!currentUser) return;

    const load = async () => {
      const cq = query(collection(db, 'classes'), where('teacherId', '==', currentUser.uid), orderBy('createdAt', 'desc'));
      const cs = await getDocs(cq);
      const cls = cs.docs.map(d => ({ id: d.id, ...d.data() }));
      setClasses(cls);
      if (!selectedClassId && cls.length) setSelectedClassId(cls[0].id);

      const lq = query(collection(db, 'users'), where('role', '==', 'learner'), where('teacherId', '==', currentUser.uid));
      const ls = await getDocs(lq);
      const lrn = ls.docs.map(d => ({ id: d.id, ...d.data() }));
      // stabil sort
      lrn.sort((a,b)=>(a.name||'').localeCompare(b.name||''));
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
        orderBy('date', 'desc')
      );
      const ps = await getDocs(pq);
      const data = ps.docs.map(d => ({ id: d.id, ...d.data(), date: d.data().date?.toDate?.() ? d.data().date.toDate() : null }));
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
    setLearnerName('');
    setBatchNames('');
    setCopyInfoName('');
  };

  const createCodes = async () => {
    if (!currentUser) return;
    if (!selectedClassId) {
      alert('Bitte Klasse wählen.');
      return;
    }

    const names = codeMode === 'batch'
      ? batchNames.split('\n').map(s => s.trim()).filter(Boolean)
      : [learnerName.trim()].filter(Boolean);

    if (!names.length) {
      alert('Bitte Name(n) eingeben.');
      return;
    }

    const out = [];
    for (const name of names) {
      const code = generateCode();
      await addDoc(collection(db, 'learnerCodes'), {
        code,
        name,
        teacherId: currentUser.uid,
        classId: selectedClassId,
        used: false,
        userId: null,
        createdAt: Timestamp.now()
      });
      out.push({ name, code });
    }
    setGenerated(out);
    setCopyInfoName(names[0] || '');
  };

  const copyCode = async (code) => {
    await navigator.clipboard.writeText(code);
    alert('Code kopiert!');
  };

  const copyInstructions = async (name, code) => {
    const text = `Hallo ${name}!\n\nDu bist jetzt registriert für stud-i-agency-check (ABU zirkulär kompetent).\n\nDein Code: ${code}\n\nWICHTIG: Dieser Code ist dein dauerhaftes Passwort.\n\nSo geht\'s:\n1. App öffnen (Vercel-URL)\n2. "Als Lernende:r einloggen" klicken\n3. Code eingeben: ${code}\n4. Fertig!\n`;
    await navigator.clipboard.writeText(text);
    alert('Anleitung kopiert!');
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">stud-i-agency-check</h1>
            <p className="text-sm text-gray-600">ABU zirkulär kompetent · {userData?.displayName || userData?.name || ''}</p>
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
                  {filteredLearners.map(l => <option key={l.id} value={l.id}>{l.name || l.displayName || l.email}</option>)}
                </select>
              </div>

              <div className="md:flex-1">
                {selectedLearner ? (
                  <div className="border rounded-xl p-4">
                    <div className="font-semibold">{selectedLearner.name || selectedLearner.displayName}</div>
                    <div className="text-sm text-gray-600">Klasse: {themeById[selectedLearner.classId]?.name || (classes.find(c => c.id===selectedLearner.classId)?.name || '—')}</div>
                    <div className="text-sm text-gray-600">Einträge: {practiceEntries.length}</div>
                    <div className="text-sm text-gray-600 mt-2">Hinweis: Externe Zugänge erstellt der Admin.</div>
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
                <select value={selectedLearnerId} onChange={(e) => setSelectedLearnerId(e.target.value)} className="border rounded-lg px-3 py-2">
                  {learners.map(l => <option key={l.id} value={l.id}>{l.name || l.displayName || l.email}</option>)}
                </select>
              </div>
            </div>

            {practiceEntries.length === 0 ? (
              <p className="text-gray-600">Noch keine Einträge.</p>
            ) : (
              <div className="space-y-3">
                {practiceEntries.map(e => {
                  const c = competencyById[e.competencyId];
                  const t = themes.find(x => x.id === e.themeId);
                  return (
                    <div key={e.id} className="border rounded-xl p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="font-medium">{c ? c.title : e.competencyId}</div>
                          <div className="text-sm text-gray-600">{ymd(e.date || new Date())} · {t ? t.title : 'ohne Thema'} · Status: {e.status}</div>
                        </div>
                        <button onClick={() => startNote(e)} className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50">
                          <MessageSquare className="w-4 h-4" />
                          Notiz
                        </button>
                      </div>
                      {(e.where || e.how || e.note) && (
                        <div className="mt-3 text-sm text-gray-800 space-y-1">
                          {e.where && <div><span className="text-gray-500">Wo:</span> {e.where}</div>}
                          {e.how && <div><span className="text-gray-500">Wie:</span> {e.how}</div>}
                          {e.note && <div><span className="text-gray-500">Notiz:</span> {e.note}</div>}
                          {e.teacherNote && <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded"><span className="font-medium">Lehrperson:</span> {e.teacherNote}</div>}
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
                <p className="text-sm text-gray-600">Codes sind dauerhafte Passwörter. Lernende loggen sich via Code ein.</p>
              </div>
              <button onClick={() => setShowCodeModal(false)} className="px-3 py-1 border rounded-lg">Schliessen</button>
            </div>

            <div className="mt-4 grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="text-sm text-gray-600">Klasse</label>
                <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} className="w-full border rounded-lg px-3 py-2">
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>

                <div className="flex gap-2">
                  <button onClick={() => setCodeMode('single')} className={`flex-1 px-3 py-2 rounded-lg border ${codeMode==='single' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white'}`}>Einzeln</button>
                  <button onClick={() => setCodeMode('batch')} className={`flex-1 px-3 py-2 rounded-lg border ${codeMode==='batch' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white'}`}>Batch</button>
                </div>

                {codeMode === 'single' ? (
                  <div>
                    <label className="text-sm text-gray-600">Name</label>
                    <input value={learnerName} onChange={(e) => setLearnerName(e.target.value)} className="w-full border rounded-lg px-3 py-2" placeholder="z.B. Max Muster" />
                  </div>
                ) : (
                  <div>
                    <label className="text-sm text-gray-600">Namen (1 pro Zeile)</label>
                    <textarea value={batchNames} onChange={(e) => setBatchNames(e.target.value)} className="w-full border rounded-lg px-3 py-2 h-32" placeholder="Max Muster\nLea Beispiel" />
                  </div>
                )}

                <button onClick={createCodes} className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black">
                  <Plus className="w-4 h-4 inline mr-1" /> Codes generieren
                </button>
              </div>

              <div className="space-y-3">
                <div className="text-sm text-gray-600">Ergebnis</div>
                {generated.length === 0 ? (
                  <div className="text-gray-600 border rounded-xl p-4">Noch keine Codes generiert.</div>
                ) : (
                  <div className="space-y-2">
                    {generated.map(g => (
                      <div key={g.code} className="border rounded-xl p-3">
                        <div className="font-medium">{g.name}</div>
                        <div className="flex items-center justify-between gap-2 mt-1">
                          <div className="font-mono text-lg">{g.code}</div>
                          <div className="flex gap-2">
                            <button onClick={() => copyCode(g.code)} className="px-3 py-2 border rounded-lg hover:bg-gray-50"><Copy className="w-4 h-4" /></button>
                            <button onClick={() => copyInstructions(g.name, g.code)} className="px-3 py-2 border rounded-lg hover:bg-gray-50">Anleitung</button>
                          </div>
                        </div>
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
