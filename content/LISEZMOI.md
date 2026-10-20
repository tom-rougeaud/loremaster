# Rédaction des 100 thèmes — mode d’emploi (pour reprendre à tout moment)

1. **Registre** : `registre.tsv` (n°, id, préfixe des identifiants, royaume, icône, sombre, nom affiché) et `royaumes.tsv`.
2. **Rédaction** : un dossier par thème, `content/NNN/` (ex. `content/023/`), avec un ou plusieurs fichiers `.lm`
   lus dans l’ordre alphabétique (`a.lm`, `b.lm`, `c.lm`…). On n’ajoute qu’**à la fin** pour que les identifiants restent stables.
   Le format est décrit en tête de `tools/lm_compile.py`. La bonne réponse est toujours écrite en premier : le jeu mélange les propositions à chaque affichage.
3. **Thèmes historiques** (bestiaire, races, classes, sorts, mythologie grecque) : la base gelée est dans `quiz_base/` ;
   les fichiers `.lm` la complètent (`- id` retire une question, `~id = …` remplace une explication). Corrections tracées dans `tools/base_fixes.py`.
4. **Compiler et contrôler** : `python3 tools/lm_compile.py` (écrit `quiz/` et le tableau `PROGRESS.md`, bloque en cas d’erreur),
   puis `python3 build.py`, `node test/bank_test.js` et `node test/content_test.js` (position de la bonne réponse, équilibre vrai/faux, part de classiques par salve).
5. **Règles** : 150 questions par thème ; 45 à 60 % de classiques (QCM + vrai/faux) ; au moins 6 questions de chaque nouveau format
   (trous, intrus, multi, ordre, association) ; vrais/faux entre 40 et 60 % de « vrai » ; une explication (2 phrases environ) et une source par question.
6. **Doutes** : tout point incertain est noté dans `A_VERIFIER.md` puis contrôlé.
7. **Sauvegarde** : la branche `redaction` du dépôt GitHub reçoit le travail après chaque thème ; `main` (le site en ligne) à la fin de chaque royaume.
