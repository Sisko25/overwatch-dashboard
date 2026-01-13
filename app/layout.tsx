import type { Metadata } from "next";

import "./globals.css"; 

export const metadata: Metadata = {
  title: "OVERWATCH | OSINT Monitor",
  description: "Real-time Global Threat Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}