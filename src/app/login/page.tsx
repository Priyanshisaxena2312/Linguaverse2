
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import * as authActions from '@/app/auth/actions';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';
import { FooterContent } from '@/components/footer-content';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Signing In...' : 'Sign In'}
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
          description: 'Please enter your email address to reset your password.',
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
      <div className="flex items-center justify-center min-h-[calc(100vh-theme(space.14))] relative overflow-hidden">
        {/* Mesh Gradient Background Layer */}
        <div className="mesh-gradient-bg">
          <div className="mesh-gradient-circle mesh-gradient-circle-1 opacity-10" />
          <div className="mesh-gradient-circle mesh-gradient-circle-2 opacity-10" />
          <div className="mesh-gradient-circle mesh-gradient-circle-3 opacity-10" />
        </div>

        <div className="container mx-auto px-4 relative z-10 flex flex-col items-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="w-full max-w-sm"
            >
                <Card className="mx-auto border-border/40 bg-card/60 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden">
                  <CardHeader className="space-y-1 pt-8 pb-4 text-center">
                    <CardTitle className="text-3xl font-extrabold font-headline text-primary tracking-tight">Login</CardTitle>
                    <CardDescription className="text-muted-foreground italic">Enter your credentials to continue your journey</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-8 px-8">
                    <form action={formAction} className="grid gap-6">
                      <div className="grid gap-2">
                        <Label htmlFor="email" className="text-sm font-bold uppercase tracking-wider text-muted-foreground/70">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          name="email"
                          placeholder="you@example.com"
                          required
                          ref={emailInputRef}
                          className="h-12 bg-background/50 border-border/40 rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                      </div>
                      <div className="grid gap-2 relative">
                          <div className="flex items-center">
                              <Label htmlFor="password" className="text-sm font-bold uppercase tracking-wider text-muted-foreground/70">Password</Label>
                               <Button type="button" variant="link" className="ml-auto inline-block h-auto p-0 text-xs font-semibold text-primary/70" onClick={handlePasswordReset}>
                                  Forgot password?
                               </Button>
                          </div>
                          <Input 
                            id="password" 
                            type={showPassword ? 'text' : 'password'} 
                            name="password" 
                            required 
                            className="h-12 bg-background/50 border-border/40 rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all pr-12"
                          />
                           <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-2 bottom-1.5 h-9 w-9 text-muted-foreground/50 hover:text-primary transition-colors"
                              onClick={() => setShowPassword(!showPassword)}
                              >
                              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                              <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
                          </Button>
                      </div>
                      <div className="pt-2">
                        <SubmitButton />
                      </div>
                    </form>
        
                    <div className="mt-6 text-center text-sm text-muted-foreground">
                      Don&apos;t have an account?{' '}
                      <Link href="/signup" className="text-primary font-semibold hover:underline">
                        Sign Up
                      </Link>
                    </div>
                  </CardContent>
                </Card>
            </motion.div>
        </div>
      </div>
      <FooterContent user={null} />
    </>
  );
}
