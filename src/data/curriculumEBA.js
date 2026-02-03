// stud-i-agency-chek – ABU EBA 2-jährige Grundbildung
// Basierend auf Schullehrplan ABU EBA Kanton Zürich

// ============================================
// TRANSVERSALE THEMEN (Freiwillig pro Thema)
// ============================================
export const transversaleThemen = [
  { id: 'digitalisierung', label: 'Digitalisierung', color: '#7C3AED' },
  { id: 'nachhaltigkeit', label: 'Nachhaltige Entwicklung', color: '#059669' },
  { id: 'chancengerechtigkeit', label: 'Chancengerechtigkeit', color: '#DC2626' }
];

// ============================================
// GESELLSCHAFTSINHALTE (für Zirkularität)
// ============================================
export const gesellschaftsinhalte = [
  { id: 'ethik', label: 'Ethik', color: '#8B5CF6' },
  { id: 'identitaet', label: 'Identität & Sozialisation', color: '#EC4899' },
  { id: 'kultur', label: 'Kultur', color: '#F59E0B' },
  { id: 'oekologie', label: 'Ökologie', color: '#10B981' },
  { id: 'politik', label: 'Politik', color: '#EF4444' },
  { id: 'recht', label: 'Recht', color: '#3B82F6' },
  { id: 'techDigital', label: 'Techn. & dig. Transformation', color: '#6366F1' },
  { id: 'wirtschaft', label: 'Wirtschaft', color: '#F97316' }
];

// ============================================
// SPRACHMODI (für Zirkularität)
// ============================================
export const sprachmodi = [
  { id: 'rezMuendlich', label: 'Rezeption mündlich', code: '4.2.1.1' },
  { id: 'rezAudiovisuell', label: 'Rezeption audiovisuell', code: '4.2.1.2' },
  { id: 'rezSchriftlich', label: 'Rezeption schriftlich/bildlich', code: '4.2.1.3' },
  { id: 'prodMuendlich', label: 'Produktion mündlich', code: '4.2.2.1' },
  { id: 'prodSchriftlich', label: 'Produktion schriftlich/bildlich', code: '4.2.2.2' },
  { id: 'prodMultimedial', label: 'Produktion multimedial', code: '4.2.2.3' },
  { id: 'ikMuendlich', label: 'Interaktion u. Kollab. mündlich', code: '4.2.3.1' },
  { id: 'ikSchriftlich', label: 'Interaktion u. Kollab. schriftlich', code: '4.2.3.2' },
  { id: 'ikDigital', label: 'Interaktion u. Kollab. digital', code: '4.2.3.3' }
];

// ============================================
// SCHLÜSSELKOMPETENZEN (für Zirkularität)
// ============================================
export const schluesselkompetenzen = [
  { id: 'sk321', code: '3.2.1', label: 'Zwischen relevanten und irrelevanten Quellen und Inhalten unterscheiden' },
  { id: 'sk322', code: '3.2.2', label: 'Sich Ziele setzen, überprüfen und anpassen' },
  { id: 'sk323', code: '3.2.3', label: 'Antizipative, unternehmerische und innovative Wege der Problemlösung' },
  { id: 'sk324', code: '3.2.4', label: 'In unterschiedlichen Teams zielgerichtet und effizient arbeiten' },
  { id: 'sk325', code: '3.2.5', label: 'Die eigenen Werthaltungen und Überzeugungen erkennen, verstehen, kritisch reflektieren und weiterentwickeln' },
  { id: 'sk326', code: '3.2.6', label: 'Eigene Standpunkte begründen und andere davon überzeugen' },
  { id: 'sk327', code: '3.2.7', label: 'Unterschiedliche Standpunkte nachvollziehen und das gegenseitige Verständnis fördern' },
  { id: 'sk328', code: '3.2.8', label: 'Ihre Lebensphasen planen und mit Unwägbarkeiten umgehen' },
  { id: 'sk329', code: '3.2.9', label: 'Vernetzt und systemisch denken, um sozial, ökologisch und ökonomisch nachhaltig zu handeln' },
  { id: 'sk3210', code: '3.2.10', label: 'Sich in einem sich ständig verändernden Umfeld zurechtfinden und sich an dieses anpassen' },
  { id: 'sk3211', code: '3.2.11', label: 'Mit Mehrdeutigkeiten umgehen' },
  { id: 'sk3212', code: '3.2.12', label: 'An gesellschaftlichen Prozessen partizipieren und Handlungsspielräume nutzen' }
];

// ============================================
// THEMEN mit allen Details
// ============================================
export const themen = [
  // ==========================================
  // 1. LEHRJAHR
  // ==========================================
  {
    id: 't1',
    order: 1,
    lehrjahr: 1,
    title: 'Ins Berufsleben einsteigen',
    lektionen: 22,
    color: '#0EA5E9', // Cyan/Blau
    lebensbezuege: [
      {
        id: 'lb1-1',
        title: 'Ich kenne meine Rechte beim Berufseinstieg und organisiere mich digital.',
        kompetenzen: [
          {
            id: 'k1-1-1',
            text: 'Ich kann mich in der Arbeits- und Ausbildungswelt anhand von vielfältigen Informationen zum Lehrvertrag orientieren und bei Fragen oder Konflikten bei dafür vorgesehenen Kontaktstellen Unterstützung holen.',
            gesellschaft: [
              { bereich: 'recht', inhalt: 'Grundlagen zum Aufbau und zu den wichtigsten Elementen eines Lehrvertrags' },
              { bereich: 'recht', inhalt: 'Ablauf eines einfachen Konfliktmanagements und Zuständigkeiten der Kontaktstellen' }
            ],
            sprachmpiPflicht: [
              { modus: 'ikDigital', inhalt: 'An digitalen Austauschsituationen aktiv teilnehmen (z.B. in einer Videokonferenz zuhören, Rückfragen stellen, Rückmeldungen geben); mit KI-basierten Tools interagieren und deren Beiträge reflektieren.' }
            ],
            sprachmodiOptional: ['rezMuendlich', 'rezSchriftlich']
          },
          {
            id: 'k1-1-2',
            text: 'Ich kann digitale Ordnungsstrukturen nutzen und meinen digitalen Lern- und Arbeitsplatz zweckmässig einrichten.',
            gesellschaft: [
              { bereich: 'techDigital', inhalt: 'Funktionen Ordnerstrukturen, Vorgehen Einrichten Kommunikationsmittel, Kalender- und Notizfunktionen' }
            ],
            sprachmpiPflicht: [
              { modus: 'rezSchriftlich', inhalt: 'Zentrale Aussagen aus Texten oder bildlichen Anleitungen entnehmen mithilfe von Markierhilfe und Lesestrategien' }
            ],
            sprachmodiOptional: ['ikDigital']
          }
        ]
      },
      {
        id: 'lb1-2',
        title: 'Ich gehe im Alltag und im Beruf sorgsam mit mir um und kommuniziere klar und respektvoll.',
        kompetenzen: [
          {
            id: 'k1-2-1',
            text: 'Ich kann zentrale Aussagen zu Regeln und Zuständigkeiten in Schule und Betrieb verstehen und beschreiben, wie ich mich in typischen Situationen respektvoll und verständlich verhalte.',
            gesellschaft: [
              { bereich: 'recht', inhalt: 'Umgangsregeln in Schule und Betrieb, Meldewege und Zuständigkeiten bei Problemen oder Unsicherheiten' }
            ],
            sprachmpiPflicht: [
              { modus: 'rezSchriftlich', inhalt: 'Zentrale Aussagen aus Texten entnehmen mithilfe von Markierhilfe und Lesestrategien' }
            ],
            sprachmodiOptional: ['rezMuendlich', 'prodMuendlich']
          },
          {
            id: 'k1-2-2',
            text: 'Ich kann erkennen, wann mir etwas zu viel wird, und zentrale Aussagen aus Gesprächen oder Texten zu Entlastungsstrategien und Regeln verstehen, um passende Verhaltensweisen für mich abzuleiten.',
            gesellschaft: [
              { bereich: 'identitaet', inhalt: 'Grundwissen über Erfassung Belastungszeichen und über einfache Gesundheits- und Verhaltensregeln' }
            ],
            sprachmpiPflicht: [
              { modus: 'rezMuendlich', inhalt: 'Zentrale Aussagen aus Gesprächen oder Audioquellen verstehen/erkennen; vorgegebene Sachverhalte nachfragen/erheben' }
            ],
            sprachmodiOptional: ['rezSchriftlich']
          }
        ]
      }
    ],
    schluesselkompetenzen: ['sk322', 'sk327', 'sk3210'],
    sprachmodiHaupt: ['rezSchriftlich', 'rezMuendlich', 'ikDigital'],
    zirkularitaet: {
      gesellschaft: { identitaet: 'R1', recht: 'R1', techDigital: 'R1' },
      sprachmodi: { rezMuendlich: 'R1', rezSchriftlich: 'R1', ikDigital: 'R1' },
      schluessel: { sk322: 'R1', sk327: 'R1', sk3210: 'R1' }
    }
  },
  {
    id: 't2',
    order: 2,
    lehrjahr: 1,
    title: 'Bewusst konsumieren und handeln',
    lektionen: 22,
    color: '#F97316', // Orange
    lebensbezuege: [
      {
        id: 'lb2-1',
        title: 'Ich gehe bewusst mit meinem Geld um.',
        kompetenzen: [
          {
            id: 'k2-1-1',
            text: 'Ich kann ein Budget erstellen, reflektiere darin aufgeführte Konsumentscheidungen und identifiziere Risiken für meine Schulden.',
            gesellschaft: [
              { bereich: 'wirtschaft', inhalt: 'Grundwissen zu Budget und Schuldenfallen' }
            ],
            sprachmpiPflicht: [
              { modus: 'rezAudiovisuell', inhalt: 'Hauptaussagen aus audiovisuellen Medien entnehmen (z.B. verstehen kurze Videos oder Clips zu Budget, Ausgaben und Schuldenfallen)' }
            ],
            sprachmodiOptional: ['prodSchriftlich']
          },
          {
            id: 'k2-1-2',
            text: 'Ich kann Strategien für einen nachhaltigen Konsum umsetzen.',
            gesellschaft: [
              { bereich: 'oekologie', inhalt: 'Grundlagen der Produktbewertung: Herkunft, Energieverbrauch, Materialien, Entsorgung' }
            ],
            sprachmpiPflicht: [
              { modus: 'prodMuendlich', inhalt: 'Meinung äussern, Gespräch führen, Argumente verwenden (z.B. mündlich erklären, wie ihr Konsum die Umwelt beeinflusst)' }
            ],
            sprachmodiOptional: ['rezAudiovisuell']
          }
        ]
      },
      {
        id: 'lb2-2',
        title: 'Ich befasse mich mit wirtschaftlichem Handeln im Betrieb und im Alltag und dessen Auswirkungen.',
        kompetenzen: [
          {
            id: 'k2-2-1',
            text: 'Ich kann beschreiben, was die Grundlagen für die Produktion der Dienstleistung/der Ware in meinem Betrieb sind, wie dafür Werbung gemacht wird und wer die Kunden sind.',
            gesellschaft: [
              { bereich: 'wirtschaft', inhalt: 'Grundlegendes Wissen darüber, wie ein Betrieb mit seinen Kundinnen und Kunden kommuniziert' }
            ],
            sprachmpiPflicht: [
              { modus: 'prodMuendlich', inhalt: 'Meinung äussern, Gespräch führen, Argumente verwenden' }
            ],
            sprachmodiOptional: ['prodSchriftlich']
          },
          {
            id: 'k2-2-2',
            text: 'Ich kann die Folgen des Massenkonsums aufzeigen.',
            gesellschaft: [
              { bereich: 'oekologie', inhalt: 'Übersicht, wie Massenkonsum Umwelt und Ressourcen belastet: Rohstoffverbrauch, Energiebedarf, Transportwege, Abfallmengen, CO₂-Fussabdruck' }
            ],
            sprachmpiPflicht: [
              { modus: 'rezAudiovisuell', inhalt: 'Hauptaussagen aus audiovisuellen Medien entnehmen (z.B. aus Videos über die Umweltfolgen des Massenkonsums)' }
            ],
            sprachmodiOptional: ['prodMuendlich']
          }
        ]
      }
    ],
    schluesselkompetenzen: ['sk321', 'sk323', 'sk329'],
    sprachmodiHaupt: ['rezAudiovisuell', 'prodMuendlich'],
    zirkularitaet: {
      gesellschaft: { oekologie: 'R1', wirtschaft: 'R1' },
      sprachmodi: { rezAudiovisuell: 'R1', prodMuendlich: 'R1' },
      schluessel: { sk321: 'R1', sk323: 'R1', sk329: 'R1' }
    }
  },
  {
    id: 't3',
    order: 3,
    lehrjahr: 1,
    title: 'Sicherheit und Gesundheit',
    lektionen: 22,
    color: '#22C55E', // Grün
    lebensbezuege: [
      {
        id: 'lb3-1',
        title: 'Ich schätze Risiken im Alltag und im Berufsleben ein und erkläre, wie ich mich dagegen absichern kann.',
        kompetenzen: [
          {
            id: 'k3-1-1',
            text: 'Ich kann aufzeigen, welchen Risiken ich im Alltag und im Betrieb ausgesetzt bin.',
            gesellschaft: [
              { bereich: 'recht', inhalt: 'Regeln und Zuständigkeiten, um Risiken im Alltag und am Arbeitsplatz zu minimieren' }
            ],
            sprachmpiPflicht: [
              { modus: 'ikMuendlich', inhalt: 'An Gesprächen, z.B. einem Austausch über Risiken im Alltag und im Betrieb, aktiv teilnehmen' }
            ],
            sprachmodiOptional: ['prodSchriftlich']
          },
          {
            id: 'k3-1-2',
            text: 'Ich kann prüfen, wie ich geschützt bin und mich selbst absichern.',
            gesellschaft: [
              { bereich: 'recht', inhalt: 'Gesetzliche Grundlagen und Zuständigkeiten für Schutz bei Unfällen, Schäden oder Risiken' }
            ],
            sprachmpiPflicht: [
              { modus: 'prodSchriftlich', inhalt: 'Nachricht/Text schreiben, Präsentation/Protokoll, Tagebuch, Prompt formulieren' }
            ],
            sprachmodiOptional: ['ikMuendlich']
          }
        ]
      },
      {
        id: 'lb3-2',
        title: 'Ich reflektiere, wie gesellschaftliche Normen mein Wohlbefinden prägen, und wie ich gesund lebe.',
        kompetenzen: [
          {
            id: 'k3-2-1',
            text: 'Ich kann gesellschaftliche Erwartungen und Normen zu Körper, Geschlecht und Identität erkennen und reflektieren.',
            gesellschaft: [
              { bereich: 'identitaet', inhalt: 'Darstellungsweisen in Medien und von beruflichen Rollenbildern, die Erwartungen zu Aussehen, Verhalten und Geschlecht prägen' }
            ],
            sprachmpiPflicht: [
              { modus: 'ikMuendlich', inhalt: 'Zuhören, an Gesprächen teilnehmen, Rückmeldung geben, Argumentstruktur erkennen' }
            ],
            sprachmodiOptional: ['prodSchriftlich']
          },
          {
            id: 'k3-2-2',
            text: 'Ich kann Möglichkeiten für einen gesundheitsfördernden Lebensstil beruflich und privat aufzeigen und bewerten.',
            gesellschaft: [
              { bereich: 'identitaet', inhalt: 'Hinweise, wie die Lernenden ihre eigenen Bedürfnisse im Alltag besser wahrnehmen können' }
            ],
            sprachmpiPflicht: [
              { modus: 'prodSchriftlich', inhalt: 'Nachricht/Text schreiben, Präsentation/Protokoll, Tagebuch, Prompt formulieren, Bild erzeugen' }
            ],
            sprachmodiOptional: ['ikMuendlich']
          }
        ]
      }
    ],
    schluesselkompetenzen: ['sk324', 'sk325', 'sk3211'],
    sprachmodiHaupt: ['ikMuendlich', 'prodSchriftlich'],
    zirkularitaet: {
      gesellschaft: { identitaet: 'R2', recht: 'R2' },
      sprachmodi: { prodSchriftlich: 'R1', ikMuendlich: 'R1' },
      schluessel: { sk324: 'R1', sk325: 'R1', sk3211: 'R1' }
    }
  },
  {
    id: 't4',
    order: 4,
    lehrjahr: 1,
    title: 'Medien und digitale Welt',
    lektionen: 22,
    color: '#8B5CF6', // Violett
    lebensbezuege: [
      {
        id: 'lb4-1',
        title: 'Ich nutze KI und digitale Werkzeuge gezielt, reflektiert und eigenständig.',
        kompetenzen: [
          {
            id: 'k4-1-1',
            text: 'Ich kann digitale Werkzeuge und deren Funktionen situationsgerecht nutzen.',
            gesellschaft: [
              { bereich: 'techDigital', inhalt: 'Werkzeugkasten Smartphone, Funktionen Kommunikationstools, Funktionen Officeprogramme' }
            ],
            sprachmpiPflicht: [
              { modus: 'ikDigital', inhalt: 'Digitale Dokumente an verschiedenen Orten (hybrid) und zu unterschiedlichen Zeiten (asynchron) in gemeinsamer Absprache erstellen und gestalten' }
            ],
            sprachmodiOptional: ['ikSchriftlich']
          },
          {
            id: 'k4-1-2',
            text: 'Ich kann Funktionen von KI anwenden und ein eigenes Ausgangsprodukt (Text, Foto, etc.) mit KI überarbeiten.',
            gesellschaft: [
              { bereich: 'kultur', inhalt: 'KI-Funktionen für die Gestaltung von Medieninhalten' }
            ],
            sprachmpiPflicht: [
              { modus: 'ikDigital', inhalt: 'Digitale Lernjournale gemeinsam führen und reflektieren, in Online-Diskussionen aktiv mitwirken' }
            ],
            sprachmodiOptional: ['prodMultimedial']
          }
        ]
      },
      {
        id: 'lb4-2',
        title: 'Ich suche und prüfe Infos, gehe verantwortungsvoll mit Social Media um und erkenne künstliche und kulturell geprägte KI-Inhalte.',
        kompetenzen: [
          {
            id: 'k4-2-1',
            text: 'Ich kann verlässliche Informationen des Alltags, der Schule und des Berufs finden und prüfen.',
            gesellschaft: [
              { bereich: 'techDigital', inhalt: 'Rechercheleitfaden, Recherchefunktionen (inklusive KI), Quellenarchive, Quellendokumentation' }
            ],
            sprachmpiPflicht: [
              { modus: 'ikSchriftlich', inhalt: 'Schriftliche Rückmeldung verfassen, in gemeinsamen Dokumenten Quellen sammeln und nach Kriterien ordnen' }
            ],
            sprachmodiOptional: ['ikDigital']
          },
          {
            id: 'k4-2-2',
            text: 'Ich kann verantwortungsvoll mit Social Media umgehen, KI-Inhalte erkennen und sie in ihren kulturellen Kontext einordnen.',
            gesellschaft: [
              { bereich: 'kultur', inhalt: 'Überblick darüber, wie kulturelle und soziale Hintergründe die Darstellung in Social Media prägen' }
            ],
            sprachmpiPflicht: [
              { modus: 'ikMuendlich', inhalt: 'Gespräche führen, Rückmeldungen differenzieren, Rollen übernehmen, Gruppenentscheidungen mitentwickeln' }
            ],
            sprachmodiOptional: ['ikSchriftlich', 'ikDigital']
          }
        ]
      }
    ],
    schluesselkompetenzen: ['sk321', 'sk3210', 'sk3212'],
    sprachmodiHaupt: ['ikDigital', 'ikSchriftlich', 'ikMuendlich'],
    zirkularitaet: {
      gesellschaft: { kultur: 'R1', techDigital: 'R2' },
      sprachmodi: { ikMuendlich: 'R2', ikSchriftlich: 'R1', ikDigital: 'R2' },
      schluessel: { sk321: 'R2', sk3210: 'R2', sk3212: 'R1' }
    }
  },

  // ==========================================
  // 2. LEHRJAHR
  // ==========================================
  {
    id: 't5',
    order: 5,
    lehrjahr: 2,
    title: 'Meinung bilden und mitgestalten',
    lektionen: 22,
    color: '#EC4899', // Pink/Magenta
    lebensbezuege: [
      {
        id: 'lb5-1',
        title: 'Ich bilde mir eine Meinung zu politischen Zusammenhängen, vertrete sie und rege andere zum Nachdenken an.',
        kompetenzen: [
          {
            id: 'k5-1-1',
            text: 'Ich kann politische Beiträge aus Informationsquellen verstehen und die Folgen von politischen Entscheidungen einordnen.',
            gesellschaft: [
              { bereich: 'oekologie', inhalt: 'Modelle zum Klimawandel, ökologischer Fussabdruck' }
            ],
            sprachmpiPflicht: [
              { modus: 'rezMuendlich', inhalt: 'Absichten erkennen, politische Aussagen verstehen, politischen Diskussionen folgen, Werte hinter Positionen erkennen' }
            ],
            sprachmodiOptional: ['prodMultimedial']
          },
          {
            id: 'k5-1-2',
            text: 'Ich kann eigene Standpunkte zur Meinungsbildung entwickeln und diese in Gesprächen argumentativ vertreten.',
            gesellschaft: [
              { bereich: 'politik', inhalt: 'Abstimmungsunterlagen, Medienbeiträge' }
            ],
            sprachmpiPflicht: [
              { modus: 'prodMultimedial', inhalt: 'Content erstellen (z.B. Social-Media), Argumente (mit Hilfe eines KI-Assistenten) aufbauen' }
            ],
            sprachmodiOptional: ['rezMuendlich']
          }
        ]
      },
      {
        id: 'lb5-2',
        title: 'Ich kenne meine politischen Rechte und weiss, wie ich mich an politischen Prozessen beteiligen kann.',
        kompetenzen: [
          {
            id: 'k5-2-1',
            text: 'Ich kann das politische System der Schweiz darstellen und Möglichkeiten der politischen Teilnahme aufzeigen.',
            gesellschaft: [
              { bereich: 'politik', inhalt: '(Halb)direkte Demokratie, Föderalismus' }
            ],
            sprachmpiPflicht: [
              { modus: 'prodMultimedial', inhalt: 'Content erstellen (z.B. Social-Media), politische Inhalte aufbereiten' }
            ],
            sprachmodiOptional: ['rezMuendlich']
          },
          {
            id: 'k5-2-2',
            text: 'Ich kann einen Beitrag gestalten, der politische Mitwirkungsmöglichkeiten für Jugendliche sichtbar macht und zur aktiven Teilhabe motiviert.',
            gesellschaft: [
              { bereich: 'politik', inhalt: 'Gemeindeorganisation' }
            ],
            sprachmpiPflicht: [
              { modus: 'prodMultimedial', inhalt: 'Content erstellen (z.B. Social-Media), mit einem Video- oder Bildgenerator ein Mitwirkungsprojekt produzieren' }
            ],
            sprachmodiOptional: ['ikMuendlich']
          }
        ]
      }
    ],
    schluesselkompetenzen: ['sk325', 'sk326', 'sk329'],
    sprachmodiHaupt: ['rezMuendlich', 'prodMultimedial'],
    zirkularitaet: {
      gesellschaft: { oekologie: 'R2', politik: 'R1' },
      sprachmodi: { rezMuendlich: 'R2', prodMultimedial: 'R1' },
      schluessel: { sk325: 'R2', sk326: 'R1', sk329: 'R2' }
    }
  },
  {
    id: 't6',
    order: 6,
    lehrjahr: 2,
    title: 'Verträge verstehen – fair handeln',
    lektionen: 22,
    color: '#14B8A6', // Teal
    lebensbezuege: [
      {
        id: 'lb6-1',
        title: 'Ich setze mich mit rechtlichen Fragen des Alltags auseinander.',
        kompetenzen: [
          {
            id: 'k6-1-1',
            text: 'Ich kann Alltagsverträge beurteilen (z.B. Kauf) und meine Rechte und Pflichten daraus ableiten.',
            gesellschaft: [
              { bereich: 'recht', inhalt: 'Grundwissen über das Vertragsrecht' }
            ],
            sprachmpiPflicht: [
              { modus: 'prodSchriftlich', inhalt: 'Nachricht/Text/Bild/Präsentation mit KI-Chat erstellen/überarbeiten, strukturierte Nachricht mit Begründung verfassen' }
            ],
            sprachmodiOptional: ['prodMuendlich']
          },
          {
            id: 'k6-1-2',
            text: 'Ich kann beurteilen, wann eine rechtliche Abklärung notwendig ist und aufzeigen, wo ich Unterstützung finde.',
            gesellschaft: [
              { bereich: 'recht', inhalt: 'Grundwissen über das Vertragsrecht' }
            ],
            sprachmpiPflicht: [
              { modus: 'prodMuendlich', inhalt: 'Aussagen und Argumente strukturieren, Redemittel nutzen, Argumentationsaufbau' }
            ],
            sprachmodiOptional: ['prodSchriftlich']
          }
        ]
      },
      {
        id: 'lb6-2',
        title: 'Ich handle in schwierigen Situationen fair und bespreche mit anderen, was dabei herausfordernd sein kann.',
        kompetenzen: [
          {
            id: 'k6-2-1',
            text: 'Ich kann ethische Regelungen beschreiben und sie von rechtlichen Bestimmungen unterscheiden.',
            gesellschaft: [
              { bereich: 'ethik', inhalt: 'Methode für Perspektivenübernahme, Ethische Grundsätze' }
            ],
            sprachmpiPflicht: [
              { modus: 'prodMuendlich', inhalt: 'Aussagen und Argumente strukturieren, Redemittel nutzen' }
            ],
            sprachmodiOptional: ['ikMuendlich']
          },
          {
            id: 'k6-2-2',
            text: 'Ich kann Verhaltensweisen beschreiben, um moralische Konfliktsituationen zu lösen und in der Gruppe mögliche Herausforderungen diskutieren.',
            gesellschaft: [
              { bereich: 'ethik', inhalt: 'Moralische Prinzipien kennen' }
            ],
            sprachmpiPflicht: [
              { modus: 'prodMuendlich', inhalt: 'Aussagen und Argumente strukturieren, Redemittel nutzen' }
            ],
            sprachmodiOptional: ['ikMuendlich']
          }
        ]
      }
    ],
    schluesselkompetenzen: ['sk324', 'sk326', 'sk327'],
    sprachmodiHaupt: ['prodSchriftlich', 'prodMuendlich'],
    zirkularitaet: {
      gesellschaft: { ethik: 'R1', recht: 'R3' },
      sprachmodi: { prodSchriftlich: 'R2', prodMuendlich: 'R2' },
      schluessel: { sk324: 'R2', sk326: 'R2', sk327: 'R2' }
    }
  },
  {
    id: 't7',
    order: 7,
    lehrjahr: 2,
    title: 'Arbeit und Zukunft',
    lektionen: 22,
    color: '#A16207', // Braun/Amber dunkel
    lebensbezuege: [
      {
        id: 'lb7-1',
        title: 'Ich finde heraus, was mir privat und beruflich wichtig ist und entwickle Zukunftsszenarien.',
        kompetenzen: [
          {
            id: 'k7-1-1',
            text: 'Ich kann mich mit meinen Fähigkeiten, Interessen, Werten und Zielen auseinandersetzen.',
            gesellschaft: [
              { bereich: 'identitaet', inhalt: 'Persönlichkeitsentwicklung, Weiterbildungsmöglichkeiten und Zukunftschancen' }
            ],
            sprachmpiPflicht: [
              { modus: 'rezSchriftlich', inhalt: 'Absicht von Texten erkennen (digital/analog), Grafiken/Umfragen interpretieren' }
            ],
            sprachmodiOptional: ['ikMuendlich']
          },
          {
            id: 'k7-1-2',
            text: 'Ich kann meine berufliche Laufbahn planen, mein Bewerbungsdossier aktualisieren und die Bedeutung von lebenslangem Lernen erkennen.',
            gesellschaft: [
              { bereich: 'wirtschaft', inhalt: 'Grundwissen zu verschiedenen wirtschaftlichen Situationen' }
            ],
            sprachmpiPflicht: [
              { modus: 'ikMuendlich', inhalt: 'An zielgerichteten Gesprächen aktiv teilnehmen, gemeinsam Lösungen entwickeln, Rückmeldungen geben' }
            ],
            sprachmodiOptional: ['rezSchriftlich', 'ikSchriftlich']
          }
        ]
      },
      {
        id: 'lb7-2',
        title: 'Ich weiss, welche Pflichten gegenüber Staat und Gesellschaft bestehen, welche Unterlagen dafür erforderlich sind und welche Stellen dafür zuständig sind.',
        kompetenzen: [
          {
            id: 'k7-2-1',
            text: 'Ich kann eine Übersicht erstellen, welche Aufgaben ich gegenüber dem Staat/der Gesellschaft habe und wie ich diese ausüben kann.',
            gesellschaft: [
              { bereich: 'politik', inhalt: 'Politische Pflichten und Rechte' }
            ],
            sprachmpiPflicht: [
              { modus: 'ikSchriftlich', inhalt: 'Mehrmalige schriftliche Kommunikation (Dialog asynchron), Bezug erläutern, schriftliche Rückmeldung verfassen' }
            ],
            sprachmodiOptional: ['ikMuendlich']
          },
          {
            id: 'k7-2-2',
            text: 'Ich kann die Unterlagen für einen Austausch mit den Behörden oder mit einer anderen Akteurin/einem anderen Akteur zusammenstellen und diese einreichen.',
            gesellschaft: [
              { bereich: 'wirtschaft', inhalt: 'Erwartungen verschiedener Anspruchsgruppen und Zielkonflikte' }
            ],
            sprachmpiPflicht: [
              { modus: 'ikSchriftlich', inhalt: 'Mehrmalige schriftliche Kommunikation (Dialog asynchron), schriftlicher Austausch mit Behörden' }
            ],
            sprachmodiOptional: ['ikMuendlich']
          }
        ]
      }
    ],
    schluesselkompetenzen: ['sk322', 'sk323', 'sk328'],
    sprachmodiHaupt: ['rezSchriftlich', 'ikMuendlich', 'ikSchriftlich'],
    zirkularitaet: {
      gesellschaft: { identitaet: 'R3', politik: 'R2', wirtschaft: 'R2' },
      sprachmodi: { rezSchriftlich: 'R2', ikMuendlich: 'R3', ikSchriftlich: 'R2' },
      schluessel: { sk322: 'R2', sk323: 'R2', sk328: 'R1' }
    }
  },
  {
    id: 't8',
    order: 8,
    lehrjahr: 2,
    title: 'Kultur und Kunst',
    lektionen: 22,
    color: '#DC2626', // Rot
    lebensbezuege: [
      {
        id: 'lb8-1',
        title: 'Ich erlebe, wie Kultur Zugehörigkeit schafft und warum Ausdrucksfreiheit wichtig ist.',
        kompetenzen: [
          {
            id: 'k8-1-1',
            text: 'Ich kann kulturelle Ausdrucksformen wie Sprache, Bilder oder Werke aus meinem Umfeld beschreiben, ihre Bedeutung beurteilen und die Wichtigkeit der Ausdrucksfreiheit aufzeigen.',
            gesellschaft: [
              { bereich: 'kultur', inhalt: 'Ausdrucksformen von Kunst (Auseinandersetzung mit Werken der Kunst)' }
            ],
            sprachmpiPflicht: [
              { modus: 'rezAudiovisuell', inhalt: 'Bildsprache/Tonalität deuten, Nonverbalität interpretieren, audiovisuelle Medienformate unterscheiden' }
            ],
            sprachmodiOptional: ['rezMuendlich']
          },
          {
            id: 'k8-1-2',
            text: 'Ich kann kulturelle Phänomene in meinem Umfeld reflektieren und begründen, wie sie Zugehörigkeit und Machtverhältnisse beeinflussen.',
            gesellschaft: [
              { bereich: 'ethik', inhalt: 'Perspektivenübernahme, Ethische Grundsätze' }
            ],
            sprachmpiPflicht: [
              { modus: 'rezMuendlich', inhalt: 'Beitrag im Podcast/Rollenspiel, publikumsgerecht präsentieren' }
            ],
            sprachmodiOptional: ['rezAudiovisuell']
          }
        ]
      },
      {
        id: 'lb8-2',
        title: 'Ich bearbeite kulturelle Themen gestalterisch und bewerte mit anderen die Wirkung.',
        kompetenzen: [
          {
            id: 'k8-2-1',
            text: 'Ich kann kreative Ausdrucksformen nutzen, um auf gesellschaftliche Entwicklungen zu reagieren und Denkanstösse zu geben.',
            gesellschaft: [
              { bereich: 'kultur', inhalt: 'Kultur als Ausdrucksmittel' }
            ],
            sprachmpiPflicht: [
              { modus: 'prodMultimedial', inhalt: 'Neue audiovisuelle Programme recherchieren und damit Storys erstellen' }
            ],
            sprachmodiOptional: ['ikMuendlich']
          },
          {
            id: 'k8-2-2',
            text: 'Ich kann verschiedene Lesarten eines Kunstwerks begründet diskutieren.',
            gesellschaft: [
              { bereich: 'ethik', inhalt: 'Perspektivenübernahme, Ethische Grundsätze' }
            ],
            sprachmpiPflicht: [
              { modus: 'prodMultimedial', inhalt: 'Neue audiovisuelle Programme recherchieren und damit Storys erstellen' }
            ],
            sprachmodiOptional: ['ikMuendlich']
          }
        ]
      }
    ],
    schluesselkompetenzen: ['sk328', 'sk3211', 'sk3212'],
    sprachmodiHaupt: ['rezAudiovisuell', 'rezMuendlich', 'prodMultimedial'],
    zirkularitaet: {
      gesellschaft: { ethik: 'R2', kultur: 'R2' },
      sprachmodi: { rezMuendlich: 'R3', rezAudiovisuell: 'R2', prodMultimedial: 'R2' },
      schluessel: { sk328: 'R2', sk3211: 'R2', sk3212: 'R2' }
    }
  }
];

// ============================================
// HELPER FUNCTIONS
// ============================================

// Themen nach Lehrjahr filtern
export const getThemenByLehrjahr = (lehrjahr) => {
  return themen.filter(t => t.lehrjahr === lehrjahr);
};

// Thema nach ID finden
export const getThemaById = (id) => {
  return themen.find(t => t.id === id);
};

// Schlüsselkompetenz nach ID finden
export const getSchluesselkompetenzById = (id) => {
  return schluesselkompetenzen.find(sk => sk.id === id);
};

// Sprachmodus nach ID finden
export const getSprachmodusById = (id) => {
  return sprachmodi.find(sm => sm.id === id);
};

// Gesellschaftsinhalt nach ID finden
export const getGesellschaftsinhaltById = (id) => {
  return gesellschaftsinhalte.find(gi => gi.id === id);
};

// Farben für UI
export const uiColors = {
  gesellschaft: {
    bg: '#E6F5FC',
    text: '#009EE0',
    border: '#B3E0F2'
  },
  sprache: {
    bg: '#E8F8E8',
    text: '#228B22',
    border: '#B8E8B8'
  },
  schluessel: {
    bg: '#FEF3C7',
    text: '#B45309',
    border: '#FDE68A'
  },
  transversal: {
    bg: '#F3E8FF',
    text: '#7C3AED',
    border: '#DDD6FE'
  }
};

// Themenfarben für Zirkularität
export const themenFarben = {
  t1: { bg: '#E0F2FE', text: '#0EA5E9' },
  t2: { bg: '#FFEDD5', text: '#F97316' },
  t3: { bg: '#DCFCE7', text: '#22C55E' },
  t4: { bg: '#EDE9FE', text: '#8B5CF6' },
  t5: { bg: '#FCE7F3', text: '#EC4899' },
  t6: { bg: '#CCFBF1', text: '#14B8A6' },
  t7: { bg: '#FEF3C7', text: '#A16207' },
  t8: { bg: '#FEE2E2', text: '#DC2626' }
};
