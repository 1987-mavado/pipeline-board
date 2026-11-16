# pipeline

Privates Kanban-Board für Jobbewerbungen und Freelance-Anfragen.
Vite + React + TypeScript, Drag & Drop mit @dnd-kit, Daten im localStorage des Browsers.

## Start

```bash
npm install
npm run dev
```

Danach die angezeigte Adresse öffnen (Standard: http://localhost:5173).

## Build für statisches Hosting

```bash
npm run build
```

Erzeugt den Ordner `dist/`. Den Inhalt auf einen beliebigen statischen Host laden
(Netlify, Vercel, GitHub Pages, eigener Webspace per FTP). Da `base: './'` gesetzt ist,
läuft der Build auch in einem Unterordner. Lokal prüfen mit `npm run preview`.

**Wichtig:** Die Daten liegen im localStorage des jeweiligen Browsers und der jeweiligen Domain.
Ein anderer Browser, ein anderes Gerät oder eine neue Domain startet leer. Für Umzüge und als
Sicherung: Menü → „export json“ und „import json“.

## Bedienung

- **Karte öffnen:** Klick oder Fokus + Enter
- **Verschieben:** ziehen (Maus); mobil lange drücken und ziehen; per Tastatur Leertaste,
  Pfeiltasten, Leertaste/Enter zum Ablegen, Escape zum Abbrechen
- **Haken / Kreuz:** Karte geht nach „angenommen“ bzw. „abgelehnt“, mit „rückgängig“ im Toast (5 s)
- **Neue Karte:** „+ neu“ oben in jeder aktiven Spalte. Im Drawer speichert Cmd/Strg + Enter
- **Suche:** filtert nach Firma/Kunde und Position/Rolle. Solange gesucht wird, ist Drag & Drop pausiert
- **Nachfassen:** Karten, die länger als 14 Tage in „abgesendet“/„beworben“ oder „prozess läuft“ liegen
- **Automatische Daten:** Beim Wechsel nach „gefunden“, „abgesendet“ oder „beworben“ wird das passende
  Datumsfeld auf heute gesetzt, wenn es noch leer ist

## Anpassen

Alles Wichtige steht in `src/config/boards.ts`:

| Konstante | Zweck |
| --- | --- |
| `JOB_COLUMNS`, `FREELANCE_COLUMNS` | Stände/Spalten. `kind: 'end'` = schmale Endspalte rechts, `followUp: true` = Nachfass-Hinweis |
| `BOARDS[…].fields` | Felder im Drawer |
| `BOARDS[…].autoDates` | Spalte → Datumsfeld, das beim Betreten gesetzt wird |
| `FOLLOW_UP_DAYS` | Schwelle für „nachfassen“ (14) |
| `TOAST_DURATION` | Anzeigedauer des Rückgängig-Toasts |
| `STORAGE_VERSION` | Version des gespeicherten Formats |

Spalten lassen sich gefahrlos umbenennen (`label`). Wird eine Spalten-`id` entfernt oder geändert,
landen deren Karten beim nächsten Laden in der ersten Spalte, es geht also nichts verloren.
Bei Änderungen am Datenformat `STORAGE_VERSION` erhöhen und in `src/lib/storage.ts` unter
`MIGRATIONS` einen Schritt ergänzen.

Design-Tokens stehen in `src/styles/tokens.css`.

## Struktur

```
src/
  config/boards.ts      Spalten, Felder, Konstanten
  types.ts              Datenmodell
  lib/                  board.ts (Zustandsfunktionen), storage.ts (Laden, Migration, Export/Import),
                        cards.ts, samples.ts, date.ts
  hooks/                useBoard, useMediaQuery
  components/           Header, Board, Column, Card, CardDrawer, Toast, ConfirmDialog, Icons
  styles/               tokens.css, app.css
```

localStorage-Keys: `pipeline:jobs`, `pipeline:freelance` (jeweils mit `version`), `pipeline:ui` (aktiver Tab).
