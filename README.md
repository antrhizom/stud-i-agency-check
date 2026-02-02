# ABU Kompetenz-Check (stud-i-agency-chek)

Digitale Kompetenzcheckliste für den Allgemeinbildenden Unterricht (ABU).

## Rollen

- **Admin**: Verwaltet Lehrpersonen und externe Zugänge
- **Lehrperson (Teacher)**: Erstellt Klassen, verwaltet Lernende, generiert Codes
- **Lernende (Learner)**: Dokumentiert Kompetenzen, erstellt Einträge
- **Externe (External)**: Read-only Zugang auf einzelne Lernende

## Tech Stack

- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Firebase (Auth, Firestore, Cloud Functions)
- **Hosting**: Vercel

## Setup

### 1. Dependencies installieren

```bash
npm install
cd functions && npm install && cd ..
```

### 2. Umgebungsvariablen

Erstelle `.env` im Root-Verzeichnis oder setze in Vercel:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_FUNCTIONS_REGION=europe-west6
```

### 3. Firebase einrichten

```bash
firebase login
firebase use YOUR_PROJECT_ID
firebase deploy --only functions
firebase deploy --only firestore:rules
```

### 4. Lokal starten

```bash
npm run dev
```

### 5. Deployment (Vercel)

Verbinde das GitHub-Repo mit Vercel. Vercel erkennt Vite automatisch.

## Struktur

```
src/
  components/
    admin/       - Admin Dashboard
    teacher/     - Lehrpersonen Dashboard
    learner/     - Lernende Dashboard
    external/    - Externer Zugang
  contexts/      - AuthContext
  data/          - Curriculum/Kompetenzen
  utils/         - PDF Export
functions/       - Firebase Cloud Functions
```

## Curriculum

Die Kompetenzen sind in `src/data/curriculum.js` definiert:

- **8 Themenbereiche** (Pflichtprogramm)
- **24 Kompetenzen** (je 3 pro Thema)
- **3 Change-Tags**: Digitalität, Chancengerechtigkeit, Nachhaltigkeit
- **Ringe**: Schlüsselkompetenzen, Sprachmodi, Gesellschaft
