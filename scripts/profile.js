import { auth, db } from './config/firebaseConfig.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

function calculateTotalScore(progress) {
  if (!progress) return 0;
  let total = 0;
  Object.values(progress).forEach(courseData => {
    if (courseData?.score) total += courseData.score;
  });
  return total;
}

function calculateQuizzesTaken(progress) {
  if (!progress) return 0;
  let quizzes = 0;
  Object.values(progress).forEach(courseData => {
    if (courseData?.quizzesTaken) quizzes += courseData.quizzesTaken;
    else if (courseData?.score > 0) quizzes += 1;
  });
  return quizzes;
}

function calculateUserLevel(quizzesTaken) {
  return quizzesTaken;
}

async function loadProfile(user) {
  const els = {
    loading: document.getElementById('profileLoading'),
    error: document.getElementById('profileError'),
    content: document.getElementById('profileContent'),
    name: document.getElementById('profileName'),
    email: document.getElementById('profileEmail'),
    score: document.getElementById('totalScore'),
    level: document.getElementById('userLevel')
  };
  
  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.exists() ? userDoc.data() : {};
    
    if (els.name) els.name.textContent = userData.displayName || user.email.split('@')[0];
    if (els.email) els.email.textContent = user.email;
    
    const progress = userData.progress || {};
    const stats = {
    score: calculateTotalScore(progress),
    quizzes: calculateQuizzesTaken(progress)
    };
    
    const userLevel = calculateUserLevel(stats.quizzes);
    
    if (els.score) els.score.textContent = stats.score;
    if (els.level) els.level.textContent = userLevel;
    
    if (els.loading) {
      els.loading.style.display = 'none';
      els.loading.classList.add('hidden');
    }
    if (els.content) {
      els.content.style.display = 'block';
      els.content.classList.add('show');
      els.content.removeAttribute('style');
      els.content.style.display = 'block';
    }
    
  } catch (error) {
    console.error('Error loading profile:', error);
    if (els.loading) els.loading.style.display = 'none';
    if (els.error) {
      els.error.style.display = 'block';
      els.error.innerHTML = '<p>Error: ' + error.message + '</p>';
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('editNameModal');
  const editBtn = document.getElementById('editNameBtn');
  const closeBtn = document.getElementById('closeModal');
  const cancelBtn = document.getElementById('cancelBtn');
  const saveBtn = document.getElementById('saveNameBtn');
  const usernameInput = document.getElementById('newUsername');
  const errorMessage = document.getElementById('errorMessage');
  
  if (editBtn) {
    editBtn.addEventListener('click', () => {
      const currentName = document.getElementById('profileName').textContent;
      usernameInput.value = currentName;
      errorMessage.textContent = '';
      modal.classList.add('show');
      usernameInput.focus();
    });
  }
  
  function closeModal() {
    modal.classList.remove('show');
    usernameInput.value = '';
    errorMessage.textContent = '';
  }
  
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const newName = usernameInput.value.trim();
      
      if (!newName) {
        errorMessage.textContent = 'Username cannot be empty';
        return;
      }
      
      if (newName.length < 3) {
        errorMessage.textContent = 'Username must be at least 3 characters';
        return;
      }
      
      if (newName.length > 30) {
        errorMessage.textContent = 'Username must be less than 30 characters';
        return;
      }
      
      try {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';
        errorMessage.textContent = '';
        
        const user = auth.currentUser;
        if (!user) {
          throw new Error('Not logged in');
        }
        
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          displayName: newName
        });
        
        document.getElementById('profileName').textContent = newName;
        
        closeModal();
      } catch (error) {
        console.error('Error updating username:', error);
        errorMessage.textContent = 'Failed to update username. Please try again.';
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save';
      }
    });
  }
  
  const signOutBtn = document.getElementById('signOutBtn');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', async () => {
      try {
        await signOut(auth);
        window.location.href = 'index.html';
      } catch (error) {
        console.error('Sign out error:', error);
        alert('Failed to sign out');
      }
    });
  }
  
  onAuthStateChanged(auth, (user) => {
    
    const loading = document.getElementById('profileLoading');
    const error = document.getElementById('profileError');
    
    if (user) {
      loadProfile(user);
    } else {
      if (loading) loading.style.display = 'none';
      if (error) error.style.display = 'block';
    }
  });
});
