import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'EasySLR - Article Review Workspace',
  description: 'A professional workspace for conducting Systematic Literature Reviews.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var b = document.body;
                  if (b) {
                    var attrs = b.attributes;
                    for (var i = attrs.length - 1; i >= 0; i--) {
                      var n = attrs[i].name;
                      if (n.startsWith('data-new-gr') || n.startsWith('data-gr-ext') || n === 'cz-shortcut-listen') {
                        b.removeAttribute(n);
                      }
                    }
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 h-full`} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
