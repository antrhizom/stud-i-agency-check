import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { GraduationCap, Wrench } from 'lucide-react';
import { getClassSubjects, getSubjectById, DEFAULT_SUBJECT_ID } from '../../data/subjects';
import LearnerPracticeABU from './LearnerPracticeABU';
import LearnerPracticeBK from './LearnerPracticeBK';

// ============================================
// LERNENDEN-DASHBOARD
// Lädt die Klasse, bestimmt die zugewiesenen Fächer und zeigt
// pro Fach die passende Erfassung (ABU-Variante oder Berufskunde).
// ============================================
export default function LearnerDashboard() {
  const { userData } = useAuth();
  const [subjects, setSubjects] = useState(null); // null = lädt
  const [activeSubjectId, setActiveSubjectId] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      let subs = [getSubjectById(DEFAULT_SUBJECT_ID)];
      try {
        if (userData?.classId) {
          const clsDoc = await getDoc(doc(db, 'classes', userData.classId));
          if (clsDoc.exists()) {
            subs = getClassSubjects(clsDoc.data());
          }
        }
      } catch (err) {
        console.error('Fehler beim Laden der Klasse:', err);
      }
      if (!cancelled) {
        setSubjects(subs);
        setActiveSubjectId(prev => (prev && subs.some(s => s.id === prev)) ? prev : subs[0]?.id || '');
      }
    };
    load();
    return () => { cancelled = true; };
  }, [userData?.classId]);

  if (subjects === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const activeSubject = subjects.find(s => s.id === activeSubjectId) || subjects[0];

  return (
    <div>
      {/* Fach-Umschalter (nur wenn mehrere Fächer zugewiesen sind) */}
      {subjects.length > 1 && (
        <div className="bg-gray-900 text-white">
          <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-4 flex-wrap">
            <span className="text-sm font-medium text-gray-300">Fach wählen:</span>
            <div className="flex gap-1 bg-white/10 rounded-lg p-1 flex-wrap">
              {subjects.map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveSubjectId(s.id)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    activeSubjectId === s.id ? 'bg-white text-gray-900' : 'text-white/80 hover:text-white'
                  }`}
                >
                  {s.kind === 'bk'
                    ? <Wrench className="w-3.5 h-3.5" style={{ color: activeSubjectId === s.id ? s.color : undefined }} />
                    : <GraduationCap className="w-3.5 h-3.5" style={{ color: activeSubjectId === s.id ? s.color : undefined }} />}
                  {s.short}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSubject?.kind === 'bk'
        ? <LearnerPracticeBK key={activeSubject.id} subject={activeSubject} />
        : <LearnerPracticeABU key={activeSubject?.id || 'abu'} subject={activeSubject} />}
    </div>
  );
}
