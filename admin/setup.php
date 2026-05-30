<?php
require_once __DIR__ . '/config.php';

$errors = [];
$success = null;

try {
    pdo();
} catch (Throwable $e) {
    $errors[] = 'Database connection failed: ' . htmlspecialchars($e->getMessage(), ENT_QUOTES, 'UTF-8');
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && empty($errors)) {
    $csrf = $_POST['csrf'] ?? '';
    if (!validateCsrfToken($csrf)) {
        $errors[] = 'Invalid form token. Refresh and try again.';
    } else {
        $email = trim($_POST['admin_email'] ?? '');
        $password = trim($_POST['admin_password'] ?? '');
        $confirm = trim($_POST['admin_password_confirm'] ?? '');

        if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors[] = 'Please enter a valid administrator email address.';
        }
        if (!$password || strlen($password) < 10) {
            $errors[] = 'Please choose a password with at least 10 characters.';
        }
        if ($password !== $confirm) {
            $errors[] = 'The password confirmation does not match.';
        }

        if (empty($errors)) {
            dbQuery('CREATE TABLE IF NOT EXISTS mod_admin_users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(191) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                created_at DATETIME NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');

            dbQuery('CREATE TABLE IF NOT EXISTS mod_settings (
                name VARCHAR(191) NOT NULL PRIMARY KEY,
                value TEXT NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');

            dbQuery('CREATE TABLE IF NOT EXISTS mod_hero_slides (
                id INT AUTO_INCREMENT PRIMARY KEY,
                image_url VARCHAR(255) NOT NULL,
                alt_text VARCHAR(255) NOT NULL,
                role_text VARCHAR(255) NOT NULL,
                caption_text TEXT NOT NULL,
                sort_order INT NOT NULL DEFAULT 0,
                active TINYINT(1) NOT NULL DEFAULT 1
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');

            dbQuery('CREATE TABLE IF NOT EXISTS mod_leaders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                position_key VARCHAR(64) NOT NULL,
                title VARCHAR(255) NOT NULL,
                name VARCHAR(255) NOT NULL,
                bio TEXT NOT NULL,
                photo_url VARCHAR(255) NOT NULL,
                profile_link VARCHAR(255) NOT NULL,
                sort_order INT NOT NULL DEFAULT 0,
                active TINYINT(1) NOT NULL DEFAULT 1
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');

            dbQuery('CREATE TABLE IF NOT EXISTS mod_press_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                excerpt TEXT NOT NULL,
                category VARCHAR(127) NOT NULL,
                published_at DATE NOT NULL,
                image_url VARCHAR(255) NOT NULL,
                link_url VARCHAR(255) NOT NULL,
                slug VARCHAR(255) NOT NULL,
                sort_order INT NOT NULL DEFAULT 0,
                active TINYINT(1) NOT NULL DEFAULT 1
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');

            dbQuery('CREATE TABLE IF NOT EXISTS mod_subscribers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(191) NOT NULL UNIQUE,
                subscribed_at DATETIME NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');

            dbQuery('CREATE TABLE IF NOT EXISTS mod_submissions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                form_type VARCHAR(32) NOT NULL,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(191) NOT NULL,
                subject VARCHAR(255) NOT NULL DEFAULT \'\',
                meta JSON,
                submitted_at DATETIME NOT NULL,
                INDEX idx_form_type (form_type),
                INDEX idx_submitted_at (submitted_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');

            dbQuery('INSERT IGNORE INTO mod_settings (name, value) VALUES
                ("hero_eyebrow", "Federal Republic of Nigeria"),
                ("hero_headline", "Defending the sovereignty of Nigeria."),
                ("hero_body", "The Federal Ministry of Defence — the apex policy authority overseeing the Nigerian Armed Forces — provides strategic leadership for a modern, professional, mission-ready military in the service of more than 220 million citizens of the Federal Republic."),
                ("last_reviewed", "May 2026"),
                ("ministry_name", "Federal Ministry of Defence"),
                ("country", "Federal Republic of Nigeria")');

            if (!dbFetch('SELECT 1 FROM mod_admin_users WHERE email = ? LIMIT 1', [$email])) {
                createAdminUser($email, $password);
            }

            $success = 'Setup complete. You can now log in with the administrator account.';
        }
    }
}

$csrf = csrfToken();
?><!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Admin Setup — FMOD Website</title>
  <link rel="stylesheet" href="../assets/css/style.css" />
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <main class="admin-shell">
    <header class="admin-header">
      <div>
        <p class="eyebrow">Admin Setup</p>
        <h1>Install the FMOD admin backend</h1>
        <p class="lead">This page creates the MySQL tables and the first administrator account for the new PHP backend.</p>
      </div>
    </header>

    <?php if ($errors): ?>
      <div class="alert alert-error">
        <strong>Setup could not complete.</strong>
        <ul>
          <?php foreach ($errors as $error): ?>
            <li><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></li>
          <?php endforeach; ?>
        </ul>
      </div>
    <?php elseif ($success): ?>
      <div class="alert alert-success"><?= htmlspecialchars($success, ENT_QUOTES, 'UTF-8') ?></div>
    <?php endif; ?>

    <section class="admin-section">
      <form method="post" novalidate>
        <input type="hidden" name="csrf" value="<?= htmlspecialchars($csrf, ENT_QUOTES, 'UTF-8') ?>" />

        <div class="form-row">
          <label>
            Administrator email
            <input type="email" name="admin_email" required placeholder="admin@example.com" value="<?= isset($_POST['admin_email']) ? htmlspecialchars($_POST['admin_email'], ENT_QUOTES, 'UTF-8') : 'admin@example.com' ?>" />
          </label>
          <label>
            Password
            <input type="password" name="admin_password" required placeholder="Choose a strong password" />
          </label>
        </div>

        <div class="form-row">
          <label>
            Confirm password
            <input type="password" name="admin_password_confirm" required placeholder="Repeat password" />
          </label>
          <label>
            Database name
            <input type="text" disabled value="<?= htmlspecialchars(DB_NAME, ENT_QUOTES, 'UTF-8') ?>" />
          </label>
        </div>

        <p>Update <code>admin/config.php</code> if your MySQL credentials differ from the defaults shown here.</p>

        <button type="submit" class="btn btn-green">Create admin backend</button>
      </form>
    </section>

    <section class="admin-section">
      <h2>Next steps</h2>
      <ul>
        <li>Delete or restrict <code>admin/setup.php</code> after installation.</li>
        <li>Open <a href="login.php">admin/login.php</a> to sign in.</li>
        <li>Use the admin dashboard to manage homepage slides, leadership headshots, and press content.</li>
      </ul>
    </section>
  </main>
</body>
</html>
