-- Admin backend schema for FMOD website
-- Generated from admin/setup.php

CREATE TABLE IF NOT EXISTS mod_admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(191) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mod_settings (
    name VARCHAR(191) NOT NULL PRIMARY KEY,
    value TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mod_hero_slides (
    id INT AUTO_INCREMENT PRIMARY KEY,
    image_url VARCHAR(255) NOT NULL,
    alt_text VARCHAR(255) NOT NULL,
    role_text VARCHAR(255) NOT NULL,
    caption_text TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    active TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mod_leaders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    position_key VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    bio TEXT NOT NULL,
    photo_url VARCHAR(255) NOT NULL,
    profile_link VARCHAR(255) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    active TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mod_press_items (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mod_subscribers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(191) NOT NULL UNIQUE,
    subscribed_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mod_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    form_type VARCHAR(32) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(191) NOT NULL,
    subject VARCHAR(255) NOT NULL DEFAULT '',
    meta JSON,
    submitted_at DATETIME NOT NULL,
    INDEX idx_form_type (form_type),
    INDEX idx_submitted_at (submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mod_gallery_images (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO mod_admin_users (email, password_hash, created_at) VALUES
    ('admin@example.com', '$2y$10$f9Jm9dyEDp3.0OKyjk/BRuni6r01k6XwAUTVjwgdhuSlxIaPGvjny', NOW());

INSERT IGNORE INTO mod_settings (name, value) VALUES
    ('hero_eyebrow', 'Federal Republic of Nigeria'),
    ('hero_headline', 'Defending the sovereignty of Nigeria.'),
    ('hero_body', 'The Federal Ministry of Defence — the apex policy authority overseeing the Nigerian Armed Forces — provides strategic leadership for a modern, professional, mission-ready military in the service of more than 220 million citizens of the Federal Republic.'),
    ('last_reviewed', 'May 2026'),
    ('ministry_name', 'Federal Ministry of Defence'),
    ('country', 'Federal Republic of Nigeria');

INSERT INTO mod_hero_slides (image_url, alt_text, role_text, caption_text, sort_order, active) VALUES
    ('assets/images/hero/slide-8.jpg', 'Nigerian Army soldiers on patrol vehicle in counter-terrorism operations', 'Nigerian Army', 'Counter-terrorism operations — Nigerian soldiers engaged in active theatre operations.', 0, 1),
    ('assets/images/hero/slide-2.jpg', 'Nigerian Navy special boat service operators on patrol in the Gulf of Guinea', 'Nigerian Navy', 'Maritime special forces securing Nigeria''s territorial waters and the Gulf of Guinea.', 1, 1),
    ('assets/images/hero/slide-3.jpg', 'Nigerian Air Force Mi-35 attack helicopter NAF 530 in flight', 'Nigerian Air Force', 'NAF 530 on deployment — projecting air power in defence of Nigeria''s sovereign skies.', 2, 1),
    ('assets/images/hero/slide-4.jpg', 'Nigerian Army honour guard inspection in full ceremonial uniform', 'Nigerian Army', 'Precision and ceremony — the Nigerian Army honour guard stands ready in service of the nation.', 3, 1),
    ('assets/images/hero/slide-5.jpg', 'Nigerian Air Force fighter jets taxiing in formation on the runway', 'Nigerian Air Force', 'Strike aircraft lined up and ready — the Nigerian Air Force maintains constant operational readiness.', 4, 1),
    ('assets/images/hero/slide-6.jpg', 'Nigerian Air Force fighter jets lined up on the flight line with cockpits open', 'Nigerian Air Force', 'Fighter jets on the tarmac — air power standing by in the service of Nigeria''s national security.', 5, 1),
    ('assets/images/hero/slide-7.jpg', 'Nigerian Air Force fighter jet in flight above clouds, fully armed', 'Nigerian Air Force', 'Armed and airborne — Nigeria''s air combat capability ready to defend sovereign skies.', 6, 1),
    ('assets/images/hero/slide-1.jpg', 'Ship House — Federal Ministry of Defence headquarters, Abuja', 'Ship House, Abuja', 'Seat of Nigeria''s defence policy — home of the Federal Ministry of Defence.', 7, 1);

INSERT INTO mod_leaders (position_key, title, name, bio, photo_url, profile_link, sort_order, active) VALUES
    ('minister', 'Honourable Minister of Defence', 'General Christopher Gwabin Musa (rtd)', 'Leads the strategic modernisation of Nigeria''s defence architecture — anchored on the welfare of officers and ratings, indigenous defence-industrial capacity, and citizen-centred accountability.', 'assets/images/headshots/general-christopher-musa.jpeg', 'minister.html', 0, 1),
    ('ministerOfState', 'Honourable Minister of State', 'Dr. Bello M. Matawalle, MON', 'Supports the Honourable Minister on strategic, security-sector and welfare portfolios, with focus on community peace-building and counter-extremism programmes.', 'assets/images/headshots/dr-bello-matawalle.jpg', 'minister-of-state.html', 1, 1),
    ('permSec', 'Permanent Secretary', 'Permanent Secretary', 'Accounting and chief administrative officer; coordinates the departments, units and tri-service interface of the Ministry.', 'assets/images/headshots/permanent-secretary.jpeg', 'management.html', 2, 1);

INSERT INTO mod_press_items (title, excerpt, category, published_at, image_url, link_url, slug, sort_order, active) VALUES
    ('Defence Minister pledges to boost military healthcare, reduce medical tourism during AMCE visit', 'The Honourable Minister has pledged the Ministry''s commitment to strengthening military healthcare and reducing medical tourism, during a working visit to the African Medical Centre of Excellence in Abuja.', 'Press Office', '2026-05-11', 'https://defence.gov.ng/wp-content/uploads/slider/cache/5c91a2fb5a3c3d7d91aa26fb98ea005d/WhatsApp-Image-2026-05-08-at-09.51.56.jpg', 'https://defence.gov.ng/2026/05/11/defence-minister-pledges-to-boost-military-healthcare-reduce-medical-tourism-during-amce-visit/', 'defence-minister-pledges-amce', 0, 1),
    ('Defence Minister commends ICRC for humanitarian services in the country', 'The Honourable Minister of Defence commended the International Committee of the Red Cross for its humanitarian engagement across conflict-affected communities.', 'Press Office', '2026-05-08', 'https://defence.gov.ng/wp-content/uploads/slider/cache/7ed124706b9db62fa4aae0e8bdc44f70/WhatsApp-Image-2026-05-06-at-09.44.49.jpg', 'https://defence.gov.ng/2026/05/08/defence-minister-commends-icrc-for-humanitarian-services-in-the-country/', 'icrc-humanitarian', 1, 1),
    ('Defence Minister participates in regional security meeting', 'The Honourable Minister reaffirmed Nigeria''s commitment to regional cooperation and collective security during a high-level consultation with West African counterparts.', 'Press Office', '2026-05-06', 'https://defence.gov.ng/wp-content/uploads/slider/cache/f2ac3e9cb69b47524dec83e6268b40b1/WhatsApp-Image-2026-05-05-at-16.06.33.jpg', 'https://defence.gov.ng/2026/05/06/defence-minister-participates-in-regional-security-meeting/', 'regional-security-meeting', 2, 1),
    ('Defence Minister conferred with prestigious fellowship', 'The Honourable Minister was honoured with an honorary fellowship in recognition of his contributions to national security and defence reform.', 'Press Office', '2026-05-06', 'https://defence.gov.ng/wp-content/uploads/slider/cache/b64dada37ea1a198b4a6e0382f45f0c0/WhatsApp-Image-2026-05-05-at-04.41.488-1.jpg', 'https://defence.gov.ng/2026/05/06/defence-minister-conferred-with-prestigious-fellowship/', 'prestigious-fellowship', 3, 1),
    ('Gen. Musa urges Nigerian students to play active role in national security', 'Gen. Musa urged students and youth to take ownership of national security through civic responsibility and lawful conduct.', 'Press Office', '2026-05-05', 'https://defence.gov.ng/wp-content/uploads/slider/cache/7d5dab6eb3370ef45d22dfbeceb170b0/WhatsApp-Image-2026-05-05-at-04.41.4644.jpg', 'https://defence.gov.ng/2026/05/05/gen-musa-urges-nigerian-students-to-play-active-role-in-national-security/', 'musa-students-security', 4, 1),
    ('Hon. Minister receives Veritas University Political Science delegation', 'The Honourable Minister received a delegation from the Department of Political Science and Diplomacy of Veritas University at Ship House, Abuja.', 'Press Office', '2026-05-05', 'https://defence.gov.ng/wp-content/uploads/slider/cache/f2ac3e9cb69b47524dec83e6268b40b1/WhatsApp-Image-2026-05-05-at-16.06.33.jpg', 'https://defence.gov.ng/2026/05/05/the-honourable-minister-of-defence-general-christopher-gwabin-musa-ofrrtd-received-a-delegation-from-the-department-of-political-science-and-diplomacy-veritas-university/', 'veritas-university', 5, 1),
    ('Hon. Minister inaugurates three committees at Ship House', 'The Honourable Minister inaugurated three strategic committees at Ship House, Abuja, in furtherance of the Ministry''s reform agenda.', 'Press Office', '2026-04-30', 'https://defence.gov.ng/wp-content/uploads/slider/cache/de24e192a317d951778e07962e82686d/WhatsApp-Image-2026-04-29-at-21.34.414.jpg', 'https://defence.gov.ng/2026/04/30/the-honourable-minister-of-defence-general-christopher-gwabin-musa-rtd-inaugurated-three-committees-at-the-ministerys-conference-room-ship-house-abuja-on-wednesday-29-april-2026/', 'three-committees-inaugurated', 6, 1),
    ('Defence Ministry inaugurates strategic committees to strengthen national security and veterans welfare', 'The Ministry inaugurated strategic committees aimed at strengthening national security architecture and veterans welfare.', 'Press Office', '2026-04-30', 'https://defence.gov.ng/wp-content/uploads/slider/cache/39e7bd9f42f86e2e15e02a7a8e72b6bb/WhatsApp-Image-2026-04-29-at-21.34.426.jpg', 'https://defence.gov.ng/2026/04/30/defence-ministry-inaugurates-strategic-committees-to-strengthen-national-security-and-veterans-welfare/', 'strategic-committees-security-veterans', 7, 1);
