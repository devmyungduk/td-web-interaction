// websocket-server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { WebSocketServer } = require('ws');

// 9090: REST API 포트 (HTTP 요청용, WebSocket 아님)
// 9091: TD 전용 WebSocket 포트 (양방향)
// 9092: 브라우저 전용 WebSocket 포트 (양방향)
const REST_PORT = 9090;
const WS_PORT = 9091;
const BROWSER_WS_PORT = 9092;

// ============================================
// 브라우저 전용 WebSocket 서버 (9092 포트)
// ============================================
const browserWss = new WebSocketServer({ port: BROWSER_WS_PORT });

browserWss.on('listening', () => console.log(`✅ 브라우저 WS: ws://localhost:${BROWSER_WS_PORT}`));

browserWss.on('connection', (ws) => {
  console.log('🔗 브라우저 연결됨');
  console.log('[DEBUG] 현재 브라우저 클라이언트 수:', browserWss.clients.size);
  
  // ✅ 브라우저에서 메시지 받음 (9092 포트로 수신)
  ws.on('message', (data) => {
    const msg = data.toString();
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[브라우저→서버 수신]', msg);
    
    // ✅ TD로 전송 (9091 포트 연결된 TD에게 보냄)
    let sentToTD = 0;
    wss.clients.forEach((tdClient) => {
      if (tdClient.readyState === 1) {
        tdClient.send(msg);  // ← TD로 메시지 전송
        sentToTD++;
      }
    });
    
    console.log(`[서버→TD 전송] ${sentToTD}개 TD 클라이언트에 전송 완료`);
    console.log('[DEBUG] TD 클라이언트 총 개수:', wss.clients.size);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
  });
  
  ws.on('close', () => {
    console.log('🔌 브라우저 연결 종료');
    console.log('[DEBUG] 남은 브라우저 클라이언트 수:', browserWss.clients.size);
  });
});

// ============================================
// TD 전용 WebSocket 서버 (9091 포트)
// ============================================
const wss = new WebSocketServer({ port: WS_PORT });

wss.on('listening', () => console.log(`✅ TD WS: ws://localhost:${WS_PORT}`));

wss.on('connection', (ws) => {
  console.log('🔗 TD 연결됨');
  console.log('[DEBUG] 현재 TD 클라이언트 수:', wss.clients.size);
  
  // ✅ TD에서 메시지 받음 (9091 포트로 수신)
  ws.on('message', (data) => {
    const msg = data.toString();
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[TD→서버 수신]', msg);
    
    // ✅ 브라우저로 전송 (9092 포트 연결된 브라우저에게 보냄)
    let sentToBrowser = 0;
    browserWss.clients.forEach((browserClient) => {
      if (browserClient.readyState === 1) {
        browserClient.send(msg);  // ← 브라우저로 메시지 전송
        sentToBrowser++;
      }
    });
    
    console.log(`[서버→브라우저 전송] ${sentToBrowser}개 브라우저 클라이언트에 전송 완료`);
    console.log('[DEBUG] 브라우저 클라이언트 총 개수:', browserWss.clients.size);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
  });
  
  ws.on('close', () => {
    console.log('🔌 TD 연결 종료');
    console.log('[DEBUG] 남은 TD 클라이언트 수:', wss.clients.size);
  });
});

// ============================================
// 9090 포트: REST API (HTTP 서버)
// WebSocket이 아닌 일반 HTTP 요청 처리용
// /log 엔드포인트로 POST 요청 보내면 TD에 메시지 전달
// ============================================
const app = express();
app.use(cors());
app.use(bodyParser.json());

// GET / : 서버 상태 확인
app.get('/', (_req, res) => res.send('OK'));

// GET /clients : 연결된 클라이언트 수 확인
app.get('/clients', (_req, res) => res.json({ td: wss.clients.size, browser: browserWss.clients.size }));

// POST /log : HTTP로 메시지 받아서 TD에 전송
app.post('/log', (req, res) => {
  const msg = req.body?.message ?? '(empty)';
  console.log('[브라우저→서버]', msg);
  let sent = 0;
  wss.clients.forEach((c) => {
    if (c.readyState === 1) {
      c.send(msg);
      sent++;
    }
  });
  console.log(`[→TD] ${sent}개 전송`);
  res.sendStatus(200);
});

app.listen(REST_PORT, () => console.log(`✅ REST: http://localhost:${REST_PORT}/log`));