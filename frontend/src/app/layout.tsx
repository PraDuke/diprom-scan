// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "DIPROM Scan - ระบบตรวจนับครุภัณฑ์",
  description: "QR Code–Based Asset Tracking and Auditing System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
