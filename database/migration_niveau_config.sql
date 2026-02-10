-- Migration: Ajout niveau problème et configuration prix par m2

-- Ajouter la colonne niveau à la table problemes (1-10)
ALTER TABLE problemes ADD COLUMN IF NOT EXISTS niveau INTEGER DEFAULT 1 CHECK (niveau >= 1 AND niveau <= 10);

-- Créer la table de configuration pour le prix par m2
CREATE TABLE IF NOT EXISTS configurations (
    id_configurations SERIAL PRIMARY KEY,
    cle TEXT UNIQUE NOT NULL,
    valeur NUMERIC NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Insérer la valeur par défaut du prix par m2
INSERT INTO configurations (cle, valeur, description) 
VALUES ('prix_par_m2', 1000, 'Prix forfaitaire par mètre carré pour le calcul du budget')
ON CONFLICT (cle) DO NOTHING;

-- Mettre à jour les budgets existants selon la formule: prix_par_m2 * niveau * surface
-- (Les problèmes existants auront niveau=1 par défaut)
