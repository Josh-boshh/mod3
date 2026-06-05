<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../spam_protection.php';
header('Content-Type: application/json; charset=utf-8');

$method = $_SERVER['REQUEST_METHOD'];

// ── GET: list subscribers (admin only) ──────────────────────────────────────
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

// ── DELETE: unsubscribe (admin only) ─────────────────────────────────────────
if ($method === 'DELETE') {
    if (!isAdminLoggedIn()) {
        http_response_code(403);
        echo json_encode(['error' => 'Unauthorized.']);
        exit;
    }
    $body  = json_decode(file_get_contents('php://input'), true);
    $email = filter_var(trim($body['email'] ?? ''), FILTER_VALIDATE_EMAIL);
    if (!$email) {
        http_response_code(400);
        echo json_encode(['error' => 'A valid email address is required.']);
        exit;
    }
    dbQuery('DELETE FROM mod_subscribers WHERE email = ?', [$email]);
    echo json_encode(['success' => true]);
    exit;
}

// ── POST: public subscription ─────────────────────────────────────────────────
if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed.']);
    exit;
}

$body   = json_decode(file_get_contents('php://input'), true) ?? [];
$action = $body['action'] ?? 'add';

// ── Layer 1: Honeypot ────────────────────────────────────────────────────────
if (spamHoneypotFilled($body)) {
    spamReject('subscribe', 'honeypot', 'Your request could not be processed. Please try again.');
}

// ── Layer 2: Timing gate ─────────────────────────────────────────────────────
if (spamTooFast($body)) {
    spamReject('subscribe', 'too_fast', 'Your request could not be processed. Please try again in a moment.');
}

// ── Layer 3: Rate limiting ────────────────────────────────────────────────────
if (spamRateLimited('subscribe', SPAM_SUB_LIMIT, SPAM_SUB_WINDOW)) {
    http_response_code(429);
    echo json_encode(['error' => 'Too many requests. Please wait a while before trying again.']);
    exit;
}

// ── Visible captcha ──────────────────────────────────────────────────────────
if (!spamVerifyCaptcha($body)) {
    spamReject('subscribe', 'captcha_fail', 'Security check failed. Please answer the maths question and try again.');
}

// ── Layer 5: Input validation ─────────────────────────────────────────────────
$email = spamSanitizeEmail($body['email'] ?? '');
if (!$email) {
    http_response_code(400);
    echo json_encode(['error' => 'A valid email address is required.']);
    exit;
}

if ($action === 'add') {
    // Duplicate detection: already subscribed?
    $existing = dbFetch('SELECT 1 FROM mod_subscribers WHERE email = ? LIMIT 1', [$email]);
    if ($existing) {
        // Return success so bots can't enumerate valid addresses
        echo json_encode(['success' => true]);
        exit;
    }

    dbQuery(
        'INSERT IGNORE INTO mod_subscribers (email, subscribed_at) VALUES (:email, NOW())',
        ['email' => $email]
    );
    echo json_encode(['success' => true]);
    exit;
}

http_response_code(400);
echo json_encode(['error' => 'Invalid action.']);
