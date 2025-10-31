const functions = require('firebase-functions');
const admin = require('firebase-admin');

try {
  admin.initializeApp();
} catch(e) {
}

const db = admin.firestore();

exports.saveProgress = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  try {
    const authHeader = req.get('Authorization') || '';
    const match = authHeader.match(/^Bearer (.+)$/);
    if (!match) return res.status(401).json({ error: 'Missing or invalid Authorization header' });

    const idToken = match[1];
    const decoded = await admin.auth().verifyIdToken(idToken);
    const uid = decoded.uid;

    const payload = req.body || {};
    if (!payload || typeof payload !== 'object') return res.status(400).json({ error: 'Invalid payload' });

    const docRef = db.collection('users').doc(uid);
    await docRef.set({ progress: payload, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });

    return res.json({ success: true });
  } catch (err) {
    console.error('saveProgress error', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});
