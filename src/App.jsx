

import { useState, useRef } from 'react';
import { OpenAIRealtimeService } from './openaiRealtimeService';
import { sendTranscriptToBackend } from './backendApi';
import './App.css';



function App() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [mode, setMode] = useState('voice'); // 'voice' oder 'chat'
  const [chatInput, setChatInput] = useState('');
  const serviceRef = useRef(null);

  const handleStart = () => {
    setListening(true);
    setTranscript('');
    setResponse('');
    serviceRef.current = new OpenAIRealtimeService({
      onTranscript: (t) => setTranscript(t),
      onResponse: (r) => setResponse(r),
    });
    serviceRef.current.start();
  };

  const handleStop = async () => {
    setListening(false);
    if (serviceRef.current) {
      serviceRef.current.stop();
    }
    // Sende Transkript an Backend, wenn vorhanden
    if (transcript) {
      setResponse('Warte auf Antwort ...');
      try {
        const backendResponse = await sendTranscriptToBackend(transcript);
        if (mode === 'voice' && serviceRef.current && serviceRef.current.onResponse) {
          await serviceRef.current.onResponse(backendResponse);
        } else {
          setResponse(backendResponse);
        }
      } catch {
        setResponse('Fehler bei der Backend-Anfrage.');
      }
    }
  };

  const handleChatSend = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setTranscript(chatInput);
    setResponse('Warte auf Antwort ...');
    try {
      const backendResponse = await sendTranscriptToBackend(chatInput);
      setResponse(backendResponse);
    } catch {
      setResponse('Fehler bei der Backend-Anfrage.');
    }
    setChatInput('');
  };

  // --- ab hier return und Funktionsende ---

  return (
    <div className="container">
      <h1>Voice & Chat Assistant</h1>
      <div className="controls" style={{ marginBottom: '1rem' }}>
        <button onClick={() => setMode('voice')} disabled={mode === 'voice'}>Sprache</button>
        <button onClick={() => setMode('chat')} disabled={mode === 'chat'}>Chat</button>
      </div>

      {mode === 'voice' ? (
        <div>
          <div className="controls">
            <button onClick={handleStart} disabled={listening}>
              Start Listening
            </button>
            <button onClick={handleStop} disabled={!listening}>
              Stop Listening
            </button>
          </div>
        </div>
      ) : (
        <form className="controls" onSubmit={handleChatSend} style={{ gap: '0.5rem' }}>
          <input
            type="text"
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            placeholder="Nachricht eingeben..."
            style={{ flex: 1, padding: '0.5em', fontSize: '1em' }}
          />
          <button type="submit">Senden</button>
        </form>
      )}

      <div className="section">
        <h2>Eingabe</h2>
        <div className="transcript-box">{transcript || <em>No input yet.</em>}</div>
      </div>
      <div className="section">
        <h2>Antwort</h2>
        <div className="response-box">{response || <em>No response yet.</em>}</div>
      </div>
    </div>
  );
}

export default App;
