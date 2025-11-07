import admin from 'firebase-admin';

let initialized = false;
function initAdmin() {
  if (initialized) return;
  const svc = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!svc) throw new Error('FIREBASE_SERVICE_ACCOUNT env var is not set');
  const cred = JSON.parse(svc);
  admin.initializeApp({ credential: admin.credential.cert(cred) });
  initialized = true;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    initAdmin();
  } catch (err) {
    console.error('admin init error', err);
    return res.status(500).json({ error: 'Server not configured' });
  }

  const authHeader = req.headers.authorization || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return res.status(401).json({ error: 'Missing Authorization header' });

  const idToken = match[1];
  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(idToken);
  } catch (err) {
    console.warn('verifyIdToken failed', err.message);
    return res.status(401).json({ error: 'Invalid ID token' });
  }

  const uid = decoded.uid;
  const progress = req.body;
  if (!progress || typeof progress !== 'object') {
    return res.status(400).json({ error: 'Missing progress payload' });
  }

  try {
    const db = admin.firestore();
    await db.collection('users').doc(uid).set({
      progress,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('failed to write progress', err);
    return res.status(500).json({ error: 'Failed to save' });
  }
}
