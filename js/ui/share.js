// Fenêtre « Liste partagée » : compte, foyer, code d'invitation.
import { cloudConfigured } from '../config.js';
import { frenchError } from '../cloud/client.js';
import { currentUser, signUp, signIn, sendReset, setNewPassword, signOut, passwordProblem, onAuthEvent } from '../cloud/account.js';
import { isShared, currentFoyer, createFoyer, joinFoyer, findMyFoyer, attachExisting, startSync } from '../cloud/sync.js';
import { toast } from './toast.js';
import { $, esc } from '../utils.js';

let openSheetFn = () => {}, closeSheetsFn = () => {};
const body = () => $('shareBody');

// Petit texte dans les réglages
export function shareSummary() {
  if (!cloudConfigured()) return 'Pas encore disponible.';
  return isShared() ? `Partagée avec votre foyer « ${currentFoyer().nom} ».` : 'Votre liste est enregistrée sur ce téléphone uniquement.';
}

export async function openShare() {
  closeSheetsFn();
  openSheetFn('share');
  if (!cloudConfigured()) return view('<h2>Liste partagée</h2><p class="sub">Le partage n’est pas encore configuré.</p>' + closeBtn());
  view('<h2>Liste partagée</h2><p class="sub">Chargement…</p>');
  let user = null;
  try { user = await currentUser(); } catch (e) {}
  if (!user) return authView('login');
  if (isShared()) return foyerView(user);
  return chooseView(user);
}

// ---------- Écrans ----------

function view(html) { body().innerHTML = html; }
const closeBtn = () => '<div class="row"><button type="button" class="primary" data-close>Fermer</button></div>';
const errLine = () => '<p class="err" id="shErr" role="alert"></p>';
const setErr = m => { const e = $('shErr'); if (e) e.textContent = m; };
const busy = (form, on) => form.querySelectorAll('button').forEach(b => { b.disabled = on; });

function authView(mode) {
  const signup = mode === 'signup';
  view(`<h2>${signup ? 'Créer un compte' : 'Se connecter'}</h2>
    <p class="sub">${signup
      ? 'Un compte par personne. Vous recevrez un e-mail pour confirmer votre adresse.'
      : 'Connectez-vous pour partager la liste avec votre foyer.'}</p>
    <form id="shForm" novalidate>
      <label class="field">E-mail<input id="shEmail" type="email" autocomplete="email" inputmode="email" required></label>
      <label class="field">Mot de passe<input id="shPass" type="password" autocomplete="${signup ? 'new-password' : 'current-password'}" required minlength="8"></label>
      ${signup ? '<p class="sub">Au moins 8 caractères, avec des lettres et des chiffres.</p>' : ''}
      ${errLine()}
      <div class="row"><button type="submit" class="primary">${signup ? 'Créer mon compte' : 'Se connecter'}</button></div>
    </form>
    <div class="links">
      <button type="button" class="link" data-mode="${signup ? 'login' : 'signup'}">${signup ? 'J’ai déjà un compte' : 'Créer un compte'}</button>
      ${signup ? '' : '<button type="button" class="link" data-mode="reset">Mot de passe oublié ?</button>'}
    </div>
    <div class="row"><button type="button" class="ghost" data-close>Fermer</button></div>`);
  $('shForm').addEventListener('submit', async e => {
    e.preventDefault();
    const email = $('shEmail').value.trim(), pass = $('shPass').value;
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr('Adresse e-mail invalide.');
    if (signup && passwordProblem(pass)) return setErr(passwordProblem(pass));
    if (!pass) return setErr('Indiquez votre mot de passe.');
    busy(e.target, true);
    try {
      if (signup) {
        const connected = await signUp(email, pass);
        if (connected) return openShare();
        return view(`<h2>Vérifiez vos e-mails</h2>
          <p>Un lien de confirmation a été envoyé à <b>${esc(email)}</b>.</p>
          <p class="sub">Cliquez sur ce lien, puis revenez dans l’appli et connectez-vous.</p>
          <div class="row"><button type="button" class="primary" data-mode="login">Se connecter</button></div>`);
      }
      await signIn(email, pass);
      await afterLogin();
    } catch (err) { setErr(frenchError(err)); busy(e.target, false); }
  });
}

function resetView() {
  view(`<h2>Mot de passe oublié</h2>
    <p class="sub">Indiquez votre e-mail : vous recevrez un lien pour choisir un nouveau mot de passe.</p>
    <form id="shForm" novalidate>
      <label class="field">E-mail<input id="shEmail" type="email" autocomplete="email" inputmode="email"></label>
      ${errLine()}
      <div class="row"><button type="button" class="ghost" data-mode="login">Retour</button><button type="submit" class="primary">Envoyer le lien</button></div>
    </form>`);
  $('shForm').addEventListener('submit', async e => {
    e.preventDefault();
    const email = $('shEmail').value.trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr('Adresse e-mail invalide.');
    busy(e.target, true);
    try {
      await sendReset(email);
      view(`<h2>Lien envoyé</h2><p class="sub">Si un compte existe pour <b>${esc(email)}</b>, un e-mail vient de partir. Ouvrez le lien pour choisir un nouveau mot de passe.</p>${closeBtn()}`);
    } catch (err) { setErr(frenchError(err)); busy(e.target, false); }
  });
}

function newPasswordView() {
  openSheetFn('share');
  view(`<h2>Nouveau mot de passe</h2>
    <form id="shForm" novalidate>
      <label class="field">Nouveau mot de passe<input id="shPass" type="password" autocomplete="new-password"></label>
      <p class="sub">Au moins 8 caractères, avec des lettres et des chiffres.</p>
      ${errLine()}
      <div class="row"><button type="submit" class="primary">Enregistrer</button></div>
    </form>`);
  $('shForm').addEventListener('submit', async e => {
    e.preventDefault();
    const pass = $('shPass').value;
    if (passwordProblem(pass)) return setErr(passwordProblem(pass));
    busy(e.target, true);
    try {
      await setNewPassword(pass);
      view(`<h2>Mot de passe changé</h2><p class="sub">Vous pouvez maintenant vous connecter dans l’appli avec ce nouveau mot de passe.</p>${closeBtn()}`);
    } catch (err) { setErr(frenchError(err)); busy(e.target, false); }
  });
}

// Juste connecté : si le compte a déjà un foyer, on le rejoint directement
async function afterLogin() {
  const f = await findMyFoyer();
  if (f) {
    const n = await attachExisting(f);
    toast(n ? `Liste partagée retrouvée · ${n} article${n > 1 ? 's' : ''} de ce téléphone ajouté${n > 1 ? 's' : ''}` : 'Liste partagée retrouvée');
  }
  openShare();
}

function chooseView(user) {
  view(`<h2>Liste partagée</h2>
    <p class="sub">Connecté : ${esc(user.email)}</p>
    <h3>Créer un foyer</h3>
    <p class="sub">Votre liste actuelle, vos packs et votre historique y seront envoyés.</p>
    <form id="shCreate" novalidate>
      <label class="field">Nom du foyer<input id="shName" type="text" value="Notre foyer" maxlength="40"></label>
      <div class="row"><button type="submit" class="primary">Créer le foyer</button></div>
    </form>
    <h3>Ou rejoindre un foyer</h3>
    <p class="sub">Entrez le code donné par l’autre personne. Les articles de ce téléphone seront ajoutés à la liste du foyer.</p>
    <form id="shJoin" novalidate>
      <label class="field">Code d’invitation<input id="shCode" type="text" maxlength="6" autocapitalize="characters" autocomplete="off" spellcheck="false" placeholder="A1B2C3" class="code-input"></label>
      <div class="row"><button type="submit" class="primary">Rejoindre</button></div>
    </form>
    ${errLine()}
    <div class="row"><button type="button" class="ghost" data-logout>Se déconnecter</button></div>`);
  $('shCreate').addEventListener('submit', async e => {
    e.preventDefault();
    busy(e.target, true);
    try { await createFoyer($('shName').value); toast('Foyer créé : votre liste est maintenant partagée'); openShare(); }
    catch (err) { setErr(frenchError(err)); busy(e.target, false); }
  });
  $('shJoin').addEventListener('submit', async e => {
    e.preventDefault();
    const code = $('shCode').value.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(code)) return setErr('Le code fait 6 caractères.');
    busy(e.target, true);
    try {
      const n = await joinFoyer(code);
      toast(n ? `Foyer rejoint · ${n} article${n > 1 ? 's' : ''} ajouté${n > 1 ? 's' : ''}` : 'Foyer rejoint');
      openShare();
    } catch (err) { setErr(frenchError(err)); busy(e.target, false); }
  });
}

function foyerView(user) {
  const f = currentFoyer();
  view(`<h2>Liste partagée</h2>
    <p class="sub">Foyer « ${esc(f.nom)} » · connecté : ${esc(user.email)}</p>
    <h3>Code d’invitation</h3>
    <p class="code" id="shShow">${esc(f.code)}</p>
    <p class="sub">Donnez ce code à la personne avec qui partager la liste. Dans son appli : Réglages → Liste partagée → Créer un compte, puis « Rejoindre un foyer ».</p>
    <div class="row"><button type="button" class="ghost" id="shCopy">Copier le code</button></div>
    ${errLine()}
    <div class="row"><button type="button" class="ghost" data-logout>Se déconnecter</button><button type="button" class="primary" data-close>Fermer</button></div>`);
  $('shCopy').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(f.code); toast('Code copié'); } catch (e) { toast(`Code : ${f.code}`); }
  });
}

// ---------- Branchement ----------

export function initShare({ openSheet, closeSheets }) {
  openSheetFn = openSheet;
  closeSheetsFn = closeSheets;
  body().addEventListener('click', async e => {
    const m = e.target.closest('[data-mode]');
    if (m) { m.dataset.mode === 'reset' ? resetView() : authView(m.dataset.mode); return; }
    if (e.target.closest('[data-close]')) { closeSheetsFn(); return; }
    if (e.target.closest('[data-logout]')) {
      if (!confirm('Se déconnecter ? La liste restera sur ce téléphone, mais ne sera plus partagée.')) return;
      await signOut();
      toast('Déconnecté : la liste n’est plus partagée sur ce téléphone');
      openShare();
    }
  });

  if (!cloudConfigured()) return;
  // Retour depuis un lien d'e-mail (confirmation d'adresse ou mot de passe oublié)
  const fromEmail = /type=(signup|recovery|email)/.test(location.hash) || /type=(signup|recovery)/.test(location.search);
  if (fromEmail || isShared()) {
    onAuthEvent(event => {
      if (event === 'PASSWORD_RECOVERY') newPasswordView();
      else if (event === 'SIGNED_IN' && /type=signup/.test(location.hash + location.search)) {
        toast('Adresse e-mail confirmée : vous pouvez vous connecter dans l’appli');
        history.replaceState(null, '', location.pathname);
      }
    });
  }
  if (isShared()) startSync();
}
