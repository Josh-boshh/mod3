-- Admin backend schema for FMOD website (PostgreSQL)
-- Apply via: psql $DATABASE_URL -f admin/schema.sql

CREATE TABLE IF NOT EXISTS mod_admin_users (
    id            SERIAL       PRIMARY KEY,
    email         VARCHAR(191) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mod_settings (
    name  VARCHAR(191) NOT NULL PRIMARY KEY,
    value TEXT         NOT NULL
);

CREATE TABLE IF NOT EXISTS mod_hero_slides (
    id           SERIAL       PRIMARY KEY,
    image_url    VARCHAR(255) NOT NULL,
    alt_text     VARCHAR(255) NOT NULL,
    role_text    VARCHAR(255) NOT NULL,
    caption_text TEXT         NOT NULL,
    sort_order   INT          NOT NULL DEFAULT 0,
    active       SMALLINT     NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS mod_leaders (
    id           SERIAL       PRIMARY KEY,
    position_key VARCHAR(64)  NOT NULL,
    title        VARCHAR(255) NOT NULL,
    name         VARCHAR(255) NOT NULL,
    bio          TEXT         NOT NULL,
    photo_url    VARCHAR(255) NOT NULL,
    profile_link VARCHAR(255) NOT NULL,
    sort_order   INT          NOT NULL DEFAULT 0,
    active       SMALLINT     NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS mod_press_items (
    id           SERIAL       PRIMARY KEY,
    title        VARCHAR(255) NOT NULL,
    excerpt      TEXT         NOT NULL,
    category     VARCHAR(127) NOT NULL,
    published_at DATE         NOT NULL,
    image_url    VARCHAR(255) NOT NULL,
    link_url     VARCHAR(255) NOT NULL,
    slug         VARCHAR(255) NOT NULL,
    sort_order   INT          NOT NULL DEFAULT 0,
    active       SMALLINT     NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS mod_subscribers (
    id            SERIAL       PRIMARY KEY,
    email         VARCHAR(191) NOT NULL UNIQUE,
    subscribed_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mod_submissions (
    id           SERIAL       PRIMARY KEY,
    form_type    VARCHAR(32)  NOT NULL,
    name         VARCHAR(255) NOT NULL,
    email        VARCHAR(191) NOT NULL,
    subject      VARCHAR(255) NOT NULL DEFAULT '',
    meta         JSONB,
    submitted_at TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sub_form_type    ON mod_submissions (form_type);
CREATE INDEX IF NOT EXISTS idx_sub_submitted_at ON mod_submissions (submitted_at);

CREATE TABLE IF NOT EXISTS mod_rate_limits (
    id           SERIAL      PRIMARY KEY,
    ip_hash      VARCHAR(64) NOT NULL,
    endpoint     VARCHAR(32) NOT NULL,
    hits         INT         NOT NULL DEFAULT 1,
    window_start TIMESTAMP   NOT NULL DEFAULT NOW(),
    UNIQUE (ip_hash, endpoint)
);
CREATE INDEX IF NOT EXISTS idx_rate_window ON mod_rate_limits (window_start);

CREATE TABLE IF NOT EXISTS mod_spam_log (
    id         SERIAL      PRIMARY KEY,
    ip_hash    VARCHAR(64) NOT NULL,
    endpoint   VARCHAR(32) NOT NULL,
    reason     VARCHAR(64) NOT NULL,
    created_at TIMESTAMP   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_spam_ip ON mod_spam_log (ip_hash);
CREATE INDEX IF NOT EXISTS idx_spam_at ON mod_spam_log (created_at);
