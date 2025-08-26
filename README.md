# React SPA für OpenAI Realtime API Voice Interaction

Dieses Projekt besteht aus einer React Single Page Application (SPA), einem Backend-Server und einem MCP Wikipedia Server. Die App ermöglicht Sprach- und Texteingabe, sendet Anfragen an das Backend, das wiederum Wikipedia-Inhalte über das Model Context Protocol (MCP) abruft.

---

## Komponenten & Startreihenfolge

1. **MCP Wikipedia Server (HTTP-Modus)**
   - Stellt Wikipedia-Such- und Zusammenfassungsfunktionen über die MCP-API bereit.
   - Muss vor dem Backend gestartet werden.

2. **Backend-Server**
   - Express-Server, der Anfragen vom Frontend entgegennimmt und an den MCP Wikipedia Server weiterleitet.
   - Übersetzt TypeScript nach JavaScript vor dem Start.

3. **Frontend (React SPA)**
   - Benutzeroberfläche für Sprach- und Texteingabe.
   - Kommuniziert mit dem Backend über `/api/ask`.

---

## Alternative: MCP Wikipedia Server als STDIO-Variante

Neben dem HTTP-Modus gibt es auch eine STDIO-Variante des MCP Wikipedia Servers:  
[`mcp-wikipedia/stdio.mjs`](mcp-wikipedia/stdio.mjs)

Diese Variante kann direkt in andere Tools (z.B. GitHub Copilot Agents) eingebunden werden, die das Model Context Protocol über STDIO unterstützen.

### Starten der STDIO-Variante

```bash
cd mcp-wikipedia
npm install
npm run dev
```

### Konfiguration

Der MCP Wikipedia Server kann über Umgebungsvariablen angepasst werden:

- `WIKI_LANG` – Standardsprache (z.B. `de` oder `en`)
- `WIKI_UA` – User-Agent für Wikipedia-API-Requests

Beispiel für den Start mit deutscher Sprache:

```bash
WIKI_LANG=de node stdio.mjs
```


## Konfiguration für VSCode/Agenten (mcp.json)

Um den MCP Wikipedia Server (STDIO) in VSCode oder mit Agenten zu nutzen, kann eine `.vscode/mcp.json` wie folgt aussehen:

```jsonc
{
   "servers": {
      "wikipedia": {
         "type": "stdio",
         "command": "node",
         "args": ["mcp-wikipedia/stdio.mjs"],
         "env": {
            "WIKI_LANG": "de",
            "WIKI_UA": "your-app/0.1 (you@example.com)"
         },
         "dev": {
            "watch": "mcp-wikipedia/**/*.mjs",
            "debug": { "type": "node" }
         }
      }
   }
}
```

Damit kann der Server direkt als MCP-Quelle in unterstützten Extensions oder Agenten verwendet werden.

### Beispielaufruf (STDIO, JSON-RPC)

Sende folgenden JSON-RPC-Request an den STDIO-Server, um nach "Marie Curie" zu suchen:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "wikipedia_lookup",
  "params": {
    "query": "Marie Curie",
    "lang": "de"
  }
}
```

Die Antwort enthält die Zusammenfassung und Trefferliste zu "Marie Curie".

---

## Startanleitung

### 1. MCP Wikipedia Server starten (HTTP-Modus)

```bash
cd mcp-wikipedia
npm install
npm run http
```
Der Server läuft dann auf [http://localhost:7073/mcp](http://localhost:7073/mcp).

### 2. Backend-Server bauen und starten

```bash
cd ../backend
npm install
npm run build
npm start
```
Der Backend-Server läuft auf [http://localhost:3002](http://localhost:3002) und erwartet, dass der MCP Wikipedia Server erreichbar ist.

### 3. Frontend (React SPA) starten

```bash
cd ..
npm install
npm run dev
```
Die App ist dann erreichbar unter:  
[http://localhost:5173](http://localhost:5173)

---

## Übersicht der Komponenten

- **Frontend:** [`src/`](src/) – React SPA, Sprach- und Texteingabe, Kommunikation mit Backend.
- **Backend:** [`backend/server.ts`](backend/server.ts) – Express API, leitet Anfragen an MCP Wikipedia Server weiter.
- **MCP Wikipedia Server (HTTP):** [`mcp-wikipedia/http.mjs`](mcp-wikipedia/http.mjs) – Stellt Wikipedia-Tools über MCP-API bereit.
- **MCP Wikipedia Server (STDIO):** [`mcp-wikipedia/stdio.mjs`](mcp-wikipedia/stdio.mjs) – Für Agenten und direkte Einbindung (z.B. Copilot Agents).

---

## Beispiel-URL für die App

[http://localhost:5173](http://localhost:5173)

---

## Hinweise

- Die Ports können in den jeweiligen `.env`-Dateien oder direkt im Quelltext angepasst werden.
- Die Kommunikation zwischen den Komponenten erfolgt über HTTP (Backend ↔ MCP Wikipedia Server, Frontend ↔ Backend).
- Für die Sprachfunktion wird im Frontend aktuell die Web Speech API als Platzhalter genutzt.

---

*Diese README wird aktualisiert, sobald weitere Features oder Anpassungen vorgenommen werden.*