// backend/server.js
// Minimal Express-Backend für die SPA




import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';

// Ensure process is available in ESM context (Node.js provides it globally, but for some bundlers or environments, explicit import may be needed)
import process from 'process';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// POST /api/ask: Empfängt Transkript, leitet es an den MCP-Server weiter und gibt die Antwort zurück
app.post('/api/ask', async (req, res) => {
  const { transcript } = req.body;
  const mcpUrl = process.env.MCP_URL || 'http://localhost:8080/semantic-search'; // Beispiel-URL
  const mcpApiKey = process.env.MCP_API_KEY || '';
  try {
    // Anfrage an MCP-Server
    const mcpRes = await fetch(mcpUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(mcpApiKey ? { 'Authorization': `Bearer ${mcpApiKey}` } : {}),
      },
      body: JSON.stringify({ query: transcript }),
    });
    if (!mcpRes.ok) {
      throw new Error('MCP-Server Fehler');
    }
    const mcpData = await mcpRes.json();
    // Die genaue Struktur hängt vom MCP-Server ab. Hier wird ein generisches Feld verwendet:
    const response = mcpData.response || mcpData.result || JSON.stringify(mcpData);
    res.json({ response });
  } catch (err) {
    console.error('Fehler bei MCP-Anfrage:', err);
    res.status(500).json({ response: 'Fehler bei der Anfrage an den MCP-Server.' });
  }
});

// SPA-Frontend ausliefern (optional, falls Deployment in einem Server)
// app.use(express.static('../dist'));

app.listen(PORT, () => {
  console.log(`Backend läuft auf http://localhost:${PORT}`);
});
