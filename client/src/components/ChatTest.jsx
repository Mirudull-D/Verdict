import { useState } from "react";

const ChatTest = () => {
  const [question, setQuestion] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("english");
  const [enableTTS, setEnableTTS] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const languages = [
    { code: "auto", name: "Auto-detect" },
    { code: "english", name: "English" },
    { code: "hindi", name: "Hindi (हिन्दी)" },
    { code: "tamil", name: "Tamil (தமிழ்)" },
  ];

  const exampleQuestions = [
    "What is the punishment for theft under IPC?",
    "Explain the difference between cognizable and non-cognizable offenses",
    "What are the rights of an arrested person in India?",
    "How to file an FIR for cybercrime?",
  ];

  const submitChat = async () => {
    if (!question.trim()) {
      alert("Please enter a question");
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          language: selectedLanguage,
          enableTTS: enableTTS,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || "Unknown error");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="test-container">
      <h2>💬 Text Chat API Test</h2>
      <p className="subtitle">Endpoint: POST /api/chat</p>

      <div className="test-examples">
        <h3>📋 Example Questions:</h3>
        <div className="example-buttons">
          {exampleQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => setQuestion(q)}
              className="example-btn"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>Your Question *</label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a legal question..."
          rows={4}
        />
      </div>

      <div className="form-group">
        <label>Language</label>
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group checkbox-group">
        <label>
          <input
            type="checkbox"
            checked={enableTTS}
            onChange={(e) => setEnableTTS(e.target.checked)}
          />
          🔊 Enable Text-to-Speech
        </label>
      </div>

      <button
        onClick={submitChat}
        disabled={loading || !question.trim()}
        className="submit-btn"
      >
        {loading ? "⏳ Processing..." : "💬 Send Message"}
      </button>

      {error && (
        <div className="error-box">
          <h3>❌ Error</h3>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="result-box">
          <h3>✅ Chat Response</h3>

          <div className="result-section">
            <h4>Your Question</h4>
            <p className="question-text">{result.question}</p>
          </div>

          <div className="result-section">
            <h4>AI Response</h4>
            <p className="response-text">{result.response}</p>
          </div>

          <div className="result-section">
            <p>
              <strong>Language:</strong> {result.language}
            </p>
          </div>

          {result.audio && (
            <div className="result-section">
              <h4>🔊 Audio Response</h4>
              <audio
                src={`http://localhost:5000${result.audio.url}`}
                controls
              />
            </div>
          )}

          <div className="json-view">
            <h4>Raw JSON Response</h4>
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatTest;
