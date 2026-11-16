import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { KeyboardEvent, SyntheticEvent } from 'react';
import { cardSubtitle, cardTitle, getField, needsFollowUp } from '../lib/cards';
import { daysSince, formatDays } from '../lib/date';
import type { BoardConfig, Card as CardData } from '../types';
import { CheckIcon, CrossIcon } from './Icons';

interface CardViewProps {
  card: CardData;
  config: BoardConfig;
  columnId: string;
  onSendTo?: (columnId: string) => void;
}

const stop = (e: SyntheticEvent) => e.stopPropagation();

/** Reine Darstellung, auch für das Drag-Overlay genutzt. */
export function CardView({ card, config, columnId, onSendTo }: CardViewProps) {
  const title = cardTitle(config, card) || 'ohne titel';
  const subtitle = cardSubtitle(config, card);
  const money = getField(card, config.moneyKey);
  const days = daysSince(card.statusChangedAt);
  const followUp = needsFollowUp(config, card, columnId);
  const targets = config.columns.filter((c) => c.outcome && c.id !== columnId);

  return (
    <>
      <div className="card__main">
        <h3 className="card__title">{title}</h3>
        {subtitle && <p className="card__subtitle">{subtitle}</p>}
      </div>
      <div className="card__meta">
        <span className="meta" title="seit der letzten statusänderung">
          {formatDays(days)}
        </span>
        {money && <span className="meta">{money}</span>}
        {card.sample && <span className="meta meta--dim">beispiel</span>}
        {followUp && <span className="mark">nachfassen</span>}
      </div>
      {onSendTo && targets.length > 0 && (
        <div className="card__actions">
          {targets.map((col) => (
            <button
              key={col.id}
              type="button"
              className="icon-btn"
              aria-label={`${title} nach ${col.label} verschieben`}
              title={`nach ${col.label}`}
              onClick={(e) => {
                e.stopPropagation();
                onSendTo(col.id);
              }}
              onPointerDown={stop}
              onMouseDown={stop}
              onTouchStart={stop}
              onKeyDown={stop}
            >
              {col.outcome === 'accepted' ? <CheckIcon /> : <CrossIcon />}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

interface SortableCardProps extends CardViewProps {
  dragDisabled: boolean;
  onOpen: () => void;
}

export function SortableCard({ card, config, columnId, onSendTo, onOpen, dragDisabled }: SortableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    disabled: dragDisabled,
    transition: { duration: 180, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
  });

  const title = cardTitle(config, card) || 'ohne titel';
  const subtitle = cardSubtitle(config, card);

  const onKeyDown = (e: KeyboardEvent<HTMLLIElement>) => {
    // Enter öffnet die Karte, Leertaste startet das Verschieben (KeyboardSensor).
    if (e.key === 'Enter' && !isDragging && e.target === e.currentTarget) {
      e.preventDefault();
      onOpen();
      return;
    }
    listeners?.onKeyDown?.(e);
  };

  return (
    <li
      ref={setNodeRef}
      className={`card${isDragging ? ' is-placeholder' : ''}${dragDisabled ? ' is-static' : ''}`}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...attributes}
      {...listeners}
      role="listitem"
      aria-roledescription="verschiebbare karte"
      aria-label={subtitle ? `${title}, ${subtitle}` : title}
      onKeyDown={onKeyDown}
      onClick={onOpen}
    >
      <CardView card={card} config={config} columnId={columnId} onSendTo={onSendTo} />
    </li>
  );
}
