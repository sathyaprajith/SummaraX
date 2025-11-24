import React from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import ThemeSwitch from "./ThemeSwitch";
import { useTheme } from "../context/ThemeContext";

const Dashboard = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  // Mock data for demonstration
  const summaryHistory = [
    {
      id: 1,
      title: "Introduction to Machine Learning",
      date: "2025-11-20",
      type: "Summary",
      pages: 15,
      preview: "Machine learning is a subset of artificial intelligence...",
    },
    {
      id: 2,
      title: "React Hooks Guide",
      date: "2025-11-19",
      type: "Q&A",
      pages: 8,
      preview: "React Hooks allow you to use state and other React features...",
    },
    {
      id: 3,
      title: "Data Structures Chapter 5",
      date: "2025-11-18",
      type: "MCQs",
      pages: 12,
      preview: "Binary trees, graphs, and advanced data structures...",
    },
    {
      id: 4,
      title: "Calculus Final Review",
      date: "2025-11-17",
      type: "Notes",
      pages: 20,
      preview: "Integration, differentiation, and limit problems...",
    },
  ];

  const stats = {
    totalSummaries: 24,
    totalPages: 387,
    hoursStudied: 42,
    avgAccuracy: 94,
  };

  return (
    <div className={`dashboard ${isDarkMode ? "dark-mode" : "light-mode"}`}>
      {/* Header */}
      <header className="dashboard-header">
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
              <a href="#" className="active">
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
            <div className="header-actions">
              <ThemeSwitch />
              <button
                className="btn-generate"
                onClick={() => navigate("/generator")}
              >
                + New Summary
              </button>
              <div className="user-profile">
                <div className="avatar">S</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="container">
          {/* Welcome Section */}
          <div className="welcome-section">
            <h1>Welcome back, Student! 👋</h1>
            <p>Here's what's happening with your studies today.</p>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📚</div>
              <div className="stat-info">
                <h3>{stats.totalSummaries}</h3>
                <p>Total Summaries</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📄</div>
              <div className="stat-info">
                <h3>{stats.totalPages}</h3>
                <p>Pages Processed</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⏱️</div>
              <div className="stat-info">
                <h3>{stats.hoursStudied}h</h3>
                <p>Study Time Saved</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <h3>{stats.avgAccuracy}%</h3>
                <p>Avg Accuracy</p>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="recent-section">
            <div className="section-header">
              <h2>Recent Activity</h2>
              <button className="btn-view-all">View All</button>
            </div>

            <div className="history-grid">
              {summaryHistory.map((item) => (
                <div key={item.id} className="history-card">
                  <div className="card-header">
                    <div className="card-type">{item.type}</div>
                    <div className="card-date">{item.date}</div>
                  </div>
                  <h3 className="card-title">{item.title}</h3>
                  <p className="card-preview">{item.preview}</p>
                  <div className="card-footer">
                    <span className="card-pages">{item.pages} pages</span>
                    <div className="card-actions">
                      <button className="btn-icon">👁️</button>
                      <button className="btn-icon">📥</button>
                      <button className="btn-icon">🗑️</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="quick-actions">
            <h2>Quick Actions</h2>
            <div className="actions-grid">
              <div
                className="action-card"
                onClick={() => navigate("/generator")}
              >
                <div className="action-icon">📝</div>
                <h3>Create Summary</h3>
                <p>Upload and summarize new content</p>
              </div>
              <div className="action-card">
                <div className="action-icon">❓</div>
                <h3>Generate MCQs</h3>
                <p>Create practice questions</p>
              </div>
              <div className="action-card">
                <div className="action-icon">📊</div>
                <h3>View Analytics</h3>
                <p>Track your progress</p>
              </div>
              <div className="action-card">
                <div className="action-icon">⚙️</div>
                <h3>Settings</h3>
                <p>Customize your experience</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
