import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
const app = express();
const PORT = process.env.PORT || 8080;
app.use(cors());
app.use(bodyParser.json());
// POST /semantic-search: Simuliert semantische Suche
app.post('/semantic-search', (req, res) => {
    const { query } = req.body;
    // Simulierte "semantische Suche" (hier einfach nur Echo + Zeitstempel)
    const result = {
        response: `MCP-Server: Antwort auf "${query}" um ${new Date().toLocaleTimeString()}`
    };
    res.json(result);
});
app.listen(PORT, () => {
    console.log(`MCP-Server läuft auf http://localhost:${PORT}`);
});
//# sourceMappingURL=server.js.map