'use client';

import { useEffect, useRef, useState } from 'react';

export type FeedStatus = 'connecting' | 'live' | 'polling' | 'unavailable';

type Options = {
  /** WebSocket URL, or null to stay idle. Changing it reconnects (the parent should also remount per symbol). */
  url: string | null;
  onMessage: (data: string) => void;
  /** Used when the socket cannot be kept open (blocked network, silent connection). Omit for stream-only feeds. */
  poll?: () => Promise<void>;
  pollMs?: number;
};

const MAX_ATTEMPTS = 3;
const SILENT_AFTER_MS = 10_000;

/**
 * Keeps a browser WebSocket open with a few reconnects. If it cannot stay live it switches to polling when a poll
 * function is given, otherwise reports "unavailable". Handlers are read through refs so re-renders never reconnect.
 */
export function useLiveFeed({ url, onMessage, poll, pollMs = 3000 }: Options): FeedStatus {
  const [status, setStatus] = useState<FeedStatus>('connecting');
  const handler = useRef(onMessage);
  const pollFn = useRef(poll);
  useEffect(() => { handler.current = onMessage; pollFn.current = poll; });

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    let socket: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let silentTimer: ReturnType<typeof setTimeout> | undefined;
    let pollTimer: ReturnType<typeof setInterval> | undefined;

    const startPolling = () => {
      if (cancelled) return;
      if (!pollFn.current) { setStatus('unavailable'); return; }
      setStatus('polling');
      const run = () => { void pollFn.current?.().catch(() => undefined); };
      run();
      pollTimer = setInterval(run, pollMs);
    };
    const fail = () => {
      clearTimeout(silentTimer);
      if (cancelled) return;
      attempts++;
      if (attempts >= MAX_ATTEMPTS) { startPolling(); return; }
      retryTimer = setTimeout(connect, 1000 * 2 ** (attempts - 1));
    };
    function connect() {
      if (cancelled) return;
      if (!url || typeof WebSocket === 'undefined') { startPolling(); return; }
      try { socket = new WebSocket(url); } catch { fail(); return; }
      // Some networks accept the connection but never deliver frames; treat that as a failure too.
      silentTimer = setTimeout(() => { socket?.close(); }, SILENT_AFTER_MS);
      socket.onmessage = event => {
        clearTimeout(silentTimer);
        attempts = 0;
        setStatus('live');
        if (typeof event.data === 'string') handler.current(event.data);
      };
      socket.onerror = () => { socket?.close(); };
      socket.onclose = () => { socket = null; fail(); };
    }
    connect();
    return () => {
      cancelled = true;
      clearTimeout(retryTimer); clearTimeout(silentTimer); clearInterval(pollTimer);
      if (socket) { socket.onclose = null; socket.onerror = null; socket.onmessage = null; socket.close(); }
    };
  }, [url, pollMs]);

  return status;
}

export function StatusDot({ status, language }: { status: FeedStatus; language: 'id' | 'en' }) {
  const id = language === 'id';
  const label = status === 'live' ? (id ? 'Live' : 'Live') : status === 'polling' ? (id ? 'Polling' : 'Polling')
    : status === 'connecting' ? (id ? 'Menyambung…' : 'Connecting…') : (id ? 'Tidak tersedia' : 'Unavailable');
  const color = status === 'live' ? 'bg-emerald-500' : status === 'polling' ? 'bg-amber-500' : status === 'connecting' ? 'bg-slate-400' : 'bg-rose-500';
  return <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
    <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${color} ${status === 'live' ? 'animate-pulse' : ''}`} />{label}
  </span>;
}
