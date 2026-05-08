/**
 * PDF generation utilities for NurseTrack
 * INSFP-style grouped PDF — with automatic rowSpan for Etablissement
 */

import jsPDF from "jspdf";
import _autoTableImport from "jspdf-autotable";

// Normalize autoTable import
const autoTable =
  typeof _autoTableImport === "function"
    ? _autoTableImport
    : (_autoTableImport.default ?? _autoTableImport);

/**
 * Aggressive string normalizer for safe comparison
 */
function normalize(str) {
  return (str || "")
    .trim()
    .replace(/[\s\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]+/g, " ")
    .replace(/[.,;:!?"'\-_()\[\]{}]/g, "")
    .toLowerCase();
}

export function generateTablePDF({
  stages,
  etudiants,
  etablissements,
  services,
  options = {},
}) {
  const {
    description = "",
    date_debut = "",
    date_fin = "",
  } = options;

  // ═══════════════════════════════════════
  // PDF INIT
  // ═══════════════════════════════════════

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const W = 210;
  const H = 297;
  const M = 15;

  let y = 12;

  // ═══════════════════════════════════════
  // HEADER
  // ═══════════════════════════════════════

  doc.setTextColor(0, 0, 0);

  doc.setFont("times", "bold");
  doc.setFontSize(11);

  doc.text(
    "REPUBLIQUE ALGERIENNE DEMOCRATIQUE ET POPULAIRE",
    W / 2,
    y,
    { align: "center" }
  );

  y += 6;

  doc.text("MINISTERE DE LA SANTE", W / 2, y, {
    align: "center",
  });

  y += 12;

  doc.setFontSize(10);

  doc.text("DIRECTION DE LA SANTE", M, y);
  y += 5;

  doc.text("INSTITUT NATIONAL DE FORMATION", M, y);
  y += 5;

  doc.text("SUPERIEURE PARAMEDICALE", M, y);
  y += 5;

  doc.text("MOSTAGANEM", M + 15, y);

  // ═══════════════════════════════════════
  // TITLE
  // ═══════════════════════════════════════

  y += 18;

  doc.setFontSize(13);

  doc.text("Affectation de Stage", W / 2, y, {
    align: "center",
  });

  // ═══════════════════════════════════════
  // GRADE
  // ═══════════════════════════════════════

  y += 12;

  doc.setFontSize(10);

  doc.setFont("times", "bold");

  doc.text("Grade :", M, y);

  doc.setFont("times", "normal");

  doc.text(description || "—", M + 20, y);

  // ═══════════════════════════════════════
  // PERIOD
  // ═══════════════════════════════════════

  y += 8;

  doc.setFont("times", "bold");

  doc.text(
    `Période de stage : ${date_debut || "—"} Au ${date_fin || "—"}`,
    M,
    y
  );

  // ═══════════════════════════════════════
  // BUILD GROUPS
  // ═══════════════════════════════════════

  y += 10;

  const groups = {};

  stages.forEach((stage) => {
    const etudiant = etudiants.find(
      (e) => e.id === stage.etudiant_id
    );

    const service = services.find(
      (s) => s.id === stage.service_id
    );

    const etablissement = etablissements.find(
      (e) => e.id === stage.etablissement_id
    );

    if (!etudiant) return;

    const serviceName = (service?.nom || "—").trim();
    const etablissementName = (etablissement?.nom || "—").trim();

    // Each group = its own row, never merged
    const groupKey =
      stage.groupe_id ||
      stage.group_id ||
      stage.groupe ||
      `${stage.service_id}_${stage.etablissement_id}_${stage.id}`;

    if (!groups[groupKey]) {
      groups[groupKey] = {
        service: serviceName,
        etablissement: etablissementName,
        students: [],
      };
    }

    groups[groupKey].students.push(
      `${etudiant.nom} ${etudiant.prenom}`
    );
  });

  let groupedRows = Object.values(groups);

  // ═══════════════════════════════════════
  // SORT BY ETABLISSEMENT (then service)
  // ═══════════════════════════════════════
  groupedRows.sort((a, b) => {
    const etabCompare = normalize(a.etablissement).localeCompare(normalize(b.etablissement));
    if (etabCompare !== 0) return etabCompare;
    return a.service.localeCompare(b.service);
  });

  // ═══════════════════════════════════════
  // BUILD TABLE BODY WITH ROWSPAN
  // ═══════════════════════════════════════

  const bodyRows = [];
  let etabBlockStart = 0;

  const plainRows = groupedRows.map((group) => [
    group.students.join("\n"),
    group.service,
    group.etablissement,
  ]);

  for (let i = 0; i < plainRows.length; i++) {
    const currentEtab = plainRows[i][2];

    if (i === etabBlockStart) {
      let blockSize = 1;
      while (
        i + blockSize < plainRows.length &&
        normalize(plainRows[i + blockSize][2]) === normalize(currentEtab)
      ) {
        blockSize++;
      }

      if (blockSize > 1) {
        bodyRows.push([
          { content: plainRows[i][0] },
          { content: plainRows[i][1] },
          { content: plainRows[i][2], rowSpan: blockSize, styles: { valign: "middle", halign: "center" } },
        ]);
        for (let j = 1; j < blockSize; j++) {
          bodyRows.push([
            { content: plainRows[i + j][0] },
            { content: plainRows[i + j][1] },
            { content: "" },
          ]);
        }
        i += blockSize - 1;
        etabBlockStart = i + 1;
      } else {
        bodyRows.push([
          { content: plainRows[i][0] },
          { content: plainRows[i][1] },
          { content: plainRows[i][2] },
        ]);
        etabBlockStart = i + 1;
      }
    }
  }

  // ═══════════════════════════════════════
  // TABLE
  // ═══════════════════════════════════════

  autoTable(doc, {
    startY: y,

    head: [["Nom et Prénoms", "Service", "Etablissement"]],

    body: bodyRows,

    theme: "grid",

    styles: {
      font: "times",
      fontSize: 9,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
      overflow: "linebreak",
      cellPadding: 4,
      valign: "middle",
    },

    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      lineWidth: 0.3,
      halign: "center",
      valign: "middle",
    },

    bodyStyles: {
      valign: "middle",
    },

    columnStyles: {
      0: {
        cellWidth: 85,
      },
      1: {
        cellWidth: 55,
        halign: "center",
      },
      2: {
        cellWidth: 35,
        halign: "center",
      },
    },

    margin: {
      left: M,
      right: M,
    },
  });

  // ═══════════════════════════════════════
  // SIGNATURE
  // ═══════════════════════════════════════

  const finalY = doc.lastAutoTable.finalY || 240;

  let signatureY = finalY + 25;

  if (signatureY > 260) {
    doc.addPage();
    signatureY = 40;
  }

  doc.setFont("times", "bold");
  doc.setFontSize(10);

  doc.text(
    "Le Directeur de l'INSFP",
    W - 65,
    signatureY
  );

  doc.setFont("times", "normal");

  doc.text(
    "Signature & Cachet officiel",
    W - 65,
    signatureY + 8
  );

  // ═══════════════════════════════════════
  // FOOTER
  // ═══════════════════════════════════════

  const pageCount = doc.internal.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    doc.setFont("times", "italic");
    doc.setFontSize(7);

    doc.setTextColor(120);

    doc.text(
      `INSFP Mostaganem — Généré le ${new Date().toLocaleDateString(
        "fr-FR"
      )}`,
      W / 2,
      H - 5,
      {
        align: "center",
      }
    );
  }

  // ═══════════════════════════════════════
  // SAVE
  // ═══════════════════════════════════════

  doc.save(
    `affectation_stage_${date_debut || "document"}.pdf`
  );
}

// ═══════════════════════════════════════════
// LETTER PDF
// ═══════════════════════════════════════════

export function generateLetterPDF({
  numero = ".....",
  annee = new Date().getFullYear(),

  destinataire = "",
  objet = "A/S stage pratique",
  pj = "Liste nominative des étudiants(es)",

  anneePedagogique = "2024/2025",

  heureDebut = "08h00",
  heureFin = "16h00",

  dateDebut = "",
  dateFin = "",
}) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const W = 210;
  const M = 20;

  let y = 15;

  doc.setFont("times", "normal");
  doc.setTextColor(0, 0, 0);

  // =========================
  // HEADER CENTER
  // =========================
  doc.setFont("times", "bold");
  doc.setFontSize(11);

  doc.text(
    "REPUBLIQUE ALGERIENNE DEMOCRATIQUE ET POPULAIRE",
    W / 2,
    y,
    { align: "center" }
  );

  y += 6;

  doc.text("MINISTERE DE LA SANTE", W / 2, y, {
    align: "center",
  });

  // =========================
  // LEFT BLOCK
  // =========================
  y += 18;

  doc.setFontSize(10);

  doc.text("DIRECTION DE LA SANTE ET DE LA POPULATION", M, y);
  y += 5;

  doc.text("INSTITUT NATIONAL DE LA FORMATION", M, y);
  y += 5;

  doc.text("SUPERIEURE PARAMEDICALE", M, y);
  y += 5;

  doc.text("MOSTAGANEM", M + 20, y);

  // Number
  y += 12;

  doc.text(`N° ${numero} / INFSPM / ${annee}`, M, y);

  // =========================
  // DESTINATAIRE
  // =========================
  y += 18;

  doc.setFont("times", "italic");
  doc.setFontSize(12);

  doc.text("Monsieur", W / 2, y, {
    align: "center",
  });

  y += 7;

  doc.text(
    "Le Directeur De L'institut National de Formation Supérieure paramédicale",
    W / 2,
    y,
    { align: "center" }
  );

  y += 6;

  doc.text("Mostaganem", W / 2, y, {
    align: "center",
  });

  y += 7;

  doc.text("A", W / 2, y, {
    align: "center",
  });

  y += 7;

  // dynamic recipient
  doc.text(destinataire || "Madame ...", W / 2, y, {
    align: "center",
    maxWidth: 140,
  });

  // =========================
  // OBJECT
  // =========================
  y += 18;

  doc.setFont("times", "bold");
  doc.setFontSize(11);

  doc.text(`Objet : ${objet}`, M, y);

  y += 7;

  doc.text(`P/J : ${pj}`, M, y);

  // underline PJ
  const width = doc.getTextWidth(`P/J : ${pj}`);
  doc.line(M, y + 1, M + width, y + 1);

  // =========================
  // BODY
  // =========================
  y += 18;

  doc.setFont("times", "normal");
  doc.setFontSize(11);

  const paragraph1 =
    `Dans le cadre du cursus de la Formation des étudiants(es) ` +
    `Paramédicaux de santé publique, il est prévu un stage pratique ` +
    `au cours de l'année pédagogique ${anneePedagogique}.`;

  doc.text(paragraph1, M, y, {
    maxWidth: 170,
    align: "justify",
  });

  y += 28;

  const paragraph2 =
    `A cet effet, j'ai l'honneur de vous demander de bien vouloir accepter ` +
    `les étudiants(es) cités(es) ci-dessous à effectuer un stage pratique ` +
    `heure du stage ${heureDebut} jusqu'à ${heureFin}.`;

  doc.text(paragraph2, M, y, {
    maxWidth: 170,
    align: "justify",
  });

  y += 28;

  const paragraph3 =
    `Au niveau de votre établissement. Pour la période au ${dateDebut} au ${dateFin}.`;

  doc.text(paragraph3, M, y, {
    maxWidth: 170,
    align: "justify",
  });

  y += 20;

  const paragraph4 =
    `Durant le stage les étudiants(es) sont soumis aux règlements ` +
    `intérieurs de votre établissement.`;

  doc.text(paragraph4, M, y, {
    maxWidth: 170,
    align: "justify",
  });

  y += 20;

  const paragraph5 =
      `Je vous prie de croire à mes sincères salutations.`;

  doc.text(paragraph5, M, y, {
    maxWidth: 170,
    align: "justify",
  });

  // =========================
  // SAVE
  // =========================
  doc.save("lettre_stage.pdf");
}
