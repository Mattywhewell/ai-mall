import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { MainNavigation } from '@/components/MainNavigation';
import { Footer } from '@/components/Footer';
import { AuthProvider } from '@/lib/auth/AuthContext';
import GoogleAnalytics from '@/lib/analytics/GoogleAnalytics';
import CookieConsent from '@/components/CookieConsent';
import { AIChatWidget } from '@/components/AIChatWidget';
import { OnboardingFlow } from '@/components/OnboardingFlow';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { LiveChatSupport } from '@/components/LiveChatSupport';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI-Native Mall - Conscious Commerce',
  description: 'Experience shopping with emotional intelligence and AI curators',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <AuthProvider>
          <GoogleAnalytics />
          <OnboardingFlow />
          <MainNavigation />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
          <CookieConsent />
          <AIChatWidget />
          <MobileBottomNav />
          <LiveChatSupport />
        </AuthProvider>
      </body>
    </html>
  );
}
