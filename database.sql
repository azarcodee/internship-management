CREATE DATABASE IF NOT EXISTS internshipmanagementdb;
USE internshipmanagementdb;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE etablissements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(150) NOT NULL,
  type ENUM('EPH','EPSP','CHU','EHS','OHU','AUTRE') DEFAULT 'AUTRE',
  wilaya VARCHAR(100),
  adresse VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(150) NOT NULL,
  etablissement_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (etablissement_id) REFERENCES etablissements(id) ON DELETE CASCADE
);

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
    'Pharmacie',
    'Anesthesie',
    'Nutrition',
    'Autre'
  ) NOT NULL,
  annee ENUM('1','2','3','4','5') NOT NULL,
  classe VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE stages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  etudiant_id INT NOT NULL,
  etablissement_id INT NOT NULL,
  service_id INT NOT NULL,
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  statut ENUM('en_attente','en_cours','termine','annule') DEFAULT 'en_attente',
  observations TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (etudiant_id) REFERENCES etudiants(id) ON DELETE CASCADE,
  FOREIGN KEY (etablissement_id) REFERENCES etablissements(id) ON DELETE RESTRICT,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

ALTER TABLE users ADD COLUMN reset_token VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN reset_expires DATETIME NULL;

INSERT INTO users (name, email, password, role) VALUES
('Admin Test', 'admin@test.com', SHA2('admin123', 256), 'admin'),
('Staff Test', 'staff@test.com', SHA2('staff123', 256), 'user');

INSERT INTO etablissements (nom, type, wilaya) VALUES
('CHU Oran', 'CHU', 'Oran'),
('EPH Ain Temouchent', 'EPH', 'Ain Temouchent'),
('EPSP Bir El Djir', 'EPSP', 'Oran'),
('EHS Psychiatrie Oran', 'EHS', 'Oran');

INSERT INTO services (nom, etablissement_id) VALUES
('Réanimation', 1),
('Contagieux', 1),
('UMC', 1),
('Gastroentérologie', 1),
('Pédiatrie', 1),
('Chirurgie', 1),
('Médecine interne', 2),
('Maternité', 2),
('Réanimation', 3),
('Psychiatrie', 4);

INSERT INTO etudiants (nom, prenom, specialite, annee, classe) VALUES
('Benali', 'Youcef', 'Infirmier', '2', 'Groupe A'),
('Khadri', 'Amina', 'Sage-femme', '3', 'Groupe B'),
('Merabti', 'Sofiane', 'Kinesitherapie', '1', 'Groupe A'),
('Bouzid', 'Sara', 'Radiologie', '2', 'Groupe C');

INSERT INTO stages (etudiant_id, etablissement_id, service_id, date_debut, date_fin, statut, created_by) VALUES
(1, 1, 1, '2025-01-15', '2025-02-15', 'termine', 1),
(2, 1, 5, '2025-03-01', '2025-04-01', 'en_cours', 2),
(3, 2, 7, '2025-03-10', '2025-04-10', 'en_cours', 2),
(4, 3, 9, '2025-04-01', '2025-05-01', 'en_attente', 2);