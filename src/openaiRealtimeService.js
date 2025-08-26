// src/openaiRealtimeService.js
// Service für OpenAI Realtime API Sprachaufnahme und Streaming
// Platzhalter: Die eigentliche API-Integration muss mit echten API-Keys und Endpunkten ergänzt werden.


// Hinweis: Die OpenAI Realtime API ist im Browser aktuell nicht direkt verfügbar.
// Für Demo-Zwecke wird die Web Speech API genutzt. Die Integration der echten OpenAI API erfolgt über das Backend.

export class OpenAIRealtimeService {
  constructor({ onTranscript, onResponse }) {
    this.onTranscript = onTranscript;
    this.onResponse = onResponse;
    this.isListening = false;
    this.recognition = null;
    // TODO: Für echte OpenAI-Integration: Verbindung zum Backend herstellen
  }

  start() {
    this.isListening = true;
    // Web Speech API als Fallback für Speech-to-Text
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'de-DE';
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 1;
      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        this.onTranscript(transcript);
      };
      this.recognition.onend = () => {
        this.isListening = false;
      };
      this.recognition.start();
    } else {
      // Fallback: Simuliertes Transkript
      setTimeout(() => {
        if (this.isListening) this.onTranscript('Dies ist ein Beispiel-Transkript.');
      }, 1500);
    }
  }

  stop() {
    this.isListening = false;
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }
  }
}
