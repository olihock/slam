import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const DEFAULT_LANG = process.env.WIKI_LANG || 'de';
const USER_AGENT = process.env.WIKI_UA || 'mcp-wikipedia-demo/1.0 (mailto:you@example.com)';

async function wikiFetch(url) {
  const r = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' }
  });
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
  return r.json();
}

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
  inputSchema: { query: z.string(), topK: z.number().int().optional(), lang: z.string().optional() }
  },
  async ({ query, topK = 5, lang }) => {
    console.log("Tool wikipedia_lookup aufgerufen mit Query:", query);
    const lg = (lang || DEFAULT_LANG).trim();
    // Range-Check für topK
    if (typeof topK !== 'number' || isNaN(topK)) topK = 5;
    if (topK < 1) topK = 1;
    if (topK > 10) topK = 10;
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

const transport = new StdioServerTransport();
await server.connect(transport);
console.log('[MCP] wikipedia server (stdio) ready');