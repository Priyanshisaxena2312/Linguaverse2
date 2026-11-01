
'use client';

import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { uploadMedia } from '@/app/journal/actions';
import { Loader2 } from 'lucide-react';

type ImageUploadDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSkip: () => void;
  onUploadComplete: (name: string, signedUrl: string) => void;
};

export function ImageUploadDialog({ isOpen, onClose, onSkip, onUploadComplete }: ImageUploadDialogProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await uploadMedia(formData);

      if (result.error) {
        throw new Error(result.error);
      }
      
      if (result.fileName && result.signedUrl) {
        toast({ title: 'Upload Successful', description: `${result.fileName} has been attached.` });
        onUploadComplete(result.fileName, result.signedUrl);
      } else {
        throw new Error('Upload succeeded but did not return valid media information.');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Attach an Image or Audio?</DialogTitle>
          <DialogDescription>
            As a premium user, you can attach one media file to this journal entry. It will be added after the AI generates the text.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="media-upload" className="sr-only">Upload Media</Label>
          <Input id="media-upload" type="file" ref={fileInputRef} onChange={handleFileChange} disabled={isUploading} accept="image/*,audio/*" />
          {isUploading && (
            <div className="flex items-center justify-center mt-4 text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onSkip} disabled={isUploading}>
            Generate without Media
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
