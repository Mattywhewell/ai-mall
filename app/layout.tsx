import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { MainNavigation } from '@/components/MainNavigation';
import TestUserSSR from '@/components/TestUserSSR';

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

        {/* Client-side router + prefetch instrumentation for CI (gated by NEXT_PUBLIC_CI_ROUTER_LOGS=1) */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            try{
              var CI = '${process.env.NEXT_PUBLIC_CI_ROUTER_LOGS || ''}' === '1';
              if(!CI) return;

              window.__ciPrefetchEvents = window.__ciPrefetchEvents || [];
              function log(){
                try{
                  var args = Array.prototype.slice.call(arguments);
                  console.log('[CI-RTR]', args.join(' '));
                  window.__ciPrefetchEvents.push({ts:new Date().toISOString(), args: args});
                }catch(e){console.warn('[CI-RTR] log error', e)}
              }

              // Wrap fetch to detect RSC/prefetch requests and aborts
              var _fetch = window.fetch;
              window.fetch = function(input, init){
                try{
                  var url = typeof input === 'string' ? input : (input && input.url) || '';
                  var method = (init && init.method) || (input && input.method) || 'GET';
                  var headers = new Headers((init && init.headers) || (input && input.headers) || {});
                  var isPrefetch = headers.has && headers.has('next-router-prefetch') || (url && url.indexOf('_rsc=') !== -1);
                  if(isPrefetch){ log('prefetch-start', method, url, headers.get && headers.get('next-router-prefetch')); }

                  return _fetch.apply(this, arguments).catch(function(err){
                    try{
                      var isAbort = (err && (err.name === 'AbortError' || (err.message && err.message.toLowerCase().indexOf('abort') !== -1)));
                      if(isPrefetch && isAbort){ log('prefetch-cancel', method, url, err && err.name || err); }
                    }catch(e){ console.warn('[CI-RTR] fetch catch log error', e); }
                    throw err;
                  });
                }catch(e){ return _fetch.apply(this, arguments); }
              };

              // Instrument history API to observe client navigations
              function wrapHistory(name){
                try{
                  var orig = history[name];
                  history[name] = function(state, title, url){
                    try{ log('route-' + name, url); }catch(e){}
                    return orig.apply(this, arguments);
                  };
                }catch(e){ console.warn('[CI-RTR] history wrap failed', e); }
              }
              wrapHistory('pushState');
              wrapHistory('replaceState');

              window.addEventListener('popstate', function(){ log('popstate', location.pathname + location.search); });
              document.addEventListener('visibilitychange', function(){ log('visibility', document.visibilityState); });
              window.addEventListener('load', function(){ log('load', location.href); });
              document.addEventListener('DOMContentLoaded', function(){ log('domcontentloaded', location.href); });

              // Expose a quick helper to flush events if needed
              window.__flushCIPrefetchEvents = function(){
                try{ console.log('[CI-RTR] flush', JSON.stringify(window.__ciPrefetchEvents || [])); }catch(e){}
              };

              log('CI-RTR instrumentation active');

            }catch(e){ console.warn('[CI-RTR] instrumentation error', e); }
          })();
        `}} />
      </head>
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <AuthProvider>
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

          {/* Server-side test user marker (used by E2E to detect server-rendered test user state) */}
          {/* Rendered only when middleware sets the short-lived test_user cookie */}
          <TestUserSSR />
          <MainNavigation />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
