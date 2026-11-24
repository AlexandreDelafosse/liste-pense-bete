// Garder l'écran allumé pendant que l'appli est ouverte (pratique au magasin).
// Utilise l'API Wake Lock (iPhone : iOS 16.4 ou plus récent).
import { store, persist } from './store.js';

export const wakeLockSupported = 'wakeLock' in navigator;

let lock = null;

async function acquire() {
  if (!wakeLockSupported || lock || document.visibilityState !== 'visible') return;
  try {
    lock = await navigator.wakeLock.request('screen');
    lock.addEventListener('release', () => { lock = null; });
  } catch (e) { lock = null; } // refusé (mode économie d'énergie…) : on n'insiste pas
}

function release() {
  if (lock) { lock.release().catch(() => {}); lock = null; }
}

export const isKeepAwake = () => !!store.state.settings.keepAwake;

export function setKeepAwake(on) {
  store.state.settings.keepAwake = on;
  persist();
  on ? acquire() : release();
}

// À appeler au démarrage : le verrou saute quand l'appli passe en arrière-plan,
// on le reprend quand elle revient au premier plan.
export function initWakeLock() {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && isKeepAwake()) acquire();
  });
  if (isKeepAwake()) acquire();
}
