<?php
require_once 'config.php';
corsHeaders();

$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? (int)$_GET['id'] : null;

switch ($method) {
    case 'GET':
        if ($id) {
            $stmt = $db->prepare("SELECT * FROM etablissements WHERE id = ?");
            $stmt->execute([$id]);
            $row = $stmt->fetch();
            if (!$row) jsonError("Établissement introuvable", 404);
            json($row);
        }
        $stmt = $db->query("SELECT * FROM etablissements ORDER BY nom");
        json($stmt->fetchAll());
        break;

    case 'POST':
        $data = body();
        if (empty($data['nom'])) jsonError("nom est requis");
        $stmt = $db->prepare("INSERT INTO etablissements (nom, type, wilaya, adresse) VALUES (?, ?, ?, ?)");
        $stmt->execute([trim($data['nom']), $data['type'] ?? 'AUTRE', $data['wilaya'] ?? null, $data['adresse'] ?? null]);
        $new = $db->prepare("SELECT * FROM etablissements WHERE id = ?");
        $new->execute([$db->lastInsertId()]);
        json($new->fetch(), 201);
        break;

    case 'PUT':
        if (!$id) jsonError("id requis");
        $data = body();
        $stmt = $db->prepare("UPDATE etablissements SET nom=?, type=?, wilaya=?, adresse=? WHERE id=?");
        $stmt->execute([trim($data['nom']), $data['type'] ?? 'AUTRE', $data['wilaya'] ?? null, $data['adresse'] ?? null, $id]);
        if ($stmt->rowCount() === 0) jsonError("Établissement introuvable ou aucun changement", 404);
        $upd = $db->prepare("SELECT * FROM etablissements WHERE id = ?");
        $upd->execute([$id]);
        json($upd->fetch());
        break;

    case 'DELETE':
        if (!$id) jsonError("id requis");
        $stmt = $db->prepare("DELETE FROM etablissements WHERE id = ?");
        $stmt->execute([$id]);
        if ($stmt->rowCount() === 0) jsonError("Établissement introuvable", 404);
        json(['message' => 'Établissement supprimé', 'id' => $id]);
        break;

    default:
        jsonError("Méthode non autorisée", 405);
}
