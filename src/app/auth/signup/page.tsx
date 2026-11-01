
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import * as authActions from '@/app/auth/actions';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Sparkles, UserPlus } from 'lucide-react';
import { FooterContent } from '@/components/footer-content';
import { motion } from 'framer-motion';
import { DoodleBackground } from '@/components/doodle-background';
import Image from 'next/image';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full rounded-full h-11 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]" disabled={pending}>
      {pending ? 'Crafting Account...' : 'Join Linguaverse'}
    </Button>
  );
}

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.902,36.43,44,30.823,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
    </svg>
);

export default function SignupPage() {
  const [state, formAction] = useActionState(authActions.signup, null);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (state?.error) {
      toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description: state.error,
      });
    }
    if (state?.message) {
      toast({
        title: 'Check your email',
        description: state.message,
      });
    }
  }, [state, toast]);


  return (
    <>
      <div className="relative min-h-[calc(100vh-theme(space.16))] flex items-center justify-center p-4 overflow-hidden noise-bg">
        {/* Animated Background Layers */}
        <div className="mesh-gradient-bg" />
        <div className="mesh-gradient-circle mesh-gradient-circle-1" />
        <div className="mesh-gradient-circle mesh-gradient-circle-2" />
        
        <motion.div
           initial={{ opacity: 0, y: 30, scale: 0.95 }}
           animate={{ opacity: 1, y: 0, scale: 1 }}
           transition={{ duration: 0.8, ease: [0, 0.71, 0.2, 1.01] }}
           className="w-full max-w-md z-10"
        >
          <Card className="glass-card shadow-2xl border-white/20">
            <CardHeader className="text-center space-y-2 pb-8">
              <div className="mx-auto h-16 w-16 rounded-2xl overflow-hidden mb-4 transition-transform hover:rotate-6 shadow-lg border border-primary/10">
                <Image src="/logo.jpg" alt="Linguaverse Logo" width={64} height={64} className="object-cover" />
              </div>
              <CardTitle className="text-4xl font-extrabold tracking-tight font-headline text-primary">
                Join Linguaverse
              </CardTitle>
              <CardDescription className="text-muted-foreground/80 font-medium italic">
                Begin your journey to mastery and clarity.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={formAction} className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="fullName" className="text-xs uppercase tracking-widest font-bold text-muted-foreground/70">Full Name</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    placeholder="Jane Doe"
                    required
                    className="bg-background/50 h-11 transition-all focus:ring-primary/20"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-xs uppercase tracking-widest font-bold text-muted-foreground/70">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="m@example.com"
                    required
                    className="bg-background/50 h-11 transition-all focus:ring-primary/20"
                  />
                </div>
                <div className="grid gap-2 relative">
                  <Label htmlFor="password" className="text-xs uppercase tracking-widest font-bold text-muted-foreground/70">Password</Label>
                  <Input id="password" type={showPassword ? 'text' : 'password'} name="password" required className="bg-background/50 h-11 transition-all focus:ring-primary/20 pr-10" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 bottom-1 h-9 w-9 text-muted-foreground hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <SubmitButton />
              </form>

                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase tracking-tighter">
                        <span className="bg-transparent px-2 text-muted-foreground/60">Digital reflection & mastery</span>
                    </div>
                </div>

                <form action={authActions.signInWithGoogle}>
                    <Button variant="outline" className="w-full h-11 rounded-full border-white/20 bg-white/5 hover:bg-white/10 transition-all font-semibold">
                        <GoogleIcon className="mr-2 h-5 w-5" />
                        Continue with Google
                    </Button>
                </form>

              <div className="mt-8 text-center text-sm">
                Already part of the universe?{' '}
                <Link href="/login" className="font-bold text-primary underline underline-offset-4 hover:opacity-80 transition-opacity">
                  Sign In
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      <FooterContent user={null} />
    </>
  );
}
