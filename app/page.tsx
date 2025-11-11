'use client'; // ✅ Next.js 클라이언트 사이드 렌더링 지정

// ─────────────────────────────────────────────────────────────
// ✅ 필요한 라이브러리 및 컴포넌트 임포트
// ─────────────────────────────────────────────────────────────
import { useEffect, useState, useRef } from 'react'; // React 기본 훅들
import { motion, AnimatePresence } from 'framer-motion'; // 애니메이션 구현용 라이브러리
import SceneCanvas from './components/SceneCanvas'; // 커스텀 3D 캔버스 컴포넌트

// ─────────────────────────────────────────────────────────────
// ✅ 타입 정의 (TypeScript 인터페이스)
// ─────────────────────────────────────────────────────────────
type User = { id: string; name: string }; // 사용자 데이터 구조
type FloatingMessage = {                  // TouchDesigner에서 오는 메시지 구조
  id: string;
  text: string;
  x: number;
  y: number;
};

// ─────────────────────────────────────────────────────────────
// ✅ 메인 컴포넌트 정의
// ─────────────────────────────────────────────────────────────
export default function WhatAreYou() {
  // ── 상태 정의
  const [users, setUsers] = useState<User[]>([]);               // 사용자 목록
  const [name, setName] = useState('');                         // 입력 중인 이름
  const [error, setError] = useState<string | null>(null);      // 오류 메시지
  const [floatingMessages, setFloatingMessages] = useState<FloatingMessage[]>([]); // TD에서 받은 메시지
  const wsRef = useRef<WebSocket | null>(null);                 // WebSocket 연결 참조

  // ─────────────────────────────────────────────────────────────
  // ✅ 사용자 목록 불러오기 (페이지 로드 시 1회 실행)
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const refreshed = sessionStorage.getItem('wasRefreshed'); // 세션스토리지 체크
        if (refreshed) {                                          // 새로고침 방지 로직
          setUsers([]);
          return;
        }

        const res = await fetch('/api/users');                    // 사용자 목록 요청
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();                            // JSON 파싱

        if (!Array.isArray(data)) throw new Error('Invalid response');
        setUsers(data);                                           // 목록 상태 업데이트
        sessionStorage.setItem('wasRefreshed', 'true');           // 세션 플래그 설정
      } catch (e) {
        console.error(e);
        setError('사용자 목록을 불러올 수 없습니다.');                // 오류 메시지 표시
      }
    })();
  }, []);

  // ─────────────────────────────────────────────────────────────
  // ✅ WebSocket 연결 및 TouchDesigner 메시지 수신
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:9092');              // WebSocket 연결 생성
    wsRef.current = ws;

    ws.onopen = () => {                                           // 연결 성공 시 로그
      console.log('🔗 WebSocket 연결됨');
    };

    ws.onmessage = (event) => {                                   // 메시지 수신 처리
      const text = event.data;                                    // 수신된 텍스트
      const newMsg: FloatingMessage = {                           // 메시지 객체 생성
        id: `${Date.now()}-${Math.random()}`,                     // 고유 ID 생성
        text,                                                     // 수신된 텍스트
        x: Math.random() * 80 + 10,                               // 화면 X 위치 랜덤
        y: Math.random() * 80 + 10,                               // 화면 Y 위치 랜덤
      };

      setFloatingMessages((prev) => [...prev, newMsg]);           // 상태에 추가

      // 5초 후 자동 제거
      setTimeout(() => {
        setFloatingMessages((prev) => prev.filter((m) => m.id !== newMsg.id));
      }, 5000);
    };

    ws.onerror = (err) => console.error('❌ WebSocket 오류:', err); // 오류 처리
    ws.onclose = () => console.log('🔌 WebSocket 연결 종료');         // 연결 종료 로그

    return () => ws.close();                                      // 컴포넌트 언마운트 시 종료
  }, []);

  // ─────────────────────────────────────────────────────────────
  // ✅ 마우스 좌표를 TouchDesigner로 실시간 전송
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // 연결이 열린 상태일 때만 전송
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        const data = JSON.stringify({
          type: 'mouse',
          x: e.clientX,
          y: e.clientY,
        });
        wsRef.current.send(data); // 좌표 데이터 전송
      }
    };

    // 전송 빈도를 100ms로 제한 (throttling)
    let lastSent = 0;
    const throttledMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastSent > 100) {
        handleMouseMove(e);
        lastSent = now;
      }
    };

    window.addEventListener('mousemove', throttledMouseMove); // 이벤트 등록
    return () => window.removeEventListener('mousemove', throttledMouseMove); // 정리
  }, []);

  // ─────────────────────────────────────────────────────────────
  // ✅ 사용자 추가 핸들러 (입력창 및 버튼 이벤트)
  // ─────────────────────────────────────────────────────────────
  async function handleAdd() {
    if (!name.trim()) return; // 빈 문자열 방지

    // WebSocket 연결이 되어 있으면 TD로 텍스트 전송
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const data = JSON.stringify({ type: 'text', content: name });
      wsRef.current.send(data);
    }

    // 사용자 등록 API 호출
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? '등록 실패');

      // 사용자 목록 업데이트 (최대 5개 유지)
      setUsers((prev) => {
        const updated = [...prev, data.data];
        return updated.length > 5 ? [updated[updated.length - 1]] : updated;
      });

      setName(''); // 입력창 초기화
    } catch (e) {
      console.error(e);
      setError('추가 실패'); // 오류 메시지 표시
    }
  }

  // ─────────────────────────────────────────────────────────────
  // ✅ 렌더링 영역
  // ─────────────────────────────────────────────────────────────
  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* ✅ 배경 캔버스 */}
      <SceneCanvas />

      {/* ✅ 떠다니는 메시지 출력 */}
      <AnimatePresence>
        {floatingMessages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: 1,
              scale: 1,
              x: [0, Math.random() * 40 - 20, Math.random() * 40 - 20],
              y: [0, Math.random() * 40 - 20, Math.random() * 40 - 20],
            }}
            exit={{ opacity: 0, scale: 0.3 }}
            transition={{
              duration: 5,
              x: { repeat: Infinity, duration: 3 },
              y: { repeat: Infinity, duration: 4 },
            }}
            style={{
              position: 'absolute',
              left: `${msg.x}%`,
              top: `${msg.y}%`,
              zIndex: 20,
            }}
            className="rounded-2xl px-6 py-3 bg-white/40 dark:bg-[#2a2b36]/60
                       backdrop-blur-md shadow-[4px_4px_12px_rgba(0,0,0,0.3)]
                       text-gray-800 dark:text-gray-100 font-medium
                       pointer-events-none"
          >
            {msg.text}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* ✅ 입력 및 UI 컨테이너 */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative w-full max-w-lg rounded-3xl p-10 z-10
                   backdrop-blur-xl bg-white/20 dark:bg-[#2a2b36]/50
                   border border-white/30 shadow-[8px_8px_16px_rgba(0,0,0,0.25),
                   -8px_-8px_16px_rgba(255,255,255,0.1)]"
      >
        {/* 제목 */}
        <h1 className="text-3xl font-extrabold text-center mb-8 bg-gradient-to-r 
                       from-sky-400 via-indigo-400 to-purple-400 bg-clip-text 
                       text-transparent drop-shadow-md">
          what are you!
        </h1>

        {/* 오류 메시지 출력 */}
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-rose-100 dark:bg-rose-900/40 border border-rose-400/30 
                       text-rose-700 dark:text-rose-200 rounded-xl p-3 mb-5 
                       text-center shadow-inner"
          >
            {error}
          </motion.p>
        )}

        {/* 사용자 목록 표시 */}
        <ul className="space-y-3 mb-6">
          <AnimatePresence>
            {users.map((u) => (
              <motion.li
                key={u.id}
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
                {u.name}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>

        {/* 입력 필드 및 추가 버튼 */}
        <div className="flex gap-3">
          <input
            placeholder="your thought..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
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
            onClick={handleAdd}
            className="px-5 py-2 rounded-2xl font-semibold text-gray-800 dark:text-white
                       bg-white/30 dark:bg-[#2a2b36]/50 backdrop-blur-md
                       shadow-[6px_6px_12px_rgba(0,0,0,0.3),
                               -6px_-6px_12px_rgba(255,255,255,0.3)]
                       hover:shadow-[inset_2px_2px_8px_rgba(255,255,255,0.3),
                                     inset_-2px_-2px_8px_rgba(0,0,0,0.3)]
                       transition-all duration-300"
          >
            추가
          </motion.button>
        </div>
      </motion.div>
    </main>
  );
}
