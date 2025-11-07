import { db, auth as firebaseAuth } from './config/firebaseConfig.js';
import {
  collection, getDocs, query, orderBy, doc as docRef, getDoc, setDoc
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

const listRoot = document.getElementById('quizzesList');
const yEl = document.getElementById('y');
if (yEl) yEl.textContent = new Date().getFullYear();

let userUid = null;
onAuthStateChanged(firebaseAuth, (u) => { userUid = u ? u.uid : null; });

function capitalize(s){ return String(s||'').charAt(0).toUpperCase() + String(s||'').slice(1); }
function escapeHtml(str){
  return String(str||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
}

export async function renderList(){
  if (!listRoot) return;
  listRoot.innerHTML = '<div class="loading">Loading quizzes…</div>';

  try {
    if (!db) throw new Error('Firestore "db" is not initialized. Check src/api/config/firebaseConfig.js exports.');

    const q = query(collection(db, 'quizCollections'), orderBy('order','asc'));
    const snap = await getDocs(q);

    const docs = [];
    snap.forEach(d => docs.push({ id: d.id, ...d.data() }));
    if (!docs.length) {
      listRoot.innerHTML = '<div class="loading">No quizzes available.</div>';
      return;
    }

    const levelMap = new Map();
    for (const doc of docs) {
      const id = String(doc.id || '');
      const match = id.match(/level(\d+)/i);
      const levelNum = match ? Number(match[1]) : (Number(doc.level) || 1);
      if (!levelMap.has(levelNum)) levelMap.set(levelNum, { level: levelNum, doc });
    }

    const levels = Array.from(levelMap.values()).sort((a,b)=> a.level - b.level);

    listRoot.innerHTML = '';
    for (const entry of levels) {
      const it = entry.doc;
      const levelNum = entry.level;
      const difficulty = it.difficulty || 'easy';
      const title = it.title || `Level ${levelNum}`;
      const prize = '100 XP';
      const total = Array.isArray(it.words) ? it.words.length : 0;

      const card = document.createElement('article');
      card.className = 'quiz-card';
      card.dataset.level = String(levelNum);
      card.dataset.total = String(total);

      card.innerHTML = `
        <div class="quiz-body">
          <h3 class="quiz-level">Level ${levelNum} - ${capitalize(difficulty)}</h3>

          <div class="quiz-meta-container">
            <div class="quiz-type">${escapeHtml(title)}</div>
            <div class="quiz-prize">${prize}</div>
          </div>

          <div class="quiz-progress-wrap">
            <div class="quiz-progress-bar"><i style="width:0%"></i></div>
            <div class="quiz-progress-text">0/${total} Correct</div>
          </div>
        </div>
      `;

      card.addEventListener('click', () => {
        const firstDoc = docs.find(d => {
          const m = String(d.id||'').match(/level(\d+)/i);
          return m ? Number(m[1]) === levelNum : Number(d.level) === levelNum;
        });
        const targetId = firstDoc ? firstDoc.id : it.id;
        location.href = `quiz.html?id=${encodeURIComponent(targetId)}`;
      });

      listRoot.appendChild(card);
    }

    if (userUid) {
      try {
        const uref = docRef(db, 'users', userUid);
        const usnap = await getDoc(uref);
        const udata = usnap.exists() ? usnap.data() : {};
        const prog = udata.progress || {};

        document.querySelectorAll('.quiz-card').forEach(card => {
          const lvl = Number(card.dataset.level || 0);
          const total = Number(card.dataset.total || 0);
          const key = `level${lvl}`;
          const entry = prog[key];
          if (entry) {
            const completedVal = typeof entry.bestCompleted !== 'undefined' ? Number(entry.bestCompleted) : Number(entry.completed || 0);
            const scoreVal = typeof entry.bestScore !== 'undefined' ? Number(entry.bestScore) : Number(entry.score || 0);
            const i = card.querySelector('.quiz-progress-bar > i');
            const txt = card.querySelector('.quiz-progress-text');
            const percent = total ? Math.round((completedVal / Math.max(1,total)) * 100) : 0;
            if (i) i.style.width = percent + '%';
            if (txt) txt.textContent = `${completedVal}/${total} Correct`;

            const xpEl = card.querySelector('.quiz-prize');
            if (xpEl) {
              xpEl.textContent = scoreVal ? `${scoreVal} XP` : xpEl.textContent;
              xpEl.title = `Highscore: ${scoreVal} XP`;
            }
          }
        });
      } catch (e) {
        console.warn('renderList: cannot load user progress', e);
      }
    }

    console.info(`Rendered ${levels.length} level cards from ${docs.length} quiz docs.`);
  } catch (err) {
    console.error('Error in renderList()', err);
    listRoot.innerHTML = `<div class="loading">Error loading quizzes. ${escapeHtml(err.message || String(err))}</div>`;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { if (document.getElementById('quizzesList')) renderList(); }, { once: true });
} else {
  if (document.getElementById('quizzesList')) renderList();
}

let quizData = [];
let currentQuestionIndex = 0;
let currentScore = 0;
let totalQuestions = 0;
let draggedItem = null;
let completedQuestions = 0;

export async function initQuizFromDocId(docId) {
  try {
    const container = document.querySelector('.quiz-area');
    if (!container) throw new Error('.quiz-area not found in DOM');

    container.innerHTML = `<div style="text-align:center;padding:40px"><h3>⏳ Loading quiz…</h3></div>`;

    const dref = docRef(db, 'quizCollections', docId);
    const snap = await getDoc(dref);
    if (!snap.exists()) {
      container.innerHTML = `<div style="text-align:center;padding:40px"><h3>Quiz not found</h3></div>`;
      return;
    }

    const docData = { id: snap.id, ...snap.data() };
    const idMatch = String(docData.id || '').match(/level(\d+)/i);
    const levelNum = idMatch ? Number(idMatch[1]) : (Number(docData.level) || null);

    let levelDocs = [ docData ];
    try {
      const allSnap = await getDocs(collection(db, 'quizCollections'));
      const all = [];
      allSnap.forEach(d => all.push({ id: d.id, ...d.data() }));

      if (levelNum !== null) {
        levelDocs = all.filter(d => {
          const m = String(d.id || '').match(/level(\d+)/i);
          if (m) return Number(m[1]) === levelNum;
          return Number(d.level) === levelNum;
        }).sort((a,b) => (Number(a.order) || 0) - (Number(b.order) || 0));
      }

      if (!levelDocs || !levelDocs.length) levelDocs = [ docData ];
    } catch (e) {
      levelDocs = [ docData ];
      console.warn('Could not fetch level docs, using single doc fallback', e);
    }

    quizData = levelDocs;
    totalQuestions = quizData.length;
    currentQuestionIndex = 0;
    currentScore = 0;
    completedQuestions = 0;

    const progressSub = document.querySelector('.progress-sub');
    if (progressSub) progressSub.style.display = 'none';

    const progressText = document.querySelector('.quiz-progress-text');
    if (progressText) progressText.textContent = `${completedQuestions}/${totalQuestions} Correct`;

    const progBarI = document.querySelector('.quiz-progress-bar > i');
    if (progBarI) progBarI.style.width = '0%';

    const progCaption = document.querySelector('.progress-caption');
    if (progCaption) progCaption.textContent = `Question ${currentQuestionIndex+1} of ${Math.max(1,totalQuestions)}`;

    renderQuizShell(container);
    loadQuestion(0);
  } catch (err) {
    console.error('initQuizFromDocId()', err);
    const container = document.querySelector('.quiz-area');
    if (container) container.innerHTML = `<div style="text-align:center;padding:40px;color:#F44">Error: ${escapeHtml(err.message)}</div>`;
  }
}

function renderQuizShell(container) {
  container.innerHTML = `
    <div class="quiz-header">
      <div class="quiz-controls">
      </div>
    </div>

    <div class="matching-game" id="matchingGame">
      <div class="word-column"></div>
      <div class="match-column"></div>

      <!-- moved inside matching-game so button visually sits within the card -->
      <div class="quiz-actions">
        <button class="quiz-actions-btn" id="checkBtn">Check Answer</button>
        <button class="quiz-actions-btn" id="nextBtn" style="display:none;">Next Question</button>
      </div>
    </div>

    <div id="feedback" class="feedback"></div>
  `;

  attachEventListeners();
}

function loadQuestion(index) {
  if (index >= quizData.length) { showFinalResults(); return; }
  currentQuestionIndex = index;
  const question = quizData[index];

  const taskList = document.querySelector('.task-list');
  if (taskList) {
    taskList.innerHTML = `
      <p>Question ${index + 1} of ${totalQuestions}</p>
      <p>Score: ${currentScore} XP</p>
      <p>Type: ${question.type || '—'}</p>
    `;
  }

  const wordColumn = document.querySelector('.word-column');
  const matchColumn = document.querySelector('.match-column');
  if (!wordColumn || !matchColumn) return;

  wordColumn.innerHTML = '';
  matchColumn.innerHTML = '';

  const words = Array.isArray(question.words) ? [...question.words] : [];
  const matchOptions = Array.isArray(question.words) ? [...question.words] : [];

  for (let i = words.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [words[i], words[j]] = [words[j], words[i]];
  }
  for (let i = matchOptions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [matchOptions[i], matchOptions[j]] = [matchOptions[j], matchOptions[i]];
  }

  words.forEach(item => {
    const wordEl = document.createElement('div');
    wordEl.className = 'word-item';
    wordEl.draggable = true;
    wordEl.setAttribute('data-word', item.match);
    wordEl.textContent = item.word;
    wordColumn.appendChild(wordEl);
  });

  matchOptions.forEach(item => {
    const dz = document.createElement('div');
    dz.className = 'drop-zone';
    dz.setAttribute('data-match', item.match);

    const emptyBox = document.createElement('div');
    emptyBox.className = 'empty-box';

    const span = document.createElement('span');
    span.className = 'match-text';
    span.textContent = item.text;

    dz.appendChild(emptyBox);
    dz.appendChild(span);
    matchColumn.appendChild(dz);
  });

  const fb = document.getElementById('feedback');
  if (fb) fb.innerHTML = '';
  const nb = document.getElementById('nextBtn');
  if (nb) nb.style.display = 'none';

  initializeDragAndDrop();
}

function showFinalResults() {
  const container = document.querySelector('.quiz-area');
  if (!container) return;
  container.innerHTML = `
    <article class="quiz-card" style="text-align:center;">
      <div class="quiz-body" style="align-items:center; width:100%;">
        <h3 class="quiz-level">Quiz Completed!</h3>

        <div class="quiz-meta-container" style="align-items:center; margin:12px 0 18px;">
          <div class="quiz-type" style="font-size:22px; font-weight:700;">Final Score: ${currentScore} XP</div>
          <div class="quiz-prize" style="font-size:16px; margin-top:8px;">You completed ${completedQuestions}/${totalQuestions} question(s)!</div>
        </div>

        <div class="quiz-actions" style="width:100%; max-width:720px; display:flex; gap:12px; justify-content:center; margin-top:8px;">
          <a href="quizzes.html" class="quiz-actions-btn teal" style="text-decoration:none; display:inline-block; line-height:22px;">Back to Quizzes</a>
        </div>
      </div>
    </article>
  `;

  const r = document.getElementById('restartBtn');
  if (r) r.addEventListener('click', () => initQuizFromDocId(quizData[0].id));
}

function initializeDragAndDrop() {
  const wordItems = document.querySelectorAll('.word-item');
  const dropZones = document.querySelectorAll('.drop-zone');

  wordItems.forEach(item => {
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragend', handleDragEnd);
  });

  dropZones.forEach(zone => {
    zone.addEventListener('dragover', handleDragOver);
    zone.addEventListener('dragenter', handleDragEnter);
    zone.addEventListener('dragleave', handleDragLeave);
    zone.addEventListener('drop', handleDrop);
  });
}

function handleDragStart(e) {
  draggedItem = this;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', this.outerHTML);
}
function handleDragEnd() { this.classList.remove('dragging'); draggedItem = null; }
function handleDragOver(e) { if (e.preventDefault) e.preventDefault(); e.dataTransfer.dropEffect = 'move'; return false; }
function handleDragEnter() { this.classList.add('drag-over'); }
function handleDragLeave() { this.classList.remove('drag-over'); }
function handleDrop(e) {
  if (e.stopPropagation) e.stopPropagation();
  this.classList.remove('drag-over');

  if (draggedItem) {
    const emptyBox = this.querySelector('.empty-box');
    if (emptyBox && !emptyBox.querySelector('.word-item')) {
      const cloned = draggedItem.cloneNode(true);
      cloned.draggable = false;
      cloned.classList.add('placed');
      emptyBox.appendChild(cloned);

      draggedItem.style.opacity = '0.3';
      draggedItem.draggable = false;
    }
  }
  return false;
}

function checkAnswers() {
  const dropZones = document.querySelectorAll('.drop-zone');
  let correct = 0;
  let total = dropZones.length;
  const incorrectItems = [];

  dropZones.forEach(zone => {
    const placed = zone.querySelector('.word-item.placed');
    const expected = zone.getAttribute('data-match');
    if (placed) {
      const wordData = placed.getAttribute('data-word');
      if (wordData === expected) {
        zone.classList.add('correct');
        correct++;
      } else {
        zone.classList.add('incorrect');
        incorrectItems.push({ placedWord: placed, zone, wordData });
      }
    }
  });

  const feedback = document.getElementById('feedback');
  if (!feedback) return;

  const progBarI = document.querySelector('.quiz-progress-bar > i');
  const progText = document.querySelector('.quiz-progress-text');

  if (correct === total && total > 0) {
    completedQuestions++;
    const points = 20;
    currentScore += points;
    const xpEl = document.querySelector('.xp-amount');
    if (xpEl) xpEl.textContent = currentScore + ' XP';

    const percent = Math.round((completedQuestions / Math.max(1, totalQuestions)) * 100);
    if (progBarI) progBarI.style.width = percent + '%';
    if (progText) progText.textContent = `${completedQuestions}/${totalQuestions} Correct`;
    feedback.innerHTML = `<div class="feedback-text success">🎉 Perfect! +${points} XP</div>`;

    const currDoc = quizData[currentQuestionIndex] || quizData[0];
    const levelNum = getLevelFromId(currDoc?.id || currDoc?.id);
    if (levelNum !== null) saveProgressForLevel(levelNum, completedQuestions, totalQuestions, currentScore);

    const nb = document.getElementById('nextBtn');
    if (nb) {
      nb.style.display = 'inline-block';
      nb.textContent = (currentQuestionIndex < quizData.length - 1) ? 'Next Question' : 'Finish Quiz';
    }
  } else {
    feedback.innerHTML = `<div class="feedback-text error">${correct}/${total} correct. Try again!</div>`;

    setTimeout(() => returnIncorrectItemsToOrigin(incorrectItems), 1200);
    if (progText) progText.textContent = `${completedQuestions}/${totalQuestions} Correct`;
  }
}

function nextQuestion() {
  resetQuiz();
  currentQuestionIndex++;
  if (currentQuestionIndex >= quizData.length) {
    showFinalResults();
  } else {
    loadQuestion(currentQuestionIndex);
    const progCaption = document.querySelector('.progress-caption');
    if (progCaption) progCaption.textContent = `Question ${currentQuestionIndex+1} of ${Math.max(1,totalQuestions)}`;
    const progText = document.querySelector('.quiz-progress-text');
    if (progText) progText.textContent = `${completedQuestions}/${totalQuestions} Correct`;
  }
}

function returnIncorrectItemsToOrigin(items) {
  items.forEach(item => {
    const { placedWord, zone, wordData } = item;
    const original = document.querySelector(`.word-column .word-item[data-word="${wordData}"]`);
    if (original && placedWord) {
      placedWord.classList.add('returning');
      setTimeout(() => {
        if (placedWord.parentNode) placedWord.parentNode.removeChild(placedWord);
        original.style.opacity = '1';
        original.draggable = true;
        original.classList.remove('placed');
        zone.classList.remove('incorrect');
      }, 300);
    }
  });
  setTimeout(() => {
    const fb = document.getElementById('feedback');
    if (fb) fb.innerHTML = '';
  }, 1800);
}

function resetQuiz() {
  document.querySelectorAll('.drop-zone').forEach(zone => {
    zone.classList.remove('correct','incorrect');
    const empty = zone.querySelector('.empty-box');
    const placed = empty?.querySelector('.word-item.placed');
    if (placed) placed.remove();
  });
  document.querySelectorAll('.word-column .word-item').forEach(item => {
    item.style.opacity = '1';
    item.draggable = true;
    item.classList.remove('placed','returning');
  });
  const fb = document.getElementById('feedback');
  if (fb) fb.innerHTML = '';
  const nb = document.getElementById('nextBtn');
  if (nb) nb.style.display = 'none';
}

function getLevelFromId(id){
  const m = String(id||'').match(/level(\d+)/i);
  return m ? Number(m[1]) : null;
}

// async function saveProgressForLevel(levelNum, completed, total, score){
//   if (!userUid) return;
//   try {
//     const uref = docRef(db, 'users', userUid);
//     const usnap = await getDoc(uref);
//     const udata = usnap.exists() ? usnap.data() : {};
//     const prog = udata.progress || {};
//     const prev = prog[`level${levelNum}`] || {};

//     const prevCompleted = Number(prev.bestCompleted ?? prev.completed ?? 0);
//     const prevScore = Number(prev.bestScore ?? prev.score ?? 0);

//     const bestCompleted = Math.max(prevCompleted, Number(completed || 0));
//     const bestScore = Math.max(prevScore, Number(score || 0));

//     const payload = {
//       progress: {
//         [`level${levelNum}`]: {
//           completed: Number(completed || 0),
//           total: Number(total || 0),
//           score: Number(score || 0),
//           bestCompleted,
//           bestScore,
//           updatedAt: new Date().toISOString()
//         }
//       }
//     };

//     const idToken = await firebaseAuth.currentUser.getIdToken();
//     await fetch('/api/saveProgress', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${idToken}`
//       },
//       body: JSON.stringify(payload.progress)
//     });
//   } catch (e) {
//     console.warn('saveProgressForLevel()', e);
//   }
// }


async function saveProgressForLevel(payload) {
  const user = firebaseAuth.currentUser;
  if (!user) {
    console.warn('No user logged in — skipping progress save.');
    return;
  }

  try {
    // ambil idToken dari user untuk otentikasi server-side
    const idToken = await user.getIdToken();

    // tampilkan indikator loading ringan (opsional)
    const saveStatusEl = document.querySelector('#save-status');
    if (saveStatusEl) saveStatusEl.textContent = 'Saving...';

    // kirim data ke API server-side
    const API_BASE = 'https://voquestpawm-git-test-server-snachkzs-projects.vercel.app';
    await fetch(`${API_BASE}/api/saveProgress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Server error: ${res.status} - ${errText}`);
    }

    const data = await res.json();
    console.log('✅ Progress saved via server:', data);

    if (saveStatusEl) {
      saveStatusEl.textContent = 'Progress saved ✔️';
      setTimeout(() => (saveStatusEl.textContent = ''), 2000);
    }

  } catch (err) {
    console.error('❌ Failed to save progress:', err);
    const saveStatusEl = document.querySelector('#save-status');
    if (saveStatusEl) {
      saveStatusEl.textContent = 'Failed to save progress ⚠️';
      saveStatusEl.style.color = 'red';
      setTimeout(() => {
        saveStatusEl.textContent = '';
        saveStatusEl.style.color = '';
      }, 3000);
    }
  }
}

function attachEventListeners() {
  const checkBtn = document.getElementById('checkBtn');
  const nextBtn = document.getElementById('nextBtn');

  if (checkBtn) checkBtn.addEventListener('click', checkAnswers);
  if (nextBtn) nextBtn.addEventListener('click', nextQuestion);
}