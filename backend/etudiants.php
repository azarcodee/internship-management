<?php
require_once 'config.php';
corsHeaders();

$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? (int)$_GET['id'] : null;

switch ($method) {

    case 'GET':
        if ($id) {
            $stmt = $db->prepare("SELECT * FROM etudiants WHERE id = ?");
            $stmt->execute([$id]);
            $row = $stmt->fetch();
            if (!$row) jsonError("Étudiant introuvable", 404);
            json($row);
        }
        $stmt = $db->query("SELECT * FROM etudiants ORDER BY nom, prenom");
        json($stmt->fetchAll());
        break;

    case 'POST':
        $data = body();
        if (empty($data['nom']) || empty($data['prenom'])) jsonError("nom et prenom sont requis");
        $stmt = $db->prepare(
            "INSERT INTO etudiants (nom, prenom, specialite, annee, classe) VALUES (?, ?, ?, ?, ?)"
        );
        $stmt->execute([
            trim($data['nom']),
            trim($data['prenom']),
            $data['specialite'] ?? 'Infirmier',
            $data['annee'] ?? '1',
            $data['classe'] ?? null,
        ]);
        $new = $db->prepare("SELECT * FROM etudiants WHERE id = ?");
        $new->execute([$db->lastInsertId()]);
        json($new->fetch(), 201);
        break;

    case 'PUT':
        if (!$id) jsonError("id requis");
        $data = body();
        if (empty($data['nom']) || empty($data['prenom'])) jsonError("nom et prenom sont requis");
        $stmt = $db->prepare(
            "UPDATE etudiants SET nom=?, prenom=?, specialite=?, annee=?, classe=? WHERE id=?"
        );
        $stmt->execute([
            trim($data['nom']),
            trim($data['prenom']),
            $data['specialite'] ?? 'Infirmier',
            $data['annee'] ?? '1',
            $data['classe'] ?? null,
            $id,
        ]);
        if ($stmt->rowCount() === 0) jsonError("Étudiant introuvable ou aucun changement", 404);
        $upd = $db->prepare("SELECT * FROM etudiants WHERE id = ?");
        $upd->execute([$id]);
        json($upd->fetch());
        break;

    case 'DELETE':
        if (!$id) jsonError("id requis");
        $stmt = $db->prepare("DELETE FROM etudiants WHERE id = ?");
        $stmt->execute([$id]);
        if ($stmt->rowCount() === 0) jsonError("Étudiant introuvable", 404);
        json(['message' => 'Étudiant supprimé', 'id' => $id]);
        break;

    default:
        jsonError("Méthode non autorisée", 405);
}
