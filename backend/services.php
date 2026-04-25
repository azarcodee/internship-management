<?php
require_once 'config.php';
corsHeaders();

$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? (int)$_GET['id'] : null;

switch ($method) {
    case 'GET':
        if ($id) {
            $stmt = $db->prepare("SELECT * FROM services WHERE id = ?");
            $stmt->execute([$id]);
            $row = $stmt->fetch();
            if (!$row) jsonError("Service introuvable", 404);
            json($row);
        }
        $etab = isset($_GET['etablissement_id']) ? (int)$_GET['etablissement_id'] : null;
        if ($etab) {
            $stmt = $db->prepare("SELECT * FROM services WHERE etablissement_id = ? ORDER BY nom");
            $stmt->execute([$etab]);
        } else {
            $stmt = $db->query("SELECT * FROM services ORDER BY nom");
        }
        json($stmt->fetchAll());
        break;

    case 'POST':
        $data = body();
        if (empty($data['nom']) || empty($data['etablissement_id'])) jsonError("nom et etablissement_id sont requis");
        $stmt = $db->prepare("INSERT INTO services (nom, etablissement_id) VALUES (?, ?)");
        $stmt->execute([trim($data['nom']), (int)$data['etablissement_id']]);
        $new = $db->prepare("SELECT * FROM services WHERE id = ?");
        $new->execute([$db->lastInsertId()]);
        json($new->fetch(), 201);
        break;

    case 'PUT':
        if (!$id) jsonError("id requis");
        $data = body();
        $stmt = $db->prepare("UPDATE services SET nom=?, etablissement_id=? WHERE id=?");
        $stmt->execute([trim($data['nom']), (int)$data['etablissement_id'], $id]);
        if ($stmt->rowCount() === 0) jsonError("Service introuvable ou aucun changement", 404);
        $upd = $db->prepare("SELECT * FROM services WHERE id = ?");
        $upd->execute([$id]);
        json($upd->fetch());
        break;

    case 'DELETE':
        if (!$id) jsonError("id requis");
        $stmt = $db->prepare("DELETE FROM services WHERE id = ?");
        $stmt->execute([$id]);
        if ($stmt->rowCount() === 0) jsonError("Service introuvable", 404);
        json(['message' => 'Service supprimé', 'id' => $id]);
        break;

    default:
        jsonError("Méthode non autorisée", 405);
}
