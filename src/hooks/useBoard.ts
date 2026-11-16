import { useEffect, useState } from 'react';
import { loadBoard, saveBoard } from '../lib/storage';
import type { BoardConfig, BoardState } from '../types';

/** Board-Zustand mit automatischer Speicherung im eigenen localStorage-Key. */
export function useBoard(config: BoardConfig) {
  const [state, setState] = useState<BoardState>(() => loadBoard(config));
  useEffect(() => {
    saveBoard(config, state);
  }, [config, state]);
  return [state, setState] as const;
}
