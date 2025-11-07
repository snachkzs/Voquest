window.VOQUEST_FUNCTION_URL = window.VOQUEST_FUNCTION_URL || '/api/saveProgress';
window.VOQUEST_GET_PROGRESS_URL = window.VOQUEST_GET_PROGRESS_URL || '/api/getProgress';

async function getAuthInstance() {
  if (window.voquestAuthInstance) return window.voquestAuthInstance;
  if (window.firebase && firebase.auth) return firebase.auth();
  
  try {
    const module = await import('../api/config/firebaseConfig.js');
    return module.auth;
  } catch (e) {
    console.warn('Could not load auth', e);
    return null;
  }
}

window.voquestCallSaveProgress = async function(progress) {
  if (!window.VOQUEST_FUNCTION_URL) {
    console.warn('VOQUEST_FUNCTION_URL not set — falling back to client-side save if available');
    if (window.voquestSaveProgress) return window.voquestSaveProgress(progress);
    throw new Error('No save function available');
  }

  let idToken = null;
  try {
    const authInstance = await getAuthInstance();
    if (authInstance && authInstance.currentUser) {
      idToken = await authInstance.currentUser.getIdToken(true);
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

window.voquestGetProgress = async function() {
  if (!window.VOQUEST_GET_PROGRESS_URL) {
    console.warn('VOQUEST_GET_PROGRESS_URL not set');
    throw new Error('No get progress function available');
  }

  let idToken = null;
  try {
    const authInstance = await getAuthInstance();
    if (authInstance && authInstance.currentUser) {
      idToken = await authInstance.currentUser.getIdToken(true);
    }
  } catch (e) {
    console.warn('Could not get ID token', e);
  }

  if (!idToken) {
    console.warn('No user authenticated - cannot get progress from server');
    throw new Error('User not authenticated');
  }

  const headers = { 'Authorization': 'Bearer ' + idToken };

  const resp = await fetch(window.VOQUEST_GET_PROGRESS_URL, {
    method: 'GET',
    headers
  });
  
  if (!resp.ok) {
    const errorText = await resp.text();
    console.error('Get progress error:', errorText);
    throw new Error('Function responded with ' + resp.status);
  }
  
  const data = await resp.json();
  return data.progress || {};
};
