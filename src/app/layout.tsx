import type { Metadata } from 'next';
import './globals.css';
import { BookingProvider } from '@/context/BookingContext';
import Header from '@/components/Header';
import NavDrawer from '@/components/NavDrawer';
import BookingModal from '@/components/BookingModal';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  metadataBase: new URL('https://grandaddishotel.com'),
  title: 'Grand Addis Hotel - Resort & Hotel | Addis Ababa, Ethiopia',
  description: 'Your Grand Stay in the Heart of Addis. Discover refined boutique luxury, world-class dining, soothing spa wellness, and modern accommodations at 22 Around Golagul, Addis Ababa.',
  keywords: [
    'Grand Addis Hotel',
    'Addis Ababa Hotel',
    'Ethiopia Luxury Resort',
    'Bole Airport Hotel',
    'Golagul Addis Ababa',
    'Hotel Rooms Addis',
    'Ethiopian Hospitality',
    'Addis Ababa Conference Venue',
    'Best Hotel Addis Ababa'
  ],
  openGraph: {
    title: 'Grand Addis Hotel - Resort & Hotel | Addis Ababa, Ethiopia',
    description: 'Your Grand Stay in the Heart of Addis. Experience luxury accommodations, fine dining, and authentic hospitality.',
    url: 'https://grandaddishotel.com',
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
  icons: {
    icon: '/images/logo.png',
    apple: '/images/logo.png',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/images/logo.png" />
        <meta name="theme-color" content="#0F2A33" />
      </head>
      <body>
        <BookingProvider>
          <Header />
          <NavDrawer />
          <BookingModal />
          <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {children}
          </main>
          <Footer />
        </BookingProvider>
      </body>
    </html>
  );
}
