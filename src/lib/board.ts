/**
 * Reine Funktionen auf dem BoardState. Keine Seiteneffekte, damit sie sich
 * direkt in setState-Updatern verwenden lassen.
 */
import type { BoardConfig, BoardState, Card } from '../types';
import { applyAutoDate } from './cards';

export function findColumnOf(state: BoardState, cardId: string): string | undefined {
  return Object.keys(state.columns).find((col) => state.columns[col].includes(cardId));
}

/** Spalte zu einer Drag-&-Drop-ID (Spalten-ID oder Karten-ID) */
export function containerOf(state: BoardState, id: string): string | undefined {
  if (id in state.columns) return id;
  return findColumnOf(state, id);
}

/** Verschiebt nur die Position, ohne Historie. */
export function moveCard(state: BoardState, cardId: string, toColumn: string, toIndex?: number): BoardState {
  const from = findColumnOf(state, cardId);
  if (!from || !(toColumn in state.columns)) return state;
  const columns = { ...state.columns, [from]: state.columns[from].filter((id) => id !== cardId) };
  const target = [...columns[toColumn]];
  const index = toIndex === undefined ? target.length : Math.max(0, Math.min(toIndex, target.length));
  target.splice(index, 0, cardId);
  columns[toColumn] = target;
  return { ...state, columns };
}

export function reorderCard(state: BoardState, column: string, from: number, to: number): BoardState {
  const items = [...state.columns[column]];
  const [moved] = items.splice(from, 1);
  items.splice(to, 0, moved);
  return { ...state, columns: { ...state.columns, [column]: items } };
}

/** Schreibt einen Statuswechsel in die Historie der Karte. */
export function recordStatusChange(
  config: BoardConfig,
  state: BoardState,
  cardId: string,
  from: string,
  to: string,
  now = new Date(),
): BoardState {
  const card = state.cards[cardId];
  if (!card || from === to) return state;
  const at = now.toISOString();
  const updated = applyAutoDate(
    config,
    { ...card, statusChangedAt: at, history: [...card.history, { from, to, at }] },
    to,
    now,
  );
  return { ...state, cards: { ...state.cards, [cardId]: updated } };
}

/** Statuswechsel mit Position (oben in der Zielspalte) und Historie. */
export function transitionCard(config: BoardConfig, state: BoardState, cardId: string, to: string, now = new Date()): BoardState {
  const from = findColumnOf(state, cardId);
  if (!from || from === to) return state;
  return recordStatusChange(config, moveCard(state, cardId, to, 0), cardId, from, to, now);
}

export function insertCard(state: BoardState, card: Card, column: string, index = 0): BoardState {
  const items = [...(state.columns[column] ?? [])];
  items.splice(index, 0, card.id);
  return {
    ...state,
    cards: { ...state.cards, [card.id]: card },
    columns: { ...state.columns, [column]: items },
  };
}

export function updateCard(state: BoardState, card: Card): BoardState {
  if (!state.cards[card.id]) return state;
  return { ...state, cards: { ...state.cards, [card.id]: card } };
}

export function removeCard(state: BoardState, cardId: string): BoardState {
  const cards = { ...state.cards };
  delete cards[cardId];
  const columns = Object.fromEntries(
    Object.entries(state.columns).map(([col, ids]) => [col, ids.filter((id) => id !== cardId)]),
  );
  return { ...state, cards, columns };
}

/** Setzt eine Karte exakt auf einen früheren Stand zurück (für „Rückgängig“). */
export function restoreCard(state: BoardState, previous: Card, column: string, index: number): BoardState {
  if (!state.cards[previous.id]) return state;
  return insertCard(removeCard(state, previous.id), previous, column, index);
}

export function removeSamples(state: BoardState): BoardState {
  return Object.values(state.cards)
    .filter((card) => card.sample)
    .reduce((s, card) => removeCard(s, card.id), state);
}

export function activeCount(config: BoardConfig, state: BoardState): number {
  return config.columns
    .filter((col) => col.kind === 'active')
    .reduce((sum, col) => sum + (state.columns[col.id]?.length ?? 0), 0);
}

export function outcomeColumn(config: BoardConfig, outcome: 'accepted' | 'rejected') {
  return config.columns.find((col) => col.outcome === outcome);
}
