import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import projects from '../data/projects.json';
export const GET: APIRoute = async ({ site }) => {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  const paths = ['/', '/portfolio/', '/blog/', ...projects.items.map(p => '/projects/' + p.id + '/'), ...posts.map(p => '/blog/' + p.id + '/')];
  const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + paths.map(path => '<url><loc>' + escape(new URL(path, site).href) + '</loc></url>').join('') + '</urlset>', { headers: { 'Content-Type': 'application/xml' } });
};
