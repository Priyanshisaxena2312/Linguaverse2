
'use client';

import * as authActions from './actions';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export function SignOutButton() {
  return (
    <form action={authActions.logout}>
      <Button type="submit" variant="ghost" size="sm" className="text-foreground/60 hover:text-foreground/80 px-2 sm:px-3 h-8 sm:h-9">
        <LogOut className="sm:mr-2 h-4 w-4" /> <span className="hidden sm:inline">Sign Out</span>
      </Button>
    </form>
  );
}
