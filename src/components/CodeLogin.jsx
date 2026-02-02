import React, { useState } from 'react';
import { db, auth } from '../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  Timestamp
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { ArrowLeft } from 'lucide-react';

const CODE_EMAIL_DOMAIN = 'studiagency-check.ch';

export default function CodeLogin({ role, onBack }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const codeUpper = code.toUpperCase().trim();
      if (codeUpper.length !== 6) {
        setError('Bitte 6 Zeichen eingeben.');
        setLoading(false);
        return;
      }

      const isExternal = role === 'external';
      const codesCollection = isExternal ? 'externalCodes' : 'learnerCodes';

      // 1) Code suchen
      const codeQuery = query(collection(db, codesCollection), where('code', '==', codeUpper));
      const codeSnapshot = await getDocs(codeQuery);

      if (codeSnapshot.empty) {
        setError('Ungültiger Code.');
        setLoading(false);
        return;
      }

      const codeDoc = codeSnapshot.docs[0];
      const codeData = codeDoc.data();

      // Optional: blocke "used" nicht, weil Codes als dauerhaftes Passwort gedacht sind.
      // Wenn ihr Externe zeitlich begrenzen wollt, könnt ihr expiresAt prüfen.

      const email = `${codeUpper.toLowerCase()}@${CODE_EMAIL_DOMAIN}`;
      const password = codeUpper;

      await setPersistence(auth, browserLocalPersistence);

      // 2) Login versuchen, sonst erstellen
      try {
        await signInWithEmailAndPassword(auth, email, password);
        window.location.href = isExternal ? '/external' : '/learner';
        return;
      } catch (loginError) {
        if (loginError.code !== 'auth/user-not-found' && loginError.code !== 'auth/invalid-credential') {
          throw loginError;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // DisplayName
        const displayName = isExternal ? (codeData.displayName || 'Externer Zugriff') : (codeData.name || 'Lernende:r');
        await updateProfile(user, { displayName });

        // 3) User-Dokument
        if (isExternal) {
          await setDoc(doc(db, 'users', user.uid), {
            role: 'external',
            displayName,
            email,
            code: codeUpper,
            learnerId: codeData.learnerId,
            createdAt: Timestamp.now(),
            firstLogin: Timestamp.now()
          });
        } else {
          await setDoc(doc(db, 'users', user.uid), {
            role: 'learner',
            name: codeData.name,
            displayName: codeData.name,
            email,
            code: codeUpper,
            teacherId: codeData.teacherId,
            classId: codeData.classId,
            createdAt: Timestamp.now(),
            firstLogin: Timestamp.now()
          });

          // codeDoc markieren (optional)
          await updateDoc(doc(db, 'learnerCodes', codeDoc.id), {
            used: true,
            userId: user.uid,
            lastUsedAt: Timestamp.now()
          });
        }

        window.location.href = isExternal ? '/external' : '/learner';
      }
    } catch (err) {
      console.error(err);
      setError('Fehler: ' + (err?.message || String(err)));
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Zurück
      </button>

      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Code eingeben</h2>
        <p className="text-gray-600">Gib deinen 6-stelligen Code ein</p>
      </div>

      <form onSubmit={handleCodeSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABC123"
            maxLength={6}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl font-mono tracking-widest uppercase"
            required
            autoFocus
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition disabled:opacity-50"
        >
          {loading ? 'Prüfe…' : 'Einloggen'}
        </button>

        <div className="text-xs text-gray-500 text-center pt-2">
          {role === 'external'
            ? 'Externe sehen nur freigegebene Inhalte der zugewiesenen Person.'
            : 'Der Code funktioniert als dauerhaftes Passwort (auf allen Geräten).'}
        </div>
      </form>
    </div>
  );
}
