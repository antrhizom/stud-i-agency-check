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
import { themes, competencies, changeTags } from '../../data/curriculum';
import { LogOut, Plus, Trash2, BarChart3, ListChecks, CalendarDays } from 'lucide-react';

const STATUS_OPTIONS = [
  { id: 'geuebt', label: 'geübt' },
  { id: 'verbessert', label: 'verbessert' },
  { id: 'erreicht', label: 'erreicht' }
];

function ymd(d) {
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toISOString().split('T')[0];
}

export default function LearnerDashboard() {
  const { signOut, userData, currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('practice'); // practice | entries | stats

  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState([]);

  // Form
  const [date, setDate] = useState(ymd(new Date()));
  const [themeId, setThemeId] = useState('');
  const [competencyId, setCompetencyId] = useState('');
  const [status, setStatus] = useState('geuebt');
  const [whereText, setWhereText] = useState('');
  const [howText, setHowText] = useState('');
  const [note, setNote] = useState('');
  const [tagIds, setTagIds] = useState([]);

  const competencyById = useMemo(() => {
    const m = new Map();
    competencies.forEach(c => m.set(c.id, c));
    return m;
  }, []);

  const themeById = useMemo(() => {
    const m = new Map();
    themes.forEach(t => m.set(t.id, t));
    return m;
  }, []);

  const mandatoryCompetencyIdsForTheme = useMemo(() => {
    const t = themeById.get(themeId);
    return t?.mandatoryCompetencyIds || [];
  }, [themeId, themeById]);

  const loadEntries = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'practiceEntries'),
        where('learnerId', '==', currentUser.uid),
        orderBy('date', 'desc'),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        date: d.data().date?.toDate?.() || null,
        createdAt: d.data().createdAt?.toDate?.() || null
      }));
      setEntries(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!competencyId) {
      alert('Bitte eine Kompetenz auswählen.');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'practiceEntries'), {
        learnerId: currentUser.uid,
        teacherId: userData?.teacherId || null,
        classId: userData?.classId || null,
        date: Timestamp.fromDate(new Date(date + 'T12:00:00')),
        themeId: themeId || null,
        competencyId,
        status,
        where: whereText.trim() || null,
        how: howText.trim() || null,
        note: note.trim() || null,
        tags: tagIds,
        createdAt: Timestamp.now()
      });

      // reset
      setCompetencyId('');
      setStatus('geuebt');
      setWhereText('');
      setHowText('');
      setNote('');
      setTagIds([]);

      await loadEntries();
      setActiveTab('entries');
    } catch (err) {
      alert('Fehler: ' + (err?.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Eintrag löschen?')) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'practiceEntries', id));
      await loadEntries();
    } catch (err) {
      alert('Fehler: ' + (err?.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  // Stats
  const stats = useMemo(() => {
    // counts by competency
    const compCount = {};
    const themeCompCount = {};

    for (const e of entries) {
      if (!e.competencyId) continue;
      compCount[e.competencyId] = (compCount[e.competencyId] || 0) + 1;

      const tId = e.themeId || '__none__';
      themeCompCount[tId] = themeCompCount[tId] || {};
      themeCompCount[tId][e.competencyId] = (themeCompCount[tId][e.competencyId] || 0) + 1;
    }

    // theme completion (Pflicht): Ziel = jede Pflichtkompetenz mind. 2x geübt
    const themeStats = themes.map(t => {
      const needed = t.mandatoryCompetencyIds || [];
      const done = needed.filter(cid => (compCount[cid] || 0) >= 2);
      const inProgress = needed.filter(cid => (compCount[cid] || 0) === 1);
      const pending = needed.filter(cid => !compCount[cid]);
      const points = done.length + inProgress.length * 0.5;
      const pct = needed.length ? Math.round((points / needed.length) * 100) : 0;
      return {
        theme: t,
        pct,
        done,
        inProgress,
        pending
      };
    });

    return { compCount, themeStats };
  }, [entries]);

  const toggleTag = (id) => {
    setTagIds(prev => (prev.includes(id) ? prev.filter(x => x != id) : [...prev, id]));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">stud-i-agency-check</h1>
            <p className="text-sm text-gray-600">
              {userData?.name || userData?.displayName || 'Lernende:r'} · ABU zirkulär kompetent
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
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveTab('practice')}
            className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${activeTab==='practice' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white'}`}
          >
            <Plus className="w-4 h-4" />
            Üben erfassen
          </button>
          <button
            onClick={() => setActiveTab('entries')}
            className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${activeTab==='entries' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white'}`}
          >
            <ListChecks className="w-4 h-4" />
            Meine Einträge
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${activeTab==='stats' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white'}`}
          >
            <BarChart3 className="w-4 h-4" />
            Pflichtprogramm-Übersicht
          </button>
        </div>

        {activeTab === 'practice' && (
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h2 className="text-lg font-bold mb-4">Üben erfassen (Pflicht oder frei)</h2>

            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4" /> Datum
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Thema (optional – Pflichtprogramm)</label>
                <select
                  value={themeId}
                  onChange={(e) => setThemeId(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Ohne Thema (frei)</option>
                  {themes.map(t => (
                    <option key={t.id} value={t.id}>{t.order}. {t.title}</option>
                  ))}
                </select>
                {themeId && (
                  <p className="text-xs text-gray-500 mt-1">
                    Pflicht in diesem Thema: {mandatoryCompetencyIdsForTheme.length} Kompetenzen (Ziel: je 2× üben)
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Kompetenz auswählen</label>
                <select
                  value={competencyId}
                  onChange={(e) => setCompetencyId(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="">— wählen —</option>
                  {(themeId ? competencies.filter(c => c.themeId === themeId) : competencies).map(c => (
                    <option key={c.id} value={c.id}>{c.short}: {c.text}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Tipp: Für „frei“ kannst du jede Kompetenz wählen. Für „Pflicht“ filtert die Liste automatisch nach Thema.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border rounded-lg"
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Wandel-Linsen (optional)</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {changeTags.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleTag(t.id)}
                      className={`px-3 py-1 rounded-full border text-sm ${tagIds.includes(t.id) ? 'bg-green-100 border-green-400' : 'bg-white'}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Wo / Kontext</label>
                <input
                  value={whereText}
                  onChange={(e) => setWhereText(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border rounded-lg"
                  placeholder="z.B. Betrieb, Schule, Zuhause, Kundenkontakt, Teammeeting"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Wie geübt?</label>
                <input
                  value={howText}
                  onChange={(e) => setHowText(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border rounded-lg"
                  placeholder="z.B. Fallbeispiel, Gespräch, Recherche, Rollenspiel, Reflexion"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Notiz (optional)</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border rounded-lg"
                  rows={4}
                  placeholder="Was war schwierig? Was habe ich gelernt? Nächstes Mal…"
                />
              </div>

              <div className="md:col-span-2 flex gap-3 justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  Eintrag speichern
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'entries' && (
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h2 className="text-lg font-bold mb-4">Meine Einträge</h2>
            {loading ? (
              <p className="text-gray-600">Lade…</p>
            ) : entries.length === 0 ? (
              <p className="text-gray-600">Noch keine Einträge.</p>
            ) : (
              <div className="space-y-3">
                {entries.map(e => {
                  const comp = competencyById.get(e.competencyId);
                  const th = e.themeId ? themeById.get(e.themeId) : null;
                  const d = e.date ? ymd(e.date) : '';
                  return (
                    <div key={e.id} className="border rounded-xl p-4 flex gap-4 justify-between">
                      <div className="min-w-0">
                        <div className="text-sm text-gray-500">{d} · {th ? `${th.order}. ${th.title}` : 'frei'}</div>
                        <div className="font-medium text-gray-900 mt-1">
                          {comp ? `${comp.short}: ${comp.text}` : e.competencyId}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          Status: <span className="font-medium">{STATUS_OPTIONS.find(s => s.id === e.status)?.label || e.status}</span>
                          {e.where ? ` · Wo: ${e.where}` : ''}
                          {e.how ? ` · Wie: ${e.how}` : ''}
                        </div>
                        {e.note && <div className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{e.note}</div>}
                        {Array.isArray(e.tags) && e.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {e.tags.map(tid => (
                              <span key={tid} className="px-2 py-1 text-xs rounded-full bg-gray-100 border">
                                {changeTags.find(t => t.id === tid)?.label || tid}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(e.id)}
                        className="shrink-0 px-3 py-2 rounded-lg border hover:bg-gray-50"
                        title="Löschen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h2 className="text-lg font-bold mb-4">Pflichtprogramm (Themen 1–8)</h2>
            <p className="text-sm text-gray-600 mb-4">
              Zielwert: Jede Pflichtkompetenz pro Thema mindestens <strong>2×</strong> dokumentiert.
              Du kannst Kompetenzen auch ausserhalb der vorgesehenen Themen üben – sie zählen trotzdem.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stats.themeStats.map(ts => (
                <div key={ts.theme.id} className="border rounded-xl p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Thema {ts.theme.order}</div>
                      <div className="font-semibold text-gray-900">{ts.theme.title}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{ts.pct}%</div>
                      <div className="text-xs text-gray-500">Fortschritt</div>
                    </div>
                  </div>

                  <div className="mt-3 text-sm">
                    <div className="text-green-700">Erreicht: {ts.done.length}</div>
                    <div className="text-yellow-700">In Arbeit: {ts.inProgress.length}</div>
                    <div className="text-gray-600">Offen: {ts.pending.length}</div>
                  </div>

                  {ts.pending.length > 0 && (
                    <div className="mt-3">
                      <div className="text-xs font-medium text-gray-700 mb-1">Offen</div>
                      <ul className="text-xs text-gray-600 list-disc ml-5 space-y-1">
                        {ts.pending.slice(0, 4).map(cid => (
                          <li key={cid}>{competencyById.get(cid)?.short}: {competencyById.get(cid)?.text}</li>
                        ))}
                        {ts.pending.length > 4 && <li>…</li>}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
