// Actions sur la liste : ajouter, acheter, retirer, annuler, ignorer, modifier.
import { store, persist } from './store.js';
import { guessAisle } from './aisles.js';
import { render } from './ui/render.js';
import { toast, hideToast } from './ui/toast.js';
import { norm, cap, clone, DAY } from './utils.js';

// Enregistre puis réaffiche : à appeler après chaque changement
export function save() {
  persist();
  render();
}

export function addItem(raw) {
  const S = store.state;
  const n = cap(raw.trim().replace(/\s+/g, ' '));
  if (!n) return;
  if (S.items.some(i => norm(i.n) === norm(n))) { toast(`« ${n} » est déjà sur la liste`); return; }
  const prev = S.history.find(h => norm(h.n) === norm(n));
  S.items.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    n,
    a: S.custom[norm(n)] || (prev ? prev.a : guessAisle(n, S.custom)),
    note: ''
  });
  save();
}

let last = null; // de quoi annuler la dernière action

// bought = true : acheté (va dans l'historique) ; false : simplement retiré
export function removeItem(id, bought) {
  const S = store.state;
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

export function undo() {
  if (!last) return;
  const S = store.state;
  S.items.splice(last.i, 0, last.it);
  S.history = last.hist;
  S.log = last.log;
  last = null;
  hideToast();
  save();
}

// « Il vous faut peut-être » → × : ne plus proposer avant le prochain cycle
export function dismiss(name) {
  store.state.dismissed[norm(name)] = Date.now();
  save();
}

// Modification depuis la fenêtre « Modifier l'article »
export function updateItem(id, { name, note, aisleKey }) {
  const S = store.state;
  const it = S.items.find(x => x.id === id);
  if (!it) return;
  const n = cap(name.trim().replace(/\s+/g, ' ')) || it.n;
  it.n = n;
  it.note = note.trim();
  if (aisleKey !== it.a) {
    it.a = aisleKey;
    S.custom[norm(n)] = aisleKey; // retenu pour la prochaine fois
    S.history.forEach(h => { if (norm(h.n) === norm(n)) h.a = aisleKey; });
  }
  save();
}

// Réglages : monter (-1) ou descendre (+1) un rayon
export function moveAisle(i, dir) {
  const o = store.state.order;
  const j = i + dir;
  if (j < 0 || j >= o.length) return;
  [o[i], o[j]] = [o[j], o[i]];
  save();
}
