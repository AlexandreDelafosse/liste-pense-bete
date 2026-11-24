// Suggestions : « Il vous faut peut-être » et autocomplétion pendant la frappe.
import { store } from './store.js';
import { keywords } from './aisles.js';
import { norm, cap, DAY } from './utils.js';

const onList = () => new Set(store.state.items.map(i => norm(i.n)));

// Articles qui devraient bientôt manquer, d'après le rythme d'achat
export function dueList() {
  const S = store.state;
  const now = Date.now();
  const listed = onList();
  const out = [];
  for (const [k, ts] of Object.entries(S.log)) {
    if (ts.length < 3 || listed.has(k)) continue;              // au moins 3 achats pour connaître le rythme
    const gaps = ts.slice(1).map((t, i) => t - ts[i]).sort((a, b) => a - b);
    const rythme = gaps[Math.floor(gaps.length / 2)];           // écart habituel (médiane)
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

// Propositions pour ce qui est en train d'être tapé (5 maximum)
export function typeahead(text) {
  const v = norm(text);
  if (!v) return [];
  const listed = onList();
  const pool = store.state.history.map(h => h.n).concat(keywords().map(cap));
  const seen = new Set(), out = [];
  for (const p of pool) {
    const k = norm(p);
    if (k.startsWith(v) && k !== v && !listed.has(k) && !seen.has(k)) { seen.add(k); out.push(p); }
    if (out.length >= 5) break;
  }
  return out;
}
