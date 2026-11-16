import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  pointerWithin,
  TouchSensor,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { MOBILE_QUERY, REDUCED_MOTION_QUERY, useMediaQuery } from '../hooks/useMediaQuery';
import {
  containerOf,
  findColumnOf,
  insertCard,
  moveCard,
  recordStatusChange,
  removeCard,
  removeSamples,
  reorderCard,
  restoreCard,
  transitionCard,
  updateCard,
} from '../lib/board';
import { applyAutoDate, cardTitle, createCard, matchesQuery } from '../lib/cards';
import type { BoardConfig, BoardState, Card } from '../types';
import { CardView, SortableCard } from './Card';
import { CardDrawer } from './CardDrawer';
import { Column } from './Column';
import type { ToastData } from './Toast';

interface BoardProps {
  config: BoardConfig;
  state: BoardState;
  setState: Dispatch<SetStateAction<BoardState>>;
  query: string;
  onToast: (toast: Omit<ToastData, 'id'>) => void;
}

type DrawerState = { mode: 'create'; card: Card; columnId: string } | { mode: 'edit'; id: string } | null;

/** Zeiger zuerst (präzise, auch für schmale eingeklappte Spalten), sonst nächste Ecke (Tastatur). */
const collisionDetection: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  return hits.length > 0 ? hits : closestCorners(args);
};

export function Board({ config, state, setState, query, onToast }: BoardProps) {
  const mobile = useMediaQuery(MOBILE_QUERY);
  const reducedMotion = useMediaQuery(REDUCED_MOTION_QUERY);
  const [drawer, setDrawer] = useState<DrawerState>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const dragStart = useRef<{ snapshot: BoardState; from: string } | null>(null);
  const lastDragEnd = useRef(0);

  const searching = query.trim().length > 0;
  const hasSamples = Object.values(state.cards).some((c) => c.sample);
  const labelOf = (id: string | undefined) => config.columns.find((c) => c.id === id)?.label ?? '';

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 300, tolerance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: { start: ['Space'], cancel: ['Escape'], end: ['Space', 'Enter'] },
    }),
  );

  /** Mobil sind alle Spalten aufklappbar, auf dem Desktop nur die Endspalten. */
  const isCollapsible = (columnId: string) =>
    mobile || config.columns.find((c) => c.id === columnId)?.kind === 'end';
  const isCollapsed = (columnId: string) => isCollapsible(columnId) && state.collapsed[columnId];

  /* ---------- Aktionen ---------- */

  const sendTo = (cardId: string, to: string) => {
    const from = findColumnOf(state, cardId);
    if (!from || from === to) return;
    const previous = state.cards[cardId];
    const index = state.columns[from].indexOf(cardId);
    setState((s) => transitionCard(config, s, cardId, to));
    onToast({
      message: `verschoben nach ${labelOf(to)}`,
      onUndo: () => setState((s) => restoreCard(s, previous, from, index)),
    });
  };

  const openCard = (id: string) => {
    if (Date.now() - lastDragEnd.current < 250) return; // Klick direkt nach einem Drag ignorieren
    setDrawer({ mode: 'edit', id });
  };

  const save = (card: Card, columnId: string) => {
    const now = new Date();
    if (drawer?.mode === 'create') {
      const at = now.toISOString();
      const fresh = applyAutoDate(
        config,
        { ...card, createdAt: at, statusChangedAt: at, history: [{ from: null, to: columnId, at }] },
        columnId,
        now,
      );
      setState((s) => insertCard(s, fresh, columnId, 0));
    } else {
      setState((s) => {
        let next = updateCard(s, card);
        const from = findColumnOf(next, card.id);
        if (from && from !== columnId) {
          next = recordStatusChange(config, moveCard(next, card.id, columnId, 0), card.id, from, columnId, now);
        }
        return next;
      });
    }
    setDrawer(null);
  };

  const remove = (id: string) => {
    setState((s) => removeCard(s, id));
    setDrawer(null);
    onToast({ message: 'karte gelöscht' });
  };

  const toggle = (columnId: string) =>
    setState((s) => ({ ...s, collapsed: { ...s.collapsed, [columnId]: !s.collapsed[columnId] } }));

  /* ---------- Drag & Drop ---------- */

  const onDragStart = ({ active }: DragStartEvent) => {
    const from = findColumnOf(state, String(active.id));
    if (!from) return;
    dragStart.current = { snapshot: state, from };
    setActiveId(String(active.id));
  };

  // Live-Verschieben zwischen sichtbaren Spalten, damit die Lücke mitwandert.
  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return;
    const id = String(active.id);
    const overId = String(over.id);
    setState((s) => {
      const from = findColumnOf(s, id);
      const to = containerOf(s, overId);
      if (!from || !to || from === to || isCollapsed(to)) return s;
      const items = s.columns[to];
      let index = items.length;
      if (!(overId in s.columns)) {
        const overIndex = items.indexOf(overId);
        const translated = active.rect.current.translated;
        const below = translated ? translated.top > over.rect.top + over.rect.height / 2 : false;
        index = overIndex >= 0 ? overIndex + (below ? 1 : 0) : items.length;
      }
      return moveCard(s, id, to, index);
    });
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const start = dragStart.current;
    dragStart.current = null;
    setActiveId(null);
    lastDragEnd.current = Date.now();
    if (!start) return;
    if (!over) {
      setState(start.snapshot);
      return;
    }
    const id = String(active.id);
    const overId = String(over.id);
    setState((s) => {
      let next = s;
      const current = findColumnOf(next, id);
      const target = containerOf(next, overId);
      if (current && target) {
        if (current !== target) {
          // z. B. Ablage auf eingeklappter Endspalte → oben einsortieren
          next = moveCard(next, id, target, 0);
        } else {
          const items = next.columns[current];
          const from = items.indexOf(id);
          const to = overId in next.columns ? items.length - 1 : items.indexOf(overId);
          if (from !== to && to >= 0) next = reorderCard(next, current, from, to);
        }
      }
      const final = findColumnOf(next, id);
      if (final && final !== start.from) next = recordStatusChange(config, next, id, start.from, final);
      return next;
    });
    const final = containerOf(state, overId);
    if (final && final !== start.from && isCollapsed(final)) {
      onToast({ message: `verschoben nach ${labelOf(final)}` });
    }
  };

  const onDragCancel = () => {
    if (dragStart.current) setState(dragStart.current.snapshot);
    dragStart.current = null;
    setActiveId(null);
  };

  const titleOf = (id: string) => (state.cards[id] ? cardTitle(config, state.cards[id]) || 'karte' : 'karte');
  const announcements: Announcements = {
    onDragStart: ({ active }) => `${titleOf(String(active.id))} aufgenommen.`,
    onDragOver: ({ active, over }) =>
      over ? `${titleOf(String(active.id))} über ${labelOf(containerOf(state, String(over.id)))}.` : 'außerhalb der spalten.',
    onDragEnd: ({ active, over }) =>
      over ? `${titleOf(String(active.id))} abgelegt in ${labelOf(containerOf(state, String(over.id)))}.` : 'abgelegt.',
    onDragCancel: ({ active }) => `verschieben von ${titleOf(String(active.id))} abgebrochen.`,
  };

  /* ---------- Rendering ---------- */

  const activeCard = activeId ? state.cards[activeId] : null;
  const drawerCard = drawer?.mode === 'create' ? drawer.card : drawer ? state.cards[drawer.id] : null;
  const drawerColumn = drawer?.mode === 'create' ? drawer.columnId : drawer ? findColumnOf(state, drawer.id) : undefined;

  return (
    <div className="board-wrap" role="tabpanel" id={`panel-${config.id}`} aria-labelledby={`tab-${config.id}`}>
      {(hasSamples || searching) && (
        <div className="notice">
          {searching ? (
            <span className="label">suche aktiv · verschieben per drag & drop pausiert</span>
          ) : (
            <>
              <span className="label">beispielkarten</span>
              <button type="button" className="text-btn" onClick={() => setState((s) => removeSamples(s))}>
                alle beispiele löschen
              </button>
            </>
          )}
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
        accessibility={{
          announcements,
          screenReaderInstructions: {
            draggable:
              'enter öffnet die karte. leertaste nimmt sie auf, pfeiltasten verschieben, leertaste oder enter legt ab, escape bricht ab.',
          },
        }}
      >
        <div className={`board ${mobile ? 'board--mobile' : 'board--desktop'}`}>
          {config.columns.map((column, i) => {
            const all = state.columns[column.id] ?? [];
            const ids = searching ? all.filter((id) => matchesQuery(config, state.cards[id], query)) : all;
            return (
              <Column
                key={column.id}
                config={config}
                column={column}
                number={i + 1}
                ids={ids}
                total={all.length}
                collapsible={isCollapsible(column.id)}
                collapsed={Boolean(state.collapsed[column.id])}
                onToggle={() => toggle(column.id)}
                onAdd={
                  column.kind === 'active'
                    ? () => setDrawer({ mode: 'create', card: createCard(config, column.id), columnId: column.id })
                    : undefined
                }
              >
                {ids.map((id) => (
                  <SortableCard
                    key={id}
                    card={state.cards[id]}
                    config={config}
                    columnId={column.id}
                    dragDisabled={searching}
                    onOpen={() => openCard(id)}
                    onSendTo={(to) => sendTo(id, to)}
                  />
                ))}
              </Column>
            );
          })}
        </div>

        <DragOverlay dropAnimation={reducedMotion ? null : { duration: 180, easing: 'cubic-bezier(0.2, 0, 0, 1)' }}>
          {activeCard ? (
            <div className="card is-overlay">
              <CardView card={activeCard} config={config} columnId={findColumnOf(state, activeCard.id) ?? ''} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {drawer && drawerCard && drawerColumn && (
        <CardDrawer
          key={drawerCard.id}
          config={config}
          mode={drawer.mode}
          card={drawerCard}
          columnId={drawerColumn}
          onSave={save}
          onDelete={remove}
          onClose={() => setDrawer(null)}
        />
      )}
    </div>
  );
}
