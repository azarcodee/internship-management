<?php
require_once 'config.php';
corsHeaders();

$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? (int)$_GET['id'] : null;

switch ($method) {

    case 'GET':
        if ($id) {
            $stmt = $db->prepare("SELECT * FROM groupes WHERE id = ?");
            $stmt->execute([$id]);
            $groupe = $stmt->fetch();
            if (!$groupe) jsonError("Groupe introuvable", 404);

            $studentsStmt = $db->prepare(
                "SELECT * FROM etudiants WHERE groupe_id = ? ORDER BY nom, prenom"
            );
            $studentsStmt->execute([$id]);
            $groupe['etudiants'] = $studentsStmt->fetchAll();
            json($groupe);
        }

        $stmt = $db->query(
            "SELECT g.*, COUNT(e.id) AS nb_etudiants
             FROM groupes g
             LEFT JOIN etudiants e ON g.id = e.groupe_id
             GROUP BY g.id
             ORDER BY g.nom"
        );
        json($stmt->fetchAll());
        break;

    case 'POST':
        $data = body();
        if (empty($data['nom'])) jsonError("Le nom du groupe est requis.");

        $nom = trim($data['nom']);

        // CHECK 1: Duplicate group name
        $checkStmt = $db->prepare("SELECT id FROM groupes WHERE LOWER(nom) = LOWER(?)");
        $checkStmt->execute([$nom]);
        if ($checkStmt->fetch()) {
            jsonError("Un groupe avec ce nom existe déjà.");
        }

        // CHECK 2: Students already in another group
        if (!empty($data['etudiant_ids']) && is_array($data['etudiant_ids'])) {
            $placeholders = implode(',', array_fill(0, count($data['etudiant_ids']), '?'));
            $dupStmt = $db->prepare(
                "SELECT e.id, e.prenom, e.nom, g.nom AS groupe_nom
                 FROM etudiants e
                 LEFT JOIN groupes g ON e.groupe_id = g.id
                 WHERE e.id IN ($placeholders) AND e.groupe_id IS NOT NULL"
            );
            $dupStmt->execute(array_map('intval', $data['etudiant_ids']));
            $duplicates = $dupStmt->fetchAll();

            if (!empty($duplicates)) {
                $names = array_map(function($d) {
                    return $d['prenom'] . ' ' . $d['nom'] . ' (déjà dans ' . $d['groupe_nom'] . ')';
                }, $duplicates);
                jsonError("Ces étudiants sont déjà dans un autre groupe : " . implode(', ', $names));
            }
        }

        // All good — create the group
        $stmt = $db->prepare("INSERT INTO groupes (nom, description) VALUES (?, ?)");
        $stmt->execute([$nom, $data['description'] ?? null]);
        $newId = $db->lastInsertId();

        // Assign students
        if (!empty($data['etudiant_ids']) && is_array($data['etudiant_ids'])) {
            $updateStmt = $db->prepare("UPDATE etudiants SET groupe_id = ? WHERE id = ?");
            foreach ($data['etudiant_ids'] as $etudiantId) {
                $updateStmt->execute([$newId, (int)$etudiantId]);
            }
        }

        $new = $db->prepare("SELECT * FROM groupes WHERE id = ?");
        $new->execute([$newId]);
        json($new->fetch(), 201);
        break;

    case 'PUT':
        if (!$id) jsonError("ID requis.");
        $data = body();

        $nom = trim($data['nom']);

        // CHECK 1: Duplicate group name (exclude current group)
        $checkStmt = $db->prepare("SELECT id FROM groupes WHERE LOWER(nom) = LOWER(?) AND id != ?");
        $checkStmt->execute([$nom, $id]);
        if ($checkStmt->fetch()) {
            jsonError("Un autre groupe avec ce nom existe déjà.");
        }

        // CHECK 2: Students already in another group (exclude current group)
        if (isset($data['etudiant_ids']) && is_array($data['etudiant_ids']) && !empty($data['etudiant_ids'])) {
            $placeholders = implode(',', array_fill(0, count($data['etudiant_ids']), '?'));
            $params = array_map('intval', $data['etudiant_ids']);
            $params[] = $id; // exclude current group
            $dupStmt = $db->prepare(
                "SELECT e.id, e.prenom, e.nom, g.nom AS groupe_nom
                 FROM etudiants e
                 LEFT JOIN groupes g ON e.groupe_id = g.id
                 WHERE e.id IN ($placeholders) AND e.groupe_id IS NOT NULL AND e.groupe_id != ?"
            );
            $dupStmt->execute($params);
            $duplicates = $dupStmt->fetchAll();

            if (!empty($duplicates)) {
                $names = array_map(function($d) {
                    return $d['prenom'] . ' ' . $d['nom'] . ' (déjà dans ' . $d['groupe_nom'] . ')';
                }, $duplicates);
                jsonError("Ces étudiants sont déjà dans un autre groupe : " . implode(', ', $names));
            }
        }

        // Update groupe
        $stmt = $db->prepare("UPDATE groupes SET nom=?, description=? WHERE id=?");
        $stmt->execute([$nom, $data['description'] ?? null, $id]);

        // Reassign students
        if (isset($data['etudiant_ids']) && is_array($data['etudiant_ids'])) {
            $db->prepare("UPDATE etudiants SET groupe_id = NULL WHERE groupe_id = ?")->execute([$id]);
            if (!empty($data['etudiant_ids'])) {
                $updateStmt = $db->prepare("UPDATE etudiants SET groupe_id = ? WHERE id = ?");
                foreach ($data['etudiant_ids'] as $etudiantId) {
                    $updateStmt->execute([$id, (int)$etudiantId]);
                }
            }
        }

        $upd = $db->prepare("SELECT * FROM groupes WHERE id = ?");
        $upd->execute([$id]);
        json($upd->fetch());
        break;

    case 'DELETE':
        if (!$id) jsonError("ID requis.");
        $db->prepare("UPDATE etudiants SET groupe_id = NULL WHERE groupe_id = ?")->execute([$id]);
        $stmt = $db->prepare("DELETE FROM groupes WHERE id = ?");
        $stmt->execute([$id]);
        if ($stmt->rowCount() === 0) jsonError("Groupe introuvable", 404);
        json(['message' => 'Groupe supprimé', 'id' => $id]);
        break;

    default:
        jsonError("Méthode non autorisée", 405);
}
