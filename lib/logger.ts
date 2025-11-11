import { NextRequest } from 'next/server';

// 서버 사이드 로그를 콘솔에 출력하고, 별도 로그 서버로도 전송합니다.
// (서버 사이드 fetch는 CORS 제약이 없음)

async function sendToLogServer(message: string) {
  try {
    await fetch('http://localhost:9090/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
      keepalive: true,
    });
  } catch (err) {
    console.error('로그 전송 실패:', err);
  }
}

export function logRequest(req: NextRequest, msg: string) {
  const ip =
    req.headers.get('x-forwarded-for') ??
    // @ts-ignore - next 15 has req.ip optional
    (typeof req.ip === 'string' ? req.ip : 'unknown');

  const line = `[Request] ${req.method} ${req.nextUrl.pathname} — IP: ${ip} | ${msg}`;
  console.log(line);
  sendToLogServer(line);
}

export function logInfo(label: string, value: unknown) {
  const line = `[INFO] ${label} ${value !== undefined ? JSON.stringify(value) : ''}`;
  console.log(line);
  sendToLogServer(line);
}

export function logError(label: string, error: unknown) {
  const line = `[ERROR] ${label} ${error instanceof Error ? error.message : String(error)}`;
  console.error(line);
  sendToLogServer(line);
}
