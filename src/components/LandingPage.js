import React from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";
import ThemeSwitch from "./ThemeSwitch";
import { useTheme } from "../context/ThemeContext";

const LandingPage = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  return (
    <div className={`landing-page ${isDarkMode ? "dark-mode" : "light-mode"}`}>
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="nav-wrapper">
            <div className="logo">SummaraX</div>
            <nav className="nav">
              <a href="/" className="active">
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
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/generator");
                }}
              >
                Generator
              </a>
            </nav>
            <div className="header-buttons">
              <ThemeSwitch />
              <button
                className="btn-login"
                onClick={() => navigate("/dashboard")}
              >
                Login
              </button>
              <button
                className="btn-signup"
                onClick={() => navigate("/dashboard")}
              >
                Sign up
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="blob blob-yellow"></div>
          <div className="blob blob-orange"></div>

          <div className="hero-content">
            <h1 className="hero-title">
              Don't make
              <br />
              studying
              <br />
              awkward
            </h1>

            <p className="hero-subtitle">
              No more fumbling for study materials or searching for last-minute
              notes. Whether it's an exam, assignment, or project, SummaraX is
              easy to leverage with AI and keep the studying going straight from
              your notes.
            </p>

            <button className="btn-cta" onClick={() => navigate("/generator")}>
              Get started free
            </button>
          </div>

          <div className="hero-image">
            <div className="phone-mockup phone-left">
              <div className="phone-screen">
                <div className="qr-section">
                  <div className="profile-header">
                    <div className="profile-pic"></div>
                    <div className="profile-info">
                      <h3>Study Summary</h3>
                      <p>AI Generated</p>
                    </div>
                  </div>
                  <div className="qr-code"></div>
                  <p className="scan-text">Scan to view summary</p>
                </div>
              </div>
            </div>

            <div className="phone-mockup phone-right">
              <div className="phone-screen">
                <div className="message-header">
                  <span className="back-arrow">←</span>
                  <h3>New Message</h3>
                  <span className="options">⋯</span>
                </div>
                <div className="message-content">
                  <p className="message-label">To: AI Assistant</p>
                  <textarea
                    className="message-input"
                    placeholder="Great! Connecting with our base AI intelligence models just got easier.&#10;&#10;Here's what I need:&#10;&#10;Generate a summary for chapter 5."
                    readOnly
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="blob blob-green"></div>
            <div className="blob blob-purple"></div>
            <div className="blob blob-pink"></div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works" id="how-it-works">
        <div className="container">
          <h2 className="section-title">Here's how it works</h2>
          <p className="section-subtitle">More jiving, less studying.</p>

          <div className="steps">
            <div className="step">
              <div className="step-icon icon-upload">📤</div>
              <h3>Upload your content</h3>
              <p>
                When it's time to revise the topic you need, simply upload or
                paste your notes into their phone camera.
              </p>
            </div>

            <div className="step">
              <div className="step-icon icon-generate">🤖</div>
              <h3>Generate materials</h3>
              <p>
                Your AI model is linked to it so their contact information is
                already available. All they have to do is hit send.
              </p>
            </div>

            <div className="step">
              <div className="step-icon icon-study">📚</div>
              <h3>Study from your inbox</h3>
              <p>
                All the stuff in the email you just sent makes it easy to
                remember who you are every one you met.
              </p>
            </div>
          </div>

          <button className="btn-cta" onClick={() => navigate("/generator")}>
            Start Jiving
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-logo">SummaraX</div>
          <p className="footer-tagline">Get summaries and start jiving.</p>

          <nav className="footer-nav">
            <a href="#about">About</a>
            <a href="#privacy">Privacy</a>
            <a href="#terms">Terms</a>
            <a href="#contact">Contact</a>
          </nav>

          <p className="copyright">
            © 2025 and its logo are trademarks of SummaraX.
          </p>
        </div>

        <div className="blob blob-orange-footer"></div>
        <div className="blob blob-teal-footer"></div>
      </footer>
    </div>
  );
};

export default LandingPage;
