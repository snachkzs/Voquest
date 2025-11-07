import { auth } from '../api/config/firebaseConfig.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

  const NAVBAR_FALLBACK = `
  <header class="navbar">
    <div class="navbar-container">
      <a href="index.html" class="brand-link">
        <img src="../assets/logo.svg" alt="Voquest" class="brand-logo" />
        <span class="brand-text">Voquest</span>
      </a>

      <div class="nav-frame">
        <nav>
          <ul class="nav-list">
            <li><a class="nav-link" href="index.html">Home</a></li>
            <li><a class="nav-link" href="courses.html">Courses</a></li>
            <li><a class="nav-link" href="quizzes.html">Quiz</a></li>
            <li><a class="nav-link" href="profile.html">Profile</a></li>
          </ul>
        </nav>
      </div>
    </div>
  </header>
  `;

async function initNavbar() {
  const root = document.getElementById('nav-root');
  if (!root) return;

  const path = '../components/navbar.html';
  let html = null;

  try {
    const resp = await fetch(path, { cache: 'no-store' });
    if (resp && resp.ok) {
      html = await resp.text();
      console.info('Navbar loaded from:', path);
    } else {
      console.warn('Navbar partial not found at', path, '— using fallback.');
    }
  } catch (err) {
    console.warn('Failed to fetch navbar partial:', err, '— using fallback.');
  }

  if (!html) html = NAVBAR_FALLBACK;
  root.innerHTML = html;

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