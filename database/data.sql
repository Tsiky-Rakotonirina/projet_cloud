INSERT INTO profils (libelle, descri) VALUES
('Visiteur', NULL),
('Utilisateur', NULL),
('Manager', NULL);

INSERT INTO villes (nom, xy)
VALUES (
  'Antananarivo',
  ST_SetSRID(ST_MakePoint(47.5162, -18.8792), 4326)
);

INSERT INTO entreprises (nom, adresse, telephone) VALUES
('Colas', NULL, NULL),
('SogeaSatom', NULL, NULL);

INSERT INTO entreprises (nom, adresse, telephone) VALUES
('Colas', NULL, NULL),
('SogeaSatom', NULL, NULL);

INSERT INTO signalement_statuts (libelle, descri) VALUES
('Cree', 'Signalement cree'),
('Approuve', 'Signalement approuve'),
('Annule', 'Signalement annule');

INSERT INTO probleme_statuts (libelle, descri, pourcentage) VALUES
('Pas encore commence', 'Travaux non demarres', 0),
('Commence a 10%', 'Debut des travaux', 10),
('Au quart', 'Travaux a 25%', 25),
('A moitie', 'Travaux a 50%', 50),
('Au trois quart', 'Travaux a 75%', 75),
('A la fin 90%', 'Travaux presque termines', 90),
('Termine', 'Travaux termines', 100);

