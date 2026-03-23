<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

require __DIR__ . '/config.php';
require __DIR__ . '/PHPMailer/src/Exception.php';
require __DIR__ . '/PHPMailer/src/PHPMailer.php';
require __DIR__ . '/PHPMailer/src/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

$data  = json_decode(file_get_contents("php://input"), true);
$email = trim($data['email'] ?? '');

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Format de l\'adresse email invalide.']);
    exit;
}

if (!$email) {
    echo json_encode(['success' => false, 'message' => 'Email requis']);
    exit;
}

$stmt = $pdo->prepare("SELECT * FROM users WHERE email = ? AND role = 'user'");
$stmt->execute([$email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo json_encode(['success' => false, 'message' => 'Aucun compte utilisateur trouvé avec cet email.']);
    exit;
}

$token   = bin2hex(random_bytes(32));
$expires = date('Y-m-d H:i:s', strtotime('+1 hour'));

$stmt = $pdo->prepare("UPDATE users SET reset_token = ?, reset_expires = ? WHERE email = ?");
$stmt->execute([$token, $expires, $email]);

$resetLink = "http://localhost:3000/reset-password?token=" . $token;

$mail = new PHPMailer(true);
try {
    $mail->isSMTP();
    $mail->Host       = 'smtp.gmail.com';
    $mail->SMTPAuth   = true;
    $mail->Username   = 'internshipmg27@gmail.com';
    $mail->Password   = 'jtexaunowmxamfuy';
    $mail->SMTPSecure = 'tls';
    $mail->Port       = 587;

    $mail->setFrom('internshipmg27@gmail.com', 'internmg');
    $mail->addAddress($email, $user['name']);
    $mail->Subject = 'Changement de mot de passe';
    $mail->Body    = "Bonjour " . $user['name'] . ",\n\nCliquez sur ce lien pour réinitialiser votre mot de passe (valable 1 heure):\n\n" . $resetLink . "\n\nSi vous n'avez pas fait cette demande, ignorez cet email.\nceci est un message automatique , veuillez ne pas répondre" ;

    $mail->send();
    echo json_encode(['success' => true, 'message' => 'Email envoyé , veuillez consulter votre boite mail.']);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Erreur envoi email: ' . $mail->ErrorInfo]);
}