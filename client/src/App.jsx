import { useState } from "react";
import UnifiedLegalApp from "./components/UnifiedLegalApp";
import "./App.css";

function App() {
  const [language, setLanguage] = useState("english");

  const translations = {
    english: {
      title: "Legal Assistant for Police Officers",
      subtitle: "AI-powered legal research for Indian criminal law",
      languageLabel: "Language",
    },
    hindi: {
      title: "पुलिस अधिकारियों के लिए कानूनी सहायक",
      subtitle: "भारतीय आपराधिक कानून के लिए AI-संचालित कानूनी अनुसंधान",
      languageLabel: "भाषा",
    },
    tamil: {
      title: "காவல்துறை அதிகாரிகளுக்கான சட்ட உதவியாளர்",
      subtitle: "இந்திய குற்றவியல் சட்டத்திற்கான AI-இயங்கும் சட்ட ஆராய்ச்சி",
      languageLabel: "மொழி",
    },
  };

  const t = translations[language];

  return (
    <div className="app">
      <header className="header">
        <div className="language-selector">
          <label>{t.languageLabel}:</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="english">🇬🇧 English</option>
            <option value="hindi">🇮🇳 हिन्दी</option>
            <option value="tamil">🇮🇳 தமிழ்</option>
          </select>
        </div>
        <h1>⚖️ {t.title}</h1>
        <p>{t.subtitle}</p>
      </header>

      <UnifiedLegalApp language={language} />

      <footer className="footer">
        <p>Backend: http://localhost:5000 | Status: 🟢 Connected</p>
      </footer>
    </div>
  );
}

export default App;
