import './globals.css';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { AuthProvider } from '../lib/auth-context';

export const metadata = {
  title: 'Distributed Compute Marketplace — Rent & Monetize GPU/CPU Compute',
  description: 'A production-grade distributed compute marketplace connecting independent GPU/CPU hardware providers with developers and AI researchers.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
