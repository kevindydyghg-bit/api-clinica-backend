const btnReadPage = document.getElementById('btnReadPage');
const btnReadSelection = document.getElementById('btnReadSelection');
const btnStop = document.getElementById('btnStop');
const rateSlider = document.getElementById('rateSlider');
const rateValue = document.getElementById('rateValue');
const readingStatus = document.getElementById('readingStatus');
const mainContent = document.getElementById('mainContent');

let isSpeaking = false;
let currentUtterance = null;

rateSlider.addEventListener('input', () => {
  rateValue.textContent = rateSlider.value + 'x';
});

function startReading(text, modeLabel) {
  if (!text || !text.trim()) {
    alert('No hay texto para leer.');
    return;
  }

  if (isSpeaking) {
    window.speechSynthesis.cancel();
    isSpeaking = false;
  }

  currentUtterance = new SpeechSynthesisUtterance(text.trim());
  currentUtterance.lang = 'es-MX';
  currentUtterance.rate = parseFloat(rateSlider.value);
  currentUtterance.pitch = 1;

  currentUtterance.onstart = () => {
    isSpeaking = true;
    btnReadPage.disabled = true;
    btnReadSelection.disabled = true;
    readingStatus.textContent = 'Estado: leyendo ' + modeLabel + '...';
  };

  currentUtterance.onend = () => {
    isSpeaking = false;
    btnReadPage.disabled = false;
    btnReadSelection.disabled = false;
    readingStatus.textContent = 'Estado: en espera';
  };

  currentUtterance.onerror = () => {
    isSpeaking = false;
    btnReadPage.disabled = false;
    btnReadSelection.disabled = false;
    readingStatus.textContent = 'Estado: ocurrió un error al leer';
  };

  window.speechSynthesis.speak(currentUtterance);
}

btnReadPage.addEventListener('click', () => {
  const text = mainContent.innerText;
  startReading(text, 'la página');
});

btnReadSelection.addEventListener('click', () => {
  const selection = window.getSelection().toString();
  if (!selection.trim()) {
    alert('Selecciona primero el texto que quieres que se lea.');
    return;
  }
  startReading(selection, 'la selección');
});

btnStop.addEventListener('click', () => {
  if (isSpeaking) {
    window.speechSynthesis.cancel();
    isSpeaking = false;
  }
  btnReadPage.disabled = false;
  btnReadSelection.disabled = false;
  readingStatus.textContent = 'Estado: lectura detenida';
});

window.addEventListener('beforeunload', () => {
  window.speechSynthesis.cancel();
});
