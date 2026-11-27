// Synchronisation de la liste avec Supabase (liste partagée du foyer).
//
// Principe :
// - le téléphone garde toujours sa copie de la liste (store.state) : l'appli reste
//   rapide et marche hors ligne ;
// - chaque changement local part dans une file d'attente (outbox), envoyée dès que
//   le réseau est là ;
// - les changements de l'autre téléphone arrivent en temps réel (Realtime).
//
// Ce qui est partagé : la liste (table articles), les achats (table achats, qui
// servent à « Déjà achetés » et « Il vous faut peut-être ») et les réglages communs
// (packs, ordre des rayons, rayons corrigés, suggestions ignorées).
// Reste propre à chaque téléphone : « Garder l'écran allumé ».
import { store, persist, fix } from '../store.js';
import { getClient } from './client.js';
import { norm, DAY, $ } from '../utils.js';

const KEY = 'courses-cloud';
const MAX_ACHATS = 500;

// meta = { foyer: {id, nom, code} | null, outbox: [op], achats: [{id, nom, rayon, at}],
//          synced: { items: {id: json}, reglages: json } }   ← dernier état connu du serveur
let meta = loadMeta();
let channel = null;
let flushing = false;
let flushGen = 0; // change quand on relance l'envoi : une ancienne tentative bloquée s'arrête
let onChange = () => {};

function emptyMeta() { return { foyer: null, outbox: [], achats: [], synced: { items: {}, reglages: '' } }; }
function loadMeta() {
  try {
    const m = JSON.parse(localStorage.getItem(KEY));
    if (m && typeof m === 'object') return { ...emptyMeta(), ...m, synced: { items: {}, reglages: '', ...(m.synced || {}) } };
  } catch (e) {}
  return emptyMeta();
}
function saveMeta() { try { localStorage.setItem(KEY, JSON.stringify(meta)); } catch (e) {} }

export const isShared = () => !!meta.foyer;
export const currentFoyer = () => meta.foyer;
export const pendingCount = () => meta.outbox.length;
export function setOnChange(fn) { onChange = fn; } // appelé quand l'autre téléphone a changé quelque chose

const newId = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const itemRow = i => ({ id: i.id, nom: i.n, rayon: i.a, note: i.note || '' });
const reglagesOf = S => ({ packs: S.packs, order: S.order, custom: S.custom, dismissed: S.dismissed });

// ===================== File d'attente =====================

function queue(op) {
  const q = meta.outbox;
  if (op.t === 'item' || op.t === 'del') {
    meta.outbox = q.filter(o => !((o.t === 'item' || o.t === 'del') && o.id === op.id)); // seule la dernière version compte
  } else if (op.t === 'reglages') {
    meta.outbox = q.filter(o => o.t !== 'reglages');
  } else if (op.t === 'achatDel' && q.some(o => o.t === 'achat' && o.row.id === op.id)) {
    meta.outbox = q.filter(o => !(o.t === 'achat' && o.row.id === op.id)); // jamais envoyé : on l'oublie
    return;
  }
  meta.outbox.push(op);
}

// Compare la liste locale au dernier état connu du serveur et met en file les différences
function diffAndQueue() {
  const S = store.state;
  const now = {};
  for (const i of S.items) now[i.id] = JSON.stringify(itemRow(i));
  for (const [id, j] of Object.entries(now)) if (meta.synced.items[id] !== j) queue({ t: 'item', id, row: JSON.parse(j) });
  for (const id of Object.keys(meta.synced.items)) if (!(id in now)) queue({ t: 'del', id });
  meta.synced.items = now;
  const r = JSON.stringify(reglagesOf(S));
  if (r !== meta.synced.reglages) { queue({ t: 'reglages', data: JSON.parse(r) }); meta.synced.reglages = r; }
  saveMeta();
}

// Le serveur et le téléphone sont d'accord : on note l'état actuel comme référence
function baseline() {
  const S = store.state;
  meta.synced.items = Object.fromEntries(S.items.map(i => [i.id, JSON.stringify(itemRow(i))]));
  meta.synced.reglages = JSON.stringify(reglagesOf(S));
}

// À appeler après chaque changement local (actions.save)
export function afterSave() {
  if (!isShared()) return;
  diffAndQueue();
  flush();
}

// ===================== Achats → historique =====================

// Un article est acheté : on garde la trace (renvoie l'id pour pouvoir annuler)
export function recordPurchase(item) {
  if (!isShared()) return null;
  const a = { id: newId('h'), nom: item.n, rayon: item.a, at: new Date().toISOString() };
  meta.achats.unshift(a);
  meta.achats = meta.achats.slice(0, MAX_ACHATS);
  queue({ t: 'achat', row: a });
  rebuildHistory();
  saveMeta();
  return a.id;
}

export function cancelPurchase(id) {
  if (!isShared() || !id) return;
  meta.achats = meta.achats.filter(a => a.id !== id);
  queue({ t: 'achatDel', id });
  rebuildHistory();
  saveMeta();
}

// « Déjà achetés » et les dates d'achat sont recalculés à partir des achats du foyer
function rebuildHistory() {
  const S = store.state;
  const byName = new Map();
  const sorted = [...meta.achats].sort((x, y) => (x.at < y.at ? 1 : -1)); // récents d'abord
  for (const a of sorted) {
    const k = norm(a.nom);
    if (!byName.has(k)) byName.set(k, { n: a.nom, a: a.rayon, ts: [] });
    byName.get(k).ts.push(Date.parse(a.at));
  }
  S.history = [...byName.values()].map(v => ({ n: v.n, a: v.a })).slice(0, 80);
  S.log = {};
  for (const [k, v] of byName) {
    const out = [];
    for (const t of v.ts.sort((x, y) => x - y)) {
      if (out.length && t - out[out.length - 1] < DAY / 2) out[out.length - 1] = t; // même journée : un seul achat
      else out.push(t);
    }
    S.log[k] = out.slice(-10);
  }
}

// Historique d'avant le partage → achats (pour ne rien perdre)
function achatsFromLocal() {
  const S = store.state;
  const out = [];
  const byName = new Map(S.history.map(h => [norm(h.n), h]));
  for (const [k, ts] of Object.entries(S.log)) {
    const h = byName.get(k);
    if (h) for (const t of ts) out.push({ id: newId('h'), nom: h.n, rayon: h.a, at: new Date(t).toISOString() });
  }
  S.history.forEach((h, i) => {
    if (!S.log[norm(h.n)]) out.push({ id: newId('h'), nom: h.n, rayon: h.a, at: new Date(Date.now() - DAY - i * 60000).toISOString() });
  });
  return out;
}

// ===================== Envoi =====================

async function session() {
  const c = await getClient();
  if (!c) return null;
  const { data } = await c.auth.getSession();
  return data && data.session ? c : null;
}

// Une requête sans réponse (réseau coupé en plein envoi) ne doit pas bloquer la file
const TIMEOUT = 15000;
const withTimeout = pr => Promise.race([pr, new Promise(res => setTimeout(() => res({ error: { message: 'timeout' } }), TIMEOUT))]);

const isRetryable = e => {
  const m = String((e && (e.message || e.details)) || e || '');
  return /fetch|network|load failed|timeout|jwt|PGRST301/i.test(m) || (e && (e.code === 'PGRST301' || e.status === 401 || e.status >= 500));
};

function send(c, ops) {
  const F = meta.foyer.id, now = new Date().toISOString(), op = ops[0];
  if (op.t === 'item') return c.from('articles').upsert(ops.map(o => ({ ...o.row, foyer_id: F, updated_at: now })));
  if (op.t === 'achat') return c.from('achats').upsert(ops.map(o => ({ id: o.row.id, foyer_id: F, nom: o.row.nom, rayon: o.row.rayon, achete_le: o.row.at })));
  if (op.t === 'del') return c.from('articles').delete().in('id', ops.map(o => o.id));
  if (op.t === 'achatDel') return c.from('achats').delete().in('id', ops.map(o => o.id));
  return c.from('reglages_foyer').upsert({ foyer_id: F, donnees: op.data, updated_at: now });
}

// Envoie la file d'attente (par paquets d'opérations du même type)
export async function flush() {
  if (flushing || !isShared() || !meta.outbox.length) { status(); return; }
  flushing = true;
  const gen = ++flushGen;
  status();
  try {
    const c = await session();
    if (!c || gen !== flushGen) return;
    while (meta.outbox.length && isShared()) {
      const t = meta.outbox[0].t;
      let n = 1;
      if (t !== 'reglages') while (n < meta.outbox.length && n < 100 && meta.outbox[n].t === t) n++;
      const batch = meta.outbox.slice(0, n);
      const { error } = await withTimeout(send(c, batch));
      if (gen !== flushGen) return;                                 // une nouvelle tentative a pris le relais
      if (error && isRetryable(error)) break;                       // réseau : on réessaiera
      if (error) console.warn('Modification refusée par le serveur', error);
      meta.outbox.splice(0, n);
      saveMeta();
    }
  } catch (e) {
    // hors ligne : on réessaiera
  } finally {
    if (gen === flushGen) { flushing = false; status(); }
  }
}

// ===================== Réception =====================

function applyReglages(d) {
  if (!d || typeof d !== 'object') return;
  const S = store.state;
  const next = fix({
    ...S,
    packs: Array.isArray(d.packs) ? d.packs : S.packs,
    order: Array.isArray(d.order) ? d.order : S.order,
    custom: d.custom || S.custom,
    dismissed: d.dismissed || S.dismissed
  });
  Object.assign(S, { packs: next.packs, order: next.order, custom: next.custom, dismissed: next.dismissed });
}

// Remplace la copie locale par celle du serveur, en gardant les changements pas encore envoyés
function applyServer(items, achats, donnees) {
  const S = store.state;
  let list = items.map(x => ({ id: x.id, n: x.nom, a: x.rayon, note: x.note || '' }));
  for (const op of meta.outbox) {
    if (op.t === 'item') {
      const row = { id: op.row.id, n: op.row.nom, a: op.row.rayon, note: op.row.note };
      const i = list.findIndex(x => x.id === op.id);
      if (i >= 0) list[i] = row; else list.push(row);
    }
    if (op.t === 'del') list = list.filter(x => x.id !== op.id);
  }
  const pos = new Map(S.items.map((x, i) => [x.id, i])); // garder l'ordre déjà affiché
  list.sort((x, y) => (pos.has(x.id) ? pos.get(x.id) : 1e9) - (pos.has(y.id) ? pos.get(y.id) : 1e9));
  S.items = list;

  let ach = achats.map(x => ({ id: x.id, nom: x.nom, rayon: x.rayon, at: x.achete_le }));
  for (const op of meta.outbox) {
    if (op.t === 'achat' && !ach.some(x => x.id === op.row.id)) ach.unshift(op.row);
    if (op.t === 'achatDel') ach = ach.filter(x => x.id !== op.id);
  }
  meta.achats = ach.slice(0, MAX_ACHATS);
  rebuildHistory();

  const pendingReg = meta.outbox.find(o => o.t === 'reglages');
  applyReglages(pendingReg ? pendingReg.data : donnees);

  baseline();
  persist();
  saveMeta();
  onChange();
  status();
}

// Récupère tout le foyer depuis le serveur
export async function pull() {
  const c = await session();
  if (!c || !isShared()) return false;
  const F = meta.foyer.id;
  const [a, h, r] = await withTimeout(Promise.all([
    c.from('articles').select('id,nom,rayon,note,created_at').eq('foyer_id', F).order('created_at'),
    c.from('achats').select('id,nom,rayon,achete_le').eq('foyer_id', F).order('achete_le', { ascending: false }).limit(MAX_ACHATS),
    c.from('reglages_foyer').select('donnees').eq('foyer_id', F).maybeSingle()
  ])).then(x => (Array.isArray(x) ? x : [x, x, x]));
  if (a.error || h.error || r.error) return false;
  applyServer(a.data, h.data, r.data && r.data.donnees);
  return true;
}

const pending = (t, id) => meta.outbox.some(o => o.t === t && (o.id === id || (o.row && o.row.id === id)));

// Un changement arrive de l'autre téléphone
function onArticle(p) {
  const S = store.state;
  if (p.eventType === 'DELETE') {
    const id = p.old && p.old.id;
    if (!id || pending('item', id)) return;
    S.items = S.items.filter(x => x.id !== id);
    delete meta.synced.items[id];
  } else {
    const x = p.new;
    if (!x || x.foyer_id !== meta.foyer.id || pending('item', x.id) || pending('del', x.id)) return;
    const row = { id: x.id, n: x.nom, a: x.rayon, note: x.note || '' };
    const i = S.items.findIndex(y => y.id === x.id);
    if (i >= 0) S.items[i] = row; else S.items.push(row);
    meta.synced.items[x.id] = JSON.stringify(itemRow(row));
  }
  persist(); saveMeta(); onChange();
}

function onAchat(p) {
  if (p.eventType === 'DELETE') {
    const id = p.old && p.old.id;
    if (!id) return;
    meta.achats = meta.achats.filter(a => a.id !== id);
  } else {
    const x = p.new;
    if (!x || x.foyer_id !== meta.foyer.id || meta.achats.some(a => a.id === x.id)) return;
    meta.achats.unshift({ id: x.id, nom: x.nom, rayon: x.rayon, at: x.achete_le });
    meta.achats = meta.achats.slice(0, MAX_ACHATS);
  }
  rebuildHistory();
  persist(); saveMeta(); onChange();
}

function onReglages(p) {
  if (!p.new || p.new.foyer_id !== meta.foyer.id || pending('reglages')) return;
  applyReglages(p.new.donnees);
  meta.synced.reglages = JSON.stringify(reglagesOf(store.state));
  persist(); saveMeta(); onChange();
}

async function subscribe() {
  const c = await session();
  if (!c || !isShared()) return;
  if (channel) { c.removeChannel(channel); channel = null; }
  const F = meta.foyer.id;
  const mine = { schema: 'public', filter: `foyer_id=eq.${F}` };
  channel = c.channel('foyer-' + F)
    .on('postgres_changes', { event: 'INSERT', table: 'articles', ...mine }, onArticle)
    .on('postgres_changes', { event: 'UPDATE', table: 'articles', ...mine }, onArticle)
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'articles' }, onArticle) // pas de filtre possible sur les suppressions
    .on('postgres_changes', { event: 'INSERT', table: 'achats', ...mine }, onAchat)
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'achats' }, onAchat)
    .on('postgres_changes', { event: '*', table: 'reglages_foyer', ...mine }, onReglages)
    .subscribe(st => { if (st === 'SUBSCRIBED') pull().then(flush); }); // rattrape ce qui a été manqué
}

// ===================== Démarrage, foyer =====================

// Écoute le réseau et le retour au premier plan (une seule fois)
let listening = false;
function listen() {
  if (listening) return;
  listening = true;
  window.addEventListener('online', () => { flushGen++; flushing = false; startSync(); }); // relance tout de suite
  window.addEventListener('offline', status);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && isShared()) pull().then(flush); });
  setInterval(() => { if (meta.outbox.length) flush(); }, 30000);
}

export async function startSync() {
  if (!isShared()) { status(); return; }
  listen();
  status();
  if (await pull()) { await flush(); subscribe(); }
}

export async function stopSync() {
  const c = await getClient();
  if (c && channel) c.removeChannel(channel);
  channel = null;
}

// Devient membre d'un foyer. withLocal = 'all' : envoie toute la liste et l'historique
// actuels (création) ; 'missing' : ajoute seulement les articles absents (rejoindre).
async function attach(f, withLocal) {
  const localItems = store.state.items.slice();
  meta = { ...emptyMeta(), foyer: { id: f.id, nom: f.nom, code: f.code } };
  listen();
  if (withLocal === 'all') {
    meta.achats = achatsFromLocal();
    for (const a of meta.achats) meta.outbox.push({ t: 'achat', row: a });
    saveMeta();
    diffAndQueue();                       // toute la liste + réglages
    rebuildHistory(); persist();
    await flush();
    subscribe();
    onChange();
    return localItems.length;
  }
  saveMeta();
  await pull();                           // la liste du foyer
  const names = new Set(store.state.items.map(i => norm(i.n)));
  const extra = localItems.filter(i => !names.has(norm(i.n)));
  store.state.items.push(...extra);
  persist();
  diffAndQueue();
  await flush();
  subscribe();
  onChange();
  return extra.length;
}

export async function createFoyer(nom) {
  const c = await session();
  if (!c) throw new Error('Failed to fetch');
  const { data, error } = await c.rpc('creer_foyer', { nom_foyer: nom });
  if (error) throw error;
  return attach(data, 'all');
}

export async function joinFoyer(code) {
  const c = await session();
  if (!c) throw new Error('Failed to fetch');
  const { data, error } = await c.rpc('rejoindre_foyer', { code_invitation: code });
  if (error) throw error;
  return attach(data, 'missing');
}

// Après connexion : le compte a-t-il déjà un foyer ? (ex. nouveau téléphone)
export async function findMyFoyer() {
  const c = await session();
  if (!c) return null;
  const { data, error } = await c.from('foyers').select('id,nom,code').limit(1);
  if (error || !data || !data.length) return null;
  return data[0];
}
export const attachExisting = f => attach(f, 'missing');

// Quitte le mode partagé sur ce téléphone (la liste reste affichée, en local)
export async function leaveSharing() {
  await stopSync();
  meta = emptyMeta();
  saveMeta();
  status();
}

// ===================== Petit texte d'état sous le compteur =====================

export function status() {
  const el = $('sync');
  if (!el) return;
  if (!isShared()) { el.textContent = ''; el.hidden = true; return; }
  el.hidden = false;
  const n = meta.outbox.length;
  const off = !navigator.onLine;
  el.textContent = off
    ? `Hors ligne${n ? ` · ${n} changement${n > 1 ? 's' : ''} en attente` : ''}`
    : n ? `Liste partagée · envoi de ${n} changement${n > 1 ? 's' : ''}…` : `Liste partagée · ${meta.foyer.nom}`;
}
