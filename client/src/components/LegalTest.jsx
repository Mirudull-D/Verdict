import { useState } from "react";

const LegalTest = () => {
  const [narrative, setNarrative] = useState("");
  const [locationState, setLocationState] = useState("Delhi");
  const [evidence, setEvidence] = useState([]);
  const [aggravating, setAggravating] = useState([]);
  const [enableTTS, setEnableTTS] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const evidenceOptions = [
    "CCTV",
    "eyewitness",
    "medical report",
    "device logs",
    "FSL",
    "call detail records",
  ];

  const aggravatingOptions = [
    "weapon",
    "minor victim",
    "habitual offender",
    "conspiracy",
    "hurt",
  ];

  const testExamples = [
    {
      name: "Theft Case",
      narrative:
        "A person was caught stealing a mobile phone worth Rs. 15,000 from a shop in Delhi. The shopkeeper reported it immediately and CCTV footage is available.",
      evidence: ["CCTV", "eyewitness"],
      aggravating: [],
    },
    {
      name: "Assault Case",
      narrative:
        "A man attacked another person with a knife in a public market, causing severe injuries. Multiple witnesses present and victim taken to hospital.",
      evidence: ["eyewitness", "medical report"],
      aggravating: ["weapon", "hurt"],
    },
    {
      name: "Cyber Crime",
      narrative:
        "Unauthorized access to bank account through phishing email, Rs. 50,000 transferred. IP logs and email headers available.",
      evidence: ["device logs", "call detail records"],
      aggravating: [],
    },
  ];

  const loadExample = (example) => {
    setNarrative(example.narrative);
    setEvidence(example.evidence);
    setAggravating(example.aggravating);
  };

  const toggleEvidence = (item) => {
    setEvidence((prev) =>
      prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item]
    );
  };

  const toggleAggravating = (item) => {
    setAggravating((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  };

  const submitLegalQuery = async () => {
    if (!narrative.trim()) {
      alert("Please provide an incident narrative");
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch("http://localhost:5000/api/legal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          narrative,
          location_state: locationState,
          date_time: new Date().toISOString(),
          known_sections_or_acts: [],
          key_entities: [],
          evidence_available: evidence,
          aggravating_factors: aggravating,
          enableTTS: enableTTS,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || "Unknown error occurred");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="test-container">
      <h2>🏛️ Legal Research API Test</h2>
      <p className="subtitle">Endpoint: POST /api/legal</p>

      <div className="test-examples">
        <h3>📋 Quick Test Examples:</h3>
        <div className="example-buttons">
          {testExamples.map((example, idx) => (
            <button
              key={idx}
              onClick={() => loadExample(example)}
              className="example-btn"
            >
              {example.name}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>Incident Narrative *</label>
        <textarea
          value={narrative}
          onChange={(e) => setNarrative(e.target.value)}
          placeholder="Describe the legal incident in detail..."
          rows={6}
        />
      </div>

      <div className="form-group">
        <label>Location (State/UT)</label>
        <input
          type="text"
          value={locationState}
          onChange={(e) => setLocationState(e.target.value)}
          placeholder="e.g., Delhi, Maharashtra"
        />
      </div>

      <div className="form-group">
        <label>Evidence Available</label>
        <div className="chip-group">
          {evidenceOptions.map((item) => (
            <button
              key={item}
              onClick={() => toggleEvidence(item)}
              className={`chip ${evidence.includes(item) ? "active" : ""}`}
            >
              {evidence.includes(item) && "✓ "}
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>Aggravating Factors</label>
        <div className="chip-group">
          {aggravatingOptions.map((item) => (
            <button
              key={item}
              onClick={() => toggleAggravating(item)}
              className={`chip aggravating ${
                aggravating.includes(item) ? "active" : ""
              }`}
            >
              {aggravating.includes(item) && "✓ "}
              {item}
            </button>
          ))}
        </div>
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
        onClick={submitLegalQuery}
        disabled={loading || !narrative.trim()}
        className="submit-btn"
      >
        {loading ? "⏳ Analyzing..." : "⚖️ Submit Legal Query"}
      </button>

      {error && (
        <div className="error-box">
          <h3>❌ Error</h3>
          <p>{error}</p>
        </div>
      )}

      {result && result.legal_analysis && (
        <div className="result-box">
          <h3>✅ Legal Analysis Results</h3>

          {/* Applicable Provisions */}
          <div className="result-section">
            <h4>
              ⚖️ Applicable Provisions (
              {result.legal_analysis.applicable_provisions?.length || 0})
            </h4>
            {result.legal_analysis.applicable_provisions?.map(
              (provision, idx) => (
                <div key={idx} className="provision-card">
                  <h5>
                    {provision.statute} - Section {provision.section}
                  </h5>
                  <p>
                    <strong>Description:</strong> {provision.description}
                  </p>
                  <p>
                    <strong>Provision Text:</strong> {provision.provision_text}
                  </p>
                  <div className="classification-grid">
                    <div className="classification-item">
                      <strong>Bailable:</strong> {provision.bailable_status}
                    </div>
                    <div className="classification-item">
                      <strong>Cognizable:</strong> {provision.cognizable_status}
                    </div>
                    <div className="classification-item">
                      <strong>Triable By:</strong> {provision.court_triable_by}
                    </div>
                  </div>
                  <p>
                    <strong>Punishment:</strong> {provision.punishment_range}
                  </p>
                  {provision.last_amended && (
                    <p>
                      <strong>Last Amended:</strong> {provision.last_amended}
                    </p>
                  )}
                  <div className="sources">
                    <a
                      href={provision.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      📄 View on Legislative.gov.in
                    </a>
                  </div>
                </div>
              )
            )}
          </div>

          {/* Similar Judgments */}
          {result.legal_analysis.similar_judgments &&
            result.legal_analysis.similar_judgments.length > 0 && (
              <div className="result-section">
                <h4>
                  📚 Similar Judgments (
                  {result.legal_analysis.similar_judgments.length})
                </h4>
                {result.legal_analysis.similar_judgments.map(
                  (judgment, idx) => (
                    <div key={idx} className="case-card">
                      <h5>{judgment.citation}</h5>
                      <p>
                        <strong>Neutral Citation:</strong>{" "}
                        {judgment.neutral_citation}
                      </p>
                      <p>
                        <strong>Court:</strong> {judgment.court} (
                        {judgment.year})
                      </p>
                      <p>
                        <strong>Holding:</strong> {judgment.holding}
                      </p>
                      <p>
                        <strong>Similarity:</strong> {judgment.similarity_notes}
                      </p>
                      <a
                        href={judgment.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        📄 View Judgment
                      </a>
                    </div>
                  )
                )}
              </div>
            )}

          {/* Jurisdictional Notes */}
          {result.legal_analysis.jurisdictional_notes && (
            <div className="result-section jurisdictional-note">
              <h4>🌍 Jurisdictional Notes</h4>
              <p>
                <strong>Local Acts Check:</strong>{" "}
                <span
                  className={`status-${result.legal_analysis.jurisdictional_notes.local_acts_check}`}
                >
                  {result.legal_analysis.jurisdictional_notes.local_acts_check
                    .toUpperCase()
                    .replace("_", " ")}
                </span>
              </p>
              <p>{result.legal_analysis.jurisdictional_notes.details}</p>
            </div>
          )}

          {/* Audio Summary */}
          {result.audio && (
            <div className="result-section">
              <h4>🔊 Audio Summary</h4>
              <audio
                src={`http://localhost:5000${result.audio.url}`}
                controls
              />
            </div>
          )}

          {/* Raw JSON View */}
          <div className="json-view">
            <h4>Raw JSON Response</h4>
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default LegalTest;
