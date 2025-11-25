# SummaraX Setup Instructions

## Quick Start (2-Hour Setup)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Get Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### Step 3: Configure Environment
1. Open the `.env` file in the root directory
2. Replace `your_gemini_api_key_here` with your actual API key:
   ```
   REACT_APP_GEMINI_API_KEY=your_actual_api_key_here
   ```
3. Save the file

### Step 4: Start the Application
```bash
npm start
```

The app will open at `http://localhost:3000`

## Features Ready to Demo

### ✅ Summary Generation
- Short (50 words)
- Medium (120 words)  
- Detailed (250 words)

### ✅ MCQ Generation
- 5 multiple-choice questions
- 4 options each
- Answer keys
- Explanations

### ✅ Q&A Generation
- 5 short-answer questions
- 3 long-answer questions
- Detailed answers

### ✅ Revision Notes
- Key points extraction
- Formulas identification
- Key terms with definitions
- Core concepts summary

### ✅ Practice Questions
- Easy level (3 questions)
- Medium level (3 questions)
- Hard level (3 questions)

### ✅ Multiple File Format Support
- Upload PDF files (.pdf)
- Upload Word documents (.doc, .docx)
- Upload text files (.txt)
- Automatic text extraction
- Process up to 15,000 characters

## Usage Flow

1. **Navigate to Generator** (`/generator` page)
2. **Choose Generation Type** (Summary, MCQ, Q&A, Notes, Practice)
3. **Input Content**:
   - Upload PDF file, OR
   - Paste text directly
4. **Click Generate**
5. **View Results** in formatted output
6. **Download or Copy** the results

## Troubleshooting

### API Key Not Working
- Check if the key is correctly pasted in `.env`
- Ensure no spaces before/after the key
- Restart the development server after changing `.env`

### File Not Extracting
- **PDF**: Ensure the PDF contains selectable text (not scanned images)
- **Word**: Only .docx files (newer format) are fully supported
- **Text**: Make sure the file is not empty
- Try a smaller file
- Check browser console for errors

### Generation Taking Too Long
- Gemini 1.5 Flash is optimized for speed
- Large documents (>10,000 words) may take 10-30 seconds
- Check your internet connection

### No Output Displayed
- Check if API key is configured
- Look for error messages in red
- Open browser console (F12) for detailed errors

## API Costs

Gemini 1.5 Flash is **free** with generous limits:
- 15 requests per minute
- 1,500 requests per day
- Perfect for project demos!

## Demo Tips

1. **Prepare Sample Content**: Have 2-3 text samples ready (500-2000 words each)
2. **Show All Features**: Demonstrate each generation type
3. **Highlight Speed**: Gemini Flash responds in 3-10 seconds
4. **Show PDF Upload**: Have a sample PDF ready
5. **Export Results**: Show copy/download functionality

## File Structure

```
src/
├── api/
│   └── gemini.js          # Gemini API integration
├── utils/
│   └── pdfExtract.js      # PDF text extraction
├── components/
│   ├── Generator.js       # Main generation interface
│   ├── Dashboard.js       # User dashboard
│   ├── LandingPage.js     # Home page
│   └── ThemeSwitch.js     # Dark/Light mode toggle
└── App.js                 # Main app routing
```

## Next Steps (After Demo)

- [ ] Add user authentication
- [ ] Save generation history
- [ ] Export to PDF format
- [ ] Add more AI models
- [ ] Implement flashcard generation
- [ ] Add multi-language support

---

**Made with ❤️ for your presentation**
