import { signUp, login, onAuthStateChangedListener, logout, getProfile } from '../lib/auth.js';

const authForm = document.getElementById('authForm');
const submitBtn = document.getElementById('submitBtn');
const toggleLink = document.getElementById('toggle-link');
const bottomText = document.getElementById('bottom-text');
const authTitle = document.getElementById('auth-title');

const usernameRow = document.getElementById('username-row');
const confirmRow = document.getElementById('confirm-row');

let mode = 'signin';

function showSignIn() {
  mode = 'signin';
  usernameRow?.classList.add('hidden');
  confirmRow?.classList.add('hidden');
  submitBtn && (submitBtn.textContent = 'Sign In');
  authTitle && (authTitle.textContent = 'Sign In');
  bottomText && (bottomText.textContent = "Don't have an account?");
  toggleLink && (toggleLink.textContent = 'Sign up');
  document.getElementById('email')?.focus();
}

function showSignUp() {
  mode = 'signup';
  usernameRow?.classList.remove('hidden');
  confirmRow?.classList.remove('hidden');
  submitBtn && (submitBtn.textContent = 'Sign Up');
  authTitle && (authTitle.textContent = 'Sign Up');
  bottomText && (bottomText.textContent = "Already have an account?");
  toggleLink && (toggleLink.textContent = 'Sign in');
  document.getElementById('email')?.focus();
}

toggleLink?.addEventListener('click', (e) => {
  e.preventDefault();
  if (mode === 'signin') showSignUp(); else showSignIn();
});

// form submit
authForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email')?.value.trim() || '';
  const password = document.getElementById('password')?.value || '';
  if (mode === 'signin') {
    if (!email || !password) { alert('Please fill email and password'); return; }
    try {
      await login(email, password);
      window.location.href = 'index.html';
    } catch (err) {
      console.error(err);
      alert(err?.message || 'Login failed');
    }
  } else {
    const username = document.getElementById('username')?.value.trim() || '';
    const password2 = document.getElementById('password2')?.value || '';
    if (!email || !username || !password || !password2) { alert('Please fill all fields'); return; }
    if (password !== password2) { alert('Passwords do not match'); return; }
    try {
      await signUp(email, password, username);
      window.location.href = 'index.html';
    } catch (err) {
      console.error(err);
      alert(err?.message || 'Sign up failed');
    }
  }
});

showSignIn();

onAuthStateChangedListener(async (user) => {
  if (user) {
    console.log('User signed in:', user.uid);
    try { const profile = await getProfile(user.uid); if (profile) console.log('Profile:', profile); } catch(e){}
  }
});

window.voquestAuth = {
  logout: async () => { try { await logout(); window.location.href = 'index.html'; } catch(e){console.error(e);} }
};