import { useState, useRef } from "react";

const UnifiedLegalApp = ({ language }) => {
  const [inputMode, setInputMode] = useState("text"); // text | voice
  const [queryType, setQueryType] = useState("complaint"); // complaint | query
  const [content, setContent] = useState("");
  const [locationState, setLocationState] = useState("");
  const [evidence, setEvidence] = useState([]);
  const [aggravating, setAggravating] = useState([]);
  const [enableTTS, setEnableTTS] = useState(false);

  // Voice recording
  const [permission, setPermission] = useState(false);
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioURL, setAudioURL] = useState("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const translations = {
    english: {
      inputMode: "Input Method",
      typeText: "Type Text",
      speakVoice: "Speak Voice",
      queryType: "Query Type",
      complaint: "Complaint (Get Sections)",
      legalQuery: "Legal Question (Get Answer)",
      contentLabel: "Describe your complaint or ask your question",
      location: "Location (State/UT)",
      evidence: "Evidence Available",
      aggravating: "Aggravating Factors",
      enableTTS: "Enable Text-to-Speech",
      getMic: "Get Microphone Permission",
      startRec: "Start Recording",
      stopRec: "Stop Recording",
      transcribe: "Transcribe & Analyze",
      submit: "Submit Legal Request",
      processing: "Processing...",
      noAudio: "No audio recorded",
      error: "Error",
      results: "Legal Analysis Results",
      summary: "Summary",
      provisions: "Applicable Provisions",
      judgments: "Similar Judgments",
      answer: "Answer",
      guidance: "Procedural Guidance",
      confidence: "Confidence Level",
    },
    hindi: {
      inputMode: "इनपुट विधि",
      typeText: "टेक्स्ट टाइप करें",
      speakVoice: "आवाज़ बोलें",
      queryType: "प्रश्न प्रकार",
      complaint: "शिकायत (धाराएँ प्राप्त करें)",
      legalQuery: "कानूनी प्रश्न (उत्तर प्राप्त करें)",
      contentLabel: "अपनी शिकायत का वर्णन करें या अपना प्रश्न पूछें",
      location: "स्थान (राज्य/केंद्र शासित प्रदेश)",
      evidence: "उपलब्ध साक्ष्य",
      aggravating: "उत्तेजक कारक",
      enableTTS: "टेक्स्ट-टू-स्पीच सक्षम करें",
      getMic: "माइक्रोफ़ोन अनुमति प्राप्त करें",
      startRec: "रिकॉर्डिंग प्रारंभ करें",
      stopRec: "रिकॉर्डिंग रोकें",
      transcribe: "ट्रांसक्राइब और विश्लेषण करें",
      submit: "कानूनी अनुरोध सबमिट करें",
      processing: "प्रसंस्करण...",
      noAudio: "कोई ऑडियो रिकॉर्ड नहीं किया गया",
      error: "त्रुटि",
      results: "कानूनी विश्लेषण परिणाम",
      summary: "सारांश",
      provisions: "लागू प्रावधान",
      judgments: "समान निर्णय",
      answer: "उत्तर",
      guidance: "प्रक्रियात्मक मार्गदर्शन",
      confidence: "विश्वास स्तर",
    },
    tamil: {
      inputMode: "உள்ளீட்டு முறை",
      typeText: "உரையை தட்டச்சு செய்யவும்",
      speakVoice: "குரல் பேசவும்",
      queryType: "வினவல் வகை",
      complaint: "புகார் (பிரிவுகளைப் பெறுங்கள்)",
      legalQuery: "சட்ட கேள்வி (பதிலைப் பெறுங்கள்)",
      contentLabel:
        "உங்கள் புகாரை விவரிக்கவும் அல்லது உங்கள் கேள்வியைக் கேளுங்கள்",
      location: "இடம் (மாநிலம்/யூனியன் பிரதேசம்)",
      evidence: "கிடைக்கும் சான்றுகள்",
      aggravating: "மோசமான காரணிகள்",
      enableTTS: "உரை-க்கு-பேச்சை இயக்கவும்",
      getMic: "மைக்ரோஃபோன் அனுமதி பெறுங்கள்",
      startRec: "பதிவைத் தொடங்கவும்",
      stopRec: "பதிவை நிறுத்தவும்",
      transcribe: "படியெடுத்து பகுப்பாய்வு செய்யவும்",
      submit: "சட்ட கோரிக்கையை சமர்ப்பிக்கவும்",
      processing: "செயலாக்கம்...",
      noAudio: "ஆடியோ பதிவு செய்யப்படவில்லை",
      error: "பிழை",
      results: "சட்ட பகுப்பாய்வு முடிவுகள்",
      summary: "சுருக்கம்",
      provisions: "பொருந்தும் விதிகள்",
      judgments: "ஒத்த தீர்ப்புகள்",
      answer: "பதில்",
      guidance: "நடைமுறை வழிகாட்டுதல்",
      confidence: "நம்பிக்கை நிலை",
    },
  };

  const t = translations[language];

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
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermission(true);
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioURL(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const transcribeAudio = async () => {
    if (!audioBlob) {
      alert(t.noAudio);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      formData.append("language", language);

      const response = await fetch("http://localhost:5000/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setContent(data.transcription);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitLegalRequest = async () => {
    if (!content.trim()) {
      alert("Please provide content");
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch("http://localhost:5000/api/legal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          narrative: content,
          location_state: locationState,
          evidence_available: evidence,
          aggravating_factors: aggravating,
          language: language,
          is_complaint: queryType === "complaint",
          enableTTS: enableTTS,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="unified-container">
      {/* Input Mode Selection */}
      <div className="mode-selector">
        <label>{t.inputMode}:</label>
        <div className="button-group">
          <button
            className={inputMode === "text" ? "active" : ""}
            onClick={() => setInputMode("text")}
          >
            📝 {t.typeText}
          </button>
          <button
            className={inputMode === "voice" ? "active" : ""}
            onClick={() => setInputMode("voice")}
          >
            🎙️ {t.speakVoice}
          </button>
        </div>
      </div>

      {/* Query Type Selection */}
      <div className="mode-selector">
        <label>{t.queryType}:</label>
        <div className="button-group">
          <button
            className={queryType === "complaint" ? "active" : ""}
            onClick={() => setQueryType("complaint")}
          >
            ⚖️ {t.complaint}
          </button>
          <button
            className={queryType === "query" ? "active" : ""}
            onClick={() => setQueryType("query")}
          >
            ❓ {t.legalQuery}
          </button>
        </div>
      </div>

      {/* Voice Input */}
      {inputMode === "voice" && (
        <div className="voice-section">
          {!permission ? (
            <button onClick={getMicrophonePermission} className="submit-btn">
              🎤 {t.getMic}
            </button>
          ) : (
            <>
              <button
                onClick={recording ? stopRecording : startRecording}
                className={`submit-btn ${recording ? "recording" : ""}`}
              >
                {recording ? `⏹️ ${t.stopRec}` : `🎙️ ${t.startRec}`}
              </button>
              {audioURL && <audio src={audioURL} controls />}
              {audioBlob && (
                <button
                  onClick={transcribeAudio}
                  className="submit-btn"
                  disabled={loading}
                >
                  {loading ? t.processing : `📝 ${t.transcribe}`}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Text Input */}
      <div className="form-group">
        <label>{t.contentLabel}:</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          placeholder={
            language === "hindi"
              ? "यहाँ टाइप करें..."
              : language === "tamil"
              ? "இங்கே தட்டச்சு செய்யவும்..."
              : "Type here..."
          }
        />
      </div>

      {/* Additional Fields for Complaints */}
      {queryType === "complaint" && (
        <>
          <div className="form-group">
            <label>{t.location}:</label>
            <input
              type="text"
              value={locationState}
              onChange={(e) => setLocationState(e.target.value)}
              placeholder="Delhi, Maharashtra..."
            />
          </div>

          <div className="form-group">
            <label>{t.evidence}:</label>
            <div className="chip-group">
              {evidenceOptions.map((item) => (
                <button
                  key={item}
                  onClick={() =>
                    setEvidence((prev) =>
                      prev.includes(item)
                        ? prev.filter((e) => e !== item)
                        : [...prev, item]
                    )
                  }
                  className={`chip ${evidence.includes(item) ? "active" : ""}`}
                >
                  {evidence.includes(item) && "✓ "}
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>{t.aggravating}:</label>
            <div className="chip-group">
              {aggravatingOptions.map((item) => (
                <button
                  key={item}
                  onClick={() =>
                    setAggravating((prev) =>
                      prev.includes(item)
                        ? prev.filter((a) => a !== item)
                        : [...prev, item]
                    )
                  }
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
        </>
      )}

      <div className="form-group checkbox-group">
        <label>
          <input
            type="checkbox"
            checked={enableTTS}
            onChange={(e) => setEnableTTS(e.target.checked)}
          />
          🔊 {t.enableTTS}
        </label>
      </div>

      <button
        onClick={submitLegalRequest}
        disabled={loading || !content.trim()}
        className="submit-btn"
      >
        {loading ? `⏳ ${t.processing}` : `⚖️ ${t.submit}`}
      </button>

      {error && (
        <div className="error-box">
          <h3>❌ {t.error}</h3>
          <p>{error}</p>
        </div>
      )}

      {result && result.legal_analysis && (
        <div className="result-box">
          <h3>✅ {t.results}</h3>

          {result.query_type === "complaint" ? (
            <>
              {result.legal_analysis.summary && (
                <div className="result-section">
                  <h4>{t.summary}</h4>
                  <p>{result.legal_analysis.summary}</p>
                </div>
              )}

              <div className="result-section">
                <h4>
                  {t.provisions} (
                  {result.legal_analysis.applicable_provisions?.length || 0})
                </h4>
                {result.legal_analysis.applicable_provisions?.map(
                  (provision, idx) => (
                    <div key={idx} className="provision-card">
                      <h5>
                        {provision.statute} - Section {provision.section}
                      </h5>
                      <p>
                        <strong>{provision.description}</strong>
                      </p>
                      <p>{provision.provision_text}</p>
                      <p>
                        <strong>Punishment:</strong>{" "}
                        {provision.punishment_range}
                      </p>
                      <a
                        href={provision.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        📄 View Source
                      </a>
                    </div>
                  )
                )}
              </div>

              {result.legal_analysis.similar_judgments && (
                <div className="result-section">
                  <h4>
                    {t.judgments} (
                    {result.legal_analysis.similar_judgments.length})
                  </h4>
                  {result.legal_analysis.similar_judgments.map(
                    (judgment, idx) => (
                      <div key={idx} className="case-card">
                        <h5>{judgment.citation}</h5>
                        <p>
                          <strong>
                            {judgment.court} ({judgment.year})
                          </strong>
                        </p>
                        <p>{judgment.holding}</p>
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
            </>
          ) : (
            <>
              <div className="result-section">
                <h4>{t.answer}</h4>
                <p>{result.legal_analysis.answer}</p>
              </div>

              {result.legal_analysis.procedural_guidance && (
                <div className="result-section">
                  <h4>{t.guidance}</h4>
                  <p>{result.legal_analysis.procedural_guidance}</p>
                </div>
              )}
            </>
          )}

          <div className="result-section confidence">
            <p>
              <strong>{t.confidence}:</strong>{" "}
              {result.legal_analysis.confidence?.toUpperCase()}
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
        </div>
      )}
    </div>
  );
};

export default UnifiedLegalApp;
