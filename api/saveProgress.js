const admin = (() => {
  try {
    return require('firebase-admin');
  } catch (e) {
    console.error('firebase-admin not installed');
    throw e;
  }
})();

let initialized = false;
function initAdmin() {
  if (initialized) return;
  const svc = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!svc) throw new Error('FIREBASE_SERVICE_ACCOUNT env var is not set');
  const cred = JSON.parse(svc);
  admin.initializeApp({ credential: admin.credential.cert(cred) });
  initialized = true;
}

module.exports = async function (req, res) {
  // CORS headers - allow requests from the frontend. Adjust origin as needed for production.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    initAdmin();
  } catch (err) {
    console.error('admin init error', err);
    return res.status(500).json({ error: 'Server not configured' });
  }

  const authHeader = req.headers.authorization || req.headers.Authorization || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return res.status(401).json({ error: 'Missing Authorization header' });

  const idToken = match[1];
  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(idToken);
  } catch (err) {
    console.warn('verifyIdToken failed', err && err.message);
    return res.status(401).json({ error: 'Invalid ID token' });
  }

  const uid = decoded.uid;
  const progress = req.body;
  if (!progress || typeof progress !== 'object') return res.status(400).json({ error: 'Missing progress payload' });

  try {
    const db = admin.firestore();
    await db.collection('users').doc(uid).set({ progress, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('failed to write progress', err);
    return res.status(500).json({ error: 'Failed to save' });
  }
};