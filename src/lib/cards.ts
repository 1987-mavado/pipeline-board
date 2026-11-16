import { FOLLOW_UP_DAYS } from '../config/boards';
import type { BoardConfig, Card, FreelanceCard, JobCard } from '../types';
import { daysSince, todayISODate } from './date';

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Leere Fachfelder je Board (ohne Metadaten). Basis für neue Karten und für die Normalisierung. */
export function blankFields(config: BoardConfig): Omit<JobCard, keyof MetaFields> | Omit<FreelanceCard, keyof MetaFields> {
  if (config.id === 'jobs') {
    return { kind: 'jobs', company: '', position: '', contact: '', salary: '', dateFound: '', dateSent: '', link: '', note: '' };
  }
  return {
    kind: 'freelance',
    client: '',
    role: '',
    broker: '',
    dayRate: '',
    periodFrom: '',
    periodTo: '',
    workMode: '',
    dateApplied: '',
    link: '',
    note: '',
  };
}

type MetaFields = Pick<Card, 'id' | 'createdAt' | 'statusChangedAt' | 'history' | 'sample'>;

export function createCard(config: BoardConfig, columnId: string, now = new Date()): Card {
  const at = now.toISOString();
  const card = {
    ...blankFields(config),
    id: uid(),
    createdAt: at,
    statusChangedAt: at,
    history: [{ from: null, to: columnId, at }],
  } as Card;
  return applyAutoDate(config, card, columnId, now);
}

export function getField(card: Card, key: string): string {
  const value = (card as unknown as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : '';
}

export function setField(card: Card, key: string, value: string): Card {
  return { ...card, [key]: value } as Card;
}

export function cardTitle(config: BoardConfig, card: Card): string {
  return getField(card, config.titleKey);
}

export function cardSubtitle(config: BoardConfig, card: Card): string {
  return getField(card, config.subtitleKey);
}

/** Trägt beim Betreten einer Spalte das passende Datum ein, falls noch leer. */
export function applyAutoDate(config: BoardConfig, card: Card, columnId: string, now = new Date()): Card {
  const key = config.autoDates[columnId];
  if (!key || getField(card, key)) return card;
  return setField(card, key, todayISODate(now));
}

export function needsFollowUp(config: BoardConfig, card: Card, columnId: string, now = new Date()): boolean {
  const column = config.columns.find((c) => c.id === columnId);
  return Boolean(column?.followUp) && daysSince(card.statusChangedAt, now) > FOLLOW_UP_DAYS;
}

export function matchesQuery(config: BoardConfig, card: Card, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return config.searchKeys.some((key) => getField(card, key).toLowerCase().includes(q));
}
