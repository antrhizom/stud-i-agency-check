// stud-i-agency-check – ABU zirkulär kompetent (EBA Kanton Zürich)
// Berufsunabhängig, zirkulär, themenbasiert, mit Üben innerhalb (Pflichtprogramm) und ausserhalb von Themen.

export const changeTags = [
  { id: 'digitality', label: 'Digitalität' },
  { id: 'equity', label: 'Chancengerechtigkeit' },
  { id: 'sustainability', label: 'Nachhaltigkeit / Ökologie' }
];

// Ringe (Referenzen/Labels für UI & Reporting)
export const rings = {
  keySkills: [
    { id: '3.2.1-R1', label: '3.2.1 (R1) – Informationen beschaffen & nutzen' },
    { id: '3.2.1-R2', label: '3.2.1 (R2) – Informationen vertieft nutzen' },
    { id: '3.2.2-R1', label: '3.2.2 (R1) – Planen & organisieren' },
    { id: '3.2.2-R2', label: '3.2.2 (R2) – Planen & organisieren vertieft' },
    { id: '3.2.4-R1', label: '3.2.4 (R1) – Verantwortung übernehmen' },
    { id: '3.2.4-R2', label: '3.2.4 (R2) – Verantwortung reflektieren' },
    { id: '3.2.6-R1', label: '3.2.6 (R1) – Mitbestimmen & mitgestalten' },
    { id: '3.2.6-R2', label: '3.2.6 (R2) – Mitbestimmen vertieft' },
    { id: '3.2.9-R1', label: '3.2.9 (R1) – Entscheidungen begründen' },
    { id: '3.2.9-R2', label: '3.2.9 (R2) – Entscheidungen vertieft' },
    { id: '3.2.10-R1', label: '3.2.10 (R1) – Zusammenarbeiten' },
    { id: '3.2.10-R2', label: '3.2.10 (R2) – Zusammenarbeiten vertieft' },
    { id: '3.2.12-R1', label: '3.2.12 (R1) – Lernen reflektieren' },
    { id: '3.2.12-R2', label: '3.2.12 (R2) – Lernen vertieft reflektieren' }
  ],
  languageModes: [
    { id: '4.2.1.1', label: '4.2.1.1 – Rezeption (lesen/hören)' },
    { id: '4.2.1.2', label: '4.2.1.2 – Interaktion (sprechen/kooperieren)' },
    { id: '4.2.1.3', label: '4.2.1.3 – Produktion (schreiben/sprechen)' },
    { id: '4.2.2.1', label: '4.2.2.1 – Analysieren & strukturieren' },
    { id: '4.2.2.2', label: '4.2.2.2 – Argumentieren & begründen' },
    { id: '4.2.2.3', label: '4.2.2.3 – Bewerten & entscheiden' },
    { id: '4.2.3.1', label: '4.2.3.1 – Dokumentieren & festhalten' },
    { id: '4.2.3.2', label: '4.2.3.2 – Kollaborativ schreiben' },
    { id: '4.2.3.3', label: '4.2.3.3 – Präsentieren & adressatengerecht kommunizieren' }
  ],
  society: [
    { id: 'recht', label: 'Recht' },
    { id: 'wirtschaft', label: 'Wirtschaft' },
    { id: 'politik', label: 'Politik & Demokratie' },
    { id: 'oekologie', label: 'Ökologie & Nachhaltigkeit' },
    { id: 'digital', label: 'Technologische & digitale Transformation' },
    { id: 'ethik', label: 'Ethik' },
    { id: 'kultur', label: 'Kultur & Identität' }
  ]
};

// Themen (Pflichtprogramm)
export const themes = [
  { id: 't1', order: 1, title: 'Berufseinstieg', mandatoryCompetencyIds: ['c1-1','c1-2','c1-3'] },
  { id: 't2', order: 2, title: 'Geld und Konsum', mandatoryCompetencyIds: ['c2-1','c2-2','c2-3'] },
  { id: 't3', order: 3, title: 'Sicherheit und Wohlbefinden', mandatoryCompetencyIds: ['c3-1','c3-2','c3-3'] },
  { id: 't4', order: 4, title: 'Medien und Digitales', mandatoryCompetencyIds: ['c4-1','c4-2','c4-3'] },
  { id: 't5', order: 5, title: 'Politik und Demokratie', mandatoryCompetencyIds: ['c5-1','c5-2','c5-3'] },
  { id: 't6', order: 6, title: 'Recht und Ethik', mandatoryCompetencyIds: ['c6-1','c6-2','c6-3'] },
  { id: 't7', order: 7, title: 'Arbeit und Zukunft', mandatoryCompetencyIds: ['c7-1','c7-2','c7-3'] },
  { id: 't8', order: 8, title: 'Kultur und Identität', mandatoryCompetencyIds: ['c8-1','c8-2','c8-3'] }
];

// Kompetenzen (themenbezogen, aber jederzeit frei übbar)
// Hinweis: Im UI werden die Kompetenzen pro Thema als „Pflichtprogramm“ angezeigt,
//          Lernende können jede Kompetenz jedoch auch ohne Thema dokumentieren.
export const competencies = [
  // Thema 1
  {
    id: 'c1-1',
    themeId: 't1',
    text: 'Ich kenne wichtige Rechte und Pflichten im Betrieb (z. B. Arbeitssicherheit, Lehrvertrag) und kann sie auf Situationen anwenden.',
    ringRefs: { keySkills: ['3.2.2-R1', '3.2.4-R1'], languageModes: ['4.2.1.1', '4.2.2.2'], society: ['recht'] },
    changeTags: ['equity']
  },
  {
    id: 'c1-2',
    themeId: 't1',
    text: 'Ich kann einen Arbeitsauftrag im Betrieb (analog/digital) planen, dokumentieren und kurz reflektieren.',
    ringRefs: { keySkills: ['3.2.2-R1', '3.2.12-R1'], languageModes: ['4.2.3.1'], society: ['digital'] },
    changeTags: ['digitality']
  },
  {
    id: 'c1-3',
    themeId: 't1',
    text: 'Ich kann in einem Team sachlich kommunizieren, Rückfragen stellen und Abmachungen festhalten.',
    ringRefs: { keySkills: ['3.2.10-R1'], languageModes: ['4.2.1.2', '4.2.3.1'], society: ['kultur'] },
    changeTags: ['equity']
  },

  // Thema 2
  {
    id: 'c2-1',
    themeId: 't2',
    text: 'Ich kann ein persönliches Budget (z. B. Mobilität/Leasing/Versicherung) erstellen und daraus Entscheidungen ableiten.',
    ringRefs: { keySkills: ['3.2.9-R1'], languageModes: ['4.2.2.1', '4.2.2.3'], society: ['wirtschaft'] },
    changeTags: ['equity']
  },
  {
    id: 'c2-2',
    themeId: 't2',
    text: 'Ich kann Konsumentscheidungen (z. B. Ersatzteile, Secondhand, Reparieren vs. Neukauf) anhand von Kriterien begründen.',
    ringRefs: { keySkills: ['3.2.9-R1'], languageModes: ['4.2.2.2'], society: ['oekologie', 'wirtschaft'] },
    changeTags: ['sustainability']
  },
  {
    id: 'c2-3',
    themeId: 't2',
    text: 'Ich kann Informationen zu Preisen/Angeboten recherchieren, vergleichen und Quellen einschätzen.',
    ringRefs: { keySkills: ['3.2.1-R1'], languageModes: ['4.2.1.1', '4.2.2.1'], society: ['digital', 'wirtschaft'] },
    changeTags: ['digitality']
  },

  // Thema 3
  {
    id: 'c3-1',
    themeId: 't3',
    text: 'Ich erkenne Belastungen im Schul-/Arbeitsalltag und kann passende Strategien zur Stressreduktion anwenden.',
    ringRefs: { keySkills: ['3.2.4-R1', '3.2.12-R1'], languageModes: ['4.2.3.1'], society: ['ethik'] },
    changeTags: ['equity']
  },
  {
    id: 'c3-2',
    themeId: 't3',
    text: 'Ich kann Sicherheitsvorschriften (z. B. PSA, Gefahrstoffe) begründen und in konkreten Situationen umsetzen.',
    ringRefs: { keySkills: ['3.2.4-R1'], languageModes: ['4.2.2.2'], society: ['recht', 'oekologie'] },
    changeTags: ['sustainability']
  },
  {
    id: 'c3-3',
    themeId: 't3',
    text: 'Ich kann ein Konfliktgespräch respektvoll vorbereiten und durchführen (Ich-Botschaften, Abmachungen).',
    ringRefs: { keySkills: ['3.2.10-R1'], languageModes: ['4.2.1.2', '4.2.2.2'], society: ['kultur'] },
    changeTags: ['equity']
  },

  // Thema 4
  {
    id: 'c4-1',
    themeId: 't4',
    text: 'Ich kann digitale Informationen zu Diagnose/Reparatur gezielt recherchieren, Quellen bewerten und Entscheidungen begründen.',
    ringRefs: { keySkills: ['3.2.1-R2', '3.2.9-R2'], languageModes: ['4.2.1.1', '4.2.2.2'], society: ['digital'] },
    changeTags: ['digitality']
  },
  {
    id: 'c4-2',
    themeId: 't4',
    text: 'Ich kann in einem digitalen Tool (z. B. Loop/Docs) gemeinsam ein Ergebnis erstellen und Rollen/Abmachungen dokumentieren.',
    ringRefs: { keySkills: ['3.2.10-R2'], languageModes: ['4.2.3.2'], society: ['digital'] },
    changeTags: ['digitality', 'equity']
  },
  {
    id: 'c4-3',
    themeId: 't4',
    text: 'Ich kann Chancen und Risiken digitaler Daten (z. B. Telematik, Kunden-/Fahrzeugdaten) erklären und fair beurteilen.',
    ringRefs: { keySkills: ['3.2.6-R1', '3.2.9-R2'], languageModes: ['4.2.2.3'], society: ['digital', 'recht', 'ethik'] },
    changeTags: ['digitality', 'equity']
  },

  // Thema 5
  {
    id: 'c5-1',
    themeId: 't5',
    text: 'Ich kann eine aktuelle Frage zur Mobilitätspolitik (z. B. Emissionen, Infrastruktur) anhand von Argumenten diskutieren.',
    ringRefs: { keySkills: ['3.2.6-R1'], languageModes: ['4.2.1.2', '4.2.2.2'], society: ['politik'] },
    changeTags: ['sustainability']
  },
  {
    id: 'c5-2',
    themeId: 't5',
    text: 'Ich kann Informationen zu Abstimmungsthemen strukturiert zusammenfassen und eine eigene Position begründen.',
    ringRefs: { keySkills: ['3.2.9-R2'], languageModes: ['4.2.2.1', '4.2.2.2'], society: ['politik'] },
    changeTags: ['equity']
  },
  {
    id: 'c5-3',
    themeId: 't5',
    text: 'Ich kann den Zusammenhang zwischen Klimazielen, Mobilität und Berufsalltag in der Werkstatt erklären.',
    ringRefs: { keySkills: ['3.2.4-R2'], languageModes: ['4.2.3.3'], society: ['oekologie', 'politik'] },
    changeTags: ['sustainability']
  },

  // Thema 6
  {
    id: 'c6-1',
    themeId: 't6',
    text: 'Ich kann eine Offerte/AGB/Garantiebedingungen lesen, wichtige Punkte markieren und Fragen formulieren.',
    ringRefs: { keySkills: ['3.2.1-R1'], languageModes: ['4.2.1.1'], society: ['recht'] },
    changeTags: []
  },
  {
    id: 'c6-2',
    themeId: 't6',
    text: 'Ich kann ein ethisches Dilemma (z. B. Preis, Sicherheit, Daten, Nachhaltigkeit) anhand von Kriterien abwägen.',
    ringRefs: { keySkills: ['3.2.9-R2'], languageModes: ['4.2.2.3'], society: ['ethik', 'recht', 'oekologie'] },
    changeTags: ['equity', 'sustainability']
  },
  {
    id: 'c6-3',
    themeId: 't6',
    text: 'Ich kann Datenschutz-Grundideen auf eine Situation im Betrieb übertragen (z. B. Fotos, Kundendaten, Fahrzeugdaten).',
    ringRefs: { keySkills: ['3.2.4-R2'], languageModes: ['4.2.2.2'], society: ['recht', 'digital'] },
    changeTags: ['digitality']
  },

  // Thema 7
  {
    id: 'c7-1',
    themeId: 't7',
    text: 'Ich kann Veränderungen im Berufsfeld (E-Mobilität, Software, KI) beschreiben und eine passende Weiterbildungsoption planen.',
    ringRefs: { keySkills: ['3.2.2-R2'], languageModes: ['4.2.2.1', '4.2.3.1'], society: ['digital', 'wirtschaft'] },
    changeTags: ['digitality']
  },
  {
    id: 'c7-2',
    themeId: 't7',
    text: 'Ich kann eine Bewerbung oder ein Profil (z. B. Bewerbungsbrief/LinkedIn) adressatengerecht verfassen und verbessern.',
    ringRefs: { keySkills: ['3.2.12-R2'], languageModes: ['4.2.1.3', '4.2.3.2'], society: ['wirtschaft'] },
    changeTags: ['equity']
  },
  {
    id: 'c7-3',
    themeId: 't7',
    text: 'Ich kann Rechte und Pflichten gegenüber Behörden/Sozialversicherungen grob erklären und passende Schritte planen.',
    ringRefs: { keySkills: ['3.2.1-R2', '3.2.9-R1'], languageModes: ['4.2.2.1'], society: ['recht', 'politik'] },
    changeTags: ['equity']
  },

  // Thema 8
  {
    id: 'c8-1',
    themeId: 't8',
    text: 'Ich kann Rollenbilder und Kommunikation im Team reflektieren und respektvolle Regeln für Zusammenarbeit formulieren.',
    ringRefs: { keySkills: ['3.2.10-R2', '3.2.12-R2'], languageModes: ['4.2.1.2', '4.2.2.2'], society: ['kultur', 'ethik'] },
    changeTags: ['equity']
  },
  {
    id: 'c8-2',
    themeId: 't8',
    text: 'Ich kann Beispiele aus Fahrzeug-/Werkstattkultur (z. B. Umgangston, Bilder, Humor) kritisch beurteilen und erklären.',
    ringRefs: { keySkills: ['3.2.9-R1'], languageModes: ['4.2.2.3'], society: ['kultur'] },
    changeTags: ['equity']
  },
  {
    id: 'c8-3',
    themeId: 't8',
    text: 'Ich kann eine kurze Präsentation zu einem selbst gewählten Thema (Mobilität/Kultur/Identität) strukturieren und halten.',
    ringRefs: { keySkills: ['3.2.6-R2'], languageModes: ['4.2.3.3'], society: ['kultur'] },
    changeTags: ['digitality']
  }
];
