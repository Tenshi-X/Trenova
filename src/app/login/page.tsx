// Server Component — route segment config works here (not in 'use client' files)
// force-dynamic ensures Netlify always renders fresh HTML via Edge Function,
// preventing CDN from serving stale HTML with outdated JS/CSS chunk hashes.
export const dynamic = 'force-dynamic';

import LoginClient from './LoginClient';

export default function LoginPage() {
  return <LoginClient />;
}
