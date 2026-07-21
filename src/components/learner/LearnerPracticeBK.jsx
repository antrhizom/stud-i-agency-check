import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  Timestamp
} from 'firebase/firestore';
import {
  LogOut,
  ChevronDown,
  ChevronRight,
  Wrench,
  BarChart3,
  ListChecks,
  Trash2,
  Send,
  CheckCircle,
  MessageSquare,
  Bell,
  BookOpen
} from 'lucide-react';
import DemoBanner from '../DemoBanner';
import { StickerPickerModal, AlbumView } from './StickerAlbum';

// Beispiel-Lernende:r, deren BK-Einträge im Demo-Modus angezeigt werden
const DEMO_LEARNER_ID = 'demo-lernende-2';

const STATUS_OPTIONS = [
  { id: 'kurz', label: 'kurz geübt', color: '#FEF3C7' },
  { id: 'mittel', label: 'mittel geübt', color: '#FED7AA' },
  { id: 'stark', label: 'stark geübt', color: '#DCFCE7' }
];

const WHERE_OPTIONS = [
  'Im Unterricht',
  'Im Betrieb',
  'Im ÜK',
  'Zu Hause',
  'In einer Freistunde',
  'Sonstige'
];

const HOW_OPTIONS = [
  'mit praktischer Arbeit am Fahrzeug',
  'mit Aufgaben aus dem Lehrmittel (z.B. Beook)',
  'mit digitalen Lernübungen',
  'mit Repetition / Zusammenfassung',
  'mit Prüfungsvorbereitung',
  'Sonstige'
];

const GEBIET_COLORS = {
  'Betriebliche Prozesse': '#0EA5E9',
  'Elektrotechnik': '#F59E0B',
  'Elektro- und Alternativantrieb': '#10B981',
  'Fahrwerk': '#8B5CF6',
  'Antrieb': '#EC4899',
  'Motor': '#DC2626',
  'Stoffkunde': '#14B8A6'
};

const gebietColor = (name) => GEBIET_COLORS[name] || '#6B7280';

// ============================================
// Leistungsziel-Karte mit Inline-Erfassung
// ============================================
function ZielCard({ ziel, semester, entries, onSave }) {
  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [formData, setFormData] = useState({ status: 'kurz', howMethod: '', howLearned: '', note: '' });

  const zielId = `s${semester}-${ziel.lnr.replace(/\./g, '')}`;
  const zielEntries = entries.filter(e => e.zielId === zielId);
  const color = gebietColor(ziel.gebiet || '');

  const handleSave = () => {
    if (!formData.howMethod) { alert('Bitte wähle einen Ort aus.'); return; }
    if (!formData.howLearned) { alert('Bitte wähle aus, wie du geübt hast.'); return; }
    onSave({
      zielId,
      lnr: ziel.lnr,
      semester,
      gebiet: ziel.gebiet || null,
      thema: ziel.thema,
      ziel: ziel.ziel,
      ...formData
    });
    setFormData({ status: 'kurz', howMethod: '', howLearned: '', note: '' });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const savedNotes = zielEntries
    .filter(e => e.note)
    .slice()
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 3);

  return (
    <div className="border rounded-lg mb-2 overflow-hidden bg-white">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 flex items-start gap-3 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-mono text-xs mt-0.5 px-1.5 py-0.5 rounded shrink-0 text-white" style={{ backgroundColor: color }}>
          {ziel.lnr}
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm">{ziel.thema}</div>
          <div className="text-xs text-gray-600 mt-0.5">{ziel.ziel}</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {zielEntries.length > 0 && (
            <span className="px-2 py-0.5 text-xs rounded-full font-medium" style={{ backgroundColor: color + '20', color }}>
              {zielEntries.length}×
            </span>
          )}
          {open ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t bg-gray-50/50">
          {/* Detailpunkte aus dem Schullehrplan */}
          {ziel.details?.length > 0 && (
            <ul className="mt-3 space-y-1">
              {ziel.details.map((d, i) => (
                <li key={i} className="text-xs text-gray-700 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: color }} />
                  {d}
                </li>
              ))}
            </ul>
          )}

          {/* Gespeicherte Notizen */}
          {savedNotes.length > 0 && (
            <div className="mt-3 space-y-1">
              {savedNotes.map((e, i) => (
                <div key={i} className="text-xs bg-white border rounded px-2 py-1.5 flex items-start gap-1.5">
                  <span className="shrink-0 text-gray-500">📝</span>
                  <span className="flex-1 text-gray-700 italic">{e.note}</span>
                  {e.createdAt instanceof Date && (
                    <span className="ml-1 text-gray-400 shrink-0">{e.createdAt.toLocaleDateString('de-CH')}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="mt-3 px-4 py-1.5 text-white text-xs rounded-lg font-medium"
              style={{ backgroundColor: color }}
            >
              + Üben erfassen
            </button>
          ) : (
            <div className="mt-3 p-3 bg-white rounded-lg border space-y-3">
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, status: opt.id }))}
                    className={`px-3 py-1 text-xs rounded-lg border transition-colors ${formData.status === opt.id ? 'ring-2 ring-blue-300' : ''}`}
                    style={{ backgroundColor: opt.color }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="flex-1 min-w-[150px]">
                  <label className="text-xs text-gray-600 block mb-1">Wo geübt?</label>
                  <select
                    value={formData.howMethod}
                    onChange={(e) => setFormData(prev => ({ ...prev, howMethod: e.target.value }))}
                    className="w-full px-2 py-1.5 border rounded text-xs"
                  >
                    <option value="">— wählen —</option>
                    {WHERE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
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
                    {HOW_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">Notiz (optional)</label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="Was habe ich gelernt? Was war schwierig?"
                  className="w-full px-2 py-1.5 border rounded text-xs h-16 resize-none focus:outline-none focus:ring-1 focus:ring-blue-300"
                />
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 font-medium"
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
      )}
    </div>
  );
}

// ============================================
// HAUPTKOMPONENTE BK (Berufskunde)
// ============================================
export default function LearnerPracticeBK({ subject }) {
  const { signOut, userData, currentUser } = useAuth();
  const isDemo = userData?.isDemo === true;
  const effectiveLearnerId = isDemo ? DEMO_LEARNER_ID : currentUser?.uid;
  const bk = subject.bk;
  const [activeTab, setActiveTab] = useState('ueben'); // ueben | eintraege | fortschritt
  const [activeSemester, setActiveSemester] = useState(1);
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState([]);
  const [saveToast, setSaveToast] = useState(false);
  const [replyEntry, setReplyEntry] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [savingReply, setSavingReply] = useState(false);

  // Abziehbilder-Album
  const [stickers, setStickers] = useState([]);
  const [pickerSource, setPickerSource] = useState(null);

  const loadEntries = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'practiceEntriesBK'),
        where('learnerId', '==', isDemo ? DEMO_LEARNER_ID : currentUser.uid),
        where('subjectId', '==', subject.id)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate?.() || null
      }));
      data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setEntries(data);
    } catch (err) {
      console.error('Error loading BK entries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, subject.id]);

  // Album-Sticker laden (fachübergreifend pro Lernende:r)
  useEffect(() => {
    if (!effectiveLearnerId) return;
    const load = async () => {
      const snap = await getDocs(query(collection(db, 'albumStickers'), where('learnerId', '==', effectiveLearnerId)));
      setStickers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    load().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveLearnerId]);

  // Leistungsziel stark geübt? -> Abziehbild anbieten (einmal pro Leistungsziel)
  const maybeOfferSticker = (data) => {
    if (data.status !== 'stark') return;
    const sourceId = `${subject.id}:${data.zielId}`;
    if (stickers.some(st => st.sourceId === sourceId)) return;
    setPickerSource({ sourceId, sourceText: `${data.lnr} ${data.thema}` });
  };

  const pickSticker = async (st) => {
    if (!pickerSource) return;
    const stickerDoc = {
      learnerId: effectiveLearnerId,
      stickerId: st.id,
      subjectId: subject.id,
      sourceId: pickerSource.sourceId,
      sourceText: pickerSource.sourceText || null,
      createdAt: Timestamp.now()
    };
    setPickerSource(null);
    if (isDemo) {
      setStickers(prev => [...prev, { id: `demo-local-${Date.now()}`, ...stickerDoc }]);
      return;
    }
    try {
      const ref = await addDoc(collection(db, 'albumStickers'), stickerDoc);
      setStickers(prev => [...prev, { id: ref.id, ...stickerDoc }]);
    } catch (err) {
      alert('Fehler: ' + (err?.message || String(err)));
    }
  };

  const saveEntry = async (data) => {
    if (!currentUser) return;
    try {
      const payload = {
        learnerId: effectiveLearnerId,
        teacherId: userData?.teacherId || null,
        classId: userData?.classId || null,
        subjectId: subject.id,
        ...data,
        createdAt: Timestamp.now()
      };
      let newId;
      if (isDemo) {
        // Demo: nur lokal - nichts wird dauerhaft gespeichert
        newId = `demo-local-${Date.now()}`;
      } else {
        const docRef = await addDoc(collection(db, 'practiceEntriesBK'), payload);
        newId = docRef.id;
      }
      setEntries(prev => [{ ...payload, id: newId, createdAt: new Date() }, ...prev]);
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 2500);
      maybeOfferSticker(data);
    } catch (err) {
      alert('Fehler: ' + (err?.message || String(err)));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Eintrag wirklich löschen?')) return;
    if (isDemo) {
      // Demo: nur lokal entfernen (nach Neuladen wieder da)
      setEntries(prev => prev.filter(e => e.id !== id));
      return;
    }
    try {
      await deleteDoc(doc(db, 'practiceEntriesBK', id));
      setEntries(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      alert('Fehler: ' + (err?.message || String(err)));
    }
  };

  const saveReply = async () => {
    if (!replyEntry) return;
    if (isDemo) {
      setEntries(prev => prev.map(e => e.id === replyEntry.id ? { ...e, learnerReply: replyText.trim() || null } : e));
      setReplyEntry(null); setReplyText('');
      return;
    }
    setSavingReply(true);
    try {
      await updateDoc(doc(db, 'practiceEntriesBK', replyEntry.id), {
        learnerReply: replyText.trim() || null,
        learnerReplyAt: replyText.trim() ? Timestamp.now() : null
      });
      setEntries(prev => prev.map(e => e.id === replyEntry.id ? { ...e, learnerReply: replyText.trim() || null } : e));
      setReplyEntry(null);
      setReplyText('');
    } finally {
      setSavingReply(false);
    }
  };

  const semesterData = bk.semester.find(s => s.semester === activeSemester);
  const unansweredComments = entries.filter(e => e.teacherNote && !e.learnerReply).length;

  // Fortschritt: einzigartige Leistungsziele pro Semester
  const progress = useMemo(() => {
    return bk.semester.map(sem => {
      const total = sem.gebiete.reduce((acc, g) => acc + g.ziele.length, 0);
      const doneSet = new Set(entries.filter(e => e.semester === sem.semester).map(e => e.zielId));
      return { semester: sem.semester, total, done: doneSet.size };
    });
  }, [entries, bk]);

  return (
    <div className="min-h-screen bg-gray-50">
      {saveToast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">Gespeichert!</span>
        </div>
      )}

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

      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wrench className="h-9 w-9 p-1.5 rounded-lg text-white" style={{ backgroundColor: subject.color }} />
            <div>
              <h1 className="text-xl font-bold text-gray-900">stud-i-agency · {subject.short}</h1>
              <p className="text-sm text-gray-600">
                {bk.beruf} · {userData?.name || userData?.displayName || 'Lernende:r'}
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

      {isDemo && <DemoBanner role="learner" />}

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Hauptnavigation */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveTab('ueben')}
            className={`px-4 py-2 rounded-lg border flex items-center gap-2 transition-colors ${activeTab === 'ueben' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-gray-50'}`}
          >
            <BookOpen className="w-4 h-4" />
            Üben erfassen
          </button>
          <button
            onClick={() => setActiveTab('eintraege')}
            className={`px-4 py-2 rounded-lg border flex items-center gap-2 relative transition-colors ${activeTab === 'eintraege' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-gray-50'}`}
          >
            <ListChecks className="w-4 h-4" />
            Meine Einträge ({entries.length})
            {unansweredComments > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs rounded-full min-w-[1.25rem] h-5 flex items-center justify-center px-1 font-bold">
                {unansweredComments}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('fortschritt')}
            className={`px-4 py-2 rounded-lg border flex items-center gap-2 transition-colors ${activeTab === 'fortschritt' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-gray-50'}`}
          >
            <BarChart3 className="w-4 h-4" />
            Fortschritt
          </button>
          <button
            onClick={() => setActiveTab('album')}
            className={`px-4 py-2 rounded-lg border flex items-center gap-2 transition-colors ${activeTab === 'album' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-gray-50'}`}
          >
            <CheckCircle className="w-4 h-4" />
            Album ({stickers.length})
          </button>
        </div>

        {activeTab === 'ueben' && (
          <>
            {/* Semester Tabs */}
            <div className="flex gap-2 mb-6 flex-wrap">
              {bk.semester.map(sem => (
                <button
                  key={sem.semester}
                  onClick={() => setActiveSemester(sem.semester)}
                  className={`flex-1 min-w-[7rem] py-3 rounded-lg border font-medium transition-colors ${activeSemester === sem.semester ? 'text-white' : 'bg-white hover:bg-gray-50'}`}
                  style={activeSemester === sem.semester ? { backgroundColor: subject.color, borderColor: subject.color } : {}}
                >
                  {sem.semester}. Semester
                </button>
              ))}
            </div>

            {semesterData ? (
              <div className="space-y-4">
                {semesterData.gebiete.map(gebiet => (
                  <div key={gebiet.name}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: gebietColor(gebiet.name) }} />
                      <h3 className="font-semibold text-gray-800">{gebiet.name}</h3>
                      <span className="text-xs text-gray-400">({gebiet.ziele.length} Leistungsziele)</span>
                    </div>
                    {gebiet.ziele.map(z => (
                      <ZielCard
                        key={z.lnr}
                        ziel={{ ...z, gebiet: gebiet.name }}
                        semester={semesterData.semester}
                        entries={entries}
                        onSave={saveEntry}
                      />
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Kein Semester ausgewählt.</p>
            )}
          </>
        )}

        {activeTab === 'eintraege' && (
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h2 className="text-lg font-bold mb-4">Meine Einträge</h2>
            {unansweredComments > 0 && (
              <div className="mb-4 bg-amber-50 border-2 border-amber-400 rounded-xl p-3 flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-sm text-amber-800 font-medium">
                  {unansweredComments === 1
                    ? '1 neue Rückmeldung der Lehrperson – bitte antworten!'
                    : `${unansweredComments} neue Rückmeldungen der Lehrperson – bitte antworten!`}
                </span>
              </div>
            )}
            {loading ? (
              <p className="text-gray-500">Lade...</p>
            ) : entries.length === 0 ? (
              <p className="text-gray-500">Noch keine Einträge vorhanden.</p>
            ) : (
              <div className="space-y-2">
                {entries.map(e => {
                  const statusInfo = STATUS_OPTIONS.find(s => s.id === e.status);
                  const color = gebietColor(e.gebiet || '');
                  return (
                    <div key={e.id} className={`bg-white border rounded-lg p-4 shadow-sm ${e.teacherNote && !e.learnerReply ? 'ring-2 ring-amber-400' : ''}`} style={{ borderLeftColor: color, borderLeftWidth: 4 }}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-mono text-xs px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: color }}>{e.lnr}</span>
                            <span className="text-xs text-gray-500">{e.semester}. Sem. · {e.gebiet}</span>
                            {e.createdAt && <span className="text-xs text-gray-400">{e.createdAt.toLocaleDateString('de-CH')}</span>}
                          </div>
                          <p className="text-sm font-medium text-gray-800">{e.thema}</p>
                          <p className="text-xs text-gray-600 mt-0.5">{e.ziel}</p>
                          {e.note && <div className="mt-2 text-xs bg-gray-50 border rounded p-2 text-gray-700 italic">📝 {e.note}</div>}
                          <div className="mt-2 flex flex-wrap gap-3 text-xs">
                            {statusInfo && <span className="px-2 py-1 rounded" style={{ backgroundColor: statusInfo.color }}>{statusInfo.label}</span>}
                            <span className="text-gray-600">Wo: <strong>{e.howMethod}</strong></span>
                            {e.howLearned && <span className="text-gray-600">Wie: <strong>{e.howLearned}</strong></span>}
                          </div>
                          {e.teacherNote && (
                            <div className="mt-3 space-y-2 pt-3 border-t">
                              <div className={`text-sm rounded-lg p-3 ${!e.learnerReply ? 'bg-amber-100 border-2 border-amber-400' : 'bg-amber-50 border border-amber-200'}`}>
                                <div className="flex items-center gap-1.5 mb-1">
                                  <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                                  <span className="text-xs font-semibold text-amber-700">Kommentar der Lehrperson</span>
                                </div>
                                <p className="text-gray-800 text-sm">{e.teacherNote}</p>
                              </div>
                              {e.learnerReply ? (
                                <div className="text-sm bg-blue-50 border border-blue-200 rounded-lg p-3 ml-4">
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <Send className="w-3.5 h-3.5 text-blue-600" />
                                    <span className="text-xs font-semibold text-blue-700">Meine Antwort</span>
                                  </div>
                                  <p className="text-gray-800">{e.learnerReply}</p>
                                  <button onClick={() => { setReplyEntry(e); setReplyText(e.learnerReply || ''); }} className="mt-1 text-xs text-blue-500 hover:text-blue-700">Bearbeiten</button>
                                </div>
                              ) : (
                                <button onClick={() => { setReplyEntry(e); setReplyText(''); }} className="ml-4 flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium">
                                  <Send className="w-3.5 h-3.5" /> Antworten
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        <button onClick={() => handleDelete(e.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'fortschritt' && (
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h2 className="text-lg font-bold mb-1">Fortschritt Berufskunde</h2>
            <p className="text-sm text-gray-600 mb-4">
              Anzahl Leistungsziele, zu denen du mindestens einmal Üben erfasst hast.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {progress.map(p => {
                const pct = p.total ? Math.round((p.done / p.total) * 100) : 0;
                return (
                  <div key={p.semester} className="border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{p.semester}. Semester</span>
                      <span className="text-sm text-gray-600">{p.done}/{p.total} Leistungsziele</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                      <div className="h-2.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: subject.color }} />
                    </div>
                    <div className="text-right text-xs text-gray-500 mt-1">{pct}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Album Tab */}
        {activeTab === 'album' && (
          <AlbumView stickers={stickers} accentColor={subject.color} />
        )}
      </div>

      {/* Abziehbild-Auswahl nach erreichtem Leistungsziel */}
      <StickerPickerModal
        open={!!pickerSource}
        ownedStickerIds={stickers.map(st => st.stickerId)}
        sourceText={pickerSource?.sourceText}
        onPick={pickSticker}
        onClose={() => setPickerSource(null)}
      />
    </div>
  );
}
