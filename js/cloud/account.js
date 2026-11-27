// Compte utilisateur : inscription, connexion, mot de passe, déconnexion.
import { getClient, appUrl } from './client.js';
import { leaveSharing } from './sync.js';

async function auth() {
  const c = await getClient();
  if (!c) throw new Error('Failed to fetch');
  return c.auth;
}

// Règle locale, en plus de celle de Supabase : 8 caractères minimum, lettres et chiffres
export function passwordProblem(p) {
  if (p.length < 8) return 'Le mot de passe doit faire au moins 8 caractères.';
  if (!/[a-zA-Z]/.test(p) || !/[0-9]/.test(p)) return 'Le mot de passe doit contenir des lettres et des chiffres.';
  return '';
}

export async function currentUser() {
  const c = await getClient();
  if (!c) return null;
  const { data } = await c.auth.getSession();
  return data && data.session ? data.session.user : null;
}

// Inscription : Supabase envoie un e-mail de confirmation (le lien ramène à l'appli)
export async function signUp(email, password) {
  const a = await auth();
  const { data, error } = await a.signUp({ email, password, options: { emailRedirectTo: appUrl() } });
  if (error) throw error;
  return !!data.session; // true si connecté tout de suite (confirmation désactivée)
}

export async function signIn(email, password) {
  const a = await auth();
  const { error } = await a.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function sendReset(email) {
  const a = await auth();
  const { error } = await a.resetPasswordForEmail(email, { redirectTo: appUrl() });
  if (error) throw error;
}

export async function setNewPassword(password) {
  const a = await auth();
  const { error } = await a.updateUser({ password });
  if (error) throw error;
}

// Déconnexion : le téléphone garde une copie de la liste, mais ne la partage plus
export async function signOut() {
  await leaveSharing();
  const c = await getClient();
  if (c) await c.auth.signOut();
}

// Prévient quand Supabase ouvre l'appli depuis un lien d'e-mail
export async function onAuthEvent(fn) {
  const c = await getClient();
  if (c) c.auth.onAuthStateChange((event, session) => fn(event, session));
}
