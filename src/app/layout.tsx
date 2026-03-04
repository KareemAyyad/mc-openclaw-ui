import type { Metadata } from 'next';
import './globals.css';
import { JetBrains_Mono } from 'next/font/google';
import DemoBanner from '@/components/DemoBanner';
import Sidebar from '@/components/Sidebar';

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Mission Control',
  description: 'AI Agent Orchestration Dashboard',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={jetbrainsMono.variable}>
      <body className={`${jetbrainsMono.className} bg-mc-bg text-mc-text min-h-screen flex`}>
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen relative">
          <DemoBanner />
          <main className="flex-1 w-full relative z-0">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
