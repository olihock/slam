import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
const app = express();
const PORT = process.env.PORT || 8080;
app.use(cors());
app.use(bodyParser.json());
// POST /semantic-search: Simuliert semantische Suche
import fetch from 'node-fetch';
app.post('/semantic-search', async (req, res) => {
    const { query } = req.body;
    try {
        // 1. Wikipedia-Suche nach passender Seite
        const searchUrl = `https://de.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
        const searchRes = await fetch(searchUrl);
        if (!searchRes.ok)
            throw new Error('Wikipedia Search API Fehler');
        const searchData = await searchRes.json();
        const firstHit = searchData.query?.search?.[0];
        if (!firstHit) {
            res.json({ response: 'Kein Wikipedia-Artikel gefunden.' });
            return;
        }
        const pageTitle = firstHit.title;
        // 2. Hole die Summary der gefundenen Seite
        const summaryUrl = `https://de.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`;
        const wikiRes = await fetch(summaryUrl);
        if (!wikiRes.ok)
            throw new Error('Wikipedia Summary API Fehler');
        const wikiData = await wikiRes.json();
        const response = wikiData.extract || 'Keine Zusammenfassung gefunden.';
        res.json({ response });
    }
    catch (err) {
        res.json({ response: 'Fehler bei der Wikipedia-Anfrage.' });
    }
});
app.listen(PORT, () => {
    console.log(`MCP-Server läuft auf http://localhost:${PORT}`);
});
//# sourceMappingURL=server.js.map