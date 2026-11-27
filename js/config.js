// Connexion à Supabase (liste partagée).
// L'adresse et la clé « anon / publishable » sont faites pour être publiques :
// ce sont les règles de sécurité de la base (supabase/schema.sql) qui protègent les données.
// NE JAMAIS mettre ici la clé « service_role » / « secret ».
export const SUPABASE_URL = 'https://cnxigqggnqhpgjyookdh.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_zIpvtPNjhVgVOsXMYfQoBg_ugbQwLrN';

// Version de la bibliothèque Supabase (fixée pour éviter les surprises)
export const SUPABASE_LIB = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.0/+esm';

export const cloudConfigured = () => !!(SUPABASE_URL && SUPABASE_KEY);
