import type { Metadata } from 'next';
import './globals.css';
import { JetBrains_Mono } from 'next/font/google';
import DemoBanner from '@/components/DemoBanner';
import { ToastContainer } from '@/components/ToastContainer';

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Teammates.ai — AI Agent Orchestration',
  description: 'Teammates.ai by Kareem Ayyad — Orchestrate AI agents, manage tasks, and ship faster with your AI teammates.',
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
      <body className={`${jetbrainsMono.className} bg-mc-bg text-mc-text min-h-screen antialiased`}>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <DemoBanner />
        <div id="main-content">
          {children}
        </div>
        <ToastContainer />
      </body>
    </html>
  );
}
