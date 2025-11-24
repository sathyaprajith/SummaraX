import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Generator.css';
import ThemeSwitch from './ThemeSwitch';

const Generator = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [inputText, setInputText] = useState('');
  const [generationType, setGenerationType] = useState('summary');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  const handleThemeToggle = (e) => {
    setIsDarkMode(e.target.checked);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    // Simulate AI processing
    setTimeout(() => {
      setResult({
        type: generationType,
        content: "This is a sample generated content. In a real application, this would be the AI-generated summary, MCQs, or Q&A based on your input."
      });
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className={`generator ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      {/* Header */}
      <header className="generator-header">
        <div className="container">
          <div className="header-content">
            <div className="logo" onClick={() => navigate('/')}>SummaraX</div>
            <nav className="nav">
              <a href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Home</a>
              <a href="#" onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}>Dashboard</a>
              <a href="#" className="active">Generator</a>
            </nav>
            <div className="header-actions">
              <ThemeSwitch onChange={handleThemeToggle} />
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
              <p className="subtitle">Upload your content or paste text to get started</p>

              {/* Generation Type Selector */}
              <div className="type-selector">
                <h3>What would you like to generate?</h3>
                <div className="type-options">
                  <label className={`type-option ${generationType === 'summary' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="type"
                      value="summary"
                      checked={generationType === 'summary'}
                      onChange={(e) => setGenerationType(e.target.value)}
                    />
                    <span className="option-icon">📝</span>
                    <span className="option-label">Summary</span>
                  </label>

                  <label className={`type-option ${generationType === 'mcq' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="type"
                      value="mcq"
                      checked={generationType === 'mcq'}
                      onChange={(e) => setGenerationType(e.target.value)}
                    />
                    <span className="option-icon">❓</span>
                    <span className="option-label">MCQs</span>
                  </label>

                  <label className={`type-option ${generationType === 'qa' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="type"
                      value="qa"
                      checked={generationType === 'qa'}
                      onChange={(e) => setGenerationType(e.target.value)}
                    />
                    <span className="option-icon">💬</span>
                    <span className="option-label">Q&A</span>
                  </label>

                  <label className={`type-option ${generationType === 'notes' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="type"
                      value="notes"
                      checked={generationType === 'notes'}
                      onChange={(e) => setGenerationType(e.target.value)}
                    />
                    <span className="option-icon">📚</span>
                    <span className="option-label">Notes</span>
                  </label>
                </div>
              </div>

              {/* Upload Area */}
              <div className="upload-section">
                <h3>Upload Document</h3>
                <div className="upload-area">
                  <input
                    type="file"
                    id="file-upload"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileUpload}
                    hidden
                  />
                  <label htmlFor="file-upload" className="upload-box">
                    {selectedFile ? (
                      <div className="file-info">
                        <span className="file-icon">📄</span>
                        <span className="file-name">{selectedFile.name}</span>
                        <button className="btn-remove" onClick={(e) => { e.preventDefault(); setSelectedFile(null); }}>✕</button>
                      </div>
                    ) : (
                      <>
                        <div className="upload-icon">📤</div>
                        <p>Click to upload or drag and drop</p>
                        <span className="upload-hint">PDF, DOC, DOCX, TXT (Max 10MB)</span>
                      </>
                    )}
                  </label>
                </div>
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

              {/* Generate Button */}
              <button
                className={`btn-generate-main ${isGenerating ? 'generating' : ''}`}
                onClick={handleGenerate}
                disabled={!selectedFile && !inputText}
              >
                {isGenerating ? (
                  <>
                    <span className="spinner"></span>
                    Generating...
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
                {result && (
                  <div className="output-actions">
                    <button className="btn-action">📥 Download</button>
                    <button className="btn-action">📋 Copy</button>
                    <button className="btn-action">💾 Save</button>
                  </div>
                )}
              </div>

              <div className="output-content">
                {!result ? (
                  <div className="empty-state">
                    <div className="empty-icon">🤖</div>
                    <h3>No content generated yet</h3>
                    <p>Upload a document or paste text to generate study materials</p>
                  </div>
                ) : (
                  <div className="result-content">
                    <div className="result-type-badge">{result.type.toUpperCase()}</div>
                    <div className="result-text">
                      <h3>Generated {result.type}</h3>
                      <p>{result.content}</p>
                      
                      {/* Sample output based on type */}
                      {result.type === 'summary' && (
                        <div className="sample-summary">
                          <h4>Key Points:</h4>
                          <ul>
                            <li>Main concept and introduction</li>
                            <li>Supporting details and examples</li>
                            <li>Conclusion and takeaways</li>
                          </ul>
                        </div>
                      )}

                      {result.type === 'mcq' && (
                        <div className="sample-mcqs">
                          <div className="mcq-item">
                            <h4>Question 1:</h4>
                            <p>What is the main topic discussed?</p>
                            <div className="options">
                              <label><input type="radio" name="q1" /> Option A</label>
                              <label><input type="radio" name="q1" /> Option B</label>
                              <label><input type="radio" name="q1" /> Option C</label>
                              <label><input type="radio" name="q1" /> Option D</label>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
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
