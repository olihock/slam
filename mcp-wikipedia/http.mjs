// http.mjs

import express from 'express';
import cors from 'cors';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';

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
function createWikipediaServer() {
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
          { type: 'text', text: JSON.stringify({ query, lang: lg, hits }) }
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
          { type: 'text', text: JSON.stringify({ lang: lg, title, summary: sum }) }
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
          { type: 'text', text: JSON.stringify({ lang: lg, query, topHit: { title: first.title, pageid: first.pageid }, hits, summary }) }
        ]
      };
    }
  );

  return server;
}

const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'mcp-session-id'],
  exposedHeaders: ['mcp-session-id']
}));
app.use(express.json());

// Session management for StreamableHTTPServerTransport
const transports = {};

app.post('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] || req.headers['Mcp-Session-Id'];
  let transport;

  if (sessionId && transports[sessionId]) {
    transport = transports[sessionId];
  } else if (!sessionId && isInitializeRequest(req.body)) {
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sid) => {
        transports[sid] = transport;
      },
      // enableDnsRebindingProtection: true, // Uncomment for local security
      // allowedHosts: ['127.0.0.1'],
    });
    transport.onclose = () => {
      if (transport.sessionId) delete transports[transport.sessionId];
    };
    const server = createWikipediaServer();
    await server.connect(transport);
  } else {
    res.status(400).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Bad Request: No valid session ID provided' },
      id: null
    });
    return;
  }
  await transport.handleRequest(req, res, req.body);
});

const handleSessionRequest = async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] || req.headers['Mcp-Session-Id'];
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }
  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
};

app.get('/mcp', handleSessionRequest);
app.delete('/mcp', handleSessionRequest);

// Healthcheck (optional)
app.get('/healthz', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`[MCP] wikipedia server (http, session) on http://localhost:${PORT}/mcp`);
});
