<?php
session_start();
require_once __DIR__ . '/default-data.php';

// ── Database (PostgreSQL) ─────────────────────────────────────────────────────
// On Render: DATABASE_URL is injected automatically from the linked database.
// Locally: set DB_HOST / DB_PORT / DB_NAME / DB_USER / DB_PASS env vars,
//          or install PostgreSQL and use the defaults below.
define('SPAM_IP_HASH_KEY', getenv('SPAM_IP_HASH_KEY') ?: 'a3f8c2e1d94b7056af3219084ecbd5f76a018392cf54de2b71093840ebf62c51');
define('ADMIN_BASE_URL', '/admin/');

function modDbConfig(): array
{
    static $cfg;
    if ($cfg) return $cfg;
    $url = getenv('DATABASE_URL') ?: null;
    if ($url) {
        $p   = parse_url($url);
        $cfg = [
            'dsn'  => sprintf('pgsql:host=%s;port=%s;dbname=%s;sslmode=require',
                              $p['host'], $p['port'] ?? 5432, ltrim($p['path'] ?? '/', '/')),
            'user' => rawurldecode($p['user'] ?? ''),
            'pass' => rawurldecode($p['pass'] ?? ''),
        ];
    } else {
        $cfg = [
            'dsn'  => sprintf('pgsql:host=%s;port=%s;dbname=%s;sslmode=prefer',
                              getenv('DB_HOST') ?: '127.0.0.1',
                              getenv('DB_PORT') ?: '5432',
                              getenv('DB_NAME') ?: 'mod3'),
            'user' => getenv('DB_USER') ?: 'postgres',
            'pass' => getenv('DB_PASS') ?: '',
        ];
    }
    return $cfg;
}

function pdo()
{
    static $pdo;
    if ($pdo) return $pdo;
    ['dsn' => $dsn, 'user' => $user, 'pass' => $pass] = modDbConfig();
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);
    return $pdo;
}

function dbQuery(string $sql, array $params = [])
{
    $stmt = pdo()->prepare($sql);
    $stmt->execute($params);
    return $stmt;
}

function dbFetch(string $sql, array $params = [])
{
    return dbQuery($sql, $params)->fetch();
}

function dbFetchAll(string $sql, array $params = [])
{
    return dbQuery($sql, $params)->fetchAll();
}

function isAdminLoggedIn(): bool
{
    return !empty($_SESSION['admin_email']);
}

function requireAdminLogin(): void
{
    if (!isAdminLoggedIn()) {
        header('Location: login.php');
        exit;
    }
}

function csrfToken(): string
{
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(24));
    }
    return $_SESSION['csrf_token'];
}

function validateCsrfToken(string $token): bool
{
    return !empty($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}

function setFlash(string $type, string $message): void
{
    $_SESSION['flash'] = ['type' => $type, 'message' => $message];
}

function flashMessage(): ?array
{
    if (empty($_SESSION['flash'])) {
        return null;
    }
    $flash = $_SESSION['flash'];
    unset($_SESSION['flash']);
    return $flash;
}

function adminUrl(string $path = ''): string
{
    return ADMIN_BASE_URL . ltrim($path, '/');
}

function normalizeSlug(string $value): string
{
    $slug = strtolower(trim($value));
    $slug = preg_replace('/[^a-z0-9-]+/', '-', $slug);
    $slug = trim($slug, '-');
    return $slug ?: 'item-' . bin2hex(random_bytes(4));
}

function safeDbFetchAll(string $sql, array $params = []): array
{
    try {
        return dbFetchAll($sql, $params);
    } catch (Throwable $exception) {
        return [];
    }
}

/**
 * Ensure new tables added after initial setup exist.
 * Safe to call on every admin request — uses IF NOT EXISTS.
 */
function runMigrations(): void
{
    static $ran = false;
    if ($ran) return;
    $ran = true;

    $migrations = [
        // Core submissions table
        "CREATE TABLE IF NOT EXISTS mod_submissions (
            id           SERIAL       PRIMARY KEY,
            form_type    VARCHAR(32)  NOT NULL,
            name         VARCHAR(255) NOT NULL,
            email        VARCHAR(191) NOT NULL,
            subject      VARCHAR(255) NOT NULL DEFAULT '',
            meta         JSONB,
            submitted_at TIMESTAMP    NOT NULL DEFAULT NOW()
        )",
        "CREATE INDEX IF NOT EXISTS idx_sub_form_type    ON mod_submissions (form_type)",
        "CREATE INDEX IF NOT EXISTS idx_sub_submitted_at ON mod_submissions (submitted_at)",

        // Rate-limit counters (fixed-window per hashed IP + endpoint)
        "CREATE TABLE IF NOT EXISTS mod_rate_limits (
            id           SERIAL      PRIMARY KEY,
            ip_hash      VARCHAR(64) NOT NULL,
            endpoint     VARCHAR(32) NOT NULL,
            hits         INT         NOT NULL DEFAULT 1,
            window_start TIMESTAMP   NOT NULL DEFAULT NOW(),
            UNIQUE (ip_hash, endpoint)
        )",
        "CREATE INDEX IF NOT EXISTS idx_rate_window ON mod_rate_limits (window_start)",

        // Spam / rejected-submission log
        "CREATE TABLE IF NOT EXISTS mod_spam_log (
            id         SERIAL      PRIMARY KEY,
            ip_hash    VARCHAR(64) NOT NULL,
            endpoint   VARCHAR(32) NOT NULL,
            reason     VARCHAR(64) NOT NULL,
            created_at TIMESTAMP   NOT NULL DEFAULT NOW()
        )",
        "CREATE INDEX IF NOT EXISTS idx_spam_ip ON mod_spam_log (ip_hash)",
        "CREATE INDEX IF NOT EXISTS idx_spam_at ON mod_spam_log (created_at)",
    ];

    foreach ($migrations as $sql) {
        try {
            pdo()->exec($sql);
        } catch (Throwable $e) {
            error_log('[MOD migration] ' . $e->getMessage());
        }
    }
}

function defaultContent(): array
{
    static $content;
    if ($content === null) {
        $content = require __DIR__ . '/default-data.php';
    }
    return $content;
}

function defaultSettings(): array
{
    return defaultContent()['settings'] ?? [];
}

function defaultHeroSlides(): array
{
    $slides = defaultContent()['slides'] ?? [];
    $result = [];
    foreach ($slides as $index => $slide) {
        $result[] = [
            'id' => 0,
            'image_url' => $slide['img'] ?? '',
            'alt_text' => $slide['alt'] ?? '',
            'role_text' => $slide['role'] ?? '',
            'caption_text' => $slide['name'] ?? '',
            'sort_order' => $index,
            'active' => 1,
        ];
    }
    return $result;
}

function defaultLeadership(): array
{
    $leaders = defaultContent()['leadership'] ?? [];
    $result = [];
    foreach ($leaders as $positionKey => $leader) {
        $result[] = [
            'id' => 0,
            'position_key' => $positionKey,
            'title' => $leader['title'] ?? '',
            'name' => $leader['name'] ?? '',
            'bio' => $leader['bio'] ?? '',
            'photo_url' => $leader['photo_url'] ?? '',
            'profile_link' => $leader['profile_link'] ?? '',
            'sort_order' => 0,
            'active' => 1,
        ];
    }
    return $result;
}

function defaultPressItems(): array
{
    $items = defaultContent()['press'] ?? [];
    $result = [];
    foreach ($items as $index => $item) {
        $result[] = [
            'id' => 0,
            'title' => $item['title'] ?? '',
            'excerpt' => $item['excerpt'] ?? '',
            'category' => $item['category'] ?? '',
            'published_at' => $item['date'] ?? '',
            'image_url' => $item['img'] ?? '',
            'link_url' => $item['url'] ?? '',
            'slug' => $item['slug'] ?? normalizeSlug($item['title'] ?? 'press-item-' . $index),
            'sort_order' => $index,
            'active' => 1,
        ];
    }
    return $result;
}

function getSetting(string $name, string $default = ''): string
{
    $defaultSettings = defaultSettings();
    try {
        $row = dbFetch('SELECT value FROM mod_settings WHERE name = ? LIMIT 1', [$name]);
    } catch (Throwable $exception) {
        $row = null;
    }
    if (!empty($row['value'])) {
        return $row['value'];
    }
    return $defaultSettings[$name] ?? $default;
}

function saveSetting(string $name, string $value): void
{
    if (dbFetch('SELECT 1 FROM mod_settings WHERE name = ? LIMIT 1', [$name])) {
        dbQuery('UPDATE mod_settings SET value = :value WHERE name = :name', ['value' => $value, 'name' => $name]);
        return;
    }
    dbQuery('INSERT INTO mod_settings (name, value) VALUES (:name, :value)', ['name' => $name, 'value' => $value]);
}

function getHeroSlides(bool $activeOnly = true): array
{
    $sql = 'SELECT * FROM mod_hero_slides' . ($activeOnly ? ' WHERE active = 1' : '') . ' ORDER BY sort_order ASC, id ASC';
    $rows = safeDbFetchAll($sql);
    if (!empty($rows)) {
        return $rows;
    }
    return defaultHeroSlides();
}

function getLeadership(bool $activeOnly = true): array
{
    $sql = 'SELECT * FROM mod_leaders' . ($activeOnly ? ' WHERE active = 1' : '') . ' ORDER BY sort_order ASC, id ASC';
    $rows = safeDbFetchAll($sql);
    if (!empty($rows)) {
        return $rows;
    }
    return defaultLeadership();
}

function getLeadershipByKey(string $key): array
{
    return dbFetch('SELECT * FROM mod_leaders WHERE position_key = ? LIMIT 1', [$key]) ?: [];
}

function getPressItems(bool $activeOnly = true, int $limit = 0): array
{
    $sql = 'SELECT * FROM mod_press_items' . ($activeOnly ? ' WHERE active = 1' : '') . ' ORDER BY sort_order ASC, id ASC';
    if ($limit > 0) {
        $sql .= ' LIMIT ' . (int)$limit;
    }
    $rows = safeDbFetchAll($sql);
    if (!empty($rows)) {
        return $rows;
    }
    return defaultPressItems();
}

function getSubscribers(): array
{
    return safeDbFetchAll('SELECT email, subscribed_at FROM mod_subscribers ORDER BY subscribed_at DESC');
}

function getSubmissions(string $type = ''): array
{
    $sql    = 'SELECT * FROM mod_submissions';
    $params = [];
    if ($type) {
        $sql .= ' WHERE form_type = :type';
        $params['type'] = $type;
    }
    $sql .= ' ORDER BY submitted_at DESC';
    $rows = safeDbFetchAll($sql, $params);
    foreach ($rows as &$row) {
        $decoded = !empty($row['meta']) ? json_decode($row['meta'], true) : [];
        $row['meta'] = is_array($decoded) ? $decoded : [];
    }
    unset($row);
    return $rows;
}

function countSubmissions(string $type = ''): int
{
    $sql    = 'SELECT COUNT(*) AS n FROM mod_submissions';
    $params = [];
    if ($type) {
        $sql .= ' WHERE form_type = :type';
        $params['type'] = $type;
    }
    try {
        $row = dbFetch($sql, $params);
        return (int)($row['n'] ?? 0);
    } catch (Throwable $e) {
        return 0;
    }
}

function createAdminUser(string $email, string $password): void
{
    dbQuery('INSERT INTO mod_admin_users (email, password_hash, created_at) VALUES (:email, :hash, NOW())', [
        'email' => $email,
        'hash' => password_hash($password, PASSWORD_DEFAULT),
    ]);
}

function checkAdminCredentials(string $email, string $password): bool
{
    $row = dbFetch('SELECT password_hash FROM mod_admin_users WHERE email = ? LIMIT 1', [$email]);
    return $row && password_verify($password, $row['password_hash']);
}

function saveContentBlob(array $blob): void
{
    pdo()->beginTransaction();
    dbQuery('DELETE FROM mod_hero_slides');
    dbQuery('DELETE FROM mod_leaders');
    dbQuery('DELETE FROM mod_press_items');

    if (!empty($blob['slides']) && is_array($blob['slides'])) {
        foreach ($blob['slides'] as $index => $slide) {
            dbQuery('INSERT INTO mod_hero_slides (image_url, alt_text, role_text, caption_text, sort_order, active) VALUES (:image, :alt, :role, :caption, :order, :active)', [
                'image' => $slide['img'] ?? '',
                'alt' => $slide['alt'] ?? '',
                'role' => $slide['role'] ?? '',
                'caption' => $slide['name'] ?? '',
                'order' => $index,
                'active' => 1,
            ]);
        }
    }

    if (!empty($blob['leadership']) && is_array($blob['leadership'])) {
        foreach ($blob['leadership'] as $positionKey => $leader) {
            if (empty($leader['name'])) {
                continue;
            }
            dbQuery('INSERT INTO mod_leaders (position_key, title, name, bio, photo_url, profile_link, sort_order, active) VALUES (:position_key, :title, :name, :bio, :photo, :link, :order, :active)', [
                'position_key' => $positionKey,
                'title' => $leader['title'] ?? '',
                'name' => $leader['name'] ?? '',
                'bio' => $leader['bio'] ?? '',
                'photo' => $leader['photo'] ?? '',
                'link' => $leader['profile_link'] ?? '',
                'order' => 0,
                'active' => 1,
            ]);
        }
    }

    if (!empty($blob['press']) && is_array($blob['press'])) {
        foreach ($blob['press'] as $index => $item) {
            $publishedAt = null;
            if (!empty($item['date'])) {
                $publishedAt = date('Y-m-d', strtotime($item['date']));
            }
            if (!$publishedAt) {
                $publishedAt = date('Y-m-d');
            }
            dbQuery('INSERT INTO mod_press_items (title, excerpt, category, published_at, image_url, link_url, slug, sort_order, active) VALUES (:title, :excerpt, :category, :published_at, :image_url, :link_url, :slug, :order, :active)', [
                'title' => $item['title'] ?? '',
                'excerpt' => $item['excerpt'] ?? '',
                'category' => $item['category'] ?? '',
                'published_at' => $publishedAt,
                'image_url' => $item['img'] ?? '',
                'link_url' => $item['url'] ?? '',
                'slug' => normalizeSlug($item['slug'] ?? $item['title'] ?? 'press-item-' . $index),
                'order' => $index,
                'active' => 1,
            ]);
        }
    }

    if (!empty($blob['settings']) && is_array($blob['settings'])) {
        foreach ($blob['settings'] as $key => $value) {
            saveSetting($key, (string)$value);
        }
    }

    pdo()->commit();
}
