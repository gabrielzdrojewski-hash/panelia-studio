import type { APIRoute } from 'astro';
import { site } from '../data/site';
import { projects } from '../data/projects';

// Ręcznie utrzymywana mapa strony — bez dodatkowych zależności.
// Uwzględniamy wyłącznie strony przeznaczone do indeksowania
// (pomijamy 404 oraz politykę prywatności oznaczoną jako noindex).
const routes = [
  { path: '/', priority: '1.0', changefreq: 'monthly' },
  { path: '/wycena', priority: '0.9', changefreq: 'monthly' },
  { path: '/o-nas', priority: '0.7', changefreq: 'yearly' },
  { path: '/oferta', priority: '0.8', changefreq: 'monthly' },
  { path: '/pakiety', priority: '0.8', changefreq: 'monthly' },
  { path: '/realizacje', priority: '0.8', changefreq: 'monthly' },
  // Podstrony poszczególnych realizacji (katalog).
  ...projects.map((project) => ({
    path: `/realizacje/${project.slug}`,
    priority: '0.7',
    changefreq: 'monthly',
  })),
  { path: '/wizualizacje', priority: '0.7', changefreq: 'monthly' },
  { path: '/proces', priority: '0.6', changefreq: 'yearly' },
  { path: '/kontakt', priority: '0.7', changefreq: 'yearly' },
];

export const GET: APIRoute = () => {
  const urls = routes
    .map((route) => {
      const loc = new URL(route.path, site.url).href;
      return `  <url>\n    <loc>${loc}</loc>\n    <changefreq>${route.changefreq}</changefreq>\n    <priority>${route.priority}</priority>\n  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
