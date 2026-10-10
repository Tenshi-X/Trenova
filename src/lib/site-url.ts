export function getSiteUrl(): string {
  const configured = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) {
    const url = new URL(configured);
    if (url.protocol === 'https:' || (process.env.NODE_ENV === 'development' && url.protocol === 'http:')) {
      return url.origin;
    }
  }
  return 'https://trenova.my.id';
}
