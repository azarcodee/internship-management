/**
 * PDF generation utilities for NurseTrack
 * Uses jsPDF + jspdf-autotable
 *
 * NOTE: jspdf-autotable has an ESM/CJS interop quirk under Vite —
 * the import resolves to a module object whose actual function is at .default.
 * We normalise it so the rest of the code works unchanged.
 */
import jsPDF from "jspdf";
import _autoTableImport from "jspdf-autotable";
// Handles both direct-function and { default: fn } module shapes
const autoTable =
  typeof _autoTableImport === "function"
    ? _autoTableImport
    : (_autoTableImport.default ?? _autoTableImport);

const INSFP_NAME = "Institut National de Formation Supérieure Paramédicale";
const INSFP_ADDR = "Oran, Algérie";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
}

/**
 * Generate one PDF with a letter per student (one page per letter)
 * This is the CLIENT-SIDE bulk letter PDF (all filtered stages at once).
 * For individual editable letters, see api/lettre_stage.php
 */
export function generateLettersPDF({ stages, etudiants, etablissements, services }) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210, H = 297;
  const M = 20;

  stages.forEach((stage, idx) => {
    if (idx > 0) doc.addPage();

    const etudiant   = etudiants.find((e) => e.id === stage.etudiant_id);
    const etab       = etablissements.find((e) => e.id === stage.etablissement_id);
    const service    = services.find((s) => s.id === stage.service_id);
    const fullName   = etudiant ? `${etudiant.prenom} ${etudiant.nom}` : "—";
    const etabName   = etab?.nom ?? "—";
    const etabWilaya = etab?.wilaya ?? "";
    const svcName    = service?.nom ?? "—";
    const todayStr   = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

    doc.setFillColor(11, 22, 40);
    doc.rect(0, 0, W, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("INSFP", M, 14);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(INSFP_NAME, M, 20);
    doc.text(INSFP_ADDR, M, 25);
    doc.setFontSize(8);
    doc.text(`Lettre ${idx + 1} / ${stages.length}`, W - M - 28, 17);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`À l'attention de`, W - M - 60, 45);
    doc.text(`La Direction de ${etabName}`, W - M - 60, 52);
    if (etabWilaya) {
      doc.setFont("helvetica", "normal");
      doc.text(`Wilaya de ${etabWilaya}`, W - M - 60, 58);
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Oran, le ${todayStr}`, M, 45);

    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.text("Objet : Demande de stage pratique en milieu hospitalier", M, 72);
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.5);
    doc.line(M, 74, W - M, 74);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text("Monsieur / Madame le Directeur,", M, 86);

    const bodyLines = doc.splitTextToSize(
      `Dans le cadre du programme de formation pratique dispensé par l'${INSFP_NAME}, ` +
      `nous avons l'honneur de vous adresser la présente demande de stage au profit de l'étudiant(e) ` +
      `ci-après désigné(e) :`,
      W - 2 * M
    );
    doc.text(bodyLines, M, 96);

    doc.setFillColor(240, 245, 255);
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.3);
    doc.roundedRect(M, 112, W - 2 * M, 42, 3, 3, "FD");

    const infoY = 121;
    const col2 = M + 70;
    const rowH = 7;
    const labels = ["Nom et prénom :", "Spécialité :", "Année d'étude :", "Service demandé :", "Établissement :"];
    const values = [
      fullName,
      etudiant?.specialite ?? "—",
      etudiant ? `${etudiant.annee}ème année` : "—",
      svcName,
      etabName,
    ];
    labels.forEach((lbl, i) => {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(lbl, M + 5, infoY + i * rowH);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text(values[i], col2, infoY + i * rowH);
    });

    const periodY = 162;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    const periodLines = doc.splitTextToSize(
      `La période de stage est prévue du ${formatDate(stage.date_debut)} au ${formatDate(stage.date_fin)}.`,
      W - 2 * M
    );
    doc.text(periodLines, M, periodY);

    const closing = doc.splitTextToSize(
      `Nous vous remercions de bien vouloir réserver un accueil favorable à cet(te) étudiant(e) au sein de votre service de ${svcName}. ` +
      `Nous restons à votre disposition pour tout renseignement complémentaire et vous prions d'agréer, ` +
      `Monsieur / Madame le Directeur, l'expression de nos salutations distinguées.`,
      W - 2 * M
    );
    doc.text(closing, M, periodY + 14);

    const sigY = H - 55;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Le Directeur de l'INSFP", M, sigY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("Signature & Cachet officiel", M, sigY + 6);
    doc.setDrawColor(200, 210, 230);
    doc.setLineWidth(0.3);
    doc.rect(M, sigY + 10, 55, 25);

    doc.setFillColor(11, 22, 40);
    doc.rect(0, H - 14, W, 14, "F");
    doc.setTextColor(139, 163, 196);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(INSFP_NAME, W / 2, H - 7, { align: "center" });
  });

  doc.save("lettres_de_stage.pdf");
}

/**
 * Generate a summary table PDF
 * NOTE: The "Tableau PDF" button in Stages.jsx calls this function.
 */
export function generateTablePDF({ stages, etudiants, etablissements, services }) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const W = 297;
  const M = 15;

  // Header
  doc.setFillColor(11, 22, 40);
  doc.rect(0, 0, W, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("NurseTrack — Récapitulatif des Stages", M, 10);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(139, 163, 196);
  doc.text(
    `Édité le ${new Date().toLocaleDateString("fr-FR")} · ${stages.length} stage(s)`,
    M, 17
  );

  // Table rows
  const rows = stages.map((st) => {
    const etudiant = etudiants.find((e) => e.id === st.etudiant_id);
    const etab     = etablissements.find((e) => e.id === st.etablissement_id);
    const service  = services.find((s) => s.id === st.service_id);
    const statutMap = {
      en_attente: "En attente",
      en_cours:   "En cours",
      termine:    "Terminé",
      annule:     "Annulé",
    };
    return [
      etudiant ? `${etudiant.prenom} ${etudiant.nom}` : "—",
      etudiant?.specialite ?? "—",
      service?.nom ?? "—",
      etab?.nom ?? "—",
      st.date_debut ?? "—",
      st.date_fin   ?? "—",
      statutMap[st.statut] ?? st.statut,
    ];
  });

  // autoTable — NO didDrawCell (that's what was breaking it)
  autoTable(doc, {
    startY: 27,
    head: [["Étudiant", "Spécialité", "Service", "Établissement", "Début", "Fin", "Statut"]],
    body: rows,
    theme: "grid",
    headStyles: {
      fillColor: [15, 32, 64],
      textColor: [241, 245, 249],
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: { fillColor: [245, 248, 255] },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 38 },
      1: { cellWidth: 32 },
      2: { cellWidth: 30 },
      3: { cellWidth: 50 },
      4: { cellWidth: 22 },
      5: { cellWidth: 22 },
      6: { fontStyle: "bold", cellWidth: 25 },
    },
    margin: { left: M, right: M },
  });

  // Footer
  const H = 210;
  doc.setFillColor(11, 22, 40);
  doc.rect(0, H - 12, W, 12, "F");
  doc.setTextColor(139, 163, 196);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("INSFP — Document généré automatiquement par NurseTrack", W / 2, H - 5, { align: "center" });

  doc.save("recapitulatif_stages.pdf");
}
