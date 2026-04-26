import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PropertyCRM - Property Deal Management",
  description: "Full-stack CRM system for property dealers",
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
