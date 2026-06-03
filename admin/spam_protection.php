<?php
/**
 * MOD Nigeria — server-side spam protection helpers.
 *
 * Included by public API endpoints (submissions.php, subscribe.php).
 * All functions assume config.php (and therefore dbQuery/dbFetch) is already loaded.
 *
 * Protection layers:
 *   1. Honeypot      — hidden field bots fill; humans never see it.
 *   2. Timing gate   — rejects submissions faster than a human can type.
 *   3. Rate limiting — fixed-window counter per hashed IP.
 *   4. Duplicate     — blocks the same email+subject within one hour.
 *   5. Logging       — records every rejection for admin review.
 */

// ── Configuration ─────────────────────────────────────────────────────────────

/** Minimum seconds between page load and form submit. */
const SPAM_MIN_ELAPSED_SECONDS = 3;

/** Max contact/FOI/SERVICOM submissions per IP per hour. */
const SPAM_SUBMIT_LIMIT  = 5;
const SPAM_SUBMIT_WINDOW = 3600;

/** Max newsletter subscriptions per IP per hour. */
const SPAM_SUB_LIMIT  = 3;
const SPAM_SUB_WINDOW = 3600;

// ── IP helpers ────────────────────────────────────────────────────────────────

/**
 * Return the client IP, respecting a trusted reverse proxy.
 * Only CF-Connecting-IP and X-Real-IP are trusted; X-Forwarded-For is
 * accepted but its leftmost value is used (user-supplied, least trustworthy).
 */
function spamClientIp(): string
{
    foreach (['HTTP_CF_CONNECTING_IP', 'HTTP_X_REAL_IP'] as $h) {
        if (!empty($_SERVER[$h])) return trim($_SERVER[$h]);
    }
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        return trim(explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0]);
    }
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

/**
 * One-way hash of an IP address. We never store the raw IP.
 * The site-specific key ensures hashes can't be reversed with a rainbow table.
 */
function spamHashIp(string $ip = ''): string
{
    $key = defined('SPAM_IP_HASH_KEY') ? SPAM_IP_HASH_KEY : 'mod-fallback-key';
    return hash_hmac('sha256', $ip ?: spamClientIp(), $key);
}

// ── Layer 1: Honeypot ─────────────────────────────────────────────────────────

/**
 * Returns true (= spam) when the honeypot field is filled.
 *
 * Why it works: the field is hidden from sighted users via CSS + aria-hidden.
 * Bots that scrape and fill every visible or invisible input trigger this.
 *
 * Stops: naive scrapers, form-filling bots, automated mass-submit tools.
 */
function spamHoneypotFilled(array $body): bool
{
    return trim($body['website'] ?? '') !== '';
}

// ── Layer 2: Timing gate ──────────────────────────────────────────────────────

/**
 * Returns true (= spam) when the form was submitted faster than a human could.
 *
 * Why it works: JavaScript stamps the hidden `form_loaded_at` field with a
 * millisecond Unix timestamp when the page renders. We verify server-side that
 * at least SPAM_MIN_ELAPSED_SECONDS have passed.  A bot calling the API
 * directly (without executing JS) will omit this field and also be rejected.
 *
 * Stops: instant-submission bots, bots that skip JS execution, headless
 *        browsers that don't wait.
 */
function spamTooFast(array $body): bool
{
    $loadedAt = (int)($body['form_loaded_at'] ?? 0);
    if ($loadedAt <= 0) return true; // missing = no JS = bot

    // JS provides milliseconds; convert to seconds
    $elapsed = time() - intdiv($loadedAt, 1000);
    return $elapsed < SPAM_MIN_ELAPSED_SECONDS;
}

// ── Layer 3: Rate limiting ────────────────────────────────────────────────────

/**
 * Fixed-window rate limiter stored in `mod_rate_limits`.
 * Returns true (= rate limited) when the IP has hit $limit within $windowSeconds.
 *
 * The counter resets automatically when the window rolls over (handled by the
 * ON DUPLICATE KEY UPDATE logic).
 *
 * Fails OPEN on DB errors so a database outage never silently breaks forms.
 *
 * Stops: scripted floods, credential-stuffing attempts, bulk submit campaigns.
 */
function spamRateLimited(string $endpoint, int $limit, int $windowSeconds): bool
{
    $ipHash = spamHashIp();
    $cutoff = date('Y-m-d H:i:s', time() - $windowSeconds);

    try {
        // Upsert: if the stored window has expired, start a fresh counter.
        dbQuery(
            'INSERT INTO mod_rate_limits (ip_hash, endpoint, hits, window_start)
             VALUES (:ip, :ep, 1, NOW())
             ON CONFLICT (ip_hash, endpoint) DO UPDATE SET
               hits         = CASE WHEN mod_rate_limits.window_start < :cutoff1 THEN 1 ELSE mod_rate_limits.hits + 1 END,
               window_start = CASE WHEN mod_rate_limits.window_start < :cutoff2 THEN NOW() ELSE mod_rate_limits.window_start END',
            ['ip' => $ipHash, 'ep' => $endpoint, 'cutoff1' => $cutoff, 'cutoff2' => $cutoff]
        );

        $row = dbFetch(
            'SELECT hits FROM mod_rate_limits WHERE ip_hash = :ip AND endpoint = :ep',
            ['ip' => $ipHash, 'ep' => $endpoint]
        );

        return $row && (int)$row['hits'] > $limit;

    } catch (Throwable $e) {
        error_log('[MOD spam] rate-limit DB error: ' . $e->getMessage());
        return false; // fail open
    }
}

// ── Layer 4: Duplicate detection ──────────────────────────────────────────────

/**
 * Returns true (= duplicate) when the same email submitted the same
 * form_type+subject within the last hour.
 *
 * Stops: identical spam runs replayed across multiple requests.
 */
function spamDuplicate(string $formType, string $email, string $subject): bool
{
    try {
        $row = dbFetch(
            'SELECT id FROM mod_submissions
             WHERE form_type = :ft AND email = :email AND subject = :subject
               AND submitted_at > NOW() - INTERVAL '1 hour'
             LIMIT 1',
            ['ft' => $formType, 'email' => $email, 'subject' => $subject]
        );
        return (bool)$row;
    } catch (Throwable $e) {
        return false; // fail open
    }
}

// ── Layer 5: Input sanitisation ───────────────────────────────────────────────

/**
 * Strip tags and trim a plain-text field to $maxLen characters.
 */
function spamSanitizeText(string $value, int $maxLen = 255): string
{
    return mb_substr(strip_tags(trim($value)), 0, $maxLen);
}

/**
 * Validate and normalise an email address.
 * Returns the lowercased address, or false if invalid.
 */
function spamSanitizeEmail(string $value): string|false
{
    $value = mb_substr(trim($value), 0, 191);
    $valid = filter_var($value, FILTER_VALIDATE_EMAIL);
    return $valid ? strtolower($value) : false;
}

// ── Layer 6: Spam logging ─────────────────────────────────────────────────────

/**
 * Record a rejected submission for admin review.
 * Stores only the hashed IP — never the raw address.
 */
function spamLog(string $endpoint, string $reason): void
{
    try {
        dbQuery(
            'INSERT INTO mod_spam_log (ip_hash, endpoint, reason, created_at)
             VALUES (:ip, :ep, :reason, NOW())',
            ['ip' => spamHashIp(), 'ep' => $endpoint, 'reason' => $reason]
        );
    } catch (Throwable $e) {
        error_log('[MOD spam] log write failed (' . $reason . '): ' . $e->getMessage());
    }
}

// ── Slider puzzle captcha verification ───────────────────────────────────────
// Token produced by JS:  base64(targetX:ts) + ":" + droppedX
// e.g. "ODU6MTcwMDAwMA==:86"  — target was 85px, user dropped at 86px (within tolerance).
// Server checks: |droppedX - targetX| <= tolerance AND token is fresh.

const SLIDER_TOLERANCE = 14; // px — must match JS SLD_TOL

function spamVerifyCaptcha(array $body): bool
{
    $composite = trim($body['captcha_response'] ?? '');
    if (!$composite) return false;

    $sep = strrpos($composite, ':');
    if ($sep === false) return false;

    $token   = substr($composite, 0, $sep);
    $dropped = substr($composite, $sep + 1);

    $decoded = base64_decode($token, true);
    if (!$decoded) return false;

    $parts = explode(':', $decoded);
    if (count($parts) !== 2) return false;

    [$targetX, $ts] = $parts;

    // Reject tokens older than 10 minutes
    if (abs(time() - (int)$ts) > 600) return false;

    // Verify the drop is within tolerance of the target
    return abs((int)$dropped - (int)$targetX) <= SLIDER_TOLERANCE;
}

// ── Unified reject helper ─────────────────────────────────────────────────────

/**
 * Log a spam detection, emit a 400 JSON response, and exit.
 * $publicMessage is safe to return to the client.
 */
function spamReject(string $endpoint, string $reason, string $publicMessage): never
{
    spamLog($endpoint, $reason);
    http_response_code(400);
    echo json_encode(['error' => $publicMessage]);
    exit;
}
