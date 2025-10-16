import { useState } from "react";
import TranscribeTest from "./components/TranscribeTest.jsx";
import ChatTest from "./components/ChatTest.jsx";
import LegalTest from "./components/LegalTest.jsx";
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState("legal");

  return (
    <div className="app">
      <header className="header">
        <h1>⚖️ Legal Assistant API Testing Dashboard</h1>
        <p>Test all endpoints: Legal Research, Transcription, and Chat</p>
      </header>

      <nav className="tabs">
        <button
          className={`tab ${activeTab === "legal" ? "active" : ""}`}
          onClick={() => setActiveTab("legal")}
        >
          🏛️ Legal Research
        </button>
        <button
          className={`tab ${activeTab === "transcribe" ? "active" : ""}`}
          onClick={() => setActiveTab("transcribe")}
        >
          🎙️ Audio Transcription
        </button>
        <button
          className={`tab ${activeTab === "chat" ? "active" : ""}`}
          onClick={() => setActiveTab("chat")}
        >
          💬 Text Chat
        </button>
      </nav>

      <main className="content">
        {activeTab === "legal" && <LegalTest />}
        {activeTab === "transcribe" && <TranscribeTest />}
        {activeTab === "chat" && <ChatTest />}
      </main>

      <footer className="footer">
        <p>Backend: http://localhost:5000 | Status: 🟢 Connected</p>
      </footer>
    </div>
  );
}

export default App;
