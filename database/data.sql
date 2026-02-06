-- ==============================
-- DONNeES D'AUTHENTIFICATION
-- ==============================

-- Profils des utilisateurs (IMPORTANT pour l'authentification)
INSERT INTO profils (libelle, descri) VALUES 
  ('Admin', 'Administrateur du système'),
  ('Utilisateur', 'Utilisateur standard');

-- Statuts utilisateurs (IMPORTANT pour la gestion des comptes)
INSERT INTO statuts (libelle) VALUES 
  ('Actif'),
  ('Bloque'),
  ('Suspendu'),
  ('Inactif');

-- Utilisateurs (IMPORTANT pour la connexion)
-- Mot de passe pour TOUS les utilisateurs: admin123
-- Hash bcrypt: $2b$10$SlKsM14r9AEFia2NvF5Ec.R5VtZdte/X1aZ/GEDWga6D/UHOVsMTi
INSERT INTO utilisateurs (email, mot_de_passe, date_naissance, profil_id) VALUES 
  ('admin@route.mg', '$2b$10$SlKsM14r9AEFia2NvF5Ec.R5VtZdte/X1aZ/GEDWga6D/UHOVsMTi', '1990-01-15', 1), -- ADMIN
  ('jean.dupont@gmail.com', '$2b$10$SlKsM14r9AEFia2NvF5Ec.R5VtZdte/X1aZ/GEDWga6D/UHOVsMTi', '1995-03-22', 2),
  ('marie.martin@gmail.com', '$2b$10$SlKsM14r9AEFia2NvF5Ec.R5VtZdte/X1aZ/GEDWga6D/UHOVsMTi', '1992-07-10', 2),
  ('pierre.bernard@gmail.com', '$2b$10$SlKsM14r9AEFia2NvF5Ec.R5VtZdte/X1aZ/GEDWga6D/UHOVsMTi', '1988-11-05', 2),
  ('sophie.laurent@gmail.com', '$2b$10$SlKsM14r9AEFia2NvF5Ec.R5VtZdte/X1aZ/GEDWga6D/UHOVsMTi', '1998-02-14', 2),
  -- Utilisateurs BLOQUeS
  ('user.bloque1@gmail.com', '$2b$10$SlKsM14r9AEFia2NvF5Ec.R5VtZdte/X1aZ/GEDWga6D/UHOVsMTi', '1991-06-20', 2),
  ('user.bloque2@gmail.com', '$2b$10$SlKsM14r9AEFia2NvF5Ec.R5VtZdte/X1aZ/GEDWga6D/UHOVsMTi', '1993-09-15', 2),
  ('spammer@test.com', '$2b$10$SlKsM14r9AEFia2NvF5Ec.R5VtZdte/X1aZ/GEDWga6D/UHOVsMTi', '1987-12-01', 2);

-- Statuts initiaux des utilisateurs (certains bloques)
INSERT INTO utilisateur_statuts (utilisateur_id, statut_id, date_statut) VALUES 
  (1, 1, NOW() - INTERVAL '6 months'), -- Admin actif
  (2, 1, NOW() - INTERVAL '5 months'), -- Actif
  (3, 1, NOW() - INTERVAL '4 months'), -- Actif
  (4, 1, NOW() - INTERVAL '3 months'), -- Actif
  (5, 1, NOW() - INTERVAL '2 months'), -- Actif
  (6, 2, NOW() - INTERVAL '1 week'),   -- BLOQUe
  (7, 2, NOW() - INTERVAL '3 days'),   -- BLOQUe
  (8, 2, NOW() - INTERVAL '1 day');    -- BLOQUe

-- ==============================
-- DONNeES DE ReFeRENCE
-- ==============================

-- ==============================
-- DONNeES DE ReFeRENCE
-- ==============================

-- Villes: Antananarivo (capitale de Madagascar)
INSERT INTO villes (nom, xy) VALUES 
  ('Antananarivo', ST_GeomFromText('POINT(47.5233 18.8792)', 4326)),
  ('Toliara', ST_GeomFromText('POINT(43.6671 23.3636)', 4326)),
  ('Antsirabe', ST_GeomFromText('POINT(47.1167 19.8667)', 4326));

-- Entreprises: Societes de travaux publics
INSERT INTO entreprises (nom, adresse, telephone) VALUES 
  ('SORGETRAM', '123 Avenue de l''Independance, Antananarivo', '+261 20 22 123 45'),
  ('BTP Madagascar', '456 Rue de la Reine, Antananarivo', '+261 20 22 234 56'),
  ('Travaux Publics Plus', '789 Boulevard de l''Unite, Antananarivo', '+261 20 22 345 67'),
  ('Infrastructure Solutions', '321 Route de l''Est, Toliara', '+261 20 24 456 78');

-- Statuts pour les signalements
INSERT INTO signalement_statuts (libelle, descri) VALUES 
  ('Nouveau', 'Nouveau signalement signale'),
  ('En cours', 'En cours de traitement'),
  ('Resolu', 'Signalement traite et ferme'),
  ('Rejete', 'Signalement rejete');

-- Statuts pour les problèmes (travaux) - 3 niveaux: 0% → 50% → 100%
INSERT INTO probleme_statuts (libelle, descri, pourcentage) VALUES 
  ('Non commence', 'Travaux non commences', 0),
  ('En cours', 'Travaux en cours', 50),
  ('Termine', 'Travaux termines', 100);

-- ==============================
-- DONNeES GeOGRAPHIQUES
-- ==============================

-- ==============================
-- DONNeES GeOGRAPHIQUES
-- ==============================

-- Points: Emplacements des signalements à Antananarivo
INSERT INTO points (xy, ville_id) VALUES 
  (ST_GeomFromText('POINT(47.5200 18.8850)', 4326), 1),
  (ST_GeomFromText('POINT(47.5250 18.8780)', 4326), 1),
  (ST_GeomFromText('POINT(47.5150 18.8900)', 4326), 1),
  (ST_GeomFromText('POINT(47.5300 18.8750)', 4326), 1),
  (ST_GeomFromText('POINT(47.5100 18.8820)', 4326), 1),
  (ST_GeomFromText('POINT(47.5270 18.8900)', 4326), 1);

-- ==============================
-- DONNeES OPeRATIONNELLES
-- ==============================

-- Signalements: Rapports de degâts
INSERT INTO signalements (description, utilisateur_id, point_id, signalement_statut_id) VALUES 
  ('Nid de poule sur Avenue de l''Independance - très dangereux', 2, 1, 1),
  ('Fissure importante sur la chaussee - Rue de la Reine', 3, 2, 1),
  ('Asphalt degrade et affaissements - Boulevard du 26 Juin', 4, 3, 1),
  ('Trous multiples sur Route de l''Est - risque d''accident', 5, 4, 1),
  ('Nid de poule grave au croisement Avenue/Route Circulaire', 2, 5, 1),
  ('Deformation de la chaussee - perte de revêtement', 3, 6, 1);

-- Problèmes: Travaux correspondant aux signalements


-- ==============================
-- HISTORIQUES
-- ==============================

-- Historiques des signalements (statut nouveau)


-- Historiques des problèmes (statuts)
