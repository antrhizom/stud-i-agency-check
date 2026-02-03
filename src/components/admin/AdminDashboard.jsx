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
import { LogOut, Users, KeyRound, Plus, RefreshCw } from 'lucide-react';

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

export default function AdminDashboard() {
  const { signOut, userData } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // overview | classes | external
  const [loading, setLoading] = useState(false);

  const [teachers, setTeachers] = useState([]);
  const [learners, setLearners] = useState([]);
  const [classes, setClasses] = useState([]);

  const [selectedLearnerId, setSelectedLearnerId] = useState('');
  const [externalCodes, setExternalCodes] = useState([]);

  const teachersById = useMemo(() => {
    const m = new Map();
    teachers.forEach(t => m.set(t.id, t));
    return m;
  }, [teachers]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const allUsers = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTeachers(allUsers.filter(u => u.role === 'teacher'));
      setLearners(allUsers.filter(u => u.role === 'learner'));

      const classesSnap = await getDocs(query(collection(db, 'classes'), orderBy('createdAt', 'desc')));
      setClasses(classesSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      const extSnap = await getDocs(query(collection(db, 'externalCodes'), orderBy('createdAt', 'desc')));
      setExternalCodes(extSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createExternalCode = async () => {
    if (!selectedLearnerId) {
      alert('Bitte zuerst einen Lernenden auswählen.');
      return;
    }
    setLoading(true);
    try {
      const code = generateCode();
      await addDoc(collection(db, 'externalCodes'), {
        learnerId: selectedLearnerId,
        code,
        createdAt: Timestamp.now(),
        createdBy: userData?.uid || null,
        isActive: true
      });
      await loadAll();
      alert('Externer Code erstellt: ' + code);
    } catch (e) {
      alert('Fehler: ' + (e?.message || String(e)));
    } finally {
      setLoading(false);
    }
  };

  const disableExternalCode = async (codeId) => {
    if (!confirm('Code deaktivieren?')) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'externalCodes', codeId), { isActive: false });
      await loadAll();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">stud-i-agency-chek</h1>
            <p className="text-sm text-gray-600">Admin · ABU Fahrzeugberufe</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadAll}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
              disabled={loading}
            >
              <RefreshCw className="w-4 h-4" />
              Aktualisieren
            </button>
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
            >
              <LogOut className="w-4 h-4" />
              Abmelden
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${activeTab==='overview' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white'}`}
          >
            <Users className="w-4 h-4" />
            Übersicht
          </button>
          <button
            onClick={() => setActiveTab('classes')}
            className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${activeTab==='classes' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white'}`}
          >
            <Users className="w-4 h-4" />
            Klassen
          </button>
          <button
            onClick={() => setActiveTab('external')}
            className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${activeTab==='external' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white'}`}
          >
            <KeyRound className="w-4 h-4" />
            Externe Zugänge
          </button>
        </div>

        {activeTab === 'overview' && (
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h2 className="text-lg font-bold mb-4">Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border p-4">
                <div className="text-sm text-gray-600">Lehrpersonen</div>
                <div className="text-2xl font-bold">{teachers.length}</div>
              </div>
              <div className="rounded-xl border p-4">
                <div className="text-sm text-gray-600">Lernende</div>
                <div className="text-2xl font-bold">{learners.length}</div>
              </div>
              <div className="rounded-xl border p-4">
                <div className="text-sm text-gray-600">Klassen</div>
                <div className="text-2xl font-bold">{classes.length}</div>
              </div>
            </div>

            <p className="mt-4 text-sm text-gray-600">
              Hinweis: Lehrpersonen legen Klassen an und nehmen Lernende klassenweise auf.
              Der Admin kann hier zusätzlich externe Codes pro Lernende erzeugen.
            </p>
          </div>
        )}

        {activeTab === 'classes' && (
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h2 className="text-lg font-bold mb-4">Klassen (read-only)</h2>
            {classes.length === 0 ? (
              <div className="text-sm text-gray-600">Noch keine Klassen vorhanden.</div>
            ) : (
              <div className="space-y-3">
                {classes.map(c => (
                  <div key={c.id} className="rounded-xl border p-4">
                    <div className="font-semibold">{c.name || c.title || c.id}</div>
                    <div className="text-sm text-gray-600">
                      Lehrperson: {c.teacherId ? (teachersById.get(c.teacherId)?.name || c.teacherId) : '—'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'external' && (
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h2 className="text-lg font-bold mb-4">Externe Zugänge (pro Lernende)</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Lernende auswählen</label>
                <select
                  className="w-full mt-1 px-3 py-2 rounded-lg border"
                  value={selectedLearnerId}
                  onChange={(e) => setSelectedLearnerId(e.target.value)}
                >
                  <option value="">—</option>
                  {learners.map(l => (
                    <option key={l.id} value={l.id}>{l.name || l.displayName || l.email || l.id}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={createExternalCode}
                  className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  <Plus className="w-4 h-4" />
                  Code erstellen
                </button>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-semibold mb-2">Codes (neueste zuerst)</h3>
              {externalCodes.length === 0 ? (
                <div className="text-sm text-gray-600">Noch keine Codes vorhanden.</div>
              ) : (
                <div className="space-y-2">
                  {externalCodes.slice(0, 50).map(c => (
                    <div key={c.id} className="rounded-xl border p-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm">
                        <span className="font-semibold">{c.code}</span>
                        <span className="text-gray-600"> · Lernende: {learners.find(l => l.id === c.learnerId)?.name || c.learnerId}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full border ${c.isActive ? 'bg-green-50' : 'bg-gray-50'}`}
                        >
                          {c.isActive ? 'aktiv' : 'inaktiv'}
                        </span>
                        {c.isActive && (
                          <button
                            onClick={() => disableExternalCode(c.id)}
                            className="text-xs px-3 py-1 rounded-lg border hover:bg-gray-50"
                          >
                            deaktivieren
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="mt-4 text-xs text-gray-500">
              Sicherheit: Die Firestore Rules sollten externe Nutzer nur über ihren eigenen Code/Link auf genau einen Lernenden begrenzen.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
