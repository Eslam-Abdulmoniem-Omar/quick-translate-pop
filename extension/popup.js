// TransLingual Popup Settings Script

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'he', name: 'Hebrew', flag: '🇮🇱' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
  { code: 'pl', name: 'Polish', flag: '🇵🇱' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
  { code: 'sv', name: 'Swedish', flag: '🇸🇪' },
  { code: 'da', name: 'Danish', flag: '🇩🇰' },
  { code: 'no', name: 'Norwegian', flag: '🇳🇴' },
  { code: 'fi', name: 'Finnish', flag: '🇫🇮' },
  { code: 'uk', name: 'Ukrainian', flag: '🇺🇦' },
  { code: 'cs', name: 'Czech', flag: '🇨🇿' },
  { code: 'el', name: 'Greek', flag: '🇬🇷' },
  { code: 'th', name: 'Thai', flag: '🇹🇭' },
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
  { code: 'id', name: 'Indonesian', flag: '🇮🇩' }
];

const sourceSelect = document.getElementById('source-lang');
const targetSelect = document.getElementById('target-lang');
const swapBtn = document.getElementById('swap-btn');

// Populate language options
function populateLanguages() {
  const options = LANGUAGES.map(lang => 
    `<option value="${lang.code}">${lang.flag} ${lang.name}</option>`
  ).join('');
  
  sourceSelect.innerHTML = options;
  targetSelect.innerHTML = options;
}

// Load saved settings
async function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['translingual-source-lang', 'translingual-target-lang'], (result) => {
      sourceSelect.value = result['translingual-source-lang'] || 'en';
      targetSelect.value = result['translingual-target-lang'] || 'ar';
      resolve();
    });
  });
}

// Save settings
function saveSettings() {
  chrome.storage.sync.set({
    'translingual-source-lang': sourceSelect.value,
    'translingual-target-lang': targetSelect.value
  });
}

// Swap languages
function swapLanguages() {
  const temp = sourceSelect.value;
  sourceSelect.value = targetSelect.value;
  targetSelect.value = temp;
  saveSettings();
}

// Initialize
populateLanguages();
loadSettings();

// Event listeners
sourceSelect.addEventListener('change', saveSettings);
targetSelect.addEventListener('change', saveSettings);
swapBtn.addEventListener('click', swapLanguages);
