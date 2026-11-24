// Rayons : nom, couleur des tuiles, mots-clés pour ranger automatiquement.
import { norm } from './utils.js';

export const AISLES = [
  { k: 'fl', n: 'Fruits & légumes', c: '#9fd68b', w: 'pomme poire banane orange citron fraise raisin kiwi tomate salade carotte oignon ail courgette poivron concombre patate avocat champignon poireau brocoli épinard haricot fruit légume persil basilic échalote melon pêche abricot clémentine mandarine chou' },
  { k: 'fr', n: 'Frais & crèmerie', c: '#bfe0f5', w: 'lait beurre yaourt fromage oeuf œuf crème jambon lardon emmental mozzarella comté parmesan feta skyr compote' },
  { k: 'vp', n: 'Viande & poisson', c: '#f6b3a6', w: 'poulet boeuf bœuf steak viande porc saucisse saumon thon poisson crevette dinde escalope haché merguez cabillaud' },
  { k: 'bo', n: 'Boulangerie', c: '#f4cf8e', w: 'pain baguette brioche croissant biscotte' },
  { k: 'ep', n: 'Épicerie', c: '#f7e17e', w: 'pâtes riz farine sucre sel poivre huile vinaigre café thé céréales chocolat confiture miel sauce ketchup moutarde mayonnaise conserve lentille semoule biscuit gâteau épice levure bouillon nutella' },
  { k: 'bs', n: 'Boissons', c: '#c9c2f2', w: 'eau jus vin bière soda coca sirop' },
  { k: 'su', n: 'Surgelés', c: '#a9e6e0', w: 'surgelé glace frites pizza' },
  { k: 'ma', n: 'Maison & hygiène', c: '#f3bfe0', w: 'pq papier toilette sopalin essuie-tout lessive vaisselle éponge savon gel douche shampoing dentifrice brosse poubelle couche lingette mouchoir déodorant javel nettoyant pile ampoule' },
  { k: 'au', n: 'Autres', c: '#e3dad3', w: '' }
];

// Rayon à partir de sa clé ('fl', 'fr'…) ; « Autres » si inconnu
export const aisle = k => AISLES.find(a => a.k === k) || AISLES[AISLES.length - 1];

// Devine le rayon : d'abord les corrections de l'utilisateur, puis les mots-clés
// ("Pommes de terre" → Fruits & légumes)
export function guessAisle(name, custom = {}) {
  const k = norm(name);
  if (custom[k]) return custom[k];
  const words = k.split(/[\s'’-]+/);
  // Le premier mot reconnu décide : « jus d'orange » → Boissons, pas Fruits
  for (const x of words) {
    for (const a of AISLES) {
      for (const w of a.w.split(' ')) {
        const ww = norm(w);
        if (ww && (x === ww || x === ww + 's' || x === ww + 'x')) return a.k;
      }
    }
  }
  return 'au';
}

// Mots-clés proposés pendant la frappe
export const keywords = () => AISLES.flatMap(a => a.w.split(' ').filter(w => w.length > 2));
