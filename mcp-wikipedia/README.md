# MCP Wikipedia Server

## Kurzbeschreibung

Der MCP Wikipedia Server stellt eine Schnittstelle bereit, um Wikipedia-Artikel und Zusammenfassungen über das Model Context Protocol (MCP) abzufragen. Er ermöglicht es, Wikipedia-Inhalte programmatisch zu durchsuchen und abzurufen.


## Starten des Servers

Der MCP Wikipedia Server wird als Modul genutzt, z.B. für lokale Anfragen aus anderen Node.js-Prozessen.

Start:

```bash
node server.mjs
```


## Integration in VSCode

Um den MCP Wikipedia Server in VSCode zu nutzen, kann er als externer MCP-Server hinzugefügt werden:

1. Öffne die VSCode-Einstellungen (z.B. über das Zahnrad unten links).
2. Suche nach "MCP Server" oder gehe zu den Einstellungen für die MCP-Integration.
3. Füge die Server-URL hinzu, z.B.:
   
	```
	http://localhost:3000
	```
4. Speichere die Einstellungen. Nun kann der Server für semantische Suchen und Wikipedia-Anfragen in unterstützten Extensions verwendet werden.

## Beispielaufruf

Nach dem Start kann der Server über HTTP-Anfragen angesprochen werden, z.B.:

```
GET http://localhost:3000/wikipedia?query=Marie%20Curie
```

Dies liefert eine Zusammenfassung des Wikipedia-Artikels zu "Marie Curie".
