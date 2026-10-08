Ahlan-Trips website — deploy package

Upload the CONTENTS of this folder to your host root (Cloudflare: wrangler.jsonc serves "." as static assets).

Clean URLs (Cloudflare serves about.html at /about automatically):
  /                   index.html
  /about              about.html
  /services           services.html
  /corporate-travel   corporate-travel.html
  /travel-management  travel-management.html
  /meetings-events    meetings-events.html
  /visa-assistance    visa-assistance.html
  /leisure-travel     leisure-travel.html
  /destinations       destinations.html
  /contact            contact.html
  /slides             slides.html  (Instagram bio funnel)

Shared components — keep these names and keep them in the root:
  SiteHeader.dc.html, SiteFooter.dc.html, SiteUtilities.dc.html,
  PageHero.dc.html, PageCTA.dc.html, AudienceFlip.dc.html

Runtime: support.js (required by every page), site-motion.js, calendar.js

Note: links use root paths (/about), so preview through a local web server
(e.g. "npx wrangler dev" or "npx serve .") rather than opening files directly.
