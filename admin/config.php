<?php
session_start();
require_once __DIR__ . '/default-data.php';

// Database connection settings.
// Update these values to match your MySQL server.
define('DB_HOST', '127.0.0.1');
define('DB_NAME', 'omoo_site');
define('DB_USER', 'root');
define('DB_PASS', '');

// ── Spam protection ───────────────────────────────────────────────────────────
//    SPAM_IP_HASH_KEY is used to HMAC-hash IP addresses before storing them.
//    This means no raw IPs ever hit the database (NDPR-friendly).
//    Generate a fresh value with: php -r "echo bin2hex(random_bytes(32));"
define('SPAM_IP_HASH_KEY', 'a3f8c2e1d94b7056af3219084ecbd5f76a018392cf54de2b71093840ebf62c51');

define('ADMIN_BASE_URL', '/admin/');

function pdo()
{
    static $pdo;
    if ($pdo) {
        return $pdo;
    }

    $dsn = sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', DB_HOST, DB_NAME);
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
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
            id           INT AUTO_INCREMENT PRIMARY KEY,
            form_type    VARCHAR(32)  NOT NULL,
            name         VARCHAR(255) NOT NULL,
            email        VARCHAR(191) NOT NULL,
            subject      VARCHAR(255) NOT NULL DEFAULT '',
            meta         JSON,
            submitted_at DATETIME     NOT NULL,
            INDEX idx_form_type    (form_type),
            INDEX idx_submitted_at (submitted_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        // Rate-limit counters (fixed-window per hashed IP + endpoint)
        "CREATE TABLE IF NOT EXISTS mod_rate_limits (
            id           INT AUTO_INCREMENT PRIMARY KEY,
            ip_hash      VARCHAR(64)  NOT NULL,
            endpoint     VARCHAR(32)  NOT NULL,
            hits         INT          NOT NULL DEFAULT 1,
            window_start DATETIME     NOT NULL,
            UNIQUE KEY uq_ip_endpoint (ip_hash, endpoint),
            INDEX idx_window_start (window_start)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        // Spam / rejected-submission log
        "CREATE TABLE IF NOT EXISTS mod_spam_log (
            id         INT AUTO_INCREMENT PRIMARY KEY,
            ip_hash    VARCHAR(64)  NOT NULL,
            endpoint   VARCHAR(32)  NOT NULL,
            reason     VARCHAR(64)  NOT NULL,
            created_at DATETIME     NOT NULL,
            INDEX idx_ip_hash    (ip_hash),
            INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        // Gallery images table
        "CREATE TABLE IF NOT EXISTS mod_gallery_images (
            id          INT AUTO_INCREMENT PRIMARY KEY,
            image_url   VARCHAR(255) NOT NULL,
            alt_text    VARCHAR(255) NOT NULL DEFAULT '',
            caption     TEXT         NOT NULL DEFAULT '',
            event_date  DATE,
            category    VARCHAR(127) NOT NULL DEFAULT 'General',
            sort_order  INT          NOT NULL DEFAULT 0,
            active      TINYINT(1)   NOT NULL DEFAULT 1,
            created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_gallery_sort (sort_order ASC, id ASC)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
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

function getGalleryImages(bool $activeOnly = true): array
{
    $sql = 'SELECT * FROM mod_gallery_images' . ($activeOnly ? ' WHERE active = 1' : '') . ' ORDER BY sort_order ASC, id ASC';
    return safeDbFetchAll($sql);
}

function defaultGalleryImages(): array
{
    return [
        [
            'id' => 0,
            'image_url' => 'https://defence.gov.ng/wp-content/uploads/slider/cache/5c91a2fb5a3c3d7d91aa26fb98ea005d/WhatsApp-Image-2026-05-08-at-09.51.56.jpg',
            'alt_text' => 'Honourable Minister at the AMCE, Abuja',
            'caption' => 'Honourable Minister at the AMCE, Abuja — 8 May 2026',
            'event_date' => '2026-05-08',
            'category' => 'Ministerial',
            'sort_order' => 0,
            'active' => 1,
        ],
        [
            'id' => 0,
            'image_url' => 'https://defence.gov.ng/wp-content/uploads/slider/cache/7ed124706b9db62fa4aae0e8bdc44f70/WhatsApp-Image-2026-05-06-at-09.44.49.jpg',
            'alt_text' => 'Regional security meeting',
            'caption' => 'Regional security meeting — 6 May 2026',
            'event_date' => '2026-05-06',
            'category' => 'Security',
            'sort_order' => 1,
            'active' => 1,
        ],
        [
            'id' => 0,
            'image_url' => 'https://defence.gov.ng/wp-content/uploads/slider/cache/f2ac3e9cb69b47524dec83e6268b40b1/WhatsApp-Image-2026-05-05-at-16.06.33.jpg',
            'alt_text' => 'Veritas University delegation visit to Ship House',
            'caption' => 'Veritas University delegation, Ship House — 5 May 2026',
            'event_date' => '2026-05-05',
            'category' => 'Engagements',
            'sort_order' => 2,
            'active' => 1,
        ],
        [
            'id' => 0,
            'image_url' => 'https://defence.gov.ng/wp-content/uploads/slider/cache/b64dada37ea1a198b4a6e0382f45f0c0/WhatsApp-Image-2026-05-05-at-04.41.488-1.jpg',
            'alt_text' => 'Engagement on national security',
            'caption' => 'Engagement on national security — 5 May 2026',
            'event_date' => '2026-05-05',
            'category' => 'Security',
            'sort_order' => 3,
            'active' => 1,
        ],
        [
            'id' => 0,
            'image_url' => 'https://defence.gov.ng/wp-content/uploads/slider/cache/7d5dab6eb3370ef45d22dfbeceb170b0/WhatsApp-Image-2026-05-05-at-04.41.4644.jpg',
            'alt_text' => 'Address to Nigerian students',
            'caption' => 'Address to Nigerian students — 5 May 2026',
            'event_date' => '2026-05-05',
            'category' => 'Engagements',
            'sort_order' => 4,
            'active' => 1,
        ],
        [
            'id' => 0,
            'image_url' => 'https://defence.gov.ng/wp-content/uploads/slider/cache/de24e192a317d951778e07962e82686d/WhatsApp-Image-2026-04-29-at-21.34.414.jpg',
            'alt_text' => 'Inauguration of strategic committees',
            'caption' => 'Inauguration of strategic committees — 29 April 2026',
            'event_date' => '2026-04-29',
            'category' => 'Ceremonies',
            'sort_order' => 5,
            'active' => 1,
        ],
        [
            'id' => 0,
            'image_url' => 'https://defence.gov.ng/wp-content/uploads/slider/cache/39e7bd9f42f86e2e15e02a7a8e72b6bb/WhatsApp-Image-2026-04-29-at-21.34.426.jpg',
            'alt_text' => 'Strategic committee session at Ship House',
            'caption' => 'Strategic committee session, Ship House',
            'event_date' => '2026-04-29',
            'category' => 'Ceremonies',
            'sort_order' => 6,
            'active' => 1,
        ],
        [
            'id' => 0,
            'image_url' => 'assets/images/headshots/general-christopher-musa.jpeg',
            'alt_text' => 'Honourable Minister of Defence',
            'caption' => 'Honourable Minister of Defence',
            'event_date' => null,
            'category' => 'Leadership',
            'sort_order' => 7,
            'active' => 1,
        ],
        [
            'id' => 0,
            'image_url' => 'assets/images/headshots/dr-bello-matawalle.jpg',
            'alt_text' => 'Hon. Minister of State, Dr. Bello M. Matawalle',
            'caption' => 'Honourable Minister of State, Dr. Bello M. Matawalle',
            'event_date' => null,
            'category' => 'Leadership',
            'sort_order' => 8,
            'active' => 1,
        ],
    ];
}
