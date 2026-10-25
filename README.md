# Buddhi Dilshan — portfolio

Astro static site with a responsive landing page, project pages and a Markdown blog. The existing Vercel deployment configuration is preserved.

## Run and build

```sh
npm install
npm run dev
npm run build
npm run preview
```

- `/`: landing page, service selection, projects and recent field notes.
- `/projects/<id>/`: a shareable overview for each project.
- `/blog/`: all published articles, text search and topic filters.
- `/blog/<filename>/`: article, table of contents and comments.
- `/portfolio/`: the original tabbed portfolio, retained and linked.

## Add a completed project

Edit `src/data/projects.json` and append an item using the existing structure. Use a unique, URL-safe `id`, a display `number`, `kind`, an icon name from `src/components/Icon.astro`, `name`, `summary` and `tags`. The homepage, original portfolio and individual project route update on the next build.

Use real project descriptions and only publish details you can share. Existing project descriptions were retained; the new overview pages do not invent client names, results or performance metrics.

## Publish a blog post

1. Copy `src/content/blog/_post-template.md` to a descriptive filename, for example `my-first-flow.md`.
2. Fill in its title, description, date and estimated reading time.
3. Choose `Power Apps`, `Power Automate`, `Copilot agents` or `Other`.
4. Write the article in Markdown. Level-two headings become table-of-contents links.
5. Preview the article, then set `draft: false` and rebuild/deploy.

Drafts are excluded from both listings and generated article routes. The date is display/sort metadata, not a scheduling mechanism. To add a category, update both the schema in `src/content.config.ts` and the category list in `src/components/BlogListing.astro`.

Three starter articles are included as publishable examples in this local build. Review their wording before publishing under your name. The template stays a draft.

For article images, put files in `public/assets/` and reference them in Markdown with meaningful alt text. Article styles keep images within the content column and preserve their proportions.

Publishing is file-based; there is no browser administration dashboard.

## Enable public comments

Comments use [Giscus](https://giscus.app), backed by GitHub Discussions. Readers can view comments; posting requires a GitHub account. Moderation happens in GitHub.

1. Choose a public GitHub repository, enable Discussions, and install the Giscus app on it.
2. Use the configuration form at Giscus to select that repository and a discussion category (an Announcements category is recommended by Giscus).
3. Copy `.env.example` to `.env` and fill all four `PUBLIC_GISCUS_*` values from the generated configuration. These are public identifiers, not access tokens.
4. Add the same values to your Vercel project environment and rebuild.
5. Test a real comment on a published article and confirm it appears in the correct GitHub discussion.

Comments map to article pathnames, so keep published filenames stable. No comment is simulated or saved only in a visitor's browser. Until configured, articles clearly say that comments are not open. A GitHub discussion link remains available if the widget fails to load.

## Personal details and contact

- `src/data/hero.json`: landing copy, navigation, service options and feature buttons.
- `src/data/site.json`: personal details and direct contact links.
- `src/data/experience.json`: work history.
- `src/data/qualifications.json`: education and certificates.

Unfilled education/certification entries and the previous-role template have `draft: true`. Fill them with verified information and change that flag to false to display them. Dates containing `20XX` are hidden. Placeholder email/social links are excluded.

Contact forms **copy or save an enquiry; they do not send email**. Add real contact links in `site.json` before inviting enquiries. A server-side delivery provider would be a separate integration; no credentials or provider were assumed.

## Visual changes

The landing page retains the white-and-sage visual direction. `src/styles/polish.css` fixes sizing, button specificity, mobile portrait framing, touch targets and navigation. `src/styles/blog.css` styles the blog and project overview pages.

On mobile/tablet, the original portrait uses a face-aware CSS crop and feature buttons sit below it. WebGL portrait rendering is skipped on initial mobile or reduced-motion loads. Desktop retains the interactive portrait with a pause control. Scroll reveals and subtle hover effects respect reduced motion, and essential headline/project content remains visible without JavaScript.

## Validation and deployment

See `REVIEW.md` for checks and known setup requirements. Local screenshots and browser results are in the ignored `qa/` directory.

`npm run build` generates `dist/`. The existing repository instructions specify Vercel deployments on pushes to main. This review made local changes only: no push or deployment was performed.
