import { useState, useRef } from "react";

const ChatContainer = () => {
  const [permission, setPermission] = useState(false);
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioURL, setAudioURL] = useState("");
  const [transcription, setTranscription] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("auto");

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Only Hindi, Tamil, and English
  const languages = [
    { code: "auto", name: "🌐 Auto-detect", flag: "🌍" },
    { code: "english", name: "English", flag: "🇬🇧" },
    { code: "hindi", name: "हिन्दी (Hindi)", flag: "🇮🇳" },
    { code: "tamil", name: "தமிழ் (Tamil)", flag: "🇮🇳" },
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

      const response = await fetch("http://localhost:5000/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setTranscription(data.transcription);
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

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "600px",
        margin: "0 auto",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h2 style={{ textAlign: "center" }}>🎙️ Audio Recorder & Transcriber</h2>
      <p style={{ color: "#666", textAlign: "center", marginBottom: "30px" }}>
        Supports English, Hindi (हिन्दी), and Tamil (தமிழ்)
      </p>

      <div style={{ marginTop: "20px" }}>
        {/* Language Selector */}
        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "bold",
              fontSize: "16px",
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
              backgroundColor: "white",
              cursor: "pointer",
              outline: "none",
            }}
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
          <p
            style={{
              fontSize: "13px",
              color: "#888",
              marginTop: "8px",
              fontStyle: "italic",
            }}
          >
            💡 Tip: Use Auto-detect if you're not sure which language you'll
            speak
          </p>
        </div>

        {/* Get Permission Button */}
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
              boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            }}
          >
            🎤 Get Microphone Permission
          </button>
        )}

        {/* Recording Controls */}
        {permission && (
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              onClick={recording ? stopRecording : startRecording}
              style={{
                flex: "1",
                minWidth: "200px",
                padding: "15px 20px",
                fontSize: "18px",
                cursor: "pointer",
                backgroundColor: recording ? "#f44336" : "#2196F3",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontWeight: "bold",
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
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
                  minWidth: "200px",
                  padding: "15px 20px",
                  fontSize: "18px",
                  cursor: loading ? "not-allowed" : "pointer",
                  backgroundColor: loading ? "#ccc" : "#FF9800",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  boxShadow: loading ? "none" : "0 2px 4px rgba(0,0,0,0.2)",
                }}
              >
                {loading ? "⏳ Transcribing..." : "📝 Transcribe Audio"}
              </button>
            )}
          </div>
        )}

        {/* Audio Playback */}
        {audioURL && (
          <div
            style={{
              marginTop: "25px",
              padding: "20px",
              backgroundColor: "#f9f9f9",
              borderRadius: "8px",
              border: "1px solid #ddd",
            }}
          >
            <h3 style={{ marginTop: "0", fontSize: "18px" }}>
              🔊 Recorded Audio:
            </h3>
            <audio
              src={audioURL}
              controls
              style={{ width: "100%", marginTop: "10px" }}
            />
          </div>
        )}

        {/* Transcription Result */}
        {transcription && (
          <div
            style={{
              marginTop: "25px",
              padding: "20px",
              backgroundColor: "#e8f5e9",
              borderRadius: "8px",
              border: "2px solid #4CAF50",
            }}
          >
            <h3
              style={{
                marginTop: "0",
                fontSize: "18px",
                color: "#2e7d32",
              }}
            >
              📄 Transcription:
            </h3>
            <p
              style={{
                fontSize: "18px",
                lineHeight: "1.8",
                color: "#1b5e20",
                fontWeight: "500",
                margin: "10px 0 0 0",
              }}
            >
              {transcription}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatContainer;
