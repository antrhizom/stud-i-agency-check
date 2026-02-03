// stud-i-agency-check – ABU zirkulär kompetent (EBA Kanton Zürich)
// Redesign: Anonyme Lernende mit Tiersymbolen, Zirkularitätsprinzip

// ============================================================
// TIERSYMBOLE (30 Stück, eindeutig pro Klasse)
// ============================================================
export const animalSymbols = [
  { id: 'fox', emoji: '🦊', name: 'Fuchs' },
  { id: 'owl', emoji: '🦉', name: 'Eule' },
  { id: 'dolphin', emoji: '🐬', name: 'Delfin' },
  { id: 'lion', emoji: '🦁', name: 'Löwe' },
  { id: 'wolf', emoji: '🐺', name: 'Wolf' },
  { id: 'bear', emoji: '🐻', name: 'Bär' },
  { id: 'rabbit', emoji: '🐰', name: 'Hase' },
  { id: 'cat', emoji: '🐱', name: 'Katze' },
  { id: 'dog', emoji: '🐶', name: 'Hund' },
  { id: 'tiger', emoji: '🐯', name: 'Tiger' },
  { id: 'panda', emoji: '🐼', name: 'Panda' },
  { id: 'koala', emoji: '🐨', name: 'Koala' },
  { id: 'monkey', emoji: '🐵', name: 'Affe' },
  { id: 'penguin', emoji: '🐧', name: 'Pinguin' },
  { id: 'chicken', emoji: '🐔', name: 'Huhn' },
  { id: 'frog', emoji: '🐸', name: 'Frosch' },
  { id: 'turtle', emoji: '🐢', name: 'Schildkröte' },
  { id: 'snail', emoji: '🐌', name: 'Schnecke' },
  { id: 'bee', emoji: '🐝', name: 'Biene' },
  { id: 'butterfly', emoji: '🦋', name: 'Schmetterling' },
  { id: 'unicorn', emoji: '🦄', name: 'Einhorn' },
  { id: 'dragon', emoji: '🐉', name: 'Drache' },
  { id: 'whale', emoji: '🐳', name: 'Wal' },
  { id: 'octopus', emoji: '🐙', name: 'Oktopus' },
  { id: 'shark', emoji: '🦈', name: 'Hai' },
  { id: 'eagle', emoji: '🦅', name: 'Adler' },
  { id: 'peacock', emoji: '🦚', name: 'Pfau' },
  { id: 'flamingo', emoji: '🦩', name: 'Flamingo' },
  { id: 'hedgehog', emoji: '🦔', name: 'Igel' },
  { id: 'squirrel', emoji: '🐿️', name: 'Eichhörnchen' }
];

// Groot - Belohnung für 3+ freiwillige Übungen
export const grootReward = {
  id: 'groot',
  emoji: '🌳',
  name: 'Groot',
  description: 'Baumwesen - Belohnung für 3+ freiwillige Übungen'
};

// ============================================================
// SPRACHMODI (alle 9 gemäss BiPla)
// ============================================================
export const allLanguageModes = [
  { id: '4.2.1.1', label: 'Rezeption mündlich', short: 'Rez. mündl.', description: 'Zuhören, verstehen' },
  { id: '4.2.1.2', label: 'Rezeption audiovisuell', short: 'Rez. AV', description: 'Videos, Medien verstehen' },
  { id: '4.2.1.3', label: 'Rezeption schriftlich/bildlich', short: 'Rez. schr.', description: 'Texte, Bilder lesen' },
  { id: '4.2.2.1', label: 'Produktion mündlich', short: 'Prod. mündl.', description: 'Sprechen, präsentieren' },
  { id: '4.2.2.2', label: 'Produktion schriftlich/bildlich', short: 'Prod. schr.', description: 'Schreiben, gestalten' },
  { id: '4.2.2.3', label: 'Produktion multimedial', short: 'Prod. MM', description: 'Videos, Podcasts erstellen' },
  { id: '4.2.3.1', label: 'Interaktion mündlich', short: 'Inter. mündl.', description: 'Gespräche, Diskussionen' },
  { id: '4.2.3.2', label: 'Interaktion schriftlich', short: 'Inter. schr.', description: 'Chat, E-Mail, Zusammenarbeit' },
  { id: '4.2.3.3', label: 'Interaktion digital', short: 'Inter. dig.', description: 'Digitale Kollaboration' }
];

// ============================================================
// SCHLÜSSELKOMPETENZEN (alle 12 gemäss BiPla)
// ============================================================
export const allKeySkills = [
  { id: '3.2.1', label: 'Zwischen relevanten und irrelevanten Quellen und Inhalten unterscheiden', short: 'Quellen unterscheiden' },
  { id: '3.2.2', label: 'Sich Ziele setzen, überprüfen und anpassen', short: 'Ziele setzen' },
  { id: '3.2.3', label: 'Antizipative, unternehmerische und innovative Wege der Problemlösung', short: 'Innovativ lösen' },
  { id: '3.2.4', label: 'In unterschiedlichen Teams zielgerichtet und effizient arbeiten', short: 'Teamarbeit' },
  { id: '3.2.5', label: 'Die eigenen Werthaltungen und Überzeugungen erkennen, verstehen, kritisch reflektieren und weiterentwickeln', short: 'Werte reflektieren' },
  { id: '3.2.6', label: 'Eigene Standpunkte begründen und andere davon überzeugen', short: 'Standpunkte begründen' },
  { id: '3.2.7', label: 'Unterschiedliche Standpunkte nachvollziehen und das gegenseitige Verständnis fördern', short: 'Verständnis fördern' },
  { id: '3.2.8', label: 'Ihre Lebensphasen planen und mit Unwägbarkeiten umgehen', short: 'Lebensphasen planen' },
  { id: '3.2.9', label: 'Vernetzt und systemisch denken, um sozial, ökologisch und ökonomisch nachhaltig zu handeln', short: 'Nachhaltig handeln' },
  { id: '3.2.10', label: 'Sich in einem sich ständig verändernden Umfeld zurechtfinden und sich an dieses anpassen', short: 'Anpassungsfähigkeit' },
  { id: '3.2.11', label: 'Mit Mehrdeutigkeiten umgehen', short: 'Ambiguität' },
  { id: '3.2.12', label: 'An gesellschaftlichen Prozessen partizipieren und Handlungsspielräume nutzen', short: 'Partizipation' }
];

// ============================================================
// GESELLSCHAFTSINHALTE (alle 7 Aspekte gemäss BiPla)
// ============================================================
export const allSocietyAspects = [
  { id: 'recht', label: 'Recht', description: 'Verträge, Gesetze, rechtliche Orientierung' },
  { id: 'wirtschaft', label: 'Wirtschaft', description: 'Budget, Konsum, Arbeitswelt' },
  { id: 'politik', label: 'Politik', description: 'Demokratie, Abstimmungen, Behörden' },
  { id: 'oekologie', label: 'Ökologie', description: 'Nachhaltigkeit, Klimawandel, Umwelt' },
  { id: 'digital', label: 'Technologie & Digital', description: 'Digitale Transformation, KI, Tools' },
  { id: 'ethik', label: 'Ethik', description: 'Moralische Konflikte, Werte' },
  { id: 'identitaet', label: 'Identität & Sozialisation', description: 'Gesundheit, Kommunikation, Kultur' },
  { id: 'kultur', label: 'Kultur', description: 'Kulturelle Ausdrucksformen, Kunst' }
];

// ============================================================
// KONTEXT-OPTIONEN (wo wurde geübt)
// ============================================================
export const contextOptions = [
  { id: 'betrieb', label: 'Im Betrieb', emoji: '🏢' },
  { id: 'schule', label: 'In der Schule', emoji: '🏫' },
  { id: 'zuhause', label: 'Zuhause', emoji: '🏠' },
  { id: 'anderer', label: 'Anderer Ort', emoji: '📍' }
];

// ============================================================
// THEMEN MIT ZIRKULARITÄT
// Basierend auf den 3 Design-Dokumenten:
// - Sprachmodi pro Thema
// - Schlüsselkompetenzen mit R1/R2
// - Gesellschaftsinhalte pro Thema
// ============================================================
export const themes = [
  {
    id: 't1',
    order: 1,
    title: 'Berufseinstieg',
    subtitle: 'Ins Berufsleben einsteigen',
    // Pflicht-Sprachmodi (aus Design_Zirkularität EBA - Sprachmodi.txt)
    mandatoryLanguageModes: ['4.2.1.3', '4.2.1.1', '4.2.3.3'],
    // Pflicht-Gesellschaftsinhalte (aus Design_Zirkularität EBA - Gesellschaftsinhhalte.txt)
    mandatorySociety: ['recht', 'digital', 'identitaet'],
    // Pflicht-Schlüsselkompetenzen mit R1/R2 (aus Design_Zirkularität EBA - Schlüsselkompetenzen.txt)
    mandatoryKeySkills: [
      { id: '3.2.2', round: 'R1' },
      { id: '3.2.7', round: 'R1' },
      { id: '3.2.10', round: 'R1' }
    ]
  },
  {
    id: 't2',
    order: 2,
    title: 'Geld und Konsum',
    subtitle: 'Verantwortungsvoll mit Geld umgehen',
    mandatoryLanguageModes: ['4.2.1.2', '4.2.2.1'],
    mandatorySociety: ['wirtschaft', 'oekologie'],
    mandatoryKeySkills: [
      { id: '3.2.1', round: 'R1' },
      { id: '3.2.3', round: 'R1' },
      { id: '3.2.9', round: 'R1' }
    ]
  },
  {
    id: 't3',
    order: 3,
    title: 'Sicherheit und Wohlbefinden',
    subtitle: 'Risiko und Sicherheit verstehen',
    mandatoryLanguageModes: ['4.2.2.2', '4.2.3.1'],
    mandatorySociety: ['identitaet', 'recht'],
    mandatoryKeySkills: [
      { id: '3.2.4', round: 'R1' },
      { id: '3.2.5', round: 'R1' },
      { id: '3.2.11', round: 'R1' }
    ]
  },
  {
    id: 't4',
    order: 4,
    title: 'Medien und Digitales',
    subtitle: 'Medien und digitale Welt',
    mandatoryLanguageModes: ['4.2.3.3', '4.2.3.2', '4.2.3.1'],
    mandatorySociety: ['digital', 'kultur'],
    mandatoryKeySkills: [
      { id: '3.2.1', round: 'R2' },
      { id: '3.2.10', round: 'R2' },
      { id: '3.2.12', round: 'R1' }
    ]
  },
  {
    id: 't5',
    order: 5,
    title: 'Politik und Demokratie',
    subtitle: 'Politisch teilnehmen',
    mandatoryLanguageModes: ['4.2.1.1', '4.2.2.3'],
    mandatorySociety: ['politik', 'oekologie'],
    mandatoryKeySkills: [
      { id: '3.2.5', round: 'R2' },
      { id: '3.2.6', round: 'R1' },
      { id: '3.2.9', round: 'R2' }
    ]
  },
  {
    id: 't6',
    order: 6,
    title: 'Recht und Ethik',
    subtitle: 'Rechtlich und ethisch handeln',
    mandatoryLanguageModes: ['4.2.2.1', '4.2.2.2'],
    mandatorySociety: ['recht', 'ethik'],
    mandatoryKeySkills: [
      { id: '3.2.4', round: 'R2' },
      { id: '3.2.6', round: 'R2' },
      { id: '3.2.7', round: 'R2' }
    ]
  },
  {
    id: 't7',
    order: 7,
    title: 'Arbeit und Zukunft',
    subtitle: 'Arbeit und Steuern verstehen',
    mandatoryLanguageModes: ['4.2.3.1', '4.2.1.3', '4.2.3.2'],
    mandatorySociety: ['identitaet', 'wirtschaft', 'politik'],
    mandatoryKeySkills: [
      { id: '3.2.2', round: 'R2' },
      { id: '3.2.3', round: 'R2' },
      { id: '3.2.8', round: 'R1' }
    ]
  },
  {
    id: 't8',
    order: 8,
    title: 'Kultur und Identität',
    subtitle: 'Kultur und Kunst erleben',
    mandatoryLanguageModes: ['4.2.1.2', '4.2.2.3', '4.2.1.1'],
    mandatorySociety: ['kultur', 'ethik'],
    mandatoryKeySkills: [
      { id: '3.2.8', round: 'R2' },
      { id: '3.2.11', round: 'R2' },
      { id: '3.2.12', round: 'R2' }
    ]
  }
];

// ============================================================
// HILFSFUNKTIONEN
// ============================================================

// Hole alle Sprachmodi eines Themas mit Labels
export function getThemeLanguageModes(themeId) {
  const theme = themes.find(t => t.id === themeId);
  if (!theme) return [];
  return theme.mandatoryLanguageModes.map(modeId => {
    const mode = allLanguageModes.find(m => m.id === modeId);
    return mode || { id: modeId, label: modeId };
  });
}

// Hole alle Schlüsselkompetenzen eines Themas mit Labels und R1/R2
export function getThemeKeySkills(themeId) {
  const theme = themes.find(t => t.id === themeId);
  if (!theme) return [];
  return theme.mandatoryKeySkills.map(skill => {
    const fullSkill = allKeySkills.find(s => s.id === skill.id);
    return {
      ...skill,
      label: fullSkill?.label || skill.id,
      short: fullSkill?.short || skill.id
    };
  });
}

// Hole alle Gesellschaftsinhalte eines Themas mit Labels
export function getThemeSocietyAspects(themeId) {
  const theme = themes.find(t => t.id === themeId);
  if (!theme) return [];
  return theme.mandatorySociety.map(aspectId => {
    const aspect = allSocietyAspects.find(a => a.id === aspectId);
    return aspect || { id: aspectId, label: aspectId };
  });
}

// Zähle wie oft eine Schlüsselkompetenz in welchen Themen vorkommt (für Zirkularitäts-Ansicht)
export function getKeySkillOccurrences(skillId) {
  return themes
    .filter(t => t.mandatoryKeySkills.some(s => s.id === skillId))
    .map(t => ({
      themeId: t.id,
      themeTitle: t.title,
      round: t.mandatoryKeySkills.find(s => s.id === skillId)?.round
    }));
}

// Generiere zufällige einzigartige Tiersymbole für eine Klasse
export function generateUniqueAnimalSymbols(count) {
  if (count > animalSymbols.length) {
    throw new Error(`Maximum ${animalSymbols.length} Lernende pro Klasse möglich`);
  }
  const shuffled = [...animalSymbols].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Generiere 6-stelligen Code
export function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Ohne I, O, 0, 1 (verwechselbar)
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ============================================================
// LEGACY-SUPPORT (für bestehende Komponenten)
// ============================================================
export const changeTags = [
  { id: 'digitality', label: 'Digitalität' },
  { id: 'equity', label: 'Chancengerechtigkeit' },
  { id: 'sustainability', label: 'Nachhaltigkeit / Ökologie' }
];

export const rings = {
  keySkills: allKeySkills.flatMap(skill => [
    { id: `${skill.id}-R1`, label: `${skill.id} (R1) – ${skill.short}` },
    { id: `${skill.id}-R2`, label: `${skill.id} (R2) – ${skill.short}` }
  ]),
  languageModes: allLanguageModes.map(m => ({ id: m.id, label: `${m.id} – ${m.label}` })),
  society: allSocietyAspects.map(s => ({ id: s.id, label: s.label }))
};

// Leere Kompetenzen-Array (wird durch neue Struktur ersetzt)
export const competencies = [];
