DOSSIER AUDIO - Instructions
=============================

Placez vos fichiers audio MP3 dans ce dossier.

Format supporté: MP3
Exemple de nom de fichier: ex1.mp3, lecon_a1_01.mp3, etc.

Comment référencer les fichiers audio:
--------------------------------------

1. Dans le fichier builder.html ou admin.html:
   - Pour un exercice d'écoute, entrez le chemin: audio/nom_du_fichier.mp3
   - Exemple: audio/ex1.mp3

2. Dans le fichier data/questions.json:
   - Ajoutez la propriété "audio" avec le chemin complet
   - Exemple: "audio": "audio/ex1.mp3"

Structure recommandée:
---------------------
audio/
  ├── a1_salutations_01.mp3
  ├── a1_salutations_02.mp3
  ├── a2_voyages_01.mp3
  ├── b1_actualites_01.mp3
  └── ...

Conseils:
---------
- Utilisez des noms de fichiers descriptifs
- Incluez le niveau CEFR dans le nom (a1, a2, b1, etc.)
- Gardez les fichiers audio courts (2-5 minutes maximum)
- Assurez-vous que la qualité audio est bonne (au moins 128 kbps)
