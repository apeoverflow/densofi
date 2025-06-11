'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial } from '@react-three/drei';
import { Color, Mesh } from 'three';

interface AnimatedHeadingGlowProps {
  color?: string;
  intensity?: number;
  speed?: number;
  distortionAmount?: number;
  size?: number;
  randomSeed?: number;
}

function GlowSphere({ 
  color = '#8B5CF6', 
  intensity = 0.3, 
  speed = 1, 
  distortionAmount = 0.3,
  size = 0.5,
  randomSeed = 1 
}: AnimatedHeadingGlowProps) {
  const meshRef = useRef<Mesh>(null);
  const materialRef = useRef<any>(null);

  // Generate unique animation parameters
  const rotationSpeedY = speed * (0.2 + randomSeed * 0.3);
  const rotationSpeedX = speed * (0.15 + randomSeed * 0.25);
  const distortionSpeed = speed * (1 + randomSeed * 1.5);
  const phaseOffset = randomSeed * Math.PI * 2;

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime() + phaseOffset;
    
    if (materialRef.current) {
      // Multiple wave distortion for organic movement
      const distort1 = Math.sin(time * distortionSpeed) * distortionAmount * 0.4;
      const distort2 = Math.cos(time * distortionSpeed * 1.2) * distortionAmount * 0.3;
      const distort3 = Math.sin(time * distortionSpeed * 0.8) * distortionAmount * 0.2;
      materialRef.current.distort = 0.3 + distort1 + distort2 + distort3;
    }
    
    // Gentle rotation
    if (meshRef.current) {
      meshRef.current.rotation.y = time * rotationSpeedY;
      meshRef.current.rotation.x = Math.sin(time * rotationSpeedX) * 0.1;
      meshRef.current.rotation.z = Math.cos(time * rotationSpeedY * 0.7) * 0.05;
    }
  });

  return (
    <Sphere args={[size, 32, 32]} ref={meshRef}>
      <MeshDistortMaterial
        ref={materialRef}
        color={new Color(color)}
        roughness={0.1}
        metalness={0.1}
        transparent={true}
        opacity={intensity}
        factor={0.5}
        speed={speed}
      />
    </Sphere>
  );
}

export function AnimatedHeadingGlow({ 
  color = '#8B5CF6', 
  intensity = 0.3, 
  speed = 1, 
  distortionAmount = 0.3,
  size = 0.5,
  randomSeed = 1 
}: AnimatedHeadingGlowProps) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 2], fov: 50 }}
        dpr={[1, 2]}
        style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          width: '120%', 
          height: '120%' 
        }}
      >
        <ambientLight intensity={0.2} />
        <pointLight position={[2, 2, 2]} intensity={0.5} />
        <pointLight position={[-2, -2, 2]} intensity={0.3} />
        <GlowSphere 
          color={color}
          intensity={intensity}
          speed={speed}
          distortionAmount={distortionAmount}
          size={size}
          randomSeed={randomSeed}
        />
      </Canvas>
    </div>
  );
} 