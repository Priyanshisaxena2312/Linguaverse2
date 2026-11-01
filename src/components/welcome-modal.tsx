
'use client';

import { useEffect, useState } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Profile } from '@/lib/types';
import { updateProfile } from '@/app/profile/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, School, GraduationCap, Phone, User as UserIcon, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

type WelcomeModalProps = {
  profile: Profile;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button 
      type="submit" 
      disabled={pending} 
      className="w-full bg-primary/90 hover:bg-primary text-primary-foreground shadow-xl shadow-primary/20 h-12 text-base font-bold rounded-2xl transition-all duration-300 active:scale-95"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Finalizing...
        </>
      ) : (
        <>
          <Image src="/logo.jpg" alt="Logo" width={20} height={20} className="mr-2 rounded-full" /> Start Your Journey
        </>
      )}
    </Button>
  );
}

export function WelcomeModal({ profile }: WelcomeModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [institutionType, setInstitutionType] = useState<'school' | 'college'>('college');
  const [updateState, formAction] = useActionState(updateProfile, null);
  const { toast } = useToast();
  const router = useRouter();
  
  useEffect(() => {
    if (profile && !profile.profile_setup_complete) {
      setIsOpen(true);
    }
  }, [profile]);
  
  useEffect(() => {
    if (updateState?.error) {
      toast({
        variant: 'destructive',
        title: 'Oops! Something went wrong',
        description: updateState.error,
      });
    }
    if (updateState?.message) {
      toast({
        title: 'Welcome Aboard!',
        description: 'Your profile has been polished and perfected.',
      });
      setIsOpen(false);
      router.refresh(); 
    }
  }, [updateState, toast, router]);

  return (
    <Dialog open={isOpen} modal={true}>
      <DialogContent 
        className="sm:max-w-[480px] p-0 border-none bg-transparent shadow-none overflow-hidden" 
        onInteractOutside={(e) => e.preventDefault()} 
        hideCloseButton={true}
      >
        <div className="relative p-6 sm:p-8 bg-background/95 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] shadow-2xl overflow-hidden group">
          {/* Ornamental mesh gradient background */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-colors duration-1000" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl group-hover:bg-orange-500/20 transition-colors duration-1000" />

          <form action={formAction} className="relative space-y-6">
            <DialogHeader className="space-y-2 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                 <div className="p-1 bg-primary/10 rounded-xl overflow-hidden">
                    <Image src="/logo.jpg" alt="Linguaverse" width={28} height={28} className="rounded-lg" />
                 </div>
                 <Badge variant="outline" className="text-[10px] uppercase tracking-widest font-bold border-primary/20 text-primary/70">
                    Onboarding
                 </Badge>
              </div>
              <DialogTitle className="font-headline text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
                Welcome to Linguaverse!
              </DialogTitle>
              <DialogDescription className="text-muted-foreground/80 leading-relaxed max-w-[90%]">
                Let's tailor your experience. Tell us a bit about your academic journey.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Core Info Section */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="age" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1 flex items-center gap-1.5">
                       <UserIcon className="h-3.5 w-3.5" /> Age
                    </Label>
                    <Input
                      id="age"
                      name="age"
                      type="number"
                      required
                      placeholder="18"
                      min={5}
                      className="bg-background/80 border-white/10 rounded-xl h-12 focus:ring-primary/20"
                    />
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1 flex items-center gap-1.5">
                       <Phone className="h-3.5 w-3.5" /> Mobile (Alt.)
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="Optional"
                      className="bg-background/80 border-white/10 rounded-xl h-12 focus:ring-primary/20"
                    />
                 </div>
              </div>

              {/* Institution Logic */}
              <div className="space-y-4">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  Current Education Level
                </Label>
                <Tabs 
                  defaultValue="college" 
                  onValueChange={(v) => setInstitutionType(v as 'school' | 'college')} 
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2 bg-muted/70 p-1 rounded-2xl h-13">
                    <TabsTrigger value="school" className="rounded-xl flex items-center gap-2 font-bold py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                       <School className="h-4 w-4" /> School
                    </TabsTrigger>
                    <TabsTrigger value="college" className="rounded-xl flex items-center gap-2 font-bold py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                       <GraduationCap className="h-4 w-4" /> College
                    </TabsTrigger>
                  </TabsList>
                  
                  <input type="hidden" name="institutionType" value={institutionType} />

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={institutionType}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="mt-4 space-y-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="institutionName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                          {institutionType === 'school' ? 'School Name' : 'College/University Name'}
                        </Label>
                        <Input
                          id="institutionName"
                          name="institutionName"
                          required
                          placeholder={institutionType === 'school' ? "e.g. Modern High School" : "e.g. Harvard University"}
                          className="bg-background/80 border-white/10 rounded-xl h-12"
                        />
                      </div>

                      {institutionType === 'school' ? (
                        <div className="space-y-2">
                          <Label htmlFor="classLevel" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                            Class / Grade
                          </Label>
                          <Input
                            id="classLevel"
                            name="classLevel"
                            required
                            placeholder="e.g. 10th Standard"
                            className="bg-background/80 border-white/10 rounded-xl h-12"
                          />
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="stream" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                               Stream / Major
                            </Label>
                            <Input
                              id="stream"
                              name="stream"
                              required
                              placeholder="e.g. Arts / B.Tech"
                              className="bg-background/80 border-white/10 rounded-xl h-12"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="year" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                               Year of Study
                            </Label>
                            <Input
                              id="year"
                              name="year"
                              required
                              placeholder="e.g. 2nd Year"
                              className="bg-background/80 border-white/10 rounded-xl h-12"
                            />
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </Tabs>
              </div>

               {/* AI Assistant Toggle */}
               <div className="p-4 bg-primary/5 border border-primary/10 rounded-3xl space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                       <Label htmlFor="aiImprovementEnabled" className="text-[13px] font-bold text-primary flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-amber-500" /> AI Assistant
                       </Label>
                       <p className="text-[10px] text-muted-foreground leading-tight">
                          Automatically improves your grammar & vocabulary as you write.
                       </p>
                    </div>
                    <input type="checkbox" name="aiImprovementEnabled" defaultChecked id="aiImprovementEnabled" className="hidden" />
                    {/* Visual Toggle */}
                    <div 
                      className="w-10 h-6 bg-primary/20 rounded-full relative cursor-pointer p-1"
                      onClick={() => {
                        const input = document.getElementById('aiImprovementEnabled') as HTMLInputElement;
                        input.click();
                        const toggle = document.getElementById('ai-toggle-ui');
                        if (toggle) toggle.classList.toggle('translate-x-4');
                      }}
                    >
                       <div id="ai-toggle-ui" className="w-4 h-4 bg-primary rounded-full transition-transform duration-200 translate-x-4 shadow-sm" />
                    </div>
                  </div>
                  <p className="text-[9px] font-semibold text-primary/60 italic border-t border-primary/10 pt-2 px-1 text-center">
                    💡 Tip: Turn this off to focus on improving your own writing skills!
                  </p>
               </div>
            </div>

            <DialogFooter className="flex-col gap-3 pt-4">
              <SubmitButton />
              <p className="text-[10px] text-center text-muted-foreground/70 px-4 font-bold">
                By completing your setup, you agree to our terms of service. You can update these details later in your full profile settings.
              </p>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Reuse the badge component for the header
function Badge({ className, variant, ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: 'outline' }) {
  return (
    <div 
        className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            variant === 'outline' ? "text-foreground" : "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
            className
        )} 
        {...props} 
    />
  );
}
