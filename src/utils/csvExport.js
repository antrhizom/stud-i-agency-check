// CSV-Export für Lernende mit Tiersymbolen
// Ermöglicht Lehrpersonen das Herunterladen einer Liste zum Ausfüllen der Namen

/**
 * Exportiert Lernende als CSV-Datei
 * @param {Array} learners - Array mit {animalEmoji, animalName, code}
 * @param {string} className - Name der Klasse für Dateiname
 */
export function exportLearnersCSV(learners, className = 'Klasse') {
  // BOM für UTF-8 (damit Excel Umlaute korrekt anzeigt)
  const BOM = '\uFEFF';

  // Header-Zeile
  const header = 'Tiersymbol;Emoji;Code;Name (bitte ausfüllen)\n';

  // Daten-Zeilen
  const rows = learners.map(learner =>
    `${learner.animalName};${learner.animalEmoji};${learner.code};`
  ).join('\n');

  // Vollständige CSV
  const csvContent = BOM + header + rows;

  // Blob erstellen
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  // Download-Link erstellen
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  // Dateiname mit Datum
  const date = new Date().toISOString().split('T')[0];
  const sanitizedClassName = className.replace(/[^a-zA-Z0-9äöüÄÖÜ\-_]/g, '_');
  const filename = `Lernende_${sanitizedClassName}_${date}.csv`;

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // URL freigeben
  URL.revokeObjectURL(url);
}

/**
 * Exportiert alle Klassen mit Lernenden als CSV
 * @param {Array} classes - Array mit Klassen-Objekten
 * @param {Array} learnerCodes - Array mit learnerCode-Dokumenten
 */
export function exportAllClassesCSV(classes, learnerCodes) {
  const BOM = '\uFEFF';

  const header = 'Klasse;Tiersymbol;Emoji;Code;Name\n';

  const rows = classes.flatMap(cls => {
    const classLearners = learnerCodes.filter(lc => lc.classId === cls.id);
    return classLearners.map(learner =>
      `${cls.name};${learner.animalName || ''};${learner.animalEmoji || ''};${learner.code};${learner.learnerName || ''}`
    );
  }).join('\n');

  const csvContent = BOM + header + rows;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  const date = new Date().toISOString().split('T')[0];

  link.setAttribute('href', url);
  link.setAttribute('download', `Alle_Lernenden_${date}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
