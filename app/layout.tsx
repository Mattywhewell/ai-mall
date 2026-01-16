import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { MainNavigation } from '@/components/MainNavigation';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Alverse - Conscious Commerce',
  description: 'Experience a living AI city where creators, AI citizens, and conscious commerce coexist',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        {/* E2E test helper: inject a small script on initial HTML so test runner can observe test_user role synchronously */}
        <script dangerouslySetInnerHTML={{ __html: "try{const p=new URLSearchParams(location.search);if(p.get('test_user')==='true'){document.documentElement.setAttribute('data-test-user-role', p.get('role')||'citizen')}}catch(e){}" }} />
        <AuthProvider>
          <MainNavigation />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
