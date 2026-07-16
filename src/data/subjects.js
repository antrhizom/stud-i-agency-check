// ============================================
// FÄCHER-REGISTRY
// Zentrale Definition aller Fächer (ABU-Varianten + Berufskunde),
// die einer Klasse zugewiesen werden können.
// ============================================
import * as abuEBA from './curriculumEBA';
import * as abuEFZ3 from './curriculumEFZ3';
import * as abuEFZ4 from './curriculumEFZ4';
import { bkCurricula, getBkLeistungsziele } from './curriculumBK';

export const SUBJECTS = [
  {
    id: 'abu-eba',
    kind: 'abu',
    label: 'ABU · EBA (2-jährig)',
    short: 'ABU EBA',
    grundbildung: '2-jährige EBA',
    lehrjahre: 2,
    color: '#009EE0',
    curriculum: abuEBA
  },
  {
    id: 'abu-efz3',
    kind: 'abu',
    label: 'ABU · EFZ (3-jährig)',
    short: 'ABU EFZ 3j',
    grundbildung: '3-jährige EFZ',
    lehrjahre: 3,
    color: '#2563EB',
    curriculum: abuEFZ3
  },
  {
    id: 'abu-efz4',
    kind: 'abu',
    label: 'ABU · EFZ (4-jährig)',
    short: 'ABU EFZ 4j',
    grundbildung: '4-jährige EFZ',
    lehrjahre: 4,
    color: '#7C3AED',
    curriculum: abuEFZ4
  },
  {
    id: 'bk-aa',
    kind: 'bk',
    label: 'Fahrzeugtechnik · EBA (Automobil-Assistent/-in)',
    short: 'BK AA EBA',
    grundbildung: '2-jährige EBA',
    lehrjahre: 2,
    color: '#EA580C',
    bk: bkCurricula['bk-aa']
  },
  {
    id: 'bk-af',
    kind: 'bk',
    label: 'Fahrzeugtechnik · EFZ (Automobil-Fachmann/-frau)',
    short: 'BK AF EFZ',
    grundbildung: '3-jährige EFZ',
    lehrjahre: 3,
    color: '#DC2626',
    bk: bkCurricula['bk-af']
  }
];

export const getSubjectById = (id) => SUBJECTS.find(s => s.id === id) || null;

// Fallback für Alt-Daten: Klassen/Einträge ohne Fachzuordnung sind ABU EBA.
export const DEFAULT_SUBJECT_ID = 'abu-eba';

export const getClassSubjects = (cls) => {
  const ids = (cls?.subjectIds && cls.subjectIds.length) ? cls.subjectIds : [DEFAULT_SUBJECT_ID];
  return ids.map(getSubjectById).filter(Boolean);
};

export { getBkLeistungsziele };
