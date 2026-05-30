# SSL Certificate Setup — Federal Ministry of Defence Website

This guide covers everything needed to get a valid SSL certificate and
enforce HTTPS on the live server. Two paths are provided: **Let's Encrypt**
(free, auto-renewing) and **Commercial CA** (paid, required by some government
procurement rules).

---

## What is already done in the codebase

The following are already in the site files — they activate automatically
once SSL is live:

| File | What it does |
|---|---|
| `.htaccess` | Redirects HTTP → HTTPS (Apache); sets HSTS, CSP, security headers |
| `nginx.conf` | NGINX equivalent of the above |
| `upgrade-insecure-requests` in CSP | Tells browsers to auto-upgrade any stray `http://` sub-resource |
| `Strict-Transport-Security` header | Locks visitors to HTTPS for 2 years after first visit |

---

## Path 1 — Let's Encrypt (Certbot) — Recommended

Free, automated, renews every 90 days without manual intervention.

### Prerequisites
- Ubuntu/Debian server with Apache or NGINX
- Domain `defence.gov.ng` pointing to the server's public IP (A record)
- Port 80 open in firewall (needed for ACME challenge during issuance)

### Install Certbot

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx   # for NGINX
# OR
sudo apt install certbot python3-certbot-apache  # for Apache
```

### Issue the certificate

**NGINX:**
```bash
sudo certbot --nginx -d defence.gov.ng -d www.defence.gov.ng
```

**Apache:**
```bash
sudo certbot --apache -d defence.gov.ng -d www.defence.gov.ng
```

Certbot will:
1. Prove domain ownership via an ACME HTTP-01 challenge on port 80
2. Issue a certificate signed by Let's Encrypt (trusted by all browsers)
3. Automatically edit your NGINX/Apache config to add the cert paths
4. Set up a cron job or systemd timer for automatic renewal

### Verify auto-renewal

```bash
sudo certbot renew --dry-run
```

### Certificate file locations (after issuance)

```
/etc/letsencrypt/live/defence.gov.ng/fullchain.pem   ← certificate chain
/etc/letsencrypt/live/defence.gov.ng/privkey.pem     ← private key
```

These paths are already referenced in `nginx.conf`.

---

## Path 2 — Commercial CA (DigiCert / Sectigo / GlobalSign)

Required if your ministry's procurement policy mandates a paid certificate
(common for .gov.ng domains). The process:

### Step 1 — Generate a CSR on the server

```bash
# Replace the fields with the ministry's real details
openssl req -new -newkey rsa:2048 -nodes \
  -keyout defence.gov.ng.key \
  -out    defence.gov.ng.csr \
  -subj "/C=NG/ST=FCT/L=Abuja/O=Federal Ministry of Defence/OU=ICT/CN=defence.gov.ng"
```

### Step 2 — Submit the CSR

Paste the contents of `defence.gov.ng.csr` into your CA's order form.
For a government domain you will need to provide:
- Proof of domain ownership (DNS TXT record or email to admin@defence.gov.ng)
- Official letter on ministry letterhead (some CAs require this for .gov domains)

### Step 3 — Install the certificate

The CA will return a `.crt` file and an intermediate bundle. Install them:

**NGINX:**
```bash
cat defence.gov.ng.crt intermediate.crt > fullchain.crt
# In nginx.conf:
#   ssl_certificate     /etc/ssl/defence.gov.ng/fullchain.crt;
#   ssl_certificate_key /etc/ssl/defence.gov.ng/defence.gov.ng.key;
```

**Apache:**
```bash
# In .htaccess or the VirtualHost block:
#   SSLCertificateFile    /etc/ssl/defence.gov.ng/defence.gov.ng.crt
#   SSLCertificateKeyFile /etc/ssl/defence.gov.ng/defence.gov.ng.key
#   SSLCertificateChainFile /etc/ssl/defence.gov.ng/intermediate.crt
```

---

## Post-installation checklist

After SSL is live, run through these checks:

- [ ] `https://defence.gov.ng` loads with a padlock in all major browsers
- [ ] `http://defence.gov.ng` redirects to HTTPS (301)
- [ ] `www.defence.gov.ng` redirects to `defence.gov.ng` (canonical)
- [ ] [SSL Labs test](https://www.ssllabs.com/ssltest/) scores **A** or **A+**
- [ ] [securityheaders.com](https://securityheaders.com) scores **A** or **A+**
- [ ] No mixed-content warnings in browser DevTools (Console tab)
- [ ] Admin panel (`/admin/`) accessible only over HTTPS
- [ ] HSTS header present: `Strict-Transport-Security: max-age=63072000`
- [ ] Submit `defence.gov.ng` to [hstspreload.org](https://hstspreload.org)
     after confirming SSL is stable (makes browsers refuse HTTP permanently)

---

## HSTS preload (do this last)

Once SSL has been stable for at least 30 days, add `; preload` to the HSTS
header in `.htaccess` / `nginx.conf`:

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

Then submit to **hstspreload.org**. This tells Chrome, Firefox, Safari and
Edge to hardcode `defence.gov.ng` as HTTPS-only — even for first-time visitors
who have never been to the site before.

---

## Renewal reminder

| Method | Renewal |
|---|---|
| Let's Encrypt | Automatic (Certbot cron/timer, every 60 days) |
| Commercial CA | Manual, typically every 1–2 years — set a calendar reminder 30 days before expiry |

Certificate expiry causes the browser to show a full-screen red warning to
all visitors. **Never let a government site's certificate expire.**
