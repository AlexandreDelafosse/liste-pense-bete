// Message en bas de l'écran, avec un bouton « Annuler » facultatif.
import { $ } from '../utils.js';

let timer;

export function toast(msg, withUndo = false) {
  $('tmsg').textContent = msg;
  $('undo').style.display = withUndo ? '' : 'none';
  $('toast').classList.add('show');
  clearTimeout(timer);
  timer = setTimeout(hideToast, 3500);
}

export function hideToast() {
  $('toast').classList.remove('show');
}
