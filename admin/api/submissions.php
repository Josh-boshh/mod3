<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../spam_protection.php';
runMigrations();
header('Content-Type: application/json; charset=utf-8');

$method = $_SERVER['REQUEST_METHOD'];

// ── GET: list submissions (admin only) ──────────────────────────────────────
if ($method === 'GET') {
    if (!isAdminLoggedIn()) {
        http_response_code(403);
        echo json_encode(['error' => 'Unauthorized.']);
        exit;
    }
    $type   = $_GET['type'] ?? '';
    $params = [];
    $sql    = 'SELECT * FROM mod_submissions';
    if ($type) {
        $sql   .= ' WHERE form_type = :type';
        $params['type'] = $type;
    }
    $sql .= ' ORDER BY submitted_at DESC';
    $rows = safeDbFetchAll($sql, $params);
    foreach ($rows as &$row) {
        $decoded      = !empty($row['meta']) ? json_decode($row['meta'], true) : [];
        $row['meta']  = is_array($decoded) ? $decoded : [];
    }
    unset($row);
    echo json_encode(['submissions' => $rows]);
    exit;
}

// ── DELETE: remove a submission (admin only) ─────────────────────────────────
if ($method === 'DELETE') {
    if (!isAdminLoggedIn()) {
        http_response_code(403);
        echo json_encode(['error' => 'Unauthorized.']);
        exit;
    }
    $body = json_decode(file_get_contents('php://input'), true);
    $id   = (int)($body['id'] ?? 0);
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Submission ID is required.']);
        exit;
    }
    dbQuery('DELETE FROM mod_submissions WHERE id = ?', [$id]);
    echo json_encode(['success' => true]);
    exit;
}

// ── POST: receive a public form submission ───────────────────────────────────
if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed.']);
    exit;
}

$body = json_decode(file_get_contents('php://input'), true) ?? [];

// ── Layer 1: Honeypot ────────────────────────────────────────────────────────
if (spamHoneypotFilled($body)) {
    spamReject('submissions', 'honeypot', 'Your submission could not be processed. Please try again.');
}

// ── Layer 2: Timing gate ─────────────────────────────────────────────────────
if (spamTooFast($body)) {
    spamReject('submissions', 'too_fast', 'Your submission could not be processed. Please take a moment to review your message and try again.');
}

// ── Layer 3: Rate limiting ───────────────────────────────────────────────────
if (spamRateLimited('submissions', SPAM_SUBMIT_LIMIT, SPAM_SUBMIT_WINDOW)) {
    http_response_code(429);
    echo json_encode(['error' => 'Too many submissions. Please wait a while before trying again.']);
    exit;
}

// ── Visible captcha ──────────────────────────────────────────────────────────
if (!spamVerifyCaptcha($body)) {
    spamReject('submissions', 'captcha_fail', 'Security check failed. Please answer the maths question and try again.');
}

// ── Layer 5: Input validation & sanitisation ─────────────────────────────────
$allowedTypes = ['contact', 'foi', 'servicom'];
$formType     = spamSanitizeText($body['form_type'] ?? '', 32);

if (!in_array($formType, $allowedTypes, true)) {
    http_response_code(400);
    echo json_encode(['error' => 'Unknown form type.']);
    exit;
}

$name  = spamSanitizeText($body['name']  ?? '', 255);
$email = spamSanitizeEmail($body['email'] ?? '');

if (!$name) {
    http_response_code(400);
    echo json_encode(['error' => 'Full name is required.']);
    exit;
}

if (!$email) {
    http_response_code(400);
    echo json_encode(['error' => 'A valid email address is required.']);
    exit;
}

// Form-specific required fields
switch ($formType) {
    case 'contact':
        $subjectRaw = spamSanitizeText($body['subject']  ?? '', 255);
        $message    = spamSanitizeText($body['message']  ?? '', 5000);
        if (!$subjectRaw || !$message) {
            http_response_code(400);
            echo json_encode(['error' => 'Subject and message are required.']);
            exit;
        }
        $subject = $subjectRaw;
        break;

    case 'foi':
        $subjectRaw = spamSanitizeText($body['subject']  ?? '', 255);
        $details    = spamSanitizeText($body['details']  ?? '', 5000);
        if (!$subjectRaw || !$details) {
            http_response_code(400);
            echo json_encode(['error' => 'Subject and request details are required.']);
            exit;
        }
        $subject = $subjectRaw;
        break;

    case 'servicom':
        $where   = spamSanitizeText($body['where']   ?? '', 255);
        $details = spamSanitizeText($body['details'] ?? '', 5000);
        if (!$where || !$details) {
            http_response_code(400);
            echo json_encode(['error' => 'Location and complaint details are required.']);
            exit;
        }
        $subject = $where ?: '(SERVICOM complaint)';
        break;

    default:
        $subject = '(submission)';
}

// ── Layer 4: Duplicate detection ─────────────────────────────────────────────
if (spamDuplicate($formType, $email, $subject)) {
    // Return a success-like message so legitimate double-submitters aren't confused
    echo json_encode(['success' => true]);
    exit;
}

// ── Persist (strip reserved / spam fields from meta) ─────────────────────────
$reserved = ['form_type', 'name', 'email', 'website', 'form_loaded_at', 'captcha_response'];
$meta     = [];
foreach ($body as $k => $v) {
    if (!in_array($k, $reserved, true) && is_string($v)) {
        $meta[$k] = spamSanitizeText($v, 5000);
    }
}

dbQuery(
    'INSERT INTO mod_submissions (form_type, name, email, subject, meta, submitted_at)
     VALUES (:form_type, :name, :email, :subject, :meta, NOW())',
    [
        'form_type' => $formType,
        'name'      => $name,
        'email'     => $email,
        'subject'   => $subject,
        'meta'      => json_encode($meta, JSON_UNESCAPED_UNICODE),
    ]
);

echo json_encode(['success' => true]);
