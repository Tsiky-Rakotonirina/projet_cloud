-- Tables pour la gestion améliorée de la synchronisation
-- Créer ces tables après les tables existantes

-- Table des sessions de synchronisation
CREATE TABLE IF NOT EXISTS sync_sessions (
    id_sync_session UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(10) NOT NULL CHECK (type IN ('push', 'pull', 'full')),
    entity_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    total_items INTEGER DEFAULT 0,
    processed_items INTEGER DEFAULT 0,
    inserted_count INTEGER DEFAULT 0,
    updated_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    skipped_count INTEGER DEFAULT 0,
    current_step VARCHAR(100),
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    error_message TEXT,
    initiated_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des détails par élément synchronisé
CREATE TABLE IF NOT EXISTS sync_item_details (
    id_sync_item SERIAL PRIMARY KEY,
    sync_session_id UUID NOT NULL REFERENCES sync_sessions(id_sync_session) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    entity_email VARCHAR(255),
    entity_label VARCHAR(255),
    source_id VARCHAR(100),
    target_id VARCHAR(100),
    action VARCHAR(10) NOT NULL CHECK (action IN ('insert', 'update', 'skip', 'error')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed', 'skipped')),
    sync_direction VARCHAR(30) NOT NULL CHECK (sync_direction IN ('firebase_to_postgres', 'postgres_to_firebase')),
    error_message TEXT,
    data_before JSONB,
    data_after JSONB,
    synced_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_sync_sessions_status ON sync_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sync_sessions_created ON sync_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_item_details_session ON sync_item_details(sync_session_id);
CREATE INDEX IF NOT EXISTS idx_sync_item_details_status ON sync_item_details(status);
CREATE INDEX IF NOT EXISTS idx_sync_item_details_entity ON sync_item_details(entity_type, entity_id);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_sync_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS trigger_sync_sessions_updated ON sync_sessions;
CREATE TRIGGER trigger_sync_sessions_updated
    BEFORE UPDATE ON sync_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_sync_updated_at();

DROP TRIGGER IF EXISTS trigger_sync_item_details_updated ON sync_item_details;
CREATE TRIGGER trigger_sync_item_details_updated
    BEFORE UPDATE ON sync_item_details
    FOR EACH ROW
    EXECUTE FUNCTION update_sync_updated_at();

-- Commentaires
COMMENT ON TABLE sync_sessions IS 'Sessions de synchronisation Firebase ↔ PostgreSQL';
COMMENT ON TABLE sync_item_details IS 'Détails des éléments synchronisés dans chaque session';
