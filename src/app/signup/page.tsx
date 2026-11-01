
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import * as authActions from '@/app/auth/actions';
import { useFormStatus, useFormState } from 'react-dom';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';
import { FooterContent } from '@/components/footer-content';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Creating Account...' : 'Create an account'}
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
  const [state, formAction] = useFormState(authActions.signup, null);
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
      <div className="flex items-center justify-center min-h-[calc(100vh-theme(space.14))] relative overflow-hidden">
        {/* Mesh Gradient Background Layer */}
        <div className="mesh-gradient-bg">
          <div className="mesh-gradient-circle mesh-gradient-circle-1 opacity-10" />
          <div className="mesh-gradient-circle mesh-gradient-circle-2 opacity-10" />
          <div className="mesh-gradient-circle mesh-gradient-circle-3 opacity-10" />
        </div>

        <div className="container mx-auto px-4 relative z-10 flex flex-col items-center py-10">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="w-full max-w-sm"
            >
                <Card className="mx-auto border-border/40 bg-card/60 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden">
                  <CardHeader className="space-y-1 pt-8 pb-4 text-center">
                    <CardTitle className="text-3xl font-extrabold font-headline text-primary tracking-tight">Sign Up</CardTitle>
                    <CardDescription className="text-muted-foreground italic">Start your Linguaverse adventure today</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-8 px-8">
                    <form action={formAction} className="grid gap-5">
                      <div className="grid gap-2">
                        <Label htmlFor="fullName" className="text-sm font-bold uppercase tracking-wider text-muted-foreground/70">Full Name</Label>
                        <Input
                          id="fullName"
                          name="fullName"
                          placeholder="Jane Doe"
                          required
                          className="h-12 bg-background/50 border-border/40 rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="email" className="text-sm font-bold uppercase tracking-wider text-muted-foreground/70">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          name="email"
                          placeholder="you@example.com"
                          required
                          className="h-12 bg-background/50 border-border/40 rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                      </div>
                       <div className="grid gap-2">
                        <Label htmlFor="contactMail" className="text-sm font-bold uppercase tracking-wider text-muted-foreground/70">Contact Email (Optional)</Label>
                        <Input
                          id="contactMail"
                          type="email"
                          name="contactMail"
                          placeholder="contact@example.com"
                          className="h-12 bg-background/50 border-border/40 rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                      </div>
                      <div className="grid gap-2 relative">
                        <Label htmlFor="password" className="text-sm font-bold uppercase tracking-wider text-muted-foreground/70">Password</Label>
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
        
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border/40" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-transparent px-2 text-muted-foreground/60 font-medium">Or continue with</span>
                        </div>
                    </div>
        
                    <form action={authActions.signInWithGoogle}>
                        <Button variant="outline" className="w-full h-12 rounded-2xl border-border/40 bg-background/50 hover:bg-background/80 transition-all flex items-center justify-center gap-3">
                            <GoogleIcon className="h-5 w-5" />
                            <span className="font-semibold">Sign up with Google</span>
                        </Button>
                    </form>
        
                    <div className="mt-6 text-center text-sm text-muted-foreground">
                      Already have an account?{' '}
                      <Link href="/login" className="text-primary font-semibold hover:underline">
                        Sign In
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
