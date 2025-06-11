'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PointLight, AmbientLight } from 'three';
import { Sparkles, OrbitControls } from '@react-three/drei';

function LightningEffects() {
  const lightRef = useRef<PointLight>(null);

  useFrame(({ clock }) => {
    if (lightRef.current) {
      // Simulate lightning flashes by rapidly changing light intensity
      const t = clock.getElapsedTime();
      const intensity = Math.sin(t * 50) * 0.5 + 0.5; // Fast flicker
      lightRef.current.intensity = Math.max(0, intensity * 5); // Boost intensity and ensure non-negative
      // Random slight position changes for more natural effect
      lightRef.current.position.set(
        Math.sin(t * 0.5) * 5,
        Math.cos(t * 0.7) * 5,
        Math.sin(t * 0.3) * 5
      );
    }
  });

  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight ref={lightRef} position={[0, 0, 0]} intensity={0.2} distance={100} decay={1} color="#ADD8E6" />
      <Sparkles count={200} size={2} scale={[20, 20, 20]} color="#ADD8E6" speed={0.5} opacity={1} />
      {/* Optional: Add OrbitControls for debugging if needed */}
      {/* <OrbitControls enableZoom={false} enablePan={false} enableRotate={true} /> */}
    </>
  );
}

export function LightningCanvas() {
  return (
    <Canvas camera={{ position: [0, 0, 10], fov: 75 }}>
      <LightningEffects />
    </Canvas>
  );
} 