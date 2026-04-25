<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require __DIR__ . '/config.php';

$data     = json_decode(file_get_contents("php://input"), true);
$email    = trim($data['email']    ?? '');
$password = trim($data['password'] ?? '');

if (!$email || !$password) {
    echo json_encode(array('success' => false, 'message' => 'Veuillez saisir votre mot de passe'));
    exit;
}

$stmt = $pdo->prepare("SELECT * FROM users WHERE email = ? AND password = SHA2(?, 256)");
$stmt->execute(array($email, $password));
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if ($user) {
    echo json_encode(array(
        'success' => true,
        'role'    => $user['role'],
        'name'    => $user['name'],
        'id'      => $user['id']
    ));
} else {
    echo json_encode(array('success' => false, 'message' => 'Mot de passe incorrect'));
}