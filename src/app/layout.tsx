import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Secure Database App",
  description: "Modern secure web application with Google OAuth and Supabase",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
