# Portfolio review — 25 October 2026

## Changes

- Fixed missing global border-box sizing on the homepage and button reset specificity that removed pill borders/backgrounds and contact button styling.
- Added persistent navigation, a Blog link, accessible mobile menu state, keyboard containment, Escape handling and dialog focus return.
- Connected the project section's contact button to the contact dialog.
- Reframed the mobile portrait without modifying the source asset; moved overlapping feature buttons into a responsive row.
- Avoided mobile WebGL startup, exposed the desktop motion control, and retained reduced-motion support.
- Restored headline/project visibility when JavaScript is unavailable.
- Added four project overview routes using the existing project data.
- Added a searchable Markdown blog with category filters, three starter articles, a draft template, article contents navigation and Giscus integration.
- Replaced the old portfolio form's false delivery confirmation with a copy-enquiry action.
- Hid unfinished credential/previous-role templates and placeholder contact links.
- Added page metadata, a favicon, footer links and publishing instructions.

## Verified

- Production build succeeds and generates 10 pages.
- Headless Chrome checked 20 page/viewport combinations: homepage at 320, 375, 390, 600, 768, 1024, 1280 and 1440 pixels; blog listing, article, project page and original portfolio at 320, 768 and 1440 pixels.
- No horizontal document overflow in those checks.
- Mobile menu opening, closing with Escape, opening Skills, and opening Contact from the projects section passed.
- Service selection and feedback passed.
- Blog topic filters, combined search, no-results state and reset passed.
- Reduced-motion behavior and no-JavaScript headline/project visibility passed.
- No JavaScript runtime exceptions in the successful browser run.
- Desktop and mobile screenshots were visually reviewed.

## Still requires owner input

- Giscus repository/category identifiers and GitHub app installation are needed for live comments. The unconfigured state was tested; a real comment could not be posted without that setup.
- Real contact details are still missing. Forms prepare an enquiry but do not deliver it.
- Confirm education/certifications, employment dates, existing work-history claims and the starter article wording before public deployment.
- New project pages use summaries already in the repository. Add approved screenshots, results or deeper case studies when available.
- No deployment was performed.

## Limits

The responsive checks use Chromium emulation, not physical iOS/Android hardware. External font availability and the configured Giscus service depend on their providers. No new runtime package dependencies were added.


- Final generated-output check: 139 local links resolved, and no template placeholders or draft article routes were exposed.

