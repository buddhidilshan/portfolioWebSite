# Buddhi Dilshan — Personal Portfolio

A single-page personal portfolio site built with plain HTML, CSS and
JavaScript — no framework, no build step, no dependencies.

## Running it locally

Open `index.html` directly in a browser. That's it — nothing to install
or compile.

If you'd rather serve it over http (closer to how it behaves when
deployed), either use the VS Code **Live Server** extension, or run:

```bash
npx serve .
```

## Structure

```
index.html         Page markup and content (all sections live here)
css/styles.css     All styling, including responsive rules and the pill nav
js/main.js         Tab switching, hash routing, keyboard nav, contact form
assets/            Images, icons, and any other static files
```

## How the navigation works

- Each tab (`Home`, `Qualifications`, `Experience`, `Skills`, `Projects`,
  `Contact`) is a `role="tab"` button; each section is a `role="tabpanel"`.
- Selecting a tab updates `window.location.hash` (e.g. `#work`), so every
  section is linkable and the browser's back/forward buttons work.
- An accent "pill" behind the tabs slides to the active tab using a CSS
  transform transition, positioned in JavaScript from the tab's bounding box.
- All of this snaps instantly instead of animating when the visitor has
  `prefers-reduced-motion` set.

## What still needs your content

Search `index.html` for `TODO Buddhi` — there are four spots:

1. **Qualifications** — degrees, dates, institutions, real certifications.
2. **Experience** — job titles, employer name, dates, bullets.
3. **Projects** — these describe internal work in deliberately generic
   terms. Confirm what you're allowed to publish before it goes live.
4. **Contact** — the email address and profile links you want public.

## Design tokens

Colors, fonts and spacing are CSS custom properties at the top of
`css/styles.css` (`:root`), so the palette and type scale change in one
place.

## Deploying (free)

Any static host works. Two good options:

**Vercel** — push this folder to a GitHub repo, then import it at
vercel.com. Framework preset: **Other**. Build command: leave empty.
Output directory: `.` (the repo root). You get
`your-project.vercel.app` free, with automatic redeploys on every push.

**GitHub Pages** — push to GitHub, then Settings → Pages → deploy from
branch `main`, folder `/ (root)`. You get
`your-username.github.io/repo-name` free.

Neither needs a paid plan, and a custom domain can be added later to
either one without changing any code.
