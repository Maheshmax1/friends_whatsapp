import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ChatProvider } from '../context/ChatContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Halo Chat - Premium Real-Time Messenger',
  description: 'Connect with your friends instantly with end-to-end encrypted feel and rich animations.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full dark">
      <body className={`${inter.className} min-h-full flex flex-col antialiased`}>
        <ChatProvider>
          {children}
        </ChatProvider>
      </body>
    </html>
  );
}
