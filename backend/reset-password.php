<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

require __DIR__ . '/config.php';

$data     = json_decode(file_get_contents("php://input"), true);
$token    = trim($data['token']    ?? '');
$password = trim($data['password'] ?? '');

if (!$token || !$password) {
    echo json_encode(['success' => false, 'message' => 'Données manquantes']);
    exit;
}

$stmt = $pdo->prepare("SELECT * FROM users WHERE reset_token = ? AND reset_expires > NOW()");
$stmt->execute([$token]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo json_encode(['success' => false, 'message' => 'Lien invalide ou expiré.']);
    exit;
}

$hashed = hash('sha256', $password);
$stmt   = $pdo->prepare("UPDATE users SET password = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?");
$stmt->execute([$hashed, $user['id']]);

echo json_encode(['success' => true, 'message' => 'Mot de passe mis à jour.']);