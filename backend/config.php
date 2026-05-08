<?php
$host = "localhost";
$db = "internshipmanagementdb";
$user = "root";
$pass = "root";

$pdo = new PDO(
    "mysql:host=" . $host . ";dbname=" . $db . ";charset=utf8",
    $user,
    $pass,
);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

function getDB(): PDO
{
    global $pdo;
    return $pdo;
}

function corsHeaders(): void
{
    header("Access-Control-Allow-Origin: http://localhost:3000");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Role");
    header("Content-Type: application/json; charset=UTF-8");
    if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
        http_response_code(204);
        exit();
    }
}

function json(mixed $data, int $code = 200): never
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}

function jsonError(string $message, int $code = 400): never
{
    json(["error" => $message], $code);
}

function body(): array
{
    $raw = file_get_contents("php://input");
    return json_decode($raw, true) ?? [];
}
