CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE
  profils (
    id_profils SERIAL PRIMARY KEY,
    libelle TEXT NOT NULL,
    descri TEXT
  );

CREATE TABLE
  villes (
    id_villes SERIAL PRIMARY KEY,
    nom TEXT NOT NULL,
    xy geometry (Point, 4326)
  );

CREATE TABLE
  entreprises (
    id_entreprises SERIAL PRIMARY KEY,
    nom TEXT NOT NULL,
    adresse TEXT,
    telephone TEXT
  );

CREATE TABLE
  signalement_statuts (
    id_signalement_statuts SERIAL PRIMARY KEY,
    libelle TEXT NOT NULL,
    descri TEXT
  );

CREATE TABLE
  probleme_statuts (
    id_probleme_statuts SERIAL PRIMARY KEY,
    libelle TEXT NOT NULL,
    descri TEXT,
    pourcentage NUMERIC
  );

CREATE TABLE
  utilisateurs (
    id_utilisateurs SERIAL PRIMARY KEY,
    email TEXT UNIQUE,
    github TEXT,
    mot_de_passe TEXT,
    date_naissance DATE,
    profil_id INTEGER,
    CONSTRAINT fk_utilisateurs_profil FOREIGN KEY (profil_id) REFERENCES profils (id_profils) ON DELETE SET NULL
  );

CREATE TABLE
  points (
    id_points SERIAL PRIMARY KEY,
    xy geometry (Point, 4326),
    ville_id INTEGER,
    CONSTRAINT fk_points_ville FOREIGN KEY (ville_id) REFERENCES villes (id_villes) ON DELETE SET NULL
  );

CREATE TABLE
  signalements (
    id_signalements SERIAL PRIMARY KEY,
    description TEXT,
    utilisateur_id INTEGER,
    point_id INTEGER,
    signalement_statut_id INTEGER,
    CONSTRAINT fk_signalements_utilisateur FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs (id_utilisateurs) ON DELETE SET NULL,
    CONSTRAINT fk_signalements_point FOREIGN KEY (point_id) REFERENCES points (id_points) ON DELETE SET NULL,
    CONSTRAINT fk_signalements_statut FOREIGN KEY (signalement_statut_id) REFERENCES signalement_statuts (id_signalement_statuts) ON DELETE SET NULL
  );

CREATE TABLE
  problemes (
    id_problemes SERIAL PRIMARY KEY,
    surface NUMERIC,
    budget NUMERIC,
    entreprise_id INTEGER,
    signalement_id INTEGER,
    probleme_statut_id INTEGER,
    CONSTRAINT fk_problemes_entreprise FOREIGN KEY (entreprise_id) REFERENCES entreprises (id_entreprises) ON DELETE SET NULL,
    CONSTRAINT fk_problemes_signalement FOREIGN KEY (signalement_id) REFERENCES signalements (id_signalements) ON DELETE SET NULL,
    CONSTRAINT fk_problemes_statut FOREIGN KEY (probleme_statut_id) REFERENCES probleme_statuts (id_probleme_statuts) ON DELETE SET NULL
  );

CREATE TABLE
  signalement_historiques (
    id_signalement_historiques SERIAL PRIMARY KEY,
    date_historique TIMESTAMP WITHOUT TIME ZONE DEFAULT now (),
    utilisateur_id INTEGER,
    signalement_id INTEGER,
    signalement_statut_id INTEGER,
    CONSTRAINT fk_sh_utilisateur FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs (id_utilisateurs) ON DELETE SET NULL,
    CONSTRAINT fk_sh_signalement FOREIGN KEY (signalement_id) REFERENCES signalements (id_signalements) ON DELETE CASCADE,
    CONSTRAINT fk_sh_statut FOREIGN KEY (signalement_statut_id) REFERENCES signalement_statuts (id_signalement_statuts) ON DELETE SET NULL
  );

CREATE TABLE
  probleme_historiques (
    id_probleme_historiques SERIAL PRIMARY KEY,
    date_historique TIMESTAMP WITHOUT TIME ZONE DEFAULT now (),
    surface NUMERIC,
    budget NUMERIC,
    utilisateur_id INTEGER,
    probleme_statut_id INTEGER,
    probleme_id INTEGER,
    CONSTRAINT fk_ph_utilisateur FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs (id_utilisateurs) ON DELETE SET NULL,
    CONSTRAINT fk_ph_statut FOREIGN KEY (probleme_statut_id) REFERENCES probleme_statuts (id_probleme_statuts) ON DELETE SET NULL,
    CONSTRAINT fk_ph_probleme FOREIGN KEY (probleme_id) REFERENCES problemes (id_problemes) ON DELETE CASCADE
  );

CREATE TABLE
  statuts (
    id_statut SERIAL PRIMARY KEY,
    libelle TEXT NOT NULL UNIQUE
  );

CREATE TABLE
  utilisateur_statuts (
    id_utilisateur_statut SERIAL PRIMARY KEY,
    utilisateur_id INTEGER NOT NULL,
    statut_id INTEGER NOT NULL,
    date_statut TIMESTAMP WITHOUT TIME ZONE DEFAULT now (),
    CONSTRAINT fk_utilisateur_statuts_utilisateur FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs (id_utilisateurs) ON DELETE CASCADE,
    CONSTRAINT fk_utilisateur_statuts_statut FOREIGN KEY (statut_id) REFERENCES statuts (id_statut) ON DELETE RESTRICT
  );

CREATE TABLE
  historique_synchronisations (
    id_historique_synchronisation SERIAL PRIMARY KEY,
    date_synchronisation TIMESTAMP WITHOUT TIME ZONE DEFAULT now (),
    description TEXT
  );

CREATE TABLE
  firebase_mapping (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL, -- user, signalement, statut, etc.
    postgres_id INT NOT NULL,
    firebase_id VARCHAR(128) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (entity_type, postgres_id),
    UNIQUE (entity_type, firebase_id)
  );