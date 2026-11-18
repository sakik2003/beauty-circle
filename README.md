# Beauty Circle – klickbarer Prototyp (Phase 1)

Beauty-Community für Frauen, nach Städten: beste Studios, Stadt-Chat und Pakete wie das **Chaya Paket**,
bei denen man pro Leistung ein Studio wählt – online buchbar, per Anfrage oder manuell mit Kontaktdaten.

> Alle Studios, Personen, Bewertungen und Telefonnummern sind **erfunden**.
> Eingaben werden nur im Browser (localStorage) gespeichert, es gibt noch keinen Server.

## Starten
Ohne Installation: `index.html` per Doppelklick im Browser öffnen.

Oder mit einem kleinen lokalen Server (empfohlen):
```bash
python -m http.server 8765 --directory web-app
```
Dann http://localhost:8765 öffnen.

## Was ändere ich wo?
| Was | Datei |
|---|---|
| App-Name, Städte, Puffer-Zeit, Erinnerungszeit | `js/config.js` |
| Studios, Leistungen, Preise, Pakete, Chat-Beispiele | `js/data.js` |
| Farben, Schriften, Abstände (hell + dunkel) | `css/styles.css` (oben, `:root`) |

Neue Stadt: in `config.js` unter `cities` eintragen und in `data.js` bei `STUDIO_DEFS` und `DISTRICTS`
einen Block mit dem gleichen `slug` anlegen.

## Aufbau
```
web-app/
  index.html          Grundgerüst (Kopf, Navigation, Fuß)
  css/styles.css      Design
  js/config.js        Einstellungen
  js/data.js          Beispieldaten (später: Datenbank)
  js/core.js          Hilfsfunktionen, Speicher, Datenzugriff (in Phase 2 auf Supabase umstellen)
  js/components.js    Bausteine: Kennzeichen, Studio-Karte, Kontaktkarte, Terminauswahl
  js/pages.js         Start, Stadt, Kategorie, Studio-Profil, Pakete, Login, Rechtliches
  js/wizard.js        Paket-Ablauf in 5 Schritten
  js/account.js       Konto, Meine Pakete (Checkliste), Buchungen, Merkliste, Erinnerungen
  js/community.js     Kanäle, Chat, Fragen-Threads, Reaktionen, Melden
  js/app.js           Router und Start
```

## Demo-Hinweise
- Anfragen werden nach 10 Sekunden automatisch „vom Studio bestätigt“ (Einstellung in `config.js`).
- In einem gespeicherten Paket gibt es den Knopf „Demo: 48 Std. vorspulen“, um die Erinnerung zu sehen.
- „Konto → Alle Daten löschen“ setzt die Demo zurück.

## Nächste Phase
Siehe `Plan-und-KI-Prompt.md` (Phase 2: Supabase, echtes Login, echter Chat, Admin-Bereich).
