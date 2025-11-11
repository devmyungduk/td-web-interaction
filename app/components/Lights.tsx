'use client';

export default function Lights() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 5, 5]} intensity={1.4} color="#ffd36e" />
      <pointLight position={[-4, 3, 2]} intensity={1} color="#ff9cf9" />
      <pointLight position={[3, -3, 3]} intensity={0.9} color="#74c7ff" />
    </>
  );
}
