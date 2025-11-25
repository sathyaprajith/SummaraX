// File Text Extraction for PDF, Word, and Text files with OCR support
import * as pdfjsLib from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';

// Set up the worker - use local copy from public folder
pdfjsLib.GlobalWorkerOptions.workerSrc = `${window.location.origin}/pdf.worker.min.js`;

// Dynamically import mammoth only when needed
let mammoth = null;
const loadMammoth = async () => {
  if (!mammoth) {
    mammoth = await import('mammoth');
  }
  return mammoth;
};

// OCR Worker singleton
let ocrWorker = null;
const getOCRWorker = async () => {
  if (!ocrWorker) {
    console.log('Initializing OCR worker...');
    ocrWorker = await createWorker('eng');
    console.log('OCR worker initialized');
  }
  return ocrWorker;
};

/**
 * Extract text from images using OCR
 * @param {Uint8Array} imageData - Image data
 * @returns {Promise<string>} - Extracted text
 */
async function extractTextFromImage(imageData) {
  try {
    const worker = await getOCRWorker();
    const { data: { text } } = await worker.recognize(imageData);
    return text.trim();
  } catch (error) {
    console.error('OCR extraction error:', error);
    return '';
  }
}

/**
 * Extract text from a PDF file with OCR support for images
 * @param {File} file - The PDF file object
 * @param {boolean} useOCR - Whether to use OCR for images (default: true)
 * @returns {Promise<string>} - Extracted text content
 */
export async function extractPdfText(file, useOCR = true) {
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
      let pageText = textContent.items
        .map(item => item.str)
        .join(' ')
        .trim();
      
      // If page has little or no text and OCR is enabled, try OCR on images
      if (useOCR && pageText.length < 100) {
        console.log(`Page ${pageNum} has minimal text (${pageText.length} chars), checking for images...`);
        
        // Get images from the page
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;
        
        // Convert canvas to image data for OCR
        const imageData = canvas.toDataURL('image/png');
        console.log(`Running OCR on page ${pageNum}...`);
        const ocrText = await extractTextFromImage(imageData);
        
        if (ocrText && ocrText.length > pageText.length) {
          console.log(`OCR extracted ${ocrText.length} chars from page ${pageNum}`);
          pageText = ocrText;
        }
      }
      
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
 * Extract text from Word documents (.docx) with OCR for images
 * @param {File} file - The Word file object
 * @param {boolean} useOCR - Whether to use OCR for images (default: true)
 * @returns {Promise<string>} - Extracted text content
 */
export async function extractWordText(file, useOCR = true) {
  try {
    const mammothLib = await loadMammoth();
    const arrayBuffer = await file.arrayBuffer();
    
    // Extract text
    const textResult = await mammothLib.default.extractRawText({ arrayBuffer });
    let text = textResult.value || '';
    
    // If OCR is enabled and document has images, try to extract text from them
    if (useOCR) {
      try {
        // Convert document to HTML to access images
        const htmlResult = await mammothLib.default.convertToHtml({ arrayBuffer });
        const html = htmlResult.value;
        
        // Extract image data URLs from HTML
        const imgRegex = /<img[^>]+src="([^">]+)"/g;
        const matches = [...html.matchAll(imgRegex)];
        
        if (matches.length > 0) {
          console.log(`Found ${matches.length} images in Word document, running OCR...`);
          
          for (let i = 0; i < matches.length; i++) {
            const imgSrc = matches[i][1];
            if (imgSrc.startsWith('data:image')) {
              console.log(`Running OCR on image ${i + 1}...`);
              const ocrText = await extractTextFromImage(imgSrc);
              if (ocrText) {
                text += `\n\n--- Image ${i + 1} Text ---\n${ocrText}`;
              }
            }
          }
        }
      } catch (ocrError) {
        console.warn('OCR extraction from Word images failed:', ocrError);
        // Continue with text-only extraction
      }
    }
    
    if (!text || text.trim().length === 0) {
      throw new Error("No text could be extracted from the Word document");
    }
    
    console.log(`Extracted ${text.length} characters from Word document`);
    return text;
    
  } catch (error) {
    console.error("Word extraction error:", error);
    throw new Error(`Failed to extract text from Word document: ${error.message}`);
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
 * Validate if file is a Word document
 * @param {File} file - The file to validate
 * @returns {boolean}
 */
export function isWord(file) {
  if (!file) return false;
  return (
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.type === 'application/msword' ||
    file.name.endsWith('.docx') ||
    file.name.endsWith('.doc')
  );
}

/**
 * Validate if file is a text file
 * @param {File} file - The file to validate
 * @returns {boolean}
 */
export function isTextFile(file) {
  if (!file) return false;
  return (
    file.type === 'text/plain' ||
    file.name.endsWith('.txt')
  );
}

/**
 * Validate if file is an image
 * @param {File} file - The file to validate
 * @returns {boolean}
 */
export function isImage(file) {
  if (!file) return false;
  return (
    file.type.startsWith('image/') ||
    file.name.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)
  );
}

/**
 * Extract text from image files using OCR
 * @param {File} file - The image file object
 * @returns {Promise<string>} - Extracted text content
 */
export async function extractImageText(file) {
  try {
    console.log(`Running OCR on image: ${file.name}`);
    
    // Convert file to data URL
    const reader = new FileReader();
    const imageData = await new Promise((resolve, reject) => {
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    
    const text = await extractTextFromImage(imageData);
    
    if (!text || text.trim().length === 0) {
      throw new Error("No text could be extracted from the image");
    }
    
    console.log(`Extracted ${text.length} characters from image`);
    return text;
    
  } catch (error) {
    console.error("Image OCR error:", error);
    throw new Error(`Failed to extract text from image: ${error.message}`);
  }
}

/**
 * Extract text from multiple file types with OCR support
 * @param {File} file - The file object
 * @param {boolean} useOCR - Whether to use OCR for images (default: true)
 * @returns {Promise<string>} - Extracted text content
 */
export async function extractTextFromFile(file, useOCR = true) {
  if (!file) {
    throw new Error("No file provided");
  }
  
  console.log(`Processing file: ${file.name} (${file.type})`);
  
  // Handle PDF files
  if (isPDF(file)) {
    return await extractPdfText(file, useOCR);
  }
  
  // Handle Word documents
  if (isWord(file)) {
    return await extractWordText(file, useOCR);
  }
  
  // Handle text files
  if (isTextFile(file)) {
    const text = await file.text();
    if (!text || text.trim().length === 0) {
      throw new Error("Text file is empty");
    }
    console.log(`Extracted ${text.length} characters from text file`);
    return text;
  }
  
  // Handle image files with OCR
  if (isImage(file) && useOCR) {
    return await extractImageText(file);
  }
  
  // Unsupported file type
  throw new Error(`Unsupported file type: ${file.type}. Please upload PDF, Word (.doc/.docx), TXT, or image files.`);
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

/**
 * Cleanup OCR worker (call when done)
 */
export async function cleanupOCR() {
  if (ocrWorker) {
    console.log('Terminating OCR worker...');
    await ocrWorker.terminate();
    ocrWorker = null;
  }
}
