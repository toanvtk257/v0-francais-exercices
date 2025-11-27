# Plateforme d'apprentissage du français

## Description
Plateforme complète d'apprentissage du français avec exercices de lecture et d'écoute, système d'authentification, suivi des progrès et tableaux de bord pour étudiants et administrateurs.

## 🆕 Système de points
Chaque question peut avoir un nombre de points personnalisé. Les étudiants voient leur score en points (ex: 15/20 points) et en pourcentage après chaque exercice.

## Fonctionnalités

### Pour les étudiants
- Inscription et connexion sécurisées
- Exercices de lecture et d'écoute par niveau CECRL (A1-C2)
- Types de questions : QCM, Vrai/Faux, Textes à trous
- Système de points personnalisés par question
- Sauvegarde automatique des brouillons
- Chronomètre pour suivre le temps passé
- Statistiques détaillées et graphiques de progression
- Possibilité de refaire les exercices
- Accès aux transcriptions après soumission

### Pour les administrateurs
- Panneau d'administration complet
- Gestion des exercices (ajout, modification, suppression)
- Définition des points pour chaque question
- Import/export de banques de questions (JSON)
- Gestion des utilisateurs
- Statistiques globales avec graphiques
- Suivi de l'activité des étudiants

## Installation

1. Téléchargez tous les fichiers dans un dossier
2. **Créez un dossier `audio/`** dans le même répertoire pour les fichiers audio
3. Ouvrez `login.html` dans votre navigateur
4. Utilisez les comptes par défaut :
   - **Admin** : admin@example.com / admin123
   - **Étudiant** : jean@example.com / student123

## 📚 Guide d'utilisation

**Pour apprendre à ajouter des points aux questions, ouvrez `GUIDE.html` dans votre navigateur.**

Ce guide contient des instructions détaillées avec des exemples visuels.

## Structure des fichiers

\`\`\`
/
├── login.html          # Page de connexion/inscription
├── dashboard.html      # Tableau de bord étudiant
├── exercise.html       # Interface d'exercice
├── admin.html          # Panneau d'administration
├── builder.html        # Créateur d'exercices avec système de points
├── GUIDE.html          # Guide d'utilisation détaillé (NOUVEAU)
├── lib/
│   └── stats.js        # Système de statistiques
├── data/
│   └── questions.json  # Banque de questions (exemple)
└── audio/              # Dossier pour les fichiers audio MP3
    ├── a1_salutations_01.mp3
    ├── a2_voyages_01.mp3
    └── ...
\`\`\`

## Utilisation

### Étudiants
1. Connectez-vous avec votre compte
2. Parcourez les exercices disponibles par niveau et type
3. Cliquez sur "Commencer" pour démarrer un exercice
4. Répondez aux questions et cliquez sur "Soumettre"
5. Consultez vos statistiques et graphiques de progression

### Administrateurs
1. Connectez-vous avec un compte admin
2. Accédez au panneau d'administration
3. Importez une banque de questions JSON ou créez des exercices
4. Gérez les utilisateurs et consultez les statistiques globales

## 🎵 Ajouter des fichiers audio

Pour les exercices d'écoute :

1. **Créez un dossier `audio/`** dans le même répertoire que vos fichiers HTML
2. **Placez vos fichiers MP3** dans ce dossier (ex: `audio/a1_salutations_01.mp3`)
3. **Référencez l'audio** dans le builder ou l'admin avec le chemin : `audio/nom_du_fichier.mp3`

### Conseils pour les fichiers audio :
- ✅ Format recommandé : **MP3**
- ✅ Nommage descriptif : `a1_salutations_01.mp3`, `b2_actualites_03.mp3`
- ✅ Durée : 2-5 minutes maximum
- ✅ Qualité : 128 kbps minimum

**Consultez GUIDE.html pour des instructions détaillées.**

## Format JSON des exercices

### Exercice de lecture
\`\`\`json
{
  "id": "lec_a1_01",
  "niveau": "A1",
  "theme": "Salutations",
  "titre": "Bonjour !",
  "passage_html": "<p>Texte à lire...</p>",
  "qcm": [
    {
      "question": "Question ?",
      "a": "Réponse A",
      "b": "Réponse B",
      "c": "Réponse C",
      "answer": "a",
      "points": 2
    }
  ],
  "vf": [
    {
      "statement": "Énoncé",
      "answer": "vrai",
      "keywords": ["mot1", "mot2"],
      "points": 3
    }
  ]
}
\`\`\`

### Exercice d'écoute
\`\`\`json
{
  "id": "eco_a1_01",
  "niveau": "A1",
  "theme": "Salutations",
  "titre": "Écoute simple",
  "audio": "audio/sample.mp3",
  "qcm": [
    {
      "question": "Question ?",
      "a": "Réponse A",
      "b": "Réponse B",
      "c": "Réponse C",
      "answer": "a",
      "points": 2
    }
  ],
  "cloze": "Texte avec [réponses] à [compléter].",
  "cloze_points": [2, 3, 2],
  "transcription": "Transcription complète..."
}
\`\`\`

## Comment ajouter des points aux questions

### Méthode 1 : Formulaire (Recommandé)
1. Ouvrez `builder.html`
2. Remplissez les informations de base (Niveau, Thème, Titre)
3. Cliquez sur **"+ Ajouter une question"**
4. Remplissez la question et les choix
5. Dans le champ **"Points"** (en bas à droite), entrez le nombre de points
6. Cliquez sur **"Ajouter à la banque"**

### Méthode 2 : Importation en masse
Format avec points à la fin de chaque ligne :
- **QCM** : `Question ; choix A ; choix B ; choix C ; réponse ; points`
- **VF** : `Énoncé ; vrai|faux ; mots-clés ; points`
- **Cloze** : Points séparés par des virgules dans le champ dédié

**Consultez GUIDE.html pour des instructions détaillées avec captures d'écran.**

## Stockage local

Toutes les données sont stockées localement dans le navigateur (localStorage) :
- `fr_users_db` : Base de données des utilisateurs
- `fr_auth_user` : Utilisateur connecté
- `fr_bank_data` : Banque de questions
- `fr_stats_{userId}` : Statistiques par utilisateur
- `fr_drafts_{userId}_{lessonId}` : Brouillons sauvegardés

## Technologies utilisées

- HTML5 / CSS3
- JavaScript vanilla (pas de frameworks)
- Canvas API pour les graphiques
- LocalStorage pour la persistance des données

## Notes importantes

- Fonctionne 100% hors ligne après le premier chargement
- Aucune connexion internet requise
- Les données restent sur l'ordinateur local
- Compatible avec tous les navigateurs modernes

## Support

Pour toute question ou problème, consultez la documentation ou contactez l'administrateur système.
