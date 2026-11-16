export type BoardId = 'jobs' | 'freelance';

/** active = laufende Stände, end = Endspalten rechts (angenommen / abgelehnt) */
export type ColumnKind = 'active' | 'end';

export interface ColumnDef {
  id: string;
  label: string;
  kind: ColumnKind;
  /** Markiert die Ziele von Haken (accepted) und Kreuz (rejected). */
  outcome?: 'accepted' | 'rejected';
  /** Karten in dieser Spalte bekommen nach FOLLOW_UP_DAYS den „nachfassen“-Marker. */
  followUp?: boolean;
}

export interface StatusChange {
  /** null = Karte wurde angelegt */
  from: string | null;
  to: string;
  /** ISO-Zeitstempel */
  at: string;
}

interface CardBase {
  id: string;
  createdAt: string;
  /** Zeitpunkt der letzten Statusänderung, Basis für „x tage“ und Nachfass-Hinweis */
  statusChangedAt: string;
  history: StatusChange[];
  link: string;
  note: string;
  /** Beispielkarte vom ersten Start */
  sample?: boolean;
}

export interface JobCard extends CardBase {
  kind: 'jobs';
  company: string;
  position: string;
  contact: string;
  salary: string;
  /** YYYY-MM-DD */
  dateFound: string;
  dateSent: string;
}

export type WorkMode = '' | 'remote' | 'vor ort' | 'hybrid';

export interface FreelanceCard extends CardBase {
  kind: 'freelance';
  client: string;
  role: string;
  broker: string;
  dayRate: string;
  periodFrom: string;
  periodTo: string;
  workMode: WorkMode;
  dateApplied: string;
}

export type Card = JobCard | FreelanceCard;

/** Gespeichert pro Board unter einem eigenen localStorage-Key. */
export interface BoardState {
  version: number;
  cards: Record<string, Card>;
  /** Spalten-ID → Karten-IDs in Anzeige-Reihenfolge */
  columns: Record<string, string[]>;
  /** Spalten-ID → eingeklappt */
  collapsed: Record<string, boolean>;
}

export type FieldType = 'text' | 'url' | 'date' | 'textarea' | 'select';

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: { value: string; label: string }[];
  /** halbe Breite im Drawer */
  half?: boolean;
  placeholder?: string;
}

export interface BoardConfig {
  id: BoardId;
  label: string;
  storageKey: string;
  columns: ColumnDef[];
  fields: FieldDef[];
  titleKey: string;
  subtitleKey: string;
  moneyKey: string;
  searchKeys: string[];
  /** Betritt eine Karte die Spalte und ist das Datumsfeld leer, wird heute eingetragen. */
  autoDates: Record<string, string>;
}
