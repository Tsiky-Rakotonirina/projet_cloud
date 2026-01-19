
INSERT INTO types_rues (libelle) VALUES 
  ('avenue'),
  ('rue'),
  ('boulevard');

INSERT INTO profils (libelle, descri) VALUES 
  ('admin', 'Administrateur du système'),
  ('utilisateur', 'Utilisateur standard'),
  ('technicien', 'Technicien de maintenance');

INSERT INTO villes (nom, xy) VALUES 
  ('Paris', ST_GeomFromText('POINT(2.3522 48.8566)', 4326)),
  ('Lyon', ST_GeomFromText('POINT(4.8357 45.7640)', 4326)),
  ('Marseille', ST_GeomFromText('POINT(5.3698 43.2965)', 4326));

INSERT INTO rues (nom, type_id, xy, ville_id) VALUES 
  ('Champs-Elysees', 1, ST_GeomFromText('LINESTRING(2.3066 48.8699, 2.3098 48.8705)', 4326), 1),
  ('Rue de Rivoli', 2, ST_GeomFromText('LINESTRING(2.3355 48.8606, 2.3380 48.8610)', 4326), 1),
  ('Boulevard Saint-Germain', 3, ST_GeomFromText('LINESTRING(2.3355 48.8530, 2.3380 48.8535)', 4326), 1);

INSERT INTO entreprises (nom, adresse, telephone) VALUES 
  ('Entreprise A', '123 rue de la Paix, Paris', '01 23 45 67 89'),
  ('Entreprise B', '456 avenue des Champs, Lyon', '04 56 78 90 12'),
  ('Entreprise C', '789 boulevard de la Canebiere, Marseille', '04 91 12 34 56');

INSERT INTO signalement_statuts (libelle, descri) VALUES 
  ('nouveau', 'Nouveau signalement'),
  ('en_cours', 'En cours de traitement'),
  ('resolu', 'Signalement resolu'),
  ('rejete', 'Signalement rejete');

INSERT INTO probleme_statuts (libelle, descri, pourcentage) VALUES 
  ('non_commence', 'Non commence', 0),
  ('en_cours', 'En cours de realisation', 50),
  ('termine', 'Probleme resolu', 100),
  ('suspendu', 'Suspendu temporairement', 25);

INSERT INTO statuts (libelle) VALUES 
  ('actif'),
  ('bloque');
