import "./globals.css";
import { Inter } from "next/font/google";

// Use cache-busting technique for Inter font
const inter = Inter({ subsets: ["latin"] });

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
        {children}
      </body>
    </html>
  );
}