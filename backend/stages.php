<?php
require_once 'config.php';
corsHeaders();

$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? (int)$_GET['id'] : null;

switch ($method) {
    case 'GET':
        if ($id) {
            $stmt = $db->prepare("SELECT * FROM stages WHERE id = ?");
            $stmt->execute([$id]);
            $row = $stmt->fetch();
            if (!$row) jsonError("Stage introuvable", 404);
            json($row);
        }
        // Optional filters: statut, etudiant_id, etablissement_id
        $where = [];
        $params = [];
        if (!empty($_GET['statut'])) { $where[] = "statut = ?"; $params[] = $_GET['statut']; }
        if (!empty($_GET['etudiant_id'])) { $where[] = "etudiant_id = ?"; $params[] = (int)$_GET['etudiant_id']; }
        if (!empty($_GET['etablissement_id'])) { $where[] = "etablissement_id = ?"; $params[] = (int)$_GET['etablissement_id']; }
        $sql = "SELECT * FROM stages" . ($where ? " WHERE " . implode(" AND ", $where) : "") . " ORDER BY date_debut DESC";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        json($stmt->fetchAll());
        break;

    case 'POST':
        $data = body();
        $required = ['etudiant_id', 'etablissement_id', 'service_id', 'date_debut', 'date_fin'];
        foreach ($required as $field) {
            if (empty($data[$field])) jsonError("$field est requis");
        }
        $stmt = $db->prepare(
            "INSERT INTO stages (etudiant_id, etablissement_id, service_id, date_debut, date_fin, statut, observations)
             VALUES (?, ?, ?, ?, ?, ?, ?)"
        );
        $stmt->execute([
            (int)$data['etudiant_id'],
            (int)$data['etablissement_id'],
            (int)$data['service_id'],
            $data['date_debut'],
            $data['date_fin'],
            $data['statut'] ?? 'en_attente',
            $data['observations'] ?? null,
        ]);
        $new = $db->prepare("SELECT * FROM stages WHERE id = ?");
        $new->execute([$db->lastInsertId()]);
        json($new->fetch(), 201);
        break;

    case 'PUT':
        if (!$id) jsonError("id requis");
        $data = body();
        $stmt = $db->prepare(
            "UPDATE stages SET etudiant_id=?, etablissement_id=?, service_id=?, date_debut=?, date_fin=?, statut=?, observations=? WHERE id=?"
        );
        $stmt->execute([
            (int)$data['etudiant_id'],
            (int)$data['etablissement_id'],
            (int)$data['service_id'],
            $data['date_debut'],
            $data['date_fin'],
            $data['statut'] ?? 'en_attente',
            $data['observations'] ?? null,
            $id,
        ]);
        if ($stmt->rowCount() === 0) jsonError("Stage introuvable ou aucun changement", 404);
        $upd = $db->prepare("SELECT * FROM stages WHERE id = ?");
        $upd->execute([$id]);
        json($upd->fetch());
        break;

    case 'DELETE':
        if (!$id) jsonError("id requis");
        $stmt = $db->prepare("DELETE FROM stages WHERE id = ?");
        $stmt->execute([$id]);
        if ($stmt->rowCount() === 0) jsonError("Stage introuvable", 404);
        json(['message' => 'Stage supprimé', 'id' => $id]);
        break;

    default:
        jsonError("Méthode non autorisée", 405);
}
