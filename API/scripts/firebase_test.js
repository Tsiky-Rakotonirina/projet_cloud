const admin = require('firebase-admin');
const path = require('path');

try {
  const serviceAccount = require(path.join(__dirname, '..', 'src', 'config', 'firebase-admin-sdk.json'));
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }

  const db = admin.firestore();
  db.collection('test_collection').add({ ok: true, ts: Date.now() })
    .then((docRef) => {
      console.log('FIREBASE_OK', docRef.id);
      process.exit(0);
    })
    .catch((err) => {
      console.error('FIREBASE_ERR', err.message || err);
      process.exit(2);
    });
} catch (err) {
  console.error('FIREBASE_ERR', err.message || err);
  process.exit(2);
}
