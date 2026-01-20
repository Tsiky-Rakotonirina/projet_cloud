# Script pour créer la table firebase_mapping
Write-Host "🔧 Création de la table firebase_mapping..." -ForegroundColor Cyan

$env:PGPASSWORD = 'admin'

$sqlCommand = @"
CREATE TABLE IF NOT EXISTS firebase_mapping (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    postgres_id INT NOT NULL,
    firebase_id VARCHAR(128) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (entity_type, postgres_id),
    UNIQUE (entity_type, firebase_id)
);

CREATE INDEX IF NOT EXISTS idx_firebase_mapping_entity_type ON firebase_mapping(entity_type);
CREATE INDEX IF NOT EXISTS idx_firebase_mapping_postgres_id ON firebase_mapping(postgres_id);
CREATE INDEX IF NOT EXISTS idx_firebase_mapping_firebase_id ON firebase_mapping(firebase_id);
"@

# Exécuter la commande SQL
psql -h localhost -p 5433 -U admin -d route -c $sqlCommand

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Table firebase_mapping créée avec succès !" -ForegroundColor Green
    
    # Vérifier la table
    Write-Host "`n📊 Structure de la table :" -ForegroundColor Yellow
    psql -h localhost -p 5433 -U admin -d route -c "\d firebase_mapping"
    
    Write-Host "`n🎉 Synchronisation prête ! Testez avec :" -ForegroundColor Green
    Write-Host "   curl http://localhost:3000/api/sync/status" -ForegroundColor White
} else {
    Write-Host "❌ Erreur lors de la création de la table" -ForegroundColor Red
}

# Nettoyer
Remove-Item Env:\PGPASSWORD
