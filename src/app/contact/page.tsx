
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, MessageSquare, Send, Github, Linkedin, Instagram } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

const owners = [
    {
        name: 'Priyanshi Saxena',
        email: 'priyanshisaxenapna@gmail.com',
        linkedin: '#',
        github: '#',
        instagram: '#',
    }
];

export default function ContactPage() {
    const { toast } = useToast();

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const name = formData.get('name') as string;
        const email = formData.get('email') as string;
        const type = formData.get('type') as string;
        const subject = formData.get('subject') as string;
        const message = formData.get('message') as string;

        const mailtoLink = `mailto:priyanshisaxenapna@gmail.com?subject=${encodeURIComponent(`${type}: ${subject}`)}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`)}`;

        window.location.href = mailtoLink;

        toast({
            title: "Redirecting to your email client...",
            description: "Please complete sending the email from your mail application.",
        });
    };

    return (
        <div className="bg-primary/5 py-12 md:py-20">
            <div className="container mx-auto max-w-2xl space-y-12">
                <Card>
                    <form onSubmit={handleSubmit}>
                        <CardHeader className="text-center">
                            <Mail className="mx-auto h-12 w-12 text-primary" />
                            <CardTitle className="font-headline text-4xl">Contact Us</CardTitle>
                            <CardDescription className="text-lg">Have a question, bug report, or feedback? We'd love to hear from you.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input id="name" name="name" placeholder="Your Name" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Your Email</Label>
                                    <Input id="email" name="email" type="email" placeholder="you@example.com" required />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="type">Type of Inquiry</Label>
                                    <Select name="type" required>
                                        <SelectTrigger id="type">
                                            <SelectValue placeholder="Select a type..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Feedback">Feedback</SelectItem>
                                            <SelectItem value="Bug Report">Bug Report</SelectItem>
                                            <SelectItem value="Feature Request">Feature Request</SelectItem>
                                            <SelectItem value="Question">Question</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="subject">Subject</Label>
                                    <Input id="subject" name="subject" placeholder="e.g., Issue with speaking practice" required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="message">Message</Label>
                                <Textarea id="message" name="message" placeholder="Please provide as much detail as possible..." required rows={6} />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" className="w-full">
                                <Send className="mr-2 h-4 w-4" />
                                Compose Email
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
                
                <Card>
                    <CardHeader className="text-center">
                        <CardTitle className="font-headline text-3xl">Meet the Creator</CardTitle>
                        <CardDescription>Connect directly with the creator.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        {owners.map((owner) => (
                            <div key={owner.name} className="flex flex-col items-center text-center p-4 border rounded-lg">
                                <h3 className="text-lg font-semibold">{owner.name}</h3>
                                <div className="flex items-center gap-4 mt-4">
                                    <Link href={`mailto:${owner.email}`} target="_blank" className="text-muted-foreground hover:text-primary"><Mail className="h-6 w-6" /></Link>
                                    <Link href={owner.linkedin} target="_blank" className="text-muted-foreground hover:text-primary"><Linkedin className="h-6 w-6" /></Link>
                                    <Link href={owner.github} target="_blank" className="text-muted-foreground hover:text-primary"><Github className="h-6 w-6" /></Link>
                                    <Link href={owner.instagram} target="_blank" className="text-muted-foreground hover:text-primary"><Instagram className="h-6 w-6" /></Link>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
