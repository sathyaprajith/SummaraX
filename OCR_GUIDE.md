# OCR Feature Guide

## Overview
SummaraX now supports **Optical Character Recognition (OCR)** to extract text from images within your documents and standalone image files.

## Supported File Types

### Documents with Images
- **PDF files** (.pdf) - Automatically detects pages with minimal text and runs OCR
- **Word documents** (.docx, .doc) - Extracts text from embedded images
- **Text files** (.txt) - Plain text extraction

### Image Files
- **JPEG/JPG** (.jpg, .jpeg)
- **PNG** (.png)
- **GIF** (.gif)
- **BMP** (.bmp)
- **WebP** (.webp)

## How It Works

### Automatic OCR Detection
1. **PDF Pages**: If a PDF page has less than 100 characters of extractable text, OCR automatically runs to capture text from images
2. **Word Documents**: All embedded images are processed with OCR and their text is appended
3. **Image Files**: Direct OCR processing extracts all visible text

### OCR Engine
- Uses **Tesseract.js** - Industry-standard open-source OCR engine
- Supports English language text recognition
- Processes images at 2x scale for better accuracy

## Usage

### Upload Files with Images
1. Click the upload area or drag and drop files
2. Select documents (PDF, Word) or image files
3. Wait for "Extracting text with OCR..." to complete
4. OCR text is automatically combined with regular text extraction

### Multi-File Analysis
- Upload multiple files (documents + images)
- Each file is processed independently with OCR
- Select which files to include in generation
- Combined text includes OCR-extracted content

### Example Use Cases
- **Scanned PDFs**: Extract text from scanned documents or screenshots
- **Lecture Slides**: Convert slide images to text for note generation
- **Handwritten Notes**: Process photos of handwritten content (accuracy varies)
- **Screenshots**: Extract text from app screenshots or diagrams
- **Mixed Documents**: PDFs with both text and embedded images

## Performance Notes

### First-Time Use
- OCR worker initializes on first use (~2-3 seconds)
- Subsequent OCR operations are faster
- Worker persists across multiple files

### Processing Time
- **Small images** (< 1MB): 1-3 seconds
- **Large images** (> 1MB): 3-10 seconds
- **PDFs with multiple pages**: 2-5 seconds per page with images
- **Word documents**: 1-2 seconds per embedded image

### Quality Tips
1. **Higher Resolution**: Better image quality = better OCR accuracy
2. **Clear Text**: Clean, printed text works best
3. **Good Contrast**: Black text on white background is ideal
4. **Minimal Skew**: Straight, un-rotated images work better
5. **Supported Languages**: Currently optimized for English

## Technical Details

### OCR Process Flow
```
1. File Upload → 2. File Type Detection → 3. Text Extraction
                                              ↓
4. If minimal text detected → 5. Convert to canvas/image data
                                              ↓
6. Run Tesseract OCR → 7. Combine with existing text → 8. Return combined result
```

### Memory Management
- OCR worker is created once and reused
- Automatically cleaned up when not needed
- Canvas elements are disposed after processing

### Error Handling
- Falls back to regular text extraction if OCR fails
- Continues processing even if individual images fail
- Logs detailed error messages for debugging

## Limitations

### Language Support
- Currently supports **English only**
- Multi-language support can be added by loading additional language packs

### Accuracy Factors
- Handwriting recognition varies by clarity
- Complex layouts may need manual review
- Very low-quality images may produce errors
- Decorative fonts may not be recognized well

### File Size
- Large image files take longer to process
- Consider compressing very large images (> 5MB)
- Multiple large files may cause temporary slowdown

## API Integration

### Using OCR in Code
```javascript
import { extractTextFromFile } from './utils/pdfExtract';

// Extract with OCR (default)
const text = await extractTextFromFile(file, true);

// Extract without OCR (faster for text-only documents)
const textOnly = await extractTextFromFile(file, false);
```

### Cleanup
```javascript
import { cleanupOCR } from './utils/pdfExtract';

// When done with OCR operations
await cleanupOCR();
```

## Troubleshooting

### OCR Not Working
1. Check browser console for errors
2. Ensure file is a supported image format
3. Try refreshing the page
4. Check network connection (first load downloads OCR engine)

### Slow Processing
1. Reduce image resolution before upload
2. Process fewer files at once
3. Close other browser tabs to free memory
4. Try smaller sections of large documents

### Poor OCR Quality
1. Use higher quality images
2. Increase image contrast
3. Ensure text is clearly visible
4. Avoid skewed or rotated images
5. Use clearer fonts

## Future Enhancements
- [ ] Multi-language support (Spanish, French, etc.)
- [ ] Progress indicator for long OCR operations
- [ ] Image preprocessing (auto-rotation, contrast adjustment)
- [ ] Batch OCR optimization
- [ ] OCR quality confidence scores
- [ ] Manual OCR retry option

## Resources
- [Tesseract.js Documentation](https://tesseract.projectnaptha.com/)
- [Image Quality Guidelines](https://tesseract-ocr.github.io/tessdoc/ImproveQuality.html)

---
**Note**: OCR processing happens in your browser - no images are sent to external servers for privacy.
