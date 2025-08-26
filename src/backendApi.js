// src/backendApi.js
// API-Client für die Kommunikation mit dem Backend

export async function sendTranscriptToBackend(transcript) {
  // TODO: Passe die URL an dein Backend an
  const response = await fetch('/api/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript }),
  });
  if (!response.ok) throw new Error('Backend error');
  const data = await response.json();
  return data.response;
}
