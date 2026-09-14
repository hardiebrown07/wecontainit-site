# Contain-It: go-live runbook (same-host migration)

Nothing in this file has been executed. This is the staged plan.

## Why same-host (confirmed 2026-09-14)

- Host platform: 20i (`websiteservername.com` nameservers, StackCP-style panel, possibly via a reseller)
- **Email (info@wecontainit.co.uk) is hosted on the same server** (MX points at the domain itself).
  Staying on this host means DNS and email are never touched. A Vercel DNS move would risk email.
- WordPress admin, form submissions and WooCommerce data all stay on the server, untouched, in `/old/`.

## What is prepared

| Item | Location |
|---|---|
| Upload-ready static site (13 pages, assets, robots.txt, sitemap.xml, .htaccess) | `~/Documents/wecontainit-staging-bundle/` and `~/Documents/wecontainit-staging-bundle.zip` (18MB) |
| Apache `.htaccess` (15 × 301 redirects from old WP URLs, caching rules) | in the bundle; source of truth is `vercel.json` → regenerate, do not hand-edit |
| Full archive of the old live site | `~/Documents/wecontainit-old-site-backup/`: all 13 pages as HTML, all 55 original media files (11MB), raw page/post/product JSON, old robots.txt, sitemaps |

## What is NOT in the local archive (lives only in the server database)

- Elementor form submissions
- WooCommerce orders/customers
- WordPress users, settings, plugins

These are all preserved by the folder-move approach below (nothing is deleted). For a belt-and-braces
copy, take a full backup/snapshot in the hosting panel before the flip (20i/StackCP has one-click backup).

## Access needed before anything can be uploaded

1. Hosting panel login (StackCP / reseller panel) **or** FTP/SFTP credentials
2. Confirmation of which folder is the web root (usually `public_html/`)

## The flip (execution day: only on Hardie's word)

1. **Panel backup**: take a full site + database backup in the hosting panel. Verify it downloaded.
2. **Create `/old/`** inside the web root.
3. **Move ALL existing files** (WordPress core, wp-content, wp-config.php, existing .htaccess) into `/old/`.
   Nothing is deleted at any point.
4. **Upload the bundle** contents into the web root (13 HTML files, `assets/`, `robots.txt`, `sitemap.xml`, `.htaccess`).
5. **Keep wp-admin working** at `/old/wp-admin`: in `/old/wp-config.php` add
   `define('WP_SITEURL','https://wecontainit.co.uk/old');` and `define('WP_HOME','https://wecontainit.co.uk/old');`
6. **Block `/old/` from Google**: add to root `.htaccess`:
   `RedirectMatch 404 ^/old/(?!wp-admin|wp-login).*$` is too blunt: instead drop a `/old/robots-noindex` via
   an `X-Robots-Tag: noindex` header scoped to /old/ in the root .htaccess (exact lines to be added at execution).
7. **Verify** (before telling anyone):
   - Homepage + all 12 other pages load over https
   - All 15 old URLs 301 to the right new pages (`curl -I` each)
   - `info@wecontainit.co.uk` still receives mail (send a test)
   - `/old/wp-admin` reachable, form submissions/orders visible
   - Contact form delivers via Web3Forms
8. **Search Console**: submit new sitemap.xml.

## Rollback (minutes, no data loss)

Move the static files into `/new-parked/`, move everything from `/old/` back to the web root,
remove the wp-config defines. The old site is exactly as it was.

## DNS / email

**Untouched. Not part of this migration.** Do not change nameservers, A records or MX.
