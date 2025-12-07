-- Table pour suivre les appareils des étudiants
CREATE TABLE IF NOT EXISTS device_sessions (
    id SERIAL PRIMARY KEY,
    user_zalo VARCHAR(20) NOT NULL,
    device_fingerprint TEXT NOT NULL,
    device_info JSONB,
    first_seen TIMESTAMP DEFAULT NOW(),
    last_seen TIMESTAMP DEFAULT NOW(),
    login_count INTEGER DEFAULT 1,
    is_locked BOOLEAN DEFAULT TRUE,
    locked_until TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days'),
    UNIQUE(user_zalo, device_fingerprint)
);

-- Index pour accélérer les recherches
CREATE INDEX IF NOT EXISTS idx_device_sessions_user ON device_sessions(user_zalo);
CREATE INDEX IF NOT EXISTS idx_device_sessions_fingerprint ON device_sessions(device_fingerprint);

-- Commentaire sur la table
COMMENT ON TABLE device_sessions IS 'Suivi des appareils connectés par étudiant - Max 2 appareils, verrouillés 7 jours';
COMMENT ON COLUMN device_sessions.is_locked IS 'Appareil verrouillé pendant 7 jours après création';
COMMENT ON COLUMN device_sessions.locked_until IS 'Date jusqu''à laquelle l''appareil ne peut pas être supprimé';
