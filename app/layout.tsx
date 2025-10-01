import './globals.css';

export const metadata = {
  title: 'TBSL — The Brass Score Library',
  description: 'A clean, modern library for uploading, browsing, and downloading brass scores.'
};
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=2.0, viewport-fit=cover" />
      </head>
      <body style={{
        margin: 0,
        minHeight: '100svh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
        lineHeight: 1.5,
        color: '#111',
        background: '#fff'
      }}>
        <SiteHeader />
        <div style={{ flex: 1 }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1rem' }}>
            {children}
          </div>
        </div>
        <SiteFooter />
      </body>
    </html>
  );
}
