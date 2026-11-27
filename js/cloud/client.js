// Client Supabase, chargé seulement quand on en a besoin
// (l'appli démarre donc toujours, même hors ligne ou sans liste partagée).
import { SUPABASE_URL, SUPABASE_KEY, SUPABASE_LIB, cloudConfigured } from '../config.js';

let client = null;
let loading = null;

export const appUrl = () => location.origin + location.pathname;

// Renvoie le client Supabase, ou null s'il ne peut pas être chargé (hors ligne, non configuré)
export function getClient() {
  if (client) return Promise.resolve(client);
  if (!cloudConfigured()) return Promise.resolve(null);
  if (!loading) {
    loading = import(SUPABASE_LIB)
      .then(({ createClient }) => {
        client = createClient(SUPABASE_URL, SUPABASE_KEY, {
          auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'courses-auth' }
        });
        return client;
      })
      .catch(() => { loading = null; return null; }); // on réessaiera plus tard
  }
  return loading;
}

// Message d'erreur Supabase → phrase compréhensible
export function frenchError(e) {
  const m = String((e && (e.message || e.error_description)) || e || '');
  if (/invalid login credentials/i.test(m)) return 'E-mail ou mot de passe incorrect.';
  if (/email not confirmed/i.test(m)) return 'Adresse e-mail pas encore confirmée : cliquez sur le lien reçu par e-mail.';
  if (/already registered|already exists/i.test(m)) return 'Un compte existe déjà avec cette adresse. Connectez-vous.';
  if (/password should be|weak password|at least/i.test(m)) return 'Mot de passe trop faible : au moins 8 caractères, avec des lettres et des chiffres.';
  if (/rate limit|too many/i.test(m)) return 'Trop d’essais. Patientez quelques minutes.';
  if (/code inconnu/i.test(m)) return 'Ce code ne correspond à aucun foyer.';
  if (/failed to fetch|network|load failed/i.test(m)) return 'Pas de connexion internet.';
  return 'Une erreur est survenue. Réessayez.';
}
