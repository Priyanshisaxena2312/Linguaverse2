
'use client';

import Link from 'next/link';
import { Twitter, Github, Linkedin, Mail } from 'lucide-react';
import Image from 'next/image';
import type { User } from '@supabase/supabase-js';

/**
 * This is the CLIENT-safe presentational component for the footer.
 * It receives the user object as a prop and contains no server-only code.
 */
export function FooterContent({ user }: { user: User | null }) {
  return (
    <footer className="border-t border-border/40 bg-background/95">
      <div className="container mx-auto max-w-screen-xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div>
             <Link href={user ? "/dashboard" : "/"} className="flex items-center space-x-2">
                <Image src="/logo.jpg" alt="Linguaverse Logo" width={80} height={80} className="rounded-full shadow-lg border-2 border-primary/10" />
                <span className="text-2xl font-bold font-headline text-primary">Linguaverse</span>
            </Link>
            <p className="mt-2 text-sm text-muted-foreground italic font-body">
                Speak with Confidence. Write with Clarity.
            </p>
            <p className="mt-4 max-w-xs text-muted-foreground">
              Your personal AI speaking and writing coach.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 lg:col-span-2 lg:grid-cols-3">
            <div>
              <p className="font-semibold text-foreground font-headline">Product</p>
              <ul className="mt-6 space-y-4 text-sm">
                <li><Link href="/#demo" className="text-muted-foreground transition hover:opacity-75">Features</Link></li>
                <li><Link href="/dashboard" className="text-muted-foreground transition hover:opacity-75">New Entry</Link></li>
                <li><Link href="/dictionary/practice" className="text-muted-foreground transition hover:opacity-75">Practice Arena</Link></li>
              </ul>
            </div>

            <div>
              <p className="font-semibold text-foreground font-headline">Company</p>
              <ul className="mt-6 space-y-4 text-sm">
                <li><Link href="/about" className="text-muted-foreground transition hover:opacity-75">About Us</Link></li>
                 <li><Link href="/contact" className="text-muted-foreground transition hover:opacity-75">Contact</Link></li>
                <li><Link href="/credits" className="text-muted-foreground transition hover:opacity-75">Credits</Link></li>
              </ul>
            </div>

            <div>
              <p className="font-semibold text-foreground font-headline">Legal</p>
              <ul className="mt-6 space-y-4 text-sm">
                <li><Link href="/terms" className="text-muted-foreground transition hover:opacity-75">Terms of Service</Link></li>
                <li><Link href="/privacy" className="text-muted-foreground transition hover:opacity-75">Privacy Policy</Link></li>
                <li><Link href="/cookies" className="text-muted-foreground transition hover:opacity-75">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-border/40 pt-8 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground text-center sm:text-left">
            &copy; {new Date().getFullYear()} Linguaverse. All rights reserved.
          </p>
          <div className="flex justify-center sm:justify-start gap-6 mt-4 sm:mt-0">
             <Link href="/contact" className="text-muted-foreground transition hover:opacity-75"><span className="sr-only">Contact</span><Mail className="h-5 w-5" /></Link>
             <Link href="#" className="text-muted-foreground transition hover:opacity-75"><span className="sr-only">Twitter</span><Twitter className="h-5 w-5" /></Link>
             <Link href="#" className="text-muted-foreground transition hover:opacity-75"><span className="sr-only">LinkedIn</span><Linkedin className="h-5 w-5" /></Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
