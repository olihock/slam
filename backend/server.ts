import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express-serve-static-core';
import cors from 'cors';
import bodyParser from 'body-parser';



import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3002;

app.use(cors());
app.use(bodyParser.json());

// POST /api/ask: Empfängt Transkript oder Query, leitet es an den MCP-Server weiter und gibt die Antwort zurück

// MCP-Wikipedia-Server (stdio) Integration

app.post('/api/ask', async (req: Request, res: Response) => {
  const transcript = req.body.transcript || req.body.query;
  // Use MCP_WIKIPEDIA_HTTP_URL or fallback to local default
  const mcpWikipediaHttpUrl = process.env.MCP_WIKIPEDIA_HTTP_URL || 'http://localhost:7073/mcp';
  try {
    const transport = new StreamableHTTPClientTransport(new URL(mcpWikipediaHttpUrl));
    const client = new Client({
      name: 'slam-backend',
      version: '1.0.0'
    });
    await client.connect(transport);
    const result = await client.callTool({
      name: 'wikipedia_lookup',
      arguments: { query: transcript, lang: 'de' }
    });
    let response = '';
    if (Array.isArray(result?.content)) {
      const textObj = result.content.find((c: any) => c.type === 'text');
      response = textObj?.text || JSON.stringify(result);
    } else {
      response = JSON.stringify(result);
    }
    res.json({ response });
  } catch (err) {
    console.error('Fehler bei MCP-Wikipedia-Anfrage:', err);
    res.status(500).json({ response: 'Fehler bei der Anfrage an den MCP-Wikipedia-Server.' });
  }
});

// SPA-Frontend ausliefern (optional, falls Deployment in einem Server)
// app.use(express.static('../dist'));

app.listen(PORT, () => {
  console.log(`Backend läuft auf http://localhost:${PORT}`);
});
