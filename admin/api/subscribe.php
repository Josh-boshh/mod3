<?php
require_once __DIR__ . '/../config.php';
header('Content-Type: application/json; charset=utf-8');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    if (!isAdminLoggedIn()) {
        http_response_code(403);
        echo json_encode(['error' => 'Unauthorized.']);
        exit;
    }
    $subscribers = getSubscribers();
    echo json_encode(['subscribers' => $subscribers]);
    exit;
}

$body = json_decode(file_get_contents('php://input'), true);
$action = $body['action'] ?? 'add';
$email = filter_var(trim($body['email'] ?? ''), FILTER_VALIDATE_EMAIL);

// Optional reCAPTCHA verification: if a server secret constant is defined, require and verify token.
$recaptcha_secret = '';
if (defined('RECAPTCHA_SECRET') && RECAPTCHA_SECRET) {
    $recaptcha_secret = RECAPTCHA_SECRET;
}
if ($recaptcha_secret) {
    $recaptcha_token = trim($body['recaptcha_token'] ?? '');
    if (!$recaptcha_token) {
        http_response_code(400);
        echo json_encode(['error' => 'reCAPTCHA token is required.']);
        exit;
    }
    // Verify with Google
    $verify_url = 'https://www.google.com/recaptcha/api/siteverify';
    $resp = @file_get_contents($verify_url . '?secret=' . urlencode($recaptcha_secret) . '&response=' . urlencode($recaptcha_token) . '&remoteip=' . ($_SERVER['REMOTE_ADDR'] ?? ''));
    $data = $resp ? json_decode($resp, true) : null;
    if (!$data || empty($data['success'])) {
        http_response_code(400);
        echo json_encode(['error' => 'reCAPTCHA verification failed.']);
        exit;
    }
    // If v3 is used, optionally check score (avoid blocking too strictly)
    if (isset($data['score']) && $data['score'] < 0.3) {
        http_response_code(400);
        echo json_encode(['error' => 'reCAPTCHA score too low.']);
        exit;
    }
}

if (!$email) {
    http_response_code(400);
    echo json_encode(['error' => 'A valid email address is required.']);
    exit;
}

if ($action === 'add') {
    dbQuery('INSERT IGNORE INTO mod_subscribers (email, subscribed_at) VALUES (:email, NOW())', ['email' => $email]);
    echo json_encode(['success' => true]);
    exit;
}

if ($action === 'remove') {
    if (!isAdminLoggedIn()) {
        http_response_code(403);
        echo json_encode(['error' => 'Unauthorized.']);
        exit;
    }
    dbQuery('DELETE FROM mod_subscribers WHERE email = ?', [$email]);
    echo json_encode(['success' => true]);
    exit;
}

http_response_code(400);
echo json_encode(['error' => 'Invalid action.']);
