<?php
require_once 'config.php';
corsHeaders();

$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? (int)$_GET['id'] : null;

switch ($method) {
    case 'GET':
        if ($id) {
            $stmt = $db->prepare(
                "SELECT s.*,
                        CONCAT(e.prenom, ' ', e.nom) AS etudiant_nom,
                        e.specialite AS etudiant_specialite,
                        et.nom AS etablissement_nom,
                        sv.nom AS service_nom,
                        g.nom AS groupe_nom
                 FROM stages s
                 LEFT JOIN etudiants e ON s.etudiant_id = e.id
                 LEFT JOIN etablissements et ON s.etablissement_id = et.id
                 LEFT JOIN services sv ON s.service_id = sv.id
                 LEFT JOIN groupes g ON s.groupe_id = g.id
                 WHERE s.id = ?"
            );
            $stmt->execute([$id]);
            $row = $stmt->fetch();
            if (!$row) jsonError("Stage introuvable", 404);
            json($row);
        }

        $where = [];
        $params = [];
        if (!empty($_GET['statut'])) { $where[] = "s.statut = ?"; $params[] = $_GET['statut']; }
        if (!empty($_GET['etudiant_id'])) { $where[] = "s.etudiant_id = ?"; $params[] = (int)$_GET['etudiant_id']; }
        if (!empty($_GET['etablissement_id'])) { $where[] = "s.etablissement_id = ?"; $params[] = (int)$_GET['etablissement_id']; }
        if (!empty($_GET['groupe_id'])) { $where[] = "s.groupe_id = ?"; $params[] = (int)$_GET['groupe_id']; }
        $sql = "SELECT s.*,
                       CONCAT(e.prenom, ' ', e.nom) AS etudiant_nom,
                       et.nom AS etablissement_nom,
                       sv.nom AS service_nom,
                       g.nom AS groupe_nom
                FROM stages s
                LEFT JOIN etudiants e ON s.etudiant_id = e.id
                LEFT JOIN etablissements et ON s.etablissement_id = et.id
                LEFT JOIN services sv ON s.service_id = sv.id
                LEFT JOIN groupes g ON s.groupe_id = g.id"
                . ($where ? " WHERE " . implode(" AND ", $where) : "")
                . " ORDER BY s.date_debut DESC";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        json($stmt->fetchAll());
        break;

    case 'POST':
        $data = body();
        $required = ['etablissement_id', 'service_id', 'date_debut', 'date_fin'];
        foreach ($required as $field) {
            if (empty($data[$field])) jsonError("$field est requis");
        }

        // ── DATE VALIDATION ──
        $date_debut = $data['date_debut'];
        $date_fin   = $data['date_fin'];

        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date_debut) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date_fin)) {
            jsonError("Format de date invalide. Utilisez YYYY-MM-DD.");
        }

        if ($date_fin < $date_debut) {
            jsonError("La date de fin ne peut pas être antérieure à la date de début.");
        }

        if ($date_fin === $date_debut) {
            jsonError("La date de fin ne peut pas être identique à la date de début.");
        }

        // ── Require groupe_id ──
        if (empty($data['groupe_id'])) {
            jsonError("Veuillez sélectionner un groupe.");
        }

        $groupeId = (int)$data['groupe_id'];

        // Get all students in this group
        $studentsStmt = $db->prepare("SELECT id FROM etudiants WHERE groupe_id = ?");
        $studentsStmt->execute([$groupeId]);
        $studentIds = $studentsStmt->fetchAll(\PDO::FETCH_COLUMN);

        if (empty($studentIds)) {
            jsonError("Ce groupe ne contient aucun étudiant.");
        }

        $insertStmt = $db->prepare(
            "INSERT INTO stages (etudiant_id, etablissement_id, service_id, groupe_id, date_debut, date_fin, statut, observations)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        );

        $insertedIds = [];
        foreach ($studentIds as $etudiantId) {
            $insertStmt->execute([
                (int)$etudiantId,
                (int)$data['etablissement_id'],
                (int)$data['service_id'],
                $groupeId,
                $date_debut,
                $date_fin,
                $data['statut'] ?? 'en_attente',
                $data['observations'] ?? null,
            ]);
            $insertedIds[] = $db->lastInsertId();
        }

        json([
            'message' => count($insertedIds) . ' stage(s) créé(s) pour le groupe.',
            'count' => count($insertedIds),
            'ids' => $insertedIds,
        ], 201);
        break;

    case 'PUT':
        if (!$id) jsonError("id requis");
        $data = body();

        // ── Get the current stage to find its groupe_id ──
        $currentStmt = $db->prepare("SELECT * FROM stages WHERE id = ?");
        $currentStmt->execute([$id]);
        $current = $currentStmt->fetch();
        if (!$current) jsonError("Stage introuvable", 404);

        // ── DATE VALIDATION (only if both dates are provided) ──
        $date_debut = !empty($data['date_debut']) ? $data['date_debut'] : $current['date_debut'];
        $date_fin   = !empty($data['date_fin']) ? $data['date_fin'] : $current['date_fin'];

        if (!empty($data['date_debut']) || !empty($data['date_fin'])) {
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date_debut) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date_fin)) {
                jsonError("Format de date invalide. Utilisez YYYY-MM-DD.");
            }
            if ($date_fin < $date_debut) {
                jsonError("La date de fin ne peut pas être antérieure à la date de début.");
            }
            if ($date_fin === $date_debut) {
                jsonError("La date de fin ne peut pas être identique à la date de début.");
            }
        }

        // ── Determine what to update ──
        // "observations" → update ONLY this specific student's stage
        // "statut", "date_debut", "date_fin" → update ALL stages in the same groupe
        // "observations_only" flag → sent from frontend when editing observations

        if (!empty($data['observations_only'])) {
            // Update only this specific stage's observations
            $stmt = $db->prepare("UPDATE stages SET observations=? WHERE id=?");
            $stmt->execute([$data['observations'] ?? null, $id]);
        } else {
            // Update ALL stages for the same groupe (statut, dates)
            $groupeId = $current['groupe_id'];
            if ($groupeId) {
                $stmt = $db->prepare(
                    "UPDATE stages
                     SET statut=?, date_debut=?, date_fin=?
                     WHERE groupe_id=?"
                );
                $stmt->execute([
                    $data['statut'] ?? $current['statut'],
                    $date_debut,
                    $date_fin,
                    $groupeId,
                ]);
            } else {
                // No groupe — update only this stage
                $stmt = $db->prepare(
                    "UPDATE stages SET statut=?, date_debut=?, date_fin=?, observations=? WHERE id=?"
                );
                $stmt->execute([
                    $data['statut'] ?? $current['statut'],
                    $date_debut,
                    $date_fin,
                    $data['observations'] ?? $current['observations'],
                    $id,
                ]);
            }
        }

        $upd = $db->prepare("SELECT * FROM stages WHERE id = ?");
        $upd->execute([$id]);
        json($upd->fetch());
        break;

    case 'DELETE':
        if (!$id) jsonError("id requis");

        // Get the stage to find its groupe
        $currentStmt = $db->prepare("SELECT * FROM stages WHERE id = ?");
        $currentStmt->execute([$id]);
        $current = $currentStmt->fetch();
        if (!$current) jsonError("Stage introuvable", 404);

        // Delete ALL stages for the same group
        if ($current['groupe_id']) {
            $stmt = $db->prepare("DELETE FROM stages WHERE groupe_id = ?");
            $stmt->execute([$current['groupe_id']]);
            $deleted = $stmt->rowCount();
            json(['message' => "$deleted stage(s) supprimé(s) pour ce groupe.", 'count' => $deleted]);
        } else {
            // No group — delete only this one
            $stmt = $db->prepare("DELETE FROM stages WHERE id = ?");
            $stmt->execute([$id]);
            json(['message' => 'Stage supprimé.', 'id' => $id]);
        }
        break;

    default:
        jsonError("Méthode non autorisée", 405);
}
