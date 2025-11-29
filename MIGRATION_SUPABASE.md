# Migration vers Supabase

Ce document explique la migration de l'application de localStorage vers Supabase pour synchroniser les données entre tous les appareils.

## 🎯 Objectif

Remplacer le stockage localStorage par une base de données Supabase centralisée pour:
- Synchroniser les données entre tous les ordinateurs
- Permettre l'accès depuis n'importe quel appareil
- Améliorer la sécurité avec Row Level Security (RLS)
- Faciliter les sauvegardes et la récupération des données

## 📊 Structure de la base de données

### Tables créées

1. **users** - Profils utilisateurs (admin et étudiants)
   - email, name, role, pin, filiere, zalo, status
   
2. **exercises** - Tous les exercices (CE, CO, grammaire, lexique)
   - id, type, niveau, theme, titre, texte, audio, questions (JSONB)
   
3. **exercise_attempts** - Résultats des tentatives d'exercices
   - user_id, exercise_id, score, max_score, percentage, time_spent, answers
   
4. **messages** - Communication admin-étudiants
   - sender_id, content, recipients (JSONB), group_id, is_group_message
   
5. **registration_requests** - Demandes d'inscription en attente
   - email, name, pin, filiere, zalo, explanation, status
   
6. **external_resources** - Ressources partagées
   - titre, description, url, categorie

## 🔐 Sécurité

Toutes les tables utilisent Row Level Security (RLS) avec des politiques appropriées:
- Les étudiants peuvent lire leurs propres données
- Les admins ont accès complet à toutes les données
- Lecture publique pour les exercices et ressources

## 🚀 Fichiers modifiés

### Nouveaux fichiers
- `lib/supabase-client.js` - Bibliothèque client Supabase
- `scripts/001_create_database_schema.sql` - Schéma de la base de données
- `scripts/002_insert_default_admin.sql` - Compte admin par défaut
- `scripts/migrate-localstorage-to-supabase.js` - Script de migration des données
- `test-supabase.html` - Page de test de l'intégration
- `migrate.html` - Page de migration des données

### Fichiers mis à jour
- `login.html` - Authentification avec Supabase
- `admin.html` - Interface admin avec Supabase
- `dashboard.html` - Dashboard étudiant avec Supabase
- `exercise.html` - Page d'exercice avec Supabase
- `builder.html` - Création d'exercices avec Supabase

## 📝 Comptes par défaut

Deux comptes admin ont été créés:

### Compte administrateur principal
- **Email**: toanvtk@hcmue.edu.vn
- **PIN**: 257000 (6 chiffres)

### Compte administrateur secondaire
- **Email**: admin@francais.app
- **PIN**: 123456 (6 chiffres)

⚠️ **Important**: Les PINs doivent contenir exactement **6 chiffres**. Vous pouvez changer votre PIN après connexion dans l'interface admin.

## 🔄 Migration des données existantes

Si vous avez des données existantes dans localStorage, utilisez la page de migration:

1. Ouvrez `migrate.html` dans votre navigateur
2. Cliquez sur "Scanner localStorage" pour voir vos données locales
3. Cliquez sur "Lancer la migration" pour transférer tout vers Supabase
4. Attendez la fin de la migration (suivez les logs en temps réel)

Le script va automatiquement:
- Migrer tous les utilisateurs
- Migrer tous les exercices (avec conversion de format)
- Migrer tous les résultats d'exercices
- Migrer tous les messages
- Migrer toutes les demandes d'inscription
- Migrer toutes les ressources externes

## ✅ Tests

Une page de test complète est disponible: `test-supabase.html`

Elle permet de tester:
- La connexion à Supabase
- La lecture/écriture des utilisateurs
- La lecture/écriture des exercices
- La lecture/écriture des messages
- La lecture/écriture des inscriptions
- Un test complet de toutes les fonctionnalités

## 🔧 Configuration

Les variables d'environnement suivantes sont configurées automatiquement:
- `SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 📚 Utilisation de la bibliothèque client

\`\`\`javascript
// Inclure la bibliothèque dans vos pages HTML
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="lib/supabase-client.js"></script>

// Utiliser les méthodes disponibles
// Utilisateurs
await window.SupabaseDB.users.getAll()
await window.SupabaseDB.users.getByEmail(email)
await window.SupabaseDB.users.create(userData)
await window.SupabaseDB.users.update(userId, updates)

// Exercices
await window.SupabaseDB.exercises.getAll()
await window.SupabaseDB.exercises.getByType(type)
await window.SupabaseDB.exercises.create(exerciseData)
await window.SupabaseDB.exercises.saveAttempt(userId, exerciseId, result)

// Messages
await window.SupabaseDB.messages.getAll()
await window.SupabaseDB.messages.getForUser(userId)
await window.SupabaseDB.messages.send(messageData)

// Inscriptions
await window.SupabaseDB.registrations.getAll()
await window.SupabaseDB.registrations.create(requestData)
await window.SupabaseDB.registrations.approve(requestId)

// Ressources
await window.SupabaseDB.resources.getAll()
await window.SupabaseDB.resources.create(resourceData)
\`\`\`

## 🎉 Avantages de la migration

1. **Synchronisation multi-appareils**: Accédez aux mêmes données depuis n'importe quel ordinateur
2. **Pas de perte de données**: Les données ne sont plus liées au navigateur
3. **Meilleure sécurité**: RLS et politiques de sécurité au niveau de la base de données
4. **Performance**: Requêtes optimisées et indexation
5. **Évolutivité**: Prêt pour des milliers d'utilisateurs
6. **Sauvegardes automatiques**: Les données sont sauvegardées par Supabase

## 🐛 Dépannage

### La connexion échoue
- Vérifiez que les variables d'environnement sont bien configurées
- Vérifiez que le projet Supabase est actif
- Consultez les logs dans la console du navigateur

### Les données ne s'affichent pas
- Ouvrez `test-supabase.html` pour tester la connexion
- Vérifiez que les politiques RLS sont correctement configurées
- Consultez les logs Supabase dans le dashboard

### Erreur de migration
- Vérifiez que vous êtes connecté avec un compte admin
- Assurez-vous que les données localStorage existent
- Consultez les erreurs dans la console

## 📞 Support

Pour toute question ou problème:
1. Consultez les logs dans la console du navigateur (F12)
2. Testez avec `test-supabase.html`
3. Vérifiez la documentation Supabase: https://supabase.com/docs
