// Démarrage de l'appli : branche les boutons et affiche la liste.
import { addItem, addMany, removeItem, undo, dismiss } from './actions.js';
import { typeahead } from './suggestions.js';
import { render } from './ui/render.js';
import { toast } from './ui/toast.js';
import { initSheets, openEdit } from './ui/sheets.js';
import { VERSION } from './version.js';
import { initWakeLock } from './wakelock.js';
import { usePack } from './packs.js';
import { setOnChange } from './cloud/sync.js';
import { $, esc } from './utils.js';

// ===== Champ « De quoi avez-vous besoin ? » + suggestions =====
const q = $('q'), sug = $('sug');
let sel = -1; // suggestion choisie au clavier (-1 = aucune)

function showSuggestions() {
  const out = typeahead(q.value);
  sel = -1;
  sug.innerHTML = out.map(o => `<li role="option" data-s="${esc(o)}">${esc(o)}</li>`).join('');
  sug.style.display = out.length ? 'block' : 'none';
}
function submitText(text) {
  addMany(text); // "lait, pain et œufs" → 3 tuiles
  q.value = '';
  sug.style.display = 'none';
}

$('f').addEventListener('submit', e => {
  e.preventDefault();
  submitText(sel >= 0 ? sug.children[sel].dataset.s : q.value);
  q.focus();
});
q.addEventListener('input', showSuggestions);
q.addEventListener('keydown', e => {
  const n = sug.children.length;
  if (!n || sug.style.display === 'none') return;
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + n + 1) % (n + 1) - 1;
    [...sug.children].forEach((li, i) => li.classList.toggle('on', i === sel));
  }
  if (e.key === 'Escape') sug.style.display = 'none';
});
sug.addEventListener('pointerdown', e => {
  const li = e.target.closest('li');
  if (!li) return;
  e.preventDefault();
  submitText(li.dataset.s);
});
q.addEventListener('blur', () => setTimeout(() => { sug.style.display = 'none'; }, 150));

// ===== Tuiles : toucher = acheté, appui long = modifier =====
const board = $('board');
let lp = null, lpFired = false;
const stopLongPress = () => { if (lp) { clearTimeout(lp.timer); lp = null; } };

board.addEventListener('pointerdown', e => {
  const t = e.target.closest('.tile');
  if (!t) return;
  lpFired = false;
  lp = {
    x: e.clientX, y: e.clientY,
    timer: setTimeout(() => {
      lpFired = true; lp = null;
      if (navigator.vibrate) navigator.vibrate(15);
      openEdit(t.dataset.id);
    }, 500)
  };
});
board.addEventListener('pointermove', e => {
  if (lp && Math.hypot(e.clientX - lp.x, e.clientY - lp.y) > 10) stopLongPress();
});
['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => board.addEventListener(ev, stopLongPress));
board.addEventListener('contextmenu', e => {
  const t = e.target.closest('.tile');
  if (!t) return;
  e.preventDefault();
  if (!lpFired) { stopLongPress(); lpFired = true; openEdit(t.dataset.id); }
});
board.addEventListener('click', e => {
  if (lpFired) { lpFired = false; return; }
  const del = e.target.closest('[data-del]');
  if (del) { removeItem(del.dataset.del, false); return; }
  const t = e.target.closest('.tile');
  if (!t) return;
  t.classList.add('gone');
  setTimeout(() => removeItem(t.dataset.id, true), 220);
});

// ===== Déjà achetés, suggestions, Annuler =====
$('recent').addEventListener('click', e => {
  const c = e.target.closest('[data-re]');
  if (c) addItem(c.dataset.re);
});
$('due').addEventListener('click', e => {
  const go = e.target.closest('[data-due]'), no = e.target.closest('[data-dis]');
  if (go) addItem(go.dataset.due);
  if (no) dismiss(no.dataset.dis);
});
$('undo').addEventListener('click', undo);
$('packs').addEventListener('click', e => {
  const b = e.target.closest('[data-pack]');
  if (b) usePack(b.dataset.pack);
});

// ===== Lancement =====
setOnChange(render); // liste partagée : réaffiche quand l'autre téléphone change quelque chose
initSheets();
initWakeLock();
render();

// Message après une mise à jour
try {
  const seen = localStorage.getItem('courses-version');
  if (seen && seen !== VERSION) toast(`Mise à jour installée : version ${VERSION}`);
  localStorage.setItem('courses-version', VERSION);
} catch (e) {}

// Mode hors ligne
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
