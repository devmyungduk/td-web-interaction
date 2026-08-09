'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SceneCanvas from './components/SceneCanvas';
import {
  resolveWsUrl,
  STORAGE_KEY,
  MAX_ENTRIES,
  MOUSE_THROTTLE_MS,
  MESSAGE_LIFETIME_MS,
  CONNECT_TIMEOUT_MS,
} from '@/lib/config';
import { startSimulation } from '@/lib/simulator';

type Entry = { id: string; name: string };

type FloatingMessage = {
  id: string;
  text: string;
  x: number;
  y: number;
  // 떠다니는 궤적. 렌더마다 값이 바뀌면 애니메이션이 튀므로
  // 메시지를 만들 때 한 번만 계산해 둔다.
  driftX: [number, number, number];
  driftY: [number, number, number];
};

type Status = 'connecting' | 'connected' | 'simulated';

function loadEntries(): Entry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveEntries(entries: Entry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // 저장 공간이 없거나 차단된 환경에서는 화면 표시만 유지한다.
  }
}

export default function Home() {
  // 초기값을 함수로 넘겨 첫 렌더에서 한 번만 읽는다.
  // 이펙트에서 setState 를 부르면 렌더가 연쇄로 발생한다.
  const [entries, setEntries] = useState<Entry[]>(() =>
    typeof window === 'undefined' ? [] : loadEntries(),
  );
  const [name, setName] = useState('');
  const [status, setStatus] = useState<Status>('connecting');
  const [floatingMessages, setFloatingMessages] = useState<FloatingMessage[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const showMessage = useCallback((text: string) => {
    const drift = () => Math.random() * 40 - 20;
    const message: FloatingMessage = {
      id: `${Date.now()}-${Math.random()}`,
      text,
      x: Math.random() * 80 + 10,
      y: Math.random() * 80 + 10,
      driftX: [0, drift(), drift()],
      driftY: [0, drift(), drift()],
    };
    setFloatingMessages((prev) => [...prev, message]);
    setTimeout(() => {
      setFloatingMessages((prev) => prev.filter((m) => m.id !== message.id));
    }, MESSAGE_LIFETIME_MS);
  }, []);

  // WebSocket 에 연결한다. 서버가 없으면 시뮬레이션으로 전환해
  // TouchDesigner 없이도 화면 동작을 확인할 수 있게 한다.
  useEffect(() => {
    let stopSimulation: (() => void) | null = null;
    let socket: WebSocket | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const fallbackToSimulation = () => {
      if (stopSimulation) return;
      setStatus('simulated');
      stopSimulation = startSimulation(showMessage);
    };

    try {
      socket = new WebSocket(resolveWsUrl());
      wsRef.current = socket;

      // 도달할 수 없는 주소는 오류가 늦게 오거나 오지 않는다. 정해진
      // 시간이 지나면 소켓을 닫고 데모 모드로 넘어간다. 소켓을 닫아야
      // 뒤늦게 열린 연결이 상태 표시를 되돌리지 않는다.
      timer = setTimeout(() => {
        if (socket?.readyState !== WebSocket.OPEN) {
          socket?.close();
          fallbackToSimulation();
        }
      }, CONNECT_TIMEOUT_MS);

      socket.onopen = () => {
        if (timer) clearTimeout(timer);
        setStatus('connected');
      };
      socket.onmessage = (event) => showMessage(String(event.data));
      socket.onerror = fallbackToSimulation;
      socket.onclose = fallbackToSimulation;
    } catch {
      fallbackToSimulation();
    }

    return () => {
      if (timer) clearTimeout(timer);
      stopSimulation?.();
      socket?.close();
      wsRef.current = null;
    };
  }, [showMessage]);

  // 마우스 좌표를 TouchDesigner 로 보낸다.
  useEffect(() => {
    let lastSent = 0;

    const onMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastSent < MOUSE_THROTTLE_MS) return;
      lastSent = now;

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'mouse',
            x: Math.round(e.clientX),
            y: Math.round(e.clientY),
            time: new Date().toLocaleTimeString(),
          }),
        );
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, []);

  function handleSend() {
    const text = name.trim();
    if (!text) return;

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({ type: 'text', content: text, time: new Date().toLocaleTimeString() }),
      );
    }

    setEntries((prev) => {
      const next = [...prev, { id: `${Date.now()}-${Math.random()}`, name: text }].slice(-MAX_ENTRIES);
      saveEntries(next);
      return next;
    });

    setName('');
  }

  const statusLabel = {
    connecting: 'WebSocket 연결 중',
    connected: 'TouchDesigner 연결됨',
    simulated: '데모 모드 — 서버 없이 동작 중',
  }[status];

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <SceneCanvas />

      <AnimatePresence>
        {floatingMessages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: 1,
              scale: 1,
              x: msg.driftX,
              y: msg.driftY,
            }}
            exit={{ opacity: 0, scale: 0.3 }}
            transition={{
              duration: 5,
              x: { repeat: Infinity, duration: 3 },
              y: { repeat: Infinity, duration: 4 },
            }}
            style={{ position: 'absolute', left: `${msg.x}%`, top: `${msg.y}%`, zIndex: 20 }}
            className="rounded-2xl px-6 py-3 bg-white/40 dark:bg-[#2a2b36]/60
                       backdrop-blur-md shadow-[4px_4px_12px_rgba(0,0,0,0.3)]
                       text-gray-800 dark:text-gray-100 font-medium
                       pointer-events-none"
          >
            {msg.text}
          </motion.div>
        ))}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative w-full max-w-lg rounded-3xl p-10 z-10
                   backdrop-blur-xl bg-white/20 dark:bg-[#2a2b36]/50
                   border border-white/30 shadow-[8px_8px_16px_rgba(0,0,0,0.25),
                   -8px_-8px_16px_rgba(255,255,255,0.1)]"
      >
        <h1 className="text-3xl font-extrabold text-center mb-2 bg-gradient-to-r
                       from-sky-400 via-indigo-400 to-purple-400 bg-clip-text
                       text-transparent drop-shadow-md">
          what are you!
        </h1>

        <p className="text-center text-xs mb-8 text-gray-700 dark:text-gray-300">
          <span
            className={`inline-block w-2 h-2 rounded-full mr-2 align-middle ${
              status === 'connected'
                ? 'bg-emerald-400'
                : status === 'simulated'
                  ? 'bg-amber-400'
                  : 'bg-gray-400'
            }`}
          />
          {statusLabel}
        </p>

        <ul className="space-y-3 mb-6">
          <AnimatePresence>
            {entries.map((entry) => (
              <motion.li
                key={entry.id}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: 'spring', stiffness: 120 }}
                className="rounded-2xl px-4 py-3 bg-white/30 dark:bg-[#2a2b36]/50
                           shadow-[inset_2px_2px_6px_rgba(255,255,255,0.3),
                                   inset_-2px_-2px_6px_rgba(0,0,0,0.3)]
                           hover:shadow-[4px_4px_12px_rgba(255,255,255,0.4),
                                         -4px_-4px_12px_rgba(0,0,0,0.4)]
                           transition-all duration-300 backdrop-blur-sm"
              >
                {entry.name}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>

        <div className="flex gap-3">
          <input
            placeholder="send to TD"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-grow rounded-2xl px-4 py-2 text-gray-800 dark:text-gray-100
                       bg-white/30 dark:bg-[#2a2b36]/50 backdrop-blur-md
                       shadow-[inset_2px_2px_6px_rgba(255,255,255,0.3),
                               inset_-2px_-2px_6px_rgba(0,0,0,0.3)]
                       focus:shadow-[4px_4px_12px_rgba(255,255,255,0.4),
                                     -4px_-4px_12px_rgba(0,0,0,0.4)]
                       outline-none transition-all duration-300"
          />

          <motion.button
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.05 }}
            onClick={handleSend}
            className="px-5 py-2 rounded-2xl font-semibold text-gray-800 dark:text-white
                       bg-white/30 dark:bg-[#2a2b36]/50 backdrop-blur-md
                       shadow-[6px_6px_12px_rgba(0,0,0,0.3),
                               -6px_-6px_12px_rgba(255,255,255,0.3)]
                       hover:shadow-[inset_2px_2px_8px_rgba(255,255,255,0.3),
                                     inset_-2px_-2px_8px_rgba(0,0,0,0.3)]
                       transition-all duration-300"
          >
            SEND
          </motion.button>
        </div>
      </motion.div>
    </main>
  );
}
