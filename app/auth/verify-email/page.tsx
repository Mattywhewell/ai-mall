/**
 * Email Verification Page
 * Server wrapper that renders client component with Suspense to avoid prerender issues
 */

export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import VerifyEmailClient from './VerifyEmailClient';

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <VerifyEmailClient />
    </Suspense>
  );
}

