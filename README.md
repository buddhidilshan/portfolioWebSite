# Buddhi Dilshan — Personal Portfolio

A single-page personal portfolio built with [Astro](https://astro.build).
Static output, no UI framework, plain CSS.

## Running it

```bash
npm install      # once
npm run dev      # http://localhost:4321
```

Other commands:

```bash
npm run build    # static site into dist/
npm run preview  # serve the built dist/ locally
```

## Structure

```
src/
  pages/index.astro       the screen — assembles the six panels
  layouts/Base.astro      <head>, header and footer; exists once
  components/             one file per repeated UI piece
  data/                   all site content as JSON
  styles/                 theme tokens + one stylesheet per area
  scripts/tabs.js         tab switching, hash routing, keyboard nav
public/assets/            images, icons, CV — served as-is
```

## Changing content

**Edit the JSON in `src/data/`, not the markup.**

| File                  | Controls                                        |
| --------------------- | ----------------------------------------------- |
| `site.json`           | name, bio, hero facts, tab labels, contact links |
| `qualifications.json` | education entries and certifications             |
| `experience.json`     | jobs — each entry renders one card               |
| `skills.json`         | skill clusters and their chips                   |
| `projects.json`       | project cards                                    |

Adding a job means appending an object to `experience.json`. The markup
loops over the data, so nothing else changes.

## Changing the look

`src/styles/tokens.css` holds the palette, fonts and spacing as CSS custom
properties — change the theme in one place. Everything else in
`src/styles/` is scoped to one area of the page (`tabnav.css`, `home.css`,
`experience.css`, and so on) and is pulled together by `index.css`, which
is imported once in `Base.astro`.

`responsive.css` stays last in that import list, since it overrides
earlier rules.

## Still needs your content

Search `src/data/` for `20XX` and `you@example.com`:

1. `qualifications.json` — real degrees, dates, institutions, certifications
2. `experience.json` — job titles, employer, dates
3. `site.json` — the email address and profile links you want public
4. `projects.json` — confirm what's OK to publish about work projects

## Deployment

Pushes to `main` deploy automatically to Vercel.

In Vercel, set **Settings → General → Framework Preset** to **Astro**.
Build command `npm run build` and output directory `dist` are then filled
in automatically.

Pushing any other branch gives a preview URL for that branch without
touching the live site.
