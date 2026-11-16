import { useEffect, useRef, useState } from 'react';
import { cardTitle, getField, setField } from '../lib/cards';
import { formatDate } from '../lib/date';
import type { BoardConfig, Card } from '../types';
import { ArrowOutIcon, CrossIcon } from './Icons';
import { ConfirmDialog } from './ConfirmDialog';

interface CardDrawerProps {
  config: BoardConfig;
  mode: 'create' | 'edit';
  card: Card;
  columnId: string;
  onSave: (card: Card, columnId: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function CardDrawer({ config, mode, card, columnId, onSave, onDelete, onClose }: CardDrawerProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [draft, setDraft] = useState<Card>(card);
  const [column, setColumn] = useState(columnId);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    ref.current?.showModal();
    // Neue Karte: direkt ins erste Pflichtfeld. autoFocus greift vor showModal() nicht.
    if (mode === 'create') formRef.current?.querySelector<HTMLElement>(`[name="${config.titleKey}"]`)?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const labelOf = (id: string | null) => config.columns.find((c) => c.id === id)?.label ?? id ?? '';
  const headingTitle = cardTitle(config, draft) || (mode === 'create' ? 'neue karte' : 'ohne titel');

  const submit = (e: { preventDefault(): void }) => {
    e.preventDefault();
    const next: Record<string, boolean> = {};
    for (const field of config.fields) {
      if (field.required && !getField(draft, field.key).trim()) next[field.key] = true;
    }
    setErrors(next);
    const firstInvalid = config.fields.find((f) => next[f.key]);
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid.key}"]`)?.focus();
      return;
    }
    const trimmed = config.fields.reduce((c, f) => setField(c, f.key, getField(c, f.key).trim()), draft);
    onSave(trimmed, column);
  };

  const history = [...draft.history].reverse();

  return (
    <dialog
      ref={ref}
      className="drawer"
      aria-labelledby="drawer-title"
      onClose={(e) => e.target === e.currentTarget && onClose()}
      onClick={(e) => e.target === e.currentTarget && ref.current?.close()}
    >
      <form
        ref={formRef}
        className="drawer__inner"
        onSubmit={submit}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(e);
        }}
        noValidate
      >
        <header className="drawer__head">
          <div>
            <p className="label">{mode === 'create' ? 'neue karte' : config.label}</p>
            <h2 id="drawer-title" className="drawer__title">
              {headingTitle}
            </h2>
          </div>
          <button type="button" className="icon-btn" aria-label="schließen" onClick={() => ref.current?.close()}>
            <CrossIcon />
          </button>
        </header>

        <div className="drawer__body">
          <div className="field">
            <label className="label" htmlFor="f-status">
              stand
            </label>
            <select id="f-status" className="input" value={column} onChange={(e) => setColumn(e.target.value)}>
              {config.columns.map((c, i) => (
                <option key={c.id} value={c.id}>
                  {String(i + 1).padStart(2, '0')} {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="field-grid">
            {config.fields.map((field) => {
              const id = `f-${field.key}`;
              const value = getField(draft, field.key);
              const invalid = Boolean(errors[field.key]);
              const common = {
                id,
                name: field.key,
                className: 'input',
                value,
                placeholder: field.placeholder,
                required: field.required,
                'aria-invalid': invalid || undefined,
                'aria-describedby': invalid ? `${id}-err` : undefined,
                onChange: (e: { target: { value: string } }) => {
                  setDraft((d) => setField(d, field.key, e.target.value));
                  if (invalid) setErrors((er) => ({ ...er, [field.key]: false }));
                },
              };
              return (
                <div key={field.key} className={`field${field.half ? '' : ' field--full'}`}>
                  <label className="label" htmlFor={id}>
                    {field.label}
                    {field.required && <span aria-hidden="true"> *</span>}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea {...common} rows={5} />
                  ) : field.type === 'select' ? (
                    <select {...common}>
                      {field.options?.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="input-row">
                      <input {...common} type={field.type} />
                      {field.type === 'url' && /^https?:\/\//.test(value) && (
                        <a className="input-row__link" href={value} target="_blank" rel="noreferrer noopener" aria-label="link öffnen">
                          <ArrowOutIcon />
                        </a>
                      )}
                    </div>
                  )}
                  {invalid && (
                    <span id={`${id}-err`} className="field__error">
                      pflichtfeld
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {mode === 'edit' && history.length > 0 && (
            <section aria-labelledby="history-title">
              <h3 id="history-title" className="label section-label">
                historie
              </h3>
              <ol className="history">
                {history.map((h, i) => (
                  <li key={`${h.at}-${i}`}>
                    <span>{h.from === null ? `angelegt in ${labelOf(h.to)}` : `${labelOf(h.from)} → ${labelOf(h.to)}`}</span>
                    <time className="meta" dateTime={h.at}>
                      {formatDate(h.at)}
                    </time>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>

        <footer className="drawer__foot">
          <button type="submit" className="btn btn--primary">
            {mode === 'create' ? 'anlegen' : 'speichern'}
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => ref.current?.close()}>
            abbrechen
          </button>
          {mode === 'edit' && (
            <button type="button" className="btn btn--ghost btn--end" onClick={() => setConfirmDelete(true)}>
              löschen
            </button>
          )}
        </footer>
      </form>

      <ConfirmDialog
        open={confirmDelete}
        title="karte löschen?"
        message={`„${headingTitle}“ wird endgültig entfernt. das lässt sich nicht rückgängig machen.`}
        confirmLabel="löschen"
        onConfirm={() => {
          setConfirmDelete(false);
          onDelete(draft.id);
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </dialog>
  );
}
