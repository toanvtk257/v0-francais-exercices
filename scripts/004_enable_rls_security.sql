-- Activer Row Level Security sur les tables critiques
-- Cette mesure empêche les accès non autorisés aux données

-- 1. Activer RLS sur la table users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir uniquement leur propre profil
CREATE POLICY "users_select_own" ON users
    FOR SELECT
    USING (auth.uid()::text = id OR role = 'admin');

-- Policy: Les utilisateurs peuvent mettre à jour leur propre profil
CREATE POLICY "users_update_own" ON users
    FOR UPDATE
    USING (auth.uid()::text = id);

-- Policy: Seuls les admins peuvent créer des utilisateurs
CREATE POLICY "users_admin_all" ON users
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::text AND role = 'admin'
        )
    );

-- 2. Activer RLS sur device_sessions
ALTER TABLE device_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir uniquement leurs propres sessions
CREATE POLICY "device_sessions_select_own" ON device_sessions
    FOR SELECT
    USING (user_id = auth.uid()::text);

-- Policy: Les utilisateurs peuvent créer leurs propres sessions
CREATE POLICY "device_sessions_insert_own" ON device_sessions
    FOR INSERT
    WITH CHECK (user_id = auth.uid()::text);

-- 3. Activer RLS sur assessment_exercises
ALTER TABLE assessment_exercises ENABLE ROW LEVEL SECURITY;

-- Policy: Tout le monde peut voir les exercices (lecture seule)
CREATE POLICY "assessment_exercises_select_all" ON assessment_exercises
    FOR SELECT
    TO public
    USING (true);

-- Policy: Seuls les admins peuvent modifier les exercices
CREATE POLICY "assessment_exercises_admin_modify" ON assessment_exercises
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::text AND role = 'admin'
        )
    );

-- 4. Créer une table pour le rate limiting (protection brute force)
CREATE TABLE IF NOT EXISTS login_attempts (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    ip_address TEXT,
    attempt_time TIMESTAMP DEFAULT NOW(),
    success BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_login_attempts_email ON login_attempts(email, attempt_time);
CREATE INDEX idx_login_attempts_ip ON login_attempts(ip_address, attempt_time);

-- Fonction pour vérifier le rate limiting
CREATE OR REPLACE FUNCTION check_rate_limit(
    user_email TEXT,
    user_ip TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    failed_attempts INT;
BEGIN
    -- Compter les tentatives échouées dans les 15 dernières minutes
    SELECT COUNT(*) INTO failed_attempts
    FROM login_attempts
    WHERE email = user_email
        AND success = FALSE
        AND attempt_time > NOW() - INTERVAL '15 minutes';
    
    -- Bloquer après 5 tentatives échouées
    IF failed_attempts >= 5 THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
