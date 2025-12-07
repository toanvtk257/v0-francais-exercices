# Configuration Cloudinary

Cloudinary sera utilisé pour stocker les fichiers audio et images de l'application.

## Étapes de configuration

### 1. Créer un compte Cloudinary
1. Allez sur [cloudinary.com](https://cloudinary.com)
2. Créez un compte gratuit (10 GB de stockage gratuit)

### 2. Obtenir vos credentials
1. Dans le dashboard Cloudinary, trouvez votre **Cloud Name**
2. Allez dans Settings → Upload → Upload Presets
3. Utilisez le preset existant **francais_exercices** (Mode: Unsigned)

### 3. Configuration actuelle
Votre preset Cloudinary:
- **Preset name**: `francais_exercices`
- **Asset folder**: `entrainement-francais`
- **Mode**: Unsigned

Tous les fichiers uploadés seront automatiquement placés dans le dossier `entrainement-francais`.

### 4. Ajouter les variables d'environnement
Dans votre projet Vercel (via la section **Vars** du sidebar), ajoutez ces variables:
\`\`\`
CLOUDINARY_CLOUD_NAME=votre_cloud_name
CLOUDINARY_UPLOAD_PRESET=francais_exercices
CLOUDINARY_FOLDER=entrainement-francais
\`\`\`

**Important**: 
- Le `CLOUDINARY_CLOUD_NAME` se trouve dans votre dashboard Cloudinary
- Les valeurs par défaut correspondent déjà à votre configuration

### 5. Architecture
- **Cloudinary**: Stockage des fichiers audio et images (10 GB gratuit)
- **Supabase**: Base de données (exercices, utilisateurs, URLs des fichiers Cloudinary)

### 6. Formats supportés
- **Images**: JPG, PNG, GIF, WebP
- **Audio**: MP3, WAV, OGG, M4A

Les fichiers sont automatiquement optimisés par Cloudinary pour un chargement rapide.

### 7. Avantages de Cloudinary
- 10 GB de stockage gratuit (vs 100 MB avec Vercel Blob)
- Optimisation automatique des fichiers
- CDN intégré pour un chargement rapide partout dans le monde
- Transformations d'images à la volée
\`\`\`

\`\`\`html file="" isHidden
