import type { BoardConfig, BoardId, ColumnDef } from '../types';

/** Nach so vielen Tagen ohne Statusänderung erscheint „nachfassen“. */
export const FOLLOW_UP_DAYS = 14;

/** Version des gespeicherten Formats. Bei Änderungen erhöhen und in storage.ts migrieren. */
export const STORAGE_VERSION = 1;

/** Absender, der im Hinweis zur Bewerbungsmail genannt wird */
export const MAIL_SENDER = 'mail@mkriesmair.de';

/** Wie viele Aufgaben-Tags eine Karte höchstens zeigt, der Rest wird als „+N“ zusammengefasst */
export const CARD_MAX_TAGS = 3;

export const JOB_TASK_TAGS = [
  'Creative Direction',
  'Art Direction',
  'Key Visual',
  'Kampagnenkonzept',
  'Markenentwicklung',
  'CI/CD',
  'Digital',
  'Social Media',
  'Film/Motion',
  'Print',
  'Pitchunterstützung',
  'Team-Lead',
  'Freelance-Koordination',
  'KI-Integration',
  'Strategie',
] as const;

/** Dauer des Rückgängig-Toasts in ms */
export const TOAST_DURATION = 5000;

export const JOB_COLUMNS: ColumnDef[] = [
  { id: 'found', label: 'gefunden', kind: 'active' },
  { id: 'drafting', label: 'in erstellung', kind: 'active' },
  { id: 'sent', label: 'abgesendet', kind: 'active', followUp: true },
  { id: 'process', label: 'prozess läuft', kind: 'active', followUp: true },
  { id: 'accepted', label: 'angenommen', kind: 'end', outcome: 'accepted' },
  { id: 'rejected', label: 'abgelehnt', kind: 'end', outcome: 'rejected' },
];

export const FREELANCE_COLUMNS: ColumnDef[] = [
  { id: 'listed', label: 'ausgeschrieben', kind: 'active' },
  { id: 'drafting', label: 'bewerbung in erstellung', kind: 'active' },
  { id: 'applied', label: 'beworben', kind: 'active', followUp: true },
  { id: 'process', label: 'prozess läuft', kind: 'active', followUp: true },
  { id: 'accepted', label: 'angenommen', kind: 'end', outcome: 'accepted' },
  { id: 'rejected', label: 'abgelehnt', kind: 'end', outcome: 'rejected' },
];

export const BOARDS: Record<BoardId, BoardConfig> = {
  jobs: {
    id: 'jobs',
    label: 'bewerbungen',
    storageKey: 'pipeline:jobs',
    columns: JOB_COLUMNS,
    titleKey: 'company',
    subtitleKey: 'position',
    moneyKey: 'salary',
    tagsKey: 'tasks',
    searchKeys: ['company', 'position'],
    autoDates: { found: 'dateFound', sent: 'dateSent' },
    fields: [
      { key: 'company', label: 'firma', type: 'text', required: true },
      { key: 'position', label: 'position', type: 'text', required: true },
      { key: 'tasks', label: 'aufgaben', type: 'tags', tags: JOB_TASK_TAGS },
      { key: 'link', label: 'link zur ausschreibung', type: 'url', placeholder: 'https://' },
      { key: 'contact', label: 'ansprechpartner', type: 'text' },
      { key: 'salary', label: 'gehaltsvorstellung', type: 'text', placeholder: 'z. b. 95.000 €' },
      { key: 'dateFound', label: 'datum gefunden', type: 'date', half: true },
      { key: 'dateSent', label: 'datum abgesendet', type: 'date', half: true },
      { key: 'note', label: 'notiz', type: 'textarea' },
      { key: 'draftSubject', label: 'betreff', type: 'text', section: 'mail' },
      { key: 'draftBody', label: 'anschreiben', type: 'textarea', rows: 12, section: 'mail' },
    ],
  },
  freelance: {
    id: 'freelance',
    label: 'freelance',
    storageKey: 'pipeline:freelance',
    columns: FREELANCE_COLUMNS,
    titleKey: 'client',
    subtitleKey: 'role',
    moneyKey: 'dayRate',
    searchKeys: ['client', 'role'],
    autoDates: { applied: 'dateApplied' },
    fields: [
      { key: 'client', label: 'kunde / agentur', type: 'text', required: true },
      { key: 'role', label: 'projekt / rolle', type: 'text', required: true },
      { key: 'link', label: 'link', type: 'url', placeholder: 'https://' },
      { key: 'broker', label: 'vermittler / plattform', type: 'text' },
      { key: 'dayRate', label: 'tagessatz', type: 'text', placeholder: 'z. b. 900 €' },
      {
        key: 'workMode',
        label: 'remote / vor ort',
        type: 'select',
        options: [
          { value: '', label: '–' },
          { value: 'remote', label: 'remote' },
          { value: 'vor ort', label: 'vor ort' },
          { value: 'hybrid', label: 'hybrid' },
        ],
      },
      { key: 'periodFrom', label: 'zeitraum von', type: 'date', half: true },
      { key: 'periodTo', label: 'bis', type: 'date', half: true },
      { key: 'dateApplied', label: 'datum beworben', type: 'date' },
      { key: 'note', label: 'notiz', type: 'textarea' },
    ],
  },
};

export const BOARD_ORDER: BoardId[] = ['jobs', 'freelance'];
