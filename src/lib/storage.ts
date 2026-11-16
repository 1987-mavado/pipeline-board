import { BOARDS, STORAGE_VERSION } from '../config/boards';
import type { BoardConfig, BoardId, BoardState, Card } from '../types';
import { blankFields } from './cards';
import { sampleCards } from './samples';

export function emptyBoard(config: BoardConfig): BoardState {
  return {
    version: STORAGE_VERSION,
    cards: {},
    columns: Object.fromEntries(config.columns.map((c) => [c.id, []])),
    collapsed: Object.fromEntries(config.columns.map((c) => [c.id, c.kind === 'end'])),
  };
}

export function initialBoard(config: BoardConfig): BoardState {
  const state = emptyBoard(config);
  for (const { card, column } of sampleCards(config)) {
    state.cards[card.id] = card;
    state.columns[column].push(card.id);
  }
  return state;
}

/**
 * Migrationen pro Version. Neue Version: STORAGE_VERSION erhöhen und hier
 * einen Schritt `n → n+1` ergänzen.
 */
const MIGRATIONS: Record<number, (data: Record<string, unknown>) => Record<string, unknown>> = {
  // 1: (data) => ({ ...data, version: 2, … }),
};

function migrate(data: Record<string, unknown>): Record<string, unknown> {
  let current = data;
  let version = typeof current.version === 'number' ? current.version : 1;
  while (version < STORAGE_VERSION) {
    const step = MIGRATIONS[version];
    if (!step) throw new Error(`keine migration für version ${version}`);
    current = step(current);
    version += 1;
  }
  return current;
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * Prüft und repariert rohe Daten (aus localStorage oder Import) gegen die
 * aktuelle Spaltenkonfiguration. Karten aus entfernten Spalten landen in der
 * ersten Spalte, damit nichts verloren geht.
 */
export function normalizeBoard(config: BoardConfig, raw: unknown): BoardState {
  if (!isObject(raw)) throw new Error('ungültiges format');
  const data = migrate(raw);
  if (!isObject(data.cards) || !isObject(data.columns)) throw new Error('karten oder spalten fehlen');

  const state = emptyBoard(config);
  const blank = blankFields(config);

  for (const [id, value] of Object.entries(data.cards)) {
    if (!isObject(value)) continue;
    const now = new Date().toISOString();
    const card = {
      ...blank,
      ...value,
      kind: config.id,
      id,
      createdAt: typeof value.createdAt === 'string' ? value.createdAt : now,
      statusChangedAt: typeof value.statusChangedAt === 'string' ? value.statusChangedAt : now,
      history: Array.isArray(value.history) ? value.history : [],
    } as Card;
    state.cards[id] = card;
  }

  const placed = new Set<string>();
  for (const col of config.columns) {
    const ids = data.columns[col.id];
    if (!Array.isArray(ids)) continue;
    for (const id of ids) {
      if (typeof id === 'string' && state.cards[id] && !placed.has(id)) {
        state.columns[col.id].push(id);
        placed.add(id);
      }
    }
  }
  const first = config.columns[0].id;
  for (const id of Object.keys(state.cards)) {
    if (!placed.has(id)) state.columns[first].push(id);
  }

  if (isObject(data.collapsed)) {
    for (const col of config.columns) {
      const v = data.collapsed[col.id];
      if (typeof v === 'boolean') state.collapsed[col.id] = v;
    }
  }
  return state;
}

export function loadBoard(config: BoardConfig): BoardState {
  try {
    const raw = localStorage.getItem(config.storageKey);
    if (raw === null) return initialBoard(config);
    return normalizeBoard(config, JSON.parse(raw));
  } catch (err) {
    console.error(`[pipeline] ${config.storageKey} konnte nicht geladen werden`, err);
    return initialBoard(config);
  }
}

export function saveBoard(config: BoardConfig, state: BoardState): void {
  try {
    localStorage.setItem(config.storageKey, JSON.stringify(state));
  } catch (err) {
    console.error(`[pipeline] ${config.storageKey} konnte nicht gespeichert werden`, err);
  }
}

/* ---------- Export / Import ---------- */

const EXPORT_APP = 'pipeline-board';

export function buildExport(states: Record<BoardId, BoardState>): string {
  return JSON.stringify(
    { app: EXPORT_APP, version: STORAGE_VERSION, exportedAt: new Date().toISOString(), boards: states },
    null,
    2,
  );
}

export function parseImport(text: string): Partial<Record<BoardId, BoardState>> {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('datei ist kein gültiges json');
  }
  if (!isObject(data) || data.app !== EXPORT_APP || !isObject(data.boards)) {
    throw new Error('datei ist kein pipeline-backup');
  }
  const result: Partial<Record<BoardId, BoardState>> = {};
  for (const id of Object.keys(BOARDS) as BoardId[]) {
    if (data.boards[id] !== undefined) result[id] = normalizeBoard(BOARDS[id], data.boards[id]);
  }
  if (Object.keys(result).length === 0) throw new Error('keine boards in der datei');
  return result;
}

export function downloadFile(filename: string, content: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
