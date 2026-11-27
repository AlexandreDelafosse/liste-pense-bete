// Version de l'appli.
// À chaque mise à jour : ajoutez une entrée EN HAUT de la liste,
// mettez le même numéro dans sw.js (const CACHE = 'courses-v…') et dans CHANGELOG.md.
export const VERSIONS = [
  { v: '2.7', date: '27/11/2026', notes: ['Liste partagée : comptes, foyer et code d’invitation (Réglages → Liste partagée)', 'Synchro en temps réel entre les téléphones, même hors ligne'] },
  { v: '2.6', date: '24/11/2026', notes: ['Illustrations sur les tuiles pour une quarantaine d’articles courants', 'Correction : « Jus d’orange » est rangé dans Boissons'] },
  { v: '2.5', date: '24/11/2026', notes: ['Packs : ajoutez un groupe d’articles en une touche (Petit-déj, Placard, Maison…)', 'Créez, modifiez ou supprimez vos packs dans les réglages'] },
  { v: '2.4', date: '24/11/2026', notes: ['Plusieurs articles d’un coup : « lait, pain et œufs » crée 3 tuiles', 'Réglage « Garder l’écran allumé » pour le magasin'] },
  { v: '2.3', date: '24/11/2026', notes: ['Code réorganisé (aucun changement visible)'] },
  { v: '2.2', date: '23/11/2026', notes: ['Mises à jour reçues plus vite', 'Correction : le message « Annuler » ne dépasse plus en bas de l’écran'] },
  { v: '2.1', date: '23/11/2026', notes: ['Numéro de version et nouveautés dans les réglages'] },
  { v: '2.0', date: '23/11/2026', notes: ['« Il vous faut peut-être » : rappel des achats réguliers', 'Appui long sur une tuile : précision et changement de rayon', 'Ordre des rayons selon votre magasin', 'Sauvegarde : export et import'] },
  { v: '1.0', date: '23/11/2026', notes: ['Première version : tuiles, rayons automatiques, déjà achetés'] }
];

export const VERSION = VERSIONS[0].v;
