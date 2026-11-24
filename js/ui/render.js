// Affichage : suggestions, tuiles par rayon, déjà achetés, compteur.
import { store } from '../store.js';
import { aisle } from '../aisles.js';
import { dueList } from '../suggestions.js';
import { $, esc, norm } from '../utils.js';

// Rayons dans l'ordre choisi dans les réglages
export const orderedAisles = () => store.state.order.map(aisle);

export function render() {
  const S = store.state;

  // Il vous faut peut-être
  const due = dueList();
  $('dueBox').style.display = due.length ? '' : 'none';
  $('due').innerHTML = due.map(d =>
    `<span class="dchip"><button class="go" data-due="${esc(d.n)}">${esc(d.n)}</button><button class="no" data-dis="${esc(d.n)}" aria-label="Ignorer ${esc(d.n)} pour cette fois">×</button></span>`).join('');

  // La liste, rayon par rayon
  $('board').innerHTML = S.items.length
    ? orderedAisles().map(tilesOf).join('')
    : '<div class="empty"><strong>Rien à racheter pour l’instant</strong>Notez ici ce qui manque dès que vous vous en rendez compte.</div>';
  $('hint').style.display = S.items.length && S.history.length < 6 ? '' : 'none';

  // Déjà achetés
  const listed = new Set(S.items.map(i => norm(i.n)));
  const rec = S.history.filter(h => !listed.has(norm(h.n))).slice(0, 24);
  $('recentBox').style.display = rec.length ? '' : 'none';
  $('recent').innerHTML = rec.map(h =>
    `<button class="chip" style="--c:${aisle(h.a).c}" data-re="${esc(h.n)}"><i></i>${esc(h.n)}</button>`).join('');

  // Compteur
  const n = S.items.length;
  $('count').textContent = n ? `${n} article${n > 1 ? 's' : ''} sur la liste` : 'Votre liste est vide';
}

// Un rayon et ses tuiles (rien si le rayon est vide)
function tilesOf(a) {
  const its = store.state.items.filter(i => i.a === a.k);
  if (!its.length) return '';
  return `<section class="aisle" style="--c:${a.c}">
    <h2><i></i>${a.n}</h2>
    <div class="grid">${its.map(tile).join('')}</div>
  </section>`;
}

function tile(i) {
  return `<div class="cell">
    <button class="tile" data-id="${i.id}" aria-label="${esc(i.n)} : marquer comme acheté">
      <b>${esc(i.n.charAt(0).toUpperCase())}</b>
      <span>${esc(i.n)}${i.note ? `<small>${esc(i.note)}</small>` : ''}</span>
    </button>
    <button class="x" data-del="${i.id}" aria-label="Retirer ${esc(i.n)}">×</button>
  </div>`;
}
