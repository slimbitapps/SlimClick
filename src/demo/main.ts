/**
 * Eingebaute Testfolien: Damit kann man SlimClick ausprobieren, ohne PowerPoint zu öffnen.
 * Reagiert auf die gleichen Tasten wie echte Präsentationsprogramme.
 */
import './demo.css';

// Sprache wie die App (kommt als ?lang=…), sonst wie der Computer
const de = (new URLSearchParams(location.search).get('lang') || navigator.language || '').startsWith('de');
const T = de
  ? {
      slides: [
        ['Willkommen zum Test 👋', 'Drücke auf dem Handy „Weiter“.'],
        ['Es klappt!', 'Probier jetzt „Zurück“ – und dann wieder „Weiter“.'],
        ['Laserpointer', 'Tippe am Handy auf „Laser“ und zeige auf diesen Kreis.'],
        ['Spotlight', 'Mit „Spotlight“ hebst du eine Stelle hervor – der Rest wird dunkel.'],
        ['Gehe zu', 'Über „Gehe zu“ springst du direkt zu einer Folie, z. B. 1.'],
        ['Fertig 🎉', 'Öffne jetzt deine echte Präsentation und starte sie.'],
      ],
      hint: 'Testfolien · F = Vollbild · Esc = beenden',
      black: 'Bildschirm schwarz – nochmal „Schwarz“ drücken',
    }
  : {
      slides: [
        ['Welcome to the test 👋', 'Press “Next” on your phone.'],
        ['It works!', 'Now try “Back” – and then “Next” again.'],
        ['Laser pointer', 'Tap “Laser” on your phone and point at this circle.'],
        ['Spotlight', '“Spotlight” highlights one spot – everything else goes dark.'],
        ['Go to', 'With “Go to” you jump straight to a slide, e.g. 1.'],
        ['Done 🎉', 'Now open your real presentation and start it.'],
      ],
      hint: 'Test slides · F = full screen · Esc = exit',
      black: 'Screen black – press “Black” again',
    };

const COLORS = ['#ff7a59', '#5b7cfa', '#ff3d77', '#8b5cf6', '#22b8a7', '#f6b03c'];
const deck = document.getElementById('deck')!;
let i = 0;
let blank: '' | 'black' | 'white' = '';
let typed = '';

function render() {
  const [title, text] = T.slides[i];
  deck.innerHTML = `
    <div class="slide" style="--c:${COLORS[i]}" data-testid="demo-slide" data-index="${i + 1}">
      <div class="num">${i + 1} / ${T.slides.length}</div>
      <h1>${title}</h1>
      <p>${text}</p>
      ${i === 2 ? '<div class="target"></div>' : ''}
      <div class="hint">${T.hint}</div>
    </div>
    <div class="blank ${blank}" ${blank ? '' : 'hidden'}>${blank === 'black' ? `<span>${T.black}</span>` : ''}</div>`;
  document.title = `SlimClick – ${i + 1}/${T.slides.length}`;
}

function go(n: number) {
  i = Math.min(T.slides.length - 1, Math.max(0, n));
  blank = '';
  render();
}

addEventListener('keydown', (e) => {
  const k = e.key;
  if (/^\d$/.test(k)) {
    typed += k;
    return;
  }
  if (k === 'Enter' && typed) {
    go(Number(typed) - 1);
    typed = '';
    return;
  }
  typed = '';
  if (k === 'ArrowRight' || k === 'PageDown' || k === ' ' || k === 'ArrowDown') go(i + 1);
  else if (k === 'ArrowLeft' || k === 'PageUp' || k === 'ArrowUp' || k === 'Backspace') go(i - 1);
  else if (k === 'Home') go(0);
  else if (k === 'End') go(T.slides.length - 1);
  else if (k === 'b' || k === 'B' || k === '.') {
    blank = blank === 'black' ? '' : 'black';
    render();
  } else if (k === 'w' || k === 'W' || k === ',') {
    blank = blank === 'white' ? '' : 'white';
    render();
  } else if (k === 'f' || k === 'F' || k === 'F5') document.documentElement.requestFullscreen?.().catch(() => {});
  else if (k === 'Escape' && document.fullscreenElement) document.exitFullscreen();
});

render();
