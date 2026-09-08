import type { Metadata } from 'next';
import { Bangers, DM_Sans, DM_Mono } from 'next/font/google';
import './globals.css';
const bodyFont = DM_Sans({ variable: '--font-body', subsets: ['latin'] });
const titleFont = Bangers({
  variable: '--font-title',
  subsets: ['latin'],
  weight: '400',
});
const codeFont = DM_Mono({
  variable: '--font-code',
  subsets: ['latin'],
  weight: '400',
});
export const metadata: Metadata = {
  title: 'Confidence Workshop',
  icons: { icon: '/favicon.svg' },
  description:
    'Choose an everyday action, build momentum and seal a pact with your manga tanuki guardian, and return with an honest account of your attempt.',
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${bodyFont.variable} ${titleFont.variable} ${codeFont.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
