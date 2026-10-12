import type { MetadataRoute } from 'next';
import { ROOMS } from '@/data/hotelData';

const siteUrl = 'https://grandaddishotel.et';

const publicRoutes = [
  '/',
  '/about-us',
  '/rooms',
  '/our-rooms',
  '/rooms-gridview',
  '/rooms-listview',
  '/rooms-gallery',
  '/rooms-reservation',
  '/book-now',
  '/experiences',
  '/gallery',
  '/contact',
  '/testimonials',
  '/terms-conditions',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = publicRoutes.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '/' ? 'weekly' : 'monthly',
    priority: path === '/' ? 1 : 0.7,
  }));

  const roomRoutes: MetadataRoute.Sitemap = ROOMS.map((room) => ({
    url: `${siteUrl}/rooms/${room.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...staticRoutes, ...roomRoutes];
}
