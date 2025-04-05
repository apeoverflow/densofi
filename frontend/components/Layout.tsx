'use client';

import Navbar from './ui/Navbar';
import Footer from './ui/Footer';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}