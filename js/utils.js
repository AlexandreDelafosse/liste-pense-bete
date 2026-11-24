// Petits outils utilisés partout.

export const DAY = 86400000; // une journée en millisecondes

// Raccourci pour document.getElementById
export const $ = id => document.getElementById(id);

// "Pâtes " → "pates" : pour comparer sans accents ni majuscules
export const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

// Protège le texte avant de l'insérer dans le HTML
export const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Majuscule au début
export const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

// Copie indépendante d'un objet
export const clone = o => JSON.parse(JSON.stringify(o));
