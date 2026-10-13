# GIFM Traders Academy landing page

Fast, buildless HTML/CSS/JavaScript landing page. No npm dependencies or build step.

## Files
- `dist/index.html` — page copy, links and accessible enquiry/privacy dialogs.
- `dist/styles.css` — responsive design and reduced-motion support.
- `dist/app.js` — mobile menu, dialogs, form validation and WhatsApp handoff.
- `dist/assets/` — optimized WebP versions of the supplied logo and mentor artwork.

## Hosting
Upload the **contents of dist/** into your hosting document root (e.g. public_html). Keep assets, styles.css and app.js beside index.html. Open index.html locally for a simple preview, or run `python3 -m http.server 8000 --directory dist`.

## Editing
Edit copy and social/contact links in index.html. Design colors are CSS variables at the top of styles.css. The WhatsApp destination is in app.js (`917357114500`). Replace images while keeping their filenames, or update the HTML paths.

## Enquiry behavior
Every enquiry CTA opens the same dialog. It validates name and city and prepares a WhatsApp message. The visitor must send it themselves. This is an enquiry handoff, not confirmed registration. No lead database, payment integration, automatic messages or tracking scripts are configured.

## Content decisions
Adapted from the uploaded landing-page brief, supplied brand assets, and https://www.gifmtraders.com/ (reviewed 13 October 2026). Mentor name and trader/trainer designation are on the supplied image. Founder/mentor role was provided in the request. Contact email normalized to contact@gifmtraders.com, matching the current website.

Event dates, countdowns, fees, seat scarcity, testimonials, bonuses and numerical outcomes were not added without confirmed information. Batch details should be checked with the academy before public launch. No invented testimonials or performance claims are included.

## Verification
JavaScript syntax, HTML resource paths, local anchors and file sizes checked. Browser/device visual QA could not be performed in this environment. Before public launch, verify layout, keyboard navigation and the WhatsApp handoff on your target devices. This preview does not replace the existing gifmtraders.com website.
