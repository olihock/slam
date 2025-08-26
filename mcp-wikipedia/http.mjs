// http.mjs
import express from 'express';
import cors from 'cors';
import { z } from 'zod';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

const PORT = process.env.PORT || 7073;
const DEFAULT_LANG = process.env.WIKI_LANG || 'de';
const USER_AGENT = process.env.WIKI_UA || 'mcp-wikipedia-demo/1.0 (mailto:you@example.com)';

async function wikiFetch(url) {
  const r = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' }
  });
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
  return r.json();
}

// --- MCP Server & Tools (identisch zur STDIO-Variante) ---
const server = new McpServer({ name: 'wikipedia', version: '1.0.0' });

// 1) Suche
server.registerTool(
  'wikipedia_search',
  {
    title: 'Wikipedia Suche',
    description: 'Sucht Wikipedia-Artikel-Titel (MediaWiki Action API) und liefert Top-Treffer.',
    inputSchema: { query: z.string(), lang: z.string().optional() }
  },
  async ({ query, lang }) => {
    const lg = (lang || DEFAULT_LANG).trim();
    const url = `https://${lg}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json`;
    const data = await wikiFetch(url);
    const hits = (data?.query?.search || []).map(h => ({
      title: h.title,
      pageid: h.pageid,
      snippet: h.snippet
    }));
    return {
      content: [
        { type: 'text', text: hits.length ? `Top ${Math.min(hits.length, 5)} Treffer für "${query}" (${lg}):` : `Keine Treffer für "${query}" (${lg}).` },
        { type: 'json', json: { query, lang: lg, hits } }
      ]
    };
  }
);

// 2) Summary per Titel
server.registerTool(
  'wikipedia_summary',
  {
    title: 'Wikipedia Zusammenfassung',
    description: 'Holt die Artikel-Zusammenfassung (Wikimedia REST /page/summary/{title}).',
    inputSchema: { title: z.string(), lang: z.string().optional() }
  },
  async ({ title, lang }) => {
    const lg = (lang || DEFAULT_LANG).trim();
    const url = `https://${lg}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const sum = await wikiFetch(url);
    const extract = sum.extract || 'Keine Zusammenfassung gefunden.';
    return {
      content: [
        { type: 'text', text: extract },
        { type: 'json', json: { lang: lg, title, summary: sum } }
      ]
    };
  }
);

// 3) Komfort: Suche -> Summary Top-Treffer
server.registerTool(
  'wikipedia_lookup',
  {
    title: 'Wikipedia Lookup',
    description: 'Sucht nach query, liefert Summary des Top-Treffers + Trefferliste.',
    inputSchema: { query: z.string(), topK: z.number().int().min(1).max(10).optional(), lang: z.string().optional() }
  },
  async ({ query, topK = 5, lang }) => {
    const lg = (lang || DEFAULT_LANG).trim();
    const searchUrl = `https://${lg}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json`;
    const s = await wikiFetch(searchUrl);
    const hits = (s?.query?.search || []).slice(0, topK);
    if (!hits.length) {
      return { content: [{ type: 'text', text: `Kein Wikipedia-Artikel gefunden zu "${query}" (${lg}).` }] };
    }
    const first = hits[0];
    const sumUrl = `https://${lg}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(first.title)}`;
    const summary = await wikiFetch(sumUrl);
    return {
      content: [
        { type: 'text', text: summary.extract || `Keine Summary für ${first.title}.` },
        { type: 'json', json: { lang: lg, query, topHit: { title: first.title, pageid: first.pageid }, hits, summary } }
      ]
    };
  }
);

// --- HTTP-Transport + Express ---
const app = express();

// CORS: wichtig für Copilot/VS Code HTTP-MCP (mcp-session-id muss erlaubt sein)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'mcp-session-id']
}));
app.use(express.json());

// Transport einrichten
const transport = new StreamableHTTPServerTransport({ path: '/mcp' });
await server.connect(transport);

// MCP-Endpoints (Session mgmt + Messages)
app.get('/mcp', (req, res) => transport.handleSessionRequest(req, res));
app.delete('/mcp', (req, res) => transport.handleSessionRequest(req, res));
app.post('/mcp', (req, res) => transport.handlePostMessage(req, res, req.body));

// Healthcheck (optional)
app.get('/healthz', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`[MCP] wikipedia server (http) on http://localhost:${PORT}/mcp`);
});
