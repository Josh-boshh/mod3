<?php
require_once __DIR__ . '/../config.php';
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed.']);
    exit;
}

$body = json_decode(file_get_contents('php://input'), true);
$token = $body['csrf_token'] ?? '';
$blob = $body['blob'] ?? null;

if (!validateCsrfToken($token) || !isAdminLoggedIn()) {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized request.']);
    exit;
}

if (!is_array($blob)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid content payload.']);
    exit;
}

try {
    saveContentBlob($blob);
    echo json_encode(['success' => true]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Unable to save content.']);
}
