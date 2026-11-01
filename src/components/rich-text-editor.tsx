
'use client';

import { useEditor, EditorContent, ReactNodeViewRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapImage from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import { useCallback, useEffect, useState } from 'react';
import { uploadMedia } from '@/app/journal/actions';
import { useToast } from '@/hooks/use-toast';
import { Bold, Italic, Strikethrough, Pilcrow, List, ListOrdered, ImageIcon, Loader2, Highlighter, X, Eraser } from 'lucide-react';
import { Button } from './ui/button';
import { Toggle } from './ui/toggle';
import { cn } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';
import { ImageNodeView } from './image-node-view';

type TiptapEditorProps = {
  content: any; // Tiptap content can be JSON
  onChange: (content: any) => void;
  onEditorReady?: (editor: any) => void;
  isEditable: boolean;
  allowHighlighting?: boolean; // New prop to strictly isolate features
  placeholder?: string;
  isPasteDisabled?: boolean;
};

// Create a custom image extension to add our node view and attributes
const CustomImage = TiptapImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(), // Keep existing attributes
      width: {
        default: '50%',
      },
      float: {
        default: 'none', // 'left', 'right', 'none'
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
});


const EditorToolbar = ({ editor, onAddImage, isUploading, allowHighlighting = false }: { editor: any, onAddImage: (file: File) => void, isUploading: boolean, allowHighlighting?: boolean }) => {
  if (!editor) {
    return null;
  }
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onAddImage(file);
    }
    // Reset file input to allow uploading the same file again
    event.target.value = '';
  };

  return (
    <div className="border border-input bg-transparent rounded-t-md p-1 flex flex-wrap items-center gap-1 max-w-full overflow-hidden">
      {allowHighlighting && <Toggle size="sm" pressed={editor.isActive('highlight')} onPressedChange={() => editor.chain().focus().toggleHighlight().run()}><Highlighter className="h-4 w-4" /></Toggle>}
      <Toggle size="sm" pressed={editor.isActive('bold')} onPressedChange={() => editor.chain().focus().toggleBold().run()}><Bold className="h-4 w-4" /></Toggle>
      <Toggle size="sm" pressed={editor.isActive('italic')} onPressedChange={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-4 w-4" /></Toggle>
      <Toggle size="sm" pressed={editor.isActive('strike')} onPressedChange={() => editor.chain().focus().toggleStrike().run()}><Strikethrough className="h-4 w-4" /></Toggle>
      <Toggle size="sm" pressed={editor.isActive('paragraph')} onPressedChange={() => editor.chain().focus().setParagraph().run()}><Pilcrow className="h-4 w-4" /></Toggle>
      <Toggle size="sm" pressed={editor.isActive('bulletList')} onPressedChange={() => editor.chain().focus().toggleBulletList().run()}><List className="h-4 w-4" /></Toggle>
      <Toggle size="sm" pressed={editor.isActive('orderedList')} onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-4 w-4" /></Toggle>

      <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="image-upload-input" />
      <Button asChild size="sm" variant="ghost" type="button" disabled={isUploading}>
        <label htmlFor="image-upload-input" className="cursor-pointer">
           {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
        </label>
      </Button>
    </div>
  );
};


export function TiptapEditor({ content, onChange, onEditorReady, isEditable, allowHighlighting = false, placeholder, isPasteDisabled = false }: TiptapEditorProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [markerStart, setMarkerStart] = useState<number | null>(null);
  const { toast } = useToast();
  
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Highlight.configure({
        HTMLAttributes: {
          class: 'teacher-highlight transition-all duration-300 rounded-px px-0.5',
        },
      }),
      CustomImage.configure({ // Using the custom image extension
        inline: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: content || '',
    editable: isEditable,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
    onCreate: ({ editor }) => {
      onEditorReady?.(editor);
    },
    editorProps: {
      attributes: {
        class: cn('prose dark:prose-invert max-w-none p-2 rounded-b-md focus:outline-none', { 'min-h-[250px]': isEditable }),
        // Disable paste-related attributes
        spellcheck: isPasteDisabled ? "false" : "true",
        autocorrect: isPasteDisabled ? "off" : "on",
        autocapitalize: isPasteDisabled ? "off" : "on",
        "data-gramm": "false", // For Grammarly
      },
       handlePaste: (view, event) => {
        if (isPasteDisabled) {
          event.preventDefault();
          toast({
            variant: "destructive",
            title: "Pasting is Disabled",
            description: "Please type your entry manually to ensure original thought.",
          });
          return true; // Indicates that the paste event has been handled
        }
        return false; // Allows default paste behavior
      },
    },
  });

  useEffect(() => {
    if (!editor || editor.isDestroyed) {
      return;
    }
    const isSame = JSON.stringify(editor.getJSON()) === JSON.stringify(content);
    if (!isSame) {
      editor.commands.setContent(content, false);
    }
  }, [content, editor]);

  useEffect(() => {
    if (editor && editor.isEditable !== isEditable) {
      editor.setEditable(isEditable);
    }
  }, [isEditable, editor]);

  const handleEditorClick = useCallback((event: React.MouseEvent) => {
    if (!editor || !isEditable || !allowHighlighting) return;

    // Use view.posAtCoords to get the precise position under the click/tap
    const pos = editor.view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
    if (pos === undefined) return;

    // Improved "Snap to Word" logic: Find word boundaries at the clicked position
    const { doc } = editor.state;
    const $pos = doc.resolve(pos);
    const parentNode = $pos.parent;
    const textAround = parentNode.textBetween(0, parentNode.content.size, undefined, "\ufffc");
    const relativePos = $pos.parentOffset;
    
    // Find start of word
    let startOffset = relativePos;
    while (startOffset > 0 && /\w/.test(textAround[startOffset - 1])) {
        startOffset--;
    }
    
    // Find end of word
    let endOffset = relativePos;
    while (endOffset < textAround.length && /\w/.test(textAround[endOffset])) {
        endOffset++;
    }

    const startPos = $pos.start() + startOffset;
    const endPos = $pos.start() + endOffset;

    if (markerStart === null) {
      setMarkerStart(startPos);
      toast({ 
        title: "Selection Started", 
        description: "Tap the end of the phrase.",
        duration: 2000
      });
    } else {
      const start = Math.min(markerStart, startPos);
      const end = Math.max(markerStart, endPos);
      
      // Select the range and immediately apply the highlight color
      if (allowHighlighting) {
        editor.chain().setTextSelection({ from: start, to: end }).focus().setHighlight().run();
        setMarkerStart(null);
        
        toast({ 
            title: "Selection Complete", 
            description: "Tap 'Cite Highlight' to add this to your feedback.",
            duration: 2000
        });
      } else {
        setMarkerStart(null);
      }
    }
  }, [editor, isEditable, markerStart, toast, allowHighlighting]);

  const clearMarker = useCallback(() => {
      setMarkerStart(null);
  }, []);


  const { toast: _toast } = useToast(); // Using local toast instead
  const addImage = useCallback(async (file: File) => {
    if (!file || !editor) return;

    setIsUploading(true);
    const toastId = toast({
      title: 'Uploading...',
      description: <div className='flex items-center gap-2'><Loader2 className="h-5 w-5 animate-spin" /> Your image is being uploaded.</div>,
    });

    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await uploadMedia(formData);

      if (result.error) {
        throw new Error(result.error);
      }
      
      if (result.signedUrl && result.fileName) {
        editor.chain().focus().setImage({ src: result.signedUrl, alt: result.fileName }).run();
        toastId.update({ id: toastId.id, title: 'Success', description: 'Image uploaded.' });
      } else {
        throw new Error('Upload succeeded but did not return a valid image URL.');
      }
    } catch (error) {
      toastId.update({ id: toastId.id, title: 'Upload Failed', description: error instanceof Error ? error.message : 'An unknown error occurred.', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  }, [editor, toast]);

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (isEditable && event.dataTransfer.files && event.dataTransfer.files[0]) {
      const file = event.dataTransfer.files[0];
      if (isPasteDisabled) {
        toast({
          variant: "destructive",
          title: "Pasting is Disabled",
          description: "Please type your entry manually.",
        });
        return;
      }
      if (file.type.startsWith('image/')) {
        addImage(file);
      }
    }
  };
  
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  if (!editor) {
    return <Skeleton className="h-[300px] w-full" />;
  }

  return (
    <div 
      className={cn('rounded-md border-0 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20', { 'border border-input': isEditable })}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {isEditable && <EditorToolbar editor={editor} onAddImage={addImage} isUploading={isUploading} allowHighlighting={allowHighlighting} />}
      <div 
        onClick={handleEditorClick} 
        onContextMenu={(e) => { e.preventDefault(); clearMarker(); }}
        className={cn("relative transition-all duration-300 group", markerStart !== null && "ring-2 ring-primary/20 bg-primary/5 rounded-b-md pt-12")}
      >
        {allowHighlighting && markerStart !== null && (
            <div className="absolute top-0 left-0 right-0 h-10 flex items-center justify-between p-1.5 px-4 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest rounded-t-md shadow-inner animate-in slide-in-from-top duration-300 z-50">
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-background rounded-full animate-pulse" />
                    <span>Selection Active: Tap End of Phrase</span>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); clearMarker(); }}
                  className="h-7 px-3 rounded-full bg-background/20 hover:bg-background/40 flex items-center justify-center transition-all gap-1 text-[8px]"
                >
                  <X className="h-3 w-3" />
                  Cancel
                </button>
            </div>
        )}
        <EditorContent editor={editor} className="break-words max-w-full" />
        {allowHighlighting && !isEditable && (
           <Button
              variant="ghost"
              size="sm"
              className="absolute bottom-2 right-2 h-7 px-2 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity bg-background/50 backdrop-blur-sm border border-primary/10 rounded-full flex items-center gap-1 hover:bg-destructive hover:text-white"
              onClick={(e) => { e.stopPropagation(); editor.chain().focus().unsetHighlight().run(); }}
           >
              <Eraser className="h-3 w-3" />
              Clear Highlights
           </Button>
        )}
      </div>
    </div>
  );
}

    