'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial } from '@react-three/drei';
import { Color, Mesh } from 'three';

interface AnimatedNumberCircleProps {
  number: string;
  color?: string;
  size?: number;
  randomSeed?: number;
}

function AnimatedSphere({ color = '#3B82F6', size = 1, randomSeed = 1 }: { color?: string; size?: number; randomSeed?: number }) {
  const meshRef = useRef<Mesh>(null);
  const materialRef = useRef<any>(null);

  // Generate random animation parameters based on seed
  const rotationSpeedY = 0.2 + (randomSeed * 0.3);
  const rotationSpeedX = 0.3 + (randomSeed * 0.4);
  const distortionSpeed = 1.5 + (randomSeed * 2);
  const distortionAmount = 0.2 + (randomSeed * 0.4);
  const phaseOffset = randomSeed * Math.PI * 2;

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime() + phaseOffset;
    
    if (materialRef.current) {
      // More consistent blob movement with multiple sine waves
      const distort1 = Math.sin(time * distortionSpeed) * 0.15;
      const distort2 = Math.cos(time * distortionSpeed * 1.3) * 0.1;
      const distort3 = Math.sin(time * distortionSpeed * 0.7) * 0.08;
      materialRef.current.distort = 0.25 + distort1 + distort2 + distort3;
    }
    
    // Slower, more fluid rotation patterns
    if (meshRef.current) {
      meshRef.current.rotation.y = time * rotationSpeedY * 0.5;
      meshRef.current.rotation.x = Math.sin(time * rotationSpeedX * 0.6) * 0.1;
      meshRef.current.rotation.z = Math.cos(time * (rotationSpeedY * 0.4)) * 0.05;
    }
  });

  return (
    <Sphere args={[size * 0.85, 64, 64]} ref={meshRef}>
      <MeshDistortMaterial
        ref={materialRef}
        color={new Color(color)}
        roughness={0.1}
        metalness={0.2}
        transparent={true}
        opacity={0.9}
        factor={0.4}
        speed={1.5}
      />
    </Sphere>
  );
}



export function AnimatedNumberCircle({ number, color = '#3B82F6', size = 1, randomSeed }: AnimatedNumberCircleProps) {
  // Generate a consistent random seed if not provided
  const seed = randomSeed || (parseInt(number) * 0.33);
  
  return (
    <div className="w-20 h-20 mx-auto relative">
      {/* Three.js animated sphere background */}
      <Canvas
        camera={{ position: [0, 0, 4], fov: 45 }}
        dpr={[1, 2]}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[3, 3, 3]} intensity={0.8} />
        <pointLight position={[-3, -3, 3]} intensity={0.4} />
        <AnimatedSphere color={color} size={size} randomSeed={seed} />
      </Canvas>
      {/* HTML number overlay */}
      <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-white pointer-events-none z-10 drop-shadow-lg">
        {number}
      </div>
    </div>
  );
} 