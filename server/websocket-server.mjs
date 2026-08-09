// TouchDesigner 와 브라우저를 중계하는 WebSocket 서버.
//
// 한 포트에 양쪽이 함께 붙고, 서버는 받은 메시지를 보낸 쪽을 제외한
// 모든 클라이언트에 그대로 전달한다. 역할 구분이 필요 없으므로
// TouchDesigner 쪽 설정도 브라우저와 같은 주소를 쓴다.

import os from 'node:os';
import { WebSocketServer } from 'ws';

const PORT = Number(process.env.WS_PORT ?? 8080);

const wss = new WebSocketServer({ port: PORT });

// 같은 공유기에 있는 휴대기기가 접속할 수 있는 주소를 찾는다.
function lanAddresses() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((net) => net && net.family === 'IPv4' && !net.internal)
    .map((net) => net.address);
}

wss.on('listening', () => {
  console.log(`WebSocket 서버: ws://localhost:${PORT}`);
  console.log('TouchDesigner 와 브라우저 모두 이 주소로 접속합니다.');
  const addresses = lanAddresses();
  if (addresses.length > 0) {
    console.log('같은 네트워크에서 접속할 주소:');
    for (const address of addresses) {
      console.log(`  ws://${address}:${PORT}   (웹 화면은 http://${address}:3000)`);
    }
  }
});

wss.on('connection', (socket) => {
  console.log(`클라이언트 접속. 현재 ${wss.clients.size}개`);

  socket.on('message', (data) => {
    const message = data.toString();
    let relayed = 0;

    for (const client of wss.clients) {
      if (client !== socket && client.readyState === 1) {
        client.send(message);
        relayed += 1;
      }
    }

    if (process.env.WS_VERBOSE === '1') {
      console.log(`중계 ${relayed}건: ${message}`);
    }
  });

  socket.on('close', () => {
    console.log(`클라이언트 종료. 남은 ${wss.clients.size}개`);
  });

  socket.on('error', (err) => {
    console.error('소켓 오류:', err.message);
  });
});

wss.on('error', (err) => {
  console.error('서버 오류:', err.message);
  process.exit(1);
});
