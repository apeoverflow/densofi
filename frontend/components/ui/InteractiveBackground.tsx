'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import { useRef, useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';

function FloatingParticles({ color, count, speed, size }: { color: string, count: number, speed: number, size: number }) {
  const points = useRef<THREE.Points>(null);
  const { mouse } = useThree();
  
  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    return positions;
  }, [count]);

  useFrame((state) => {
    if (points.current) {
      // Much slower rotation
      points.current.rotation.x = state.clock.elapsedTime * speed * 0.02;
      points.current.rotation.y = state.clock.elapsedTime * speed * 0.03;
      
      // Subtle mouse movement response
      points.current.rotation.x += mouse.y * 0.01;
      points.current.rotation.y += mouse.x * 0.01;
    }
  });

  return (
    <Points ref={points} positions={particlesPosition} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color={color}
        size={size}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.4}
      />
    </Points>
  );
}

function CameraController() {
  const { camera, mouse } = useThree();
  
  useFrame(() => {
    // Very subtle camera movement
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, mouse.x * 0.2, 0.02);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, mouse.y * 0.2, 0.02);
    camera.lookAt(0, 0, 0);
  });
  
  return null;
}

export function InteractiveBackground() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {/* Restored gradient background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-blue-500/8 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-1/2 h-1/2 bg-purple-500/8 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 right-1/3 w-1/3 h-1/3 bg-teal-500/8 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/3 w-1/3 h-1/3 bg-pink-500/6 rounded-full blur-3xl"></div>
      </div>
      
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        style={{ background: 'transparent' }}
      >
        <CameraController />
        
        {/* Multiple particle systems with theme colors */}
        <FloatingParticles color="#3b82f6" count={800} speed={1} size={0.0095} />
        <FloatingParticles color="#8b5cf6" count={600} speed={0.8} size={0.0087} />
        <FloatingParticles color="#06b6d4" count={500} speed={1.2} size={0.003} />
        <FloatingParticles color="#ec4899" count={400} size={0.02} speed={0.06} />
        <FloatingParticles color="#10b981" count={300} size={0.015} speed={0.9} />
        
        <ambientLight intensity={0.05} />
      </Canvas>
    </div>
  );
} 