import jsPDF from 'jspdf';
import { getPlainTextFromTiptapJson } from '@/lib/utils';
import type { JournalEntry } from '@/lib/types';

export interface PDFExportOptions {
  authorName: string;
  authorEmail?: string;
  fileName?: string;
}

/**
 * Generates and downloads a PDF of the provided journal entries.
 * Note: This function must be called from the client side.
 */
export async function generateJournalPDF(entries: JournalEntry[], options: PDFExportOptions) {
  const { authorName, authorEmail = '', fileName = `journal-export-${new Date().toISOString().split('T')[0]}.pdf` } = options;
  
  const pdf = new jsPDF('p', 'mm', 'a4');
  const margin = 15;
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const usableWidth = pdfWidth - margin * 2;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (i > 0) {
      pdf.addPage();
    }

    let yPos = margin;

    // --- RENDER HEADER ---
    const entryDate = new Date(entry.created_at).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
    });

    pdf.setFontSize(10).setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100); // Light gray for metadata
    pdf.text(entryDate, margin, yPos);
    pdf.text(authorName, pdfWidth - margin, yPos, { align: 'right' });
    if (authorEmail) {
      pdf.text(authorEmail, pdfWidth - margin, yPos + 5, { align: 'right' });
    }

    yPos += 15;
    pdf.setDrawColor(221, 221, 221); // #ddd
    pdf.line(margin, yPos, pdfWidth - margin, yPos);
    yPos += 10;

    // --- RENDER TITLE ---
    pdf.setFontSize(22).setFont('helvetica', 'bold');
    pdf.setTextColor('#a47c5b'); // App's primary color
    const titleLines = pdf.splitTextToSize(entry.title || 'Untitled Entry', usableWidth);
    pdf.text(titleLines, margin, yPos);
    yPos += (titleLines.length * 8); // Adjust line height for title

    yPos += 5; // Space before content

    // --- RENDER CONTENT ---
    pdf.setFontSize(12).setFont('helvetica', 'normal');
    pdf.setTextColor(40, 40, 40); // Reset to dark gray for body
    const plainTextContent = getPlainTextFromTiptapJson(entry.content);
    const contentLines = pdf.splitTextToSize(plainTextContent, usableWidth);

    for (const line of contentLines) {
      if (yPos > pdfHeight - margin) {
        pdf.addPage();
        yPos = margin;
      }
      pdf.text(line, margin, yPos);
      yPos += 7; // Line height for content
    }
  }

  pdf.save(fileName);
}
