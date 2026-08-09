// 중계 서버 주소.
//
// 기본값은 접속한 호스트를 그대로 쓴다. 휴대기기에서 PC 주소로 열면
// 그 주소로 WebSocket 이 연결되므로 코드를 고칠 필요가 없다.
// 포트와 메시지 형식은 touchdesigner-web-bridge 와 동일하게 맞춰
// 어느 쪽 중계 서버를 써도 동작한다.
export function resolveWsUrl(): string {
  const configured = process.env.NEXT_PUBLIC_WS_URL;
  if (configured) return configured;

  const port = process.env.NEXT_PUBLIC_WS_PORT ?? '8080';
  if (typeof window === 'undefined') return `ws://localhost:${port}`;

  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${protocol}://${window.location.hostname}:${port}`;
}

// 화면에 유지하는 입력 기록 개수.
export const MAX_ENTRIES = 5;

// 마우스 좌표 전송 간격(ms).
export const MOUSE_THROTTLE_MS = 100;

// 떠다니는 메시지가 사라지기까지의 시간(ms).
export const MESSAGE_LIFETIME_MS = 5000;

// 입력 기록을 브라우저에 저장할 때 쓰는 키.
export const STORAGE_KEY = 'td-web-interaction:entries';
