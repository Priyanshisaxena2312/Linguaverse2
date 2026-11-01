
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { BarChart3, Sparkles, Lock, Edit, ArrowRight, Briefcase, Mic, Dumbbell, Languages, Users, Filter, ListChecks } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedUnderlineText, TypewriterText } from '@/components/animated-text';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import type { Plan } from '@/lib/types';
import { getProfile } from './profile/actions';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { FooterContent } from '@/components/footer-content';
import { DoodleBackground } from '@/components/doodle-background';
import { SenseCheckTool } from '@/components/sense-check-tool';
import type { User } from '@supabase/supabase-js';


const VideoModal = ({ videoUrl, onClose }: { videoUrl: string, onClose: () => void }) => {
  return (
    <Dialog open={!!videoUrl} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Feature Demo</DialogTitle>
          <DialogDescription>
            Watch a short video demonstrating this feature in action.
          </DialogDescription>
        </DialogHeader>
        <div className="aspect-video bg-black rounded-lg overflow-hidden">
          <video
            className="w-full h-full"
            src={videoUrl}
            autoPlay
            controls
            muted
            loop
          >
            Your browser does not support the video tag.
          </video>
        </div>
      </DialogContent>
    </Dialog>
  );
};


export default function LandingPage() {
  const [demoVideoUrl, setDemoVideoUrl] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const profile = await getProfile();
        if (profile) {
          setUser({ id: profile.id } as User);
        }
      } catch (e) {
        // Not logged in, which is fine for the landing page.
      }
    }
    fetchUser();
  }, []);

  const heroIntroContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.4, delayChildren: 0.2 }
    }
  };

  const heroIntroItem = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  const encryptedText = "!x#s3$dF8*^kL2@vPq";
  const originalText = "My secret thought...";
  const analysisText = "AI Analysis (server-side only)";

  const studentFeatures = [
    { title: '24/7 Writing Coach', description: 'Get instant, 24/7 feedback on any piece of writing. Our AI highlights grammatical errors, suggests better phrasing, and helps you improve your vocabulary on the spot.', icon: Edit },
    { title: 'Speaking & Fluency Analysis', description: 'Record yourself speaking and get a detailed, immediate report on your fluency, filler words, and pronunciation. Practice anytime, anywhere.', icon: Mic },
    { title: 'The Practice Arena', description: 'Don\'t just learn—master. The app automatically creates personalized quizzes based on your specific past mistakes to reinforce your learning.', icon: Dumbbell },
    { title: 'Personal Dictionary', description: 'Build your own vocabulary list. Save new words and compare commonly confused words with detailed explanations and examples.', icon: Languages },
    { title: 'Priority Weaver To-Do List', description: 'Stay organized by turning your scattered thoughts and plans into structured, prioritized to-do lists automatically.', icon: ListChecks },
  ];

  const teacherFeatures = [
    { title: 'Centralized Dashboard', description: 'Get a high-level overview of engagement, submission rates, and average performance across all your managed classes.', icon: Users },
    { title: 'Efficient Assignment Management', description: 'Save time by creating, distributing, and tracking writing assignments for different classes, all in one place.', icon: Briefcase },
    { title: 'Grammar Hotspots Analysis', description: 'Gain unprecedented insight. Instantly identify the most common grammatical mistakes across an entire class to inform your teaching and address specific needs.', icon: Filter },
    { title: 'Detailed Student Analytics', description: 'Go beyond grades. View detailed analytics for individual students to track their progress, see their performance trends, and provide targeted, effective feedback faster.', icon: BarChart3 },
  ];

  return (
    <>
      <div className="flex flex-col relative min-h-screen">
        <DoodleBackground />

        {/* Mesh Gradient Background Layer */}
        <div className="mesh-gradient-bg">
          <div className="mesh-gradient-circle mesh-gradient-circle-1" />
          <div className="mesh-gradient-circle mesh-gradient-circle-2" />
          <div className="mesh-gradient-circle mesh-gradient-circle-3" />
        </div>

        {/* Hero Section */}
        <section className="w-full pt-20 pb-16 md:pt-32 md:pb-20 lg:pt-40 lg:pb-32 min-h-[85vh] flex items-center justify-center relative overflow-hidden">
          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="flex flex-col items-center justify-center space-y-12 text-center">
              <motion.div
                className="flex flex-col items-center justify-center space-y-6 max-w-4xl"
                initial="hidden"
                animate="visible"
                variants={heroIntroContainer}
              >
                <motion.div
                  className="flex flex-col items-center mb-4"
                  variants={heroIntroItem}
                >
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 mb-6 backdrop-blur-sm">
                    <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                    <span className="text-sm font-medium text-primary/80 uppercase tracking-widest">Mastery through Reflection</span>
                  </div>
                  <TypewriterText
                    text="Speak with Confidence. Write with Clarity."
                    el="h2"
                    className="text-2xl font-body italic text-muted-foreground/80 md:text-3xl"
                    triggerOnLoad={true}
                  />
                </motion.div>

                <motion.div className="space-y-6" variants={heroIntroItem}>
                  <h1 className="text-4xl font-extrabold tracking-tighter sm:text-7xl xl:text-7xl/none font-headline text-primary bg-clip-text drop-shadow-sm">
                    Linguaverse
                  </h1>
                  <p className="max-w-[650px] text-muted-foreground/90 md:text-xl mx-auto leading-relaxed font-body italic transition-all duration-300 hover:text-primary/70">
                    Your personal AI-powered coach to help you master English speaking and writing through interactive practice and detailed feedback.
                  </p>
                </motion.div>

                <motion.div
                  className="flex flex-col gap-4 sm:flex-row justify-center items-center pt-8"
                  variants={heroIntroItem}
                >
                  <Button asChild size="lg" className="h-14 px-8 text-lg font-bold rounded-full shadow-2xl transition-all duration-300 hover:scale-105">
                    <Link href={user ? "/dashboard" : "/auth/signup"}>{user ? "Go to Dashboard" : "Get Started Free"}</Link>
                  </Button>

                  <Button asChild size="lg" variant="outline" className="h-14 px-8 text-lg font-bold rounded-full border-2 border-primary/50 bg-background/80 hover:bg-primary/10 shadow-xl transition-all duration-300 hover:scale-105 group backdrop-blur-md">
                    <Link href="/api/demo?action=enter" className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-amber-500 animate-pulse group-hover:rotate-12 transition-transform" />
                      <span>Feature Demo</span>
                      <span className="text-xs font-semibold py-0.5 px-2 rounded-full bg-primary/15 text-primary border border-primary/30">No Login Required</span>
                    </Link>
                  </Button>

                  {!user && (
                    <Button asChild variant="ghost" size="lg" className="h-14 px-6 text-base font-semibold rounded-full transition-all duration-300 hover:bg-primary/5">
                      <Link href="/login">Sign In</Link>
                    </Button>
                  )}
                </motion.div>
              </motion.div>


            </div>
          </div>
        </section>

        {/* Project Reviewer Quick Access Ribbon */}
        <section className="w-full py-6 bg-gradient-to-r from-primary/10 via-background to-primary/10 border-y border-border/40 backdrop-blur-sm relative z-20">
          <div className="container mx-auto px-4 md:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-headline font-bold text-base text-foreground flex items-center justify-center sm:justify-start gap-2">
                  <span>Project Reviewer & Evaluator Access</span>
                  <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider py-0 px-1.5">No Login</Badge>
                </p>
                <p className="text-xs text-muted-foreground">Jump directly into a loaded guest session as Priyanshi Saxena to test speaking, writing, and analytics.</p>
              </div>
            </div>
            <Button asChild size="sm" className="rounded-full px-6 font-bold shadow-md bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 transition-transform hover:scale-105">
              <Link href="/api/demo?action=enter">
                <Sparkles className="mr-1.5 h-4 w-4" /> Launch Feature Demo
              </Link>
            </Button>
          </div>
        </section>

        {/* More Than a Diary Section */}
        <section className="w-full py-16 md:py-24 bg-background relative overflow-hidden">
          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="flex flex-col items-center justify-center space-y-4 text-center mb-24"
            >
              <div className="space-y-4">
                <div className="inline-block rounded-full bg-primary/5 border border-primary/20 px-6 py-2 text-sm font-bold text-primary/80 uppercase tracking-widest shadow-sm">The Evolution of Journaling</div>
                <AnimatedUnderlineText text="More Than a Diary" el="h2" className="text-4xl font-extrabold tracking-tighter sm:text-6xl font-headline" />
                <p className="max-w-[800px] text-muted-foreground md:text-2xl/relaxed font-body italic">A conventional diary records your thoughts. Linguaverse helps you understand and master them.</p>
              </div>
            </motion.div>

            <div className="mx-auto grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: Mic, title: 'Multi-Modal Input', desc: 'Go beyond typing. Express yourself through voice notes and let our AI transcribe and structure your thoughts for you.' },
                { icon: BarChart3, title: 'Actionable Insights', desc: 'Your diary won\'t give you feedback. Ours does. Get instant analysis on your grammar, vocabulary, fluency, and more.' },
                { icon: Lock, title: 'Secure & Accessible', desc: 'With AES-256 encryption, your entries are secure and private. Access your practice sessions anytime, anywhere.' }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.2 }}
                  className="flex flex-col items-center text-center p-8 rounded-3xl bg-card/50 border border-border/40 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 group"
                >
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                    <item.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold font-headline mb-3">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Sense-Check Tool Section */}
        <section className="w-full py-16 md:py-24 relative overflow-hidden">
             <div className="container mx-auto px-4 md:px-6 relative z-10">
                <SenseCheckTool />
             </div>
        </section>

        {/* Complete Learning Package Section */}
        <section className="w-full py-32 md:py-48 bg-primary/[0.02] border-y border-border/40 relative">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1 }}
                className="flex justify-center relative"
              >
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full opacity-30 animate-pulse" />
                <div className="h-64 w-64 md:h-80 md:w-80 rounded-full border-8 border-background/50 bg-white flex items-center justify-center p-0 shadow-2xl relative z-10 overflow-hidden">
                  <Image src="/logo.jpg" alt="Learning Package" width={320} height={320} className="object-cover w-full h-full" />
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="flex flex-col justify-center space-y-8"
              >
                <div className="space-y-6">
                  <div className="inline-block rounded-full bg-primary/10 border border-primary/20 px-6 py-2 text-sm font-bold text-primary/90 uppercase tracking-widest shadow-sm">Your Personal Tutor</div>
                  <AnimatedUnderlineText text="A Complete Learning Package" el="h2" className="text-4xl font-extrabold tracking-tighter sm:text-5xl font-headline" triggerOnLoad={true} />
                  <p className="max-w-[600px] text-muted-foreground md:text-2xl/relaxed leading-relaxed font-body italic">Linguaverse is an integrated ecosystem designed to improve your communication skills. It's not just about practice; it's about a continuous cycle of learning, feedback, and reinforcement.</p>

                  <div className="grid gap-6 pt-4">
                    {[
                      { title: 'Write & Improve', desc: 'Get instant corrections on grammar and suggestions for better vocabulary.' },
                      { title: 'Speak & Refine', desc: 'Analyze your spoken fluency, identify filler words, and perfect your pronunciation.' },
                      { title: 'Practice & Master', desc: 'Turn your personal mistakes into personalized quizzes in the Practice Arena.' }
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.3 + (i * 0.1) }}
                        className="flex items-start gap-4 p-4 rounded-2xl bg-background/50 border border-border/20 backdrop-blur-sm"
                      >
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <CheckIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-bold text-lg">{item.title}</h4>
                          <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Bento features Section */}
        <section id="demo" className="w-full py-32 md:py-48 bg-background">
          <div className="container mx-auto px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="flex flex-col items-center justify-center space-y-4 text-center mb-16"
            >
              <div className="space-y-4">
                <div className="inline-block rounded-full bg-primary/5 border border-primary/20 px-6 py-2 text-sm font-bold text-primary/90 uppercase tracking-widest shadow-sm">How It Works</div>
                <AnimatedUnderlineText text="Explore the Ecosystem" el="h2" className="text-4xl font-extrabold tracking-tighter sm:text-6xl font-headline" />
                <p className="max-w-[900px] text-muted-foreground md:text-2xl/relaxed font-body italic">A unified platform for both students and educators.</p>
              </div>
            </motion.div>

            <div className="mx-auto max-w-6xl">
              <Tabs defaultValue="student-features" className="w-full">
                <div className="flex justify-center mb-12">
                  <TabsList className="inline-flex h-14 items-center justify-center rounded-full bg-muted/50 p-1 backdrop-blur-md border border-border/40">
                    <TabsTrigger value="student-features" className="rounded-full px-8 py-2.5 text-sm font-bold transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg"><Sparkles className="mr-2 h-4 w-4" />For Learners</TabsTrigger>
                  </TabsList>
                </div>

                <AnimatePresence mode="wait">
                  <TabsContent key="student-features" value="student-features" className="mt-0 outline-none">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.5 }}
                      className="grid grid-cols-1 md:grid-cols-6 md:grid-rows-2 gap-4 h-auto md:h-[600px]"
                    >
                      {/* Primary Feature Card */}
                      <div className="md:col-span-3 md:row-span-2 group relative rounded-3xl overflow-hidden border border-border/40 bg-primary/5 p-8 flex flex-col justify-end transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10">
                        <div className="absolute top-8 right-8 h-24 w-24 bg-primary/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                        <Edit className="w-12 h-12 text-primary mb-6" />
                        <h3 className="text-3xl font-bold font-headline mb-4">24/7 Writing Coach</h3>
                        <p className="text-muted-foreground leading-relaxed md:text-lg">Get instant feedback on grammar and vocabulary. Our AI highlights errors and suggests premium phrasing on the spot.</p>
                        <Button asChild variant="link" className="mt-6 p-0 text-primary font-bold group-hover:translate-x-2 transition-transform">
                          <Link href="/api/demo?action=enter">Try Feature Demo <ArrowRight className="ml-2 h-4 w-4" /></Link>
                        </Button>
                      </div>

                      <div className="md:col-span-3 md:row-span-1 group relative rounded-3xl overflow-hidden border border-border/40 bg-card/40 backdrop-blur-sm p-6 flex items-start gap-6 transition-all duration-300 hover:bg-card">
                        <Mic className="w-10 h-10 text-primary shrink-0" />
                        <div>
                          <h3 className="text-xl font-bold font-headline mb-2">Fluency Analysis</h3>
                          <p className="text-muted-foreground text-sm leading-relaxed">Record your speech and get immediate reports on fluency and pronunciation.</p>
                        </div>
                      </div>

                      <div className="md:col-span-1 md:row-span-1 group relative rounded-3xl overflow-hidden border border-border/40 bg-card/40 backdrop-blur-sm p-6 flex flex-col justify-center items-center text-center transition-all duration-300 hover:bg-card">
                        <Languages className="w-8 h-8 text-primary mb-2" />
                        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Dictionary</h3>
                      </div>

                      <div className="md:col-span-2 md:row-span-1 group relative rounded-3xl overflow-hidden border border-border/40 bg-card/40 backdrop-blur-sm p-6 flex flex-col justify-center transition-all duration-300 hover:bg-card">
                        <Dumbbell className="w-8 h-8 text-primary mb-3" />
                        <h3 className="text-xl font-bold font-headline mb-1">Practice Arena</h3>
                        <p className="text-muted-foreground text-sm">Personalized quizzes based on your mistakes.</p>
                      </div>
                    </motion.div>
                  </TabsContent>

                  {/* Teacher features hidden for B2C pivot */}
                </AnimatePresence>
              </Tabs>
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section className="w-full py-32 md:py-48 bg-primary/[0.02] border-y border-border/40 overflow-x-hidden">
          <div className="container mx-auto px-4 md:px-6">
            <motion.div
              className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-24"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.4 }}
              transition={{ staggerChildren: 0.3 }}
            >
              <motion.div
                className="flex flex-col justify-center space-y-8 order-2 lg:order-1"
                variants={{
                  hidden: { opacity: 0, x: -50 },
                  visible: { opacity: 1, x: 0, transition: { duration: 0.8 } }
                }}
              >
                <div className="space-y-6 text-center lg:text-left">
                  <div className="inline-block rounded-full bg-primary/5 border border-primary/20 px-6 py-2 text-sm font-bold text-primary/80 uppercase tracking-widest shadow-sm">Zero-Trust Security</div>
                  <AnimatedUnderlineText text="Your Privacy is Paramount." el="h2" className="text-4xl font-extrabold tracking-tighter sm:text-5xl font-headline text-primary" triggerOnLoad={true} />
                  <p className="max-w-[600px] text-muted-foreground md:text-2xl/relaxed leading-relaxed font-body italic">
                    Your practice sessions are your private space to grow. We use industry-standard **AES-256 encryption** to secure all your written content.
                  </p>
                  <div className="pt-6 grid grid-cols-2 gap-8 text-sm">
                    <div className="p-4 rounded-2xl bg-background border border-border/20">
                      <h5 className="font-bold mb-1">Encrypted at Rest</h5>
                      <p className="text-muted-foreground italic">Your thoughts remain unreadable to everyone but you.</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-background border border-border/20">
                      <h5 className="font-bold mb-1">No AI Training</h5>
                      <p className="text-muted-foreground italic">We never use your personal data to train models.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
              <motion.div
                className="flex flex-col justify-center items-center lg:items-start order-1 lg:order-2"
                variants={{
                  hidden: { opacity: 0, x: 50 },
                  visible: { opacity: 1, x: 0, transition: { duration: 0.8 } }
                }}
              >
                <div className="p-1.5 bg-gradient-to-br from-primary/20 to-accent/20 rounded-[40px]">
                  <div className="p-8 bg-background rounded-[35px] border border-border/40 w-full max-w-md min-h-[400px] flex flex-col justify-center items-center gap-6 shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-primary/5 opacity-50" />
                    <div className="w-full relative z-10">
                      <p className="font-mono text-xs text-muted-foreground/60 text-center mb-2">// Your written entry</p>
                      <div className="h-12 font-mono text-base flex items-center justify-center text-primary font-bold overflow-hidden px-4 rounded-2xl bg-primary/[0.03] border border-primary/10">
                        <TypewriterText text={"I am agree with you."} triggerOnLoad={true} />
                      </div>
                    </div>

                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 1.5 } }} className="text-center text-2xl font-thin text-primary/40">&darr;</motion.div>

                    <div className="w-full relative z-10">
                      <p className="font-mono text-xs text-muted-foreground/60 text-center mb-2">// Stored in database (AES Encrypted)</p>
                      <div className="h-12 font-mono text-base flex items-center justify-center text-green-500 bg-black/90 rounded-2xl px-6 overflow-hidden shadow-inner">
                        <TypewriterText text={encryptedText} triggerOnLoad={true} />
                      </div>
                    </div>

                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 2.8 } }} className="text-center text-2xl font-thin text-primary/40">&darr;</motion.div>

                    <div className="w-full relative z-10">
                      <p className="font-mono text-xs text-muted-foreground/60 text-center mb-2">// Secure Server-Side Analysis</p>
                      <div className="h-12 font-mono text-base flex items-center justify-center text-primary/80 font-bold overflow-hidden px-4 rounded-2xl bg-primary/[0.03] border-2 border-dashed border-primary/30">
                        <TypewriterText text={analysisText} triggerOnLoad={true} />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="w-full py-48 md:py-64 bg-background relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/[0.02]" />
          <div className="container mx-auto px-4 md:px-6 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="max-w-4xl mx-auto space-y-12"
            >
              <div className="space-y-6">
                <h2 className="text-5xl font-extrabold tracking-tighter sm:text-7xl font-headline">Ready to Evolve?</h2>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-2xl/relaxed leading-relaxed font-body italic">
                  Unlock a more confident you. Your first practice session is just a few clicks away. Give your thoughts the clarity they deserve.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 pt-12">
                <Button asChild size="lg" className="h-16 px-10 text-xl font-bold rounded-full shadow-2xl transition-all duration-300 hover:scale-105">
                  <Link href={user ? "/dashboard" : "/auth/signup"}>{user ? "Back to Dashboard" : "Get Started Now"}</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-16 px-8 text-lg font-bold rounded-full border-2 border-primary/50 bg-background/80 hover:bg-primary/10 shadow-xl transition-all duration-300 hover:scale-105 group">
                  <Link href="/api/demo?action=enter" className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
                    <span>Try Feature Demo (No Login)</span>
                  </Link>
                </Button>
                {!user && (
                  <Button asChild variant="ghost" size="lg" className="h-16 px-8 text-lg font-semibold rounded-full transition-all duration-300 hover:bg-primary/5">
                    <Link href="/login">Sign In</Link>
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        </section>


        {demoVideoUrl && <VideoModal videoUrl={demoVideoUrl} onClose={() => setDemoVideoUrl(null)} />}
      </div>
      <FooterContent user={user} />
    </>
  );
}

const CheckIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
  </svg>
);
