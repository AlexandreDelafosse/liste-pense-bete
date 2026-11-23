// ===== Version de l'appli =====
// À chaque mise à jour : ajoutez une ligne EN HAUT de cette liste,
// et changez aussi le numéro dans sw.js (const CACHE = 'courses-v…').
const VERSIONS = [
  { v: '2.1', date: '23/11/2026', notes: ['Numéro de version et nouveautés dans les réglages'] },
  { v: '2.0', date: '23/11/2026', notes: ['« Il vous faut peut-être » : rappel des achats réguliers', 'Appui long sur une tuile : précision et changement de rayon', 'Ordre des rayons selon votre magasin', 'Sauvegarde : export et import'] },
  { v: '1.0', date: '23/11/2026', notes: ['Première version : tuiles, rayons automatiques, déjà achetés'] }
];
const VERSION = VERSIONS[0].v;

// ===== Rayons : nom, couleur, mots-clés pour ranger automatiquement =====
const AISLES = [
  { k: 'fl', n: 'Fruits & légumes', c: '#9fd68b', w: 'pomme poire banane orange citron fraise raisin kiwi tomate salade carotte oignon ail courgette poivron concombre patate avocat champignon poireau brocoli épinard haricot fruit légume persil basilic échalote melon pêche abricot clémentine mandarine chou' },
  { k: 'fr', n: 'Frais & crèmerie', c: '#bfe0f5', w: 'lait beurre yaourt fromage oeuf œuf crème jambon lardon emmental mozzarella comté parmesan feta skyr compote' },
  { k: 'vp', n: 'Viande & poisson', c: '#f6b3a6', w: 'poulet boeuf bœuf steak viande porc saucisse saumon thon poisson crevette dinde escalope haché merguez cabillaud' },
  { k: 'bo', n: 'Boulangerie', c: '#f4cf8e', w: 'pain baguette brioche croissant biscotte' },
  { k: 'ep', n: 'Épicerie', c: '#f7e17e', w: 'pâtes riz farine sucre sel poivre huile vinaigre café thé céréales chocolat confiture miel sauce ketchup moutarde mayonnaise conserve lentille semoule biscuit gâteau épice levure bouillon nutella' },
  { k: 'bs', n: 'Boissons', c: '#c9c2f2', w: 'eau jus vin bière soda coca sirop' },
  { k: 'su', n: 'Surgelés', c: '#a9e6e0', w: 'surgelé glace frites pizza' },
  { k: 'ma', n: 'Maison & hygiène', c: '#f3bfe0', w: 'pq papier toilette sopalin essuie-tout lessive vaisselle éponge savon gel douche shampoing dentifrice brosse poubelle couche lingette mouchoir déodorant javel nettoyant pile ampoule' },
  { k: 'au', n: 'Autres', c: '#e3dad3', w: '' }
];
const DAY = 86400000;

// ===== Petits outils =====
const $ = id => document.getElementById(id);
const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const aisle = k => AISLES.find(a => a.k === k) || AISLES[AISLES.length - 1];
const clone = o => JSON.parse(JSON.stringify(o));

// Devine le rayon : d'abord vos corrections, puis les mots-clés
function guess(name) {
  const k = norm(name);
  if (S.custom[k]) return S.custom[k];
  const words = k.split(/[\s'-]+/);
  for (const a of AISLES) {
    for (const w of a.w.split(' ')) {
      const ww = norm(w);
      if (ww && words.some(x => x === ww || x === ww + 's' || x === ww + 'x')) return a.k;
    }
  }
  return 'au';
}

// ===== Données : enregistrées dans le téléphone =====
// items: la liste | history: déjà achetés | log: dates d'achat par article
// custom: rayons corrigés | order: ordre des rayons | dismissed: suggestions ignorées
const KEY = 'courses-v1';
function fix(d) {
  d = d && typeof d === 'object' ? d : {};
  const order = Array.isArray(d.order) ? d.order.filter(k => AISLES.some(a => a.k === k)) : [];
  for (const a of AISLES) if (!order.includes(a.k)) order.push(a.k);
  return {
    items: Array.isArray(d.items) ? d.items : [],
    history: Array.isArray(d.history) ? d.history : [],
    log: d.log && typeof d.log === 'object' ? d.log : {},
    custom: d.custom && typeof d.custom === 'object' ? d.custom : {},
    dismissed: d.dismissed && typeof d.dismissed === 'object' ? d.dismissed : {},
    order
  };
}
let S;
try { S = fix(JSON.parse(localStorage.getItem(KEY))); } catch (e) { S = fix(null); }

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
  render();
}

// ===== Achats réguliers : qu'est-ce qui devrait bientôt manquer ? =====
function dueList() {
  const now = Date.now();
  const onList = new Set(S.items.map(i => norm(i.n)));
  const out = [];
  for (const [k, ts] of Object.entries(S.log)) {
    if (ts.length < 3 || onList.has(k)) continue;            // il faut au moins 3 achats pour connaître le rythme
    const gaps = ts.slice(1).map((t, i) => t - ts[i]).sort((a, b) => a - b);
    const rythme = gaps[Math.floor(gaps.length / 2)];         // écart habituel (médiane)
    if (rythme < DAY) continue;
    const dernier = ts[ts.length - 1];
    const depuis = Math.max(dernier, S.dismissed[k] || 0);
    if (now - depuis >= rythme * 0.9) {
      const h = S.history.find(x => norm(x.n) === k);
      if (h) out.push({ n: h.n, a: h.a, retard: (now - dernier) / rythme });
    }
  }
  return out.sort((a, b) => b.retard - a.retard).slice(0, 8);
}

// ===== Affichage =====
function ordered() { return S.order.map(aisle); }

function render() {
  // Il vous faut peut-être
  const due = dueList();
  $('dueBox').style.display = due.length ? '' : 'none';
  $('due').innerHTML = due.map(d =>
    `<span class="dchip"><button class="go" data-due="${esc(d.n)}">${esc(d.n)}</button><button class="no" data-dis="${esc(d.n)}" aria-label="Ignorer ${esc(d.n)} pour cette fois">×</button></span>`).join('');

  // La liste
  const board = $('board');
  if (!S.items.length) {
    board.innerHTML = '<div class="empty"><strong>Rien à racheter pour l’instant</strong>Notez ici ce qui manque dès que vous vous en rendez compte.</div>';
  } else {
    board.innerHTML = ordered().map(a => {
      const its = S.items.filter(i => i.a === a.k);
      if (!its.length) return '';
      return `<section class="aisle" style="--c:${a.c}">
        <h2><i></i>${a.n}</h2>
        <div class="grid">${its.map(i => `
          <div class="cell">
            <button class="tile" data-id="${i.id}" aria-label="${esc(i.n)} : marquer comme acheté">
              <b>${esc(i.n.charAt(0).toUpperCase())}</b>
              <span>${esc(i.n)}${i.note ? `<small>${esc(i.note)}</small>` : ''}</span>
            </button>
            <button class="x" data-del="${i.id}" aria-label="Retirer ${esc(i.n)}">×</button>
          </div>`).join('')}
        </div></section>`;
    }).join('');
  }
  $('hint').style.display = S.items.length && S.history.length < 6 ? '' : 'none';

  // Déjà achetés
  const onList = new Set(S.items.map(i => norm(i.n)));
  const rec = S.history.filter(h => !onList.has(norm(h.n))).slice(0, 24);
  $('recentBox').style.display = rec.length ? '' : 'none';
  $('recent').innerHTML = rec.map(h =>
    `<button class="chip" style="--c:${aisle(h.a).c}" data-re="${esc(h.n)}"><i></i>${esc(h.n)}</button>`).join('');

  const n = S.items.length;
  $('count').textContent = n ? `${n} article${n > 1 ? 's' : ''} sur la liste` : 'Votre liste est vide';
}

// ===== Actions =====
function addItem(raw) {
  const n = cap(raw.trim().replace(/\s+/g, ' '));
  if (!n) return;
  if (S.items.some(i => norm(i.n) === norm(n))) { toast(`« ${n} » est déjà sur la liste`); return; }
  const prev = S.history.find(h => norm(h.n) === norm(n));
  S.items.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), n, a: S.custom[norm(n)] || (prev ? prev.a : guess(n)), note: '' });
  save();
}

let last = null;
function remove(id, bought) {
  const i = S.items.findIndex(x => x.id === id);
  if (i < 0) return;
  const it = S.items[i];
  last = { it, i, hist: clone(S.history), log: clone(S.log) };
  S.items.splice(i, 1);
  if (bought) {
    const k = norm(it.n);
    S.history = [{ n: it.n, a: it.a }].concat(S.history.filter(h => norm(h.n) !== k)).slice(0, 80);
    const ts = S.log[k] || [];
    const now = Date.now();
    if (ts.length && now - ts[ts.length - 1] < DAY / 2) ts[ts.length - 1] = now; // même journée : un seul achat
    else ts.push(now);
    S.log[k] = ts.slice(-10);
  }
  toast(bought ? `${it.n} : acheté` : `${it.n} retiré de la liste`, true);
  save();
}

let tt;
function toast(msg, undo) {
  $('tmsg').textContent = msg;
  $('undo').style.display = undo ? '' : 'none';
  $('toast').classList.add('show');
  clearTimeout(tt);
  tt = setTimeout(() => $('toast').classList.remove('show'), 3500);
}

// ===== Fenêtres du bas =====
function openSheet(id) { $(id).classList.add('open'); $('sheetBg').classList.add('open'); }
function closeSheets() { document.querySelectorAll('.sheet.open').forEach(s => s.classList.remove('open')); $('sheetBg').classList.remove('open'); }
$('sheetBg').addEventListener('click', closeSheets);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheets(); });

// --- Modifier un article (appui long) ---
let editId = null, editAisle = null;
function openEdit(id) {
  const it = S.items.find(x => x.id === id);
  if (!it) return;
  editId = id; editAisle = it.a;
  $('eName').value = it.n;
  $('eNote').value = it.note || '';
  drawAisleChoice();
  openSheet('edit');
}
function drawAisleChoice() {
  $('eAisles').innerHTML = ordered().map(a =>
    `<button type="button" class="chip${a.k === editAisle ? ' sel' : ''}" style="--c:${a.c}" data-ak="${a.k}" aria-pressed="${a.k === editAisle}"><i></i>${a.n}</button>`).join('');
}
$('eAisles').addEventListener('click', e => {
  const b = e.target.closest('[data-ak]');
  if (b) { editAisle = b.dataset.ak; drawAisleChoice(); }
});
$('eSave').addEventListener('click', () => {
  const it = S.items.find(x => x.id === editId);
  if (!it) return closeSheets();
  const n = cap($('eName').value.trim().replace(/\s+/g, ' ')) || it.n;
  it.n = n;
  it.note = $('eNote').value.trim();
  if (editAisle !== it.a) {
    it.a = editAisle;
    S.custom[norm(n)] = editAisle;                               // retenu pour la prochaine fois
    S.history.forEach(h => { if (norm(h.n) === norm(n)) h.a = editAisle; });
  }
  closeSheets();
  save();
});
$('eDel').addEventListener('click', () => { closeSheets(); remove(editId, false); });

// --- Réglages : ordre des rayons ---
function drawOrder() {
  $('order').innerHTML = ordered().map((a, i) =>
    `<li style="--c:${a.c}"><i></i><span>${a.n}</span>
      <button type="button" data-up="${i}" aria-label="Monter ${a.n}" ${i === 0 ? 'disabled' : ''}>↑</button>
      <button type="button" data-down="${i}" aria-label="Descendre ${a.n}" ${i === S.order.length - 1 ? 'disabled' : ''}>↓</button></li>`).join('');
}
$('order').addEventListener('click', e => {
  const up = e.target.closest('[data-up]'), down = e.target.closest('[data-down]');
  if (!up && !down) return;
  const i = +(up ? up.dataset.up : down.dataset.down);
  const j = up ? i - 1 : i + 1;
  [S.order[i], S.order[j]] = [S.order[j], S.order[i]];
  save();
  drawOrder();
});
$('gear').addEventListener('click', () => { drawOrder(); $('impMsg').textContent = ''; openSheet('settings'); });
$('sClose').addEventListener('click', closeSheets);

// --- Réglages : sauvegarde ---
$('exp').addEventListener('click', async () => {
  const date = new Date().toISOString().slice(0, 10);
  const json = JSON.stringify({ app: 'courses', date, data: S }, null, 1);
  const file = new File([json], `courses-${date}.json`, { type: 'application/json' });
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Sauvegarde Courses' }); return; }
  } catch (e) { if (e.name === 'AbortError') return; }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file);
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
});
$('imp').addEventListener('change', async e => {
  const f = e.target.files[0];
  e.target.value = '';
  if (!f) return;
  try {
    const raw = JSON.parse(await f.text());
    const d = raw.data || raw;
    if (!Array.isArray(d.items)) throw new Error();
    if (!confirm('Remplacer votre liste et votre historique actuels par ceux de ce fichier ?')) return;
    S = fix(d);
    save();
    drawOrder();
    $('impMsg').textContent = 'Sauvegarde importée.';
  } catch (err) {
    $('impMsg').textContent = 'Ce fichier n’est pas une sauvegarde de l’appli Courses.';
  }
});

// ===== Suggestions pendant la frappe =====
const q = $('q'), sug = $('sug');
let sel = -1;
function suggestions() {
  const v = norm(q.value);
  sel = -1;
  if (!v) { sug.style.display = 'none'; return; }
  const onList = new Set(S.items.map(i => norm(i.n)));
  const pool = S.history.map(h => h.n).concat(AISLES.flatMap(a => a.w.split(' ').filter(w => w.length > 2)).map(cap));
  const seen = new Set(), out = [];
  for (const p of pool) {
    const k = norm(p);
    if (k.startsWith(v) && k !== v && !onList.has(k) && !seen.has(k)) { seen.add(k); out.push(p); }
    if (out.length >= 5) break;
  }
  sug.innerHTML = out.map(o => `<li role="option" data-s="${esc(o)}">${esc(o)}</li>`).join('');
  sug.style.display = out.length ? 'block' : 'none';
}

// ===== Événements =====
$('f').addEventListener('submit', e => {
  e.preventDefault();
  const pick = sel >= 0 ? sug.children[sel].dataset.s : q.value;
  addItem(pick);
  q.value = '';
  sug.style.display = 'none';
  q.focus();
});
q.addEventListener('input', suggestions);
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
  addItem(li.dataset.s);
  q.value = '';
  sug.style.display = 'none';
});
q.addEventListener('blur', () => setTimeout(() => sug.style.display = 'none', 150));

// Tuiles : toucher = acheté, appui long = modifier
const board = $('board');
let lp = null, lpFired = false;
function stopLp() { if (lp) { clearTimeout(lp.timer); lp = null; } }
board.addEventListener('pointerdown', e => {
  const t = e.target.closest('.tile');
  if (!t) return;
  lpFired = false;
  lp = { x: e.clientX, y: e.clientY, timer: setTimeout(() => {
    lpFired = true; lp = null;
    if (navigator.vibrate) navigator.vibrate(15);
    openEdit(t.dataset.id);
  }, 500) };
});
board.addEventListener('pointermove', e => { if (lp && Math.hypot(e.clientX - lp.x, e.clientY - lp.y) > 10) stopLp(); });
['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => board.addEventListener(ev, stopLp));
board.addEventListener('contextmenu', e => {
  const t = e.target.closest('.tile');
  if (!t) return;
  e.preventDefault();
  if (!lpFired) { stopLp(); lpFired = true; openEdit(t.dataset.id); }
});
board.addEventListener('click', e => {
  if (lpFired) { lpFired = false; return; }
  const del = e.target.closest('[data-del]');
  if (del) { remove(del.dataset.del, false); return; }
  const t = e.target.closest('.tile');
  if (!t) return;
  t.classList.add('gone');
  setTimeout(() => remove(t.dataset.id, true), 220);
});

$('recent').addEventListener('click', e => {
  const c = e.target.closest('[data-re]');
  if (c) addItem(c.dataset.re);
});
$('due').addEventListener('click', e => {
  const go = e.target.closest('[data-due]'), no = e.target.closest('[data-dis]');
  if (go) addItem(go.dataset.due);
  if (no) { S.dismissed[norm(no.dataset.dis)] = Date.now(); save(); }
});
$('undo').addEventListener('click', () => {
  if (!last) return;
  S.items.splice(last.i, 0, last.it);
  S.history = last.hist;
  S.log = last.log;
  last = null;
  $('toast').classList.remove('show');
  save();
});

render();

// ===== Version : affichage dans les réglages + message après mise à jour =====
$('version').innerHTML = `<p class="sub">Version ${VERSION} · ${VERSIONS[0].date}</p>` +
  VERSIONS.map(x => `<details${x === VERSIONS[0] ? ' open' : ''}><summary>Version ${x.v} · ${x.date}</summary><ul>${x.notes.map(n => `<li>${esc(n)}</li>`).join('')}</ul></details>`).join('');
try {
  const seen = localStorage.getItem('courses-version');
  if (seen && seen !== VERSION) toast(`Mise à jour installée : version ${VERSION}`);
  localStorage.setItem('courses-version', VERSION);
} catch (e) {}

// ===== Mode hors ligne : enregistre le service worker =====
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
