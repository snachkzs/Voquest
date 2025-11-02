import { auth } from '../api/config/firebaseConfig.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

async function initNavbar() {
  const root = document.getElementById('nav-root');
  if (!root) return;

  try {
    const resp = await fetch('../components/navbar.html');
    if (!resp.ok) {
      console.error('Failed to load navbar partial:', resp.status);
      return;
    }
    root.innerHTML = await resp.text();
  } catch (err) {
    console.error('Failed to fetch navbar partial:', err);
    return;
  }

  const navUl = root.querySelector('nav ul');
  if (!navUl) return;
  
  const fullNavHTML = navUl.innerHTML.trim();
  const minimalNavHTML = `
    <li><a class="nav-link" href="index.html">Home</a></li>
    <li><a class="btn-small" href="authentication.html">Sign In</a></li>
    <li><a class="btn-small" href="authentication.html?signup=1">Sign Up</a></li>
  `;

  function setActive() {
    const current = location.pathname.split('/').pop() || 'index.html';
    navUl.querySelectorAll('.nav-link').forEach(a => a.classList.remove('active'));
    const match = Array.from(navUl.querySelectorAll('.nav-link')).find(a => a.getAttribute('href') === current);
    if (match) match.classList.add('active');
  }

  function renderForUser(user) {
    if (user) {
      navUl.innerHTML = fullNavHTML;
      const li = document.createElement('li');
      li.className = 'auth-item';
      const btn = document.createElement('a');
      btn.href = '#';
      btn.className = 'btn-small';
      btn.textContent = 'Sign Out';
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
          await signOut(auth);
          location.href = 'index.html';
        } catch (err) {
          console.error('Logout failed', err);
        }
      });
      navUl.appendChild(li);
      li.appendChild(btn);
    } else {
      navUl.innerHTML = minimalNavHTML;
    }

    setActive();
  }

  setActive();

  onAuthStateChanged(auth, (user) => renderForUser(user));
}

document.addEventListener('DOMContentLoaded', initNavbar);