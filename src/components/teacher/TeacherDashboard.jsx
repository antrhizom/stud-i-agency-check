import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  arrayUnion,
  arrayRemove,
  Timestamp
} from 'firebase/firestore';
import {
  schluesselkompetenzen,
  sprachmodi,
  gesellschaftsinhalte,
  transversaleThemen
} from '../../data/curriculumEBA';
import { SUBJECTS, getSubjectById, getClassSubjects, DEFAULT_SUBJECT_ID } from '../../data/subjects';
import {
  LogOut, Users, Plus, Copy, MessageSquare, Download, Trash2, BarChart3,
  Bell, CheckCircle, Send, UserPlus, LogIn, GraduationCap, Wrench, Filter
} from 'lucide-react';

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

// Fach eines Eintrags (Alt-Einträge ohne subjectId = ABU EBA)
const entrySubjectId = (e) => e.subjectId || DEFAULT_SUBJECT_ID;

// ============================================
// Fortschritts-Berechnung ABU (pro Fach)
// ============================================
function computeAbuProgress(entries, subject) {
  const themen = subject?.curriculum?.themen || [];
  const done = {
    gesellschaft: new Set(),
    sprachmodus: new Set(),
    schluesselkompetenz: new Set(),
    transversal: new Set()
  };
  const themenSet = new Set();

  const gesellschaftIds = new Set(gesellschaftsinhalte.map(g => g.id));
  const sprachmodusIds = new Set(sprachmodi.map(s => s.id));

  for (const e of entries) {
    if (e.type === 'gesellschaft' && e.bereich && gesellschaftIds.has(e.bereich)) {
      done.gesellschaft.add(e.bereich);
    } else if (e.type === 'sprachmodus' && e.modus && sprachmodusIds.has(e.modus)) {
      done.sprachmodus.add(e.modus);
    } else if (e.type === 'schluesselkompetenz' && (e.kompetenzId || e.schluesselkompetenzId)) {
      done.schluesselkompetenz.add(e.schluesselkompetenzId || e.kompetenzId);
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
    themenTotal: themen.length,
    totalEntries: entries.length
  };
}

// ============================================
// Fortschritts-Berechnung BK (pro Fach)
// ============================================
function computeBkProgress(entries, subject) {
  const totalZiele = (subject?.bk?.semester || []).reduce(
    (acc, sem) => acc + sem.gebiete.reduce((a, g) => a + g.ziele.length, 0), 0
  );
  const doneZiele = new Set(entries.map(e => e.zielId).filter(Boolean));
  const overall = totalZiele ? Math.round((doneZiele.size / totalZiele) * 100) : 0;
  return { overall, done: doneZiele.size, total: totalZiele, totalEntries: entries.length };
}

function ProgressBar({ percent, color = 'bg-blue-500', height = 'h-2' }) {
  return (
    <div className={`w-full bg-gray-200 rounded-full ${height} overflow-hidden`}>
      <div className={`${height} rounded-full ${color} transition-all`} style={{ width: `${Math.min(100, percent)}%` }} />
    </div>
  );
}

function SubjectBadge({ subject, small = false }) {
  if (!subject) return null;
  const Icon = subject.kind === 'bk' ? Wrench : GraduationCap;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${small ? 'text-[0.65rem] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'}`}
      style={{ backgroundColor: subject.color + '18', color: subject.color, border: `1px solid ${subject.color}40` }}
    >
      <Icon className={small ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
      {subject.short}
    </span>
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

  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedLearnerId, setSelectedLearnerId] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('alle'); // 'alle' | subjectId

  // Einträge-Tab: alle Einträge einer Klasse (ABU + BK gemischt, mit _collection)
  const [classEntries, setClassEntries] = useState({}); // { learnerId: [...entries] }
  const [loadingClassEntries, setLoadingClassEntries] = useState(false);

  // Klasse erstellen
  const [newClassName, setNewClassName] = useState('');
  const [newClassSubjects, setNewClassSubjects] = useState([]);
  const [creatingClass, setCreatingClass] = useState(false);

  // Klasse beitreten
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinMessage, setJoinMessage] = useState('');

  // Lernenden-Codes
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [codeAnzahl, setCodeAnzahl] = useState(10);
  const [generated, setGenerated] = useState([]);

  // Feedback
  const [noteEntryId, setNoteEntryId] = useState('');
  const [noteEntry, setNoteEntry] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [noteSaveSuccess, setNoteSaveSuccess] = useState(false);

  const [loading, setLoading] = useState(false);
  const [activityEntries, setActivityEntries] = useState([]);

  // ============================================
  // LADEN
  // ============================================
  const loadAll = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      // 1) Klassen: neue (teacherIds) + alte (teacherId) zusammenführen
      const [snapNew, snapOld] = await Promise.all([
        getDocs(query(collection(db, 'classes'), where('teacherIds', 'array-contains', currentUser.uid))),
        getDocs(query(collection(db, 'classes'), where('teacherId', '==', currentUser.uid)))
      ]);
      const byId = new Map();
      for (const d of [...snapNew.docs, ...snapOld.docs]) {
        byId.set(d.id, { id: d.id, ...d.data() });
      }
      const cls = [...byId.values()].sort((a, b) =>
        (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)
      );
      setClasses(cls);
      if (!selectedClassId && cls.length) setSelectedClassId(cls[0].id);

      // 2) Lernende + Codes pro Klasse laden (auch von Co-Lehrpersonen erstellt)
      const combined = [];
      const seenUser = new Set();
      const seenCodeKey = new Set();
      for (const c of cls) {
        const [usersSnap, codesSnap] = await Promise.all([
          getDocs(query(collection(db, 'users'), where('role', '==', 'learner'), where('classId', '==', c.id))),
          getDocs(query(collection(db, 'learnerCodes'), where('classId', '==', c.id)))
        ]);
        const classUsers = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const classCodes = codesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const userIdSet = new Set(classUsers.map(u => u.id));

        for (const u of classUsers) {
          if (seenUser.has(u.id)) continue;
          seenUser.add(u.id);
          const code = classCodes.find(cd => cd.userId === u.id);
          if (code && !u.code) u.code = code.code;
          combined.push(u);
        }
        const sortedCodes = [...classCodes].sort((a, b) =>
          (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)
        );
        for (const code of sortedCodes) {
          if (code.userId && userIdSet.has(code.userId)) continue;
          const dedupeKey = `${code.classId}__${code.name}`;
          if (seenCodeKey.has(dedupeKey)) continue;
          seenCodeKey.add(dedupeKey);
          combined.push({
            id: `code-${code.id}`,
            _isCodeOnly: true,
            _codeDocId: code.id,
            name: code.name || '(ohne Name)',
            classId: code.classId,
            code: code.code,
            used: code.used || false
          });
        }
      }
      combined.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setLearners(combined);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Einträge (ABU + BK) für Lernende laden
  const loadEntriesForLearners = useCallback(async (learnerIds) => {
    const result = {};
    for (const lid of learnerIds) result[lid] = [];
    for (let i = 0; i < learnerIds.length; i += 30) {
      const chunk = learnerIds.slice(i, i + 30);
      const [abuSnap, bkSnap] = await Promise.all([
        getDocs(query(collection(db, 'practiceEntriesEBA'), where('learnerId', 'in', chunk))),
        getDocs(query(collection(db, 'practiceEntriesBK'), where('learnerId', 'in', chunk)))
      ]);
      for (const d of abuSnap.docs) {
        const data = { id: d.id, _collection: 'practiceEntriesEBA', ...d.data(), createdAt: d.data().createdAt?.toDate?.() || null };
        (result[data.learnerId] = result[data.learnerId] || []).push(data);
      }
      for (const d of bkSnap.docs) {
        const data = { id: d.id, _collection: 'practiceEntriesBK', ...d.data(), createdAt: d.data().createdAt?.toDate?.() || null };
        (result[data.learnerId] = result[data.learnerId] || []).push(data);
      }
    }
    return result;
  }, []);

  // Alle Einträge einer Klasse laden (für Übersicht-Tab)
  useEffect(() => {
    if (activeTab !== 'entries' || !selectedClassId) return;
    const realLearners = learners.filter(l => !l._isCodeOnly && l.classId === selectedClassId);
    if (realLearners.length === 0) { setClassEntries({}); return; }
    setLoadingClassEntries(true);
    loadEntriesForLearners(realLearners.map(l => l.id))
      .then(setClassEntries)
      .catch(console.error)
      .finally(() => setLoadingClassEntries(false));
  }, [activeTab, selectedClassId, learners, loadEntriesForLearners]);

  // Aktivitäts-Feed: Einträge mit Lernenden-Notizen (ABU + BK)
  useEffect(() => {
    const realLearnerIds = learners.filter(l => !l._isCodeOnly).map(l => l.id);
    if (realLearnerIds.length === 0) { setActivityEntries([]); return; }
    loadEntriesForLearners(realLearnerIds)
      .then(result => {
        const all = Object.values(result).flat().filter(e => e.note);
        all.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setActivityEntries(all);
      })
      .catch(console.error);
  }, [learners, loadEntriesForLearners]);

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

  const selectedClass = useMemo(() => classes.find(c => c.id === selectedClassId) || null, [classes, selectedClassId]);
  const classSubjects = useMemo(() => selectedClass ? getClassSubjects(selectedClass) : [], [selectedClass]);

  // Fach-Filter zurücksetzen, wenn das Fach in der gewählten Klasse nicht existiert
  useEffect(() => {
    if (subjectFilter !== 'alle' && !classSubjects.some(s => s.id === subjectFilter)) {
      setSubjectFilter('alle');
    }
  }, [selectedClassId, classSubjects, subjectFilter]);

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

  // Aktivität nach Fach-Filter
  const filteredActivity = useMemo(() => {
    if (subjectFilter === 'alle') return activityEntries;
    return activityEntries.filter(e => entrySubjectId(e) === subjectFilter);
  }, [activityEntries, subjectFilter]);

  // ============================================
  // AKTIONEN
  // ============================================
  const toggleNewClassSubject = (id) => {
    setNewClassSubjects(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const createClass = async () => {
    if (!newClassName.trim() || !currentUser) return;
    if (newClassSubjects.length === 0) { alert('Bitte mindestens ein Fach auswählen.'); return; }
    setCreatingClass(true);
    try {
      await addDoc(collection(db, 'classes'), {
        name: newClassName.trim(),
        teacherId: currentUser.uid, // Abwärtskompatibilität
        teacherIds: [currentUser.uid],
        teacherNames: { [currentUser.uid]: userData?.displayName || userData?.name || userData?.email || 'Lehrperson' },
        subjectIds: newClassSubjects,
        joinCode: generateCode(),
        createdAt: Timestamp.now()
      });
      setNewClassName('');
      setNewClassSubjects([]);
      await loadAll();
    } finally { setCreatingClass(false); }
  };

  const joinClass = async () => {
    const code = joinCodeInput.toUpperCase().trim();
    if (code.length !== 6 || !currentUser) { setJoinMessage('Bitte 6-stelligen Klassen-Code eingeben.'); return; }
    setJoining(true);
    setJoinMessage('');
    try {
      const snap = await getDocs(query(collection(db, 'classes'), where('joinCode', '==', code)));
      if (snap.empty) {
        setJoinMessage('Kein Klassen-Code gefunden.');
        return;
      }
      const clsDoc = snap.docs[0];
      const cls = clsDoc.data();
      const existing = cls.teacherIds || (cls.teacherId ? [cls.teacherId] : []);
      if (existing.includes(currentUser.uid)) {
        setJoinMessage('Du unterrichtest diese Klasse bereits.');
        return;
      }
      await updateDoc(doc(db, 'classes', clsDoc.id), {
        teacherIds: existing.includes(currentUser.uid) ? existing : arrayUnion(...existing, currentUser.uid),
        [`teacherNames.${currentUser.uid}`]: userData?.displayName || userData?.name || userData?.email || 'Lehrperson'
      });
      setJoinCodeInput('');
      setJoinMessage(`Klasse «${cls.name}» beigetreten!`);
      await loadAll();
    } catch (err) {
      setJoinMessage('Fehler: ' + (err?.message || String(err)));
    } finally {
      setJoining(false);
    }
  };

  const leaveClass = async (cls) => {
    const teacherIds = cls.teacherIds || [];
    if (!confirm(`Klasse "${cls.name}" verlassen? Die Klasse bleibt für die anderen Lehrpersonen bestehen.`)) return;
    setLoading(true);
    try {
      const update = { teacherIds: arrayRemove(currentUser.uid) };
      if (cls.teacherId === currentUser.uid) {
        // Legacy-Feld auf andere Lehrperson übertragen, damit die Klasse auffindbar bleibt
        const other = teacherIds.find(t => t !== currentUser.uid);
        if (other) update.teacherId = other;
      }
      await updateDoc(doc(db, 'classes', cls.id), update);
      if (selectedClassId === cls.id) setSelectedClassId('');
      await loadAll();
    } finally { setLoading(false); }
  };

  const deleteClass = async (classId) => {
    const cls = classes.find(c => c.id === classId);
    const learnersInClass = (learnersByClass[classId] || []);
    if (!confirm(`Klasse "${cls?.name}" wirklich löschen? ${learnersInClass.length} Lernende in dieser Klasse werden ebenfalls entfernt. Dies gilt auch für Co-Lehrpersonen.`)) return;
    setLoading(true);
    try {
      const codesSnap = await getDocs(query(collection(db, 'learnerCodes'), where('classId', '==', classId)));
      for (const d of codesSnap.docs) await deleteDoc(doc(db, 'learnerCodes', d.id));
      const usersSnap = await getDocs(query(collection(db, 'users'), where('classId', '==', classId), where('role', '==', 'learner')));
      for (const d of usersSnap.docs) await deleteDoc(doc(db, 'users', d.id));
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
        await deleteDoc(doc(db, 'learnerCodes', learner._codeDocId));
      } else {
        await deleteDoc(doc(db, 'users', learner.id));
        const codeSnap = await getDocs(query(collection(db, 'learnerCodes'), where('userId', '==', learner.id)));
        for (const d of codeSnap.docs) await deleteDoc(doc(db, 'learnerCodes', d.id));
      }
      await loadAll();
    } finally { setLoading(false); }
  };

  const ensureJoinCode = async (cls) => {
    // Für Alt-Klassen ohne joinCode nachträglich einen erzeugen
    if (cls.joinCode) return cls.joinCode;
    const code = generateCode();
    await updateDoc(doc(db, 'classes', cls.id), {
      joinCode: code,
      teacherIds: cls.teacherIds?.length ? cls.teacherIds : [cls.teacherId].filter(Boolean)
    });
    await loadAll();
    return code;
  };

  const copyJoinCode = async (cls) => {
    const code = await ensureJoinCode(cls);
    await navigator.clipboard.writeText(code);
    alert(`Klassen-Code ${code} kopiert! Andere Lehrpersonen können damit der Klasse beitreten.`);
  };

  const openCodeModal = () => {
    if (!classes.length) { alert('Bitte zuerst eine Klasse anlegen.'); return; }
    setShowCodeModal(true);
    setGenerated([]);
    setCodeAnzahl(10);
  };

  const createCodes = async () => {
    if (!currentUser || !selectedClassId) { alert('Bitte Klasse wählen.'); return; }
    const existingCodesSnap = await getDocs(query(collection(db, 'learnerCodes'), where('classId', '==', selectedClassId)));
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
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `Lernenden-Codes_${className}_${new Date().toISOString().split('T')[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const copyCode = async (code) => { await navigator.clipboard.writeText(code); alert('Code kopiert!'); };

  const startNote = (entry) => { setNoteEntry(entry); setNoteEntryId(entry.id); setNoteText(entry.teacherNote || ''); };

  const saveNote = async () => {
    if (!noteEntryId) return;
    setSavingNote(true);
    try {
      const collectionName = noteEntry?._collection || 'practiceEntriesEBA';
      await updateDoc(doc(db, collectionName, noteEntryId), { teacherNote: noteText.trim() || null, teacherNoteAt: noteText.trim() ? Timestamp.now() : null });
      const updater = e => e.id === noteEntryId ? { ...e, teacherNote: noteText.trim() || null } : e;
      setClassEntries(prev => {
        const updated = { ...prev };
        for (const lid in updated) updated[lid] = updated[lid].map(updater);
        return updated;
      });
      setActivityEntries(prev => prev.map(updater));
      setNoteEntryId(''); setNoteText(''); setNoteEntry(null);
      setNoteSaveSuccess(true);
      setTimeout(() => setNoteSaveSuccess(false), 3000);
    } finally { setSavingNote(false); }
  };

  // ============================================
  // Hilfs-Renderer
  // ============================================
  const renderSubjectFilter = () => (
    <div className="flex items-center gap-2">
      <Filter className="w-4 h-4 text-gray-400" />
      <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
        <option value="alle">Alle Fächer</option>
        {classSubjects.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
      </select>
    </div>
  );

  const activitySubject = (e) => getSubjectById(entrySubjectId(e));

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/LogoABU_DNA.png" alt="Logo" className="h-10 w-10 object-contain" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">stud-i-agency-chek</h1>
              <p className="text-sm text-gray-600">Lehrperson · {userData?.displayName || userData?.name || ''}</p>
            </div>
          </div>
          <button onClick={signOut} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6 flex-wrap">
          <button onClick={() => setActiveTab('classes')} className={`px-4 py-2 rounded-lg ${activeTab==='classes' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>Klassen</button>
          <button onClick={() => setActiveTab('learners')} className={`px-4 py-2 rounded-lg ${activeTab==='learners' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>Lernende</button>
          <button onClick={() => setActiveTab('entries')} className={`px-4 py-2 rounded-lg ${activeTab==='entries' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>
            <BarChart3 className="w-4 h-4 inline mr-1" />Übersicht
          </button>
          <button onClick={() => setActiveTab('activity')} className={`px-4 py-2 rounded-lg relative flex items-center gap-1.5 ${activeTab==='activity' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>
            <Bell className="w-4 h-4" /> Aktivität
            {activityEntries.filter(e => !e.teacherNote).length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs rounded-full min-w-[1.25rem] h-5 flex items-center justify-center px-1">
                {activityEntries.filter(e => !e.teacherNote).length}
              </span>
            )}
          </button>
        </div>

        {/* ===== KLASSEN TAB ===== */}
        {activeTab === 'classes' && (
          <div className="space-y-6">
            {/* Neue Klasse erstellen */}
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Plus className="w-5 h-5" /> Neue Klasse erstellen</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Klassenname</label>
                  <input value={newClassName} onChange={(e) => setNewClassName(e.target.value)} placeholder="z.B. AA26a oder FAZ1 2026" className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-2">Fächer (mind. eines wählen)</label>
                  <div className="grid md:grid-cols-2 gap-2">
                    {SUBJECTS.map(s => {
                      const active = newClassSubjects.includes(s.id);
                      const Icon = s.kind === 'bk' ? Wrench : GraduationCap;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => toggleNewClassSubject(s.id)}
                          className={`flex items-center gap-2 border rounded-xl px-3 py-2.5 text-left text-sm transition ${active ? 'ring-2' : 'hover:bg-gray-50'}`}
                          style={active ? { borderColor: s.color, backgroundColor: s.color + '10', '--tw-ring-color': s.color + '60' } : {}}
                        >
                          <Icon className="w-4 h-4 shrink-0" style={{ color: s.color }} />
                          <span className="flex-1">{s.label}</span>
                          {active && <CheckCircle className="w-4 h-4 shrink-0" style={{ color: s.color }} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <button onClick={createClass} disabled={creatingClass || !newClassName.trim() || newClassSubjects.length === 0} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">
                  <Plus className="w-4 h-4 inline mr-1" /> Klasse erstellen
                </button>
              </div>
            </div>

            {/* Klasse beitreten */}
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="text-lg font-semibold mb-1 flex items-center gap-2"><LogIn className="w-5 h-5" /> Bestehender Klasse beitreten</h2>
              <p className="text-sm text-gray-500 mb-3">Gib den Klassen-Code ein, den dir die andere Lehrperson gegeben hat (z.B. der ABU- oder Fahrzeugtechnik-Lehrperson).</p>
              <div className="flex gap-3 flex-wrap">
                <input
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  placeholder="Klassen-Code (6 Zeichen)"
                  maxLength={6}
                  className="border rounded-lg px-3 py-2 font-mono tracking-widest uppercase w-56"
                />
                <button onClick={joinClass} disabled={joining || joinCodeInput.trim().length !== 6} className="px-4 py-2 bg-gray-900 text-white rounded-lg disabled:opacity-50">
                  <UserPlus className="w-4 h-4 inline mr-1" /> Beitreten
                </button>
              </div>
              {joinMessage && <p className="text-sm mt-2 text-blue-700">{joinMessage}</p>}
            </div>

            {/* Klassenliste */}
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Users className="w-5 h-5" /> Meine Klassen</h2>
              {classes.length === 0 ? (
                <p className="text-gray-600">Noch keine Klassen. Erstelle eine Klasse oder tritt einer bestehenden bei.</p>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {classes.map(c => {
                    const subs = getClassSubjects(c);
                    const teacherIds = c.teacherIds || (c.teacherId ? [c.teacherId] : []);
                    const teacherNames = teacherIds.map(tid =>
                      tid === currentUser.uid
                        ? 'Ich'
                        : (c.teacherNames?.[tid] || 'Lehrperson')
                    );
                    return (
                      <div key={c.id} className={`border rounded-xl p-4 ${selectedClassId===c.id ? 'border-blue-600' : 'border-gray-200'}`}>
                        <div className="flex items-start justify-between gap-2">
                          <button onClick={() => setSelectedClassId(c.id)} className="text-left flex-1">
                            <div className="font-medium">{c.name}</div>
                            <div className="text-sm text-gray-600">{(learnersByClass[c.id] || []).length} Lernende</div>
                          </button>
                          <div className="flex items-center gap-1">
                            {teacherIds.length > 1 ? (
                              <button onClick={() => leaveClass(c)} className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded" title="Klasse verlassen">
                                <LogOut className="w-4 h-4" />
                              </button>
                            ) : null}
                            <button onClick={() => deleteClass(c.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded" title="Klasse löschen">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {subs.map(s => <SubjectBadge key={s.id} subject={s} />)}
                        </div>
                        <div className="mt-3 pt-3 border-t flex items-center justify-between gap-2 flex-wrap">
                          <div className="text-xs text-gray-500">
                            <Users className="w-3 h-3 inline mr-1" />
                            {teacherNames.join(', ')}
                          </div>
                          <button onClick={() => copyJoinCode(c)} className="flex items-center gap-1 text-xs px-2 py-1 border rounded-lg hover:bg-gray-50 font-mono" title="Klassen-Code für Co-Lehrpersonen kopieren">
                            <Copy className="w-3 h-3" />
                            {c.joinCode || 'Code erzeugen'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-6">
                <button onClick={openCodeModal} className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black">
                  <Plus className="w-4 h-4" /> Lernenden-Codes erstellen
                </button>
              </div>
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

        {/* ===== ÜBERSICHT TAB ===== */}
        {activeTab === 'entries' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow p-6">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Klassenübersicht</h2>
                  <p className="text-sm text-gray-600">Fortschritt aller Lernenden – pro Fach oder über alle Fächer</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {renderSubjectFilter()}
                  <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} className="border rounded-lg px-3 py-2">
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {loadingClassEntries ? (
              <div className="text-center py-8 text-gray-500">Lade Einträge...</div>
            ) : (
              <>
                <div className="bg-white rounded-2xl shadow p-6">
                  <h3 className="font-semibold mb-4">Lernende in {selectedClass?.name || '—'}</h3>

                  {filteredLearners.length === 0 ? (
                    <p className="text-gray-600">Keine Lernenden in dieser Klasse.</p>
                  ) : subjectFilter === 'alle' ? (
                    /* Kompakte Übersicht über alle Fächer */
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left">
                            <th className="py-2 pr-4">Name</th>
                            <th className="py-2 px-2 text-center">Einträge</th>
                            {classSubjects.map(s => (
                              <th key={s.id} className="py-2 px-2 text-center"><SubjectBadge subject={s} small /></th>
                            ))}
                            <th className="py-2 px-2"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredLearners.map(l => {
                            const entries = classEntries[l.id] || [];
                            return (
                              <tr key={l.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedLearnerId(l.id)}>
                                <td className="py-3 pr-4">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{l.name || l.displayName}</span>
                                    {l._isCodeOnly && <span className="text-xs text-yellow-600">(nicht eingeloggt)</span>}
                                  </div>
                                </td>
                                <td className="py-3 px-2 text-center">{l._isCodeOnly ? '—' : entries.length}</td>
                                {classSubjects.map(s => {
                                  if (l._isCodeOnly) return <td key={s.id} className="py-3 px-2 text-center">—</td>;
                                  const subjEntries = entries.filter(e => entrySubjectId(e) === s.id);
                                  const progress = s.kind === 'bk'
                                    ? computeBkProgress(subjEntries, s)
                                    : computeAbuProgress(subjEntries, s);
                                  return (
                                    <td key={s.id} className="py-3 px-2 text-center">
                                      <div className="flex items-center gap-2 justify-center">
                                        <div className="w-16"><ProgressBar percent={progress.overall} color="bg-blue-500" /></div>
                                        <span className="text-xs font-medium w-8">{progress.overall}%</span>
                                      </div>
                                    </td>
                                  );
                                })}
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
                  ) : (() => {
                    /* Detailansicht für EIN Fach */
                    const subject = getSubjectById(subjectFilter);
                    if (!subject) return null;
                    if (subject.kind === 'bk') {
                      return (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b text-left">
                                <th className="py-2 pr-4">Name</th>
                                <th className="py-2 px-2 text-center">Einträge</th>
                                <th className="py-2 px-2 text-center">Leistungsziele geübt</th>
                                <th className="py-2 px-2 text-center">Gesamt %</th>
                                <th className="py-2 px-2"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredLearners.map(l => {
                                const entries = (classEntries[l.id] || []).filter(e => entrySubjectId(e) === subject.id);
                                const p = computeBkProgress(entries, subject);
                                return (
                                  <tr key={l.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedLearnerId(l.id)}>
                                    <td className="py-3 pr-4">
                                      <span className="font-medium">{l.name || l.displayName}</span>
                                      {l._isCodeOnly && <span className="text-xs text-yellow-600 ml-2">(nicht eingeloggt)</span>}
                                    </td>
                                    <td className="py-3 px-2 text-center">{l._isCodeOnly ? '—' : p.totalEntries}</td>
                                    <td className="py-3 px-2 text-center text-xs">{l._isCodeOnly ? '—' : `${p.done}/${p.total}`}</td>
                                    <td className="py-3 px-2 text-center">
                                      {l._isCodeOnly ? '—' : (
                                        <div className="flex items-center gap-2">
                                          <ProgressBar percent={p.overall} color="bg-orange-500" />
                                          <span className="text-xs font-medium w-8">{p.overall}%</span>
                                        </div>
                                      )}
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
                      );
                    }
                    const themen = subject.curriculum.themen;
                    return (
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
                              const entries = (classEntries[l.id] || []).filter(e => entrySubjectId(e) === subject.id);
                              const progress = computeAbuProgress(entries, subject);
                              return (
                                <tr key={l.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedLearnerId(l.id)}>
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
                                    {l._isCodeOnly ? '—' : `${progress.themen.size}/${themen.length}`}
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
                    );
                  })()}
                </div>

                {/* Detail eines ausgewählten Lernenden */}
                {selectedLearnerId && !selectedLearnerId.startsWith('code-') && (
                  <div className="bg-white rounded-2xl shadow p-6">
                    <h3 className="font-semibold mb-4">
                      Detail: {learners.find(l => l.id === selectedLearnerId)?.name || '—'}
                    </h3>

                    {(() => {
                      const allEntries = classEntries[selectedLearnerId] || [];
                      const detailSubjects = subjectFilter === 'alle'
                        ? classSubjects
                        : classSubjects.filter(s => s.id === subjectFilter);

                      return (
                        <div className="space-y-8">
                          {detailSubjects.map(subject => {
                            const entries = allEntries.filter(e => entrySubjectId(e) === subject.id);
                            if (subject.kind === 'bk') {
                              const p = computeBkProgress(entries, subject);
                              return (
                                <div key={subject.id}>
                                  <div className="flex items-center gap-2 mb-3">
                                    <SubjectBadge subject={subject} />
                                    <span className="text-xs text-gray-500">{p.totalEntries} Einträge · {p.done}/{p.total} Leistungsziele</span>
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                                    <div className="border rounded-xl p-4 text-center">
                                      <div className="text-2xl font-bold" style={{ color: subject.color }}>{p.overall}%</div>
                                      <div className="text-xs text-gray-600">Leistungsziele geübt</div>
                                      <ProgressBar percent={p.overall} color="bg-orange-500" height="h-1.5" />
                                    </div>
                                    <div className="border rounded-xl p-4 text-center">
                                      <div className="text-2xl font-bold text-gray-800">{p.totalEntries}</div>
                                      <div className="text-xs text-gray-600">Einträge</div>
                                    </div>
                                  </div>
                                  {entries.length > 0 && (
                                    <div className="space-y-2">
                                      {entries.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).map(e => (
                                        <div key={e.id} className="border rounded-lg p-3 text-sm">
                                          <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex-1">
                                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-orange-100 text-orange-800">{e.lnr}</span>
                                                <span className="text-xs text-gray-400">{e.semester}. Sem. · {e.gebiet}</span>
                                              </div>
                                              <div className="text-gray-800 font-medium">{e.thema}</div>
                                              {e.ziel && <div className="text-xs text-gray-600">{e.ziel}</div>}
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
                                          {e.note && <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs"><span className="font-medium">Lernende:r:</span> {e.note}</div>}
                                          {e.teacherNote && (
                                            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                                              <span className="font-medium">Lehrperson:</span> {e.teacherNote}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            }

                            const progress = computeAbuProgress(entries, subject);
                            const themen = subject.curriculum.themen;
                            return (
                              <div key={subject.id}>
                                <div className="flex items-center gap-2 mb-3">
                                  <SubjectBadge subject={subject} />
                                  <span className="text-xs text-gray-500">{progress.totalEntries} Einträge</span>
                                </div>
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

                                <div className="mt-4">
                                  <h4 className="font-medium text-sm mb-2">Geübte Themen</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {themen.map(t => {
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

                                {entries.length > 0 && (
                                  <div className="mt-4">
                                    <h4 className="font-medium text-sm mb-2">Alle Einträge ({entries.length})</h4>
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
                                                  {e.themaId && <span className="text-xs text-gray-400">Thema {themen.find(t => t.id === e.themaId)?.order || '?'}</span>}
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
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ===== AKTIVITÄT TAB ===== */}
        {activeTab === 'activity' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2 mb-1">
                    <Bell className="w-5 h-5 text-amber-500" /> Aktivität
                  </h2>
                  <p className="text-sm text-gray-500">
                    Einträge mit Notizen von Lernenden
                    {filteredActivity.filter(e => !e.teacherNote).length > 0 && (
                      <span className="ml-2 bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-medium">
                        {filteredActivity.filter(e => !e.teacherNote).length} ohne Kommentar
                      </span>
                    )}
                  </p>
                </div>
                {renderSubjectFilter()}
              </div>
            </div>

            {filteredActivity.length === 0 ? (
              <div className="bg-white rounded-2xl shadow p-10 text-center text-gray-500">
                Noch keine Notizen von Lernenden vorhanden.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredActivity.map(entry => {
                  const learnerName = learners.find(l => l.id === entry.learnerId)?.name || '—';
                  const subj = activitySubject(entry);
                  const typeLabels = {
                    gesellschaft: { label: 'Gesellschaft', color: 'bg-emerald-100 text-emerald-800' },
                    sprachmodus: { label: 'Sprache', color: 'bg-blue-100 text-blue-800' },
                    schluesselkompetenz: { label: 'Schlüssel', color: 'bg-amber-100 text-amber-800' },
                    transversal: { label: 'Transversal', color: 'bg-purple-100 text-purple-800' }
                  };
                  const typeInfo = entry._collection === 'practiceEntriesBK'
                    ? { label: entry.lnr || 'BK', color: 'bg-orange-100 text-orange-800' }
                    : (typeLabels[entry.type] || { label: entry.type || '—', color: 'bg-gray-100 text-gray-800' });
                  const needsComment = !entry.teacherNote;

                  return (
                    <div key={entry.id} className={`bg-white rounded-2xl shadow p-5 ${needsComment ? 'border-l-4 border-amber-400' : 'border-l-4 border-green-300'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="font-semibold text-sm">{learnerName}</span>
                            {subj && <SubjectBadge subject={subj} small />}
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeInfo.color}`}>{typeInfo.label}</span>
                            {entry.createdAt && <span className="text-xs text-gray-400">{entry.createdAt.toLocaleDateString('de-CH')}</span>}
                          </div>
                          {(entry.inhalt || entry.thema) && <div className="text-sm text-gray-600 mb-2 italic">{entry.inhalt || entry.thema}</div>}

                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
                            <div className="text-xs font-semibold text-blue-700 mb-1">📝 Notiz der/des Lernenden</div>
                            <div className="text-sm text-gray-800">{entry.note}</div>
                          </div>

                          {entry.teacherNote && (
                            <div className="ml-4 space-y-2">
                              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                <div className="text-xs font-semibold text-amber-700 mb-1">💬 Mein Kommentar</div>
                                <div className="text-sm text-gray-800">{entry.teacherNote}</div>
                              </div>
                              {entry.learnerReply && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <Send className="w-3 h-3 text-green-600" />
                                    <span className="text-xs font-semibold text-green-700">Antwort von {learnerName}</span>
                                  </div>
                                  <div className="text-sm text-gray-800">{entry.learnerReply}</div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => startNote(entry)}
                          className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${needsComment ? 'bg-amber-500 text-white hover:bg-amber-600' : 'border hover:bg-gray-50 text-gray-600'}`}
                        >
                          <MessageSquare className="w-4 h-4" />
                          {entry.teacherNote ? 'Bearbeiten' : 'Kommentieren'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Feedback geben</h3>

            {noteEntry?.note && (
              <div className="mb-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="text-xs font-semibold text-blue-700 mb-1">
                  📝 Notiz von {learners.find(l => l.id === noteEntry?.learnerId)?.name || '—'}
                </div>
                {(noteEntry?.inhalt || noteEntry?.thema) && <div className="text-xs text-gray-500 mb-1 italic">{noteEntry.inhalt || noteEntry.thema}</div>}
                <div className="text-sm text-gray-800">{noteEntry.note}</div>
              </div>
            )}

            {noteEntry?.learnerReply && (
              <div className="mb-3 bg-green-50 border border-green-200 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Send className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-xs font-semibold text-green-700">Antwort der/des Lernenden</span>
                </div>
                <div className="text-sm text-gray-800">{noteEntry.learnerReply}</div>
              </div>
            )}

            <label className="text-sm font-medium text-gray-700 block mb-1">Mein Kommentar</label>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 h-28 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="Feedback, Hinweise, nächste Schritte..."
              autoFocus
            />
            <div className="flex gap-2 mt-4">
              <button onClick={() => { setNoteEntryId(''); setNoteText(''); setNoteEntry(null); }} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Abbrechen</button>
              <button onClick={saveNote} disabled={savingNote} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
                {savingNote ? 'Speichere…' : <><CheckCircle className="w-4 h-4" /> Speichern</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== SAVE SUCCESS TOAST ===== */}
      {noteSaveSuccess && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 z-50">
          <CheckCircle className="w-5 h-5" /> Kommentar gespeichert!
        </div>
      )}
    </div>
  );
}
