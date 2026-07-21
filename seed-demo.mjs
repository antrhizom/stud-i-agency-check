// Einmaliges Seeding der Demo-Daten (Demoklasse + Demo-Codes).
// Aufruf: node seed-demo.mjs  (liest die Firebase-Config aus .env)
import { readFileSync } from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';

const env = Object.fromEntries(
  readFileSync('.env', 'utf8').split('\n').filter(l => l.includes('=')).map(l => {
    const [k, ...v] = l.trim().split('=');
    return [k, v.join('=')];
  })
);

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID
});
const db = getFirestore(app);

const CLASS_ID = 'demo-klasse';

const existing = await getDoc(doc(db, 'classes', CLASS_ID));
if (existing.exists()) {
  console.log('Demoklasse existiert bereits – aktualisiere Fächer.');
}

await setDoc(doc(db, 'classes', CLASS_ID), {
  name: 'Demoklasse',
  teacherId: null,
  teacherIds: existing.exists() ? (existing.data().teacherIds || []) : [],
  teacherNames: existing.exists() ? (existing.data().teacherNames || {}) : {},
  subjectIds: ['abu-eba', 'abu-efz3', 'abu-efz4', 'bk-aa', 'bk-af'],
  joinCode: 'DEMO99',
  isDemo: true,
  createdAt: existing.exists() ? existing.data().createdAt : Timestamp.now()
}, { merge: true });

await setDoc(doc(db, 'learnerCodes', 'demo-lernende'), {
  code: 'LERNEN',
  name: 'Demo Drache 1',
  classId: CLASS_ID,
  teacherId: null,
  used: false,
  userId: null,
  isDemo: true,
  createdAt: Timestamp.now()
}, { merge: true });

await setDoc(doc(db, 'learnerCodes', 'demo-lehrperson'), {
  code: 'SCHULE',
  role: 'teacher',
  name: 'Demo-Lehrperson',
  classId: CLASS_ID,
  teacherId: null,
  used: false,
  userId: null,
  isDemo: true,
  createdAt: Timestamp.now()
}, { merge: true });

console.log('Demo-Daten angelegt: Klasse "Demoklasse" (Beitritts-Code DEMO99), Lernenden-Code LERNEN, Lehrpersonen-Code SCHULE');
process.exit(0);
