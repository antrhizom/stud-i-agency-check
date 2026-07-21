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

// ============================================
// Beispiel-Lernende mit je 4 Einträgen,
// verteilt über die Lehre und 4 Lernorte
// ============================================
const ts = (y, m, d) => Timestamp.fromDate(new Date(y, m - 1, d, 14, 0, 0));

await setDoc(doc(db, 'users', 'demo-lernende-1'), {
  role: 'learner',
  name: 'Flinker Drache 1',
  displayName: 'Flinker Drache 1',
  classId: CLASS_ID,
  teacherId: null,
  isDemo: true,
  createdAt: ts(2024, 8, 20)
}, { merge: true });

await setDoc(doc(db, 'users', 'demo-lernende-2'), {
  role: 'learner',
  name: 'Kluge Sphinx 2',
  displayName: 'Kluge Sphinx 2',
  classId: CLASS_ID,
  teacherId: null,
  isDemo: true,
  createdAt: ts(2024, 8, 20)
}, { merge: true });

// Lernende:r 1 – ABU EBA, 4 Einträge (Themen 1/3/5/8, 4 Lernorte)
const abuEntries = [
  {
    id: 'demo-abu-1',
    type: 'gesellschaft', themaId: 't1', kompetenzId: 'k1-1-1', inhaltIdx: 0,
    bereich: 'recht', inhalt: 'Grundlagen zum Aufbau und zu den wichtigsten Elementen eines Lehrvertrags',
    status: 'verstanden', howMethod: 'Im Unterricht', howLearned: 'mit Reflexion',
    note: 'Lehrvertrag mit meinem eigenen verglichen – Probezeit und Ferienregelung waren mir neu.',
    createdAt: ts(2024, 9, 12)
  },
  {
    id: 'demo-abu-2',
    type: 'sprachmodus', themaId: 't3', kompetenzId: 'k3-1-1', inhaltIdx: 0,
    modus: 'ikMuendlich', inhalt: 'An Gesprächen, z.B. einem Austausch über Risiken im Alltag und im Betrieb, aktiv teilnehmen',
    status: 'mittel', howMethod: 'Im Betrieb', howLearned: 'mit einem handlungskompetenzorientierten Produkt',
    note: null,
    createdAt: ts(2025, 3, 6)
  },
  {
    id: 'demo-abu-3',
    type: 'schluesselkompetenz', themaId: 't5', kompetenzId: 'k5-1-1',
    schluesselkompetenzId: 'sk326',
    status: 'stark', howMethod: 'Zu Hause', howLearned: 'mit Medienproduktionen',
    note: 'Kurzes Video zu meiner Meinung über E-Autos aufgenommen und im Unterricht gezeigt.',
    createdAt: ts(2025, 11, 20)
  },
  {
    id: 'demo-abu-4',
    type: 'transversal', themaId: 't8', transversalId: 'digitalisierung',
    howMethod: 'In der Hausaufgabenstunde', howLearned: 'mit digitalen Lernübungen',
    note: 'Mit einem KI-Tool Bildstile verglichen – spannend, was echt und was generiert ist.',
    createdAt: ts(2026, 5, 8)
  }
];
for (const e of abuEntries) {
  const { id, ...data } = e;
  await setDoc(doc(db, 'practiceEntriesEBA', id), {
    learnerId: 'demo-lernende-1',
    teacherId: null,
    classId: CLASS_ID,
    subjectId: 'abu-eba',
    isDemo: true,
    ...data
  }, { merge: true });
}

// Lernende:r 2 – Berufskunde AA (Fahrzeugtechnik EBA), 4 Einträge (Semester 1–4, 4 Lernorte)
const bkEntries = [
  {
    id: 'demo-bk-1',
    zielId: 's1-3407', lnr: '3.4.07', semester: 1, gebiet: 'Betriebliche Prozesse',
    thema: 'Informatik', ziel: 'wenden Computer, Standardprogramme sowie elektronische Lernsysteme an',
    status: 'stark', howMethod: 'Im Unterricht', howLearned: 'mit digitalen Lernübungen',
    note: 'Ordnerstruktur für die ganze Lehrzeit angelegt.',
    createdAt: ts(2024, 10, 3)
  },
  {
    id: 'demo-bk-2',
    zielId: 's2-1410', lnr: '1.4.10', semester: 2, gebiet: 'Antrieb',
    thema: 'Antriebswellen, Achsantrieb, Allrad', ziel: 'unterscheiden Antriebs- und Kardanwellen sowie die Gelenkarten',
    status: 'mittel', howMethod: 'Im Betrieb', howLearned: 'mit praktischer Arbeit am Fahrzeug',
    note: null,
    createdAt: ts(2025, 4, 15)
  },
  {
    id: 'demo-bk-3',
    zielId: 's3-1302', lnr: '1.3.02', semester: 3, gebiet: 'Betriebliche Prozesse',
    thema: 'Betriebs- und Hilfsstoffe', ziel: 'bestimmen Betriebs- und Hilfsstoffe nach Normen und Verwendung und berechnen die Mischungen nach Vorgaben',
    status: 'kurz', howMethod: 'Im ÜK', howLearned: 'mit Aufgaben aus dem Lehrmittel (z.B. Beook)',
    note: 'Viskositätsnormen im Tabellenbuch nachgeschlagen – brauche noch Übung.',
    createdAt: ts(2025, 10, 28)
  },
  {
    id: 'demo-bk-4',
    zielId: 's4-3508', lnr: '3.5.08', semester: 4, gebiet: 'Elektro- und Alternativantrieb',
    thema: 'Elektro-, Hybrid-, Alternativantriebe', ziel: 'erklären den sicheren Umgang und die grundlegende Funktionsweise der Hochvoltkomponenten inkl. Ladeinfrastruktur',
    status: 'mittel', howMethod: 'Zu Hause', howLearned: 'mit Prüfungsvorbereitung',
    note: 'HV1-Modul im Beook repetiert für die Prüfung.',
    createdAt: ts(2026, 4, 22)
  }
];
for (const e of bkEntries) {
  const { id, ...data } = e;
  await setDoc(doc(db, 'practiceEntriesBK', id), {
    learnerId: 'demo-lernende-2',
    teacherId: null,
    classId: CLASS_ID,
    subjectId: 'bk-aa',
    isDemo: true,
    ...data
  }, { merge: true });
}

// Bereits genutzte Demo-Konten nachträglich als Demo markieren
for (const codeId of ['demo-lernende', 'demo-lehrperson']) {
  const cd = await getDoc(doc(db, 'learnerCodes', codeId));
  const uid = cd.exists() ? cd.data().userId : null;
  if (uid) {
    await setDoc(doc(db, 'users', uid), { isDemo: true }, { merge: true });
    console.log(`users/${uid} als Demo markiert (Code ${codeId})`);
  }
}

console.log('Demo-Daten angelegt: Demoklasse (Beitritts-Code DEMO99), Codes LERNEN/SCHULE, 2 Beispiel-Lernende mit je 4 Einträgen');
process.exit(0);
