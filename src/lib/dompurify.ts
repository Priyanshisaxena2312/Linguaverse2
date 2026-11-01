import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitizes HTML content using DOMPurify.
 * Isolated in this file to prevent JSDOM dependencies from being loaded
 * into the main utils.ts and crashing pages that don't need it.
 */
export function sanitizeHtml(html: string): string {
    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
            'p', 'br', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li', 'span', 'div',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img', 'blockquote', 'code', 'pre'
        ],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target']
    });
}
