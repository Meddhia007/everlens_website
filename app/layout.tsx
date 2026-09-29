import type { Metadata, Viewport } from 'next';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://everlensweddings.com';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#0F1413',
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'EverLens Weddings | Archival Wedding Photography & Cinematography',
    template: '%s | EverLens Weddings',
  },
  description:
    'Modern editorial wedding photography and cinematic film commissions. Documented like art, preserved for generations.',
  keywords: [
    'Wedding Photography',
    'Cinematic Wedding Film',
    'EverLens Weddings',
    'Carthage Wedding',
    'Sidi Bou Said Wedding',
    'Destination Wedding Photographer',
    'Archival Wedding Collection',
  ],
  authors: [{ name: 'EverLens Weddings' }],
  creator: 'EverLens Weddings',
  publisher: 'EverLens Weddings',
  openGraph: {
    title: 'EverLens Weddings | Archival Wedding Photography & Cinematography',
    description:
      'Modern editorial wedding photography and cinematic film commissions. Documented like art, preserved for generations.',
    url: siteUrl,
    siteName: 'EverLens Weddings',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EverLens Weddings | Archival Wedding Photography & Cinematography',
    description:
      'Modern editorial wedding photography and cinematic film commissions. Documented like art, preserved for generations.',
  },
  icons: {
    icon: [
      { url: '/logo.png', type: 'image/png' },
      { url: '/icon', type: 'image/png', sizes: '32x32' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/logo.png', type: 'image/png' },
      { url: '/apple-icon', type: 'image/png', sizes: '180x180' },
    ],
  },

};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Caveat:wght@500;600;700&family=Manrope:wght@300;400;500;600;700&family=Yellowtail&family=Beau+Rivage&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#0F1413] text-[#EAE8DA] font-sans min-h-screen antialiased selection:bg-[#43B19F] selection:text-[#0F1413]">
        <div className="grain" aria-hidden="true" />
        {children}
      </body>

    </html>
  );
}
