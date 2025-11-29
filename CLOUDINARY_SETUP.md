# Configuration Cloudinary

Cloudinary sera utilisé pour stocker les fichiers audio et images de l'application.

## Étapes de configuration

### 1. Créer un compte Cloudinary
1. Allez sur [cloudinary.com](https://cloudinary.com)
2. Créez un compte gratuit (10 GB de stockage gratuit)

### 2. Obtenir vos credentials
1. Dans le dashboard Cloudinary, trouvez votre **Cloud Name**
2. Allez dans Settings → Upload → Upload Presets
3. Créez un nouveau preset **unsigned** (pour permettre les uploads depuis le client)
   - Cliquez sur "Add upload preset"
   - Mode: **Unsigned**
   - Preset name: ex. `french_exercises`
   - Signing mode: **Unsigned**
   - Folder: `exercises` (optionnel, pour organiser vos fichiers)
   - Save

### 3. Ajouter les variables d'environnement
Dans votre projet Vercel, ajoutez ces variables:
\`\`\`
CLOUDINARY_CLOUD_NAME=votre_cloud_name
CLOUDINARY_UPLOAD_PRESET=votre_preset_name
\`\`\`

### 4. Architecture
- **Cloudinary**: Stockage des fichiers audio et images
- **Supabase**: Base de données (exercices, utilisateurs, URLs des fichiers)

### 5. Formats supportés
- **Images**: JPG, PNG, GIF, WebP
- **Audio**: MP3, WAV, OGG, M4A

Les fichiers sont automatiquement optimisés par Cloudinary pour un chargement rapide.
