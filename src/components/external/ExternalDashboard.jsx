import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { LogOut, Eye } from 'lucide-react';

function fmtDate(d) {
  if (!d) return '';
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return '';
  return dt.toLocaleDateString('de-CH');
}

export default function ExternalDashboard() {
  const { signOut, userData, currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState([]);

  const learnerId = userData?.learnerId || userData?.linkedLearnerId || null;

  useEffect(() => {
    const load = async () => {
      if (!currentUser) return;
      if (!learnerId) return;
      setLoading(true);
      try {
        const q = query(
          collection(db, 'practiceEntries'),
          where('learnerId', '==', learnerId),
          orderBy('date', 'desc'),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        const data = snap.docs.map(d => {
          const v = d.data();
          return {
            id: d.id,
            ...v,
            date: v.date?.toDate?.() || null,
            createdAt: v.createdAt?.toDate?.() || null
          };
        });
        setEntries(data);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [currentUser, learnerId]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">stud-i-agency-check</h1>
            <p className="text-sm text-gray-600">Externer Zugang · read-only</p>
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
        {!learnerId && (
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h2 className="text-lg font-bold mb-2">Kein Lernenden-Link hinterlegt</h2>
            <p className="text-sm text-gray-600">
              Dieser externe Account ist aktuell keinem Lernenden zugeordnet.
              Bitte den Admin kontaktieren.
            </p>
          </div>
        )}

        {learnerId && (
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-5 h-5" />
              <h2 className="text-lg font-bold">Praxis-/Übungseinträge</h2>
            </div>

            {loading ? (
              <div className="text-sm text-gray-600">Lade…</div>
            ) : entries.length === 0 ? (
              <div className="text-sm text-gray-600">Noch keine Einträge vorhanden.</div>
            ) : (
              <div className="space-y-3">
                {entries.map(e => (
                  <div key={e.id} className="rounded-xl border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-medium text-gray-900">
                        {fmtDate(e.date)} · {e.status || '—'}
                      </div>
                      {e.themeId && (
                        <div className="text-xs px-2 py-1 rounded-full border bg-gray-50">
                          Thema: {e.themeId}
                        </div>
                      )}
                    </div>

                    <div className="mt-2 text-sm text-gray-800">
                      <div><span className="font-medium">Kompetenz:</span> {e.competencyId || '—'}</div>
                      {e.where && <div><span className="font-medium">Wo:</span> {e.where}</div>}
                      {e.how && <div><span className="font-medium">Wie:</span> {e.how}</div>}
                      {e.note && <div className="mt-1"><span className="font-medium">Notiz:</span> {e.note}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="mt-4 text-xs text-gray-500">
              Hinweis: In einem späteren Ausbau kann hier eine Freigabe-Logik pro Eintrag/Kompetenz ("released") aktiviert werden.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
