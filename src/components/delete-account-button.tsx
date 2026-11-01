
'use client';

import { useEffect, useState, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { deleteAccount } from '@/app/profile/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

function DeleteButtonContent() {
    const { pending } = useFormStatus();
    return (
        <>
        {pending ? (
            <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
            </>
        ) : (
            'Continue'
        )}
        </>
    )
}


export function DeleteAccountButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction] = useActionState(deleteAccount, null);
  const { toast } = useToast();

  useEffect(() => {
    if (state?.error) {
      toast({
        variant: 'destructive',
        title: 'Deletion Failed',
        description: state.error,
      });
      setIsOpen(false);
    }
  }, [state, toast]);

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete Account</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <form action={formAction}>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                account and all associated data from our servers.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-4">
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction asChild>
                    <button type="submit">
                        <DeleteButtonContent />
                    </button>
                </AlertDialogAction>
            </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
