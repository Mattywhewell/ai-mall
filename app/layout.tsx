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
  searchParams,
}: {
  children: React.ReactNode;
  // Accept searchParams so we can pass test_user through for deterministic SSR during tests
  searchParams?: { [key: string]: string | undefined };
}) {
  // If tests pass ?test_user and ?role in the URL, surface that as an initial user for the client AuthProvider
  const initialUser = typeof searchParams !== 'undefined' && searchParams?.test_user === 'true' && searchParams?.role
    ? { role: searchParams.role }
    : undefined;

  return (
    <html lang="en" {...(initialUser ? { ['data-test-user-role']: initialUser.role } : {})}>
      <head>
        {/* Very early error capture script to catch errors before other client scripts execute */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            window.__clientErrors = window.__clientErrors || [];
            window.addEventListener('error', function(e){
              try{
                console.error('GlobalError', e.message, e.filename, e.lineno, e.colno, e.error && e.error.stack);
                window.__clientErrors.push({type:'error', message:e.message, filename:e.filename, lineno:e.lineno, colno:e.colno, stack: e.error && e.error.stack});
              }catch(err){console.error('Error capturing error', err)}
            });
            window.addEventListener('unhandledrejection', function(e){
              try{
                console.error('UnhandledRejection', e.reason && (e.reason.stack || e.reason));
                window.__clientErrors.push({type:'unhandledrejection', reason: e.reason && (e.reason.stack || e.reason)});
              }catch(err){console.error('Error capturing rejection', err)}
            });
          })();
        `}} />
      </head>
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        {/* E2E test helper: inject a small script on initial HTML so test runner can observe test_user role synchronously */}
        <script dangerouslySetInnerHTML={{ __html: "try{const p=new URLSearchParams(location.search);if(p.get('test_user')==='true'){document.documentElement.setAttribute('data-test-user-role', p.get('role')||'citizen')}}catch(e){}" }} />

        <AuthProvider initialUser={initialUser}>
          {/* Early client-side error capture for diagnostics */}
          <script dangerouslySetInnerHTML={{ __html: `
            (function(){
              window.__clientErrors = window.__clientErrors || [];
              window.addEventListener('error', function(e){
                try{
                  console.error('GlobalError', e.message, e.filename, e.lineno, e.colno, e.error && e.error.stack);
                  window.__clientErrors.push({type:'error', message:e.message, filename:e.filename, lineno:e.lineno, colno:e.colno, stack: e.error && e.error.stack});
                }catch(err){console.error('Error capturing error', err)}
              });
              window.addEventListener('unhandledrejection', function(e){
                try{
                  console.error('UnhandledRejection', e.reason && (e.reason.stack || e.reason));
                  window.__clientErrors.push({type:'unhandledrejection', reason: e.reason && (e.reason.stack || e.reason)});
                }catch(err){console.error('Error capturing rejection', err)}
              });
            })();
          `}} />

          {/* Site-wide navigation */}
          <MainNavigation />

          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
