import { useState, useRef } from "react";

const ChatContainer = () => {
  const [permission, setPermission] = useState(false);
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioURL, setAudioURL] = useState("");
  const [transcription, setTranscription] = useState("");
  const [legalAnalysis, setLegalAnalysis] = useState(null); // Legal structured response
  const [loading, setLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("auto");

  // Legal query form fields
  const [incidentNarrative, setIncidentNarrative] = useState("");
  const [locationState, setLocationState] = useState("");
  const [evidenceAvailable, setEvidenceAvailable] = useState([]);
  const [aggravatingFactors, setAggravatingFactors] = useState([]);
  const [enableTTS, setEnableTTS] = useState(false);
  const [ttsAudioUrl, setTtsAudioUrl] = useState("");

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const languages = [
    { code: "auto", name: "🌐 Auto-detect", flag: "🌍" },
    { code: "english", name: "English", flag: "🇬🇧" },
    { code: "hindi", name: "हिन्दी (Hindi)", flag: "🇮🇳" },
    { code: "tamil", name: "தமிழ் (Tamil)", flag: "🇮🇳" },
  ];

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

  const getMicrophonePermission = async () => {
    if ("MediaRecorder" in window) {
      try {
        const streamData = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        setPermission(true);
        console.log("✅ Microphone permission granted");
      } catch (err) {
        alert(`Error: ${err.message}`);
        console.error("❌ Microphone permission denied:", err);
      }
    } else {
      alert("MediaRecorder API is not supported in your browser");
    }
  };

  const startRecording = async () => {
    try {
      const streamData = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      const mediaRecorder = new MediaRecorder(streamData, {
        mimeType: "audio/webm",
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log("📊 Audio chunk received");
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const audioUrl = URL.createObjectURL(audioBlob);

        setAudioBlob(audioBlob);
        setAudioURL(audioUrl);
        console.log("🎵 Recording saved");

        streamData.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
      console.log("🎙️ Recording started");
    } catch (err) {
      console.error("❌ Error starting recording:", err);
      alert(`Error: ${err.message}`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      console.log("⏹️ Recording stopped");
    }
  };

  const transcribeAudio = async () => {
    if (!audioBlob) {
      alert("No audio recorded");
      return;
    }

    setLoading(true);
    setTranscription("");
    console.log("📤 Sending audio to backend...");
    console.log("🌐 Selected language:", selectedLanguage);

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      formData.append("language", selectedLanguage);
      formData.append("enableTTS", "false"); // Set to "true" if you want audio response

      const response = await fetch("http://localhost:5000/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setTranscription(data.transcription);
        // Pre-fill incident narrative with transcription
        setIncidentNarrative(data.transcription);
        console.log("✅ Transcription received:", data.transcription);
      } else {
        alert(`Error: ${data.error}`);
        console.error("❌ Transcription failed:", data.error);
      }
    } catch (error) {
      console.error("❌ Error sending audio:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const submitLegalQuery = async () => {
    if (!incidentNarrative.trim()) {
      alert("Please provide an incident narrative");
      return;
    }

    setLoading(true);
    setLegalAnalysis(null);
    setTtsAudioUrl("");

    console.log("📤 Sending legal query to backend...");

    try {
      const response = await fetch("http://localhost:5000/api/legal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          narrative: incidentNarrative,
          location_state: locationState || "India (unspecified state)",
          date_time: new Date().toISOString(),
          known_sections_or_acts: [],
          key_entities: [],
          evidence_available: evidenceAvailable,
          aggravating_factors: aggravatingFactors,
          enableTTS: enableTTS,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setLegalAnalysis(data.legal_analysis);
        console.log("✅ Legal analysis received:", data.legal_analysis);

        if (data.audio) {
          setTtsAudioUrl(`http://localhost:5000${data.audio.url}`);
          console.log("🔊 TTS audio available:", data.audio.url);
        }
      } else {
        alert(`Error: ${data.error}`);
        console.error("❌ Legal query failed:", data.error);
      }
    } catch (error) {
      console.error("❌ Error sending legal query:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleEvidence = (evidence) => {
    setEvidenceAvailable((prev) =>
      prev.includes(evidence)
        ? prev.filter((e) => e !== evidence)
        : [...prev, evidence]
    );
  };

  const toggleAggravating = (factor) => {
    setAggravatingFactors((prev) =>
      prev.includes(factor)
        ? prev.filter((f) => f !== factor)
        : [...prev, factor]
    );
  };

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "900px",
        margin: "0 auto",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h2 style={{ textAlign: "center", color: "#1976d2" }}>
        ⚖️ Legal Assistant for Police Officers
      </h2>
      <p style={{ color: "#666", textAlign: "center", marginBottom: "30px" }}>
        AI-powered legal research for Indian criminal law (IPC/CrPC)
      </p>

      <div style={{ marginTop: "20px" }}>
        {/* Voice Recording Section */}
        <div
          style={{
            padding: "20px",
            backgroundColor: "#f5f5f5",
            borderRadius: "8px",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ marginTop: 0 }}>🎙️ Voice Input (Optional)</h3>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "bold",
              }}
            >
              🌍 Select Language:
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                fontSize: "16px",
                borderRadius: "8px",
                border: "2px solid #ddd",
                cursor: "pointer",
              }}
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>

          {!permission && (
            <button
              onClick={getMicrophonePermission}
              style={{
                width: "100%",
                padding: "15px 20px",
                fontSize: "18px",
                cursor: "pointer",
                backgroundColor: "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontWeight: "bold",
                marginBottom: "10px",
              }}
            >
              🎤 Get Microphone Permission
            </button>
          )}

          {permission && (
            <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
              <button
                onClick={recording ? stopRecording : startRecording}
                style={{
                  flex: "1",
                  padding: "15px 20px",
                  fontSize: "18px",
                  cursor: "pointer",
                  backgroundColor: recording ? "#f44336" : "#2196F3",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "bold",
                }}
              >
                {recording ? "⏹️ Stop Recording" : "🎙️ Start Recording"}
              </button>

              {audioBlob && (
                <button
                  onClick={transcribeAudio}
                  disabled={loading}
                  style={{
                    flex: "1",
                    padding: "15px 20px",
                    fontSize: "18px",
                    cursor: loading ? "not-allowed" : "pointer",
                    backgroundColor: loading ? "#ccc" : "#FF9800",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "bold",
                  }}
                >
                  {loading ? "⏳ Processing..." : "📝 Transcribe"}
                </button>
              )}
            </div>
          )}

          {audioURL && (
            <audio
              src={audioURL}
              controls
              style={{ width: "100%", marginTop: "10px" }}
            />
          )}
        </div>

        {/* Legal Query Form */}
        <div
          style={{
            padding: "20px",
            backgroundColor: "#fff",
            borderRadius: "8px",
            border: "2px solid #1976d2",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ marginTop: 0 }}>📝 Incident Details</h3>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "bold",
              }}
            >
              Incident Narrative: <span style={{ color: "red" }}>*</span>
            </label>
            <textarea
              value={incidentNarrative}
              onChange={(e) => setIncidentNarrative(e.target.value)}
              placeholder="Describe the legal incident in detail..."
              style={{
                width: "100%",
                padding: "12px",
                fontSize: "15px",
                borderRadius: "8px",
                border: "2px solid #ddd",
                resize: "vertical",
                minHeight: "120px",
                fontFamily: "Arial, sans-serif",
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "bold",
              }}
            >
              Location (State/UT):
            </label>
            <input
              type="text"
              value={locationState}
              onChange={(e) => setLocationState(e.target.value)}
              placeholder="e.g., Delhi, Maharashtra, Tamil Nadu"
              style={{
                width: "100%",
                padding: "12px",
                fontSize: "15px",
                borderRadius: "8px",
                border: "2px solid #ddd",
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "bold",
              }}
            >
              Evidence Available:
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {evidenceOptions.map((evidence) => (
                <button
                  key={evidence}
                  onClick={() => toggleEvidence(evidence)}
                  style={{
                    padding: "8px 16px",
                    fontSize: "14px",
                    borderRadius: "20px",
                    border: "2px solid",
                    borderColor: evidenceAvailable.includes(evidence)
                      ? "#4CAF50"
                      : "#ddd",
                    backgroundColor: evidenceAvailable.includes(evidence)
                      ? "#4CAF50"
                      : "white",
                    color: evidenceAvailable.includes(evidence)
                      ? "white"
                      : "#333",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  {evidenceAvailable.includes(evidence) ? "✓ " : ""}
                  {evidence}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "bold",
              }}
            >
              Aggravating Factors:
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {aggravatingOptions.map((factor) => (
                <button
                  key={factor}
                  onClick={() => toggleAggravating(factor)}
                  style={{
                    padding: "8px 16px",
                    fontSize: "14px",
                    borderRadius: "20px",
                    border: "2px solid",
                    borderColor: aggravatingFactors.includes(factor)
                      ? "#f44336"
                      : "#ddd",
                    backgroundColor: aggravatingFactors.includes(factor)
                      ? "#f44336"
                      : "white",
                    color: aggravatingFactors.includes(factor)
                      ? "white"
                      : "#333",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  {aggravatingFactors.includes(factor) ? "✓ " : ""}
                  {factor}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{ display: "flex", alignItems: "center", gap: "10px" }}
            >
              <input
                type="checkbox"
                checked={enableTTS}
                onChange={(e) => setEnableTTS(e.target.checked)}
                style={{ width: "20px", height: "20px", cursor: "pointer" }}
              />
              <span style={{ fontWeight: "bold" }}>
                🔊 Enable Text-to-Speech for summary
              </span>
            </label>
          </div>

          <button
            onClick={submitLegalQuery}
            disabled={loading || !incidentNarrative.trim()}
            style={{
              width: "100%",
              padding: "15px 20px",
              fontSize: "18px",
              cursor:
                loading || !incidentNarrative.trim()
                  ? "not-allowed"
                  : "pointer",
              backgroundColor:
                loading || !incidentNarrative.trim() ? "#ccc" : "#1976d2",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontWeight: "bold",
            }}
          >
            {loading ? "⏳ Analyzing..." : "⚖️ Get Legal Analysis"}
          </button>
        </div>

        {/* Legal Analysis Results */}
        {legalAnalysis && (
          <div
            style={{
              padding: "20px",
              backgroundColor: "#e8f5e9",
              borderRadius: "8px",
              border: "2px solid #4CAF50",
            }}
          >
            <h3 style={{ marginTop: 0, color: "#2e7d32" }}>
              📊 Legal Analysis Results
            </h3>

            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ color: "#1976d2" }}>Summary:</h4>
              <p style={{ fontSize: "16px", lineHeight: "1.6" }}>
                {legalAnalysis.summary}
              </p>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ color: "#1976d2" }}>Applicable Provisions:</h4>
              {legalAnalysis.applicable_provisions?.map((provision, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "15px",
                    backgroundColor: "white",
                    borderRadius: "8px",
                    marginBottom: "10px",
                    border: "1px solid #ddd",
                  }}
                >
                  <h5 style={{ margin: "0 0 10px 0", color: "#d32f2f" }}>
                    {provision.code}: {provision.title}
                  </h5>
                  <p style={{ margin: "5px 0", fontSize: "14px" }}>
                    <strong>Why Applicable:</strong> {provision.why_applicable}
                  </p>
                  <p style={{ margin: "5px 0", fontSize: "14px" }}>
                    <strong>Classification:</strong> Cognizable:{" "}
                    {provision.classification?.cognizable ? "Yes" : "No"},
                    Bailable:{" "}
                    {provision.classification?.bailable ? "Yes" : "No"}
                  </p>
                  <p style={{ margin: "5px 0", fontSize: "14px" }}>
                    <strong>Punishment:</strong>{" "}
                    {provision.classification?.punishment}
                  </p>
                  {provision.sources?.map((source, sidx) => (
                    <a
                      key={sidx}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-block",
                        marginRight: "10px",
                        color: "#1976d2",
                        fontSize: "13px",
                      }}
                    >
                      📄 {source.name}
                    </a>
                  ))}
                </div>
              ))}
            </div>

            {legalAnalysis.similar_cases &&
              legalAnalysis.similar_cases.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <h4 style={{ color: "#1976d2" }}>Similar Cases:</h4>
                  {legalAnalysis.similar_cases.map((caseItem, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "15px",
                        backgroundColor: "white",
                        borderRadius: "8px",
                        marginBottom: "10px",
                        border: "1px solid #ddd",
                      }}
                    >
                      <h5 style={{ margin: "0 0 10px 0" }}>
                        {caseItem.citation} ({caseItem.year})
                      </h5>
                      <p style={{ margin: "5px 0", fontSize: "14px" }}>
                        <strong>Court:</strong> {caseItem.court}
                      </p>
                      <p style={{ margin: "5px 0", fontSize: "14px" }}>
                        <strong>Similarity:</strong> {caseItem.fact_similarity}
                      </p>
                      <p style={{ margin: "5px 0", fontSize: "14px" }}>
                        <strong>Holding:</strong> {caseItem.key_holding}
                      </p>
                      <a
                        href={caseItem.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#1976d2", fontSize: "13px" }}
                      >
                        📄 View Judgment
                      </a>
                    </div>
                  ))}
                </div>
              )}

            {legalAnalysis.investigation_tips &&
              legalAnalysis.investigation_tips.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <h4 style={{ color: "#1976d2" }}>🔍 Investigation Tips:</h4>
                  <ul style={{ paddingLeft: "20px" }}>
                    {legalAnalysis.investigation_tips.map((tip, idx) => (
                      <li
                        key={idx}
                        style={{ marginBottom: "8px", fontSize: "14px" }}
                      >
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            <div
              style={{
                padding: "15px",
                backgroundColor: "#fff3cd",
                borderRadius: "8px",
              }}
            >
              <p style={{ margin: 0, fontSize: "14px", fontWeight: "bold" }}>
                ⚠️ Confidence Level: {legalAnalysis.confidence?.toUpperCase()}
              </p>
              <p
                style={{
                  margin: "10px 0 0 0",
                  fontSize: "13px",
                  fontStyle: "italic",
                }}
              >
                {legalAnalysis.disclaimer}
              </p>
            </div>

            {ttsAudioUrl && (
              <div style={{ marginTop: "20px" }}>
                <h4 style={{ color: "#1976d2" }}>🔊 Audio Summary:</h4>
                <audio src={ttsAudioUrl} controls style={{ width: "100%" }} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatContainer;
