// Fenêtres du bas : « Modifier l'article » (appui long) et « Réglages ».
import { store, replaceAll, backupFile, readBackup } from '../store.js';
import { updateItem, removeItem, moveAisle, save } from '../actions.js';
import { orderedAisles } from './render.js';
import { VERSIONS, VERSION } from '../version.js';
import { wakeLockSupported, isKeepAwake, setKeepAwake } from '../wakelock.js';
import { getPack, savePack, deletePack } from '../packs.js';
import { initShare, openShare, shareSummary } from './share.js';
import { $, esc } from '../utils.js';

export function openSheet(id) { $(id).classList.add('open'); $('sheetBg').classList.add('open'); }
export function closeSheets() {
  document.querySelectorAll('.sheet.open').forEach(s => s.classList.remove('open'));
  $('sheetBg').classList.remove('open');
}

// ----- Modifier un article -----
let editId = null, editAisle = null;

export function openEdit(id) {
  const it = store.state.items.find(x => x.id === id);
  if (!it) return;
  editId = id;
  editAisle = it.a;
  $('eName').value = it.n;
  $('eNote').value = it.note || '';
  drawAisleChoice();
  openSheet('edit');
}

function drawAisleChoice() {
  $('eAisles').innerHTML = orderedAisles().map(a =>
    `<button type="button" class="chip${a.k === editAisle ? ' sel' : ''}" style="--c:${a.c}" data-ak="${a.k}" aria-pressed="${a.k === editAisle}"><i></i>${a.n}</button>`).join('');
}

// ----- Réglages -----
export function openSettings() {
  drawOrder();
  drawPacks();
  $('awake').checked = isKeepAwake();
  $('shareState').textContent = shareSummary();
  $('impMsg').textContent = '';
  openSheet('settings');
}

function drawOrder() {
  const list = orderedAisles();
  $('order').innerHTML = list.map((a, i) =>
    `<li style="--c:${a.c}"><i></i><span>${a.n}</span>
      <button type="button" data-up="${i}" aria-label="Monter ${a.n}" ${i === 0 ? 'disabled' : ''}>↑</button>
      <button type="button" data-down="${i}" aria-label="Descendre ${a.n}" ${i === list.length - 1 ? 'disabled' : ''}>↓</button></li>`).join('');
}

// ----- Packs (dans les réglages) -----
let packId = null; // pack en cours de modification ('' = nouveau)

function drawPacks() {
  const packs = store.state.packs;
  $('packList').innerHTML = packs.length
    ? packs.map(p => `<li><div><b>${esc(p.n)}</b><small>${esc(p.items.join(', '))}</small></div>
        <button type="button" data-edit-pack="${esc(p.id)}" aria-label="Modifier le pack ${esc(p.n)}">Modifier</button></li>`).join('')
    : '<li><div><small>Aucun pack pour l’instant.</small></div></li>';
}

function openPack(id) {
  const p = id ? getPack(id) : null;
  packId = p ? p.id : '';
  $('packTitle').textContent = p ? 'Modifier le pack' : 'Nouveau pack';
  $('pName').value = p ? p.n : '';
  $('pItems').value = p ? p.items.join(', ') : '';
  $('pErr').textContent = '';
  $('pDel').style.display = p ? '' : 'none';
  closeSheets();
  openSheet('packEdit');
}

function backToSettings() {
  closeSheets();
  openSettings();
}

function drawVersions() {
  $('version').innerHTML = `<p class="sub">Version ${VERSION} · ${VERSIONS[0].date}</p>` +
    VERSIONS.map((x, i) => `<details${i === 0 ? ' open' : ''}><summary>Version ${x.v} · ${x.date}</summary><ul>${x.notes.map(n => `<li>${esc(n)}</li>`).join('')}</ul></details>`).join('');
}

async function exportBackup() {
  const file = backupFile();
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Sauvegarde Courses' });
      return;
    }
  } catch (e) { if (e.name === 'AbortError') return; }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file);
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

async function importBackup(e) {
  const f = e.target.files[0];
  e.target.value = '';
  if (!f) return;
  try {
    const d = await readBackup(f);
    if (!confirm('Remplacer votre liste et votre historique actuels par ceux de ce fichier ?')) return;
    replaceAll(d);
    save();
    drawOrder();
    $('impMsg').textContent = 'Sauvegarde importée.';
  } catch (err) {
    $('impMsg').textContent = 'Ce fichier n’est pas une sauvegarde de l’appli Courses.';
  }
}

// ----- Branchement des boutons -----
export function initSheets() {
  $('sheetBg').addEventListener('click', closeSheets);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheets(); });

  $('eAisles').addEventListener('click', e => {
    const b = e.target.closest('[data-ak]');
    if (b) { editAisle = b.dataset.ak; drawAisleChoice(); }
  });
  $('eSave').addEventListener('click', () => {
    updateItem(editId, { name: $('eName').value, note: $('eNote').value, aisleKey: editAisle });
    closeSheets();
  });
  $('eDel').addEventListener('click', () => { closeSheets(); removeItem(editId, false); });

  $('order').addEventListener('click', e => {
    const up = e.target.closest('[data-up]'), down = e.target.closest('[data-down]');
    if (up) moveAisle(+up.dataset.up, -1);
    if (down) moveAisle(+down.dataset.down, 1);
    if (up || down) drawOrder();
  });
  $('gear').addEventListener('click', openSettings);
  $('sClose').addEventListener('click', closeSheets);
  $('exp').addEventListener('click', exportBackup);
  $('imp').addEventListener('change', importBackup);

  $('packList').addEventListener('click', e => {
    const b = e.target.closest('[data-edit-pack]');
    if (b) openPack(b.dataset.editPack);
  });
  $('packNew').addEventListener('click', () => openPack(''));
  $('pSave').addEventListener('click', () => {
    if (savePack(packId, $('pName').value, $('pItems').value)) backToSettings();
    else $('pErr').textContent = 'Indiquez un nom et au moins un article.';
  });
  $('pDel').addEventListener('click', () => {
    const p = getPack(packId);
    if (p && confirm(`Supprimer le pack « ${p.n} » ?`)) { deletePack(packId); backToSettings(); }
  });

  if (wakeLockSupported) {
    $('awake').addEventListener('change', e => setKeepAwake(e.target.checked));
  } else {
    $('awake').disabled = true;
    $('awakeNote').textContent = 'Non disponible sur cet appareil (iPhone : iOS 16.4 ou plus récent).';
  }

  $('shareOpen').addEventListener('click', openShare);
  initShare({ openSheet, closeSheets });

  drawVersions();
}
