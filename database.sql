CREATE DATABASE IF NOT EXISTS internshipmanagementdb;
USE internshipmanagementdb;

-- ═══════════════════════════════════════
-- USERS
-- ═══════════════════════════════════════
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') DEFAULT 'user',
  reset_token VARCHAR(255) NULL,
  reset_expires DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════
-- ETABLISSEMENTS
-- ═══════════════════════════════════════
CREATE TABLE etablissements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(150) NOT NULL,
  type ENUM('EPH','EPSP','CHU','EHS','OHU','AUTRE') DEFAULT 'AUTRE',
  wilaya VARCHAR(100),
  adresse VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════
-- SERVICES
-- ═══════════════════════════════════════
CREATE TABLE services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(150) NOT NULL,
  etablissement_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (etablissement_id) REFERENCES etablissements(id) ON DELETE CASCADE
);

-- ═══════════════════════════════════════
-- GROUPES
-- ═══════════════════════════════════════
CREATE TABLE groupes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════
-- ETUDIANTS
-- ═══════════════════════════════════════
CREATE TABLE etudiants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  specialite ENUM(
    'Infirmier',
    'Kinesitherapie',
    'Sage-femme',
    'Laboratoire',
    'Radiologie',
    'Préparateur en Pharmacie',
    'Autre'
  ) NOT NULL,
  annee ENUM('1','2','3','4','5') NOT NULL,
  classe VARCHAR(50),
  groupe_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (groupe_id) REFERENCES groupes(id) ON DELETE SET NULL
);

-- ═══════════════════════════════════════
-- STAGES
-- ═══════════════════════════════════════
CREATE TABLE stages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  etudiant_id INT NOT NULL,
  etablissement_id INT NOT NULL,
  service_id INT NOT NULL,
  groupe_id INT NULL,
  date_debut DATE NULL,
  date_fin DATE NULL,
  statut ENUM('en_attente','en_cours','termine','annule') DEFAULT 'en_attente',
  observations TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (etudiant_id) REFERENCES etudiants(id) ON DELETE CASCADE,
  FOREIGN KEY (etablissement_id) REFERENCES etablissements(id) ON DELETE RESTRICT,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT,
  FOREIGN KEY (groupe_id) REFERENCES groupes(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ═══════════════════════════════════════
-- SEED DATA – matches the current state
-- ═══════════════════════════════════════

-- Users (admin + staff)
INSERT INTO users (id, name, email, password, role) VALUES
(1, 'Admin Test', 'admin@test.com', SHA2('admin123', 256), 'admin'),
(3, 'Staff User', 'staff@insfp.com', SHA2('staff123', 256), 'user');

-- Etablissements
INSERT INTO etablissements (id, nom, type, wilaya) VALUES
(1, 'CHU Oran', 'CHU', 'Oran'),
(2, 'EPH Ain Temouchent', 'EPH', 'Ain Temouchent'),
(3, 'EPSP Bir El Djir', 'EPSP', 'Oran'),
(4, 'EHS Psychiatrie Oran', 'EHS', 'Oran');

-- Services
INSERT INTO services (id, nom, etablissement_id) VALUES
(1, 'Réanimation', 1),
(2, 'Contagieux', 1),
(3, 'UMC', 1),
(4, 'Gastroentérologie', 1),
(5, 'Pédiatrie', 1),
(6, 'Chirurgie', 4),
(7, 'Médecine interne', 2),
(8, 'Maternité', 2),
(9, 'Réanimation', 3),
(10, 'Psychiatrie', 4);

-- Groupes (the two real groups you created)
INSERT INTO groupes (id, nom, description) VALUES
(15, 'grp 1 isp 1 1&2', NULL),
(16, 'grp 2 isp 1 1&2', NULL);

-- Etudiants (all existing ones)
INSERT INTO etudiants (id, nom, prenom, specialite, annee, classe, groupe_id) VALUES
(1, 'Benali', 'Youcef', 'Infirmier', '1', '1', 15),
(2, 'Khadri', 'Amina', 'Sage-femme', '3', 'Groupe B', NULL),
(3, 'Merabti', 'Sofiane', 'Kinesitherapie', '1', 'Groupe A', NULL),
(4, 'Bouzid', 'Sara', 'Radiologie', '2', 'Groupe C', NULL),
(5, 'nom', 'adem', 'Infirmier', '1', '1', 16),
(7, 'dragon', 'abdalah', 'Radiologie', '2', 'B', NULL),
(9, 'nom', 'zaki', 'Infirmier', '1', '2', 16),
(10, 'nom', 'amir', 'Infirmier', '1', '2', 16),
(11, 'nom', 'rahim', 'Infirmier', '1', '1', 16),
(12, 'Mokhtar', 'Yahia', 'Infirmier', '1', '1', 15),
(13, 'abdelah', 'youcef', 'Infirmier', '1', '1', 15);

-- Stages – none, so we skip the INSERT
