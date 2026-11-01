'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function InstallPwaButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      toast({
        title: 'App already installed',
        description: 'You are either using the app already, or the app cannot be installed on your current browser.',
      });
      return;
    }
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      toast({
        title: 'Install Accepted',
        description: 'App is installing...',
      });
      setDeferredPrompt(null);
    }
  };

  return (
    <Button variant="outline" className="w-full sm:w-auto" onClick={handleInstallClick}>
      <Download className="mr-2 h-4 w-4" />
      Install App
    </Button>
  );
}
