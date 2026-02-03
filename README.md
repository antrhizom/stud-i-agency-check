# stud-i-agency-chek

ABU EBA Lernplattform zur Erfassung und Dokumentation von Lernfortschritten.

## Features

- **Lehrpersonen-Dashboard**: Klassen verwalten, Lernenden-Codes generieren (mit Tier-Pseudonymen), CSV-Export
- **Lernenden-Dashboard**: Kompetenzen erfassen (Gesellschaft, Sprache, Schlüsselkompetenzen)
- **Zirkularitäts-Dashboard**: Fortschritt visualisieren
- **Firebase Backend**: Firestore für Datenspeicherung

## Tech Stack

- React + Vite
- Tailwind CSS
- Firebase (Firestore)
- Vercel Deployment

## Installation

```bash
npm install
npm run dev
```

## Deployment

```bash
npm run build
vercel --prod
```

## Umgebungsvariablen

Erstelle eine `.env` Datei mit deinen Firebase-Credentials:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```
