import "./globals.css";
import { Inter } from "next/font/google";
import { Metadata } from "next";
import ClientLayout from "./client-layout";

// Use cache-busting technique for Inter font
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Denso.fi",
  description: "Fractional tokenization platform for domain names",
  icons: {
    icon: "/dino.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Add suppressHydrationWarning to body to ignore hydration mismatch on data-channel-name */}
      <body 
        suppressHydrationWarning={true}
        className={`${inter.className} antialiased bg-gradient-to-br from-slate-900 to-gray-900 min-h-screen`}
      >
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
