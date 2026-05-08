// ─── Business logic ───────────────────────────────────────────────────────────

/**
 * Returns the cursus length (years) for a given specialité.
 * Rule: all specialties = 3 years, except "Sage-femme" = 5 years.
 */
export function getCursus(specialite) {
  return specialite === "Sage-femme" ? 5 : 3;
}

// ─── Enums matching the DB exactly ───────────────────────────────────────────

export const SPECIALITES = [
  "Infirmier",
  "Kinesitherapie",
  "Sage-femme",
  "Laboratoire",
  "Radiologie",
  "Préparateur en Pharmacie",
  "Autre",
];

export const ANNEES = ["1", "2", "3", "4", "5"];

export const ETABLISSEMENT_TYPES = ["EPH", "EPSP", "CHU", "EHS", "OHU", "AUTRE"];

export const STAGE_STATUTS = ["en_attente", "en_cours", "termine", "annule"];

// ─── Initial data mirroring the SQL seed data ────────────────────────────────

export const INIT_ETABLISSEMENTS = [
  { id: 1, nom: "CHU Oran",             type: "CHU",  wilaya: "Oran",           adresse: null },
  { id: 2, nom: "EPH Ain Temouchent",   type: "EPH",  wilaya: "Ain Temouchent", adresse: null },
  { id: 3, nom: "EPSP Bir El Djir",     type: "EPSP", wilaya: "Oran",           adresse: null },
  { id: 4, nom: "EHS Psychiatrie Oran", type: "EHS",  wilaya: "Oran",           adresse: null },
];

export const INIT_SERVICES = [
  { id: 1,  nom: "Réanimation",       etablissement_id: 1 },
  { id: 2,  nom: "Contagieux",        etablissement_id: 1 },
  { id: 3,  nom: "UMC",              etablissement_id: 1 },
  { id: 4,  nom: "Gastroentérologie", etablissement_id: 1 },
  { id: 5,  nom: "Pédiatrie",         etablissement_id: 1 },
  { id: 6,  nom: "Chirurgie",         etablissement_id: 1 },
  { id: 7,  nom: "Médecine interne",  etablissement_id: 2 },
  { id: 8,  nom: "Maternité",         etablissement_id: 2 },
  { id: 9,  nom: "Réanimation",       etablissement_id: 3 },
  { id: 10, nom: "Psychiatrie",       etablissement_id: 4 },
];

export const INIT_ETUDIANTS = [
  { id: 1, nom: "Benali",  prenom: "Youcef",  specialite: "Infirmier",      annee: "2", classe: "Groupe A" },
  { id: 2, nom: "Khadri",  prenom: "Amina",   specialite: "Sage-femme",     annee: "3", classe: "Groupe B" },
  { id: 3, nom: "Merabti", prenom: "Sofiane", specialite: "Kinesitherapie", annee: "1", classe: "Groupe A" },
  { id: 4, nom: "Bouzid",  prenom: "Sara",    specialite: "Radiologie",     annee: "2", classe: "Groupe C" },
];

export const INIT_STAGES = [
  { id: 1, etudiant_id: 1, etablissement_id: 1, service_id: 1, date_debut: "2025-01-15", date_fin: "2025-02-15", statut: "termine",    observations: null },
  { id: 2, etudiant_id: 2, etablissement_id: 1, service_id: 5, date_debut: "2025-03-01", date_fin: "2025-04-01", statut: "en_cours",   observations: null },
  { id: 3, etudiant_id: 3, etablissement_id: 2, service_id: 7, date_debut: "2025-03-10", date_fin: "2025-04-10", statut: "en_cours",   observations: null },
  { id: 4, etudiant_id: 4, etablissement_id: 3, service_id: 9, date_debut: "2025-04-01", date_fin: "2025-05-01", statut: "en_attente", observations: null },
];

// ─── Navigation ───────────────────────────────────────────────────────────────

export const NAV_ITEMS = [
  { id: "dashboard",      icon: "LayoutDashboard", label: "Tableau de bord" },
  { id: "etudiants",      icon: "GraduationCap",   label: "Étudiants" },
  { id: "etablissements", icon: "Building2",        label: "Établissements" },
  { id: "services",       icon: "Stethoscope",      label: "Services" },
  { id: "groupes",        icon: "Users",            label: "Groupes" },
  { id: "stages",         icon: "ClipboardList",    label: "Stages" },
  { id: "reports",        icon: "BarChart3",        label: "Rapports" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function genId() {
  return Math.floor(Math.random() * 900000) + 100000;
}

export function statutLabel(statut) {
  const map = {
    en_attente: "En attente",
    en_cours:   "En cours",
    termine:    "Terminé",
    annule:     "Annulé",
  };
  return map[statut] ?? statut;
}
