import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import type { BoardConfig, BoardId } from '../types';

interface HeaderProps {
  boards: BoardConfig[];
  counts: Record<BoardId, number>;
  active: BoardId;
  onSelect: (id: BoardId) => void;
  query: string;
  onQuery: (q: string) => void;
  onExport: () => void;
  onImport: () => void;
}

export function Header({ boards, counts, active, onSelect, query, onQuery, onExport, onImport }: HeaderProps) {
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const onTabKey = (e: KeyboardEvent, index: number) => {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = boards[(index + dir + boards.length) % boards.length];
    onSelect(next.id);
    tabRefs.current[next.id]?.focus();
  };

  return (
    <header className="header">
      <div className="header__top">
        <h1 className="title">pipeline</h1>
        <div className="header__tools">
          <label className="search">
            <span className="sr-only">suchen nach firma, kunde oder position</span>
            <input
              type="search"
              value={query}
              placeholder="suchen"
              onChange={(e) => onQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && onQuery('')}
            />
          </label>
          <Menu onExport={onExport} onImport={onImport} />
        </div>
      </div>

      <div className="tabs" role="tablist" aria-label="boards">
        {boards.map((b, i) => {
          const selected = b.id === active;
          return (
            <button
              key={b.id}
              ref={(el) => {
                tabRefs.current[b.id] = el;
              }}
              type="button"
              role="tab"
              id={`tab-${b.id}`}
              aria-selected={selected}
              aria-controls={`panel-${b.id}`}
              tabIndex={selected ? 0 : -1}
              className="tab"
              onClick={() => onSelect(b.id)}
              onKeyDown={(e) => onTabKey(e, i)}
            >
              <span>{b.label}</span>
              <span className="tab__count" aria-label={`${counts[b.id]} aktiv`}>
                {counts[b.id]}
              </span>
            </button>
          );
        })}
      </div>
    </header>
  );
}

function Menu({ onExport, onImport }: { onExport: () => void; onImport: () => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    rootRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const run = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };

  const onListKey = (e: KeyboardEvent<HTMLUListElement>) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const items = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'));
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
  };

  return (
    <div className="menu" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className="text-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="main-menu"
        onClick={() => setOpen((o) => !o)}
      >
        menü
      </button>
      {open && (
        <ul id="main-menu" className="menu__list" role="menu" onKeyDown={onListKey}>
          <li role="none">
            <button type="button" role="menuitem" onClick={run(onExport)}>
              export json
            </button>
          </li>
          <li role="none">
            <button type="button" role="menuitem" onClick={run(onImport)}>
              import json
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
