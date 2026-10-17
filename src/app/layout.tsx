import type { Metadata } from 'next';
import { Jost, Playfair_Display } from 'next/font/google';
import './globals.css';
import { BookingProvider } from '@/context/BookingContext';
import { CurrencyProvider } from '@/context/CurrencyContext';
import Header from '@/components/Header';
import NavDrawer from '@/components/NavDrawer';
import BookingModal from '@/components/BookingModal';
import FloatingConcierge from '@/components/FloatingConcierge';
import Footer from '@/components/Footer';

const jost = Jost({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://grandaddishotel.et'),
  title: 'Grand Addis Hotel | Addis Ababa, Ethiopia',
  description: 'Your Grand Stay in the Heart of Addis. Discover refined boutique luxury, authentic Ethiopian hospitality, and modern accommodations at 22 Around Golagul, Addis Ababa.',
  keywords: [
    'Grand Addis Hotel',
    'Addis Ababa Hotel',
    'Ethiopia Luxury Hotel',
    'Bole Airport Hotel',
    'Golagul Addis Ababa',
    'Hotel Rooms Addis',
    'Ethiopian Hospitality',
    'Best Hotel Addis Ababa'
  ],
  openGraph: {
    title: 'Grand Addis Hotel | Addis Ababa, Ethiopia',
    description: 'Your Grand Stay in the Heart of Addis. Experience luxury accommodations and authentic Ethiopian hospitality.',
    url: 'https://grandaddishotel.et',
    siteName: 'Grand Addis Hotel',
    images: [
      {
        url: '/images/BO5A5779-scaled.jpg',
        width: 1200,
        height: 630,
        alt: 'Grand Addis Hotel'
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: '/images/logo.png',
    apple: '/images/logo.png',
  },
  verification: {
    google: 'z_sZfA0PDp_AFYRnV7S7RaBqTZgVOf5469wsdVExEjo',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${jost.variable} ${playfair.variable}`}>
      <head>
        <link rel="icon" href="/images/logo.png" />
        <meta name="theme-color" content="#0F2A33" />
        <meta name="google-site-verification" content="z_sZfA0PDp_AFYRnV7S7RaBqTZgVOf5469wsdVExEjo" />
      </head>
      <body>
        <CurrencyProvider>
          <BookingProvider>
            <Header />
            <NavDrawer />
            <BookingModal />
            <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
              {children}
            </main>
            <Footer />
            <FloatingConcierge />
          </BookingProvider>
        </CurrencyProvider>
      </body>
    </html>
  );
}
