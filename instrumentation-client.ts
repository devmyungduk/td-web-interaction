// 브라우저에서 마우스 이동을 0.5초 간격으로 수집하여
// 로그 서버(REST: http://localhost:9090/log)로 전송합니다.
// CORS 허용이 서버에 설정되어 있어야 브라우저에서 전송됩니다.

if (typeof window !== 'undefined') {
  let lastSend = 0;

  window.addEventListener('mousemove', (e) => {
    const now = Date.now();
    if (now - lastSend < 500) return; // 스로틀(0.5초)
    lastSend = now;

    const pos = { x: e.clientX, y: e.clientY };
    console.log('[MOUSE]', pos);

    // 브라우저 → 로그 서버(Express)
    fetch('http://localhost:9090/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: `[MOUSE] X:${pos.x}, Y:${pos.y}` }),
      keepalive: true,
    }).catch((err) => console.error('로그 전송 실패:', err));
  });
}
