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

// ===== Petits outils =====
const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
const esc = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const aisle = k => AISLES.find(a => a.k === k) || AISLES[AISLES.length - 1];

// Devine le rayon à partir des mots de l'article ("Pommes de terre" → Fruits & légumes)
function guess(name) {
  const words = norm(name).split(/[\s'-]+/);
  for (const a of AISLES) {
    for (const w of a.w.split(' ')) {
      const ww = norm(w);
      if (ww && words.some(x => x === ww || x === ww + 's' || x === ww + 'x')) return a.k;
    }
  }
  return 'au';
}

// ===== Données : enregistrées dans le téléphone =====
const KEY = 'courses-v1';
let S;
try { S = JSON.parse(localStorage.getItem(KEY)) || { items: [], history: [] }; }
catch (e) { S = { items: [], history: [] }; }

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
  render();
}

// ===== Affichage =====
function render() {
  const board = document.getElementById('board');
  if (!S.items.length) {
    board.innerHTML = '<div class="empty"><strong>Rien à racheter pour l’instant</strong>Notez ici ce qui manque dès que vous vous en rendez compte.</div>';
  } else {
    board.innerHTML = AISLES.map(a => {
      const its = S.items.filter(i => i.a === a.k);
      if (!its.length) return '';
      return `<section class="aisle" style="--c:${a.c}">
        <h2><i></i>${a.n}</h2>
        <div class="grid">${its.map(i => `
          <div class="cell">
            <button class="tile" data-id="${i.id}" aria-label="${esc(i.n)} : marquer comme acheté">
              <b>${esc(i.n.charAt(0).toUpperCase())}</b><span>${esc(i.n)}</span>
            </button>
            <button class="x" data-del="${i.id}" aria-label="Retirer ${esc(i.n)}">×</button>
          </div>`).join('')}
        </div></section>`;
    }).join('');
  }

  const onList = new Set(S.items.map(i => norm(i.n)));
  const rec = S.history.filter(h => !onList.has(norm(h.n))).slice(0, 24);
  document.getElementById('recentBox').style.display = rec.length ? '' : 'none';
  document.getElementById('recent').innerHTML = rec.map(h =>
    `<button class="chip" style="--c:${aisle(h.a).c}" data-re="${esc(h.n)}"><i></i>${esc(h.n)}</button>`).join('');

  const n = S.items.length;
  document.getElementById('count').textContent = n ? `${n} article${n > 1 ? 's' : ''} sur la liste` : 'Votre liste est vide';
}

// ===== Actions =====
function addItem(raw) {
  const n = cap(raw.trim().replace(/\s+/g, ' '));
  if (!n) return;
  if (S.items.some(i => norm(i.n) === norm(n))) { toast(`« ${n} » est déjà sur la liste`); return; }
  const prev = S.history.find(h => norm(h.n) === norm(n));
  S.items.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), n, a: prev ? prev.a : guess(n) });
  save();
}

let last = null;
function remove(id, bought) {
  const i = S.items.findIndex(x => x.id === id);
  if (i < 0) return;
  const it = S.items[i];
  last = { it, i, hist: S.history.slice() };
  S.items.splice(i, 1);
  if (bought) S.history = [{ n: it.n, a: it.a }].concat(S.history.filter(h => norm(h.n) !== norm(it.n))).slice(0, 60);
  toast(bought ? `${it.n} : acheté` : `${it.n} retiré de la liste`, true);
  save();
}

let tt;
function toast(msg, undo) {
  document.getElementById('tmsg').textContent = msg;
  document.getElementById('undo').style.display = undo ? '' : 'none';
  const t = document.getElementById('toast');
  t.classList.add('show');
  clearTimeout(tt);
  tt = setTimeout(() => t.classList.remove('show'), 3500);
}

// ===== Suggestions pendant la frappe =====
const q = document.getElementById('q');
const sug = document.getElementById('sug');
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
document.getElementById('f').addEventListener('submit', e => {
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

document.getElementById('board').addEventListener('click', e => {
  const del = e.target.closest('[data-del]');
  if (del) { remove(del.dataset.del, false); return; }
  const t = e.target.closest('.tile');
  if (!t) return;
  t.classList.add('gone');
  setTimeout(() => remove(t.dataset.id, true), 220);
});
document.getElementById('recent').addEventListener('click', e => {
  const c = e.target.closest('[data-re]');
  if (c) addItem(c.dataset.re);
});
document.getElementById('undo').addEventListener('click', () => {
  if (!last) return;
  S.items.splice(last.i, 0, last.it);
  S.history = last.hist;
  last = null;
  document.getElementById('toast').classList.remove('show');
  save();
});

render();

// ===== Mode hors ligne : enregistre le service worker =====
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
