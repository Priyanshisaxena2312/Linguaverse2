

import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Navbar } from '@/components/navbar';
import { MobileBottomNav } from '@/components/mobile-bottom-nav';
import { createClient } from '@/lib/supabase/server';
import { getProfile } from './profile/actions';
import { SyncEnabler } from '@/components/sync-enabler';
import { connection } from 'next/server';

import { Inter, Playfair_Display, Lora, Merriweather, Kalam, Patrick_Hand, Fira_Code } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });
const lora = Lora({ subsets: ['latin'], variable: '--font-lora' });
const merriweather = Merriweather({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-merriweather' });
const kalam = Kalam({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-kalam' });
const patrickHand = Patrick_Hand({ subsets: ['latin'], weight: '400', variable: '--font-patrick-hand' });
const firaCode = Fira_Code({ subsets: ['latin'], variable: '--font-fira-code' });

export const metadata: Metadata = {
  title: 'Linguaverse',
  description: 'Your personal AI language learning and journaling companion.',
};

export const dynamic = 'force-dynamic';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await connection();
  let user = null;
  let profile = null;

  try {
    const supabase = await createClient();
    if (supabase) {
      const { data } = await supabase.auth.getUser();
      user = data?.user;
      profile = user ? await getProfile() : null;
    }
  } catch (error) {
    console.error('Auth error in RootLayout:', error);
  }

  return (
    <html lang="en" className={`h-full ${inter.variable} ${playfair.variable} ${lora.variable} ${merriweather.variable} ${kalam.variable} ${patrickHand.variable} ${firaCode.variable}`}>
      <body className="font-body antialiased h-full bg-background text-foreground">
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow pt-20 pb-16 md:pb-0">
            {children}
          </main>
        </div>
        {user && (
          <>
            <MobileBottomNav profile={profile} />
            <SyncEnabler />
          </>
        )}
        <Toaster />
      </body>
    </html>
  );
}
