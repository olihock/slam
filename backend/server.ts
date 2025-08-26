import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express-serve-static-core';
import cors from 'cors';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

app.use(cors());
app.use(bodyParser.json());

// POST /api/ask: Empfängt Transkript oder Query, leitet es an den MCP-Server weiter und gibt die Antwort zurück
app.post('/api/ask', async (req: Request, res: Response) => {
  const transcript = req.body.transcript || req.body.query;
  const mcpUrl = process.env.MCP_URL || 'http://localhost:8080/semantic-search';
  const mcpApiKey = process.env.MCP_API_KEY || '';
  try {
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
    const mcpData = await mcpRes.json() as { response?: string; result?: string };
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
