const admin = (() => {
  try {
    return require('firebase-admin');
  } catch (e) {
    console.error('firebase-admin not found. Run: npm install firebase-admin');
    return null;
  }
})();

let initialized = false;
function initAdmin() {
  if (initialized) return;
  const svc = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!svc) throw new Error('FIREBASE_SERVICE_ACCOUNT env var is not set');
  const cred = JSON.parse(svc);
  admin.initializeApp({ 
    credential: admin.credential.cert(cred) 
  });
  initialized = true;
}

module.exports = async function (req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!admin) {
      return res.status(500).json({ error: 'Server not configured' });
    }
    initAdmin();
  } catch (err) {
    console.error('Firebase Admin init error:', err);
    return res.status(500).json({ error: 'Server not configured' });
  }

  const authHeader = req.headers.authorization || req.headers.Authorization || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  const idToken = match[1];
  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(idToken);
  } catch (err) {
    console.error('Token verification failed:', err);
    return res.status(401).json({ error: 'Invalid ID token' });
  }

  const uid = decoded.uid;

  const progressData = req.body;
  if (!progressData || typeof progressData !== 'object') {
    return res.status(400).json({ error: 'Missing progress payload' });
  }

  try {
    const db = admin.firestore();
    await db.collection('users').doc(uid).set({
      progress: progressData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Firestore save error:', err);
    return res.status(500).json({ error: 'Failed to save' });
  }
};