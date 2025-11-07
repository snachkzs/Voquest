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
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

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

  try {
    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return res.status(200).json({ progress: {}, message: 'No progress found' });
    }

    const userData = userDoc.data();
    const progress = userData.progress || {};
    
    return res.status(200).json({ 
      progress,
      updatedAt: userData.updatedAt || null
    });
  } catch (err) {
    console.error('failed to retrieve progress', err);
    return res.status(500).json({ error: 'Failed to retrieve progress' });
  }
};
