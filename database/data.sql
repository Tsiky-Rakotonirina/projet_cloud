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
  ('admin@route.mg', '$2b$10$SlKsM14r9AEFia2NvF5Ec.R5VtZdte/X1aZ/GEDWga6D/UHOVsMTi', '1990-01-15', 1);

INSERT INTO utilisateurs (email, mot_de_passe, date_naissance, profil_id) VALUES 
  ('jean.dupont@gmail.com', '$2b$10$SlKsM14r9AEFia2NvF5Ec.R5VtZdte/X1aZ/GEDWga6D/UHOVsMTi', '1995-03-22', 2),
  ('marie.martin@gmail.com', '$2b$10$SlKsM14r9AEFia2NvF5Ec.R5VtZdte/X1aZ/GEDWga6D/UHOVsMTi', '1992-07-10', 2),
  ('pierre.bernard@gmail.com', '$2b$10$SlKsM14r9AEFia2NvF5Ec.R5VtZdte/X1aZ/GEDWga6D/UHOVsMTi', '1988-11-05', 2),
  ('sophie.laurent@gmail.com', '$2b$10$SlKsM14r9AEFia2NvF5Ec.R5VtZdte/X1aZ/GEDWga6D/UHOVsMTi', '1998-02-14', 2);

INSERT INTO utilisateur_statuts (utilisateur_id, statut_id, date_statut) VALUES 
  (1, 1, NOW() - INTERVAL '6 months'), -- Admin actif
  (2, 1, NOW() - INTERVAL '5 months'), -- Actif
  (3, 1, NOW() - INTERVAL '4 months'), -- Actif
  (4, 2, NOW() - INTERVAL '1 week'),   -- Bloque
  (5, 2, NOW() - INTERVAL '3 days');   -- Bloque


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
  ('Infrastructure Solutions', '321 Route de l''Est, Toliara', '+261 20 24 456 78'),
  ('SOTRAMAD', '654 Avenue Rainandriamampandry, Antananarivo', '+261 20 22 567 89'),
  ('Colas Madagascar', 'Zone Forello, Tanjombato, Antananarivo', '+261 20 22 678 90'),
  ('EGC Madagascar', '12 Rue Ravoninahitriniarivo, Antsiranana', '+261 20 82 123 45'),
  ('Madagascar Bâtiment Services', '45 Avenue de l''Aeroport, Mahajanga', '+261 20 62 234 56');

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

-- Points: Emplacements des signalements à Antananarivo
INSERT INTO points (xy, ville_id) VALUES 
  (ST_GeomFromText('POINT(47.5200 18.8850)', 4326), 1),
  (ST_GeomFromText('POINT(47.5250 18.8780)', 4326), 1),
  (ST_GeomFromText('POINT(47.5150 18.8900)', 4326), 1),
  (ST_GeomFromText('POINT(47.5300 18.8750)', 4326), 1),
  (ST_GeomFromText('POINT(47.5100 18.8820)', 4326), 1),
  (ST_GeomFromText('POINT(47.5270 18.8900)', 4326), 1),

  (ST_GeomFromText('POINT(47.5350 18.9000)', 4326), 1),
  (ST_GeomFromText('POINT(47.5600 18.8750)', 4326), 1),
  (ST_GeomFromText('POINT(47.6100 18.4820)', 4326), 1),
  (ST_GeomFromText('POINT(47.5490 18.9470)', 4326), 1),

  (ST_GeomFromText('POINT(47.5732 18.8100)', 4326), 1),
  (ST_GeomFromText('POINT(47.5980 18.8640)', 4326), 1),
  (ST_GeomFromText('POINT(47.5360 18.8420)', 4326), 1),
  (ST_GeomFromText('POINT(47.5550 18.8650)', 4326), 1),
  (ST_GeomFromText('POINT(47.5490 18.8340)', 4326), 1),
  (ST_GeomFromText('POINT(47.5670 18.8880)', 4326), 1),
  (ST_GeomFromText('POINT(47.5940 18.8710)', 4326), 1),
  (ST_GeomFromText('POINT(47.5840 18.8050)', 4326), 1),
  (ST_GeomFromText('POINT(47.5120 18.8400)', 4326), 1),
  (ST_GeomFromText('POINT(47.5245 18.8379)', 4326), 1);


INSERT INTO signalements (description, utilisateur_id, point_id, signalement_statut_id) VALUES 

-- 5 NOUVEAUX
('Nid de poule important près du marché', 2, 1, 1),
('Dégradation avancée chaussée secteur Analakely', 3, 2, 1),
('Fissure profonde route principale', 2, 3, 1),
('Affaissement chaussée après fortes pluies', 3, 4, 1),
('Route endommagée proche école primaire', 2, 5, 1),

-- 3 EN COURS
('Nids de poule multiples quartier Isoraka', 2, 6, 2),
('Chaussée fissurée près station-service', 3, 7, 2),
('Déformation route nationale sortie ville', 2, 8, 2),

-- 2 REJETÉS
('Plainte non confirmée - route en bon état', 3, 9, 4),
('Signalement en double', 2, 10, 4),

-- 10 RÉSOLUS
('Réparation terminée Avenue centrale', 2, 11, 3),
('Travaux achevés Rue secondaire', 3, 12, 3),
('Chaussée restaurée quartier Ouest', 2, 20, 3),
('Route réparée secteur Sud', 3, 13, 3),
('Reprise complète revêtement', 2, 14, 3),
('Réhabilitation terminée Boulevard', 3, 15, 3),
('Stabilisation sol et réasphaltage', 2, 16, 3),
('Travaux finalisés zone industrielle', 3, 17, 3),
('Réfection complète chaussée urbaine', 2, 18, 3),
('Rénovation terminée route périphérique', 3, 19, 3);

INSERT INTO signalement_images (name, signalement_id) VALUES
('image1.jpg',1),('image2.jpg',2),('image3.jpg',3),('image4.jpg',4),('image5.jpg',5),
('image6.jpg',6),('image7.jpg',7),('image8.jpg',8),('image9.jpg',9),('image10.jpg',10),
('image1.jpg',11),('image2.jpg',12),('image3.jpg',13),('image4.jpg',14),('image5.jpg',15),
('image6.jpg',16),('image7.jpg',17),('image8.jpg',18),('image9.jpg',19),('image10.jpg',20);

INSERT INTO problemes (surface, budget, entreprise_id, signalement_id, probleme_statut_id) VALUES

-- 2 NON COMMENCÉS
(25,5000000,1,11,1),
(18,3500000,2,12,1),

-- 4 EN COURS (50%)
(30,6200000,3,13,2),
(22,4100000,4,14,2),
(40,8500000,5,15,2),
(15,2800000,6,16,2),

-- 4 TERMINÉS
(27,5200000,7,17,3),
(33,7300000,8,18,3),
(19,3600000,1,19,3),
(45,9100000,2,20,3);

INSERT INTO signalement_historiques (utilisateur_id, signalement_id, signalement_statut_id, date_historique) VALUES
(2,1,1,NOW()-INTERVAL '10 days'),
(3,2,1,NOW()-INTERVAL '10 days'),
(2,3,1,NOW()-INTERVAL '9 days'),
(3,4,1,NOW()-INTERVAL '9 days'),
(2,5,1,NOW()-INTERVAL '8 days');

-- Nouveau
INSERT INTO signalement_historiques VALUES
(DEFAULT,NOW()-INTERVAL '8 days',2,6,1),
(DEFAULT,NOW()-INTERVAL '8 days',3,7,1),
(DEFAULT,NOW()-INTERVAL '7 days',2,8,1);

-- En cours (admin modifie)
INSERT INTO signalement_historiques VALUES
(DEFAULT,NOW()-INTERVAL '5 days',1,6,2),
(DEFAULT,NOW()-INTERVAL '5 days',1,7,2),
(DEFAULT,NOW()-INTERVAL '4 days',1,8,2);

-- Nouveau
INSERT INTO signalement_historiques VALUES
(DEFAULT,NOW()-INTERVAL '6 days',3,9,1),
(DEFAULT,NOW()-INTERVAL '6 days',2,10,1);

-- Rejeté
INSERT INTO signalement_historiques VALUES
(DEFAULT,NOW()-INTERVAL '4 days',1,9,4),
(DEFAULT,NOW()-INTERVAL '4 days',1,10,4);

-- Nouveau
INSERT INTO signalement_historiques VALUES
(DEFAULT,NOW()-INTERVAL '15 days',2,11,1),
(DEFAULT,NOW()-INTERVAL '15 days',3,12,1),
(DEFAULT,NOW()-INTERVAL '14 days',2,13,1),
(DEFAULT,NOW()-INTERVAL '14 days',3,14,1),
(DEFAULT,NOW()-INTERVAL '13 days',2,15,1),
(DEFAULT,NOW()-INTERVAL '13 days',3,16,1),
(DEFAULT,NOW()-INTERVAL '12 days',2,17,1),
(DEFAULT,NOW()-INTERVAL '12 days',3,18,1),
(DEFAULT,NOW()-INTERVAL '11 days',2,19,1),
(DEFAULT,NOW()-INTERVAL '11 days',3,20,1);

-- En cours
INSERT INTO signalement_historiques VALUES
(DEFAULT,NOW()-INTERVAL '10 days',1,11,2),
(DEFAULT,NOW()-INTERVAL '10 days',1,12,2),
(DEFAULT,NOW()-INTERVAL '9 days',1,13,2),
(DEFAULT,NOW()-INTERVAL '9 days',1,14,2),
(DEFAULT,NOW()-INTERVAL '8 days',1,15,2),
(DEFAULT,NOW()-INTERVAL '8 days',1,16,2),
(DEFAULT,NOW()-INTERVAL '7 days',1,17,2),
(DEFAULT,NOW()-INTERVAL '7 days',1,18,2),
(DEFAULT,NOW()-INTERVAL '6 days',1,19,2),
(DEFAULT,NOW()-INTERVAL '6 days',1,20,2);

-- Résolu
INSERT INTO signalement_historiques VALUES
(DEFAULT,NOW()-INTERVAL '2 days',1,11,3),
(DEFAULT,NOW()-INTERVAL '2 days',1,12,3),
(DEFAULT,NOW()-INTERVAL '2 days',1,13,3),
(DEFAULT,NOW()-INTERVAL '2 days',1,14,3),
(DEFAULT,NOW()-INTERVAL '2 days',1,15,3),
(DEFAULT,NOW()-INTERVAL '2 days',1,16,3),
(DEFAULT,NOW()-INTERVAL '1 day',1,17,3),
(DEFAULT,NOW()-INTERVAL '1 day',1,18,3),
(DEFAULT,NOW()-INTERVAL '1 day',1,19,3),
(DEFAULT,NOW()-INTERVAL '1 day',1,20,3);

INSERT INTO probleme_historiques (surface,budget,utilisateur_id,probleme_statut_id,probleme_id,date_historique) VALUES
(25,5000000,1,1,1,NOW()-INTERVAL '10 days'),
(18,3500000,1,1,2,NOW()-INTERVAL '10 days'),
(30,6200000,1,1,3,NOW()-INTERVAL '10 days'),
(22,4100000,1,1,4,NOW()-INTERVAL '10 days'),
(40,8500000,1,1,5,NOW()-INTERVAL '9 days'),
(15,2800000,1,1,6,NOW()-INTERVAL '9 days'),
(27,5200000,1,1,7,NOW()-INTERVAL '8 days'),
(33,7300000,1,1,8,NOW()-INTERVAL '8 days'),
(19,3600000,1,1,9,NOW()-INTERVAL '7 days'),
(45,9100000,1,1,10,NOW()-INTERVAL '7 days');

INSERT INTO probleme_historiques VALUES
(DEFAULT,NOW()-INTERVAL '5 days',30,6200000,1,2,3),
(DEFAULT,NOW()-INTERVAL '5 days',22,4100000,1,2,4),
(DEFAULT,NOW()-INTERVAL '4 days',40,8500000,1,2,5),
(DEFAULT,NOW()-INTERVAL '4 days',15,2800000,1,2,6);

INSERT INTO probleme_historiques VALUES
(DEFAULT,NOW()-INTERVAL '2 days',27,5200000,1,3,7),
(DEFAULT,NOW()-INTERVAL '2 days',33,7300000,1,3,8),
(DEFAULT,NOW()-INTERVAL '1 day',19,3600000,1,3,9),
(DEFAULT,NOW()-INTERVAL '1 day',45,9100000,1,3,10);

