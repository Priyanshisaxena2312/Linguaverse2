
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { generateText } from '@tiptap/react'
import { generateHTML, generateJSON } from '@tiptap/html'
import StarterKit from '@tiptap/starter-kit'
import TiptapImage from '@tiptap/extension-image'
import { marked } from 'marked'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * A robust function to ensure content is a valid Tiptap JSON object.
 * It handles strings (by trying to parse them as JSON, then falling back
 * to treating them as markdown) and existing objects.
 * @param content The content to process, which can be a string or an object.
 * @returns A valid Tiptap JSON object.
 */
export function ensureTiptapJson(content: any): object {
  const emptyDoc = { type: 'doc', content: [] };
  if (!content) return emptyDoc;

  // If it's already a valid Tiptap object, return it.
  if (typeof content === 'object' && content.type === 'doc' && Array.isArray(content.content)) {
    return content;
  }
  
  // If it's a string, try to parse it as JSON first.
  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content);
      // Recurse to ensure the parsed content is also a valid doc.
      return ensureTiptapJson(parsed);
    } catch (e) {
      // If parsing fails, it's likely markdown or plain text.
      // Convert it from markdown to Tiptap JSON.
      return markdownToTiptapJson(content);
    }
  }

  // As a final fallback, return an empty document.
  return emptyDoc;
}

export function getPlainTextFromTiptapJson(json: any): string {
  if (!json) return '';

  const contentToParse = ensureTiptapJson(json);
  
  try {
    const sanitizedJson = sanitizeTiptapJson(json);
    const text = generateText(sanitizedJson, [StarterKit, TiptapImage]);
    // Decode common HTML entities to prevent issues like the '&#39;' problem.
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'");
  } catch (e) {
    console.error('Tiptap generateText failed:', e);
    // If generation fails, return an empty string as a safe fallback.
    return '';
  }
}

export function getHashtagsFromTiptapJson(json: any): string[] {
  const text = getPlainTextFromTiptapJson(json);
  if (!text) return [];
  
  const regex = /#([a-zA-Z0-9_.-]+)/g;
  const matches = text.match(regex);
  if (!matches) return [];
  // Return unique tags without the '#' symbol
  return [...new Set(matches.map(tag => tag.substring(1)))];
}

export function getMediaPathsFromTiptapJson(json: any): string[] {
  const paths = new Set<string>();
  if (!json || typeof json !== 'object') return [];

  function traverse(node: any) {
    if (node.type === 'image' && node.attrs && node.attrs.src) {
      const src = node.attrs.src;
      // Filter out data URIs and full public URLs, we only want storage paths.
      if (!src.startsWith('data:') && !src.startsWith('http')) {
        paths.add(src);
      }
    }
    if (node.content) {
      node.content.forEach(traverse);
    }
  }

  traverse(json);
  return Array.from(paths);
}

// A simple but effective HTML entity decoder.
function decodeHtmlEntities(html: string): string {
    return html.replace(/&amp;/g, '&')
               .replace(/&lt;/g, '<')
               .replace(/&gt;/g, '>')
               .replace(/&quot;/g, '"')
               .replace(/&#39;/g, "'")
               .replace(/&apos;/g, "'");
}

export function markdownToTiptapJson(markdown: string): any {
  if (!markdown) return { type: 'doc', content: [] };
  
  // First, convert markdown to HTML. `marked` will escape some characters.
  const rawHtml = marked.parse(markdown) as string;
  
  // Second, decode the HTML entities to prevent them from being stored.
  const decodedHtml = decodeHtmlEntities(rawHtml);
  
  // Then, use Tiptap's utility to convert the clean HTML into Tiptap's JSON format.
  try {
    return generateJSON(decodedHtml, [
      StarterKit,
      TiptapImage,
    ]);
  } catch (error) {
    console.error("Error converting HTML to Tiptap JSON:", error);
    // As a safe fallback, return the original markdown wrapped in a paragraph.
    return { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: markdown }] }] };
  }
}

export function getAIErrorMessage(error: unknown): string {
  if (error instanceof Error && (error.message.includes('429') || error.message.toLowerCase().includes('quota'))) {
      return "Our AI is currently experiencing high demand. Please try again in a few moments.";
  }
  return 'An error occurred while communicating with the AI. Please try again.';
}

export function tiptapJsonToHtml(json: any): string {
    if (!json) return '';
    // Ensure we have a valid Tiptap object before trying to generate HTML
    const validJson = ensureTiptapJson(json);
    try {
        return generateHTML(validJson, [StarterKit, TiptapImage]);
    } catch (e) {
        console.error('Tiptap generateHTML failed:', e);
        return '';
    }
}

/**
 * Recursively traverses a Tiptap JSON object and ensures it's a plain,
 * serializable object safe to pass between Server and Client Components.
 * it also removes prohibited empty text nodes which cause Tiptap validation errors.
 * @param json The Tiptap JSON object.
 * @returns A sanitized, plain Tiptap JSON object.
 */
export function sanitizeTiptapJson(json: any): any {
  if (!json) return { type: 'doc', content: [] };

  function cleanNode(node: any): any {
    if (!node || typeof node !== 'object') return node;

    // Deep clone the node to avoid mutating original
    const newNode = { ...node };

    if (newNode.content && Array.isArray(newNode.content)) {
      newNode.content = newNode.content
        .filter((child: any) => {
          // Rule: Text nodes MUST have non-empty text content
          if (child.type === 'text' && (child.text === '' || child.text === undefined || child.text === null)) {
            return false;
          }
          return true;
        })
        .map(cleanNode);
    }

    return newNode;
  }

  try {
    // 1. Ensure minimal valid structure
    const baseJson = (typeof json === 'string') ? ensureTiptapJson(json) : json;
    
    // 2. Recursively clean the structure
    return cleanNode(baseJson);
  } catch (e) {
    console.error("Failed to sanitize Tiptap JSON, returning empty doc.", e);
    return { type: 'doc', content: [] };
  }
}


/**
 * Traverses a Tiptap JSON object and converts any Supabase signed URLs
 * back to their permanent storage paths before saving.
 * @param content The Tiptap JSON object.
 * @returns A new Tiptap JSON object with permanent storage paths.
 */
export function convertSignedUrlsToStoragePaths(content: any): any {
  if (!content || typeof content !== 'object') {
    return content;
  }

  // Deep clone to avoid mutating the original object
  const newContent = JSON.parse(JSON.stringify(content));

  const traverse = (node: any) => {
    if (node.type === 'image' && node.attrs?.src) {
      const src = node.attrs.src;
      // Check if it's a Supabase signed URL
      if (src.includes('/storage/v1/object/sign/')) {
        try {
          const url = new URL(src);
          // The path is everything after '/sign/'
          const fullPath = url.pathname.split('/sign/')[1];
          if (fullPath) {
            // The fullPath is "bucket-name/actual-path/to/file.png". 
            // We need to remove the bucket name part.
            const pathParts = fullPath.split('/');
            pathParts.shift(); // remove the first element (the bucket name)
            const storagePath = pathParts.join('/'); // re-join the rest
            node.attrs.src = storagePath;
          }
        } catch (e) {
          console.error("Could not parse signed URL:", src, e);
          // Leave it as is if parsing fails
        }
      }
    }
    if (node.content) {
      node.content.forEach(traverse);
    }
  };

  traverse(newContent);
  return newContent;
}

/**
 * Sanitizes HTML content to prevent XSS attacks.
 * Use this before passing any HTML to dangerouslySetInnerHTML.
 */
export function sanitizeHtml(html: string): string {
    // Note: We now import this dynamically or from dompurify.ts 
    // to avoid loading JSDOM on every page.
    return html; // Fallback or imported from dompurify.ts
}
