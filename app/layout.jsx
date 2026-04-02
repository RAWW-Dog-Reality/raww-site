import './globals.css';

export const metadata = {
  title: 'RAWW',
  description: 'Change the Game.',
  metadataBase: new URL('https://raww.dog'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'RAWW',
    description: 'Change the Game.',
    url: 'https://raww.dog',
    siteName: 'RAWW',
    images: [{ url: '/assets/meaticon.png' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RAWW',
    description: 'Change the Game.',
    images: ['/assets/meaticon.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/assets/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script
          type="module"
          src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
