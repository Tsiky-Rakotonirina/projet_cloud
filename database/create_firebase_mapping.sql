-- Créer la table de mapping Firebase ↔ PostgreSQL
CREATE TABLE IF NOT EXISTS firebase_mapping (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL, -- user, signalement, statut, etc.
    postgres_id INT NOT NULL,
    firebase_id VARCHAR(128) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (entity_type, postgres_id),
    UNIQUE (entity_type, firebase_id)
);

-- Créer un index pour accélérer les recherches
CREATE INDEX IF NOT EXISTS idx_firebase_mapping_entity_type ON firebase_mapping(entity_type);
CREATE INDEX IF NOT EXISTS idx_firebase_mapping_postgres_id ON firebase_mapping(postgres_id);
CREATE INDEX IF NOT EXISTS idx_firebase_mapping_firebase_id ON firebase_mapping(firebase_id);

-- Afficher la structure de la table
\d firebase_mapping;
