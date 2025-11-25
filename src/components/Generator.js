import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Generator.css";
import ThemeSwitch from "./ThemeSwitch";
import { generateContent, isAPIConfigured, getAPIKeyInfo } from "../api/gemini";
import { extractTextFromFile, isPDF } from "../utils/pdfExtract";
import { useTheme } from "../context/ThemeContext";

const Generator = () => {
  const { isDarkMode } = useTheme();
  const [uploadedFiles, setUploadedFiles] = useState([]); // Array of {file, text, selected, id}
  const [inputText, setInputText] = useState('');
  const [generationType, setGenerationType] = useState('summary');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [apiKeyInfo, setApiKeyInfo] = useState({ total: 0, current: 1 });
  const navigate = useNavigate();

  useEffect(() => {
    // Get API key info on mount
    setApiKeyInfo(getAPIKeyInfo());
  }, []);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setError(null);
    setIsExtracting(true);

    const newFiles = [];

    for (const file of files) {
      try {
        const extractedText = await extractTextFromFile(file);
        newFiles.push({
          id: Date.now() + Math.random(), // Unique ID
          file: file,
          text: extractedText,
          selected: true, // Selected by default
          name: file.name,
          size: file.size,
          type: file.type
        });
      } catch (err) {
        setError(`Failed to extract ${file.name}: ${err.message}`);
      }
    }

    setUploadedFiles(prev => [...prev, ...newFiles]);
    setIsExtracting(false);

    // Clear the input to allow re-uploading the same file
    e.target.value = '';
  };

  const toggleFileSelection = (id) => {
    setUploadedFiles(prev =>
      prev.map(file =>
        file.id === id ? { ...file, selected: !file.selected } : file
      )
    );
  };

  const removeFile = (id) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== id));
  };

  const selectAllFiles = () => {
    setUploadedFiles(prev => prev.map(file => ({ ...file, selected: true })));
  };

  const deselectAllFiles = () => {
    setUploadedFiles(prev => prev.map(file => ({ ...file, selected: false })));
  };

  const getSelectedText = () => {
    const selectedFiles = uploadedFiles.filter(f => f.selected);
    if (selectedFiles.length === 0 && inputText.trim()) {
      return inputText;
    }
    
    const combinedText = selectedFiles.map(f => 
      `--- ${f.name} ---\n${f.text}`
    ).join('\n\n');
    
    return combinedText || inputText;
  };

  const handleGenerate = async () => {
    // Check if API is configured
    if (!isAPIConfigured()) {
      setError("Please configure your Gemini API key in the .env file");
      return;
    }

    // Get combined text from selected files or manual input
    let textToAnalyze = getSelectedText();

    // Check if there's input
    if (!textToAnalyze || textToAnalyze.trim().length === 0) {
      setError("Please provide some text or upload and select files");
      return;
    }

    // Check if any files are selected
    const selectedCount = uploadedFiles.filter(f => f.selected).length;
    if (uploadedFiles.length > 0 && selectedCount === 0) {
      setError("Please select at least one file to analyze");
      return;
    }

    // Warn about very large text (more than 20,000 characters)
    if (textToAnalyze.length > 20000) {
      const shouldContinue = window.confirm(
        `⚠️ Large Document Detected (${textToAnalyze.length.toLocaleString()} characters)\n\n` +
        `This may take longer to process and could hit API limits.\n\n` +
        `Options:\n` +
        `• Click OK to use first 20,000 characters\n` +
        `• Click Cancel to select fewer files\n\n` +
        `Tip: Try selecting 1-2 files at a time for better results.`
      );
      
      if (!shouldContinue) {
        return;
      }
      
      // Truncate to 20,000 characters with smart sentence boundary
      textToAnalyze = textToAnalyze.substring(0, 20000);
      const lastPeriod = textToAnalyze.lastIndexOf('.');
      if (lastPeriod > 15000) {
        textToAnalyze = textToAnalyze.substring(0, lastPeriod + 1);
      }
      textToAnalyze += "\n\n[Note: Text truncated to 20,000 characters]";
    }

    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      // Call Gemini API
      const generatedContent = await generateContent(generationType, textToAnalyze);

      setResult({
        type: generationType,
        content: generatedContent,
        raw: generatedContent.raw || null,
      });
    } catch (err) {
      // Better error message for MAX_TOKENS
      if (err.message.includes('MAX_TOKENS')) {
        setError(
          "⚠️ Document too large! The AI ran out of tokens.\n\n" +
          "Solutions:\n" +
          "• Select fewer files (try 1-2 at a time)\n" +
          "• Split large documents into smaller sections\n" +
          "• Use shorter text for generation"
        );
      } else {
        setError(err.message);
      }
      console.error("Generation error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyResult = () => {
    const textToCopy = JSON.stringify(result.content, null, 2);
    navigator.clipboard.writeText(textToCopy);
    alert("Copied to clipboard!");
  };

  const handleDownloadResult = () => {
    const dataStr = JSON.stringify(result.content, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `summarax-${result.type}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`generator ${isDarkMode ? "dark-mode" : "light-mode"}`}>
      {/* Header */}
      <header className="generator-header">
        <div className="container">
          <div className="header-content">
            <div className="logo" onClick={() => navigate("/")}>
              SummaraX
            </div>
            <nav className="nav">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/");
                }}
              >
                Home
              </a>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/dashboard");
                }}
              >
                Dashboard
              </a>
              <a href="#" className="active">
                Generator
              </a>
            </nav>
            <div className="header-actions">
              <ThemeSwitch />
              <div className="user-profile">
                <div className="avatar">S</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="generator-main">
        <div className="container">
          <div className="generator-layout">
            {/* Left Panel - Input */}
            <div className="input-panel">
              <h1>Generate Study Materials</h1>
              <p className="subtitle">
                Upload your content or paste text to get started
              </p>

              {/* API Status */}
              {apiKeyInfo.total > 0 && (
                <div className="api-status">
                  <span className="status-icon">🔑</span>
                  <span className="status-text">
                    {apiKeyInfo.total} API key{apiKeyInfo.total > 1 ? "s" : ""}{" "}
                    configured
                    {apiKeyInfo.total > 1 && " (Auto-rotation enabled)"}
                  </span>
                </div>
              )}

              {/* Generation Type Selector */}
              <div className="type-selector">
                <h3>What would you like to generate?</h3>
                <div className="type-options">
                  <label
                    className={`type-option ${
                      generationType === "summary" ? "active" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="type"
                      value="summary"
                      checked={generationType === "summary"}
                      onChange={(e) => setGenerationType(e.target.value)}
                    />
                    <span className="option-icon">📝</span>
                    <span className="option-label">Summary</span>
                  </label>

                  <label
                    className={`type-option ${
                      generationType === "mcq" ? "active" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="type"
                      value="mcq"
                      checked={generationType === "mcq"}
                      onChange={(e) => setGenerationType(e.target.value)}
                    />
                    <span className="option-icon">❓</span>
                    <span className="option-label">MCQs</span>
                  </label>

                  <label
                    className={`type-option ${
                      generationType === "qa" ? "active" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="type"
                      value="qa"
                      checked={generationType === "qa"}
                      onChange={(e) => setGenerationType(e.target.value)}
                    />
                    <span className="option-icon">💬</span>
                    <span className="option-label">Q&A</span>
                  </label>

                  <label
                    className={`type-option ${
                      generationType === "notes" ? "active" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="type"
                      value="notes"
                      checked={generationType === "notes"}
                      onChange={(e) => setGenerationType(e.target.value)}
                    />
                    <span className="option-icon">📚</span>
                    <span className="option-label">Notes</span>
                  </label>
                </div>
              </div>

              {/* Upload Area */}
              <div className="upload-section">
                <div className="upload-header">
                  <h3>Upload Documents</h3>
                  {uploadedFiles.length > 0 && (
                    <div className="file-actions">
                      <button className="btn-file-action" onClick={selectAllFiles}>
                        ✓ Select All
                      </button>
                      <button className="btn-file-action" onClick={deselectAllFiles}>
                        ✗ Deselect All
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="upload-area">
                  <input
                    type="file"
                    id="file-upload"
                    accept=".pdf,.txt,.doc,.docx,.jpg,.jpeg,.png,.gif,.bmp,.webp"
                    onChange={handleFileUpload}
                    multiple
                    hidden
                    disabled={isExtracting}
                  />
                  <label htmlFor="file-upload" className="upload-box">
                    {isExtracting ? (
                      <div className="file-info">
                        <span className="spinner"></span>
                        <span>Extracting text with OCR...</span>
                      </div>
                    ) : (
                      <>
                        <div className="upload-icon">📤</div>
                        <p>Click to upload or drag and drop</p>
                        <span className="upload-hint">
                          PDF, Word, TXT, Images (JPG, PNG) • OCR enabled • Multiple files supported
                        </span>
                      </>
                    )}
                  </label>
                </div>

                {/* Uploaded Files List */}
                {uploadedFiles.length > 0 && (
                  <div className="uploaded-files-list">
                    <div className="list-header">
                      <span className="list-title">
                        {uploadedFiles.length} file{uploadedFiles.length > 1 ? 's' : ''} uploaded
                      </span>
                      <span className="list-subtitle">
                        {uploadedFiles.filter(f => f.selected).length} selected • {' '}
                        {uploadedFiles.filter(f => f.selected).reduce((sum, f) => sum + f.text.length, 0).toLocaleString()} characters
                        {uploadedFiles.filter(f => f.selected).reduce((sum, f) => sum + f.text.length, 0) > 20000 && 
                          <span style={{color: '#ff6b6b', marginLeft: '8px'}}>⚠️ Large</span>
                        }
                      </span>
                    </div>
                    {uploadedFiles.map(file => (
                      <div
                        key={file.id}
                        className={`file-item ${file.selected ? 'selected' : ''}`}
                      >
                        <label className="file-checkbox">
                          <input
                            type="checkbox"
                            checked={file.selected}
                            onChange={() => toggleFileSelection(file.id)}
                          />
                          <span className="checkbox-custom"></span>
                        </label>
                        
                        <div className="file-details">
                          <div className="file-name-row">
                            <span className="file-icon-small">
                              {file.type === 'application/pdf' ? '📕' : 
                               file.type.includes('word') ? '📘' : '📄'}
                            </span>
                            <span className="file-name-text">{file.name}</span>
                          </div>
                          <div className="file-meta">
                            <span>{(file.size / 1024).toFixed(1)} KB</span>
                            <span>•</span>
                            <span>{file.text.length} characters</span>
                          </div>
                        </div>

                        <button
                          className="btn-remove-file"
                          onClick={() => removeFile(file.id)}
                          title="Remove file"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Text Input */}
              <div className="text-section">
                <h3>Or paste your text here</h3>
                <textarea
                  className="text-input"
                  placeholder="Paste your study material here..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  rows={10}
                ></textarea>
              </div>

              {/* Error Message */}
              {error && (
                <div className="error-message">
                  <span className="error-icon">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Generate Button */}
              <button
                className={`btn-generate-main ${
                  isGenerating ? "generating" : ""
                }`}
                onClick={handleGenerate}
                disabled={
                  (uploadedFiles.length === 0 && !inputText) ||
                  isGenerating ||
                  isExtracting
                }
              >
                {isGenerating ? (
                  <>
                    <span className="spinner"></span>
                    Generating with AI...
                  </>
                ) : (
                  <>Generate {generationType.toUpperCase()}</>
                )}
              </button>
            </div>

            {/* Right Panel - Output */}
            <div className="output-panel">
              <div className="output-header">
                <h2>Generated Result</h2>
                {result && !result.error && (
                  <div className="output-actions">
                    <button
                      className="btn-action"
                      onClick={handleDownloadResult}
                    >
                      📥 Download
                    </button>
                    <button className="btn-action" onClick={handleCopyResult}>
                      � Copy
                    </button>
                  </div>
                )}
              </div>

              <div className="output-content">
                {!result ? (
                  <div className="empty-state">
                    <div className="empty-icon">🤖</div>
                    <h3>No content generated yet</h3>
                    <p>
                      Upload a document or paste text to generate study
                      materials
                    </p>
                  </div>
                ) : (
                  <div className="result-content">
                    <div className="result-type-badge">
                      {result.type.toUpperCase()}
                    </div>

                    {/* Render Summary */}
                    {result.type === "summary" && result.content.short && (
                      <div className="summary-result">
                        <div className="summary-section">
                          <h3>📝 Short Summary</h3>
                          <p>{result.content.short}</p>
                        </div>
                        <div className="summary-section">
                          <h3>📄 Medium Summary</h3>
                          <p>{result.content.medium}</p>
                        </div>
                        <div className="summary-section">
                          <h3>📚 Detailed Summary</h3>
                          <p>{result.content.detailed}</p>
                        </div>
                      </div>
                    )}

                    {/* Render MCQs */}
                    {result.type === "mcq" && result.content.mcqs && (
                      <div className="mcq-result">
                        {result.content.mcqs.map((mcq, idx) => (
                          <div key={idx} className="mcq-item">
                            <h4>Question {idx + 1}:</h4>
                            <p className="mcq-question">{mcq.question}</p>
                            <div className="options">
                              {mcq.options.map((option, optIdx) => (
                                <label
                                  key={optIdx}
                                  className={
                                    mcq.answer ===
                                    String.fromCharCode(65 + optIdx)
                                      ? "correct-answer"
                                      : ""
                                  }
                                >
                                  <input
                                    type="radio"
                                    name={`q${idx}`}
                                    disabled
                                  />
                                  <span>
                                    {String.fromCharCode(65 + optIdx)}. {option}
                                  </span>
                                </label>
                              ))}
                            </div>
                            <div className="mcq-answer">
                              <strong>Answer: {mcq.answer}</strong>
                              {mcq.explanation && (
                                <p className="explanation">{mcq.explanation}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Render Q&A */}
                    {result.type === "qa" && result.content.short && (
                      <div className="qa-result">
                        <div className="qa-section">
                          <h3>📝 Short Answer Questions</h3>
                          {result.content.short.map((item, idx) => (
                            <div key={idx} className="qa-item">
                              <p className="question">
                                <strong>Q{idx + 1}:</strong> {item.q}
                              </p>
                              <p className="answer">
                                <strong>A:</strong> {item.a}
                              </p>
                            </div>
                          ))}
                        </div>
                        <div className="qa-section">
                          <h3>📚 Long Answer Questions</h3>
                          {result.content.long.map((item, idx) => (
                            <div key={idx} className="qa-item">
                              <p className="question">
                                <strong>Q{idx + 1}:</strong> {item.q}
                              </p>
                              <p className="answer">
                                <strong>A:</strong> {item.a}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Render Notes */}
                    {result.type === "notes" && result.content.key_points && (
                      <div className="notes-result">
                        <div className="notes-section">
                          <h3>🎯 Key Points</h3>
                          <ul>
                            {result.content.key_points.map((point, idx) => (
                              <li key={idx}>{point}</li>
                            ))}
                          </ul>
                        </div>
                        {result.content.formulas &&
                          result.content.formulas.length > 0 && (
                            <div className="notes-section">
                              <h3>🔢 Formulas</h3>
                              <ul>
                                {result.content.formulas.map((formula, idx) => (
                                  <li key={idx}>{formula}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        {result.content.terms &&
                          result.content.terms.length > 0 && (
                            <div className="notes-section">
                              <h3>📖 Key Terms</h3>
                              {result.content.terms.map((term, idx) => (
                                <div key={idx} className="term-item">
                                  <strong>{term.term}:</strong>{" "}
                                  {term.definition}
                                </div>
                              ))}
                            </div>
                          )}
                        {result.content.concepts &&
                          result.content.concepts.length > 0 && (
                            <div className="notes-section">
                              <h3>💡 Core Concepts</h3>
                              <ul>
                                {result.content.concepts.map((concept, idx) => (
                                  <li key={idx}>{concept}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                      </div>
                    )}

                    {/* Render Practice Questions */}
                    {result.type === "practice" && result.content.easy && (
                      <div className="practice-result">
                        <div className="difficulty-section easy">
                          <h3>🟢 Easy Questions</h3>
                          {result.content.easy.map((item, idx) => (
                            <div key={idx} className="practice-item">
                              <p className="question">
                                <strong>Q{idx + 1}:</strong> {item.q}
                              </p>
                              <p className="answer">
                                <strong>A:</strong> {item.a}
                              </p>
                            </div>
                          ))}
                        </div>
                        <div className="difficulty-section medium">
                          <h3>🟡 Medium Questions</h3>
                          {result.content.medium.map((item, idx) => (
                            <div key={idx} className="practice-item">
                              <p className="question">
                                <strong>Q{idx + 1}:</strong> {item.q}
                              </p>
                              <p className="answer">
                                <strong>A:</strong> {item.a}
                              </p>
                            </div>
                          ))}
                        </div>
                        <div className="difficulty-section hard">
                          <h3>🔴 Hard Questions</h3>
                          {result.content.hard.map((item, idx) => (
                            <div key={idx} className="practice-item">
                              <p className="question">
                                <strong>Q{idx + 1}:</strong> {item.q}
                              </p>
                              <p className="answer">
                                <strong>A:</strong> {item.a}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Show raw output if parsing failed */}
                    {result.content.error && (
                      <div className="raw-output">
                        <h3>⚠️ Could not parse structured output</h3>
                        <pre>{result.content.raw || "No output received"}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Generator;
