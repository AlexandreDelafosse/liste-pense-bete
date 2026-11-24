// Packs : des groupes d'articles à ajouter en une touche (ex. « Petit-déj »).
// state.packs = [{ id, n: nom, items: ['Lait', 'Pain', …] }]
import { store } from './store.js';
import { addList, save } from './actions.js';
import { cap } from './utils.js';

export const getPack = id => store.state.packs.find(p => p.id === id);

// Ajoute tous les articles d'un pack à la liste
export function usePack(id) {
  const p = getPack(id);
  if (p) addList(p.items, p.n);
}

// Crée (id vide) ou modifie un pack. Renvoie false si le nom ou les articles manquent.
export function savePack(id, name, itemsText) {
  const n = cap(name.trim());
  const items = itemsText.split(/\s*[,;\n]\s*/).map(s => cap(s.trim())).filter(Boolean);
  if (!n || !items.length) return false;
  const p = id && getPack(id);
  if (p) { p.n = n; p.items = items; }
  else store.state.packs.push({ id: 'p' + Date.now().toString(36), n, items });
  save();
  return true;
}

export function deletePack(id) {
  store.state.packs = store.state.packs.filter(p => p.id !== id);
  save();
}
