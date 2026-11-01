
'use client';

import { useEffect, useState, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { getProfile, updateProfile, deleteAllEntries } from './actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { User, Edit, Save, XCircle, Loader2, AlertTriangle, Trash2, Wand2, Info, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { DeleteAccountButton } from '@/components/delete-account-button';
import type { Profile } from '@/lib/types';
import { SignOutButton } from '@/app/auth/sign-out-button';
import { Switch } from '@/components/ui/switch';
import { FooterContent } from '@/components/footer-content';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InstallPwaButton } from '@/components/install-pwa-button';

type ProfileData = Profile & { email: string | null };

function SubmitButton({ isSetup }: { isSetup: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
        </>
      ) : (
        <>
          <Save className="mr-2 h-4 w-4" /> {isSetup ? 'Complete Setup & Save' : 'Save Changes'}
        </>
      )}
    </Button>
  );
}

function DeleteEntriesButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" variant="destructive" disabled={pending}>
        {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Clearing Data...</> : <><Trash2 className="mr-2 h-4 w-4" /> Delete All My Entries</>}
        </Button>
    )
}


export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  const [updateState, updateFormAction] = useActionState(updateProfile, null);
  const [deleteEntriesState, deleteEntriesAction] = useActionState(deleteAllEntries, null);
  const { toast } = useToast();

  const fetchProfile = async () => {
    setIsLoading(true);
    const data = await getProfile();
    if (data) {
        setProfile(data as ProfileData);
        // If profile is not complete, automatically enter editing mode.
        if (!data.profile_setup_complete) {
            setIsEditing(true);
        }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (updateState?.error) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: updateState.error,
      });
    }
    if (updateState?.message) {
      toast({
        title: 'Success',
        description: updateState.message,
      });
      setIsEditing(false);
      fetchProfile();
    }
  }, [updateState, toast]);


   useEffect(() => {
    if (deleteEntriesState?.error) {
      toast({ variant: 'destructive', title: 'Error', description: deleteEntriesState.error });
    }
    if (deleteEntriesState?.message) {
      toast({ title: 'Success', description: deleteEntriesState.message });
      fetchProfile(); // Refresh profile to show reset state
    }
  }, [deleteEntriesState, toast]);

  const handleAiAnalysisToggle = (checked: boolean) => {
    const formData = new FormData();
    formData.append('aiAnalysisEnabled', checked ? 'on' : 'off');
    // We use a form action to submit the change
    updateFormAction(formData);
  };

  if (isLoading) {
    return (
       <div className="container mx-auto max-w-2xl p-4 sm:p-6 md:p-8">
        <header className="mb-8 text-center">
            <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl font-bold text-primary flex items-center gap-3 justify-center">
                <User className="h-10 w-10" /> Your Profile
            </h1>
            <p className="mt-2 text-xl text-muted-foreground">View and manage your account details.</p>
        </header>
        <Card>
            <CardHeader><Skeleton className="h-8 w-48" /></CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
                <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
            </CardContent>
            <CardFooter><Skeleton className="h-10 w-28" /></CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <>
      <div className="container mx-auto max-w-2xl p-4 sm:p-6 md:p-8 space-y-8">
        <header className="text-center">
          <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl font-bold text-primary flex items-center gap-3 justify-center">
              <User className="h-10 w-10" /> Your Profile
          </h1>
          <p className="mt-2 text-xl text-muted-foreground">View and manage your account details.</p>
        </header>
        
        {profile ? (
          <>
             {isEditing && !profile.profile_setup_complete && (
                <Alert variant="default" className="border-primary/50">
                    <AlertTitle className="font-bold">Complete Your Profile</AlertTitle>
                    <AlertDescription>
                        Please provide your Age, Institution details, and set a new password to get started.
                    </AlertDescription>
                </Alert>
             )}
            <Card>
              <form action={updateFormAction}>
                  <CardHeader>
                      <CardTitle className="font-headline text-2xl">{profile.full_name || 'Your Profile'}</CardTitle>
                      <CardDescription className="text-base">This is the information associated with your account.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                      <div className="grid items-start gap-y-2 gap-x-4 md:grid-cols-[150px_1fr] md:items-center">
                          <Label htmlFor="fullName" className="md:text-right">Full Name</Label>
                          <Input id="fullName" name="fullName" defaultValue={profile.full_name || ''} readOnly={!isEditing} required className="text-base font-body" />
                      </div>
                      <div className="grid items-start gap-y-2 gap-x-4 md:grid-cols-[150px_1fr] md:items-center">
                          <Label htmlFor="loginEmail" className="md:text-right">Login Email</Label>
                          <Input id="loginEmail" value={profile.email || ''} readOnly className="text-base font-body bg-muted/50" />
                      </div>

                      <div className="grid grid-cols-2 gap-4 md:grid-cols-[150px_1fr_150px_1fr] items-center">
                          <Label htmlFor="age" className="md:text-right">Age</Label>
                          <Input id="age" name="age" type="number" defaultValue={profile.age || ''} readOnly={!isEditing} required className="text-base font-body" />
                          
                          <Label htmlFor="phone" className="md:text-right">Phone</Label>
                          <Input id="phone" name="phone" type="tel" defaultValue={profile.phone || ''} readOnly={!isEditing} placeholder="Optional" className="text-base font-body" />
                      </div>

                      <div className="grid items-start gap-y-2 gap-x-4 md:grid-cols-[150px_1fr] md:items-center">
                          <Label htmlFor="institutionType" className="md:text-right">I am a...</Label>
                          <div className="flex items-center gap-4">
                              <label className="flex items-center gap-2 cursor-pointer">
                                  <input 
                                    type="radio" 
                                    name="institutionType" 
                                    value="school" 
                                    disabled={!isEditing}
                                    checked={profile.institution_type === 'school'} 
                                    readOnly 
                                  />
                                  <span>School Student</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                  <input 
                                    type="radio" 
                                    name="institutionType" 
                                    value="college"
                                    disabled={!isEditing}
                                    checked={profile.institution_type === 'college'} 
                                    readOnly
                                  />
                                  <span>College Student</span>
                              </label>
                          </div>
                      </div>

                      <div className="grid items-start gap-y-2 gap-x-4 md:grid-cols-[150px_1fr] md:items-center">
                          <Label htmlFor="institutionName" className="md:text-right">
                              {profile.institution_type === 'school' ? 'School Name' : 'College Name'}
                          </Label>
                          <Input id="institutionName" name="institutionName" defaultValue={profile.institution_name || ''} readOnly={!isEditing} required className="text-base font-body" />
                      </div>

                      {profile.institution_type === 'school' ? (
                          <div className="grid items-start gap-y-2 gap-x-4 md:grid-cols-[150px_1fr] md:items-center">
                              <Label htmlFor="classLevel" className="md:text-right">Class / Grade</Label>
                              <Input id="classLevel" name="classLevel" defaultValue={profile.class_level || ''} readOnly={!isEditing} required className="text-base font-body" />
                          </div>
                      ) : (
                          <div className="grid grid-cols-2 gap-4 md:grid-cols-[150px_1fr_150px_1fr] items-center">
                              <Label htmlFor="stream" className="md:text-right">Stream / Major</Label>
                              <Input id="stream" name="stream" defaultValue={profile.stream || ''} readOnly={!isEditing} required className="text-base font-body" />
                              
                              <Label htmlFor="year" className="md:text-right">Year</Label>
                              <Input id="year" name="year" defaultValue={profile.year || ''} readOnly={!isEditing} required className="text-base font-body" />
                          </div>
                      )}

                      {isEditing && (
                           <div className="grid items-start gap-y-2 gap-x-4 md:grid-cols-[120px_1fr] md:items-center">
                                <Label htmlFor="newPassword" className={`md:text-right font-semibold ${!profile.profile_setup_complete ? 'text-destructive' : 'text-primary'}`}>
                                    { !profile.profile_setup_complete ? 'Set Password*' : 'New Password (Optional)'}
                                </Label>
                                <Input id="newPassword" name="newPassword" type="password" placeholder="Leave blank to keep current" minLength={8} className="text-base font-body border-primary/50" required={!profile.profile_setup_complete} />
                           </div>
                      )}
                  </CardContent>
                  <CardFooter className="flex justify-end items-center gap-2">
                      {isEditing ? (
                          <>
                          <Button type="button" variant="outline" onClick={() => setIsEditing(false)}><XCircle className="mr-2 h-4 w-4" /> Cancel</Button>
                          <SubmitButton isSetup={!profile.profile_setup_complete} />
                          </>
                      ) : (
                          <Button type="button" onClick={() => setIsEditing(true)}><Edit className="mr-2 h-4 w-4" /> Edit Profile</Button>
                      )}
                  </CardFooter>
              </form>
               <div className="px-6 pb-6 pt-0 md:hidden border-t mt-4 pt-4">
                <SignOutButton />
              </div>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Focus & AI Settings</CardTitle>
                    <CardDescription>Customize how AI assists your language learning journey.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">


                     <div className="flex items-center justify-between rounded-2xl border p-4">
                        <div className="space-y-0.5">
                            <Label className="flex items-center gap-2 font-bold italic">Install App</Label>
                            <p className="text-xs text-muted-foreground">
                                Add Linguaverse to your homescreen for quick access.
                            </p>
                        </div>
                        <InstallPwaButton />
                    </div>
                </CardContent>
              </Card>
          </>
        ) : (
          <p className="text-xl text-center p-4">Could not load profile information.</p>
        )}

          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="font-headline text-xl text-destructive flex items-center gap-2">
                <AlertTriangle />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CardDescription>
                Permanently delete your account or all entries. These actions are irreversible.
              </CardDescription>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-2">
              <form action={deleteEntriesAction}>
                <DeleteEntriesButton />
              </form>
              <DeleteAccountButton />
            </CardFooter>
          </Card>
      </div>
      <FooterContent user={profile as SupabaseUser | null} />
    </>
  );
}
