import type { BoardConfig, Card } from '../types';
import { blankFields, uid } from './cards';
import { daysAgo, todayISODate } from './date';

interface Sample {
  column: string;
  /** Tage seit letzter Statusänderung */
  age: number;
  fields: Record<string, string | string[]>;
}

const JOB_SAMPLES: Sample[] = [
  {
    column: 'found',
    age: 2,
    fields: { company: 'Studio Nordlicht', position: 'Creative Director Brand', salary: '95.000 €', tasks: ['Creative Direction', 'Markenentwicklung', 'Key Visual', 'Team-Lead'], note: 'Beispielkarte – lässt sich oben mit einem Klick entfernen.' },
  },
  {
    column: 'sent',
    age: 18,
    fields: { company: 'Halbton Verlag', position: 'Head of Design', contact: 'Frau Berger', salary: '90.000 €' },
  },
  {
    column: 'process',
    age: 5,
    fields: { company: 'Kontur Mobility', position: 'Executive Creative Director', salary: '110.000 €' },
  },
];

const FREELANCE_SAMPLES: Sample[] = [
  {
    column: 'listed',
    age: 1,
    fields: { client: 'Agentur Weitblick', role: 'CD Kampagne Frühjahr', broker: 'Freelancermap', dayRate: '950 €', workMode: 'remote', note: 'Beispielkarte – lässt sich oben mit einem Klick entfernen.' },
  },
  {
    column: 'applied',
    age: 16,
    fields: { client: 'Lumen Brand Lab', role: 'Rebranding Interim-CD', dayRate: '900 €', workMode: 'hybrid' },
  },
];

export function sampleCards(config: BoardConfig, now = new Date()): { card: Card; column: string }[] {
  const samples = config.id === 'jobs' ? JOB_SAMPLES : FREELANCE_SAMPLES;
  return samples.map((s) => {
    const changed = daysAgo(s.age, now);
    const created = daysAgo(s.age + 3, now);
    const first = config.columns[0].id;
    const history =
      s.column === first
        ? [{ from: null, to: first, at: changed.toISOString() }]
        : [
            { from: null, to: first, at: created.toISOString() },
            { from: first, to: s.column, at: changed.toISOString() },
          ];
    const autoKey = config.autoDates[s.column] ?? config.autoDates[first];
    const card = {
      ...blankFields(config),
      ...(autoKey ? { [autoKey]: todayISODate(changed) } : {}),
      ...s.fields,
      id: uid(),
      createdAt: history[0].at,
      statusChangedAt: changed.toISOString(),
      history,
      sample: true,
    } as Card;
    return { card, column: s.column };
  });
}
