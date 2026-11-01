
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import * as authActions from '@/app/auth/actions';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Sparkles, LogIn } from 'lucide-react';
import { FooterContent } from '@/components/footer-content';
import { motion } from 'framer-motion';
import Image from 'next/image';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full rounded-full h-11 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]" disabled={pending}>
      {pending ? 'Verifying...' : 'Sign In'}
    </Button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useActionState(authActions.login, null);
  const [showPassword, setShowPassword] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (state?.error) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: state.error,
      });
    }
  }, [state, toast]);
  
  const handlePasswordReset = async () => {
      const email = emailInputRef.current?.value;

      if (!email) {
          toast({
              variant: 'destructive',
              title: 'Email Required',
              description: 'Please enter your email to reset your password.',
          });
          return;
      }
      const { message, error } = await authActions.sendPasswordReset(email);
      if (error) {
          toast({ variant: 'destructive', title: 'Error', description: error });
      } else {
          toast({ title: 'Password Reset Email Sent', description: message });
      }
  }

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
                 Welcome Back
               </CardTitle>
               <CardDescription className="text-muted-foreground/80 font-medium italic">
                 Continue your journey of reflection and growth.
               </CardDescription>
             </CardHeader>
             <CardContent>
               <form action={formAction} className="grid gap-6">
                 <div className="grid gap-2">
                   <Label htmlFor="email" className="text-xs uppercase tracking-widest font-bold text-muted-foreground/70">Email Address</Label>
                   <Input
                     id="email"
                     type="email"
                     name="email"
                     placeholder="your@email.com"
                     required
                     ref={emailInputRef}
                     className="bg-background/50 h-11 transition-all focus:ring-primary/20"
                   />
                 </div>
                 <div className="grid gap-2 relative">
                     <div className="flex items-center">
                         <Label htmlFor="password" className="text-xs uppercase tracking-widest font-bold text-muted-foreground/70">Password</Label>
                          <Button type="button" variant="link" className="ml-auto inline-block h-auto p-0 text-[10px] uppercase tracking-tighter opacity-70 hover:opacity-100 transition-opacity" onClick={handlePasswordReset}>
                             Forgot password?
                          </Button>
                     </div>
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

               <div className="mt-8 text-center text-sm">
                 New to the universe?{' '}
                 <Link href="/auth/signup" className="font-bold text-primary underline underline-offset-4 hover:opacity-80 transition-opacity">
                   Create Account
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
