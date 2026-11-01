
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { sendPasswordReset } from '@/app/auth/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, KeyRound } from 'lucide-react';
import { getProfile } from '@/app/profile/actions';

export default function ForcePasswordResetPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [userEmail, setUserEmail] = useState('...');
    const { toast } = useToast();

    useEffect(() => {
        async function fetchEmail() {
            const profile = await getProfile();
            if (profile?.email) {
                setUserEmail(profile.email);
            } else {
                setUserEmail('your registered email');
            }
        }
        fetchEmail();
    }, []);

    const handleSendLink = async () => {
        setIsLoading(true);
        const { message, error } = await sendPasswordReset(userEmail);
        if (error) {
            toast({ variant: 'destructive', title: 'Error', description: error });
        } else {
            toast({ title: 'Password Reset Email Sent', description: message });
        }
        setIsLoading(false);
    };

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-theme(space.14))] bg-muted/40">
            <Card className="mx-auto max-w-lg w-full text-center">
                <CardHeader>
                    <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-4">
                        <KeyRound className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold font-headline">Secure Your Account</CardTitle>
                    <CardDescription className="text-lg">
                        Welcome! As a final security step, please set a new permanent password.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        We will send a secure password reset link to your registered email address: <strong className="font-semibold text-foreground">{userEmail}</strong>
                    </p>
                </CardContent>
                <CardFooter>
                    <Button 
                        className="w-full" 
                        onClick={handleSendLink} 
                        disabled={isLoading || userEmail === '...'}
                    >
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {isLoading ? 'Sending...' : 'Send Reset Link'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
