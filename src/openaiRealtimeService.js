// src/openaiRealtimeService.js
// Service für OpenAI Realtime API Sprachaufnahme und Streaming
// Platzhalter: Die eigentliche API-Integration muss mit echten API-Keys und Endpunkten ergänzt werden.


// Hinweis: Die OpenAI Realtime API ist im Browser aktuell nicht direkt verfügbar.
// Für Demo-Zwecke wird die Web Speech API genutzt. Die Integration der echten OpenAI API erfolgt über das Backend.


import OpenAI from "openai";

// Achtung: API-Key sollte im echten Projekt niemals im Frontend liegen!
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export class OpenAIRealtimeService {
  constructor({ onTranscript, onResponse }) {
    this.onTranscript = onTranscript;
    this.onResponse = async (text) => {
      onResponse(text);
      await this.speakWithOpenAI(text);
    };
    this.isListening = false;
    this.recognition = null;
    this.openai = null;
    if (OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: OPENAI_API_KEY, dangerouslyAllowBrowser: true });
    }
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

  async speakWithOpenAI(text) {
    if (!this.openai) {
      // Fallback: Web Speech API TTS
      if ('speechSynthesis' in window) {
        const utterance = new window.SpeechSynthesisUtterance(text);
        utterance.lang = 'de-DE';
        window.speechSynthesis.speak(utterance);
      }
      return;
    }
    try {
      // OpenAI Realtime API: TTS
      const response = await this.openai.audio.speech.create({
        model: "tts-1",
        voice: "nova",
        input: text,
      });
      const audioUrl = URL.createObjectURL(await response.blob());
      const audio = new Audio(audioUrl);
      audio.play();
  } catch {
      // Fallback: Web Speech API TTS
      if ('speechSynthesis' in window) {
        const utterance = new window.SpeechSynthesisUtterance(text);
        utterance.lang = 'de-DE';
        window.speechSynthesis.speak(utterance);
      }
    }
  }
}
