# OCR Feature Testing Guide

## Quick Test Steps

### 1. Test with Image Files
1. Take a screenshot of some text (e.g., from a website or document)
2. Save it as a `.jpg` or `.png` file
3. Go to the Generator page
4. Upload the image file
5. Wait for OCR to extract the text
6. Generate study materials from the extracted text

### 2. Test with PDF Containing Images
1. Create or find a PDF with embedded images/screenshots
2. Upload the PDF file
3. OCR will automatically detect pages with minimal text
4. Text from images will be extracted and combined
5. Generate content from the combined text

### 3. Test with Word Documents
1. Create a Word document with some text and embedded images
2. Upload the `.docx` file
3. Both text and image content will be extracted
4. Generate your desired study material

### 4. Test Multi-File Upload
1. Upload a mix of files:
   - A text-based PDF
   - An image file (screenshot)
   - A Word document with images
2. All files will be processed with OCR
3. Select which files to include
4. Generate combined content

## Expected Behavior

### Console Logs (Check Browser DevTools)
```
Processing file: screenshot.png (image/png)
Running OCR on image: screenshot.png
OCR worker initialized
Extracted 245 characters from image

Processing file: document.pdf (application/pdf)
PDF loaded: 3 pages
Page 2 has minimal text (45 chars), checking for images...
Running OCR on page 2...
OCR extracted 312 chars from page 2
Extracted 1567 characters from PDF
```

### Visual Feedback
- Upload button shows: "Extracting text with OCR..."
- File list shows extracted text length
- Selected files can be used for generation

### Success Indicators
✅ Images upload successfully
✅ Text is extracted from images
✅ OCR-extracted text appears in results
✅ Generation works with OCR content
✅ Multiple files process correctly

## Sample Test Images

### Create Test Images
1. **Simple Text**: Take screenshot of this text
2. **Mixed Content**: Screenshot with text + diagrams
3. **Lecture Slides**: Save PowerPoint slide as image
4. **Handwriting**: Photo of handwritten notes

### Good Test Sources
- Wikipedia article screenshots
- Code snippets from GitHub
- Email or document screenshots
- Printed text photos
- Presentation slides

## Performance Expectations

### Fast (< 3 seconds)
- Small images (< 500KB)
- Clear, simple text
- Single page PDFs

### Medium (3-8 seconds)
- Larger images (500KB - 2MB)
- Multi-page PDFs with images
- Word docs with multiple images

### Slower (8-15 seconds)
- Very large images (> 2MB)
- Many pages with images
- Complex layouts

## Troubleshooting

### No Text Extracted
**Issue**: OCR returns empty string
**Check**: 
- Is the image clear?
- Is there actual text in the image?
- Is the text in English?
**Fix**: Use higher quality images

### OCR Too Slow
**Issue**: Processing takes too long
**Check**:
- File size (should be < 5MB)
- Number of images/pages
- Browser performance
**Fix**: Reduce image size, process fewer files

### Errors in Console
**Issue**: JavaScript errors during OCR
**Check**:
- Browser console for specific error
- Network tab for failed downloads
**Fix**: Refresh page, check internet connection

## Manual Testing Checklist

### Image Files
- [ ] JPG file uploads successfully
- [ ] PNG file uploads successfully
- [ ] Text is extracted from image
- [ ] Generated content includes OCR text
- [ ] Multiple images can be uploaded

### PDF Files
- [ ] Text-only PDF works (no OCR needed)
- [ ] PDF with images triggers OCR
- [ ] Multi-page PDFs process all pages
- [ ] OCR text is combined with regular text
- [ ] Large PDFs complete without errors

### Word Documents
- [ ] Text-only Word doc works
- [ ] Word doc with images extracts both
- [ ] Image text is appended correctly
- [ ] Multiple images in one doc work
- [ ] Both .doc and .docx formats work

### Multi-File Upload
- [ ] Can select multiple files at once
- [ ] Each file processed independently
- [ ] OCR runs on applicable files
- [ ] File selection checkboxes work
- [ ] Combined text generation works

### UI/UX
- [ ] "Extracting text with OCR..." shows during processing
- [ ] File list displays after extraction
- [ ] File metadata shows correct info
- [ ] Theme toggle still works
- [ ] Error messages are clear

### Error Handling
- [ ] Unsupported file types rejected
- [ ] Empty images handled gracefully
- [ ] Failed OCR falls back to text extraction
- [ ] Network errors shown to user
- [ ] Large files don't crash browser

## Advanced Testing

### Edge Cases
1. **Very large image** (> 10MB): Should show warning or take long time
2. **Corrupted file**: Should show error message
3. **Non-English text**: May extract but accuracy varies
4. **Rotated image**: OCR may struggle, test with straight images
5. **Low resolution**: OCR accuracy decreases

### Browser Compatibility
Test in multiple browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if on Mac)

### Performance Under Load
- [ ] 5 files at once
- [ ] 10 files at once
- [ ] Multiple generations in sequence
- [ ] Memory usage stays reasonable

## Results Documentation

### What to Record
- File types tested: ___________
- Average OCR time: ___________
- Accuracy rating: ___________
- Any errors encountered: ___________
- Browser used: ___________
- Performance notes: ___________

### Success Criteria
✅ OCR extracts text from 90%+ of clear images
✅ Processing completes in reasonable time (< 10s per file)
✅ Generated content is usable and accurate
✅ No browser crashes or memory issues
✅ UI remains responsive during processing

---
**Note**: First OCR operation downloads the Tesseract engine (~2MB), subsequent operations are faster.
