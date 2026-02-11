import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
  Timestamp
} from 'firebase/firestore';
import {
  themen as ebaThemen,
  schluesselkompetenzen,
  sprachmodi,
  gesellschaftsinhalte,
  transversaleThemen,
  getSchluesselkompetenzById,
  getSprachmodusById,
  getGesellschaftsinhaltById
} from '../../data/curriculumEBA';
import { LogOut, Users, Plus, Copy, MessageSquare, Download, Trash2, BarChart3 } from 'lucide-react';

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

// ============================================
// Fortschritts-Berechnung
// ============================================
function computeProgress(entries) {
  // Zähle einzigartige Kompetenzen pro Typ
  const done = {
    gesellschaft: new Set(),
    sprachmodus: new Set(),
    schluesselkompetenz: new Set(),
    transversal: new Set()
  };
  const themenSet = new Set();

  for (const e of entries) {
    if (e.type === 'gesellschaft' && e.bereich) {
      done.gesellschaft.add(e.bereich);
    } else if (e.type === 'sprachmodus' && e.modus) {
      done.sprachmodus.add(e.modus);
    } else if (e.type === 'schluesselkompetenz' && e.kompetenzId) {
      done.schluesselkompetenz.add(e.kompetenzId);
    } else if (e.type === 'transversal' && e.transversalId) {
      done.transversal.add(e.transversalId);
    }
    if (e.themaId) themenSet.add(e.themaId);
  }

  const totalGesellschaft = gesellschaftsinhalte.length; // 8
  const totalSprachmodi = sprachmodi.length; // 9
  const totalSchluessel = schluesselkompetenzen.length; // 12
  const totalTransversal = transversaleThemen.length; // 3
  const totalAll = totalGesellschaft + totalSprachmodi + totalSchluessel;

  const doneAll = done.gesellschaft.size + done.sprachmodus.size + done.schluesselkompetenz.size;
  const overallPercent = totalAll > 0 ? Math.round((doneAll / totalAll) * 100) : 0;

  return {
    overall: overallPercent,
    gesellschaft: { done: done.gesellschaft.size, total: totalGesellschaft, items: done.gesellschaft },
    sprachmodus: { done: done.sprachmodus.size, total: totalSprachmodi, items: done.sprachmodus },
    schluesselkompetenz: { done: done.schluesselkompetenz.size, total: totalSchluessel, items: done.schluesselkompetenz },
    transversal: { done: done.transversal.size, total: totalTransversal, items: done.transversal },
    themen: themenSet,
    totalEntries: entries.length
  };
}

// ============================================
// Kleine ProgressBar Komponente
// ============================================
function ProgressBar({ percent, color = 'bg-blue-500', height = 'h-2' }) {
  return (
    <div className={`w-full bg-gray-200 rounded-full ${height} overflow-hidden`}>
      <div className={`${height} rounded-full ${color} transition-all`} style={{ width: `${Math.min(100, percent)}%` }} />
    </div>
  );
}

// ============================================
// HAUPTKOMPONENTE
// ============================================
export default function TeacherDashboard() {
  const { signOut, currentUser, userData } = useAuth();

  const [activeTab, setActiveTab] = useState('classes');
  const [classes, setClasses] = useState([]);
  const [learners, setLearners] = useState([]);
  const [allCodesRaw, setAllCodesRaw] = useState([]);

  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedLearnerId, setSelectedLearnerId] = useState('');
  const [practiceEntries, setPracticeEntries] = useState([]);

  // Einträge-Tab: alle Einträge einer Klasse
  const [classEntries, setClassEntries] = useState({}); // { learnerId: [...entries] }
  const [loadingClassEntries, setLoadingClassEntries] = useState(false);

  const [newClassName, setNewClassName] = useState('');
  const [creatingClass, setCreatingClass] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [codeAnzahl, setCodeAnzahl] = useState(10);
  const [generated, setGenerated] = useState([]);
  const [noteEntryId, setNoteEntryId] = useState('');
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [loading, setLoading] = useState(false);

  // ============================================
  // LADEN
  // ============================================
  const loadAll = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      // 1) Klassen
      const cq = query(collection(db, 'classes'), where('teacherId', '==', currentUser.uid), orderBy('createdAt', 'desc'));
      const cs = await getDocs(cq);
      const cls = cs.docs.map(d => ({ id: d.id, ...d.data() }));
      setClasses(cls);
      if (!selectedClassId && cls.length) setSelectedClassId(cls[0].id);

      // 2) Eingeloggte Lernende
      const lq = query(collection(db, 'users'), where('role', '==', 'learner'), where('teacherId', '==', currentUser.uid));
      const ls = await getDocs(lq);
      const existingUsers = ls.docs.map(d => ({ id: d.id, ...d.data() }));

      // 3) Alle learnerCodes
      const codesQuery = query(collection(db, 'learnerCodes'), where('teacherId', '==', currentUser.uid));
      const codesSnap = await getDocs(codesQuery);
      const allCodes = codesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAllCodesRaw(allCodes);

      // 4) Zusammenführen
      const userIdSet = new Set(existingUsers.map(u => u.id));
      for (const code of allCodes) {
        if (code.userId && userIdSet.has(code.userId)) {
          const user = existingUsers.find(u => u.id === code.userId);
          if (user && !user.code) user.code = code.code;
        }
      }

      const combined = [...existingUsers];
      const seenKey = new Set();
      const sortedCodes = [...allCodes].sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
        const bTime = b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
        return bTime - aTime;
      });

      for (const code of sortedCodes) {
        if (code.userId && userIdSet.has(code.userId)) continue;
        const dedupeKey = `${code.classId}__${code.name}`;
        if (seenKey.has(dedupeKey)) continue;
        seenKey.add(dedupeKey);
        combined.push({
          id: `code-${code.id}`,
          _isCodeOnly: true,
          _codeDocId: code.id,
          name: code.name || '(ohne Name)',
          classId: code.classId,
          teacherId: code.teacherId,
          code: code.code,
          used: code.used || false
        });
      }

      combined.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setLearners(combined);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Einträge für einzelnen Lernenden
  useEffect(() => {
    if (!selectedLearnerId || selectedLearnerId.startsWith('code-')) {
      setPracticeEntries([]);
      return;
    }
    const load = async () => {
      const pq = query(collection(db, 'practiceEntriesEBA'), where('learnerId', '==', selectedLearnerId));
      const ps = await getDocs(pq);
      const data = ps.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate?.() || null }));
      data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setPracticeEntries(data);
    };
    load().catch(console.error);
  }, [selectedLearnerId]);

  // Alle Einträge einer Klasse laden (für Einträge-Tab)
  useEffect(() => {
    if (activeTab !== 'entries' || !selectedClassId) return;
    const realLearners = learners.filter(l => !l._isCodeOnly && l.classId === selectedClassId);
    if (realLearners.length === 0) { setClassEntries({}); return; }

    setLoadingClassEntries(true);
    const loadEntries = async () => {
      const result = {};
      for (const l of realLearners) {
        const pq = query(collection(db, 'practiceEntriesEBA'), where('learnerId', '==', l.id));
        const ps = await getDocs(pq);
        result[l.id] = ps.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate?.() || null }));
      }
      setClassEntries(result);
      setLoadingClassEntries(false);
    };
    loadEntries().catch(console.error);
  }, [activeTab, selectedClassId, learners]);

  // ============================================
  // MEMOS
  // ============================================
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

  const filteredLearners = useMemo(() => {
    if (!selectedClassId) return learners;
    return learners.filter(l => l.classId === selectedClassId);
  }, [learners, selectedClassId]);

  useEffect(() => {
    if (filteredLearners.length > 0) {
      if (!filteredLearners.find(l => l.id === selectedLearnerId)) {
        setSelectedLearnerId(filteredLearners[0].id);
      }
    } else {
      setSelectedLearnerId('');
    }
  }, [selectedClassId, filteredLearners]);

  // ============================================
  // AKTIONEN
  // ============================================
  const createClass = async () => {
    if (!newClassName.trim() || !currentUser) return;
    setCreatingClass(true);
    try {
      await addDoc(collection(db, 'classes'), { name: newClassName.trim(), teacherId: currentUser.uid, createdAt: Timestamp.now() });
      setNewClassName('');
      await loadAll();
    } finally { setCreatingClass(false); }
  };

  const deleteClass = async (classId) => {
    const cls = classes.find(c => c.id === classId);
    const learnersInClass = (learnersByClass[classId] || []);
    if (!confirm(`Klasse "${cls?.name}" wirklich löschen? ${learnersInClass.length} Lernende in dieser Klasse werden ebenfalls entfernt.`)) return;
    setLoading(true);
    try {
      // Lernende-Codes dieser Klasse löschen
      const codesQ = query(collection(db, 'learnerCodes'), where('classId', '==', classId));
      const codesSnap = await getDocs(codesQ);
      for (const d of codesSnap.docs) await deleteDoc(doc(db, 'learnerCodes', d.id));

      // User-Dokumente dieser Klasse löschen (Auth-User bleibt, aber kann sich nicht mehr einloggen)
      const usersQ = query(collection(db, 'users'), where('classId', '==', classId), where('role', '==', 'learner'));
      const usersSnap = await getDocs(usersQ);
      for (const d of usersSnap.docs) await deleteDoc(doc(db, 'users', d.id));

      // Klasse löschen
      await deleteDoc(doc(db, 'classes', classId));
      if (selectedClassId === classId) setSelectedClassId('');
      await loadAll();
    } finally { setLoading(false); }
  };

  const deleteLearner = async (learner) => {
    if (!confirm(`"${learner.name}" wirklich löschen?`)) return;
    setLoading(true);
    try {
      if (learner._isCodeOnly) {
        // Nur den Code löschen
        await deleteDoc(doc(db, 'learnerCodes', learner._codeDocId));
      } else {
        // User-Dokument löschen
        await deleteDoc(doc(db, 'users', learner.id));
        // Zugehörigen Code löschen
        const codeQ = query(collection(db, 'learnerCodes'), where('userId', '==', learner.id));
        const codeSnap = await getDocs(codeQ);
        for (const d of codeSnap.docs) await deleteDoc(doc(db, 'learnerCodes', d.id));
      }
      await loadAll();
    } finally { setLoading(false); }
  };

  const openCodeModal = () => {
    if (!classes.length) { alert('Bitte zuerst eine Klasse anlegen.'); return; }
    setShowCodeModal(true);
    setGenerated([]);
    setCodeAnzahl(10);
  };

  const createCodes = async () => {
    if (!currentUser || !selectedClassId) { alert('Bitte Klasse wählen.'); return; }
    const existingCodesQuery = query(collection(db, 'learnerCodes'), where('teacherId', '==', currentUser.uid), where('classId', '==', selectedClassId));
    const existingCodesSnap = await getDocs(existingCodesQuery);
    const usedTierNames = new Set(existingCodesSnap.docs.map(d => d.data().name));
    const availableTiere = TIER_NAMEN.filter(t => !usedTierNames.has(t));
    if (availableTiere.length === 0) { alert(`Alle ${TIER_NAMEN.length} Tier-Namen sind für diese Klasse bereits vergeben.`); return; }
    const anzahl = Math.min(Math.max(1, codeAnzahl), availableTiere.length);
    if (anzahl < codeAnzahl && !confirm(`Nur noch ${availableTiere.length} Tier-Namen verfügbar. ${anzahl} Codes erstellen?`)) return;

    const shuffledTiere = [...availableTiere].sort(() => Math.random() - 0.5).slice(0, anzahl);
    const out = [];
    for (const tier of shuffledTiere) {
      const code = generateCode();
      await addDoc(collection(db, 'learnerCodes'), { code, name: tier, teacherId: currentUser.uid, classId: selectedClassId, used: false, userId: null, createdAt: Timestamp.now() });
      out.push({ tier, code });
    }
    setGenerated(out);
  };

  const downloadCSV = () => {
    if (!generated.length) return;
    const className = classes.find(c => c.id === selectedClassId)?.name || 'Klasse';
    const csv = ['Tier;Code;Name (ausfüllen)', ...generated.map(g => `${g.tier};${g.code};`)].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `Lernenden-Codes_${className}_${new Date().toISOString().split('T')[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const copyCode = async (code) => { await navigator.clipboard.writeText(code); alert('Code kopiert!'); };

  const startNote = (entry) => { setNoteEntryId(entry.id); setNoteText(entry.teacherNote || ''); };

  const saveNote = async () => {
    if (!noteEntryId) return;
    setSavingNote(true);
    try {
      await updateDoc(doc(db, 'practiceEntriesEBA', noteEntryId), { teacherNote: noteText.trim() || null, teacherNoteAt: noteText.trim() ? Timestamp.now() : null });
      setPracticeEntries(prev => prev.map(e => e.id === noteEntryId ? { ...e, teacherNote: noteText.trim() || null } : e));
      // Auch in classEntries updaten
      setClassEntries(prev => {
        const updated = { ...prev };
        for (const lid in updated) {
          updated[lid] = updated[lid].map(e => e.id === noteEntryId ? { ...e, teacherNote: noteText.trim() || null } : e);
        }
        return updated;
      });
      setNoteEntryId(''); setNoteText('');
    } finally { setSavingNote(false); }
  };

  // ============================================
  // RENDER
  // ============================================
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
          <button onClick={signOut} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6">
          <button onClick={() => setActiveTab('classes')} className={`px-4 py-2 rounded-lg ${activeTab==='classes' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>Klassen</button>
          <button onClick={() => setActiveTab('learners')} className={`px-4 py-2 rounded-lg ${activeTab==='learners' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>Lernende</button>
          <button onClick={() => setActiveTab('entries')} className={`px-4 py-2 rounded-lg ${activeTab==='entries' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>
            <BarChart3 className="w-4 h-4 inline mr-1" />Übersicht
          </button>
        </div>

        {/* ===== KLASSEN TAB ===== */}
        {activeTab === 'classes' && (
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Users className="w-5 h-5" /> Klassen</h2>

            <div className="flex gap-3 mb-6">
              <input value={newClassName} onChange={(e) => setNewClassName(e.target.value)} placeholder="z.B. EBA FAZ1 2026" className="flex-1 border rounded-lg px-3 py-2" />
              <button onClick={createClass} disabled={creatingClass || !newClassName.trim()} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">
                <Plus className="w-4 h-4 inline mr-1" /> Erstellen
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {classes.map(c => (
                <div key={c.id} className={`border rounded-xl p-4 flex items-center justify-between ${selectedClassId===c.id ? 'border-blue-600' : 'border-gray-200'}`}>
                  <button onClick={() => setSelectedClassId(c.id)} className="text-left flex-1">
                    <div className="font-medium">{c.name}</div>
                    <div className="text-sm text-gray-600">{(learnersByClass[c.id] || []).length} Lernende</div>
                  </button>
                  <button onClick={() => deleteClass(c.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded ml-2" title="Klasse löschen">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <button onClick={openCodeModal} className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black">
                <Plus className="w-4 h-4" /> Lernenden-Codes erstellen
              </button>
            </div>
          </div>
        )}

        {/* ===== LERNENDE TAB ===== */}
        {activeTab === 'learners' && (
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Lernende</h2>

            <div className="mb-4">
              <label className="text-sm text-gray-600">Klasse</label>
              <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} className="w-full border rounded-lg px-3 py-2 mt-1">
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {filteredLearners.length === 0 ? (
              <div className="text-gray-600">Keine Lernenden in dieser Klasse.</div>
            ) : (
              <div className="space-y-2">
                {filteredLearners.map(l => (
                  <div key={l.id} className="border rounded-xl p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{l.name || l.displayName || l.email}</span>
                        {l._isCodeOnly ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-300">nicht eingeloggt</span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 border border-green-300">aktiv</span>
                        )}
                      </div>
                      {l.code && <div className="text-sm text-gray-500 font-mono mt-1">Code: {l.code}</div>}
                    </div>
                    <button onClick={() => deleteLearner(l)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded" title="Lernende:n löschen">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== ÜBERSICHT / EINTRÄGE TAB ===== */}
        {activeTab === 'entries' && (
          <div className="space-y-6">
            {/* Klasse wählen */}
            <div className="bg-white rounded-2xl shadow p-6">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Klassenübersicht</h2>
                  <p className="text-sm text-gray-600">Fortschritt aller Lernenden pro Kompetenzbereich</p>
                </div>
                <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} className="border rounded-lg px-3 py-2">
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            {loadingClassEntries ? (
              <div className="text-center py-8 text-gray-500">Lade Einträge...</div>
            ) : (
              <>
                {/* Klassenübersicht: alle Lernenden mit Fortschritt */}
                <div className="bg-white rounded-2xl shadow p-6">
                  <h3 className="font-semibold mb-4">Lernende in {classes.find(c => c.id === selectedClassId)?.name || '—'}</h3>

                  {filteredLearners.length === 0 ? (
                    <p className="text-gray-600">Keine Lernenden in dieser Klasse.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left">
                            <th className="py-2 pr-4">Name</th>
                            <th className="py-2 px-2 text-center">Einträge</th>
                            <th className="py-2 px-2 text-center">Gesamt %</th>
                            <th className="py-2 px-2 text-center" title="Gesellschaftsinhalte">Gesellschaft</th>
                            <th className="py-2 px-2 text-center" title="Sprachmodi">Sprache</th>
                            <th className="py-2 px-2 text-center" title="Schlüsselkompetenzen">Schlüssel</th>
                            <th className="py-2 px-2 text-center">Themen</th>
                            <th className="py-2 px-2"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredLearners.map(l => {
                            const entries = classEntries[l.id] || [];
                            const progress = computeProgress(entries);
                            return (
                              <tr key={l.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => { setSelectedLearnerId(l.id); }}>
                                <td className="py-3 pr-4">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{l.name || l.displayName}</span>
                                    {l._isCodeOnly && <span className="text-xs text-yellow-600">(nicht eingeloggt)</span>}
                                  </div>
                                </td>
                                <td className="py-3 px-2 text-center">{l._isCodeOnly ? '—' : progress.totalEntries}</td>
                                <td className="py-3 px-2 text-center">
                                  {l._isCodeOnly ? '—' : (
                                    <div className="flex items-center gap-2">
                                      <ProgressBar percent={progress.overall} color="bg-blue-500" />
                                      <span className="text-xs font-medium w-8">{progress.overall}%</span>
                                    </div>
                                  )}
                                </td>
                                <td className="py-3 px-2 text-center text-xs">
                                  {l._isCodeOnly ? '—' : `${progress.gesellschaft.done}/${progress.gesellschaft.total}`}
                                </td>
                                <td className="py-3 px-2 text-center text-xs">
                                  {l._isCodeOnly ? '—' : `${progress.sprachmodus.done}/${progress.sprachmodus.total}`}
                                </td>
                                <td className="py-3 px-2 text-center text-xs">
                                  {l._isCodeOnly ? '—' : `${progress.schluesselkompetenz.done}/${progress.schluesselkompetenz.total}`}
                                </td>
                                <td className="py-3 px-2 text-center text-xs">
                                  {l._isCodeOnly ? '—' : `${progress.themen.size}/${ebaThemen.length}`}
                                </td>
                                <td className="py-3 px-2">
                                  {!l._isCodeOnly && (
                                    <button onClick={(e) => { e.stopPropagation(); setSelectedLearnerId(l.id); }} className="text-xs text-blue-600 hover:underline">Details</button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Detail eines ausgewählten Lernenden */}
                {selectedLearnerId && !selectedLearnerId.startsWith('code-') && (
                  <div className="bg-white rounded-2xl shadow p-6">
                    <h3 className="font-semibold mb-4">
                      Detail: {learners.find(l => l.id === selectedLearnerId)?.name || '—'}
                    </h3>

                    {(() => {
                      const entries = classEntries[selectedLearnerId] || [];
                      const progress = computeProgress(entries);

                      return (
                        <div className="space-y-6">
                          {/* Gesamtfortschritt */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="border rounded-xl p-4 text-center">
                              <div className="text-2xl font-bold text-blue-600">{progress.overall}%</div>
                              <div className="text-xs text-gray-600">Gesamtfortschritt</div>
                              <ProgressBar percent={progress.overall} color="bg-blue-500" height="h-1.5" />
                            </div>
                            <div className="border rounded-xl p-4 text-center">
                              <div className="text-2xl font-bold text-emerald-600">{progress.gesellschaft.done}/{progress.gesellschaft.total}</div>
                              <div className="text-xs text-gray-600">Gesellschaft</div>
                              <ProgressBar percent={(progress.gesellschaft.done / progress.gesellschaft.total) * 100} color="bg-emerald-500" height="h-1.5" />
                            </div>
                            <div className="border rounded-xl p-4 text-center">
                              <div className="text-2xl font-bold text-blue-500">{progress.sprachmodus.done}/{progress.sprachmodus.total}</div>
                              <div className="text-xs text-gray-600">Sprachmodi</div>
                              <ProgressBar percent={(progress.sprachmodus.done / progress.sprachmodus.total) * 100} color="bg-blue-400" height="h-1.5" />
                            </div>
                            <div className="border rounded-xl p-4 text-center">
                              <div className="text-2xl font-bold text-amber-600">{progress.schluesselkompetenz.done}/{progress.schluesselkompetenz.total}</div>
                              <div className="text-xs text-gray-600">Schlüsselkomp.</div>
                              <ProgressBar percent={(progress.schluesselkompetenz.done / progress.schluesselkompetenz.total) * 100} color="bg-amber-500" height="h-1.5" />
                            </div>
                          </div>

                          {/* Themen, in denen geübt wurde */}
                          <div>
                            <h4 className="font-medium text-sm mb-2">Geübte Themen</h4>
                            <div className="flex flex-wrap gap-2">
                              {ebaThemen.map(t => {
                                const active = progress.themen.has(t.id);
                                return (
                                  <span key={t.id} className={`text-xs px-3 py-1.5 rounded-full border ${active ? 'text-white font-medium' : 'text-gray-400 border-gray-200'}`}
                                    style={active ? { backgroundColor: t.color, borderColor: t.color } : {}}>
                                    T{t.order}: {t.title}
                                  </span>
                                );
                              })}
                            </div>
                          </div>

                          {/* Gesellschaftsinhalte Detail */}
                          <div>
                            <h4 className="font-medium text-sm mb-2">Gesellschaftsinhalte</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {gesellschaftsinhalte.map(g => {
                                const done = progress.gesellschaft.items.has(g.id);
                                return (
                                  <div key={g.id} className={`text-xs p-2 rounded-lg border ${done ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                                    <span className="w-2 h-2 rounded-full inline-block mr-1" style={{ backgroundColor: g.color }} />
                                    {g.label} {done ? '✓' : ''}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Sprachmodi Detail */}
                          <div>
                            <h4 className="font-medium text-sm mb-2">Sprachmodi</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {sprachmodi.map(s => {
                                const done = progress.sprachmodus.items.has(s.id);
                                return (
                                  <div key={s.id} className={`text-xs p-2 rounded-lg border ${done ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                                    <span className="font-mono text-gray-400 mr-1">{s.code}</span>
                                    {s.label} {done ? '✓' : ''}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Schlüsselkompetenzen Detail */}
                          <div>
                            <h4 className="font-medium text-sm mb-2">Schlüsselkompetenzen</h4>
                            <div className="space-y-1">
                              {schluesselkompetenzen.map(sk => {
                                const done = progress.schluesselkompetenz.items.has(sk.id);
                                return (
                                  <div key={sk.id} className={`text-xs p-2 rounded-lg border flex items-start gap-2 ${done ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                                    <span className="font-mono text-gray-400 shrink-0">{sk.code}</span>
                                    <span className="flex-1">{sk.label}</span>
                                    {done && <span className="text-green-600 shrink-0">✓</span>}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Einzelne Einträge */}
                          <div>
                            <h4 className="font-medium text-sm mb-2">Alle Einträge ({entries.length})</h4>
                            {entries.length === 0 ? (
                              <p className="text-gray-500 text-sm">Noch keine Einträge.</p>
                            ) : (
                              <div className="space-y-2">
                                {entries.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).map(e => {
                                  const typeLabels = {
                                    gesellschaft: { label: 'Gesellschaft', color: 'bg-emerald-100 text-emerald-800' },
                                    sprachmodus: { label: 'Sprache', color: 'bg-blue-100 text-blue-800' },
                                    schluesselkompetenz: { label: 'Schlüssel', color: 'bg-amber-100 text-amber-800' },
                                    transversal: { label: 'Transversal', color: 'bg-purple-100 text-purple-800' }
                                  };
                                  const typeInfo = typeLabels[e.type] || { label: e.type || '—', color: 'bg-gray-100 text-gray-800' };

                                  return (
                                    <div key={e.id} className="border rounded-lg p-3 text-sm">
                                      <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeInfo.color}`}>{typeInfo.label}</span>
                                            {e.themaId && <span className="text-xs text-gray-400">Thema {ebaThemen.find(t => t.id === e.themaId)?.order || '?'}</span>}
                                          </div>
                                          {e.inhalt && <div className="text-gray-800">{e.inhalt}</div>}
                                          <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-600">
                                            {e.howMethod && <span>Wo: <strong>{e.howMethod}</strong></span>}
                                            {e.howLearned && <span>Wie: <strong>{e.howLearned}</strong></span>}
                                            {e.createdAt && <span className="text-gray-400">{e.createdAt.toLocaleDateString('de-CH')}</span>}
                                          </div>
                                        </div>
                                        <button onClick={() => startNote(e)} className="p-2 border rounded-lg hover:bg-gray-50" title="Notiz hinzufügen">
                                          <MessageSquare className="w-4 h-4" />
                                        </button>
                                      </div>
                                      {e.teacherNote && (
                                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                                          <span className="font-medium">Lehrperson:</span> {e.teacherNote}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>

      {/* ===== CODE MODAL ===== */}
      {showCodeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold">Lernenden-Codes erstellen</h3>
                <p className="text-sm text-gray-600">Codes werden mit Tier-Pseudonymen generiert.</p>
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
                  <input type="number" min="1" max={TIER_NAMEN.length} value={codeAnzahl} onChange={(e) => setCodeAnzahl(parseInt(e.target.value) || 1)} className="w-full border rounded-lg px-3 py-2 text-lg font-medium" />
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
                        <div><div className="font-medium">{g.tier}</div><div className="font-mono text-sm text-gray-600">{g.code}</div></div>
                        <button onClick={() => copyCode(g.code)} className="px-3 py-2 border rounded-lg hover:bg-gray-50"><Copy className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== NOTIZ MODAL ===== */}
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
