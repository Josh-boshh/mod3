<?php
require_once __DIR__ . '/config.php';
// requireAdminLogin();
runMigrations();

function escapeHtml($value): string {
    return htmlspecialchars($value ?? '', ENT_QUOTES, 'UTF-8');
}

function resolveAdminImageUrl(string $url): string
{
    $url = trim($url);
    if ($url === '') {
        return '';
    }

    if (preg_match('#^(?:https?://|//|/).*#i', $url)) {
        return $url;
    }

    if (strpos($url, '../') === 0 || strpos($url, './') === 0) {
        return $url;
    }

    return '../' . ltrim($url, '/');
}

function uploadImageFile(string $fieldName, string $relativeDir, string $current = ''): string
{
    if (empty($_FILES[$fieldName]) || $_FILES[$fieldName]['error'] !== UPLOAD_ERR_OK) {
        return $current;
    }

    $upload = $_FILES[$fieldName];
    $extension = strtolower(pathinfo($upload['name'], PATHINFO_EXTENSION));
    $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    if (!in_array($extension, $allowed, true)) {
        return $current;
    }

    $targetDir = __DIR__ . '/../' . trim($relativeDir, '/');
    if (!is_dir($targetDir)) {
        mkdir($targetDir, 0755, true);
    }

    $safeName = preg_replace('/[^a-z0-9_-]+/i', '-', pathinfo($upload['name'], PATHINFO_FILENAME));
    $fileName = sprintf('%s-%s.%s', $safeName ?: 'image', time(), $extension);
    $destination = $targetDir . '/' . $fileName;

    if (!move_uploaded_file($upload['tmp_name'], $destination)) {
        return $current;
    }

    return trim($relativeDir, '/') . '/' . $fileName;
}

function redirectTo(string $anchor = ''): void
{
    header('Location: index.php' . ($anchor ? '#' . ltrim($anchor, '#') : ''));
    exit;
}

$flash = flashMessage();
$settings = [
    'hero_eyebrow' => getSetting('hero_eyebrow', 'Federal Republic of Nigeria'),
    'hero_headline' => getSetting('hero_headline', 'Defending the sovereignty of Nigeria.'),
    'hero_body' => getSetting('hero_body', 'The Federal Ministry of Defence — the apex policy authority overseeing the Nigerian Armed Forces — provides strategic leadership for a modern, professional, mission-ready military in the service of more than 220 million citizens of the Federal Republic.'),
    'last_reviewed' => getSetting('last_reviewed', 'May 2026'),
    'ministry_name' => getSetting('ministry_name', 'Federal Ministry of Defence'),
    'country' => getSetting('country', 'Federal Republic of Nigeria'),
];

$slides = getHeroSlides(false);
$leaders = getLeadership(false);
$pressItems = getPressItems(false);
$subscribers = getSubscribers();
$allSubmissions = getSubmissions();

$editSlide = null;
$editLeader = null;
$editPress = null;

if (!empty($_GET['edit_slide'])) {
    $editSlide = dbFetch('SELECT * FROM mod_hero_slides WHERE id = ? LIMIT 1', [(int)$_GET['edit_slide']]);
}
if (!empty($_GET['edit_leader'])) {
    $editLeader = dbFetch('SELECT * FROM mod_leaders WHERE id = ? LIMIT 1', [(int)$_GET['edit_leader']]);
}
if (!empty($_GET['edit_press'])) {
    $editPress = dbFetch('SELECT * FROM mod_press_items WHERE id = ? LIMIT 1', [(int)$_GET['edit_press']]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $csrf = $_POST['csrf'] ?? '';
    if (!validateCsrfToken($csrf)) {
        setFlash('error', 'Invalid form token. Refresh and try again.');
        redirectTo();
    }

    $action = $_POST['action'] ?? '';
    switch ($action) {
        case 'save_slide':
            $slideId = (int)($_POST['slide_id'] ?? 0);
            $imageUrl = trim($_POST['slide_image_url'] ?? '');
            $alt = trim($_POST['slide_alt'] ?? '');
            $role = trim($_POST['slide_role'] ?? '');
            $caption = trim($_POST['slide_caption'] ?? '');
            $sortOrder = (int)($_POST['slide_order'] ?? 0);
            $active = isset($_POST['slide_active']) ? 1 : 0;
            $existing = '';
            if ($slideId) {
                $existing = dbFetch('SELECT image_url FROM mod_hero_slides WHERE id = ? LIMIT 1', [$slideId])['image_url'] ?? '';
            }
            $imagePath = uploadImageFile('slide_image_file', 'assets/images/hero', $existing);
            if ($imagePath) {
                $imageUrl = $imagePath;
            }

            if (!$imageUrl) {
                setFlash('error', 'Slide image is required. Upload a file or enter a valid image path.');
                redirectTo('slides');
            }

            if ($slideId) {
                dbQuery('UPDATE mod_hero_slides SET image_url = :image_url, alt_text = :alt_text, role_text = :role_text, caption_text = :caption_text, sort_order = :sort_order, active = :active WHERE id = :id', [
                    'image_url' => $imageUrl,
                    'alt_text' => $alt,
                    'role_text' => $role,
                    'caption_text' => $caption,
                    'sort_order' => $sortOrder,
                    'active' => $active,
                    'id' => $slideId,
                ]);
                setFlash('success', 'Slide updated successfully.');
            } else {
                dbQuery('INSERT INTO mod_hero_slides (image_url, alt_text, role_text, caption_text, sort_order, active) VALUES (:image_url, :alt_text, :role_text, :caption_text, :sort_order, :active)', [
                    'image_url' => $imageUrl,
                    'alt_text' => $alt,
                    'role_text' => $role,
                    'caption_text' => $caption,
                    'sort_order' => $sortOrder,
                    'active' => $active,
                ]);
                setFlash('success', 'Slide added successfully.');
            }
            redirectTo('slides');
            break;

        case 'delete_slide':
            $slideId = (int)($_POST['slide_id'] ?? 0);
            if ($slideId) {
                dbQuery('DELETE FROM mod_hero_slides WHERE id = ?', [$slideId]);
                setFlash('success', 'Slide removed.');
            }
            redirectTo('slides');
            break;

        case 'save_leader':
            $leaderId = (int)($_POST['leader_id'] ?? 0);
            $positionKey = trim($_POST['leader_position'] ?? '');
            $title = trim($_POST['leader_title'] ?? '');
            $name = trim($_POST['leader_name'] ?? '');
            $bio = trim($_POST['leader_bio'] ?? '');
            $photoUrl = trim($_POST['leader_photo_url'] ?? '');
            $profileLink = trim($_POST['leader_profile_link'] ?? '');
            $sortOrder = (int)($_POST['leader_order'] ?? 0);
            $active = isset($_POST['leader_active']) ? 1 : 0;
            $existing = '';
            if ($leaderId) {
                $existing = dbFetch('SELECT photo_url FROM mod_leaders WHERE id = ? LIMIT 1', [$leaderId])['photo_url'] ?? '';
            }
            $photoPath = uploadImageFile('leader_photo_file', 'assets/images/headshots', $existing);
            if ($photoPath) {
                $photoUrl = $photoPath;
            }

            if (!$positionKey || !$title || !$name) {
                setFlash('error', 'Please provide a position, title, and name for the leader.');
                redirectTo('leadership');
            }

            if ($leaderId) {
                dbQuery('UPDATE mod_leaders SET position_key = :position_key, title = :title, name = :name, bio = :bio, photo_url = :photo_url, profile_link = :profile_link, sort_order = :sort_order, active = :active WHERE id = :id', [
                    'position_key' => $positionKey,
                    'title' => $title,
                    'name' => $name,
                    'bio' => $bio,
                    'photo_url' => $photoUrl,
                    'profile_link' => $profileLink,
                    'sort_order' => $sortOrder,
                    'active' => $active,
                    'id' => $leaderId,
                ]);
                setFlash('success', 'Leadership profile updated successfully.');
            } else {
                dbQuery('INSERT INTO mod_leaders (position_key, title, name, bio, photo_url, profile_link, sort_order, active) VALUES (:position_key, :title, :name, :bio, :photo_url, :profile_link, :sort_order, :active)', [
                    'position_key' => $positionKey,
                    'title' => $title,
                    'name' => $name,
                    'bio' => $bio,
                    'photo_url' => $photoUrl,
                    'profile_link' => $profileLink,
                    'sort_order' => $sortOrder,
                    'active' => $active,
                ]);
                setFlash('success', 'Leadership profile added successfully.');
            }
            redirectTo('leadership');
            break;

        case 'delete_leader':
            $leaderId = (int)($_POST['leader_id'] ?? 0);
            if ($leaderId) {
                dbQuery('DELETE FROM mod_leaders WHERE id = ?', [$leaderId]);
                setFlash('success', 'Leadership profile removed.');
            }
            redirectTo('leadership');
            break;

        case 'save_press':
            $pressId = (int)($_POST['press_id'] ?? 0);
            $title = trim($_POST['press_title'] ?? '');
            $excerpt = trim($_POST['press_excerpt'] ?? '');
            $category = trim($_POST['press_category'] ?? '');
            $publishedAt = trim($_POST['press_published_at'] ?? '');
            $imageUrl = trim($_POST['press_image_url'] ?? '');
            $linkUrl = trim($_POST['press_link_url'] ?? '');
            $slug = trim($_POST['press_slug'] ?? '');
            $sortOrder = (int)($_POST['press_order'] ?? 0);
            $active = isset($_POST['press_active']) ? 1 : 0;
            $existing = '';
            if ($pressId) {
                $existing = dbFetch('SELECT image_url FROM mod_press_items WHERE id = ? LIMIT 1', [$pressId])['image_url'] ?? '';
            }
            $imagePath = uploadImageFile('press_image_file', 'assets/images/press', $existing);
            if ($imagePath) {
                $imageUrl = $imagePath;
            }

            if (!$title || !$category || !$publishedAt) {
                setFlash('error', 'Title, category, and published date are required for press items.');
                redirectTo('press');
            }

            if (!$slug) {
                $slug = normalizeSlug($title);
            }

            $publishedAt = date('Y-m-d', strtotime($publishedAt));
            if (!$publishedAt) {
                $publishedAt = date('Y-m-d');
            }

            if ($pressId) {
                dbQuery('UPDATE mod_press_items SET title = :title, excerpt = :excerpt, category = :category, published_at = :published_at, image_url = :image_url, link_url = :link_url, slug = :slug, sort_order = :sort_order, active = :active WHERE id = :id', [
                    'title' => $title,
                    'excerpt' => $excerpt,
                    'category' => $category,
                    'published_at' => $publishedAt,
                    'image_url' => $imageUrl,
                    'link_url' => $linkUrl,
                    'slug' => $slug,
                    'sort_order' => $sortOrder,
                    'active' => $active,
                    'id' => $pressId,
                ]);
                setFlash('success', 'Press item updated successfully.');
            } else {
                dbQuery('INSERT INTO mod_press_items (title, excerpt, category, published_at, image_url, link_url, slug, sort_order, active) VALUES (:title, :excerpt, :category, :published_at, :image_url, :link_url, :slug, :sort_order, :active)', [
                    'title' => $title,
                    'excerpt' => $excerpt,
                    'category' => $category,
                    'published_at' => $publishedAt,
                    'image_url' => $imageUrl,
                    'link_url' => $linkUrl,
                    'slug' => $slug,
                    'sort_order' => $sortOrder,
                    'active' => $active,
                ]);
                setFlash('success', 'Press item added successfully.');
            }
            redirectTo('press');
            break;

        case 'delete_press':
            $pressId = (int)($_POST['press_id'] ?? 0);
            if ($pressId) {
                dbQuery('DELETE FROM mod_press_items WHERE id = ?', [$pressId]);
                setFlash('success', 'Press item removed.');
            }
            redirectTo('press');
            break;

        case 'delete_submission':
            $subId = (int)($_POST['submission_id'] ?? 0);
            if ($subId) {
                dbQuery('DELETE FROM mod_submissions WHERE id = ?', [$subId]);
                setFlash('success', 'Submission deleted.');
            }
            redirectTo('submissions');
            break;

        case 'import_defaults':
            saveContentBlob(defaultContent());
            setFlash('success', 'Default homepage content has been imported into the database.');
            redirectTo();
            break;

        case 'save_settings':
            saveSetting('hero_eyebrow', trim($_POST['hero_eyebrow'] ?? ''));
            saveSetting('hero_headline', trim($_POST['hero_headline'] ?? ''));
            saveSetting('hero_body', trim($_POST['hero_body'] ?? ''));
            saveSetting('last_reviewed', trim($_POST['last_reviewed'] ?? ''));
            saveSetting('ministry_name', trim($_POST['ministry_name'] ?? ''));
            saveSetting('country', trim($_POST['country'] ?? ''));
            setFlash('success', 'Homepage settings have been saved.');
            redirectTo('settings');
            break;

        default:
            setFlash('error', 'Unknown action.');
            redirectTo();
            break;
    }
}

$dbSlides = safeDbFetchAll('SELECT * FROM mod_hero_slides ORDER BY sort_order ASC, id ASC');
$dbLeaders = safeDbFetchAll('SELECT * FROM mod_leaders ORDER BY sort_order ASC, id ASC');
$dbPressItems = safeDbFetchAll('SELECT * FROM mod_press_items ORDER BY sort_order ASC, id ASC');

$slides = $dbSlides ?: getHeroSlides(false);
$leaders = $dbLeaders ?: getLeadership(false);
$pressItems = $dbPressItems ?: getPressItems(false);
$usingFallback = empty($dbSlides) && empty($dbLeaders) && empty($dbPressItems);
$subscribers = getSubscribers();
$allSubmissions       = getSubmissions();
$submissionsContact   = getSubmissions('contact');
$submissionsFoi       = getSubmissions('foi');
$submissionsServicecom = getSubmissions('servicom');
$settings = [
    'hero_eyebrow' => getSetting('hero_eyebrow', 'Federal Republic of Nigeria'),
    'hero_headline' => getSetting('hero_headline', 'Defending the sovereignty of Nigeria.'),
    'hero_body' => getSetting('hero_body', 'The Federal Ministry of Defence — the apex policy authority overseeing the Nigerian Armed Forces — provides strategic leadership for a modern, professional, mission-ready military in the service of more than 220 million citizens of the Federal Republic.'),
    'last_reviewed' => getSetting('last_reviewed', 'May 2026'),
    'ministry_name' => getSetting('ministry_name', 'Federal Ministry of Defence'),
    'country' => getSetting('country', 'Federal Republic of Nigeria'),
];
$csrf = csrfToken();
?><!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="csrf-token" content="<?= escapeHtml($csrf) ?>" />
  <title>Admin Dashboard — FMOD Website</title>
  <link rel="icon" href="../assets/images/favicon.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" />
  <link rel="stylesheet" href="admin.css" />
</head>
<body class="admin-body">
<div class="admin-shell" id="admin-shell">

  <!-- ═══════════════════════ SIDEBAR BACKDROP ═══════════════════════ -->
  <div class="sidebar-backdrop" id="sidebar-backdrop"></div>

  <!-- ═══════════════════════ SIDEBAR ═══════════════════════ -->
  <aside class="admin-sidebar">
    <div class="admin-brand">
      <img src="../assets/images/coat-of-arms.jpg" alt="Nigerian Coat of Arms" />
      <div>
        <div class="brand-name">MOD Admin</div>
        <div class="brand-sub">Content Management</div>
      </div>
    </div>

    <div class="admin-user">
      <div class="admin-user-avatar">A</div>
      <div class="admin-user-info">
        <div class="admin-user-name">Administrator</div>
        <div class="admin-user-role">Super Admin</div>
      </div>
    </div>

    <nav class="admin-nav" aria-label="Admin navigation">
      <div class="nav-section-label">Overview</div>
      <a class="admin-nav-btn active" href="#dashboard">
        <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg></span>
        Dashboard
      </a>

      <div class="nav-section-label">Content</div>
      <a class="admin-nav-btn" href="#slides">
        <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="m9 9 6 3-6 3V9z"/></svg></span>
        Hero &amp; Slider
      </a>
      <a class="admin-nav-btn" href="#press">
        <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg></span>
        Press Releases
      </a>
      <a class="admin-nav-btn" href="#leadership">
        <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
        Leadership
      </a>

      <div class="nav-section-label">Audience</div>
      <a class="admin-nav-btn" href="#subscribers">
        <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></span>
        Newsletter
      </a>
      <a class="admin-nav-btn" href="#submissions">
        <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg></span>
        Form Submissions
      </a>

      <div class="nav-section-label">Configuration</div>
      <a class="admin-nav-btn" href="#settings">
        <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></span>
        Site Settings
      </a>
    </nav>

    <div class="admin-foot">
      <a href="../" target="_blank">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        View public site
      </a>
      <a href="logout.php" class="logout">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Sign out
      </a>
    </div>
  </aside><!-- /sidebar -->

  <!-- ═══════════════════════ MAIN ═══════════════════════ -->
  <main class="admin-main">

    <!-- Top bar -->
    <div class="admin-topbar">
      <div class="topbar-left">
        <button class="sidebar-toggle" type="button" aria-expanded="false" aria-label="Toggle navigation">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          Menu
        </button>
        <div class="topbar-breadcrumb">
          <span>Federal Ministry of Defence</span>
          <span class="sep">›</span>
          <span class="current" id="topbar-current">Dashboard</span>
        </div>
      </div>
      <div class="topbar-right">
        <div class="topbar-time" id="topbar-clock"></div>
        <div class="status-dot" title="System online"></div>
      </div>
    </div>

    <!-- ─────────────── DASHBOARD ─────────────── -->
    <section class="admin-section active" id="dashboard">
      <div class="admin-header">
        <div class="admin-header-text">
          <h1>Dashboard.</h1>
          <p>Welcome back. All edits update the public site immediately.</p>
        </div>
        <div class="admin-header-actions">
          <a class="btn btn-green btn-sm" href="#press" data-open-edit-modal="press">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New press release
          </a>
        </div>
      </div>

      <?php if ($flash): ?>
        <div class="alert alert-<?= $flash['type'] === 'error' ? 'error' : 'success' ?>">
          <?= escapeHtml($flash['message']) ?>
        </div>
      <?php endif; ?>

      <?php if ($usingFallback): ?>
        <div class="alert alert-info" style="margin-bottom:20px;">
          <div>
            <strong>Using default content.</strong> The homepage database is empty — showing built-in defaults.
            <form method="post" style="display:inline-block; margin-left:12px;">
              <input type="hidden" name="csrf" value="<?= escapeHtml($csrf) ?>" />
              <input type="hidden" name="action" value="import_defaults" />
              <button type="submit" class="btn btn-gold btn-sm">Import default content</button>
            </form>
          </div>
        </div>
      <?php endif; ?>

      <!-- Stats -->
      <div class="admin-stats">
        <div class="stat-card">
          <div class="stat-card-icon green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </div>
          <div class="stat-num"><?= count($pressItems) ?></div>
          <div class="stat-label">Press releases</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="m9 9 6 3-6 3V9z"/></svg>
          </div>
          <div class="stat-num"><?= count($slides) ?></div>
          <div class="stat-label">Hero slides</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          </div>
          <div class="stat-num"><?= count($subscribers) ?></div>
          <div class="stat-label">Subscribers</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon gold">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </div>
          <div class="stat-num"><?= count($allSubmissions) ?></div>
          <div class="stat-label">Form submissions</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div class="stat-num"><?= count($leaders) ?></div>
          <div class="stat-label">Leadership profiles</div>
        </div>
      </div>

      <!-- Grid: quick actions + activity -->
      <div class="admin-grid-2">
        <div class="panel">
          <h3>Quick actions</h3>
          <div class="quick-actions">
            <a class="btn btn-green btn-sm" href="#press" data-open-edit-modal="press">+ Press release</a>
            <a class="btn btn-outline btn-sm" href="#slides" data-open-edit-modal="slide">+ Hero slide</a>
            <a class="btn btn-outline btn-sm" href="#leadership" data-open-edit-modal="leadership">+ Leader profile</a>
            <a class="btn btn-ghost btn-sm" href="#subscribers">View subscribers</a>
            <a class="btn btn-ghost btn-sm" href="#submissions">View submissions</a>
            <a class="btn btn-ghost btn-sm" href="#settings">Settings</a>
          </div>
        </div>
        <div class="panel">
          <h3>Site status</h3>
          <ul class="activity-feed" style="margin-top:12px;">
            <li class="activity-item">
              <div class="activity-dot green"></div>
              <div>
                <div class="activity-meta">Public website is live</div>
                <div class="activity-time"><a href="../" target="_blank" style="color:var(--green); font-size:.75rem;">defence.gov.ng ↗</a></div>
              </div>
            </li>
            <li class="activity-item">
              <div class="activity-dot <?= count($slides) > 0 ? 'green' : 'gold' ?>"></div>
              <div>
                <div class="activity-meta"><?= count($slides) ?> hero slide<?= count($slides) !== 1 ? 's' : '' ?> configured</div>
                <div class="activity-time"><a href="#slides" class="admin-nav-btn-inline" style="color:var(--text-3); font-size:.75rem;">Manage slides →</a></div>
              </div>
            </li>
            <li class="activity-item">
              <div class="activity-dot <?= count($pressItems) > 0 ? 'green' : 'gold' ?>"></div>
              <div>
                <div class="activity-meta"><?= count($pressItems) ?> press item<?= count($pressItems) !== 1 ? 's' : '' ?> published</div>
                <div class="activity-time"><a href="#press" style="color:var(--text-3); font-size:.75rem;">Manage press →</a></div>
              </div>
            </li>
            <li class="activity-item">
              <div class="activity-dot blue"></div>
              <div>
                <div class="activity-meta"><?= count($subscribers) ?> newsletter subscriber<?= count($subscribers) !== 1 ? 's' : '' ?></div>
                <div class="activity-time"><a href="#subscribers" style="color:var(--text-3); font-size:.75rem;">View list →</a></div>
              </div>
            </li>
            <li class="activity-item">
              <div class="activity-dot gold"></div>
              <div>
                <div class="activity-meta"><?= count($allSubmissions) ?> form submission<?= count($allSubmissions) !== 1 ? 's' : '' ?> (<?= count($submissionsContact) ?> contact · <?= count($submissionsFoi) ?> FOI · <?= count($submissionsServicecom) ?> SERVICOM)</div>
                <div class="activity-time"><a href="#submissions" style="color:var(--text-3); font-size:.75rem;">View submissions →</a></div>
              </div>
            </li>
            <li class="activity-item">
              <div class="activity-dot gold"></div>
              <div>
                <div class="activity-meta">Last reviewed: <?= escapeHtml($settings['last_reviewed']) ?></div>
                <div class="activity-time"><a href="#settings" style="color:var(--text-3); font-size:.75rem;">Update in settings →</a></div>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <!-- Recent press preview -->
      <?php if ($pressItems): ?>
      <div class="panel">
        <div class="panel-head">
          <div>
            <h3>Recent press releases</h3>
            <p>Showing the latest <?= min(5, count($pressItems)) ?> of <?= count($pressItems) ?> items.</p>
          </div>
          <a class="btn btn-outline btn-sm" href="#press">View all</a>
        </div>
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <?php foreach (array_slice($pressItems, 0, 5) as $press): ?>
                <tr>
                  <td><strong><?= escapeHtml($press['title']) ?></strong></td>
                  <td><?= escapeHtml($press['category']) ?></td>
                  <td><?= escapeHtml($press['published_at']) ?></td>
                  <td><span class="badge badge-<?= $press['active'] ? 'active' : 'disabled' ?>"><?= $press['active'] ? 'Active' : 'Disabled' ?></span></td>
                  <td>
                    <div class="row-actions">
                      <a class="btn btn-sm btn-outline" href="?edit_press=<?= escapeHtml($press['id']) ?>#press">Edit</a>
                    </div>
                  </td>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        </div>
      </div>
      <?php endif; ?>
    </section>

    <!-- ─────────────── SLIDES ─────────────── -->
    <section class="admin-section" id="slides">
      <div class="admin-header">
        <div class="admin-header-text">
          <h1>Hero &amp; Slider.</h1>
          <p>Manage the homepage hero carousel. The first active slide is shown by default.</p>
        </div>
        <div class="admin-header-actions">
          <a class="btn btn-green btn-sm" href="#slides" data-open-edit-modal="slide">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add slide
          </a>
        </div>
      </div>

      <div class="panel">
        <div class="panel-head">
          <div>
            <h3>Hero slides</h3>
            <p>Upload a local file or provide a valid path. Drag the order column to re-sequence.</p>
          </div>
        </div>

        <?php if ($slides): ?>
          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Preview</th>
                  <th>Role / Caption</th>
                  <th>Alt text</th>
                  <th>Order</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <?php foreach ($slides as $slide): ?>
                  <tr>
                    <td><img src="<?= escapeHtml(resolveAdminImageUrl($slide['image_url'])) ?>" alt="<?= escapeHtml($slide['alt_text']) ?>" /></td>
                    <td>
                      <strong><?= escapeHtml($slide['role_text']) ?></strong>
                      <p><?= escapeHtml(mb_strimwidth($slide['caption_text'], 0, 60, '…')) ?></p>
                    </td>
                    <td><?= escapeHtml(mb_strimwidth($slide['alt_text'], 0, 40, '…')) ?></td>
                    <td><?= escapeHtml($slide['sort_order']) ?></td>
                    <td><span class="badge badge-<?= $slide['active'] ? 'active' : 'disabled' ?>"><?= $slide['active'] ? 'Active' : 'Disabled' ?></span></td>
                    <td>
                      <div class="row-actions">
                        <a class="btn btn-sm btn-outline" href="?edit_slide=<?= escapeHtml($slide['id']) ?>#slides">Edit</a>
                        <form method="post" class="inline-form" onsubmit="return confirm('Remove this slide permanently?');">
                          <input type="hidden" name="csrf" value="<?= escapeHtml($csrf) ?>" />
                          <input type="hidden" name="action" value="delete_slide" />
                          <input type="hidden" name="slide_id" value="<?= escapeHtml($slide['id']) ?>" />
                          <button type="submit" class="btn btn-sm btn-danger">Remove</button>
                        </form>
                      </div>
                    </td>
                  </tr>
                <?php endforeach; ?>
              </tbody>
            </table>
          </div>
        <?php else: ?>
          <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="m9 9 6 3-6 3V9z"/></svg>
            <p>No slides configured yet.<br><a href="#slides" data-open-edit-modal="slide" style="color:var(--green);">Add your first slide →</a></p>
          </div>
        <?php endif; ?>
      </div>

      <!-- Edit panel (cloned into modal) -->
      <div class="panel" id="slide-edit-panel">
        <h3><?= $editSlide ? 'Edit slide' : 'Add new slide' ?></h3>
        <form method="post" enctype="multipart/form-data">
          <input type="hidden" name="csrf" value="<?= escapeHtml($csrf) ?>" />
          <input type="hidden" name="action" value="save_slide" />
          <input type="hidden" name="slide_id" value="<?= escapeHtml($editSlide['id'] ?? '0') ?>" />

          <div class="form-section-title">Image</div>
          <div class="form-row">
            <label>
              Image path or URL
              <input type="text" name="slide_image_url" value="<?= escapeHtml($editSlide['image_url'] ?? '') ?>" placeholder="assets/images/hero/slide-1.jpg" />
              <span class="field-hint">Relative path from site root, or full https:// URL</span>
            </label>
            <label>
              Upload new image
              <input type="file" name="slide_image_file" accept="image/*" />
              <span class="field-hint">JPG, PNG, WebP — replaces path above</span>
            </label>
          </div>

          <div class="form-section-title" style="margin-top:4px;">Metadata</div>
          <div class="form-row">
            <label>
              Alt text
              <input type="text" name="slide_alt" value="<?= escapeHtml($editSlide['alt_text'] ?? '') ?>" placeholder="Describe the image for screen readers" />
            </label>
            <label>
              Role label
              <input type="text" name="slide_role" value="<?= escapeHtml($editSlide['role_text'] ?? '') ?>" placeholder="e.g. Nigerian Army" />
            </label>
          </div>
          <div class="form-row">
            <label>
              Caption
              <textarea name="slide_caption" rows="3" placeholder="Short caption shown on the hero…"><?= escapeHtml($editSlide['caption_text'] ?? '') ?></textarea>
            </label>
            <label>
              Sort order
              <input type="number" name="slide_order" value="<?= escapeHtml($editSlide['sort_order'] ?? '0') ?>" min="0" />
              <span class="field-hint">Lower numbers appear first</span>
            </label>
          </div>

          <label class="checkbox-label">
            <input type="checkbox" name="slide_active" value="1" <?= isset($editSlide['active']) && $editSlide['active'] ? 'checked' : '' ?> />
            Show this slide on the public site
          </label>

          <div class="form-actions">
            <button type="submit" class="btn btn-green"><?= $editSlide ? 'Update slide' : 'Save slide' ?></button>
            <?php if ($editSlide): ?>
              <a href="index.php#slides" class="btn btn-ghost">Cancel</a>
            <?php endif; ?>
          </div>
        </form>
      </div>
    </section>

    <!-- ─────────────── PRESS ─────────────── -->
    <section class="admin-section" id="press">
      <div class="admin-header">
        <div class="admin-header-text">
          <h1>Press releases.</h1>
          <p>The first active item appears as the featured story on the home page.</p>
        </div>
        <div class="admin-header-actions">
          <a class="btn btn-green btn-sm" href="#press" data-open-edit-modal="press">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New release
          </a>
        </div>
      </div>

      <div class="panel">
        <div class="panel-head">
          <div>
            <h3>All press releases</h3>
            <p><?= count($pressItems) ?> item<?= count($pressItems) !== 1 ? 's' : '' ?> total</p>
          </div>
        </div>

        <?php if ($pressItems): ?>
          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Published</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <?php foreach ($pressItems as $press): ?>
                  <tr>
                    <td>
                      <strong><?= escapeHtml($press['title']) ?></strong>
                      <?php if (!empty($press['excerpt'])): ?>
                        <p><?= escapeHtml(mb_strimwidth($press['excerpt'], 0, 70, '…')) ?></p>
                      <?php endif; ?>
                    </td>
                    <td><?= escapeHtml($press['category']) ?></td>
                    <td><?= escapeHtml($press['published_at']) ?></td>
                    <td><span class="badge badge-<?= $press['active'] ? 'active' : 'disabled' ?>"><?= $press['active'] ? 'Active' : 'Disabled' ?></span></td>
                    <td>
                      <div class="row-actions">
                        <a class="btn btn-sm btn-outline" href="?edit_press=<?= escapeHtml($press['id']) ?>#press">Edit</a>
                        <form method="post" class="inline-form" onsubmit="return confirm('Remove this press release?');">
                          <input type="hidden" name="csrf" value="<?= escapeHtml($csrf) ?>" />
                          <input type="hidden" name="action" value="delete_press" />
                          <input type="hidden" name="press_id" value="<?= escapeHtml($press['id']) ?>" />
                          <button type="submit" class="btn btn-sm btn-danger">Remove</button>
                        </form>
                      </div>
                    </td>
                  </tr>
                <?php endforeach; ?>
              </tbody>
            </table>
          </div>
        <?php else: ?>
          <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <p>No press releases yet.<br><a href="#press" data-open-edit-modal="press" style="color:var(--green);">Add the first one →</a></p>
          </div>
        <?php endif; ?>
      </div>

      <!-- Edit panel -->
      <div class="panel" id="press-edit-panel">
        <h3><?= $editPress ? 'Edit press release' : 'Add new press release' ?></h3>
        <form method="post" enctype="multipart/form-data">
          <input type="hidden" name="csrf" value="<?= escapeHtml($csrf) ?>" />
          <input type="hidden" name="action" value="save_press" />
          <input type="hidden" name="press_id" value="<?= escapeHtml($editPress['id'] ?? '0') ?>" />

          <div class="form-section-title">Core details</div>
          <div class="form-row">
            <label>
              Title
              <input type="text" name="press_title" value="<?= escapeHtml($editPress['title'] ?? '') ?>" placeholder="Press release headline" required />
            </label>
            <label>
              Category
              <input type="text" name="press_category" value="<?= escapeHtml($editPress['category'] ?? '') ?>" placeholder="Press Office, Operations…" />
            </label>
          </div>
          <div class="form-row">
            <label>
              Published date
              <input type="date" name="press_published_at" value="<?= escapeHtml($editPress['published_at'] ?? date('Y-m-d')) ?>" required />
            </label>
            <label>
              Article link
              <input type="text" name="press_link_url" value="<?= escapeHtml($editPress['link_url'] ?? '') ?>" placeholder="press.html#slug" />
            </label>
          </div>

          <div class="form-section-title">Content</div>
          <div class="form-row full">
            <label>
              Excerpt / summary
              <textarea name="press_excerpt" rows="4" placeholder="Short summary shown on the home page and press listing."><?= escapeHtml($editPress['excerpt'] ?? '') ?></textarea>
            </label>
          </div>

          <div class="form-section-title">Image</div>
          <div class="form-row">
            <label>
              Image path
              <input type="text" name="press_image_url" value="<?= escapeHtml($editPress['image_url'] ?? '') ?>" placeholder="assets/images/press/story.jpg" />
            </label>
            <label>
              Upload image
              <input type="file" name="press_image_file" accept="image/*" />
            </label>
          </div>

          <div class="form-section-title">Publishing</div>
          <div class="form-row">
            <label>
              Slug
              <input type="text" name="press_slug" value="<?= escapeHtml($editPress['slug'] ?? '') ?>" placeholder="url-friendly-slug" />
              <span class="field-hint">Used in URLs — no spaces</span>
            </label>
            <label>
              Sort order
              <input type="number" name="press_order" value="<?= escapeHtml($editPress['sort_order'] ?? '0') ?>" min="0" />
            </label>
          </div>

          <label class="checkbox-label">
            <input type="checkbox" name="press_active" value="1" <?= isset($editPress['active']) && $editPress['active'] ? 'checked' : '' ?> />
            Publish this release (visible on public site)
          </label>

          <div class="form-actions">
            <button type="submit" class="btn btn-green"><?= $editPress ? 'Update release' : 'Save release' ?></button>
            <?php if ($editPress): ?><a href="index.php#press" class="btn btn-ghost">Cancel</a><?php endif; ?>
          </div>
        </form>
      </div>
    </section>

    <!-- ─────────────── LEADERSHIP ─────────────── -->
    <section class="admin-section" id="leadership">
      <div class="admin-header">
        <div class="admin-header-text">
          <h1>Leadership.</h1>
          <p>Minister, Minister of State, Permanent Secretary and other senior profiles.</p>
        </div>
        <div class="admin-header-actions">
          <a class="btn btn-green btn-sm" href="#leadership" data-open-edit-modal="leadership">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add profile
          </a>
        </div>
      </div>

      <div class="panel">
        <div class="panel-head">
          <div>
            <h3>Leadership profiles</h3>
            <p><?= count($leaders) ?> profile<?= count($leaders) !== 1 ? 's' : '' ?> configured</p>
          </div>
        </div>

        <?php if ($leaders): ?>
          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Photo</th>
                  <th>Name</th>
                  <th>Position</th>
                  <th>Order</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <?php foreach ($leaders as $leader): ?>
                  <tr>
                    <td><img class="avatar" src="<?= escapeHtml(resolveAdminImageUrl($leader['photo_url'])) ?>" alt="<?= escapeHtml($leader['name']) ?>" /></td>
                    <td><strong><?= escapeHtml($leader['name']) ?></strong></td>
                    <td>
                      <?= escapeHtml($leader['title']) ?>
                      <p><?= escapeHtml($leader['position_key']) ?></p>
                    </td>
                    <td><?= escapeHtml($leader['sort_order']) ?></td>
                    <td><span class="badge badge-<?= $leader['active'] ? 'active' : 'disabled' ?>"><?= $leader['active'] ? 'Active' : 'Disabled' ?></span></td>
                    <td>
                      <div class="row-actions">
                        <a class="btn btn-sm btn-outline" href="?edit_leader=<?= escapeHtml($leader['id']) ?>#leadership">Edit</a>
                        <form method="post" class="inline-form" onsubmit="return confirm('Remove this leader profile?');">
                          <input type="hidden" name="csrf" value="<?= escapeHtml($csrf) ?>" />
                          <input type="hidden" name="action" value="delete_leader" />
                          <input type="hidden" name="leader_id" value="<?= escapeHtml($leader['id']) ?>" />
                          <button type="submit" class="btn btn-sm btn-danger">Remove</button>
                        </form>
                      </div>
                    </td>
                  </tr>
                <?php endforeach; ?>
              </tbody>
            </table>
          </div>
        <?php else: ?>
          <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <p>No leadership profiles yet.</p>
          </div>
        <?php endif; ?>
      </div>

      <!-- Edit panel -->
      <div class="panel" id="leadership-edit-panel">
        <h3><?= $editLeader ? 'Edit leadership profile' : 'Add new profile' ?></h3>
        <form method="post" enctype="multipart/form-data">
          <input type="hidden" name="csrf" value="<?= escapeHtml($csrf) ?>" />
          <input type="hidden" name="action" value="save_leader" />
          <input type="hidden" name="leader_id" value="<?= escapeHtml($editLeader['id'] ?? '0') ?>" />

          <div class="form-section-title">Identity</div>
          <div class="form-row">
            <label>
              Position
              <select name="leader_position" required>
                <?php foreach (['minister' => 'Honourable Minister of Defence', 'ministerOfState' => 'Honourable Minister of State', 'permSec' => 'Permanent Secretary', 'other' => 'Other'] as $key => $lbl): ?>
                  <option value="<?= escapeHtml($key) ?>" <?= isset($editLeader['position_key']) && $editLeader['position_key'] === $key ? 'selected' : '' ?>><?= escapeHtml($lbl) ?></option>
                <?php endforeach; ?>
              </select>
            </label>
            <label>
              Title / formal position
              <input type="text" name="leader_title" value="<?= escapeHtml($editLeader['title'] ?? '') ?>" placeholder="Honourable Minister of Defence" />
            </label>
          </div>
          <div class="form-row">
            <label>
              Full name
              <input type="text" name="leader_name" value="<?= escapeHtml($editLeader['name'] ?? '') ?>" placeholder="General Christopher Gwabin Musa (rtd)" required />
            </label>
            <label>
              Profile page link
              <input type="text" name="leader_profile_link" value="<?= escapeHtml($editLeader['profile_link'] ?? '') ?>" placeholder="minister.html" />
            </label>
          </div>

          <div class="form-section-title">Photo</div>
          <div class="form-row">
            <label>
              Photo path
              <input type="text" name="leader_photo_url" value="<?= escapeHtml($editLeader['photo_url'] ?? '') ?>" placeholder="assets/images/headshots/minister.jpg" />
            </label>
            <label>
              Upload photo
              <input type="file" name="leader_photo_file" accept="image/*" />
            </label>
          </div>

          <div class="form-section-title">Bio</div>
          <div class="form-row full">
            <label>
              Short biography
              <textarea name="leader_bio" rows="4" placeholder="Short profile shown on the About and Leadership pages."><?= escapeHtml($editLeader['bio'] ?? '') ?></textarea>
            </label>
          </div>

          <div class="form-section-title">Publishing</div>
          <div class="form-row">
            <label>
              Sort order
              <input type="number" name="leader_order" value="<?= escapeHtml($editLeader['sort_order'] ?? '0') ?>" min="0" />
              <span class="field-hint">Lower = appears first</span>
            </label>
            <div style="display:flex; align-items:flex-end; padding-bottom:2px;">
              <label class="checkbox-label" style="margin-bottom:0;">
                <input type="checkbox" name="leader_active" value="1" <?= isset($editLeader['active']) && $editLeader['active'] ? 'checked' : '' ?> />
                Show on public site
              </label>
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-green"><?= $editLeader ? 'Update profile' : 'Save profile' ?></button>
            <?php if ($editLeader): ?><a href="index.php#leadership" class="btn btn-ghost">Cancel</a><?php endif; ?>
          </div>
        </form>
      </div>
    </section>

    <!-- ─────────────── SUBSCRIBERS ─────────────── -->
    <section class="admin-section" id="subscribers">
      <div class="admin-header">
        <div class="admin-header-text">
          <h1>Newsletter.</h1>
          <p>Citizens who have subscribed to press releases and updates.</p>
        </div>
        <div class="admin-header-actions">
          <?php if ($subscribers): ?>
            <span style="font-size:.8rem; color:var(--text-3);"><strong style="color:var(--text-1);"><?= count($subscribers) ?></strong> subscriber<?= count($subscribers) !== 1 ? 's' : '' ?></span>
          <?php endif; ?>
        </div>
      </div>

      <div class="panel">
        <?php if ($subscribers): ?>
          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Email address</th>
                  <th>Subscribed at</th>
                </tr>
              </thead>
              <tbody>
                <?php foreach ($subscribers as $i => $sub): ?>
                  <tr>
                    <td style="color:var(--text-3); width:48px;"><?= $i + 1 ?></td>
                    <td><strong><?= escapeHtml($sub['email']) ?></strong></td>
                    <td><?= escapeHtml($sub['subscribed_at']) ?></td>
                  </tr>
                <?php endforeach; ?>
              </tbody>
            </table>
          </div>
        <?php else: ?>
          <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            <p>No subscribers yet. The newsletter sign-up is on the home page.</p>
          </div>
        <?php endif; ?>
      </div>
    </section>

    <!-- ─────────────── SUBMISSIONS ─────────────── -->
    <section class="admin-section" id="submissions">
      <div class="admin-header">
        <div class="admin-header-text">
          <h1>Form Submissions.</h1>
          <p>Contact, Freedom of Information, and SERVICOM requests submitted through the public website.</p>
        </div>
        <div class="admin-header-actions">
          <?php if ($allSubmissions): ?>
            <span style="font-size:.8rem; color:var(--text-3);"><strong style="color:var(--text-1);"><?= count($allSubmissions) ?></strong> total submission<?= count($allSubmissions) !== 1 ? 's' : '' ?></span>
          <?php endif; ?>
        </div>
      </div>

      <!-- Tab filter -->
      <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:20px;">
        <button class="btn btn-sm btn-green" id="sub-tab-all"    onclick="filterSubmissions('all')">All (<?= count($allSubmissions) ?>)</button>
        <button class="btn btn-sm btn-outline" id="sub-tab-contact"   onclick="filterSubmissions('contact')">Contact (<?= count($submissionsContact) ?>)</button>
        <button class="btn btn-sm btn-outline" id="sub-tab-foi"       onclick="filterSubmissions('foi')">FOI (<?= count($submissionsFoi) ?>)</button>
        <button class="btn btn-sm btn-outline" id="sub-tab-servicom"  onclick="filterSubmissions('servicom')">SERVICOM (<?= count($submissionsServicecom) ?>)</button>
      </div>

      <div class="panel" id="submissions-panel">
        <?php if ($allSubmissions): ?>
          <div class="table-scroll">
            <table id="submissions-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Type</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Subject / Reference</th>
                  <th>Submitted</th>
                  <th>Details</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <?php foreach ($allSubmissions as $i => $sub): ?>
                  <?php
                    $badgeClass = match($sub['form_type']) {
                        'foi'      => 'badge-info',
                        'servicom' => 'badge-warn',
                        default    => 'badge-active',
                    };
                    $typeLabel = match($sub['form_type']) {
                        'foi'      => 'FOI',
                        'servicom' => 'SERVICOM',
                        default    => 'Contact',
                    };
                    $metaLines = [];
                    foreach ($sub['meta'] as $k => $v) {
                        if ($v !== '' && $k !== 'website') {
                            $label = ucwords(str_replace(['_','-'], ' ', $k));
                            $metaLines[] = '<strong>' . escapeHtml($label) . ':</strong> ' . escapeHtml((string)$v);
                        }
                    }
                  ?>
                  <tr data-form-type="<?= escapeHtml($sub['form_type']) ?>">
                    <td style="color:var(--text-3); width:44px;"><?= $i + 1 ?></td>
                    <td><span class="badge <?= $badgeClass ?>"><?= $typeLabel ?></span></td>
                    <td><strong><?= escapeHtml($sub['name']) ?></strong></td>
                    <td><a href="mailto:<?= escapeHtml($sub['email']) ?>" style="color:var(--green);"><?= escapeHtml($sub['email']) ?></a></td>
                    <td><?= escapeHtml($sub['subject']) ?></td>
                    <td style="white-space:nowrap;"><?= escapeHtml(date('d M Y H:i', strtotime($sub['submitted_at']))) ?></td>
                    <td>
                      <?php if ($metaLines): ?>
                        <details style="font-size:.78rem;">
                          <summary style="cursor:pointer; color:var(--text-2);">View details</summary>
                          <div style="margin-top:6px; line-height:1.7;">
                            <?= implode('<br>', $metaLines) ?>
                          </div>
                        </details>
                      <?php else: ?>
                        <span style="color:var(--text-3); font-size:.78rem;">—</span>
                      <?php endif; ?>
                    </td>
                    <td>
                      <form method="post" class="inline-form" onsubmit="return confirm('Delete this submission permanently?');">
                        <input type="hidden" name="csrf"          value="<?= escapeHtml($csrf) ?>" />
                        <input type="hidden" name="action"        value="delete_submission" />
                        <input type="hidden" name="submission_id" value="<?= escapeHtml($sub['id']) ?>" />
                        <button type="submit" class="btn btn-sm btn-danger">Delete</button>
                      </form>
                    </td>
                  </tr>
                <?php endforeach; ?>
              </tbody>
            </table>
          </div>
        <?php else: ?>
          <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            <p>No submissions yet. Contact, FOI, and SERVICOM forms will appear here.</p>
          </div>
        <?php endif; ?>
      </div>
    </section>

    <!-- ─────────────── SETTINGS ─────────────── -->
    <section class="admin-section" id="settings">
      <div class="admin-header">
        <div class="admin-header-text">
          <h1>Site settings.</h1>
          <p>Global metadata and hero copy shown across the public website.</p>
        </div>
      </div>

      <div class="settings-grid">
        <!-- Ministry identity -->
        <div class="settings-card">
          <h4>Ministry identity</h4>
          <p class="card-desc">Names and labels used in the site header, footer and metadata.</p>
          <form method="post">
            <input type="hidden" name="csrf" value="<?= escapeHtml($csrf) ?>" />
            <input type="hidden" name="action" value="save_settings" />
            <div style="margin-bottom:14px;">
              <label>
                Ministry name
                <input type="text" name="ministry_name" value="<?= escapeHtml($settings['ministry_name']) ?>" />
              </label>
            </div>
            <div style="margin-bottom:14px;">
              <label>
                Country line
                <input type="text" name="country" value="<?= escapeHtml($settings['country']) ?>" />
              </label>
            </div>
            <div style="margin-bottom:20px;">
              <label>
                Last reviewed (e.g. May 2026)
                <input type="text" name="last_reviewed" value="<?= escapeHtml($settings['last_reviewed']) ?>" placeholder="May 2026" />
                <span class="field-hint">Shown in the dashboard status panel</span>
              </label>
            </div>
            <button type="submit" class="btn btn-green btn-sm">Save identity</button>
          </form>
        </div>

        <!-- Hero section copy -->
        <div class="settings-card">
          <h4>Homepage hero copy</h4>
          <p class="card-desc">The eyebrow label, main headline and body text in the hero section.</p>
          <form method="post">
            <input type="hidden" name="csrf" value="<?= escapeHtml($csrf) ?>" />
            <input type="hidden" name="action" value="save_hero_text" />
            <div style="margin-bottom:14px;">
              <label>
                Eyebrow label
                <input type="text" name="hero_eyebrow" value="<?= escapeHtml($settings['hero_eyebrow']) ?>" placeholder="Federal Republic of Nigeria" />
              </label>
            </div>
            <div style="margin-bottom:14px;">
              <label>
                Headline
                <input type="text" name="hero_headline" value="<?= escapeHtml($settings['hero_headline']) ?>" placeholder="Defending the sovereignty of Nigeria." />
              </label>
            </div>
            <div style="margin-bottom:20px;">
              <label>
                Body text
                <textarea name="hero_body" rows="4"><?= escapeHtml($settings['hero_body']) ?></textarea>
              </label>
            </div>
            <button type="submit" class="btn btn-green btn-sm">Save hero copy</button>
          </form>
        </div>
      </div>
    </section>

  </main><!-- /admin-main -->
</div><!-- /admin-shell -->

<!-- ═══════════════════════ MODAL ═══════════════════════ -->
<div class="admin-modal" id="admin-modal" aria-hidden="true" role="dialog" aria-modal="true">
  <div class="admin-modal-backdrop" id="admin-modal-backdrop" data-modal-close></div>
  <div class="admin-modal-dialog">
    <div class="admin-modal-header">
      <h2 id="admin-modal-title">Edit item</h2>
      <button type="button" class="modal-close" id="admin-modal-close" aria-label="Close">×</button>
    </div>
    <div class="admin-modal-body" id="admin-modal-body"></div>
  </div>
</div>

<script>
(function () {
  /* ── Clock ── */
  const clockEl = document.getElementById('topbar-clock');
  function tick() {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) +
      ' · ' + now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  tick(); setInterval(tick, 1000);

  /* ── Section nav ── */
  const sections   = Array.from(document.querySelectorAll('.admin-section'));
  const navButtons = Array.from(document.querySelectorAll('.admin-nav-btn'));
  const bcCurrent  = document.getElementById('topbar-current');
  const defaultSec = 'dashboard';

  const sectionLabels = {
    dashboard: 'Dashboard', slides: 'Hero & Slider', press: 'Press Releases',
    leadership: 'Leadership', subscribers: 'Newsletter', submissions: 'Form Submissions',
    settings: 'Site Settings'
  };

  /* ── Submissions tab filter ── */
  window.filterSubmissions = function (type) {
    const rows = document.querySelectorAll('#submissions-table tbody tr');
    rows.forEach(function (row) {
      const rowType = row.dataset.formType || '';
      row.style.display = (type === 'all' || rowType === type) ? '' : 'none';
    });
    // Update active tab button styling
    ['all', 'contact', 'foi', 'servicom'].forEach(function (t) {
      const btn = document.getElementById('sub-tab-' + t);
      if (!btn) return;
      if (t === type) {
        btn.classList.replace('btn-outline', 'btn-green');
      } else {
        btn.classList.replace('btn-green', 'btn-outline');
      }
    });
  };

  function getRequestedSection() {
    const h = location.hash.replace('#', '');
    if (h) return h;
    const p = new URLSearchParams(location.search);
    if (p.has('edit_slide'))  return 'slides';
    if (p.has('edit_press'))  return 'press';
    if (p.has('edit_leader')) return 'leadership';
    return defaultSec;
  }

  function activateSection(sectionId) {
    const id = sectionId || defaultSec;
    sections.forEach(s => s.classList.toggle('active', s.id === id));
    navButtons.forEach(b => {
      const t = b.getAttribute('href').replace('#', '');
      b.classList.toggle('active', t === id);
    });
    if (bcCurrent) bcCurrent.textContent = sectionLabels[id] || id;
  }

  /* ── Sidebar toggle ── */
  const toggleBtn  = document.querySelector('.sidebar-toggle');
  const adminShell = document.getElementById('admin-shell');
  const backdrop   = document.getElementById('sidebar-backdrop');

  function setSidebarOpen(open) {
    adminShell.classList.toggle('sidebar-open', open);
    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', String(open));
    // Prevent body scroll when sidebar is open on mobile
    if (open && window.innerWidth <= 1100) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => setSidebarOpen(!adminShell.classList.contains('sidebar-open')));
  }

  // Close sidebar when clicking outside (on backdrop)
  if (backdrop) {
    backdrop.addEventListener('click', () => setSidebarOpen(false));
  }

  // Close sidebar when clicking a nav button
  navButtons.forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const id = btn.getAttribute('href').replace('#', '') || defaultSec;
      history.pushState(null, '', '#' + id);
      activateSection(id);
      if (window.innerWidth <= 1100) setSidebarOpen(false);
    });
  });

  // Close sidebar on window resize if needed
  window.addEventListener('resize', () => {
    if (window.innerWidth > 1100) {
      setSidebarOpen(false);
    }
  });

  /* ── Modal ── */
  function getEditQueryType() {
    const p = new URLSearchParams(location.search);
    if (p.has('edit_slide'))  return 'slide';
    if (p.has('edit_press'))  return 'press';
    if (p.has('edit_leader')) return 'leadership';
    return null;
  }

  function openEditModal(editType) {
    const src = document.getElementById(`${editType}-edit-panel`);
    if (!src) return;
    const clone = src.cloneNode(true);
    clone.removeAttribute('id'); clone.style.display = 'block';
    const body  = document.getElementById('admin-modal-body');
    const title = document.getElementById('admin-modal-title');
    body.innerHTML = ''; body.appendChild(clone);
    title.textContent = clone.querySelector('h3')?.textContent || 'Edit';
    const modal = document.getElementById('admin-modal');
    modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeEditModal() {
    const modal = document.getElementById('admin-modal');
    modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true');
    document.getElementById('admin-modal-body').innerHTML = '';
    document.body.style.overflow = '';
    if (location.search) {
      const url = new URL(window.location.href);
      url.search = ''; history.replaceState(null, '', url.pathname + url.hash);
    }
  }

  document.querySelectorAll('[data-open-edit-modal]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const type = btn.dataset.openEditModal;
      const secMap = { slide: 'slides', press: 'press', leadership: 'leadership' };
      if (secMap[type]) { history.pushState(null, '', '#' + secMap[type]); activateSection(secMap[type]); }
      openEditModal(type);
    });
  });

  document.getElementById('admin-modal-backdrop')?.addEventListener('click', closeEditModal);
  document.getElementById('admin-modal-close')?.addEventListener('click', closeEditModal);
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && document.getElementById('admin-modal').classList.contains('open')) closeEditModal();
  });

  function maybeOpenEditModal() {
    const type = getEditQueryType();
    if (type) {
      const secMap = { slide: 'slides', press: 'press', leadership: 'leadership' };
      activateSection(secMap[type]);
      openEditModal(type);
    }
  }

  window.addEventListener('hashchange', () => {
    activateSection(location.hash.replace('#', '') || defaultSec);
    maybeOpenEditModal();
  });

  activateSection(getRequestedSection());
  maybeOpenEditModal();
})();
</script>
</body>
</html>
