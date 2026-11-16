import { useEffect, useRef, useState, type ReactNode } from 'react';
import { MAIL_SENDER } from '../config/boards';

interface MailDraftSectionProps {
  subject: string;
  body: string;
  /** die Eingabefelder für Betreff und Anschreiben */
  children: ReactNode;
}

const FEEDBACK_MS = 3000;

/**
 * Baut den mailto-Link. Der from-Parameter ist kein Standard (RFC 6068) und wird
 * von den meisten Mailprogrammen ignoriert; maßgeblich ist das dort eingestellte Konto.
 */
export function buildMailto(subject: string, body: string): string {
  const params = [
    `from=${encodeURIComponent(MAIL_SENDER)}`,
    'to=',
    `subject=${encodeURIComponent(subject)}`,
    `body=${encodeURIComponent(body)}`,
  ];
  return `mailto:?${params.join('&')}`;
}

/** Kopiert über eine temporäre Textauswahl. Innerhalb des Dialogs, damit der Fokus dort bleibt. */
function copyWithSelection(text: string): boolean {
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  const host = document.querySelector('dialog[open]') ?? document.body;
  const previous = document.activeElement as HTMLElement | null;
  host.appendChild(area);
  area.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  area.remove();
  previous?.focus();
  return ok;
}

type Feedback ='mail' | 'copied' | 'copy-failed' | null;

export function MailDraftSection({ subject, body, children }: MailDraftSectionProps) {
  const [feedback, setFeedback] = useState<Feedback>(null);
  const timer = useRef<number | undefined>(undefined);
  const hasBody = body.trim().length > 0;

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const flash = (value: Feedback) => {
    setFeedback(value);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setFeedback(null), FEEDBACK_MS);
  };

  const openMail = () => {
    if (!hasBody) return;
    window.location.href = buildMailto(subject, body);
    flash('mail');
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(body);
      flash('copied');
    } catch {
      // Rückfall, wenn die Clipboard-API gesperrt ist (z. B. ohne Berechtigung)
      flash(copyWithSelection(body) ? 'copied' : 'copy-failed');
    }
  };

  return (
    <section className="mail-draft" aria-labelledby="mail-title">
      <h3 id="mail-title" className="label section-label">
        bewerbungsmail
      </h3>
      {children}
      <div className="mail-draft__actions">
        <button type="button" className="btn btn--primary" onClick={openMail} disabled={!hasBody}>
          {feedback === 'mail' ? 'mail geöffnet ✓' : 'per mail senden'}
        </button>
        <button type="button" className="btn btn--ghost" onClick={copy} disabled={!hasBody}>
          {feedback === 'copied' ? 'kopiert ✓' : feedback === 'copy-failed' ? 'kopieren fehlgeschlagen' : 'in zwischenablage'}
        </button>
      </div>
      <p className="mail-draft__hint">
        mail wird in deinem standard-mailprogramm geöffnet. absender: {MAIL_SENDER}
      </p>
      <span className="sr-only" role="status" aria-live="polite">
        {feedback === 'mail' ? 'mail geöffnet' : feedback === 'copied' ? 'anschreiben kopiert' : ''}
      </span>
    </section>
  );
}
