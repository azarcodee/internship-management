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

        if (empty($data['etablissement_id'])) jsonError("etablissement_id est requis");
        if (empty($data['service_id'])) jsonError("service_id est requis");
        if (empty($data['groupe_id'])) jsonError("groupe_id est requis");

        $groupeId = (int)$data['groupe_id'];

        // Get students in this group
        $studentsStmt = $db->prepare("SELECT id FROM etudiants WHERE groupe_id = ?");
        $studentsStmt->execute([$groupeId]);
        $studentIds = $studentsStmt->fetchAll(\PDO::FETCH_COLUMN);

        if (empty($studentIds)) {
            jsonError("Ce groupe ne contient aucun étudiant.");
        }

        $insertStmt = $db->prepare(
            "INSERT INTO stages (etudiant_id, etablissement_id, service_id, groupe_id, date_debut, date_fin, statut, observations)
             VALUES (?, ?, ?, ?, NULL, NULL, ?, ?)"
        );

        $insertedIds = [];
        foreach ($studentIds as $etudiantId) {
            $insertStmt->execute([
                (int)$etudiantId,
                (int)$data['etablissement_id'],
                (int)$data['service_id'],
                $groupeId,
                $data['statut'] ?? 'en_attente',
                $data['observations'] ?? null,
            ]);
            $insertedIds[] = $db->lastInsertId();
        }

        json([
            'message' => count($insertedIds) . ' stage(s) créé(s).',
            'count' => count($insertedIds),
        ], 201);
        break;

        case 'PUT':
            if (!$id) jsonError("id requis");
            $data = body();

            // Get the current stage
            $currentStmt = $db->prepare("SELECT * FROM stages WHERE id = ?");
            $currentStmt->execute([$id]);
            $current = $currentStmt->fetch();
            if (!$current) jsonError("Stage introuvable", 404);

            $groupeId = $current['groupe_id'];

            // Observations only — update just this one
            if (!empty($data['observations_only'])) {
                $stmt = $db->prepare("UPDATE stages SET observations=? WHERE id=?");
                $stmt->execute([$data['observations'] ?? null, $id]);
                json(['message' => 'Observation mise à jour']);
            }

            // Date update (from Tableau PDF) — update entire group
            if (!empty($data['date_debut']) || !empty($data['date_fin'])) {
                $date_debut = !empty($data['date_debut']) ? $data['date_debut'] : $current['date_debut'];
                $date_fin   = !empty($data['date_fin']) ? $data['date_fin'] : $current['date_fin'];

                $today = date('Y-m-d');
                $statut = 'en_attente';
                if ($date_debut <= $today && $date_fin >= $today) $statut = 'en_cours';
                elseif ($date_fin < $today) $statut = 'termine';

                if ($groupeId) {
                    $stmt = $db->prepare("UPDATE stages SET date_debut=?, date_fin=?, statut=? WHERE groupe_id=?");
                    $stmt->execute([$date_debut, $date_fin, $statut, $groupeId]);
                } else {
                    $stmt = $db->prepare("UPDATE stages SET date_debut=?, date_fin=?, statut=? WHERE id=?");
                    $stmt->execute([$date_debut, $date_fin, $statut, $id]);
                }
                json(['message' => 'Dates mises à jour pour tout le groupe']);
            }

            // Statut update — update entire group
            $statut = !empty($data['statut']) ? $data['statut'] : $current['statut'];

            if ($groupeId) {
                $stmt = $db->prepare("UPDATE stages SET statut=?, etablissement_id=?, service_id=? WHERE groupe_id=?");
                $stmt->execute([$statut, (int)$data['etablissement_id'] ?? $current['etablissement_id'], (int)$data['service_id'] ?? $current['service_id'], $groupeId]);
                json(['message' => 'Groupe entier mis à jour']);
            } else {
                $stmt = $db->prepare("UPDATE stages SET statut=?, etablissement_id=?, service_id=? WHERE id=?");
                $stmt->execute([$statut, (int)$data['etablissement_id'] ?? $current['etablissement_id'], (int)$data['service_id'] ?? $current['service_id'], $id]);
                json(['message' => 'Stage mis à jour']);
            }
            break;

    case 'DELETE':
        if (!$id) jsonError("id requis");

        $currentStmt = $db->prepare("SELECT * FROM stages WHERE id = ?");
        $currentStmt->execute([$id]);
        $current = $currentStmt->fetch();
        if (!$current) jsonError("Stage introuvable", 404);

        if ($current['groupe_id']) {
            $stmt = $db->prepare("DELETE FROM stages WHERE groupe_id = ?");
            $stmt->execute([$current['groupe_id']]);
            $deleted = $stmt->rowCount();
            json(['message' => "$deleted stage(s) supprimé(s)."]);
        } else {
            $stmt = $db->prepare("DELETE FROM stages WHERE id = ?");
            $stmt->execute([$id]);
            json(['message' => 'Stage supprimé.']);
        }
        break;

    default:
        jsonError("Méthode non autorisée", 405);
}
