-- Ajouter le champ view_pin pour séparer le code PIN de visualisation du code PIN de connexion
-- Le code PIN de visualisation permet de voir les informations sensibles des utilisateurs
-- Par défaut: 1234

ALTER TABLE users ADD COLUMN IF NOT EXISTS view_pin TEXT DEFAULT '1234';

-- Mettre à jour tous les admins existants avec le code par défaut
UPDATE users SET view_pin = '1234' WHERE role = 'admin' AND view_pin IS NULL;

COMMENT ON COLUMN users.view_pin IS 'Code PIN pour voir les informations sensibles des utilisateurs (4-6 chiffres)';
