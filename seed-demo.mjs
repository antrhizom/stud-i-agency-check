// Einmaliges Seeding der Demo-Daten (Demoklasse + Demo-Codes + Beispiel-Lernende).
// Aufruf: node seed-demo.mjs  (liest die Firebase-Config aus .env)
// Die Demo bildet eine 3-jährige Grundbildung ab: ABU EFZ 3-jährig + Fahrzeugtechnik EFZ.
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
const ts = (y, m, d) => Timestamp.fromDate(new Date(y, m - 1, d, 14, 0, 0));

const existing = await getDoc(doc(db, 'classes', CLASS_ID));

await setDoc(doc(db, 'classes', CLASS_ID), {
  name: 'Demoklasse (3-jährige Grundbildung)',
  teacherId: null,
  teacherIds: existing.exists() ? (existing.data().teacherIds || []) : [],
  teacherNames: existing.exists() ? (existing.data().teacherNames || {}) : {},
  subjectIds: ['abu-efz3', 'bk-af'],
  joinCode: 'DEMO99',
  isDemo: true,
  createdAt: existing.exists() ? existing.data().createdAt : Timestamp.now()
});

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
// Beispiel-Lernende: Lehre 2023–2026 (3-jährig),
// je 4 Einträge an 4 Lernorten über die ganze Lehre
// ============================================
await setDoc(doc(db, 'users', 'demo-lernende-1'), {
  role: 'learner',
  name: 'Flinker Drache 1',
  displayName: 'Flinker Drache 1',
  classId: CLASS_ID,
  teacherId: null,
  isDemo: true,
  createdAt: ts(2023, 8, 20)
});

await setDoc(doc(db, 'users', 'demo-lernende-2'), {
  role: 'learner',
  name: 'Kluge Sphinx 2',
  displayName: 'Kluge Sphinx 2',
  classId: CLASS_ID,
  teacherId: null,
  isDemo: true,
  createdAt: ts(2023, 8, 20)
});

// Lernende:r 1 – ABU EFZ 3-jährig, 4 Einträge (Themen 1/3 im LJ1, 5 im LJ2, 8 im LJ3)
const abuEntries = [
  {
    id: 'demo-abu-1',
    type: 'gesellschaft', themaId: 't1', kompetenzId: 'k1-1-1', inhaltIdx: 0,
    bereich: 'recht', inhalt: 'Lehrvertragsrecht, sozial akzeptable Lösungen',
    status: 'verstanden', howMethod: 'Im Unterricht', howLearned: 'mit Reflexion',
    note: 'Lehrvertrag mit meinem eigenen verglichen – Probezeit und Ferienregelung waren mir neu.',
    createdAt: ts(2023, 9, 14)
  },
  {
    id: 'demo-abu-2',
    type: 'sprachmodus', themaId: 't3', kompetenzId: 'k3-1-1', inhaltIdx: 0,
    modus: 'rezAudiovisuell', inhalt: 'Zentrale Aussagen aus audiovisuellen Werbebeiträgen entnehmen',
    status: 'mittel', howMethod: 'Im Betrieb', howLearned: 'mit Medienproduktionen',
    note: null,
    createdAt: ts(2024, 3, 7)
  },
  {
    id: 'demo-abu-3',
    type: 'schluesselkompetenz', themaId: 't5', kompetenzId: 'k5-1-1',
    schluesselkompetenzId: 'sk3212',
    status: 'stark', howMethod: 'Zu Hause', howLearned: 'mit digitalen Lernübungen',
    note: 'Abstimmungsunterlagen der Gemeinde durchgearbeitet und mit der Familie diskutiert.',
    createdAt: ts(2024, 12, 5)
  },
  {
    id: 'demo-abu-4',
    type: 'transversal', themaId: 't8', transversalId: 'digitalisierung',
    howMethod: 'In der Hausaufgabenstunde', howLearned: 'mit digitalen Lernübungen',
    note: 'Mit einem KI-Tool ausprobiert, wie sich Bewerbungsschreiben verbessern lassen – Chancen und Risiken notiert.',
    createdAt: ts(2026, 5, 12)
  }
];
for (const e of abuEntries) {
  const { id, ...data } = e;
  await setDoc(doc(db, 'practiceEntriesEBA', id), {
    learnerId: 'demo-lernende-1',
    teacherId: null,
    classId: CLASS_ID,
    subjectId: 'abu-efz3',
    isDemo: true,
    ...data
  });
}

// Lernende:r 2 – Berufskunde Automobil-Fachmann/-frau EFZ, 4 Einträge (Semester 1/3/4/6)
const bkEntries = [
  {
    id: 'demo-bk-1',
    zielId: 's1-3407', lnr: '3.4.07', semester: 1, gebiet: 'Betriebliche Prozesse',
    thema: 'Informatik', ziel: 'wenden Computer, Standardprogramme sowie elektronische Lernsysteme an',
    status: 'stark', howMethod: 'Im Unterricht', howLearned: 'mit digitalen Lernübungen',
    note: 'Ordnerstruktur für die ganze Lehrzeit angelegt.',
    createdAt: ts(2023, 10, 5)
  },
  {
    id: 'demo-bk-2',
    zielId: 's3-2403', lnr: '2.4.03', semester: 3, gebiet: 'Elektrotechnik',
    thema: 'Starterbatterie, Startanlage, Ladeanlage', ziel: 'erklären die Aufgaben und Kennwerte einer Starterbatterie',
    status: 'mittel', howMethod: 'Im ÜK', howLearned: 'mit praktischer Arbeit am Fahrzeug',
    note: null,
    createdAt: ts(2024, 11, 12)
  },
  {
    id: 'demo-bk-3',
    zielId: 's4-4105', lnr: '4.1.05', semester: 4, gebiet: 'Fahrwerk',
    thema: 'Lenkgeometrie', ziel: 'erklären Abstände, Winkel und Masse an der Lenkgeometrie',
    status: 'kurz', howMethod: 'Im Betrieb', howLearned: 'mit praktischer Arbeit am Fahrzeug',
    note: 'Bei der Achsvermessung zugeschaut und die Winkel notiert – Spur und Sturz kann ich jetzt zuordnen.',
    createdAt: ts(2025, 5, 21)
  },
  {
    id: 'demo-bk-4',
    zielId: 's6-2502', lnr: '2.5.02', semester: 6, gebiet: 'Antrieb',
    thema: 'Kupplung', ziel: 'nennen Schwungrad- und Kupplungsarten und deren Anwendungen und erklären Aufgabe, Aufbau und Wirkungsweise von Kupplungssystemen',
    status: 'mittel', howMethod: 'Zu Hause', howLearned: 'mit Prüfungsvorbereitung',
    note: 'Kupplungsarten für das QV repetiert.',
    createdAt: ts(2026, 6, 3)
  }
];
for (const e of bkEntries) {
  const { id, ...data } = e;
  await setDoc(doc(db, 'practiceEntriesBK', id), {
    learnerId: 'demo-lernende-2',
    teacherId: null,
    classId: CLASS_ID,
    subjectId: 'bk-af',
    isDemo: true,
    ...data
  });
}

// Hinweis: Das Kompetenz-Album leitet sich automatisch aus den Einträgen
// ab (ein Feld pro Kompetenz/Leistungsziel, Niveau = höchster Status),
// daher braucht es keine separaten Sticker-Dokumente mehr.

// Bereits genutzte Demo-Konten nachträglich als Demo markieren
for (const codeId of ['demo-lernende', 'demo-lehrperson']) {
  const cd = await getDoc(doc(db, 'learnerCodes', codeId));
  const uid = cd.exists() ? cd.data().userId : null;
  if (uid) {
    await setDoc(doc(db, 'users', uid), { isDemo: true }, { merge: true });
    console.log(`users/${uid} als Demo markiert (Code ${codeId})`);
  }
}

console.log('Demo-Daten angelegt: Demoklasse 3-jährig (abu-efz3 + bk-af, Beitritts-Code DEMO99), Codes LERNEN/SCHULE, 2 Beispiel-Lernende mit je 4 Einträgen (füllen automatisch das Kompetenz-Album)');
process.exit(0);
