<?php
require_once __DIR__ . '/../config.php';
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
        $sql    .= ' WHERE form_type = :type';
        $params['type'] = $type;
    }
    $sql .= ' ORDER BY submitted_at DESC';
    $rows = safeDbFetchAll($sql, $params);
    // Decode meta JSON for each row
    foreach ($rows as &$row) {
        if (!empty($row['meta'])) {
            $decoded = json_decode($row['meta'], true);
            $row['meta'] = is_array($decoded) ? $decoded : [];
        } else {
            $row['meta'] = [];
        }
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

$body      = json_decode(file_get_contents('php://input'), true);
$formType  = trim($body['form_type'] ?? '');
$name      = trim($body['name'] ?? '');
$email     = filter_var(trim($body['email'] ?? ''), FILTER_VALIDATE_EMAIL);

$allowedTypes = ['contact', 'foi', 'servicom'];
if (!in_array($formType, $allowedTypes, true)) {
    http_response_code(400);
    echo json_encode(['error' => 'Unknown form type.']);
    exit;
}

if (!$name) {
    http_response_code(400);
    echo json_encode(['error' => 'Name is required.']);
    exit;
}

if (!$email) {
    http_response_code(400);
    echo json_encode(['error' => 'A valid email address is required.']);
    exit;
}

// ── Optional reCAPTCHA verification ─────────────────────────────────────────
$recaptchaSecret = (defined('RECAPTCHA_SECRET') && RECAPTCHA_SECRET) ? RECAPTCHA_SECRET : '';
if ($recaptchaSecret) {
    $token = trim($body['recaptcha_token'] ?? '');
    if (!$token) {
        http_response_code(400);
        echo json_encode(['error' => 'reCAPTCHA token is required.']);
        exit;
    }
    $verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';
    $resp = @file_get_contents(
        $verifyUrl
        . '?secret='   . urlencode($recaptchaSecret)
        . '&response=' . urlencode($token)
        . '&remoteip=' . urlencode($_SERVER['REMOTE_ADDR'] ?? '')
    );
    $data = $resp ? json_decode($resp, true) : null;
    if (!$data || empty($data['success'])) {
        http_response_code(400);
        echo json_encode(['error' => 'reCAPTCHA verification failed.']);
        exit;
    }
}

// ── Build meta blob with remaining fields ────────────────────────────────────
$reserved = ['form_type', 'name', 'email', 'recaptcha_token'];
$meta     = [];
foreach ($body as $k => $v) {
    if (!in_array($k, $reserved, true)) {
        $meta[$k] = is_string($v) ? trim($v) : $v;
    }
}

// ── Derive a short subject line ───────────────────────────────────────────────
switch ($formType) {
    case 'contact':
        $subject = trim($body['subject'] ?? '') ?: '(no subject)';
        break;
    case 'foi':
        $subject = trim($body['subject'] ?? '') ?: '(FOI request)';
        break;
    case 'servicom':
        $subject = trim($body['where'] ?? '') ?: '(SERVICOM complaint)';
        break;
    default:
        $subject = '(submission)';
}

// ── Persist ───────────────────────────────────────────────────────────────────
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
