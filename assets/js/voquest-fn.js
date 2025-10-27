// Small helper to call the deployed saveProgress endpoint.
// Default to a relative Vercel API route so you can deploy the repo to Vercel as-is.
// If you prefer a different host, set `window.VOQUEST_FUNCTION_URL` before this script is loaded.
window.VOQUEST_FUNCTION_URL = window.VOQUEST_FUNCTION_URL || '/api/saveProgress';

window.voquestCallSaveProgress = async function(progress) {
  // If function URL not configured, try to fall back to direct Firestore client write
  if (!window.VOQUEST_FUNCTION_URL) {
    console.warn('VOQUEST_FUNCTION_URL not set — falling back to client-side save if available');
    if (window.voquestSaveProgress) return window.voquestSaveProgress(progress);
    throw new Error('No save function available');
  }

  // Obtain ID token from Firebase client SDK if available
  let idToken = null;
  try {
    if (window.firebase && firebase.auth) {
      const user = firebase.auth().currentUser;
      if (user) idToken = await user.getIdToken(true);
    } else if (window.getAuth) {
      // modular SDK: assume global auth instance stored on window.voquestAuthInstance
      if (window.voquestAuthInstance && window.voquestAuthInstance.currentUser) {
        idToken = await window.voquestAuthInstance.currentUser.getIdToken(true);
      }
    }
  } catch (e) {
    console.warn('Could not get ID token', e);
  }

  const headers = { 'Content-Type': 'application/json' };
  if (idToken) headers['Authorization'] = 'Bearer ' + idToken;

  const resp = await fetch(window.VOQUEST_FUNCTION_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(progress)
  });
  if (!resp.ok) throw new Error('Function responded with ' + resp.status);
  return resp.json();
};
