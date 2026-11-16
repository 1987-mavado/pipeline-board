/**
 * URL-Import für automatische Karten-Einträge aus dem Morgenbriefing.
 *
 * Format: https://pipeline-board-six.vercel.app/?add=BASE64_JSON
 *
 * Das JSON enthält ein Array von { board: 'jobs'|'freelance', card: {...} }
 * Die App liest den Parameter beim Start, schreibt die Karten und
 * entfernt den Parameter aus der URL.
 */

import { BOARDS } from '../config/boards';
import { uid } from './cards';
import { normalizeBoard } from './storage';
import type { BoardId, BoardState, Card } from '../types';

export interface AddEntry {
  board: BoardId;
  card: Partial<Card>;
}

/**
 * Base64 → Text. Akzeptiert auch base64url und Leerzeichen, die URLSearchParams
 * aus einem „+“ macht. Dekodiert UTF-8 (Umlaute), fällt sonst auf Latin-1 zurück.
 */
export function decodeBase64Text(raw: string): string {
  let b64 = raw.trim().replace(/ /g, '+').replace(/-/g, '+').replace(/_/g, '/');
  b64 += '='.repeat((4 - (b64.length % 4)) % 4);
  const binary = atob(b64);
  try {
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return binary;
  }
}

/** Liest den ?add=-Parameter und gibt die Einträge zurück (oder []). */
export function parseUrlImport(): AddEntry[] {
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('add');
    if (!raw) return [];
    const decoded: unknown = JSON.parse(decodeBase64Text(raw));
    if (!Array.isArray(decoded)) return [];
    return decoded.filter(
      (e): e is AddEntry =>
        e && (e.board === 'jobs' || e.board === 'freelance') && typeof e.card === 'object',
    );
  } catch {
    return [];
  }
}

/** Entfernt den ?add=-Parameter aus der URL ohne Reload. */
export function clearUrlImport(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete('add');
  window.history.replaceState({}, '', url.toString());
}

/**
 * Wendet die URL-Einträge auf die bestehenden Board-States an.
 * Gibt die aktualisierten States zurück (nur für geänderte Boards).
 */
export function applyUrlImport(
  entries: AddEntry[],
  current: Record<BoardId, BoardState>,
): Partial<Record<BoardId, BoardState>> {
  if (entries.length === 0) return {};

  const result: Partial<Record<BoardId, BoardState>> = {};

  for (const { board, card } of entries) {
    const config = BOARDS[board];
    const state: BoardState = result[board] ?? JSON.parse(JSON.stringify(current[board]));

    const now = new Date().toISOString();
    // eindeutig, auch bei mehreren Karten ohne eigene ID in einem Link
    const id = typeof card.id === 'string' && card.id ? card.id : `mk-url-${uid()}`;
    const firstCol = config.columns[0].id;

    // Karte nicht doppelt eintragen
    if (state.cards[id]) continue;

    // Karte normalisieren über die bestehende normalizeBoard-Logik
    const draft = { version: 1, cards: { [id]: { ...card, id } }, columns: { [firstCol]: [id] }, collapsed: {} };
    const normalized = normalizeBoard(config, draft);
    const newCard = normalized.cards[id];
    if (!newCard) continue;

    // Timestamps sichern falls nicht gesetzt
    if (!newCard.createdAt) (newCard as Card).createdAt = now;
    if (!newCard.statusChangedAt) (newCard as Card).statusChangedAt = now;
    if (!newCard.history?.length) (newCard as Card).history = [{ from: null, to: firstCol, at: now }];

    state.cards[id] = newCard;
    // Vorne einfügen
    state.columns[firstCol] = [id, ...state.columns[firstCol].filter((x) => x !== id)];

    result[board] = state;
  }

  return result;
}
