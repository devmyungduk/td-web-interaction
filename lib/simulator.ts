// TouchDesigner 와 중계 서버가 없을 때 쓰는 데모용 생성기.
//
// WebSocket 연결이 실패하면 화면이 아무 반응도 하지 않아 무엇을 만드는
// 프로젝트인지 확인할 수 없다. 이 모듈이 TouchDesigner 가 보낼 만한
// 메시지를 흉내내 배포된 데모에서도 동작을 보여준다.

const SAMPLES = [
  'audio peak 0.82',
  'noise seed 4193',
  'kinect blob 3',
  'chop level 0.47',
  'trigger pulse',
  'geo instance 128',
  'feedback 0.63',
  'osc /td/slider 0.91',
];

const INTERVAL_MS = 2200;

/**
 * 데모 메시지 송출을 시작한다.
 * @param onMessage 메시지 하나가 도착했을 때 호출된다.
 * @returns 송출을 멈추는 함수.
 */
export function startSimulation(onMessage: (text: string) => void): () => void {
  let index = Math.floor(Math.random() * SAMPLES.length);

  const emit = () => {
    onMessage(SAMPLES[index % SAMPLES.length]);
    index += 1;
  };

  emit();
  const timer = setInterval(emit, INTERVAL_MS);

  return () => clearInterval(timer);
}
