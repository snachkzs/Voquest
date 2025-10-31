
// Set default URL for saveProgress API endpoint
// After deploying to Vercel, update this to your Vercel URL:
// window.VOQUEST_FUNCTION_URL = 'https://your-project.vercel.app/api/saveProgress';
window.VOQUEST_FUNCTION_URL = window.VOQUEST_FUNCTION_URL || '/api/saveProgress';

window.voquestCallSaveProgress = async function(progress) {
  if (!window.VOQUEST_FUNCTION_URL) {
    console.warn('VOQUEST_FUNCTION_URL not set — falling back to client-side save if available');
    if (window.voquestSaveProgress) return window.voquestSaveProgress(progress);
    throw new Error('No save function available');
  }

  let idToken = null;
  try {
    // Support for Firebase Auth v9+ modular SDK (used in quiz.html)
    if (window.voquestAuthInstance && window.voquestAuthInstance.currentUser) {
      idToken = await window.voquestAuthInstance.currentUser.getIdToken(true);
    }
    // Fallback for older Firebase SDK
    else if (window.firebase && firebase.auth) {
      const user = firebase.auth().currentUser;
      if (user) idToken = await user.getIdToken(true);
    }
    // Additional fallback for getAuth import
    else if (window.getAuth) {
      const auth = window.getAuth();
      if (auth && auth.currentUser) {
        idToken = await auth.currentUser.getIdToken(true);
      }
    }
  } catch (e) {
    console.warn('Could not get ID token', e);
  }

  if (!idToken) {
    console.warn('No user authenticated - cannot save to server');
    throw new Error('User not authenticated');
  }

  const headers = { 'Content-Type': 'application/json' };
  if (idToken) headers['Authorization'] = 'Bearer ' + idToken;

  const resp = await fetch(window.VOQUEST_FUNCTION_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(progress)
  });
  
  if (!resp.ok) {
    const errorText = await resp.text();
    console.error('Function error:', errorText);
    throw new Error('Function responded with ' + resp.status);
  }
  
  return resp.json();
};
