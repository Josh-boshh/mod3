<?php
require_once __DIR__ . '/config.php';

if (isAdminLoggedIn()) {
    header('Location: index.php');
    exit;
}

$error = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $csrf = $_POST['csrf'] ?? '';
    $email = trim($_POST['email'] ?? '');
    $password = trim($_POST['password'] ?? '');

    if (!validateCsrfToken($csrf)) {
        $error = 'Invalid form token. Refresh and try again.';
    } elseif (!$email || !$password) {
        $error = 'Email and password are required.';
    } elseif (!checkAdminCredentials($email, $password)) {
        $error = 'Unable to sign in. Check your credentials and try again.';
    } else {
        $_SESSION['admin_email'] = $email;
        header('Location: index.php');
        exit;
    }
}

$csrf = csrfToken();
?><!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>Admin Login — FMOD Website</title>
  <link rel="icon" href="../assets/images/favicon.png" />
  <link rel="stylesheet" href="../assets/css/style.css?v=8" />
  <link rel="stylesheet" href="admin.css" />
</head>
<body class="admin-body">
  <div class="admin-login-shell">
    <section class="admin-login-card">
      <div class="admin-login-panel">
        <a class="admin-login-brand" href="../index.html">
          <img src="../assets/images/coat-of-arms.jpg" alt="Federal coat of arms" width="52" height="52" />
          <div>
            <strong>Federal Ministry of Defence</strong>
            <span>Secure administration login</span>
          </div>
        </a>

        <?php if ($error): ?>
          <div class="admin-login-alert"><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></div>
        <?php endif; ?>

        <form method="post" action="login.php" novalidate>
          <label for="email">Email address</label>
          <input id="email" name="email" type="email" autocomplete="email" required placeholder="admin@example.com" value="<?= htmlspecialchars($_POST['email'] ?? '', ENT_QUOTES, 'UTF-8') ?>" />

          <label for="password">Password</label>
          <input id="password" name="password" type="password" autocomplete="current-password" required placeholder="Password" />

          <input type="hidden" name="csrf" value="<?= htmlspecialchars($csrf, ENT_QUOTES, 'UTF-8') ?>" />
          <button class="btn btn-green btn-full" type="submit">Sign in</button>
        </form>

        <p class="admin-login-footer"><a href="../">← Back to public site</a></p>
      </div>
    </section>
  </div>
</body>
</html>
