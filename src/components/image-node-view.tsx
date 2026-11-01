
'use client'

import React, { useRef } from 'react'
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Replace, Trash2, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { uploadMedia } from '@/app/journal/actions'

// Inline SVG icons for layout controls
const FloatLeftIcon = () => <svg viewBox="0 0 16 16" fill="currentColor" className="h-5 w-5"><path d="M0 4h3v8H0V4zm4 0h12v2H4V4zm0 4h8v2H4V8zm0 4h12v2H4v-2z"></path></svg>
const FloatRightIcon = () => <svg viewBox="0 0 16 16" fill="currentColor" className="h-5 w-5"><path d="M13 4h3v8h-3V4zM0 4h12v2H0V4zm0 4h8v2H0V8zm0 4h12v2H0v-2z"></path></svg>
const CenterIcon = () => <svg viewBox="0 0 16 16" fill="currentColor" className="h-5 w-5"><path d="M2 3h12v2H2V3zm0 4h12v2H2V7zm4 4h4v2H6v-2zm-4 3h12v2H2v-2z"></path></svg>

export const ImageNodeView = ({ node, updateAttributes, deleteNode, editor }: NodeViewProps) => {
  const { src, alt, width, float } = node.attrs
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFloat = (newFloat: 'left' | 'right' | 'none') => {
    updateAttributes({ float: newFloat })
  }

  const handleSize = (newWidth: string) => {
    updateAttributes({ width: newWidth })
  }

  const handleReplaceImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const toastId = toast({
      title: 'Uploading...',
      description: <div className='flex items-center gap-2'><Loader2 className="h-5 w-5 animate-spin" /> Your image is being uploaded.</div>,
    });

    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await uploadMedia(formData);

      if (result.error) throw new Error(result.error);
      
      if (result.signedUrl && result.fileName) {
        updateAttributes({ src: result.signedUrl, alt: result.fileName });
        toastId.update({ id: toastId.id, title: 'Success', description: 'Image replaced.' });
      } else {
        throw new Error('Upload succeeded but did not return valid media information.');
      }
    } catch (error) {
      toastId.update({ id: toastId.id, title: 'Upload Failed', description: error instanceof Error ? error.message : 'An unknown error occurred.', variant: 'destructive' });
    }
  };

  return (
    <NodeViewWrapper
      className={cn(
        'image-node-view my-4 group relative clear-both',
        {
          'float-left mr-4 mb-2': float === 'left',
          'float-right ml-4 mb-2': float === 'right',
          'mx-auto block': float === 'none',
        }
      )}
      style={{ width: width || '50%' }}
      data-drag-handle
    >
      <div className={cn('relative rounded-md', { 'outline outline-2 outline-primary outline-offset-2': editor.isFocused && editor.isActive('image') })}>
        <img src={src} alt={alt} className="rounded-md block" />

        <div className="absolute top-2 right-2 flex items-center gap-1 p-1 bg-background/80 border rounded-md opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200 z-10">
           <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="hidden"
            onChange={handleReplaceImage}
          />
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => fileInputRef.current?.click()} title="Replace Image">
            <Replace className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={deleteNode} title="Delete Image">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
        
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1 bg-background/80 border rounded-md opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200 z-10">
          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => handleSize('25%')} data-active={width === '25%'}>S</Button>
          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => handleSize('50%')} data-active={width === '50%'}>M</Button>
          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => handleSize('75%')} data-active={width === '75%'}>L</Button>
          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => handleSize('100%')} data-active={width === '100%'}>XL</Button>

          <div className="h-5 w-px bg-border mx-1"></div>
          
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleFloat('left')} data-active={float === 'left'} title="Float Left">
            <FloatLeftIcon />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleFloat('none')} data-active={float === 'none'} title="Center (no wrap)">
            <CenterIcon />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleFloat('right')} data-active={float === 'right'} title="Float Right">
            <FloatRightIcon />
          </Button>
        </div>
      </div>
    </NodeViewWrapper>
  )
}
