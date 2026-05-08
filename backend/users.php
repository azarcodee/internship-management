<?php
require_once 'config.php';
corsHeaders();

$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// Role check – admin only (compatible with all servers)
$role = $_SERVER['HTTP_X_ROLE'] ?? '';
if ($role !== 'admin') {
    jsonError("Accès refusé", 403);
}

switch ($method) {
    case 'GET':
        // List all users (except passwords)
        $stmt = $db->query("SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC");
        json($stmt->fetchAll());
        break;

    case 'POST':
        $data = body();
        $name = trim($data['name'] ?? '');
        $email = trim($data['email'] ?? '');
        $password = trim($data['password'] ?? '');
        $newRole = ($data['role'] === 'admin') ? 'admin' : 'user';

        if (!$name || !$email || !$password) {
            jsonError("Tous les champs sont requis.");
        }

        // Check duplicate email
        $check = $db->prepare("SELECT id FROM users WHERE email = ?");
        $check->execute([$email]);
        if ($check->fetch()) {
            jsonError("Un utilisateur avec cet email existe déjà.");
        }

        $hashed = hash('sha256', $password); // same as existing auth
        $stmt = $db->prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
        $stmt->execute([$name, $email, $hashed, $newRole]);

        $newId = $db->lastInsertId();
        $new = $db->prepare("SELECT id, name, email, role, created_at FROM users WHERE id = ?");
        $new->execute([$newId]);
        json($new->fetch(), 201);
        break;

    case 'DELETE':
        $id = isset($_GET['id']) ? (int)$_GET['id'] : null;
        if (!$id) jsonError("id requis");
        // Prevent deleting the last admin
        $countAdmin = $db->query("SELECT COUNT(*) FROM users WHERE role = 'admin'")->fetchColumn();
        $userToDelete = $db->prepare("SELECT role FROM users WHERE id = ?");
        $userToDelete->execute([$id]);
        $delRole = $userToDelete->fetchColumn();
        if ($delRole === 'admin' && $countAdmin <= 1) {
            jsonError("Impossible de supprimer le dernier administrateur.");
        }
        $stmt = $db->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$id]);
        json(['message' => 'Utilisateur supprimé.']);
        break;

    default:
        jsonError("Méthode non autorisée", 405);
}
