// 중계 서버 주소.
//
// 기본값은 접속한 호스트를 그대로 쓴다. 휴대기기에서 PC 주소로 열면
// 그 주소로 WebSocket 이 연결되므로 코드를 고칠 필요가 없다.
export function resolveWsUrl(): string {
  const configured = process.env.NEXT_PUBLIC_WS_URL;
  if (configured) return configured;

  const port = process.env.NEXT_PUBLIC_WS_PORT ?? '8080';
  if (typeof window === 'undefined') return `ws://localhost:${port}`;

  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${protocol}://${window.location.hostname}:${port}`;
}

// 연결을 기다리는 시간(ms). 이 시간을 넘기면 데모 모드로 넘어간다.
// 도달할 수 없는 주소로 접속하면 브라우저가 TCP 시간초과까지 오류를
// 알리지 않아, 기다리지 않으면 화면이 연결 중 상태로 오래 멈춘다.
export const CONNECT_TIMEOUT_MS = 2000;

// 화면에 유지하는 입력 기록 개수.
export const MAX_ENTRIES = 5;

// 마우스 좌표 전송 간격(ms).
export const MOUSE_THROTTLE_MS = 100;

// 떠다니는 메시지가 사라지기까지의 시간(ms).
export const MESSAGE_LIFETIME_MS = 5000;

// 입력 기록을 브라우저에 저장할 때 쓰는 키.
export const STORAGE_KEY = 'td-web-interaction:entries';
