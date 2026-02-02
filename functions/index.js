const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Hilfsfunktion: Zufälliges Passwort generieren
function generatePassword(length = 10) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

// Hilfsfunktion: E-Mail aus Name und Kontext generieren
function generateEmail(name, contextName, domain = 'studiagency-check.ch') {
  // Name normalisieren (Umlaute, Sonderzeichen entfernen)
  const normalizedName = name
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]/g, '');
  
  const normalizedContext = (contextName || 'abu')
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]/g, '');
  
  return `${normalizedName}@${normalizedContext}.${domain}`;
}

// Lehrperson erstellen
exports.createTeacher = functions
  .region('europe-west6')
  .https.onCall(async (data, context) => {
    // Nur Admins können Berufsbildner erstellen
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Nicht authentifiziert');
    }

    const callerDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
    if (!callerDoc.exists || callerDoc.data().role !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Keine Berechtigung');
    }

    const { email, name, company } = data;

    if (!email || !name) {
      throw new functions.https.HttpsError('invalid-argument', 'Fehlende Pflichtfelder');
    }

    try {
      // Passwort generieren
      const password = generatePassword();

      // Benutzer in Firebase Auth erstellen
      const userRecord = await admin.auth().createUser({
        email: email,
        password: password,
        displayName: name,
        emailVerified: false
      });

      // Benutzer-Dokument in Firestore erstellen
      await admin.firestore().collection('users').doc(userRecord.uid).set({
        role: 'teacher',
        name: name,
        email: email,
        schoolContext: company || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return {
        success: true,
        uid: userRecord.uid,
        email: email,
        password: password
      };
    } catch (error) {
      console.error('Error creating trainer:', error);
      throw new functions.https.HttpsError('internal', error.message);
    }
  });

// Lernende erstellen
exports.createLearner = functions
  .region('europe-west6')
  .https.onCall(async (data, context) => {
    // Nur Admins können Lernende erstellen
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Nicht authentifiziert');
    }

    const callerDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
    if (!callerDoc.exists || callerDoc.data().role !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Keine Berechtigung');
    }

    const { name, className, teacherId, domain } = data;

    if (!name || !teacherId) {
      throw new functions.https.HttpsError('invalid-argument', 'Fehlende Pflichtfelder');
    }

    try {
      // E-Mail und Passwort generieren
      const email = generateEmail(name, className || 'abu', domain || 'studiagency-check.ch');
      const password = generatePassword();

      // Benutzer in Firebase Auth erstellen
      const userRecord = await admin.auth().createUser({
        email: email,
        password: password,
        displayName: name,
        emailVerified: false
      });

      // Benutzer-Dokument in Firestore erstellen
      await admin.firestore().collection('users').doc(userRecord.uid).set({
        role: 'learner',
        name: name,
        email: email,
        className: className || null,
        teacherId: teacherId,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return {
        success: true,
        uid: userRecord.uid,
        email: email,
        password: password
      };
    } catch (error) {
      console.error('Error creating apprentice:', error);
      throw new functions.https.HttpsError('internal', error.message);
    }
  });

// Benutzer löschen
exports.deleteUser = functions
  .region('europe-west6')
  .https.onCall(async (data, context) => {
    // Nur Admins können Benutzer löschen
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Nicht authentifiziert');
    }

    const callerDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
    if (!callerDoc.exists || callerDoc.data().role !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Keine Berechtigung');
    }

    const { uid } = data;

    if (!uid) {
      throw new functions.https.HttpsError('invalid-argument', 'Benutzer-ID fehlt');
    }

    try {
      // Benutzer aus Firebase Auth löschen
      await admin.auth().deleteUser(uid);

      // Benutzer-Dokument aus Firestore löschen
      await admin.firestore().collection('users').doc(uid).delete();

      return { success: true };
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new functions.https.HttpsError('internal', error.message);
    }
  });
