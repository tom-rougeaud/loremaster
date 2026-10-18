# Lore Master

Quiz fantasy en direct : un **MJ** ouvre un **donjon** (code à 4 caractères + QR code), jusqu’à 30 **aventuriers** le rejoignent depuis leur téléphone.
Trois modes : *Chacun sa quête*, *Duel de guildes*, *Les Aventuriers contre le MJ*. Questions en QCM, vrai ou faux et estimation au curseur, rangées par royaumes et par thèmes, chacune avec sa source.

Licence CC BY-NC 4.0. « D&D » est une marque de Wizards of the Coast, sans lien avec cet outil.

## Déploiement (GitHub Pages)
1. Déposer le contenu de `dist/` (ou le site déjà construit à la racine du dépôt) sur la branche `main`, puis *Settings › Pages › Deploy from a branch › main / (root)*.
2. Supabase (tables préfixées `lm_`, compatibles avec un projet déjà utilisé par d’autres applications) : SQL Editor › coller `lore_master.sql` › Run. À faire une seule fois (rejouable sans risque).
3. `config.js` contient l’URL et la clé publique `anon`/`publishable` du projet. Jamais de clé `service_role`.
4. Ouvrir `mj.html` : la pastille doit afficher « Base connectée ».

Pages : `index.html` (accueil), `mj.html` (espace MJ), `joueur.html` (aventuriers), `contact.html`, `confidentialite.html`.

## Construire depuis les sources
```
npm install            # polices (OFL) et bibliothèques, intégrées dans les pages : aucun CDN
python3 build.py       # écrit dist/ et build/quiz.json
node test/bank_test.js # valide les 1 260 questions, la non-répétition, les filtres
```
Pour un test complet avec Postgres local : `bash test/start_env.sh` puis `python3 test/e2e_lm.py solo duel boss`.

## Ajouter des questions
Déposer un fichier `quiz/<thème>.json` (schéma `quiz-bestiaire/1`), l’ajouter à `quiz/index.json`, relancer `python3 build.py`.
Les royaumes (ordre, couleur, icône) sont dans `src/royaumes.json`, les icônes de thèmes dans `src/icons.js`.
Un thème marqué `sombre` (horreur, occulte…) n’apparaît que si le MJ active l’option.

## Apparence
9 thèmes visuels (`html[data-theme]`) × 4 jeux de polices (`html[data-font]`) dans `src/theme.css`, choix mémorisé sur l’appareil (menu *Apparence*).
