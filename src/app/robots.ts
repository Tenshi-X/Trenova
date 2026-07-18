import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/'], // Protect private routes from indexing
    },
    sitemap: 'https://trenova.my.id/sitemap.xml',
  };
}
