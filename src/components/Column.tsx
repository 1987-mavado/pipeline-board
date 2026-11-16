import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { ReactNode } from 'react';
import type { BoardConfig, ColumnDef } from '../types';
import { ChevronIcon } from './Icons';

interface ColumnProps {
  config: BoardConfig;
  column: ColumnDef;
  number: number;
  /** sichtbare (ggf. gefilterte) Karten-IDs */
  ids: string[];
  total: number;
  collapsible: boolean;
  collapsed: boolean;
  onToggle: () => void;
  onAdd?: () => void;
  children: ReactNode;
}

export function Column({ config, column, number, ids, total, collapsible, collapsed, onToggle, onAdd, children }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const isCollapsed = collapsible && collapsed;
  const headingId = `col-${config.id}-${column.id}`;
  const bodyId = `${headingId}-body`;
  const num = String(number).padStart(2, '0');
  const count = ids.length === total ? String(total) : `${ids.length}/${total}`;

  const head = (
    <>
      <span className="column__num">{num}</span>
      <span className="column__label">{column.label}</span>
      <span className="column__count" aria-label={`${total} karten`}>
        {count}
      </span>
      {collapsible && (
        <span className="column__chev">
          <ChevronIcon />
        </span>
      )}
    </>
  );

  const classes = [
    'column',
    `column--${column.kind}`,
    isCollapsed ? 'is-collapsed' : '',
    isOver ? 'is-over' : '',
  ].join(' ');

  return (
    <section ref={setNodeRef} className={classes} aria-labelledby={headingId}>
      <h2 className="column__heading">
        {collapsible ? (
          <button
            type="button"
            id={headingId}
            className="column__toggle"
            aria-expanded={!isCollapsed}
            aria-controls={bodyId}
            onClick={onToggle}
          >
            {head}
          </button>
        ) : (
          <span id={headingId} className="column__head">
            {head}
          </span>
        )}
      </h2>

      {!isCollapsed && (
        <div className="column__body" id={bodyId}>
          {onAdd && (
            <button type="button" className="column__add" onClick={onAdd}>
              + neu
            </button>
          )}
          {ids.length === 0 && <p className="column__empty">{total > 0 ? 'keine treffer' : 'leer'}</p>}
          <SortableContext id={column.id} items={ids} strategy={verticalListSortingStrategy}>
            <ul className="column__list">{children}</ul>
          </SortableContext>
        </div>
      )}
    </section>
  );
}
