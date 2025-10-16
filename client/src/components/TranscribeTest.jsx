import { useState, useRef } from "react";

const TranscribeTest = () => {
  const [permission, setPermission] = useState(false);
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioURL, setAudioURL] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("auto");
  const [enableTTS, setEnableTTS] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const languages = [
    { code: "auto", name: "🌐 Auto-detect" },
    { code: "english", name: "🇬🇧 English" },
    { code: "hindi", name: "🇮🇳 Hindi (हिन्दी)" },
    { code: "tamil", name: "🇮🇳 Tamil (தமிழ்)" },
  ];

  const getMicrophonePermission = async () => {
    if ("MediaRecorder" in window) {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setPermission(true);
        console.log("✅ Microphone permission granted");
      } catch (err) {
        alert(`Error: ${err.message}`);
      }
    } else {
      alert("MediaRecorder API is not supported");
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
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioURL(url);
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
      alert("No audio recorded");
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      formData.append("language", selectedLanguage);
      formData.append("enableTTS", enableTTS.toString());

      const response = await fetch("http://localhost:5000/api/transcribe", {
        method: "POST",
        body: formData,
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
      <h2>🎙️ Audio Transcription API Test</h2>
      <p className="subtitle">Endpoint: POST /api/transcribe</p>

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
          🔊 Enable Text-to-Speech Response
        </label>
      </div>

      {!permission && (
        <button onClick={getMicrophonePermission} className="submit-btn">
          🎤 Get Microphone Permission
        </button>
      )}

      {permission && (
        <div className="recording-controls">
          <button
            onClick={recording ? stopRecording : startRecording}
            className={`submit-btn ${recording ? "recording" : ""}`}
          >
            {recording ? "⏹️ Stop Recording" : "🎙️ Start Recording"}
          </button>

          {audioBlob && (
            <button
              onClick={transcribeAudio}
              disabled={loading}
              className="submit-btn"
            >
              {loading ? "⏳ Processing..." : "📝 Transcribe Audio"}
            </button>
          )}
        </div>
      )}

      {audioURL && (
        <div className="audio-player">
          <h4>🔊 Recorded Audio</h4>
          <audio src={audioURL} controls />
        </div>
      )}

      {error && (
        <div className="error-box">
          <h3>❌ Error</h3>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="result-box">
          <h3>✅ Transcription Results</h3>

          <div className="result-section">
            <h4>📄 Transcription</h4>
            <p className="transcription-text">{result.transcription}</p>
          </div>

          <div className="result-section">
            <h4>🤖 AI Analysis</h4>
            <p>{result.analysis}</p>
          </div>

          <div className="result-section">
            <p>
              <strong>Language:</strong> {result.language}
            </p>
            <p>
              <strong>File:</strong> {result.fileName} (
              {(result.fileSize / 1024).toFixed(2)} KB)
            </p>
          </div>

          {result.audio && (
            <div className="result-section">
              <h4>🔊 AI Response Audio</h4>
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

export default TranscribeTest;
