import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Board } from './components/Board';
import { ConfirmDialog } from './components/ConfirmDialog';
import { Header } from './components/Header';
import { Toast, type ToastData } from './components/Toast';
import { BOARD_ORDER, BOARDS } from './config/boards';
import { useBoard } from './hooks/useBoard';
import { activeCount } from './lib/board';
import { todayISODate } from './lib/date';
import { buildExport, downloadFile, parseImport } from './lib/storage';
import { applyUrlImport, clearUrlImport, parseUrlImport } from './lib/urlImport';
import type { BoardId, BoardState } from './types';

const UI_KEY = 'pipeline:ui';

function loadActiveTab(): BoardId {
  try {
    const tab = JSON.parse(localStorage.getItem(UI_KEY) ?? '{}').tab;
    return tab in BOARDS ? tab : 'jobs';
  } catch {
    return 'jobs';
  }
}

export default function App() {
  const [jobs, setJobs] = useBoard(BOARDS.jobs);
  const [freelance, setFreelance] = useBoard(BOARDS.freelance);
  const [tab, setTab] = useState<BoardId>(loadActiveTab);
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState<ToastData | null>(null);
  const [pendingImport, setPendingImport] = useState<Partial<Record<BoardId, BoardState>> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const toastId = useRef(0);

  const boards = { jobs: { state: jobs, set: setJobs }, freelance: { state: freelance, set: setFreelance } };

  const selectTab = (id: BoardId) => {
    setTab(id);
    localStorage.setItem(UI_KEY, JSON.stringify({ tab: id }));
  };

  // URL-Import: ?add=BASE64 beim ersten Laden verarbeiten
  useEffect(() => {
    const entries = parseUrlImport();
    if (entries.length === 0) return;
    const updates = applyUrlImport(entries, { jobs, freelance });
    for (const id of BOARD_ORDER) {
      const next = updates[id];
      if (next) boards[id].set(next);
    }
    clearUrlImport();
    // Tab auf das erste betroffene Board wechseln
    const firstBoard = entries[0]?.board;
    if (firstBoard) selectTab(firstBoard);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = useCallback((t: Omit<ToastData, 'id'>) => {
    toastId.current += 1;
    setToast({ ...t, id: toastId.current });
  }, []);
  const dismissToast = useCallback(() => setToast(null), []);

  const exportJson = () => {
    downloadFile(`pipeline-backup-${todayISODate()}.json`, buildExport({ jobs, freelance }));
    showToast({ message: 'backup exportiert' });
  };

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setPendingImport(parseImport(await file.text()));
    } catch (err) {
      showToast({ message: `import fehlgeschlagen: ${err instanceof Error ? err.message : 'unbekannter fehler'}` });
    }
  };

  const applyImport = () => {
    if (!pendingImport) return;
    for (const id of BOARD_ORDER) {
      const next = pendingImport[id];
      if (next) boards[id].set(next);
    }
    setPendingImport(null);
    showToast({ message: 'backup importiert' });
  };

  const importedNames = pendingImport
    ? BOARD_ORDER.filter((id) => pendingImport[id]).map((id) => BOARDS[id].label).join(' und ')
    : '';

  return (
    <div className="app">
      <Header
        boards={BOARD_ORDER.map((id) => BOARDS[id])}
        counts={{ jobs: activeCount(BOARDS.jobs, jobs), freelance: activeCount(BOARDS.freelance, freelance) }}
        active={tab}
        onSelect={selectTab}
        query={query}
        onQuery={setQuery}
        onExport={exportJson}
        onImport={() => fileRef.current?.click()}
      />

      <main className="main">
        <Board
          key={tab}
          config={BOARDS[tab]}
          state={boards[tab].state}
          setState={boards[tab].set}
          query={query}
          onToast={showToast}
        />
      </main>

      <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onFile} />

      <ConfirmDialog
        open={pendingImport !== null}
        title="daten überschreiben?"
        message={`der import ersetzt alle aktuellen karten in ${importedNames}. vorher am besten ein export als sicherung.`}
        confirmLabel="überschreiben"
        onConfirm={applyImport}
        onCancel={() => setPendingImport(null)}
      />

      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}
