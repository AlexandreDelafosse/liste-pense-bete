# Liste pense-bête — règles du projet

Appli web personnelle d'Alexandre : un pense-bête de courses à tuiles, installée
sur son iPhone (PWA). Usage strictement personnel. Publiée par GitHub Pages
depuis la branche `main` : https://alexandredelafosse.github.io/liste-pense-bete/

## Règles de travail (non négociables)

1. **Ne jamais pousser (`git push`) sans l'accord explicite d'Alexandre**, quelle que
   soit la branche. Travailler et committer en local, montrer le résultat, attendre
   un « ok, push ».
2. **Une branche par modification majeure**, créée depuis `main`
   (`feature/…`, `fix/…`, `refacto/…`). Pour les petites corrections, demander
   à Alexandre s'il veut une branche ou un commit direct sur `main`.
3. **Avant de demander l'accord** : tester dans un navigateur, puis publier une
   page d'aperçu (artifact claude.ai) pour qu'Alexandre teste sur son iPhone.
   L'aperçu a ses propres données : sa vraie liste ne risque rien.
4. **Fusion dans `main`** : c'est Claude qui fusionne, après l'accord d'Alexandre.
5. **Commits petits et clairs, en français**, avec un préfixe :
   `feat:` nouveauté · `fix:` correction · `refacto:` réorganisation sans
   changement visible · `docs:` documentation · `style:` apparence · `chore:` divers.

## À chaque nouvelle version

- Ajouter une entrée **en haut** de `VERSIONS` dans `js/version.js`.
- Mettre le **même numéro** dans `sw.js` (`const CACHE = 'courses-vX.Y'`)
  — sinon les téléphones gardent l'ancienne version.
- Ajouter la version dans `CHANGELOG.md`.
- Si un fichier est ajouté ou renommé, mettre à jour la liste `FILES` de `sw.js`.

## Conventions

- Textes de l'interface : **vouvoiement**, ton comme pour un client.
- Conversation avec Alexandre : tutoiement, explications courtes.
- HTML/CSS/JS sans framework ni étape de build ; modules ES (`type="module"`).
- Données dans le `localStorage` du téléphone (clé `courses-v1`) : ne jamais
  changer la clé ni le format sans migration (voir `fix()` dans `js/store.js`).
- Doit marcher hors ligne (service worker `sw.js`) et sur iPhone (encoche,
  barre du bas : `env(safe-area-inset-*)`).

## Organisation du code

```
index.html            page unique
manifest.json         nom, icône, couleurs de l'appli installée
sw.js                 mode hors ligne + mises à jour
css/style.css         apparence
icons/                icônes de l'appli
js/main.js            démarrage, branchement des boutons
js/version.js         numéro de version et nouveautés
js/utils.js           petits outils (normaliser, échapper…)
js/aisles.js          rayons, couleurs, mots-clés, devinette du rayon
js/store.js           données : chargement, enregistrement, export/import
js/actions.js         ajouter, acheter, retirer, annuler
js/suggestions.js     « Il vous faut peut-être » et autocomplétion
js/ui/render.js       affichage de la liste
js/ui/toast.js        message du bas (« Annuler »)
js/ui/sheets.js       fenêtres du bas : modifier un article, réglages
```
