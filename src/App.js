import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import LandingPage from "./components/LandingPage";
import Dashboard from "./components/Dashboard";
import Generator from "./components/Generator";

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/generator" element={<Generator />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
