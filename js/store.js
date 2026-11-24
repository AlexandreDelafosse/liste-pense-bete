// Données de l'appli, enregistrées dans le téléphone (localStorage).
//
// state.items     la liste en cours        [{ id, n: nom, a: rayon, note }]
// state.history   déjà achetés, récent en premier  [{ n, a }]
// state.log       dates d'achat par article         { "lait": [timestamps] }
// state.custom    rayons corrigés à la main          { "truc": "ma" }
// state.dismissed suggestions ignorées               { "lait": timestamp }
// state.order     ordre des rayons                   ['fl', 'fr', …]
// state.settings  réglages                           { keepAwake: true }
import { AISLES } from './aisles.js';

const KEY = 'courses-v1'; // ne pas changer : ce sont les données déjà sur le téléphone

// Complète les données anciennes ou incomplètes (migration)
export function fix(d) {
  d = d && typeof d === 'object' ? d : {};
  const order = Array.isArray(d.order) ? d.order.filter(k => AISLES.some(a => a.k === k)) : [];
  for (const a of AISLES) if (!order.includes(a.k)) order.push(a.k);
  const obj = v => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
  return {
    items: Array.isArray(d.items) ? d.items : [],
    history: Array.isArray(d.history) ? d.history : [],
    log: obj(d.log),
    custom: obj(d.custom),
    dismissed: obj(d.dismissed),
    settings: obj(d.settings),
    order
  };
}

function load() {
  try { return fix(JSON.parse(localStorage.getItem(KEY))); }
  catch (e) { return fix(null); }
}

// L'objet partagé par tous les modules : toujours passer par store.state
export const store = { state: load() };

export function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(store.state)); } catch (e) {}
}

// Remplace toutes les données (import d'une sauvegarde)
export function replaceAll(d) {
  store.state = fix(d);
  persist();
}

// Fichier de sauvegarde
export function backupFile() {
  const date = new Date().toISOString().slice(0, 10);
  const json = JSON.stringify({ app: 'courses', date, data: store.state }, null, 1);
  return new File([json], `courses-${date}.json`, { type: 'application/json' });
}

// Lit un fichier de sauvegarde ; renvoie les données ou lève une erreur
export async function readBackup(file) {
  const raw = JSON.parse(await file.text());
  const d = raw.data || raw;
  if (!Array.isArray(d.items)) throw new Error('Fichier invalide');
  return d;
}
