// PDF Text Extraction using pdf.js
import * as pdfjsLib from 'pdfjs-dist';

// Set up the worker - use local copy from public folder
pdfjsLib.GlobalWorkerOptions.workerSrc = `${window.location.origin}/pdf.worker.min.js`;

/**
 * Extract text from a PDF file
 * @param {File} file - The PDF file object
 * @returns {Promise<string>} - Extracted text content
 */
export async function extractPdfText(file) {
  try {
    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    console.log(`PDF loaded: ${pdf.numPages} pages`);
    
    // Extract text from all pages
    const textPages = [];
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Combine text items with spaces
      const pageText = textContent.items
        .map(item => item.str)
        .join(' ')
        .trim();
      
      if (pageText) {
        textPages.push(`--- Page ${pageNum} ---\n${pageText}`);
      }
    }
    
    const fullText = textPages.join('\n\n');
    
    if (!fullText || fullText.trim().length === 0) {
      throw new Error("No text could be extracted from the PDF");
    }
    
    console.log(`Extracted ${fullText.length} characters from PDF`);
    return fullText;
    
  } catch (error) {
    console.error("PDF extraction error:", error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

/**
 * Validate if file is a PDF
 * @param {File} file - The file to validate
 * @returns {boolean}
 */
export function isPDF(file) {
  return file && file.type === 'application/pdf';
}

/**
 * Extract text from multiple file types
 * @param {File} file - The file object
 * @returns {Promise<string>} - Extracted text content
 */
export async function extractTextFromFile(file) {
  if (!file) {
    throw new Error("No file provided");
  }
  
  // Handle PDF files
  if (isPDF(file)) {
    return await extractPdfText(file);
  }
  
  // Handle text files (.txt, .doc, etc.)
  if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
    return await file.text();
  }
  
  // For other file types, try reading as text
  try {
    return await file.text();
  } catch (error) {
    throw new Error(`Unsupported file type: ${file.type}. Please upload PDF or TXT files.`);
  }
}

/**
 * Chunk large text into smaller pieces
 * @param {string} text - The text to chunk
 * @param {number} maxChunkSize - Maximum characters per chunk
 * @returns {string[]} - Array of text chunks
 */
export function chunkText(text, maxChunkSize = 15000) {
  if (text.length <= maxChunkSize) {
    return [text];
  }
  
  const chunks = [];
  let currentChunk = '';
  const sentences = text.split(/[.!?]\s+/);
  
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? '. ' : '') + sentence;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}
