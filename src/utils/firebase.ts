import * as admin from 'firebase-admin';

function initializeFirebase() {
  if (!admin.apps.length) {
    // First-time initialization
    const serviceAccountJSON = Buffer.from(
      process.env.FCM_SERVICE_ACCOUNT_BASE64!,
      'base64'
    ).toString('utf8');

    const serviceAccount = JSON.parse(serviceAccountJSON);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log('🔥 Firebase Admin initialized');
  } else {
    // Reuse the existing app
    console.log('🔥 Firebase Admin already initialized — reusing instance');
  }
}

export { admin, initializeFirebase };