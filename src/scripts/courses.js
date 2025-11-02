// TO DO: benerin courses
document.getElementById('y')?.textContent = new Date().getFullYear();

const courseData = {
  'everyday-basics': {
    title: 'Everyday Basics',
    vocabulary: [
      { word: 'Acquaintance', phonetic: '/əˈkweɪntəns/', meaning: 'A person you know slightly, but not very well', example: 'She is just an acquaintance, not a close friend.', usage: 'Formal contexts when distinguishing relationship levels' },
      { word: 'Dwelling', phonetic: '/ˈdwelɪŋ/', meaning: 'A place where someone lives; residence', example: 'The ancient dwelling was carved into the mountainside.', usage: 'More formal than "house" or "home", often literary' },
      { word: 'Commence', phonetic: '/kəˈmens/', meaning: 'To begin or start something formally', example: 'The ceremony will commence at precisely 3 PM.', usage: 'Formal situations, ceremonies, official events' },
      { word: 'Vicinity', phonetic: '/vɪˈsɪnɪti/', meaning: 'The area near or surrounding a particular place', example: 'There are several restaurants in the vicinity of the hotel.', usage: 'More precise than "nearby" or "around here"' },
      { word: 'Habitual', phonetic: '/həˈbɪtʃuəl/', meaning: 'Done regularly as a habit; customary', example: 'His habitual morning routine includes meditation and exercise.', usage: 'Describing regular patterns of behavior' },
      { word: 'Sustenance', phonetic: '/ˈsʌstənəns/', meaning: 'Food and drink regarded as a source of strength', example: 'The hikers packed enough sustenance for a week-long journey.', usage: 'More formal than "food", often implies basic nutrition' }
    ],
    docs: `<strong>Advanced Everyday Vocabulary Usage:</strong><br><br>
      These sophisticated terms elevate your daily English beyond basic communication.<br><br>
      <em>Key tip:</em> These words are particularly effective in academic writing, formal presentations, and professional correspondence where precision and sophistication are valued.`
  },
  'food-flavors': {
    title: 'Food & Flavors',
    vocabulary: [
      { word: 'Palatable', phonetic: '/ˈpælətəbəl/', meaning: 'Pleasant to taste; acceptable or agreeable', example: 'The chef managed to make healthy vegetables quite palatable.', usage: 'Often used when something is made acceptable despite potential issues' },
      { word: 'Umami', phonetic: '/uˈmɑmi/', meaning: 'A savory taste, one of the five basic tastes', example: 'The mushrooms add a rich umami flavor to the broth.', usage: 'Culinary contexts, describing savory depth in food' },
      { word: 'Piquant', phonetic: '/ˈpiːkənt/', meaning: 'Having a pleasantly sharp or spicy flavor', example: 'The piquant sauce complemented the mild fish perfectly.', usage: 'Sophisticated culinary descriptions, wine tasting' },
      { word: 'Delectable', phonetic: '/dɪˈlektəbəl/', meaning: 'Extremely delicious and appealing', example: 'The pastry chef created a delectable chocolate soufflé.', usage: 'High-end restaurant menus, gourmet food writing' },
      { word: 'Aromatic', phonetic: '/ærəˈmætɪk/', meaning: 'Having a pleasant, distinctive smell', example: 'The aromatic herbs filled the kitchen with fragrance.', usage: 'Wine descriptions, perfume, culinary arts' },
      { word: 'Succulent', phonetic: '/ˈsʌkjələnt/', meaning: 'Tender, juicy, and tasty', example: 'The succulent roast beef melted in their mouths.', usage: 'Fine dining descriptions, food reviews' }
    ],
    docs: `<strong>Culinary Vocabulary:</strong><br><br>
      Master these sophisticated food terms to describe culinary experiences with precision.<br><br>
      <em>Key tip:</em> Essential vocabulary for food critics, restaurant reviews or culinary professionals. These terms show sophisticated palate understanding and elevate food discourse.`
  },
};

const modal = document.getElementById('courseModal');
const modalTitle = document.getElementById('modalTitle');
const vocabList = document.getElementById('vocabList');
const docsList = document.getElementById('docsList');
const closeBtn = document.querySelector('.close');
const closeModalBtn = document.getElementById('closeModalBtn');

document.querySelectorAll('.course-card').forEach(card => {
  card.addEventListener('click', function() {
    const courseId = this.getAttribute('data-course');
    openModal(courseId);
  });
});

function openModal(courseId) {
  const course = courseData[courseId];
  if (!course) return;

  modalTitle.textContent = course.title;

  vocabList.innerHTML = '';
  course.vocabulary.forEach(item => {
    const vocabItem = document.createElement('div');
    vocabItem.className = 'vocab-item';
    vocabItem.innerHTML = `
      <div class="vocab-word">
        ${item.word}
        <span class="phonetic">${item.phonetic}</span>
      </div>
      <div class="vocab-meaning">${item.meaning}</div>
      <div class="vocab-example">"${item.example}"</div>
      <div class="vocab-usage"><strong>Usage:</strong> ${item.usage}</div>
    `;
    vocabList.appendChild(vocabItem);
  });

  docsList.innerHTML = `<div class="docs-text">${course.docs}</div>`;

  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modal.style.display = 'none';
  document.body.style.overflow = 'auto';
}

closeBtn?.addEventListener('click', closeModal);
closeModalBtn?.addEventListener('click', closeModal);

window.addEventListener('click', function(event) {
  if (event.target === modal) closeModal();
});

document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape' && modal.style.display === 'block') closeModal();
});